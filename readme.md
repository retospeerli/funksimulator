# Funksimulator

Eine einfache Web-App für GitHub Pages, mit der Kinder im Alter von ca. 10–12 Jahren korrektes Funken üben können.

## Funktionen

- kindgerechte Funkübungen
- Browser-Spracherkennung
- Text-to-Speech
- Sprechtaste
- Rückmeldung zu Inhalt und Funkdisziplin
- mehrere Modi:
  - Angerufen werden
  - Gespräch beginnen
  - Gespräch beenden
  - Wiederholen nach Störung

## Technik

- HTML
- CSS
- Vanilla JavaScript
- Web Speech API

## Geeignete Browser

Empfohlen:
- Google Chrome
- Microsoft Edge

## GitHub Pages

Die App ist als statische Webseite aufgebaut und kann direkt über GitHub Pages veröffentlicht werden.

## Wichtiger Hinweis

Die Browser-Spracherkennung ist nie perfekt. Deshalb arbeitet die App tolerant und prüft nicht nur den exakten Wortlaut, sondern vor allem:
- wichtige Wörter
- Funkreihenfolge
- korrektes Beenden

## Audio-Dateien

Lege diese Dateien im Ordner `audio/sfx/` ab:

- `ptt-down.wav`
- `ptt-up-beep.wav`
- `static-low.mp3`
- `success.wav`
- `error.wav`
- `message-incoming.wav`
- `round-complete.wav`

## Nächste sinnvolle Ausbaustufen

- echter Prüfungsmodus
- Punkte pro Teilkriterium
- strengere Funkregeln
- NATO-Alphabet
- Morsen
- eigene Rufnamen
- Audiofilter für echten Funkklang
