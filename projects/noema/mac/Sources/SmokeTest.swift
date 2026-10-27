import AppKit
import WebKit

@MainActor
enum SmokeTest {
    static var outputDirectory: URL? {
        let arguments = CommandLine.arguments
        guard let index = arguments.firstIndex(of: "--smoke"), index + 1 < arguments.count else { return nil }
        return URL(fileURLWithPath: arguments[index + 1], isDirectory: true)
    }

    static func run(model: BrowserModel, output: URL) async {
        try? FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        var checks: [[String: Any]] = []
        var shots: [String] = []

        await waitForWindow(model.webView)
        prepareWindow(model.webView.window)
        try? await Task.sleep(nanoseconds: 500_000_000)

        let home = await wait(model, seconds: 25, expression: homeExpression) { payload in
            text(payload, "h1").contains("Understand what humans believe")
                && !text(payload, "state").contains("Loading")
                && text(payload, "state").contains("profiles")
                && number(payload, "flags") >= 3
                && number(payload, "flagImage") > 0
        }
        checks.append(check("home", home))
        if let path = await capture(model, name: "home", output: output) { shots.append(path) }
        guard home.ok else {
            await finish(model, output: output, checks: checks, shots: shots, ok: false)
            return
        }

        _ = await eval(model, """
        (() => {
          const input = document.getElementById('homeQ');
          if (!input) return {ok:false};
          input.focus();
          input.value = 'Odin';
          input.dispatchEvent(new Event('input', {bubbles:true}));
          return {ok:true};
        })()
        """)
        let search = await wait(model, seconds: 20, expression: """
        (() => {
          const box = document.getElementById('homeResults');
          const hidden = !box || box.hidden;
          return {
            hidden: hidden,
            hits: box ? box.querySelectorAll('a').length : 0,
            text: box ? box.innerText.slice(0, 700) : ''
          };
        })()
        """) { payload in
            payload["hidden"] as? Bool == false
                && number(payload, "hits") >= 1
                && text(payload, "text").localizedCaseInsensitiveContains("Odin")
        }
        checks.append(check("home-search", search))
        if let path = await capture(model, name: "home-search", output: output) { shots.append(path) }

        _ = await eval(model, """
        (() => {
          const link = document.querySelector('.clarity-prompts a[href*="q=Odin"]');
          if (!link) return {ok:false};
          const href = link.getAttribute('href');
          link.click();
          return {ok:true, href: href};
        })()
        """)
        let explore = await wait(model, seconds: 25, expression: """
        (() => {
          const input = document.getElementById('q');
          const results = document.getElementById('results');
          const count = document.getElementById('resultCount');
          return {
            path: location.pathname,
            q: input ? input.value : '',
            cards: results ? results.querySelectorAll('a, article, .card').length : 0,
            count: count ? count.textContent : '',
            text: (results ? results.innerText : '').slice(0, 500)
          };
        })()
        """) { payload in
            text(payload, "path").hasSuffix("explore.html")
                && text(payload, "q").localizedCaseInsensitiveContains("Odin")
                && (number(payload, "cards") >= 1 || text(payload, "count").contains("match"))
                && text(payload, "text").localizedCaseInsensitiveContains("Odin")
        }
        checks.append(check("explore-chip", explore))
        if let path = await capture(model, name: "explore", output: output) { shots.append(path) }

        model.show(.witches)
        let witches = await wait(model, seconds: 25, expression: journeyExpression) { payload in
            text(payload, "question").localizedCaseInsensitiveContains("witch")
                && payload["rights"] as? Bool == true
                && number(payload, "naturalWidth") > 0
        }
        checks.append(check("witches-journey", witches))
        if let path = await capture(model, name: "witches", output: output) { shots.append(path) }

        model.show(.gods)
        let gods = await wait(model, seconds: 25, expression: journeyExpression) { payload in
            text(payload, "question").localizedCaseInsensitiveContains("deit")
                && payload["rights"] as? Bool == true
                && text(payload, "caption").localizedCaseInsensitiveContains("Zeus")
                && number(payload, "naturalWidth") > 0
        }
        checks.append(check("gods-journey", gods))
        if let path = await capture(model, name: "gods", output: output) { shots.append(path) }

        let ok = checks.allSatisfy { $0["ok"] as? Bool == true }
        await finish(model, output: output, checks: checks, shots: shots, ok: ok)
    }

