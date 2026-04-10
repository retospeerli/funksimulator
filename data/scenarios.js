window.SCENARIOS = [
  {
    id: "incoming_easy_01",
    mode: "incoming",
    difficulty: "easy",
    title: "Angerufen werden",
    promptText: "Anna von Bruno, antworten.",
    solutionText: "Bruno hört, kommen.",
    evaluation: {
      requiredAny: ["bruno"],
      requiredClosingAny: ["kommen", "antworten"],
      preferredAny: ["hoert", "hört", "hier", "bereit"],
      tips: {
        missingCore: "Antworte klar mit deinem Rufnamen.",
        missingClosing: "Am Schluss fehlt ein Funkwort wie „kommen“ oder „antworten“."
      }
    }
  },
  {
    id: "incoming_easy_02",
    mode: "incoming",
    difficulty: "easy",
    title: "Angerufen werden",
    promptText: "Mia von Leo, antworten.",
    solutionText: "Leo hört, kommen.",
    evaluation: {
      requiredAny: ["leo"],
      requiredClosingAny: ["kommen", "antworten"],
      preferredAny: ["hoert", "hört", "hier", "bereit"],
      tips: {
        missingCore: "Nenne deutlich deinen eigenen Rufnamen.",
        missingClosing: "Sauber beenden: zum Beispiel mit „kommen“."
      }
    }
  },
  {
    id: "start_easy_01",
    mode: "start",
    difficulty: "easy",
    title: "Gespräch beginnen",
    promptText: "Rufe Anna. Sage, dass der Treffpunkt beim grossen Baum ist.",
    solutionText: "Anna von Bruno, Treffpunkt beim grossen Baum, kommen.",
    evaluation: {
      requiredOrderedAny: [
        ["anna"],
        ["von"],
        ["bruno"],
        ["treffpunkt", "grosser", "grossen", "baum"]
      ],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Im Funk sagst du zuerst, wen du rufst, dann „von“, dann deinen Namen und danach die Nachricht.",
        missingClosing: "Am Ende braucht es noch ein passendes Funkwort."
      }
    }
  },
  {
    id: "start_easy_02",
    mode: "start",
    difficulty: "easy",
    title: "Gespräch beginnen",
    promptText: "Rufe Mia. Frage, wo sie ist.",
    solutionText: "Mia von Bruno, wo bist du, kommen.",
    evaluation: {
      requiredOrderedAny: [
        ["mia"],
        ["von"],
        ["bruno"],
        ["wo", "bist"]
      ],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Die Funk-Reihenfolge stimmt noch nicht ganz. Erst der Partner, dann „von“, dann du selbst, dann die Nachricht.",
        missingClosing: "Der Spruch ist fast richtig. Es fehlt noch das Schlusswort."
      }
    }
  },
  {
    id: "end_easy_01",
    mode: "end",
    difficulty: "easy",
    title: "Gespräch beenden",
    promptText: "Die Nachricht wurde verstanden. Beende das Funkgespräch korrekt.",
    solutionText: "Verstanden, Ende.",
    evaluation: {
      requiredAny: ["verstanden"],
      requiredClosingAny: ["ende"],
      preferredAny: [],
      tips: {
        missingCore: "Zeige zuerst, dass du die Nachricht verstanden hast.",
        missingClosing: "Zum Beenden brauchst du klar das Wort „Ende“."
      }
    }
  },
  {
    id: "repeat_easy_01",
    mode: "repeat",
    difficulty: "easy",
    title: "Wiederholen",
    promptText: "Die Gegenstation sagt: Nicht verstanden, wiederholen, kommen. Wiederhole: Treffpunkt bei der roten Bank um drei Uhr.",
    solutionText: "Treffpunkt bei der roten Bank um drei Uhr, kommen.",
    evaluation: {
      requiredAny: ["treffpunkt", "roten", "bank"],
      requiredNumberAny: ["drei", "3"],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Wiederhole die wichtige Information klar und vollständig.",
        missingClosing: "Auch beim Wiederholen sauber mit einem Funkwort abschliessen."
      }
    }
  },
  {
    id: "incoming_medium_01",
    mode: "incoming",
    difficulty: "medium",
    title: "Angerufen werden",
    promptText: "Ben von Nora, antworten.",
    solutionText: "Nora hört, kommen.",
    evaluation: {
      requiredAny: ["nora"],
      requiredClosingAny: ["kommen", "antworten"],
      preferredAny: ["hoert", "hört", "hier", "bereit"],
      tips: {
        missingCore: "Antworte kurz und klar mit deinem Rufnamen.",
        missingClosing: "Im Funkgespräch fehlt noch das Schlusswort."
      }
    }
  },
  {
    id: "start_medium_01",
    mode: "start",
    difficulty: "medium",
    title: "Gespräch beginnen",
    promptText: "Rufe Leo. Sage: Ich bin beim alten Tor.",
    solutionText: "Leo von Bruno, ich bin beim alten Tor, kommen.",
    evaluation: {
      requiredOrderedAny: [
        ["leo"],
        ["von"],
        ["bruno"],
        ["alten", "tor"]
      ],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Achte wieder auf die klare Funk-Reihenfolge und auf die Ortsangabe.",
        missingClosing: "Es fehlt noch das passende Wort am Schluss."
      }
    }
  },
  {
    id: "end_medium_01",
    mode: "end",
    difficulty: "medium",
    title: "Gespräch beenden",
    promptText: "Die Absprache ist fertig. Beende das Gespräch eindeutig.",
    solutionText: "Verstanden, Ende.",
    evaluation: {
      requiredAny: ["verstanden"],
      requiredClosingAny: ["ende"],
      preferredAny: [],
      tips: {
        missingCore: "Zeige, dass du die Nachricht verstanden hast.",
        missingClosing: "Schliesse das Gespräch eindeutig mit „Ende“."
      }
    }
  },
  {
    id: "repeat_medium_01",
    mode: "repeat",
    difficulty: "medium",
    title: "Wiederholen",
    promptText: "Die Gegenstation hat nichts verstanden. Wiederhole: Wir treffen uns beim kleinen Hügel um vier Uhr.",
    solutionText: "Wir treffen uns beim kleinen Hügel um vier Uhr, kommen.",
    evaluation: {
      requiredAny: ["treffen", "kleinen", "huegel", "hügel"],
      requiredNumberAny: ["vier", "4"],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Wiederhole Ort und Zeit deutlich und vollständig.",
        missingClosing: "Das Schlusswort fehlt noch."
      }
    }
  },
  {
    id: "start_hard_01",
    mode: "start",
    difficulty: "hard",
    title: "Gespräch beginnen",
    promptText: "Rufe Mia. Frage, ob sie bereit ist. Funk klar und kurz.",
    solutionText: "Mia von Bruno, bist du bereit, kommen.",
    evaluation: {
      requiredOrderedAny: [
        ["mia"],
        ["von"],
        ["bruno"],
        ["bereit", "bist"]
      ],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Die Botschaft ist noch nicht ganz funkgerecht. Halte dich an die Reihenfolge und bleibe kurz.",
        missingClosing: "Vergiss das Funkwort am Schluss nicht."
      }
    }
  },
  {
    id: "repeat_hard_01",
    mode: "repeat",
    difficulty: "hard",
    title: "Wiederholen",
    promptText: "Störung auf dem Kanal. Wiederhole: Material liegt neben dem grossen Stein um halb vier.",
    solutionText: "Material liegt neben dem grossen Stein um halb vier, kommen.",
    evaluation: {
      requiredAny: ["material", "grossen", "stein"],
      requiredNumberAny: ["halb", "vier", "4"],
      requiredClosingAny: ["kommen", "antworten"],
      tips: {
        missingCore: "Bei Störung musst du besonders ruhig und klar wiederholen.",
        missingClosing: "Am Schluss fehlt noch ein korrektes Funkwort."
      }
    }
  },
  {
    id: "end_hard_01",
    mode: "end",
    difficulty: "hard",
    title: "Gespräch beenden",
    promptText: "Die Aufgabe ist bestätigt. Beende das Gespräch kurz und sauber.",
    solutionText: "Verstanden, Ende.",
    evaluation: {
      requiredAny: ["verstanden"],
      requiredClosingAny: ["ende"],
      preferredAny: [],
      tips: {
        missingCore: "Zuerst bestätigst du, dass du verstanden hast.",
        missingClosing: "Das Gespräch muss eindeutig mit „Ende“ abgeschlossen werden."
      }
    }
  }
];
