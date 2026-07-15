# Portfolio — sebastian-steffen.github.io

## Was dieses Projekt ist
Sebs persönliches Portfolio als Interaction Designer & Videoproduzent.
Live unter: https://sebastian-steffen.github.io
GitHub Pages: auto-deploy beim Push auf `main`

## Dateistruktur
- `index.html` → Videoarbeiten (Hauptseite)
- `installationen.html` → Interaktive Installationen
- `generic.html` → Über mich
- `assets/css/main.css` → Basis-Template CSS (HTML5UP Massively, nicht anfassen)
- `assets/css/custom.css` → Unsere Anpassungen (hier arbeiten)
- `images/` → Bilder und Medien

## Technischer Stack
- Pures HTML / CSS / JavaScript (kein Build-Tool, kein npm)
- jQuery ist vorhanden (aber neue Dinge in Vanilla JS schreiben)
- FontAwesome für Icons
- Kein SASS-Compiler aktiv → direkt in .css Dateien arbeiten

## Design-Entscheidungen
- Farbpalette: #080808 (bg), #f5f5f5 (text), #e8d5b0 (akzent gold)
- Schlankes, künstlerisch-verspieltes Design angestrebt — kein Template-Feeling
- Animationen: Scroll-triggered, CSS transitions, Intersection Observer
- Custom Cursor aktiv
- Gamification: Easter Egg "BASEL" tippen, Scroll-Progress-Linie, Video-Hover-Effekt

## Workflow
- Lokal testen: Live Server in VS Code oder `python -m http.server 8080`
- Deploy: `git add . && git commit -m "..." && git push` → ~1 Min bis live
- Seb soll immer erst lokal sehen bevor Push

## Was ich NIE tun soll
- `assets/css/main.css` direkt editieren (Template-Basis)
- Externe Libraries einbinden ohne Seb zu fragen
- Pushen ohne Seb OK zu geben

## Kontext Seb
- Interaction Designer, Bachelor FHNW Basel (Hyperwerk)
- Arbeitet bei Breakout Basel (Escape Room)
- Git-Anfänger — bei jedem Git-Befehl kurz erklären was er macht
- Will lernen, nicht nur ausführen lassen
