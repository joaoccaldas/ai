import Foundation

enum Destination: String, CaseIterable, Identifiable, Hashable {
    case home
    case explore
    case odin
    case witches
    case gods

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "Home"
        case .explore: return "Explore"
        case .odin: return "Odin"
        case .witches: return "Witches"
        case .gods: return "Gods"
        }
    }

    var symbol: String {
        switch self {
        case .home: return "house"
        case .explore: return "magnifyingglass"
        case .odin: return "person"
        case .witches: return "book.closed"
        case .gods: return "building.columns"
        }
    }

    var path: String {
        switch self {
        case .home: return "/site/index.html"
        case .explore: return "/site/explore.html"
        case .odin, .witches, .gods: return "/site/journey.html"
        }
    }

    var journeyID: String? {
        switch self {
        case .odin: return "odin-seidr"
        case .witches: return "wicca-witchcraft"
        case .gods: return "gods-pantheon"
        case .home, .explore: return nil
        }
    }

    static func matching(_ url: URL?) -> Destination? {
        guard let url, url.host == "127.0.0.1" || url.host == "localhost" else { return nil }
        switch url.path {
        case "/site/index.html":
            return .home
        case "/site/explore.html":
            return .explore
        case "/site/journey.html":
            let id = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?
                .first { $0.name == "id" }?
                .value
            switch id {
            case "odin-seidr": return .odin
            case "wicca-witchcraft": return .witches
            case "gods-pantheon": return .gods
            default: return nil
            }
        default:
            return nil
        }
    }
}

enum SiteBundle {
    static func webRoot() throws -> URL {
        guard let resources = Bundle.main.resourceURL else {
            throw StaticServerError.missingRoot("The app bundle has no Resources directory.")
        }
        let root = resources.appendingPathComponent("web", isDirectory: true)
        let index = root.appendingPathComponent("site").appendingPathComponent("index.html")
        var isDirectory: ObjCBool = false
        guard FileManager.default.fileExists(atPath: index.path, isDirectory: &isDirectory), !isDirectory.boolValue else {
            throw StaticServerError.missingRoot("Bundled NOEMA site is missing (\(index.path)).")
        }
        return root
    }
}
