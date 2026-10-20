import Cocoa
import WebKit

final class StrideApp: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
  var window: NSWindow!
  var web: WKWebView!
  var config: [String: String] = [:]
  var port: Int { Int(config["port"] ?? "8864") ?? 8864 }
  var base: URL { URL(string: "http://127.0.0.1:\(port)")! }
  var dataDir: URL { URL(fileURLWithPath: config["data"] ?? NSHomeDirectory() + "/Library/Application Support/Stride") }

  func applicationDidFinishLaunching(_ notification: Notification) {
    if let url = Bundle.main.resourceURL?.appendingPathComponent("runtime.json"),
       let raw = try? Data(contentsOf: url),
       let parsed = try? JSONSerialization.jsonObject(with: raw) as? [String: String] {
      config = parsed
    }
    buildMenu()
    window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 1520, height: 940),
      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    window.title = "STRIDE — Athlete Worlds"
    window.titlebarAppearsTransparent = true
    window.titleVisibility = .hidden
    window.minSize = NSSize(width: 940, height: 640)
    window.backgroundColor = NSColor(calibratedRed: 0.027, green: 0.067, blue: 0.090, alpha: 1)
    window.isReleasedWhenClosed = false
    window.setFrameAutosaveName("StrideAthleteWorldsWindow")
    if !window.setFrameUsingName("StrideAthleteWorldsWindow") { window.center() }

    let wk = WKWebViewConfiguration()
    wk.preferences.setValue(true, forKey: "developerExtrasEnabled")
    web = WKWebView(frame: window.contentView!.bounds, configuration: wk)
    web.autoresizingMask = [.width, .height]
    web.navigationDelegate = self
    web.uiDelegate = self
    web.allowsMagnification = true
    window.contentView = web
    web.loadHTMLString(Self.splashHTML, baseURL: nil)
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
    checkServer(attempt: 0)
  }

  func checkServer(attempt: Int) {
    var req = URLRequest(url: base.appendingPathComponent("health"))
    req.timeoutInterval = 1.0
    URLSession.shared.dataTask(with: req) { body, _, _ in
      let ok = body.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }?["service"] as? String == "stride-desktop"
      DispatchQueue.main.async {
        if ok {
          self.web.load(URLRequest(url: self.base))
          return
        }
        if attempt == 0 {
          try? self.startServer()
        }
        if attempt > 35 {
          self.showError("STRIDE loopback server did not become ready at \(self.base.absoluteString).")
          return
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
          self.checkServer(attempt: attempt + 1)
        }
      }
    }.resume()
  }

  func startServer() throws {
    guard let nodeBin = config["node"], let serverScript = config["server"] else { return }
    try FileManager.default.createDirectory(at: dataDir, withIntermediateDirectories: true)
    let logURL = dataDir.appendingPathComponent("server.log")
    if !FileManager.default.fileExists(atPath: logURL.path) {
      FileManager.default.createFile(atPath: logURL.path, contents: nil)
    }
    let handle = try FileHandle(forWritingTo: logURL)
    try handle.seekToEnd()
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: nodeBin)
    proc.arguments = [serverScript, "--port", String(port)]
    if let root = config["root"] {
      proc.currentDirectoryURL = URL(fileURLWithPath: root)
    }
    proc.standardOutput = handle
    proc.standardError = handle
    try proc.run()
  }

  func showError(_ msg: String) {
    let alert = NSAlert()
    alert.messageText = "STRIDE Athlete Worlds"
    alert.informativeText = msg
    alert.runModal()
  }

  func webView(
    _ webView: WKWebView,
    runOpenPanelWith parameters: WKOpenPanelParameters,
    initiatedByFrame frame: WKFrameInfo,
    completionHandler: @escaping ([URL]?) -> Void
  ) {
    let panel = NSOpenPanel()
    panel.canChooseFiles = true
    panel.canChooseDirectories = false
    panel.allowsMultipleSelection = parameters.allowsMultipleSelection
    panel.beginSheetModal(for: window) { response in
      completionHandler(response == .OK ? panel.urls : nil)
    }
  }

  @objc func modeReplay() { web.evaluateJavaScript("document.querySelector('[data-mode=\"replay\"]')?.click()", completionHandler: nil) }
  @objc func modeCinema() { web.evaluateJavaScript("document.querySelector('[data-mode=\"cinema\"]')?.click()", completionHandler: nil) }
  @objc func modeCompare() { web.evaluateJavaScript("document.getElementById('ghostSampleBtn')?.click()", completionHandler: nil) }
  @objc func modeWorlds() { web.evaluateJavaScript("document.querySelector('[data-mode=\"worlds\"]')?.click()", completionHandler: nil) }
  @objc func modeTutorials() { web.evaluateJavaScript("document.querySelector('[data-mode=\"tutorials\"]')?.click()", completionHandler: nil) }
  @objc func themeVolcanic() { web.evaluateJavaScript("document.querySelector('[data-theme=\"volcanic\"]')?.click()", completionHandler: nil) }
  @objc func themeCanyon() { web.evaluateJavaScript("document.querySelector('[data-theme=\"canyon\"]')?.click()", completionHandler: nil) }
  @objc func themeAlpine() { web.evaluateJavaScript("document.querySelector('[data-theme=\"alpine\"]')?.click()", completionHandler: nil) }
  @objc func exportSafePng() { web.evaluateJavaScript("document.getElementById('shareBtn')?.click()", completionHandler: nil) }
  @objc func exportBundleJson() { web.evaluateJavaScript("document.getElementById('bundleBtn')?.click()", completionHandler: nil) }
  @objc func runTutorial(_ sender: NSMenuItem) {
    let step = sender.tag
    web.evaluateJavaScript("document.querySelector('[data-mode=\"tutorials\"]')?.click(); window.strideRunTutorial && window.strideRunTutorial(\(step));", completionHandler: nil)
  }
  @objc func reloadPage() { web.reload() }

  func buildMenu() {
    let main = NSMenu()
    let appItem = NSMenuItem()
    main.addItem(appItem)
    let appMenu = NSMenu()
    appMenu.addItem(withTitle: "Reload STRIDE", action: #selector(reloadPage), keyEquivalent: "r")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "Hide STRIDE", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
    appMenu.addItem(withTitle: "Quit STRIDE", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    appItem.submenu = appMenu

    let modeItem = NSMenuItem()
    main.addItem(modeItem)
    let modeMenu = NSMenu(title: "Experience")
    modeMenu.addItem(withTitle: "Replay Mode", action: #selector(modeReplay), keyEquivalent: "1")
    modeMenu.addItem(withTitle: "Cinema Drone Mode", action: #selector(modeCinema), keyEquivalent: "2")
    modeMenu.addItem(withTitle: "Ghost Compare Sample", action: #selector(modeCompare), keyEquivalent: "3")
    modeMenu.addItem(withTitle: "Worlds & Reuse Contracts", action: #selector(modeWorlds), keyEquivalent: "4")
    modeMenu.addItem(withTitle: "Interactive Tutorials & Academy", action: #selector(modeTutorials), keyEquivalent: "t")
    modeMenu.addItem(.separator())
    modeMenu.addItem(withTitle: "Preset: Lava Coast (Kona)", action: #selector(themeVolcanic), keyEquivalent: "5")
    modeMenu.addItem(withTitle: "Preset: Red Canyon (St. George)", action: #selector(themeCanyon), keyEquivalent: "6")
    modeMenu.addItem(withTitle: "Preset: Alpine Morning (Nice)", action: #selector(themeAlpine), keyEquivalent: "7")
    modeMenu.addItem(.separator())
    modeMenu.addItem(withTitle: "Export Privacy-Trimmed PNG", action: #selector(exportSafePng), keyEquivalent: "e")
    modeMenu.addItem(withTitle: "Export Redacted .stride.json Bundle", action: #selector(exportBundleJson), keyEquivalent: "s")
    modeItem.submenu = modeMenu

    let tutItem = NSMenuItem()
    main.addItem(tutItem)
    let tutMenu = NSMenu(title: "Tutorials")
    let titles = [
      "01 · Bring Your Own Route (GPX/TCX/FIT/.stride.json)",
      "02 · 3D Camera Orbit, Follow & Cinema Drone",
      "03 · Moment Atlas & Multi-Lap Transitions",
      "04 · 2D Elevation & Split Contour Scrubbing",
      "05 · Synchronized Ghost Compare",
      "06 · World Presets, Studio Props & KONA.m Bikes",
      "07 · Self-Owned Local Photo Memories in 3D",
      "08 · Privacy Redaction Pins & Story Export"
    ]
    for (idx, title) in titles.enumerated() {
      let item = NSMenuItem(title: title, action: #selector(runTutorial(_:)), keyEquivalent: "")
      item.tag = idx
      tutMenu.addItem(item)
    }
    tutItem.submenu = tutMenu

    NSApp.mainMenu = main
  }

  static let splashHTML = """
  <html><head><style>
  body{margin:0;height:100vh;display:grid;place-items:center;background:#071117;color:#e8ece6;font-family:-apple-system,system-ui,sans-serif}
  .box{text-align:center}
  p{font:700 11px/1.4 monospace;letter-spacing:.18em;color:#dbfa94;margin:14px 0 6px}
  h1{font:400 38px/1.1 Georgia,serif;margin:0}
  small{display:block;margin-top:10px;color:#93a2a7;font-size:12px}
  </style></head><body><div class="box">
  <p>STRIDE · ATHLETE WORLDS / LAB 01</p>
  <h1>Truth underneath. Wonder on top.</h1>
  <small>Starting local-first activity world engine on 127.0.0.1:8864…</small>
  </div></body></html>
  """
}

let app = NSApplication.shared
let delegate = StrideApp()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