    private static let homeExpression = """
    (() => {
      window.scrollTo(0, 0);
      const state = document.getElementById('homeState');
      const heading = document.querySelector('h1');
      const flags = document.querySelectorAll('.nm-flag');
      let flagImage = 0;
      flags.forEach((flag) => {
        const image = flag.querySelector('img');
        if (!image) return;
        image.loading = 'eager';
        if (image.naturalWidth > flagImage) flagImage = image.naturalWidth;
      });
      return {
        h1: heading ? heading.textContent : '',
        state: state ? state.textContent : '',
        flags: flags.length,
        flagImage: flagImage,
        title: document.title
      };
    })()
    """

    private static let journeyExpression = """
    (() => {
      const figure = document.querySelector('#journeyFigure');
      if (figure) figure.scrollIntoView({block:'center', inline:'nearest'});
      const image = figure ? figure.querySelector('img') : null;
      if (image) image.loading = 'eager';
      const caption = figure ? figure.innerText : '';
      const status = figure ? (figure.getAttribute('data-evidence-status') || '') : '';
      const question = document.getElementById('journeyQuestion');
      return {
        question: question ? question.textContent : '',
        caption: caption,
        naturalWidth: image ? image.naturalWidth : 0,
        rights: status === 'REFERENCE_ONLY_NOT_EVIDENCE' && /reference art/i.test(caption) && /not evidence/i.test(caption)
      };
    })()
    """

