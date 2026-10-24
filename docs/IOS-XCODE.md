# Tankmo als iPhone-App mit Xcode

Die iOS-Version enthält die komplette Tankmo-Oberfläche im App-Paket. Sie braucht beim ersten Start keine Verbindung zu GitHub Pages. Capacitor verbindet die bestehende React-Oberfläche mit einem Swift-Modul für den lokalen Speicher und den iOS-Teilen-Dialog. Es ist ein echtes iOS-App-Projekt mit Web-Oberfläche, keine SwiftUI-Neuentwicklung.

## Was du brauchst

- Einen **Mac mit Xcode 26 oder neuer**. Unter Windows lässt sich das Projekt vorbereiten, aber Xcode läuft auf macOS.
- Node.js 22 LTS, mindestens 22.12, mit npm.
- Ein iPhone mit iOS 15 oder neuer, ein Verbindungskabel und deinen Apple Account. Für das kostenlose Testen auf deinem eigenen Gerät genügt ein Personal Team in Xcode.
- Internet für Installation, Swift-Pakete und die erste Signierung. Die installierte Tankmo-App funktioniert anschließend offline.

Die Anforderungen stammen aus der [Capacitor-Umgebungseinrichtung](https://capacitorjs.com/docs/getting-started/environment-setup) und der [iOS-Dokumentation](https://capacitorjs.com/docs/ios).

## 1. Projekt auf den Mac kopieren

Das bereitgestellte ZIP auf dem Mac entpacken. Alternativ den Projektordner vollständig kopieren; `node_modules`, `.git`, `dist` und `dist-native` sind dafür nicht nötig. Persönliche JSON-Backups getrennt übertragen.

Im Terminal in den entpackten Ordner wechseln. Beispiel, wenn er unter Downloads liegt:

```bash
cd ~/Downloads/Tankmo-iOS-Xcode
npm ci
npm run ios:sync
npm run ios:open
```

`ios:sync` baut die Web-Oberfläche für die App, kopiert sie ins iOS-Projekt und aktualisiert die Swift-Pakete. `ios:open` öffnet **`ios/App/App.xcodeproj`**. Das vorhandene Projekt verwendet den Swift Package Manager; CocoaPods ist nicht erforderlich. Nicht noch einmal `cap add ios` ausführen: Das iOS-Projekt mit dem eigenen Speicher-Modul ist bereits vorhanden.

Das ZIP enthält außerdem bereits die gebauten App-Dateien. Für einen unveränderten ersten Test kannst du nach dem Entpacken direkt `ios/App/App.xcodeproj` öffnen; Xcode lädt die Swift-Abhängigkeiten selbst. Nach Änderungen am Web-Quellcode immer die obigen npm-Schritte ausführen.

## 2. Signierung in Xcode einstellen

1. Xcode einmal vollständig starten und gegebenenfalls die angeforderten Komponenten installieren. Die Swift-Paketauflösung abwarten.
2. Unter **Xcode → Settings → Accounts** mit deinem Apple Account anmelden.
3. Im linken Projektnavigator das blaue **App**-Projekt auswählen. Unter **TARGETS → App → Signing & Capabilities** wechseln.
4. **Automatically manage signing** aktivieren und bei **Team** deinen Account beziehungsweise dein **Personal Team** auswählen.
5. Die vorbereitete Bundle-ID lautet `com.femotec.tankmo`. Falls Xcode meldet, dass sie bereits vergeben ist, eine eindeutige eigene ID wählen, zum Beispiel `de.deinname.tankmo`. Dieselbe ID dann auch unter `appId` in `capacitor.config.ts` eintragen. Keine Leerzeichen oder Umlaute verwenden.

Die Bundle-ID nach der ersten Nutzung beibehalten: Eine andere ID installiert eine separate App mit eigenem Speicher. Vor einem Wechsel ein JSON-Backup exportieren.

Apple beschreibt die [Zuordnung zum Team und die automatische Signierung](https://help.apple.com/xcode/mac/current/en.lproj/dev23aab79b4.html).

## 3. Auf deinem iPhone installieren

1. iPhone per Kabel am Mac anschließen, entsperren und **Diesem Computer vertrauen** bestätigen.
2. Falls Xcode es verlangt: Auf dem iPhone **Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** aktivieren, neu starten und erneut bestätigen. Der Menüpunkt erscheint gegebenenfalls erst nach dem Koppeln mit Xcode. Bei iOS 15 ist dieser Schritt nicht vorhanden.
3. Oben in Xcode das Schema **App** und dein angeschlossenes **iPhone** als Ziel auswählen.
4. Den Startknopf **▶ Run** drücken oder **⌘R** verwenden. Xcode baut, signiert und installiert Tankmo auf deinem Gerät.
5. Falls iOS eine zusätzliche Vertrauensfreigabe für deinen Entwickleraccount verlangt, der angezeigten Anleitung folgen; sie befindet sich üblicherweise unter **Einstellungen → Allgemein → VPN und Geräteverwaltung**.

Anschließend lässt sich Tankmo über das eigene App-Symbol öffnen. Dafür musst du die Website nicht in Safari zum Home-Bildschirm hinzufügen.

Siehe Apples Anleitungen zum [Start auf einem Gerät](https://help.apple.com/xcode/mac/current/en.lproj/dev5a825a1ca.html) und zum [Entwicklermodus](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device).

**Beim kostenlosen Personal Team laufen die Bereitstellungsprofile nach sieben Tagen ab.** Dann die App mit demselben Team und derselben Bundle-ID erneut über Xcode installieren. Die App dafür nicht vorher löschen. Für eine Verteilung über TestFlight oder den App Store ist eine Mitgliedschaft im Apple Developer Program nötig. Details: [Apple – Personal Team](https://developer.apple.com/help/account/basics/about-your-developer-account).

## So werden deine Daten gespeichert

Nach **Speichern** werden Tankvorgänge, Kilometerstände, Tankstellen und Einstellungen automatisch lokal im geschützten App-Verzeichnis gespeichert: `Library/Application Support/Tankmo/data-v1.json`. Auch bestätigte Änderungen, Löschungen und Importe aktualisieren diese Datei. Ein zusätzlicher Export ist für die normale Speicherung nicht nötig. Noch nicht bestätigte Formulare sind keine gespeicherten Einträge.

Die App bestätigt den Erfolg erst, wenn der native Schreibvorgang abgeschlossen ist. Die Datei wird atomar ersetzt. Bei einem gemeldeten Schreibfehler wird der vorherige Datenstand wiederhergestellt. Beim nächsten Start wird die lokale Datei geladen; die Web-Datenbank dient innerhalb der App als Abfrage-Cache und kann daraus neu aufgebaut werden. Es gibt keinen Tankmo-Server und keine automatische Synchronisierung mit der Website oder anderen Geräten.

Gespeicherte Einträge bleiben beim Schließen, Neustarten und bei normalen App-Updates erhalten. **Das Löschen der App entfernt auch deren lokale Daten.** Deshalb regelmäßig unter **Einstellungen → Vollständiges Backup exportieren** ein JSON-Backup erzeugen und im iOS-Teilen-Menü **In Dateien sichern** auswählen. Nur das bewusst gewählte Exportziel erhält diese Datei. Automatische iCloud-Synchronisierung ist nicht eingerichtet; eine mögliche Gerätesicherung hängt von deinen iOS-Einstellungen ab.

## Vorhandene Daten von der Website übernehmen

Safari-/Home-Screen-Tankmo und die Xcode-App besitzen getrennte Speicherbereiche.

1. Die bisher benutzte Tankmo-Version öffnen.
2. In **Einstellungen → Vollständiges Backup exportieren** eine JSON-Datei sichern.
3. Die neu installierte iPhone-App öffnen.
4. In **Einstellungen → Backup wiederherstellen** diese JSON-Datei auswählen, die Vorschau prüfen und den Import bestätigen. Bei einer leeren App ist **Ersetzen** geeignet.
5. Anzahl, Beträge und Notizen kontrollieren. Die importierten Daten werden ebenfalls automatisch lokal gespeichert.

## Spätere Änderungen installieren

```bash
npm ci
npm run ios:sync
npm run ios:open
```

Danach wieder das gleiche Team, die gleiche Bundle-ID und das iPhone auswählen und **⌘R** drücken. Die App vorher nicht deinstallieren. Vor größeren Änderungen ein JSON-Backup außerhalb der App aufbewahren.

Eine Änderung auf GitHub Pages verändert die installierte native App nicht. Deren neue Oberfläche muss mit Xcode neu gebaut werden.

### Wenn du nur den Mac eines Freundes ausleihst

Du kannst den Quellcode anschließend von Windows aus bearbeiten und auf GitHub pushen. Eine installierbare native Aktualisierung braucht trotzdem einen neuen Xcode-Build und eine gültige Apple-Signatur. Mit dem kostenlosen Personal Team musst du wegen der sieben Tage auch ohne Codeänderung regelmäßig neu signieren. Ein einmaliger Besuch am Mac reicht dafür nicht dauerhaft.

Für unabhängige Updates kann ein macOS-Cloud-Runner den Build und die Signierung übernehmen. Dafür sind eine gesonderte Einrichtung mit deinem eigenen Apple-Entwicklerkonto, Signierzertifikaten, Bereitstellungsprofilen und einer Verteilungsmethode nötig. [GitHub beschreibt das Signieren auf macOS-Runnern](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications). Zugangsdaten und Signierschlüssel gehören ausschließlich in dafür vorgesehene Secrets, niemals in den öffentlichen Quellcode.

TestFlight ist eine mögliche Verteilung über das Apple Developer Program. Neue Builds können darüber auch automatisch auf dem iPhone installiert werden; jeder TestFlight-Build ist auf bis zu 90 Tage begrenzt. Siehe [Apple TestFlight](https://testflight.apple.com/). Der mitgelieferte GitHub-Workflow prüft nur einen **nicht signierten Build**; er verteilt noch keine Updates auf dein iPhone. Melde dich auf dem geliehenen Mac mit deinem eigenen Apple Account an und sichere deinen Quellcode sowie Backups unabhängig davon.

## Prüfen und Fehler beheben

- **Node/npm fehlt:** Node.js 22 LTS oder neuer installieren, danach ein neues Terminal öffnen.
- **Leere oder alte Oberfläche:** Im richtigen Projektordner `npm run ios:sync` ausführen und danach in Xcode erneut bauen.
- **Swift-Pakete laden nicht:** Internet prüfen; in Xcode **File → Packages → Resolve Package Versions** verwenden.
- **Signing-Fehler:** Team und eindeutige Bundle-ID prüfen. Apple-Account-Anmeldungen und angeforderte Bedingungen direkt bei Apple abschließen.
- **iPhone fehlt als Ziel:** Kabel, Entsperrung und Vertrauen prüfen und Xcodes Gerätevorbereitung abwarten. Gegebenenfalls ist ein neueres Xcode mit Unterstützung für deine iOS-Version nötig.
- **Speichern fehlgeschlagen:** Die Meldung beachten, freien iPhone-Speicher prüfen und erneut speichern. Die App nicht löschen, um einen Speicherfehler zu beheben.

Zum Testen einen Tankvorgang speichern, die App vollständig schließen und erneut öffnen. Danach Flugmodus aktivieren, einen weiteren Eintrag speichern und das iPhone neu starten. Beide Einträge und ihre exakten Beträge sollten vorhanden sein. Zusätzlich JSON-Export, Import und den Dateien-Dialog auf dem tatsächlichen Gerät prüfen.

Die automatischen Tests prüfen Berechnungen und Datenübertragung sowie native Speicherabläufe mit nachgebildeter Swift-Schnittstelle: Wiederherstellung bei verlorenem Web-Cache, parallele Änderungen, Speicherfehler, Wiederholungen und Löschungen. `npm run ios:check` prüft die gebündelten Dateien und verhindert eine versehentliche Abhängigkeit von einer entfernten Website. Der Workflow `.github/workflows/ios-check.yml` kann zusätzlich auf einem macOS-Runner einen nicht signierten Xcode-Build prüfen. Die persönliche Signierung und der echte iPhone-Test erfolgen auf deinem Mac.
