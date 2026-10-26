import Combine
import SwiftUI
import WebKit

@MainActor
final class BrowserModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    let webView: WKWebView
    let server: StaticServer?
    @Published var canGoBack = false
    @Published var canGoForward = false
    @Published var selection: Destination? = .home
    @Published var pageTitle = "NOEMA"
    @Published var startupError: String?

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
        view.underPageBackgroundColor = NSColor(srgbRed: 0.957, green: 0.937, blue: 0.902, alpha: 1)
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
        if server != nil {
            load(.home)
        }
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
        // In-page links add query strings the sidebar does not. If the visible
        // document is already this destination, keep it instead of reloading
        // the canonical URL and wiping the query.
        if Destination.matching(webView.url) == destination { return }
        if sameDocument(webView.url, url) { return }
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

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        refresh()
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        refresh()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        refresh()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        refresh()
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

    private func sameDocument(_ current: URL?, _ target: URL) -> Bool {
        guard let current else { return false }
        return current.path == target.path && current.query == target.query
    }
}
