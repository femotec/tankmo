# Tankmo – Prüfprotokoll

Stand: 21. Oktober 2026. Lokale Windows-Umgebung mit Node.js 24.19.0 und installiertem Google Chrome; Playwright mit mobilem iPhone-13-Viewport. Berechnungstests zusätzlich mit `TZ=Europe/Berlin`.

| Prüfung | Ergebnis |
| --- | --- |
| Strikte TypeScript-Prüfung einschließlich Tests und Konfiguration | Bestanden |
| ESLint | Bestanden |
| Vitest: Berechnungen, Kalendergrenzen, Sortierung, Verbrauch, CSV, Backup, IndexedDB | 52 von 52 bestanden |
| Produktionsbuild am Domain-Stamm `/` | Bestanden |
| Produktionsbuild unter `/tankmo/` | Bestanden |
| Playwright am Domain-Stamm | 7 von 7 bestanden |
| Playwright unter `/tankmo/` | 7 von 7 bestanden |
| Manifest, Start-URL, Scope und Erreichbarkeit aller Manifest-Icons | Bestanden, beide Basispfade |
| Apple Touch Icon | PNG, 180 × 180 Pixel geprüft |
| Service Worker und Offline-App-Shell | Erzeugt und im Browser verwendet; 18 precache-Einträge, etwa 974 KiB |
| Mobile Layouts, Light/Dark Mode, Desktop-Ansicht | Screenshots visuell geprüft |
| Kein horizontaler Seitenüberlauf | Geprüft bei 320 × 640, 844 × 390 und 1280 × 900 |

Die sieben Browser-Szenarien prüfen:

1. Leerer Erststart, Tankvorgang anlegen, bearbeiten, Sortierung speichern, Neuladen, Monats-/Jahresfilter und Thema.
2. Kilometerstand, Tankstelle, Tankstellenzuordnung sowie JSON- und CSV-Dateiexport.
3. Offline-Neustart der Seite, Tankvorgang anlegen, Statistiken anzeigen, bearbeiten und erneut laden.
4. Backupvorschau, Dublettenerkennung, Überspringen, bestätigtes Ersetzen einschließlich Einstellungen und CSV-Import.
5. Löschbestätigung mit Abbrechen und Bestätigen, Kilometerstand bearbeiten und responsive Größen.
6. Mobile Light-/Dark-Screenshots und Desktop-Screenshot ohne JavaScript-Seitenfehler.
7. Manifestpfade, Icons und Verbrauchsanzeige aus importierten Volltank-/Teilfüllungsdaten: 6,0 L/100 km und 10,84 €/100 km.

Veröffentlicht am 21. Oktober 2026: [Tankmo](https://femotec.github.io/tankmo/) aus dem öffentlichen Repository [femotec/tankmo](https://github.com/femotec/tankmo). Der [erste GitHub-Actions-Lauf](https://github.com/femotec/tankmo/actions/runs/39668303556) hat Installation, TypeScript, Lint, Unit-Tests, Produktionsbuild und Pages-Deployment erfolgreich abgeschlossen. Der veröffentlichte Quellbaum entspricht exakt dem lokal geprüften Quellbaum `34aed8b609f213ff3295bb661239c73a1db6305a`. Über HTTPS wurden HTML, JavaScript, Manifest, alle Manifest-Icons und Service Worker mit HTTP 200 geprüft; `start_url` und `scope` sind `/tankmo/`. Die veröffentlichte App wurde im Browser geöffnet und bestätigt die Bereitschaft zur Offline-Nutzung.

Nicht durchgeführt: tatsächliche iPhone-Installation, echter Flugmodus oder iOS-Teilen nach iCloud Drive. Die Browserprüfung ersetzt diese Geräteprüfung nicht. Persönliche Tankdaten wurden nicht hochgeladen.

Der Build meldet zwei harmlose Kommentare zu Optimierungsannotationen innerhalb von Zod; diese Kommentare werden beim Bündeln entfernt. Der Build und die Service-Worker-Erzeugung schließen erfolgreich ab.
