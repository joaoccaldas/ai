import SwiftUI

@main
struct NOEMAApp: App {
    @StateObject private var model = BrowserModel()

    var body: some Scene {
        Window("NOEMA", id: "noema") {
            ContentView()
                .environmentObject(model)
                .preferredColorScheme(.light)
                .frame(minWidth: 860, minHeight: 640)
        }
        .windowToolbarStyle(.unified(showsTitle: false))
        .defaultSize(width: 1180, height: 860)
        .commands {
            CommandMenu("Go") {
                Button("Home") { model.show(.home) }
                    .keyboardShortcut("1", modifiers: .command)
                Button("Explore") { model.show(.explore) }
                    .keyboardShortcut("2", modifiers: .command)
                Button("Odin") { model.show(.odin) }
                    .keyboardShortcut("3", modifiers: .command)
                Button("Witches") { model.show(.witches) }
                    .keyboardShortcut("4", modifiers: .command)
                Button("Gods") { model.show(.gods) }
                    .keyboardShortcut("5", modifiers: .command)
                Divider()
                Button("Back") { model.back() }
                    .keyboardShortcut("[", modifiers: .command)
                    .disabled(!model.canGoBack)
                Button("Forward") { model.forward() }
                    .keyboardShortcut("]", modifiers: .command)
                    .disabled(!model.canGoForward)
            }
        }
    }
}
