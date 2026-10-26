import Darwin
import Foundation

/// Loopback file server for the bundled site.
///
/// The pages load catalogs with `fetch()`. WebKit does not allow `fetch()` from
/// `file://`, and a custom URL scheme is not a reliable fetch origin. Binding
/// `127.0.0.1` keeps the same HTML, JSON, and images inside the app.
enum StaticServerError: LocalizedError {
    case missingRoot(String)
    case posix(String, Int32)

    var errorDescription: String? {
        switch self {
        case .missingRoot(let message):
            return message
        case .posix(let call, let code):
            return "\(call) failed: \(String(cString: strerror(code))) (\(code))"
        }
    }
}

final class StaticServer {
    let root: URL
    private let rootPath: String
    private var listenFD: Int32 = -1
    private(set) var port: UInt16 = 0
    private let lock = NSLock()
    private var missingPaths: [String] = []

    init(root: URL) {
        self.root = root
        self.rootPath = root.resolvingSymlinksInPath().standardizedFileURL.path
    }

    func start() throws {
        let fd = socket(AF_INET, SOCK_STREAM, 0)
        guard fd >= 0 else { throw StaticServerError.posix("socket", errno) }
        var yes: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, socklen_t(MemoryLayout<Int32>.size))
        setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &yes, socklen_t(MemoryLayout<Int32>.size))

        var address = sockaddr_in()
        address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        address.sin_family = sa_family_t(AF_INET)
        address.sin_port = 0
        address.sin_addr.s_addr = inet_addr("127.0.0.1")
        let bound = withUnsafePointer(to: &address) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { raw in
                bind(fd, raw, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }
        guard bound == 0 else {
            let code = errno
            close(fd)
            throw StaticServerError.posix("bind", code)
        }
        guard listen(fd, 128) == 0 else {
            let code = errno
            close(fd)
            throw StaticServerError.posix("listen", code)
        }

        var actual = sockaddr_in()
        var length = socklen_t(MemoryLayout<sockaddr_in>.size)
        let named = withUnsafeMutablePointer(to: &actual) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { raw in
                getsockname(fd, raw, &length)
            }
        }
        guard named == 0 else {
            let code = errno
            close(fd)
            throw StaticServerError.posix("getsockname", code)
        }

        listenFD = fd
        port = UInt16(bigEndian: actual.sin_port)
        Thread.detachNewThread { [self] in
            self.acceptLoop()
        }
    }

    func recentMissing() -> [String] {
        lock.lock()
        defer { lock.unlock() }
        return missingPaths
    }

    private func noteMissing(_ path: String) {
        lock.lock()
        missingPaths.append(path)
        if missingPaths.count > 40 {
            missingPaths.removeFirst(missingPaths.count - 40)
        }
        lock.unlock()
    }

    private func acceptLoop() {
        while true {
            let client = accept(listenFD, nil, nil)
            if client < 0 {
                if errno == EINTR { continue }
                if errno == EBADF { return }
                continue
            }
            var yes: Int32 = 1
            setsockopt(client, SOL_SOCKET, SO_NOSIGPIPE, &yes, socklen_t(MemoryLayout<Int32>.size))
            var timeout = timeval(tv_sec: 20, tv_usec: 0)
            setsockopt(client, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))
            setsockopt(client, SOL_SOCKET, SO_SNDTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))
            Thread.detachNewThread { [self] in
                self.handle(client)
                close(client)
            }
        }
    }

    private func handle(_ client: Int32) {
        guard let header = readHeaders(client) else {
            sendStatus(client, "400 Bad Request", body: "Bad request\n")
            return
        }
        let lines = header.split(separator: "\r\n", omittingEmptySubsequences: false)
        guard let request = lines.first else {
            sendStatus(client, "400 Bad Request", body: "Bad request\n")
            return
        }
        let parts = request.split(separator: " ")
        guard parts.count >= 2 else {
            sendStatus(client, "400 Bad Request", body: "Bad request\n")
            return
        }
        let method = String(parts[0])
        guard method == "GET" || method == "HEAD" else {
            sendStatus(client, "405 Method Not Allowed", body: "Method not allowed\n", extra: ["Allow": "GET, HEAD"])
            return
        }
        let target = String(parts[1])
        if target == "/__noema/health" {
            let payload: [String: Any] = ["ok": true, "missing": recentMissing()]
            let data = (try? JSONSerialization.data(withJSONObject: payload)) ?? Data("{}".utf8)
            send(client, status: "200 OK", type: "application/json; charset=utf-8", body: data, includeBody: method == "GET")
            return
        }

        switch resolve(target) {
        case .forbidden:
            sendStatus(client, "403 Forbidden", body: "Forbidden\n")
        case .notFound(let path):
            noteMissing(path)
            sendStatus(client, "404 Not Found", body: "Not in the bundled NOEMA site: \(path)\n")
        case .file(let url):
            sendFile(client, url: url, includeBody: method == "GET")
        }
    }

    private enum Resolution {
        case file(URL)
        case forbidden
        case notFound(String)
    }

    private func resolve(_ target: String) -> Resolution {
        let noFragment = target.split(separator: "#", maxSplits: 1).first.map(String.init) ?? target
        let pathOnly = noFragment.split(separator: "?", maxSplits: 1).first.map(String.init) ?? "/"
        guard pathOnly.hasPrefix("/") else { return .forbidden }
        let decoded = pathOnly.removingPercentEncoding ?? pathOnly
        if decoded.contains("\0") || decoded.contains("\\") { return .forbidden }
        let parts = decoded.split(separator: "/").map(String.init)
        if parts.contains("..") || parts.contains(".") { return .forbidden }

        var url = URL(fileURLWithPath: rootPath, isDirectory: true)
        for part in parts {
            url.appendPathComponent(part)
        }
        let full = url.resolvingSymlinksInPath().standardizedFileURL
        let fullPath = full.path
        guard fullPath == rootPath || fullPath.hasPrefix(rootPath + "/") else { return .forbidden }

        var isDirectory: ObjCBool = false
        guard FileManager.default.fileExists(atPath: fullPath, isDirectory: &isDirectory) else {
            return .notFound(decoded)
        }
        if isDirectory.boolValue {
            let index = full.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: index.path) {
                return .file(index)
            }
            return .notFound(decoded)
        }
        return .file(full)
    }

    private func sendFile(_ client: Int32, url: URL, includeBody: Bool) {
        guard let handle = try? FileHandle(forReadingFrom: url) else {
            sendStatus(client, "404 Not Found", body: "Unreadable file\n")
            return
        }
        defer { try? handle.close() }
        let length = (try? handle.seekToEnd()) ?? 0
        try? handle.seek(toOffset: 0)
        let type = Self.mime(for: url)
        let header = responseHeader(status: "200 OK", type: type, length: Int(length), extra: [:])
        guard writeAll(client, Data(header.utf8)) else { return }
        guard includeBody else { return }
        while true {
            let chunk = (try? handle.read(upToCount: 64 * 1024)) ?? Data()
            if chunk.isEmpty { break }
            if !writeAll(client, chunk) { break }
        }
    }

    private func sendStatus(_ client: Int32, _ status: String, body: String, extra: [String: String] = [:]) {
        send(client, status: status, type: "text/plain; charset=utf-8", body: Data(body.utf8), includeBody: true, extra: extra)
    }

    private func send(_ client: Int32, status: String, type: String, body: Data, includeBody: Bool, extra: [String: String] = [:]) {
        let header = responseHeader(status: status, type: type, length: body.count, extra: extra)
        guard writeAll(client, Data(header.utf8)) else { return }
        if includeBody { _ = writeAll(client, body) }
    }

    private func responseHeader(status: String, type: String, length: Int, extra: [String: String]) -> String {
        var lines = [
            "HTTP/1.1 \(status)",
            "Content-Type: \(type)",
            "Content-Length: \(length)",
            "Cache-Control: no-store",
            "Connection: close",
            "Server: NOEMA"
        ]
        for (key, value) in extra.sorted(by: { $0.key < $1.key }) {
            lines.append("\(key): \(value)")
        }
        return lines.joined(separator: "\r\n") + "\r\n\r\n"
    }

    private func readHeaders(_ fd: Int32) -> String? {
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while data.count < 65_536 {
            let count = Darwin.read(fd, &buffer, buffer.count)
            if count == 0 { break }
            if count < 0 {
                if errno == EINTR { continue }
                return nil
            }
            data.append(buffer, count: count)
            if let range = data.range(of: Data("\r\n\r\n".utf8)) {
                return String(data: data.subdata(in: 0..<range.lowerBound), encoding: .utf8)
            }
        }
        return nil
    }

    private func writeAll(_ fd: Int32, _ data: Data) -> Bool {
        data.withUnsafeBytes { raw in
            guard let base = raw.baseAddress else { return data.isEmpty }
            var sent = 0
            while sent < raw.count {
                let wrote = Darwin.write(fd, base.advanced(by: sent), raw.count - sent)
                if wrote > 0 {
                    sent += wrote
                    continue
                }
                if wrote < 0 && errno == EINTR { continue }
                return false
            }
            return true
        }
    }

    private static func mime(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "gif": return "image/gif"
        case "webp": return "image/webp"
        case "ico": return "image/x-icon"
        case "txt", "md": return "text/plain; charset=utf-8"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        default: return "application/octet-stream"
        }
    }
}
