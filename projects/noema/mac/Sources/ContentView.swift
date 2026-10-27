import SwiftUI
import WebKit

private enum Storyteller {
    static let porcelain = Color(red: 247 / 255, green: 248 / 255, blue: 245 / 255)
    static let sand = Color(red: 240 / 255, green: 233 / 255, blue: 222 / 255)
    static let ink = Color(red: 23 / 255, green: 34 / 255, blue: 56 / 255)
    static let secondary = Color(red: 78 / 255, green: 93 / 255, blue: 115 / 255)
    static let violet = Color(red: 91 / 255, green: 72 / 255, blue: 217 / 255)
}

struct ContentView: View {
    @EnvironmentObject private var model: BrowserModel

    var body: some View {
        Group {
            if let startupError = model.startupError {
                missingShelf(startupError)
            } else {
                shell
            }
        }
        .tint(Storyteller.violet)
        .background(Storyteller.porcelain)
        .task {
            guard let directory = SmokeTest.outputDirectory else { return }
            await SmokeTest.run(model: model, output: directory)
        }
    }

    private var shell: some View {
        NavigationSplitView {
            List(selection: $model.selection) {
                Section("Begin") {
                    sidebarRow(.home)
                    sidebarRow(.explore)
                }
                Section("Chapters") {
                    sidebarRow(.odin)
                    sidebarRow(.witches)
                    sidebarRow(.gods)
                }
            }
            .listStyle(.sidebar)
            .scrollContentBackground(.hidden)
            .navigationSplitViewColumnWidth(min: 196, ideal: 228, max: 280)
            .safeAreaInset(edge: .bottom) {
                Text("A local reading. Each picture is reference art, not proof.")
                    .font(.caption)
                    .foregroundStyle(Storyteller.secondary)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Storyteller.sand)
            .navigationTitle("NOEMA")
        } detail: {
            ZStack {
                SiteWebView(webView: model.webView)
                    .background(Storyteller.porcelain)
                if let failure = model.pageFailure, !model.hasLoadedOnce {
                    statusPlate(
                        title: "This page did not open",
                        message: failure,
                        action: "Try again"
                    ) {
                        model.reopen(model.selection ?? .home)
                    }
                } else if !model.hasLoadedOnce {
                    statusPlate(
                        title: "Opening a chapter",
                        message: "The pages are the files already on this Mac.",
                        action: nil,
                        perform: {}
                    )
                }
            }
            .overlay(alignment: .top) {
                if model.isNavigating && model.hasLoadedOnce {
                    HStack(spacing: 8) {
                        Text("Opening")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Storyteller.ink)
                        Rectangle()
                            .fill(Storyteller.violet)
                            .frame(height: 2)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Storyteller.porcelain.opacity(0.94))
                    .accessibilityElement(children: .combine)
                }
            }
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
                    VStack(spacing: 0) {
                        Text("NOEMA")
                            .font(.system(size: 13, weight: .medium, design: .serif))
                            .tracking(1.6)
                            .foregroundStyle(Storyteller.ink)
                        Text(model.chromeTitle)
                            .font(.system(size: 12))
                            .foregroundStyle(Storyteller.secondary)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            .navigationTitle(model.chromeTitle)
        }
        .toolbarBackground(Storyteller.porcelain, for: .windowToolbar)
        .toolbarBackground(.visible, for: .windowToolbar)
        .onChange(of: model.selection) { _, newValue in
            guard let newValue else { return }
            model.load(newValue)
        }
    }

    private func sidebarRow(_ destination: Destination) -> some View {
        Label(destination.title, systemImage: destination.symbol)
            .tag(destination)
    }

    private func missingShelf(_ message: String) -> some View {
        statusPlate(
            title: "NOEMA could not open its shelf",
            message: message,
            action: nil,
            perform: {}
        )
    }

    private func statusPlate(title: String, message: String, action: String?, perform: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("NOEMA")
                .font(.system(size: 13, weight: .medium, design: .serif))
                .tracking(1.8)
                .foregroundStyle(Storyteller.secondary)
            Text(title)
                .font(.system(size: 32, weight: .medium, design: .serif))
                .foregroundStyle(Storyteller.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(message)
                .font(.system(size: 16))
                .foregroundStyle(Storyteller.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if let action {
                Button(action, action: perform)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.top, 8)
            }
        }
        .padding(36)
        .frame(maxWidth: 460, alignment: .leading)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .background(Storyteller.porcelain)
    }
}

struct SiteWebView: NSViewRepresentable {
    let webView: WKWebView

    func makeNSView(context: Context) -> WKWebView { webView }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
