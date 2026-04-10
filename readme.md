# Funksimulator

Eine statische Web-App für GitHub Pages, mit der Kinder im Alter von ca. 10–12 Jahren schweizerische Funksprache üben können.

## Funktionen

- kindgerechte Funksimulation
- Browser-Spracherkennung
- Text-to-Speech
- Sprechtaste
- Rückmeldung zu Inhalt, Reihenfolge und Funkvokabular
- echte Gesprächslogik in mehreren Schritten

## Verwendetes schweizerisches Funkvokabular

Die App ist auf diese Muster ausgerichtet:

- `Bruno von Anna, antworten`
- `Anna von Bruno, verstanden, antworten`
- `Nicht verstanden, wiederholen, antworten`
- `Ich wiederhole, ... , antworten`
- `Richtig, Schluss`
- `Schluss`

## Modi

- Angerufen werden
- Gespräch beginnen
- Gespräch beenden
- PC versteht dich nicht
- Du verstehst den PC nicht

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

Die App kann direkt als statische Webseite auf GitHub Pages veröffentlicht werden.

## Audio-Dateien

Lege diese Dateien in `audio/sfx/` ab:

- `ptt-down.wav`
- `ptt-up-beep.wav`
- `static-low.mp3`
- `success.wav`
- `error.wav`
- `message-incoming.wav`
- `round-complete.wav`

## Hinweis

Die Browser-Spracherkennung ist nicht perfekt. Deshalb bewertet die App tolerant und prüft vor allem:

- Reihenfolge
- Rufnamen
- wichtige Inhaltswörter
- korrekte Funkwörter
- korrektes Gesprächsende
