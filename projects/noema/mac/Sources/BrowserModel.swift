import Combine
import SwiftUI
import WebKit

@MainActor
final class BrowserModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    let webView: WKWebView
    let server: StaticServer?
    @Published var canGoBack = false
    @Published var canGoForward = false
    @Published var selection: Destination? = .home
    @Published var pageTitle = "NOEMA"
    @Published var startupError: String?
    @Published var isNavigating = false
    @Published var hasLoadedOnce = false
    @Published var pageFailure: String?
    static let isSmoke = CommandLine.arguments.contains("--smoke")
    private static let destinationKey = "noema.lastDestination"

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        let console = WKUserScript(
            source: """
            window.__noemaErrors = [];
            window.addEventListener('error', function (event) {
              window.__noemaErrors.push(String(event.message || event));
            });
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        configuration.userContentController.addUserScript(console)
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.allowsBackForwardNavigationGestures = true
        view.allowsMagnification = true
        // Porcelain, matching the Storyteller field. The page rubber-band stays in the same calm.
        view.underPageBackgroundColor = NSColor(srgbRed: 247 / 255, green: 248 / 255, blue: 245 / 255, alpha: 1)
        if #available(macOS 13.3, *) {
            view.isInspectable = true
        }
        webView = view

        var started: StaticServer?
        var errorText: String?
        do {
            let root = try SiteBundle.webRoot()
            let server = StaticServer(root: root)
            try server.start()
            started = server
        } catch {
            errorText = error.localizedDescription
        }
        server = started
        super.init()
        startupError = errorText
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.configuration.userContentController.add(self, name: "noemaState")
        if server != nil {
            let opening = Self.openingDestination()
            selection = opening
            load(opening)
        }
    }

    static func openingDestination() -> Destination {
        if isSmoke { return .home }
        let raw = UserDefaults.standard.string(forKey: destinationKey) ?? ""
        return Destination(rawValue: raw) ?? .home
    }

    var chromeTitle: String {
        selection?.title ?? (pageTitle.isEmpty ? "NOEMA" : pageTitle)
    }

    func show(_ destination: Destination) {
        selection = destination
        load(destination)
    }

    func load(_ destination: Destination) {
        guard let url = url(for: destination) else { return }
        if !Self.isSmoke {
            UserDefaults.standard.set(destination.rawValue, forKey: Self.destinationKey)
        }
        // In-page links add query strings the sidebar does not. If the visible
        // document is already this destination, keep it instead of reloading
        // the canonical URL and wiping the query.
        if Destination.matching(webView.url) == destination { return }
        if sameDocument(webView.url, url) { return }
        webView.load(URLRequest(url: url))
    }

    /// Always fetches the destination again. Used when the first open failed.
    func reopen(_ destination: Destination) {
        guard let url = url(for: destination) else { return }
        pageFailure = nil
        isNavigating = true
        webView.load(URLRequest(url: url))
    }

    func back() {
        guard webView.canGoBack else { return }
        webView.goBack()
    }

    func forward() {
        guard webView.canGoForward else { return }
        webView.goForward()
    }

    func url(for destination: Destination) -> URL? {
        guard let port = server?.port else { return nil }
        var components = URLComponents()
        components.scheme = "http"
        components.host = "127.0.0.1"
        components.port = Int(port)
        components.path = destination.path
        if let id = destination.journeyID {
            components.queryItems = [URLQueryItem(name: "id", value: id)]
        }
        return components.url
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isNavigating = true
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isNavigating = false
        hasLoadedOnce = true
        pageFailure = nil
        refresh()
        restoreScroll()
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        refresh()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        noteFailure()
        refresh()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        noteFailure()
        refresh()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard !Self.isSmoke, message.name == "noemaState",
              let body = message.body as? [String: Any],
              let path = body["path"] as? String, path.hasPrefix("/site/") else { return }
        let scroll = (body["scroll"] as? NSNumber)?.doubleValue ?? (body["scroll"] as? Double) ?? 0
        UserDefaults.standard.set(scroll, forKey: "noema.scroll." + path)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if isBundled(url) || url.scheme == "about" {
            decisionHandler(.allow)
            return
        }
        if navigationAction.navigationType == .linkActivated || navigationAction.targetFrame == nil {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        guard let url = navigationAction.request.url else { return nil }
        if isBundled(url) {
            webView.load(URLRequest(url: url))
        } else {
            NSWorkspace.shared.open(url)
        }
        return nil
    }

    private func refresh() {
        canGoBack = webView.canGoBack
        canGoForward = webView.canGoForward
        if let title = webView.title, !title.isEmpty {
            pageTitle = title
        }
        // A click that already changed `selection` may still be loading.
        // Syncing from the previous document would snap the sidebar back.
        if webView.isLoading { return }
        let match = Destination.matching(webView.url)
        if selection != match {
            selection = match
        }
    }

    private func isBundled(_ url: URL) -> Bool {
        guard url.scheme == "http", url.host == "127.0.0.1" || url.host == "localhost" else { return false }
        if let port = server?.port, let urlPort = url.port, urlPort != Int(port), url.host == "127.0.0.1" {
            return false
        }
        return true
    }

    private func noteFailure() {
        isNavigating = false
        guard !hasLoadedOnce else { return }
        pageFailure = "That page did not open. The files on this Mac are unchanged."
    }

    private func restoreScroll() {
        guard !Self.isSmoke, let url = webView.url else { return }
        let path = url.path + (url.query.map { "?\($0)" } ?? "")
        guard let y = UserDefaults.standard.object(forKey: "noema.scroll." + path) as? Double, y > 40 else { return }
        let storageKey = "noema-scroll:" + path
        let script = """
        try {
          sessionStorage.setItem(\(jsString(storageKey)), "\(y)");
          if (window.noemaRestoreScroll) window.noemaRestoreScroll();
        } catch (e) {}
        """
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    private func jsString(_ value: String) -> String {
        let escaped = value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
        return "\"\(escaped)\""
    }

    private func sameDocument(_ current: URL?, _ target: URL) -> Bool {
        guard let current else { return false }
        return current.path == target.path && current.query == target.query
    }
}
