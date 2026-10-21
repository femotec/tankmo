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

Nicht durchgeführt: Veröffentlichung auf einem GitHub-Konto, GitHub-Actions-Ausführung auf dem Server, tatsächliche iPhone-Installation, echter Flugmodus oder iOS-Teilen nach iCloud Drive. Die Browserprüfung ersetzt diese Geräteprüfung nicht. Es bestehen keine verbundenen Hosting-Zugangsdaten; Deployment ist vorbereitet und in der README beschrieben.

Der Build meldet zwei harmlose Kommentare zu Optimierungsannotationen innerhalb von Zod; diese Kommentare werden beim Bündeln entfernt. Der Build und die Service-Worker-Erzeugung schließen erfolgreich ab.
