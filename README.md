# Tankmo

**Installation mit Windows:** [IPA auf GitHub bauen und mit Sideloadly installieren](docs/SIDELOADING-WINDOWS.md). Dafür ist kein eigener Mac nötig; kostenlose Apple-Signaturen müssen regelmäßig erneuert werden.

**Neu: iPhone-App für Xcode.** Das Projekt enthält jetzt eine Capacitor-iOS-Version mit gebündelter Offline-Oberfläche und automatischer Speicherung in einer lokalen App-Datei. Die vollständige [Mac-/Xcode-Anleitung](docs/IOS-XCODE.md) erklärt Installation, Signierung und Datenübernahme. Auf dem Mac: `npm ci`, `npm run ios:sync`, `npm run ios:open`.

**Live-App:** [Tankmo auf dem iPhone öffnen](https://femotec.github.io/tankmo/) · [GitHub-Repository](https://github.com/femotec/tankmo)

Die App ist über HTTPS veröffentlicht. Zum Installieren die Live-Adresse in Safari öffnen und im Teilen-Menü „Zum Home-Bildschirm“ wählen.

Privates, offlinefähiges Tankbuch als React-/TypeScript-PWA für das iPhone. Deutsche Oberfläche, EUR, Liter und Kilometer. Ohne Konto, Backend, Telemetrie, Werbung oder externe Laufzeitdienste. Das Design ist eine eigenständige Web-Interpretation von Liquid Glass, keine native SwiftUI-Oberfläche.

## Unter Windows starten

Node.js 22 LTS (mindestens 22.12) mit npm installieren. Im Projektordner:

```powershell
npm install
npm run dev
```

Die ausgegebene lokale URL am Computer öffnen. Für einen reproduzierbaren Build mit dem vorhandenen `package-lock.json` stattdessen `npm ci` verwenden.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Die Vorschau verwendet die gebauten Dateien aus `dist/`. Der Service Worker ist nur im Produktionsbuild aktiv. Änderungen am Quellcode erfordern für Offline-Tests einen neuen Build. Kein Mac, Xcode, iOS-Simulator oder App-Store-Konto erforderlich.

## GitHub Pages bereitstellen

1. Ein GitHub-Repository anlegen (für die kostenlose persönliche Pages-Nutzung ein öffentliches Repository verwenden). Beispielsweise `tankmo`. Quellcode einschließlich Lockfile auf den Branch `main` hochladen. Keine persönlichen Exporte oder Backups hochladen.
2. Im Repository **Settings → Pages → Build and deployment → Source: GitHub Actions** wählen.
3. Der mitgelieferte Workflow `.github/workflows/deploy.yml` prüft TypeScript, Lint und Unit-Tests und baut die App. Unter **Actions** den Workflow bei Bedarf manuell mit **Run workflow** starten.
4. Nach erfolgreichem Deployment lautet die URL üblicherweise `https://DEIN-NAME.github.io/tankmo/`. Die genaue URL steht im Workflow-Ergebnis und unter Pages.
5. Updates auf `main` pushen. Nach dem Deployment Tankmo online öffnen. Sobald „Eine neue Tankmo-Version ist bereit“ erscheint, ungespeicherte Formulare abschließen und **Jetzt aktualisieren** wählen. Die Datenbank wird durch App-Updates nicht gelöscht.

Der Workflow liest den Basispfad automatisch aus der GitHub-Pages-Konfiguration und setzt `VITE_BASE_PATH` entsprechend. Projekt-Unterordner, ein Repository namens `DEIN-NAME.github.io` und eine eigene Domain am Domain-Stamm werden damit berücksichtigt. Alle öffentlichen App-Assets und der Service Worker verwenden denselben Basispfad. Die App verwendet keine serverseitigen Routen und braucht keinen SPA-Rewrite.

Alternativ das gebaute `dist/` auf einen HTTPS-Static-Host hochladen. Für eine Bereitstellung am Domain-Stamm:

```powershell
$env:VITE_BASE_PATH = '/'
npm run build
```

Für einen Unterordner:

```powershell
$env:VITE_BASE_PATH = '/tankmo/'
npm run build
```

Der Basispfad muss mit `/` anfangen und enden. HTTPS ist für Installation und Service Worker normalerweise erforderlich; `localhost` ist eine Entwicklungs-Ausnahme. Der Hosting-Anbieter liefert nur die App-Dateien. Tankdaten bleiben im lokalen IndexedDB-Speicher des iPhones. Ein Wechsel von Domain, Protokoll oder Port erzeugt einen anderen Speicherbereich: vorher Backup exportieren, danach importieren. Auch Safari und eine Home-Screen-App können getrennte Speicher-Kontexte besitzen; Daten bei Bedarf per Backup übertragen.

## Auf dem iPhone installieren

1. Die bereitgestellte HTTPS-Adresse in **Safari** öffnen.
2. Das **Teilen**-Menü öffnen.
3. **Zum Home-Bildschirm** auswählen.
4. **Als Web-App öffnen** einschalten, falls angeboten.
5. **Hinzufügen** antippen.
6. Tankmo über das neue Symbol auf dem Home-Bildschirm starten.

Einmal vollständig online laden, bevor die App offline verwendet wird. In Einstellungen wird die Bereitschaft des Offline-Caches angezeigt. Keine IPA-Datei, App-Store-Prüfung oder Sideloading erforderlich. Die Oberfläche berücksichtigt Safe Areas, Drehung, dynamische Viewports und die Bildschirmtastatur; tatsächliches Verhalten auf einem iPhone muss auf dem Gerät geprüft werden.

## Funktionen

- Dashboard mit Gesamtausgaben, laufendem Monat, Vormonatsvergleich, gewichtetem Literpreis und gültigem Verbrauch.
- Tankbuch mit allen vier Sortierungen, Kraftstoff- und Tankstellenfilter, Detailansicht, Bearbeiten und bestätigtem Löschen.
- Tankformulare mit lokaler Datums-/Zeitvorgabe, deutschem Dezimalkomma, sofort berechnetem Literpreis, Volltankstatus, Kilometerstand und Notizen. Mengen bis drei und Kosten bis zwei Nachkommastellen; ungewöhnliche Werte können nach Hinweis gespeichert werden.
- Unabhängige Kilometerstände mit Bearbeiten/Löschen; gemeinsame, chronologische Beobachtungsliste aus beiden Quellen. Widersprüche werden markiert.
- Jahres-/Monatsauswertung einschließlich Nullmonaten, Monatsvergleich, Preisverlauf auf echter Zeitachse, fünf Zeitfilter, Kraftstoff- und Tankstellenanalysen, Verbrauchsverlauf und Kosten je 100 km. Diagrammwerte sind auch als Text zugänglich.
- Gespeicherte Tankstellen, Standardkraftstoff, automatische/helle/dunkle Darstellung, CSV, portable JSON-Sicherungen, Importvorschau und Konfliktentscheidungen.
- Leere Datenbank beim ersten Start. Alle Werte entstehen ausschließlich aus eigenen Einträgen.

## Verbrauch richtig erfassen

Mindestens zwei **bestätigte Volltank-Einträge mit Kilometerstand** anlegen. Alle Teilbetankungen dazwischen erfassen. Die Startfüllung zählt nicht; jede folgende Füllung bis einschließlich der abschließenden Vollfüllung zählt. Beispiel: 50.000 → 50.600 km, dazwischen 15 L + 21 L = 6,0 L/100 km. Die Kosten derselben Füllungen werden für €/100 km verwendet. Über mehrere Intervalle wird nach zurückgelegter Strecke gewichtet.

Gleiche Tankzeitpunkte, nichtpositive Strecken, fehlende Anker-Kilometerstände, widersprüchliche Zwischenstände und bekannte Datenlücken verhindern die Berechnung. Ein bestätigter Volltank ohne Kilometerstand unterbricht die Ankerkette. Manuelle Kilometerstände prüfen die Plausibilität, erzeugen aber keine Verbrauchswerte. Vollständige Tankaufzeichnungen sind eine notwendige Annahme; eine unbekannte ausgelassene Füllung kann die Software nicht erkennen.

Fehlt ein Tankvorgang, beim nachfolgenden Eintrag **Seit dem letzten Eintrag fehlt ein Tankvorgang** markieren. Beim Löschen wird der folgende Tankvorgang vorsichtshalber so markiert. Nach vollständiger Korrektur der Aufzeichnung kann die Markierung bewusst entfernt werden. Beim Verschieben historischer Einträge Datum und Kilometer-Reihenfolge prüfen.

## Backup exportieren und wiederherstellen

1. **Einstellungen → Vollständiges Backup exportieren**.
2. Im iOS-Teilen-Dialog **In Dateien sichern** und beispielsweise **iCloud Drive** wählen. Falls Dateifreigabe nicht verfügbar ist, wird ein Download angeboten.
3. Die JSON-Datei unabhängig aufbewahren. „Letzter Backup-Export“ bestätigt das Bereitstellen, nicht die dauerhafte Speicherung am Ziel.
4. Zum Wiederherstellen **Backup wiederherstellen** wählen und die Datei auswählen.
5. Vorschau, UUID-Dubletten und abweichende Datensätze prüfen.
6. Importverfahren wählen: vorhandene UUIDs **überspringen**, ausdrücklich **überschreiben** oder alle lokalen Daten **ersetzen**. Nur Ersetzen übernimmt die gesicherten Einstellungen. Ersetzen erfordert eine zusätzliche Bestätigung.
7. **Import bestätigen**. Validierung und Schreibvorgang sind transaktional; Ziel-IDs und bei Ersetzen auch Datensatzanzahlen werden vor Abschluss verifiziert. Das Ergebnis meldet importierte und übersprungene Datensätze.

Das ist ein **manuelles Backup, keine automatische iCloud-Synchronisierung**. Browserdaten können durch Löschen, Speicherknappheit oder das Betriebssystem verloren gehen. `navigator.storage.persist()` wird angefragt, soweit unterstützt; eine Ablehnung verhindert die Nutzung nicht. Das letzte Exportdatum und Hinweise erinnern unaufdringlich an die Sicherung. Backups enthalten private Notizen und sind nicht verschlüsselt.

## CSV- und Backup-Format

`tankmo-csv-1` ist ein dokumentiertes Austauschformat mit UTF-8-BOM, Semikolon als Trenner und RFC-kompatibler CSV-Quotierung. Es hat exakt die Spalten:

```text
format;entity;id;data
```

`format` ist `tankmo-csv-1`. `entity` ist `fuel`, `odometer`, `stations` oder `settings`. `id` enthält die unveränderte UUID bzw. `main` für Einstellungen. `data` enthält den vollständigen Datensatz als JSON in einer korrekt CSV-quotierten Zelle. Dadurch bleiben Umlaute, Trennzeichen, Anführungszeichen, Zeilenumbrüche, fehlende optionale Felder und Booleans ohne Informationsverlust erhalten. Der Export eignet sich für Tankmo-Rundreisen; CSV-Dateien anderer Anbieter benötigen eine Konvertierung in dieses Format.

Fuel-Datensätze enthalten `id`, `date`, `fuelType` (`superE5`, `superE10`, `superPlus`), `liters` (kanonische Dezimalzeichenfolge mit drei Stellen), `totalCost` (EUR, exakt zwei Stellen), optional `odometer`, `isFullTank`, `stationId`, `note`, `dataGap` sowie `createdAt` und `updatedAt`. Der Literpreis wird immer abgeleitet. ISO-Zeitpunkte werden beim Import auf UTC normalisiert und lokal dargestellt. Kilometerstände sind sichere, nichtnegative Ganzzahlen. JSON-Backup: `schemaVersion: 1`, `appVersion`, `createdAt`, `fuel`, `odometer`, `stations`, `settings`.

Gleiche UUIDs werden beim Zusammenführen standardmäßig übersprungen und nie still überschrieben. Doppelte UUIDs innerhalb einer Datei und fehlende Tankstellenreferenzen werden abgewiesen. Gelöschte Tankstellen werden archiviert (`deleted: true`), damit Name und Beziehungen historischer Tankvorgänge erhalten bleiben.

## Architektur

```text
src/
  app/App.tsx               App-Shell, Navigation, Dialoge, Update-Hinweis
  components/ui.tsx         Karten, leere Zustände, modale Sheets
  db/database.ts            Versionierte Dexie-Datenbank, sichere Löschvorgänge
  models/types.ts           Domänenmodelle und stabile Bezeichner
  features/                 Dashboard, Formulare, Tankbuch, Statistiken,
                            Kilometerstände, Einstellungen
  services/                 Statistik, Verbrauch, CSV/Backup/Import
  utils/                    Dezimal-/Datumsformatierung, Zod-Validierung
  styles/                   Design-Tokens, responsive Glass-Oberflächen
  tests/                    Berechnungs-, Import- und IndexedDB-Tests
e2e/                        Mobile Browser- und Offline-Tests
public/icons/               PNG-Icons inkl. Apple Touch und Maskable
scripts/icons.mjs           Reproduzierbare Rastericons aus Original-SVG
.github/workflows/          Prüfung und GitHub-Pages-Deployment
```

Dexie-Schema 1 enthält Tabellen für Tankvorgänge, Kilometerstände, Tankstellen und Einstellungen mit geeigneten Indizes. Noch ist keine Migration erforderlich: dies ist die erste Version. Jede zukünftige Schemaänderung muss als neue explizite `version(n).stores(...).upgrade(...)`-Migration ergänzt und gegen einen Datenbestand der Vorversion getestet werden. Datenbanknamen und Primärschlüssel nicht ohne Migrations-/Backup-Konzept ändern.

Geldsummen, Mengen, Preise und Verbrauch werden mit `decimal.js` berechnet. Nur die Darstellung und Diagrammkoordinaten verwenden gerundete JavaScript-Zahlen. Exporte behalten die exakten gespeicherten Dezimalzeichenfolgen. Reactive Queries aktualisieren die Ansichten nach CRUD und Import.

## Tests und manuelle Geräteprüfung

```powershell
npm test
npm run test:e2e
```

Die Browserkonfiguration verwendet Chrome unter Windows. Für andere Installationen `CHROME_PATH` setzen. Unter Linux beispielsweise nach `npx playwright install chromium` die Konfiguration auf den Playwright-Chromium-Browser umstellen. Die Tests starten automatisch die Produktionsvorschau; vorher `npm run build` ausführen.

Automatische Tests prüfen exakte Preise, Kalendergrenzen, Sortierungen, Verbrauchsintervalle, CSV-/Backup-Rundreisen, Konfliktverfahren, IndexedDB-CRUD, UI und Offline-Neuladen im mobilen Chromium-Profil. Chromium mit iPhone-Viewport ist kein echtes iOS Safari.

Auf dem eigenen iPhone noch prüfen: Installation in Safari, Home-Screen-Start ohne Browserleiste, Teilen nach „Dateien“, Light/Dark Mode, Tastatur und Drehung. Für den Offline-Gerätetest: einmal online vollständig laden, Flugmodus einschalten, App schließen und erneut öffnen, tanken, Statistiken öffnen, Eintrag bearbeiten und anschließend erneut starten. Eine tatsächliche iPhone-Prüfung wurde in dieser Entwicklungsumgebung nicht durchgeführt.

Die PWA-Konfiguration folgt den [vite-plugin-pwa-Optionen](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/types.ts); das Schema folgt der [Dexie-Dokumentation](https://dexie.org/docs/Version/Version.stores%28%29).

Weitere Bereitstellungsdetails: [Offizielle GitHub-Pages-Workflow-Anleitung](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
