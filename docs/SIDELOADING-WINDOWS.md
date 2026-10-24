# Tankmo vom Windows-PC aufs iPhone installieren

Für deinen Anwendungsfall ist dieser Weg möglich: GitHub baut Tankmo auf einem macOS-Runner mit Xcode. Du lädst die erzeugte IPA-Datei auf deinen Windows-PC herunter. Sideloadly signiert sie mit deinem Apple Account und installiert sie auf deinem iPhone. Der Mac deines Freundes ist für diesen Ablauf nicht nötig.

**Stand der Vorbereitung:** Das Projekt und der GitHub-Workflow sind vorbereitet. Die Installation mit deinem Apple Account, die Erneuerung der Signatur und der echte iPhone-Test sind separate Schritte auf deinem PC. Der Workflow enthält keine Apple-Zugangsdaten und erzeugt eine noch nicht signierte IPA; sie lässt sich nicht einfach durch Antippen auf dem iPhone installieren.

## 1. IPA von GitHub herunterladen

1. Im Repository `femotec/tankmo` den Branch **codex/ios-app** öffnen.
2. Unter **Actions** den erfolgreichen Lauf **Tankmo iOS für Xcode prüfen** für die gewünschte Codeversion öffnen. Ein neuer Push auf diesen Branch startet einen neuen Build.
3. Unten unter **Artifacts** das Paket **Tankmo-IPA-zum-Sideloaden** herunterladen. Dafür bei GitHub anmelden.
4. Das heruntergeladene ZIP entpacken. Darin liegt **Tankmo-unsigned.ipa**.

Nur ein grüner Workflow-Lauf mit vorhandenem IPA-Artefakt bestätigt, dass die Datei gebaut wurde. Ein Commit oder eine grüne reine Web-Prüfung genügt dafür nicht. Artefakte werden 30 Tage aufbewahrt; bei Bedarf erneut bauen. Änderungen werden erst nach Installation der neuen IPA auf dem iPhone wirksam.

## 2. Sideloadly einrichten

1. Sideloadly von der [offiziellen Website sideloadly.io](https://sideloadly.io/) für Windows beziehen und installieren.
2. Die dort genannten Apple-Komponenten für Windows installieren. Der Anbieter verlangt derzeit die direkt von Apple bezogenen Desktop-Versionen von iTunes und iCloud; die konkreten Downloadlinks und die aktuelle Anleitung stehen auf seiner Website.
3. iPhone per USB anschließen, entsperren und dem Computer vertrauen.
4. Sideloadly öffnen und das iPhone als Gerät auswählen.
5. **Tankmo-unsigned.ipa** in Sideloadly ziehen, deinen eigenen Apple Account eingeben und **Start** verwenden. Apple-Anmeldung und gegebenenfalls Bestätigungen direkt in Sideloadly beziehungsweise bei Apple erledigen. Keine Passwörter, Bestätigungscodes oder Zertifikate ins öffentliche GitHub-Repository eintragen.
6. Falls erforderlich auf dem iPhone unter **Einstellungen → Allgemein → VPN und Geräteverwaltung** deinem Entwickleraccount vertrauen.
7. Unter iOS 16 oder neuer gegebenenfalls **Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** aktivieren und den Neustart bestätigen.
8. Tankmo über das App-Symbol starten.

Sideloadly ist ein zusätzliches Programm eines Drittanbieters. Die genauen Schaltflächen können sich mit seiner Version ändern. Die [offizielle FAQ](https://sideloadly.io/faq.html) beschreibt Installation, Signierung, automatische Erneuerung und Geräteerkennung. Apples Anleitung zum [Entwicklermodus](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device) erläutert die iPhone-Freigabe.

## 3. Sieben Tage und automatische Erneuerung

Ein kostenloser Apple Account signiert die App für sieben Tage. Danach lässt sie sich ohne erneute Signierung nicht mehr starten. Mit kostenloser Signierung sind höchstens drei gleichzeitig installierte entsprechende Apps erlaubt.

Sideloadly bietet eine automatische Erneuerung über seinen Hintergrunddienst. Diese Option bei der Installation einschalten. Der PC muss zum Erneuern laufen und das iPhone muss per USB oder über eingerichtetes WLAN erkannt werden. WLAN-Erneuerung setzt eine erfolgreiche Gerätekopplung voraus. Prüfe beim ersten Mal bewusst, ob die Erneuerung funktioniert; sie ist kein serverseitiger Dienst, der unabhängig von deinem PC immer läuft.

Die Automatik verlängert die Signatur der hinterlegten App. Sie lädt nicht selbstständig neue Tankmo-Quellcodeänderungen von GitHub und baut daraus keine neue Version. Siehe [Sideloadly – Erneuern und Aktualisieren](https://sideloadly.io/faq.html).

## 4. Später ein Tankmo-Update installieren

1. In Tankmo ein JSON-Backup exportieren und außerhalb der App sichern.
2. Änderungen von Windows aus auf **codex/ios-app** pushen.
3. Den neuen erfolgreichen iOS-Workflow abwarten und die neue IPA herunterladen.
4. In Sideloadly **dieselbe Apple-ID und dieselbe effektive Bundle-ID** wie bei der ersten Installation verwenden. Falls du die ID individuell geändert hast, exakt dieselbe wiederverwenden. Die automatische Erneuerung wieder aktivieren.
5. Die neue IPA über die vorhandene App installieren. **Tankmo vorher nicht löschen.**

So bleibt normalerweise das App-Datenverzeichnis bestehen. Eine andere Bundle-ID erstellt einen eigenen Speicherbereich; ein anderer Signierer kann die Aktualisierung verhindern. Das JSON-Backup ermöglicht bei Problemen die Übertragung.

Die native Version speichert bestätigte Änderungen automatisch lokal. Safari-Tankmo hat einen anderen Speicherbereich: dort zuerst **Vollständiges Backup exportieren**, dann in der nativen App **Backup wiederherstellen**. Weitere Details stehen in der [Xcode- und Speicheranleitung](IOS-XCODE.md).

Für diese Sideloading-Variante ist keine kostenpflichtige Apple-Mitgliedschaft notwendig. Die Sieben-Tage-Erneuerung und die Erreichbarkeit deines PCs bleiben die praktische Einschränkung. Die bestehende GitHub-Pages-Web-App benötigt weder Signierung noch einen Mac.
