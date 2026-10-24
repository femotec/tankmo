import Foundation
import UIKit
import Capacitor

/// The app's durable data lives in Application Support, never in a web cache.
@objc(TankmoLocalDataPlugin)
public class TankmoLocalDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TankmoLocalDataPlugin"
    public let jsName = "TankmoLocalData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "load", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise)
    ]
    private let diskQueue = DispatchQueue(label: "com.femotec.tankmo.local-data")

    private func dataURL() throws -> URL {
        let root = try FileManager.default.url(for: .applicationSupportDirectory,
            in: .userDomainMask, appropriateFor: nil, create: true)
        let folder = root.appendingPathComponent("Tankmo", isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("data-v1.json")
    }

    @objc public func load(_ call: CAPPluginCall) {
        diskQueue.async {
            do {
                let url = try self.dataURL()
                guard FileManager.default.fileExists(atPath: url.path) else {
                    call.resolve(["json": NSNull()]); return
                }
                let data = try Data(contentsOf: url)
                guard let json = String(data: data, encoding: .utf8) else {
                    call.reject("Die lokale App-Datei kann nicht gelesen werden."); return
                }
                call.resolve(["json": json])
            } catch {
                call.reject("Der lokale App-Speicher konnte nicht gelesen werden.", nil, error)
            }
        }
    }

    @objc public func save(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let data = json.data(using: .utf8) else {
            call.reject("Die zu speichernden App-Daten fehlen."); return
        }
        diskQueue.async {
            do {
                guard let value = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      value["schemaVersion"] as? Int == 1,
                      value["fuel"] is [Any], value["odometer"] is [Any],
                      value["stations"] is [Any], value["settings"] is [String: Any] else {
                    call.reject("Das lokale Datenformat ist ungültig."); return
                }
                // Atomic replacement leaves the previous file intact on a failed write.
                // iOS protects it on disk; reading is available after the first device unlock.
                try data.write(to: self.dataURL(),
                    options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
                call.resolve()
            } catch {
                call.reject("Speichern auf diesem iPhone fehlgeschlagen. Bitte freien Speicherplatz prüfen.", nil, error)
            }
        }
    }

    @objc public func share(_ call: CAPPluginCall) {
        guard let content = call.getString("content"), let name = call.getString("name"),
              name == (name as NSString).lastPathComponent,
              ["json", "csv"].contains((name as NSString).pathExtension.lowercased()),
              let data = content.data(using: .utf8) else {
            call.reject("Die Exportdatei ist ungültig."); return
        }
        diskQueue.async {
            do {
                let folder = FileManager.default.temporaryDirectory
                    .appendingPathComponent("Tankmo-\(UUID().uuidString)", isDirectory: true)
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                let url = folder.appendingPathComponent(name)
                try data.write(to: url, options: .atomic)
                DispatchQueue.main.async {
                    guard let presenter = self.bridge?.viewController else {
                        try? FileManager.default.removeItem(at: folder)
                        call.reject("Das Teilen-Fenster konnte nicht geöffnet werden."); return
                    }
                    let activity = UIActivityViewController(activityItems: [url], applicationActivities: nil)
                    if let popover = activity.popoverPresentationController {
                        popover.sourceView = presenter.view
                        popover.sourceRect = CGRect(x: presenter.view.bounds.midX,
                            y: presenter.view.bounds.midY, width: 1, height: 1)
                        popover.permittedArrowDirections = []
                    }
                    activity.completionWithItemsHandler = { _, completed, _, error in
                        if let error = error {
                            call.reject("Die Exportdatei konnte nicht geteilt werden.", nil, error)
                        } else { call.resolve(["completed": completed]) }
                        try? FileManager.default.removeItem(at: folder)
                    }
                    presenter.present(activity, animated: true)
                }
            } catch {
                call.reject("Die Exportdatei konnte nicht erstellt werden.", nil, error)
            }
        }
    }
}
