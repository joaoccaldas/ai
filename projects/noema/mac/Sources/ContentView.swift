import SwiftUI
import WebKit

struct ContentView: View {
    @EnvironmentObject private var model: BrowserModel

    var body: some View {
        Group {
            if let startupError = model.startupError {
                ContentUnavailableView(
                    "NOEMA could not start",
                    systemImage: "exclamationmark.triangle",
                    description: Text(startupError)
                )
            } else {
                shell
            }
        }
        .task {
            guard let directory = SmokeTest.outputDirectory else { return }
            await SmokeTest.run(model: model, output: directory)
        }
    }

    private var shell: some View {
        NavigationSplitView {
            List(selection: $model.selection) {
                Section("NOEMA") {
                    sidebarRow(.home)
                    sidebarRow(.explore)
                }
                Section("Journeys") {
                    sidebarRow(.odin)
                    sidebarRow(.witches)
                    sidebarRow(.gods)
                }
            }
            .listStyle(.sidebar)
            .navigationSplitViewColumnWidth(min: 196, ideal: 220, max: 280)
            .safeAreaInset(edge: .bottom) {
                Text("Local copy of the site. Status labels stay on each record.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        } detail: {
            SiteWebView(webView: model.webView)
                .toolbar {
                    ToolbarItemGroup(placement: .navigation) {
                        Button {
                            model.back()
                        } label: {
                            Image(systemName: "chevron.backward")
                        }
                        .disabled(!model.canGoBack)
                        .help("Back")

                        Button {
                            model.forward()
                        } label: {
                            Image(systemName: "chevron.forward")
                        }
                        .disabled(!model.canGoForward)
                        .help("Forward")
                    }
                    ToolbarItem(placement: .principal) {
                        Text(model.chromeTitle)
                            .font(.headline)
                    }
                }
        }
        .navigationTitle("NOEMA")
        .onChange(of: model.selection) { _, newValue in
            guard let newValue else { return }
            model.load(newValue)
        }
    }

    private func sidebarRow(_ destination: Destination) -> some View {
        Label(destination.title, systemImage: destination.symbol)
            .tag(destination)
    }
}

struct SiteWebView: NSViewRepresentable {
    let webView: WKWebView

    func makeNSView(context: Context) -> WKWebView { webView }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