    private static func finish(
        _ model: BrowserModel,
        output: URL,
        checks: [[String: Any]],
        shots: [String],
        ok: Bool
    ) async {
        let errors = await eval(model, "(() => ({errors: window.__noemaErrors || []}))()")
        let report: [String: Any] = [
            "ok": ok,
            "bundleId": Bundle.main.bundleIdentifier ?? "",
            "bundlePath": publishedBundlePath(),
            "port": model.server?.port ?? 0,
            "missing": model.server?.recentMissing() ?? [],
            "checks": checks,
            "screenshots": shots,
            "pageErrors": errors["errors"] ?? []
        ]
        if let data = try? JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]) {
            try? data.write(to: output.appendingPathComponent("report.json"))
        }
        exit(ok ? 0 : 1)
    }

    /// Report paths must not include the account name. `~/Applications/NOEMA.app`
    /// is the installed location; anything else is only the bundle filename.
    private static func publishedBundlePath() -> String {
        let resolved = URL(fileURLWithPath: Bundle.main.bundlePath).resolvingSymlinksInPath().path
        let home = FileManager.default.homeDirectoryForCurrentUser.resolvingSymlinksInPath().path
        if resolved == home || resolved.hasPrefix(home + "/") {
            return "~" + String(resolved.dropFirst(home.count))
        }
        return URL(fileURLWithPath: resolved).lastPathComponent
    }

    private static func check(_ name: String, _ result: WaitResult) -> [String: Any] {
        [
            "name": name,
            "ok": result.ok,
            "detail": result.payload
        ]
    }

    private static func text(_ payload: [String: Any], _ key: String) -> String {
        payload[key] as? String ?? ""
    }

    private static func number(_ payload: [String: Any], _ key: String) -> Double {
        if let value = payload[key] as? Double { return value }
        if let value = payload[key] as? Int { return Double(value) }
        if let value = payload[key] as? NSNumber { return value.doubleValue }
        return 0
    }

    private struct WaitResult {
        var ok: Bool
        var payload: [String: Any]
    }

    private static func wait(
        _ model: BrowserModel,
        seconds: Double,
        expression: String,
        ready: ([String: Any]) -> Bool
    ) async -> WaitResult {
        let start = Date()
        var last: [String: Any] = [:]
        while Date().timeIntervalSince(start) < seconds {
            last = await eval(model, expression)
            if ready(last) { return WaitResult(ok: true, payload: last) }
            try? await Task.sleep(nanoseconds: 200_000_000)
        }
        return WaitResult(ok: false, payload: last)
    }

    private static func eval(_ model: BrowserModel, _ expression: String) async -> [String: Any] {
        let script = """
        (() => { try { return JSON.stringify((\(expression))); } catch (error) { return JSON.stringify({error: String(error)}); } })()
        """
        let value: Any? = await withCheckedContinuation { continuation in
            model.webView.evaluateJavaScript(script) { result, _ in
                continuation.resume(returning: result)
            }
        }
        guard let text = value as? String, let data = text.data(using: .utf8) else {
            return ["error": "no json", "raw": String(describing: value)]
        }
        let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        return object ?? ["error": "bad json", "raw": text]
    }

    private static func waitForWindow(_ webView: WKWebView) async {
        for _ in 0..<50 {
            if webView.window != nil { return }
            try? await Task.sleep(nanoseconds: 100_000_000)
        }
    }

    private static func prepareWindow(_ window: NSWindow?) {
        NSApp.activate()
        guard let window else { return }
        window.setContentSize(NSSize(width: 1180, height: 860))
        window.center()
        window.makeKeyAndOrderFront(nil)
    }

    private static func capture(_ model: BrowserModel, name: String, output: URL) async -> String? {
        try? await Task.sleep(nanoseconds: 350_000_000)
        let webView = model.webView
        webView.window?.displayIfNeeded()
        let webImage = await snapshot(webView)
        let frameView = webView.window?.contentView?.superview ?? webView.window?.contentView
        let cached = frameView.flatMap(cacheDisplay).flatMap { isBlank($0) ? nil : $0 }
        let screenImage = screenCapture(webView.window).flatMap { isBlank($0) ? nil : $0 }
        let composite: NSImage? = {
            guard let cached, let webImage, let frameView else { return nil }
            let image = overlay(base: cached, web: webImage, webView: webView, frame: frameView)
            return isBlank(image) ? nil : image
        }()
        // Screen recording is often unavailable. The composite is the live window
        // chrome from AppKit plus the web view's own snapshot, placed in the web view's frame.
        let chosen = screenImage ?? composite ?? webImage
        guard let chosen else { return nil }
        let url = output.appendingPathComponent("\(name).png")
        guard writePNG(chosen, to: url) else { return nil }
        return url.lastPathComponent
    }

    private static func snapshot(_ webView: WKWebView) async -> NSImage? {
        await withCheckedContinuation { continuation in
            let configuration = WKSnapshotConfiguration()
            configuration.afterScreenUpdates = true
            if webView.bounds.width > 1, webView.bounds.height > 1 {
                configuration.rect = webView.bounds
            }
            webView.takeSnapshot(with: configuration) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }

    private static func screenCapture(_ window: NSWindow?) -> NSImage? {
        guard let window, window.windowNumber > 0 else { return nil }
        let image = CGWindowListCreateImage(
            .null,
            .optionIncludingWindow,
            CGWindowID(window.windowNumber),
            [.boundsIgnoreFraming, .bestResolution]
        )
        guard let image, image.width > 80, image.height > 80 else { return nil }
        return NSImage(cgImage: image, size: window.frame.size)
    }

    private static func cacheDisplay(_ view: NSView) -> NSImage? {
        let bounds = view.bounds
        guard bounds.width > 2, bounds.height > 2,
              let rep = view.bitmapImageRepForCachingDisplay(in: bounds) else { return nil }
        view.cacheDisplay(in: bounds, to: rep)
        let image = NSImage(size: bounds.size)
        image.addRepresentation(rep)
        return image
    }

    private static func overlay(base: NSImage, web: NSImage, webView: WKWebView, frame: NSView) -> NSImage {
        // Window coordinates are bottom-left, matching NSImage drawing.
        let webInWindow = webView.convert(webView.bounds, to: nil)
        let frameInWindow = frame.convert(frame.bounds, to: nil)
        let destination = NSRect(
            x: webInWindow.minX - frameInWindow.minX,
            y: webInWindow.minY - frameInWindow.minY,
            width: webInWindow.width,
            height: webInWindow.height
        )
        let canvas = frame.bounds.size
        let image = NSImage(size: canvas)
        image.lockFocus()
        base.draw(in: NSRect(origin: .zero, size: canvas))
        web.draw(in: destination)
        image.unlockFocus()
        return image
    }

    private static func isBlank(_ image: NSImage) -> Bool {
        guard let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff) else { return true }
        let width = rep.pixelsWide
        let height = rep.pixelsHigh
        if width < 20 || height < 20 { return true }
        var seen = Set<UInt32>()
        let stepX = max(1, width / 24)
        let stepY = max(1, height / 24)
        for y in stride(from: 0, to: height, by: stepY) {
            for x in stride(from: 0, to: width, by: stepX) {
                guard let color = rep.colorAt(x: x, y: y), color.alphaComponent > 0.15 else { continue }
                let key = (UInt32(color.redComponent * 16) << 8)
                    | (UInt32(color.greenComponent * 16) << 4)
                    | UInt32(color.blueComponent * 16)
                seen.insert(key)
                if seen.count >= 6 { return false }
            }
        }
        return true
    }

    private static func writePNG(_ image: NSImage, to url: URL) -> Bool {
        guard let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff),
              let data = rep.representation(using: .png, properties: [:]) else { return false }
        do {
            try data.write(to: url)
            return true
        } catch {
            return false
        }
    }
}
