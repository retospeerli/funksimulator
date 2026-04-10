window.SCENARIOS = [
  {
    id: "receive_easy_1",
    mode: "receive",
    difficulty: "easy",
    title: "Du wirst angerufen",
    situation: "Der PC ruft dich. Du antwortest korrekt. Danach spricht der PC weiter.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Bruno, antworten"
      },
      {
        role: "student",
        expectedResponse: "Bruno von {SELF}, verstanden, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["bruno"],
            ["von"],
            ["{self}"],
            ["verstanden"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Du musst zuerst Bruno nennen, dann „von“, dann deinen eigenen Rufnamen und „verstanden“.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Treffpunkt beim grossen Stein um drei Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Zum Schluss sagst du in diesem Training: „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "receive_easy_2",
    mode: "receive",
    difficulty: "easy",
    title: "Du wirst angerufen",
    situation: "Der PC ruft dich. Danach hörst du eine Treffpunktmeldung.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Chiara, antworten"
      },
      {
        role: "student",
        expectedResponse: "Chiara von {SELF}, verstanden, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["chiara"],
            ["von"],
            ["{self}"],
            ["verstanden"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Du musst korrekt mit Rufname, „von“, eigenem Namen und „verstanden“ antworten.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Treffpunkt beim alten Baum um vier Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Zum Abschluss gehört hier „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "start_easy_1",
    mode: "start",
    difficulty: "easy",
    title: "Du beginnst das Gespräch",
    situation: "Du rufst Bruno korrekt auf. Wenn es stimmt, spricht der PC weiter.",
    steps: [
      {
        role: "instruction",
        text: "Aufgabe: Rufe Bruno korrekt auf."
      },
      {
        role: "student",
        expectedResponse: "Bruno von {SELF}, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["bruno"],
            ["von"],
            ["{self}"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Erst Bruno, dann „von“, dann dein Rufname.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "{SELF} von Bruno, verstanden, antworten"
      },
      {
        role: "pc",
        text: "Wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt beim grossen Stein um drei Uhr, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "grossen", "stein"],
          requiredNumberAny: ["drei", "3"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Nenne Ort und Zeit vollständig.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Jetzt beendest du nur noch mit „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "start_easy_2",
    mode: "start",
    difficulty: "easy",
    title: "Du beginnst das Gespräch",
    situation: "Du rufst Chiara korrekt auf. Danach fragst du nicht, sondern antwortest auf die PC-Frage.",
    steps: [
      {
        role: "instruction",
        text: "Aufgabe: Rufe Chiara korrekt auf."
      },
      {
        role: "student",
        expectedResponse: "Chiara von {SELF}, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["chiara"],
            ["von"],
            ["{self}"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Erst Chiara, dann „von“, dann dein Rufname.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "{SELF} von Chiara, verstanden, antworten"
      },
      {
        role: "pc",
        text: "Wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt beim alten Baum um vier Uhr, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "alten", "baum"],
          requiredNumberAny: ["vier", "4"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Nenne den Treffpunkt und die Uhrzeit vollständig.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Das Gespräch beendest du jetzt mit „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "end_easy_1",
    mode: "end",
    difficulty: "easy",
    title: "Du beendest das Gespräch",
    situation: "Der PC spricht den letzten korrekten Funkspruch. Danach beendest du das Gespräch korrekt.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Bruno, verstanden, Treffpunkt beim grossen Stein um drei Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Zum Abschluss sagst du „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "end_easy_2",
    mode: "end",
    difficulty: "easy",
    title: "Du beendest das Gespräch",
    situation: "Der PC gibt dir den letzten Funkspruch. Du schliesst korrekt ab.",
    steps: [
      {
        role: "pc",
        text: "Bruno von {SELF}, verstanden, Treffpunkt beim alten Baum um vier Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Hier gehört als Abschluss „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "pc_not_understood_easy_1",
    mode: "notunderstood_pc",
    difficulty: "easy",
    title: "Der PC versteht dich nicht",
    situation: "Du antwortest zuerst korrekt. Danach sagt der PC absichtlich: Nicht verstanden. Dann wiederholst du korrekt mit „Ich wiederhole“.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Bruno, verstanden, wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt beim alten Baum um drei Uhr, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "alten", "baum"],
          requiredNumberAny: ["drei", "3"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Du musst zuerst Ort und Zeit korrekt nennen.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Nicht verstanden, wiederholen, antworten"
      },
      {
        role: "student",
        expectedResponse: "Ich wiederhole, Treffpunkt beim alten Baum um drei Uhr, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["ich", "wiederhole"],
            ["treffpunkt", "alten", "baum"],
            ["drei", "3"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Beim zweiten Mal musst du mit „Ich wiederhole“ beginnen und dann die ganze Meldung nochmals sagen.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Zum Ende des Gesprächs sagst du „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "pc_not_understood_easy_2",
    mode: "notunderstood_pc",
    difficulty: "easy",
    title: "Der PC versteht dich nicht",
    situation: "Du gibst zuerst eine Meldung. Danach wiederholst du sie korrekt mit „Ich wiederhole“.",
    steps: [
      {
        role: "pc",
        text: "Bruno von {SELF}, verstanden, wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt beim grossen Stein um vier Uhr, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "grossen", "stein"],
          requiredNumberAny: ["vier", "4"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Nenne Ort und Zeit vollständig.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Nicht verstanden, wiederholen, antworten"
      },
      {
        role: "student",
        expectedResponse: "Ich wiederhole, Treffpunkt beim grossen Stein um vier Uhr, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["ich", "wiederhole"],
            ["treffpunkt", "grossen", "stein"],
            ["vier", "4"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Wiederhole die Meldung mit „Ich wiederhole“ und nenne alles nochmals vollständig.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Zum Schluss sagst du nur noch „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "student_not_understood_easy_1",
    mode: "notunderstood_student",
    difficulty: "easy",
    title: "Du verstehst den PC nicht",
    situation: "Der PC spricht gestört. Du verlangst korrekt eine Wiederholung. Danach beendet ihr das Gespräch.",
    steps: [
      {
        role: "pc",
        text: "Treffpunkt beim grossen Stein um drei Uhr, antworten",
        distorted: true
      },
      {
        role: "student",
        expectedResponse: "Nicht verstanden, wiederholen, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["nicht", "verstanden"],
            ["wiederholen"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Wenn du es nicht verstanden hast, sagst du: „Nicht verstanden, wiederholen“.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Ich wiederhole, Treffpunkt beim grossen Stein um drei Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Nach der korrekten Wiederholung bestätigst du mit „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "student_not_understood_easy_2",
    mode: "notunderstood_student",
    difficulty: "easy",
    title: "Du verstehst den PC nicht",
    situation: "Der PC meldet etwas gestört. Du verlangst korrekt eine Wiederholung.",
    steps: [
      {
        role: "pc",
        text: "Treffpunkt beim alten Baum um vier Uhr, antworten",
        distorted: true
      },
      {
        role: "student",
        expectedResponse: "Nicht verstanden, wiederholen, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["nicht", "verstanden"],
            ["wiederholen"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Die korrekte Rückmeldung lautet hier „Nicht verstanden, wiederholen“.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Ich wiederhole, Treffpunkt beim alten Baum um vier Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Nach der klaren Wiederholung bestätigst du mit „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "receive_medium_1",
    mode: "receive",
    difficulty: "medium",
    title: "Du wirst angerufen",
    situation: "Gleiche Funkregeln, etwas mehr Variation im Inhalt.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Leo, antworten"
      },
      {
        role: "student",
        expectedResponse: "Leo von {SELF}, verstanden, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["leo"],
            ["von"],
            ["{self}"],
            ["verstanden"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Nenne Leo, dann „von“, dann deinen Rufnamen und „verstanden“.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Treffpunkt beim kleinen Hügel um fünf Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Zum Schluss sagst du „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "start_medium_1",
    mode: "start",
    difficulty: "medium",
    title: "Du beginnst das Gespräch",
    situation: "Du rufst Mia korrekt auf und beantwortest danach die Rückfrage.",
    steps: [
      {
        role: "instruction",
        text: "Aufgabe: Rufe Mia korrekt auf."
      },
      {
        role: "student",
        expectedResponse: "Mia von {SELF}, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["mia"],
            ["von"],
            ["{self}"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Erst Mia, dann „von“, dann dein Rufname.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "{SELF} von Mia, verstanden, antworten"
      },
      {
        role: "pc",
        text: "Wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt bei der roten Bank um halb vier, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "roten", "bank"],
          requiredNumberAny: ["halb", "vier", "4"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Ort und Zeit müssen vollständig gesagt werden.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Jetzt nur noch „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "end_medium_1",
    mode: "end",
    difficulty: "medium",
    title: "Du beendest das Gespräch",
    situation: "Der PC meldet dir den letzten korrekten Funkspruch.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Mia, verstanden, Treffpunkt bei der roten Bank um halb vier, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Der korrekte Abschluss lautet hier „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "pc_not_understood_medium_1",
    mode: "notunderstood_pc",
    difficulty: "medium",
    title: "Der PC versteht dich nicht",
    situation: "Du gibst eine Meldung. Danach wiederholst du sie korrekt.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Mia, verstanden, wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt bei der roten Bank um halb vier, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "roten", "bank"],
          requiredNumberAny: ["halb", "vier", "4"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Die erste Meldung muss vollständig sein.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Nicht verstanden, wiederholen, antworten"
      },
      {
        role: "student",
        expectedResponse: "Ich wiederhole, Treffpunkt bei der roten Bank um halb vier, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["ich", "wiederhole"],
            ["treffpunkt", "roten", "bank"],
            ["halb", "vier", "4"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Wiederhole die ganze Meldung korrekt mit „Ich wiederhole“.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Das Gespräch endet jetzt mit „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "student_not_understood_medium_1",
    mode: "notunderstood_student",
    difficulty: "medium",
    title: "Du verstehst den PC nicht",
    situation: "Du verlangst zuerst korrekt eine Wiederholung und bestätigst danach.",
    steps: [
      {
        role: "pc",
        text: "Treffpunkt bei der roten Bank um halb vier, antworten",
        distorted: true
      },
      {
        role: "student",
        expectedResponse: "Nicht verstanden, wiederholen, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["nicht", "verstanden"],
            ["wiederholen"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Wenn du es nicht verstanden hast, verlangst du eine Wiederholung.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Ich wiederhole, Treffpunkt bei der roten Bank um halb vier, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Jetzt bestätigst du mit „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "receive_hard_1",
    mode: "receive",
    difficulty: "hard",
    title: "Du wirst angerufen",
    situation: "Der Ablauf bleibt gleich, der Inhalt variiert.",
    steps: [
      {
        role: "pc",
        text: "{SELF} von Nora, antworten"
      },
      {
        role: "student",
        expectedResponse: "Nora von {SELF}, verstanden, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["nora"],
            ["von"],
            ["{self}"],
            ["verstanden"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Antworte sauber mit Rufname, „von“, eigenem Namen und „verstanden“.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Treffpunkt beim alten Tor um fünf Uhr, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Zum Ende sagst du „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "start_hard_1",
    mode: "start",
    difficulty: "hard",
    title: "Du beginnst das Gespräch",
    situation: "Du rufst Nora und gibst danach eine präzisere Ortsmeldung.",
    steps: [
      {
        role: "instruction",
        text: "Aufgabe: Rufe Nora korrekt auf."
      },
      {
        role: "student",
        expectedResponse: "Nora von {SELF}, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["nora"],
            ["von"],
            ["{self}"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Achte auf die richtige Reihenfolge.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "{SELF} von Nora, verstanden, antworten"
      },
      {
        role: "pc",
        text: "Wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt neben dem grossen Stein um halb fünf, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "neben", "grossen", "stein"],
          requiredNumberAny: ["halb", "fuenf", "fünf", "5"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Ort und Zeit müssen genau gesagt werden.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Zum Schluss gehört hier nur noch „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "end_hard_1",
    mode: "end",
    difficulty: "hard",
    title: "Du beendest das Gespräch",
    situation: "Der PC liefert dir die letzte Meldung. Du schliesst korrekt ab.",
    steps: [
      {
        role: "pc",
        text: "Nora von {SELF}, verstanden, Treffpunkt neben dem grossen Stein um halb fünf, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Der korrekte Abschluss lautet „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  },

  {
    id: "pc_not_understood_hard_1",
    mode: "notunderstood_pc",
    difficulty: "hard",
    title: "Der PC versteht dich nicht",
    situation: "Du meldest präzise. Danach wiederholst du dieselbe Meldung korrekt.",
    steps: [
      {
        role: "pc",
        text: "Nora von {SELF}, verstanden, wo und wann treffen wir uns? antworten"
      },
      {
        role: "student",
        expectedResponse: "Treffpunkt neben dem grossen Stein um halb fünf, antworten",
        evaluation: {
          requiredAny: ["treffpunkt", "neben", "grossen", "stein"],
          requiredNumberAny: ["halb", "fuenf", "fünf", "5"],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Die Meldung muss präzise und vollständig sein.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Nicht verstanden, wiederholen, antworten"
      },
      {
        role: "student",
        expectedResponse: "Ich wiederhole, Treffpunkt neben dem grossen Stein um halb fünf, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["ich", "wiederhole"],
            ["treffpunkt", "neben", "grossen", "stein"],
            ["halb", "fuenf", "fünf", "5"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Wiederhole die ganze Meldung exakt mit „Ich wiederhole“.",
            missingClosing: "Am Ende fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Richtig, Schluss"
      },
      {
        role: "student",
        expectedResponse: "Schluss",
        evaluation: {
          requiredAny: ["schluss"],
          tips: {
            missingCore: "Jetzt beendest du mit „Schluss“."
          }
        }
      }
    ]
  },

  {
    id: "student_not_understood_hard_1",
    mode: "notunderstood_student",
    difficulty: "hard",
    title: "Du verstehst den PC nicht",
    situation: "Der PC ist gestört. Du verlangst eine Wiederholung und bestätigst korrekt.",
    steps: [
      {
        role: "pc",
        text: "Treffpunkt neben dem grossen Stein um halb fünf, antworten",
        distorted: true
      },
      {
        role: "student",
        expectedResponse: "Nicht verstanden, wiederholen, antworten",
        evaluation: {
          requiredOrderedAny: [
            ["nicht", "verstanden"],
            ["wiederholen"]
          ],
          requiredClosingAny: ["antworten"],
          tips: {
            missingCore: "Verlange hier korrekt eine Wiederholung.",
            missingClosing: "Am Schluss fehlt „antworten“."
          }
        }
      },
      {
        role: "pc",
        text: "Ich wiederhole, Treffpunkt neben dem grossen Stein um halb fünf, antworten"
      },
      {
        role: "student",
        expectedResponse: "Richtig, Schluss",
        evaluation: {
          requiredOrderedAny: [
            ["richtig"],
            ["schluss"]
          ],
          tips: {
            missingCore: "Nach der Wiederholung bestätigst du mit „Richtig, Schluss“."
          }
        }
      },
      {
        role: "pc",
        text: "Schluss"
      }
    ]
  }
];
