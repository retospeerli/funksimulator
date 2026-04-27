(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  const els = {
    radioImage: document.getElementById("radioImage"),
    statusText: document.getElementById("statusText"),
    heardText: document.getElementById("heardText"),
    feedbackText: document.getElementById("feedbackText"),

    goalText: document.getElementById("goalText"),
    taskText: document.getElementById("taskText"),
    placeText: document.getElementById("placeText"),
    timeText: document.getElementById("timeText"),

    hintMain: document.getElementById("hintMain"),
    hintOne: document.getElementById("hintOne"),
    hintTwo: document.getElementById("hintTwo"),
    hintThree: document.getElementById("hintThree"),

    startBtn: document.getElementById("startBtn"),
    continueBtn: document.getElementById("continueBtn"),
    newRoundBtn: document.getElementById("newRoundBtn"),
    pttBtn: document.getElementById("pttBtn"),
    chooseKeyBtn: document.getElementById("chooseKeyBtn"),
    keyName: document.getElementById("keyName"),

    helpBtn: document.getElementById("helpBtn"),
    helpDialog: document.getElementById("helpDialog"),
    closeHelpBtn: document.getElementById("closeHelpBtn"),

    settingsBtn: document.getElementById("settingsBtn"),
    settingsDialog: document.getElementById("settingsDialog"),
    okSettingsBtn: document.getElementById("okSettingsBtn"),
    cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),

    nameInput: document.getElementById("nameInput"),
    modeSelect: document.getElementById("modeSelect"),
    noiseToggle: document.getElementById("noiseToggle"),

    sndClick: document.getElementById("sndClick"),
    sndPttDown: document.getElementById("sndPttDown"),
    sndPttUp: document.getElementById("sndPttUp"),
    sndBuzz: document.getElementById("sndBuzz"),
    sndNoise: document.getElementById("sndNoise"),
    sndError: document.getElementById("sndError"),
    sndSuccess: document.getElementById("sndSuccess")
  };

  const state = {
    name: "Anna",
    mode: "all",
    currentTask: null,
    step: 0,

    recognition: null,
    recognizing: false,
    finalText: "",
    pttDown: false,
    pttCode: "Space",
    chooseKeyMode: false,

    currentTypeIndex: 0,
    waitingAfterSuccess: false,

    pcTimer: null,
    pcPostTimer: null,
    userStartTimer: null,
    userStopTimer: null,
    nextPromptTimer: null
  };

  const TIMING = {
    pcPreSpeech: 1000,
    pcPostSpeech: 1000,
    userPreTalk: 1000,
    userPostTalk: 600,
    nextStep: 900,
    successPause: 5000
  };

  const taskOrder = [
    "receive",
    "start",
    "end",
    "notunderstood_pc",
    "notunderstood_student"
  ];

  const tasks = {
    receive: {
      goal: "Du lernst, wie du auf einen ersten Funkruf korrekt antwortest.",
      task: "Der PC ruft dich. Antworte korrekt. Danach bestätigst du die Meldung und beendest das Gespräch.",
      place: "grosser Stein",
      time: "3 Uhr",
      steps: [
        { pc: "{SELF} von Bruno, antworten" },
        { user: "Bruno von {SELF}, verstanden, antworten" },
        { pc: "Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { user: "Verstanden, Treffpunkt beim grossen Stein um drei Uhr, Schluss" },
        { pc: "Schluss" }
      ]
    },

    start: {
      goal: "Du lernst, wie du ein Funkgespräch korrekt eröffnest.",
      task: "Rufe Bruno. Sobald das Gespräch steht, brauchst du keine Rufnamen mehr. Teile Treffpunkt und Uhrzeit mit.",
      place: "alter Baum",
      time: "4 Uhr",
      steps: [
        { user: "Bruno von {SELF}, antworten" },
        { pc: "{SELF} von Bruno, verstanden, antworten" },
        { user: "Treffpunkt beim alten Baum um vier Uhr, antworten" },
        { pc: "Verstanden, Treffpunkt beim alten Baum um vier Uhr, Schluss" },
        { user: "Schluss" }
      ]
    },

    end: {
      goal: "Du lernst, wie du eine gehörte Meldung bestätigst und das Gespräch beendest.",
      task: "Der PC gibt dir Treffpunkt und Uhrzeit. Bestätige die Meldung und beende korrekt.",
      place: "rote Bank",
      time: "halb vier",
      steps: [
        { pc: "Treffpunkt bei der roten Bank um halb vier, antworten" },
        { user: "Verstanden, Treffpunkt bei der roten Bank um halb vier, Schluss" },
        { pc: "Schluss" }
      ]
    },

    notunderstood_pc: {
      goal: "Du lernst, wie du korrekt wiederholst, wenn die Gegenstelle dich nicht verstanden hat.",
      task: "Gib Treffpunkt und Uhrzeit durch. Wenn der PC dich nicht versteht, wiederholst du mit „Ich wiederhole“.",
      place: "alter Baum",
      time: "3 Uhr",
      steps: [
        { pc: "Wo und wann treffen wir uns? antworten" },
        { user: "Treffpunkt beim alten Baum um drei Uhr, antworten" },
        { pc: "Nicht verstanden, wiederholen" },
        { user: "Ich wiederhole, Treffpunkt beim alten Baum um drei Uhr, antworten" },
        { pc: "Verstanden, Schluss" },
        { user: "Schluss" }
      ]
    },

    notunderstood_student: {
      goal: "Du lernst, wie du korrekt eine Wiederholung verlangst.",
      task: "Der PC spricht absichtlich gestört. Rate nicht, sondern verlange korrekt eine Wiederholung.",
      place: "nicht hörbar",
      time: "nicht hörbar",
      steps: [
        {
          pc: "Treffpunkt beim grossen Stein um drei Uhr, antworten",
          distorted: true,
          distortedText: "krrr ... gromm ... schtai ... drii ... antworr ... krr"
        },
        { user: "Nicht verstanden, wiederholen" },
        { pc: "Ich wiederhole, Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { user: "Verstanden, Treffpunkt beim grossen Stein um drei Uhr, Schluss" },
        { pc: "Schluss" }
      ]
    }
  };

  function init() {
    if (SpeechRecognition) {
      setupRecognition();
    } else {
      els.feedbackText.textContent = "Dieser Browser unterstützt keine Spracherkennung. Bitte Chrome verwenden.";
      els.heardText.value = "Keine Spracherkennung verfügbar.";
      els.pttBtn.disabled = true;
    }

    bindEvents();
    loadTask(getCurrentTaskType());
    setRadio("standby");
    setStatus("Bereit");
  }

  function bindEvents() {
    els.startBtn.addEventListener("click", () => {
      play("click");
      startTask();
    });

    els.continueBtn.addEventListener("click", () => {
      play("click");
      continueAfterSolvedTask();
    });

    els.newRoundBtn.addEventListener("click", () => {
      play("click");
      startNewRound();
    });

    els.pttBtn.addEventListener("mousedown", startPtt);
    els.pttBtn.addEventListener("touchstart", e => {
      e.preventDefault();
      startPtt();
    }, { passive: false });

    window.addEventListener("mouseup", stopPtt);
    window.addEventListener("touchend", stopPtt);

    window.addEventListener("keydown", e => {
      if (state.chooseKeyMode) {
        e.preventDefault();
        state.pttCode = e.code;
        els.keyName.textContent = readableKey(e);
        state.chooseKeyMode = false;
        els.chooseKeyBtn.textContent = "Taste definieren";
        play("click");
        return;
      }

      if (e.code === state.pttCode && !state.pttDown) {
        e.preventDefault();
        startPtt();
      }
    });

    window.addEventListener("keyup", e => {
      if (e.code === state.pttCode) {
        e.preventDefault();
        stopPtt();
      }
    });

    els.chooseKeyBtn.addEventListener("click", () => {
      play("click");
      state.chooseKeyMode = true;
      els.chooseKeyBtn.textContent = "Taste drücken …";
    });

    els.helpBtn.addEventListener("click", () => {
      play("click");
      els.helpDialog.showModal();
    });

    els.closeHelpBtn.addEventListener("click", () => {
      play("click");
      els.helpDialog.close();
    });

    els.settingsBtn.addEventListener("click", () => {
      play("click");
      els.nameInput.value = state.name;
      els.modeSelect.value = state.mode;
      els.settingsDialog.showModal();
    });

    els.cancelSettingsBtn.addEventListener("click", () => {
      play("click");
      els.settingsDialog.close();
    });

    els.okSettingsBtn.addEventListener("click", () => {
      play("click");
      state.name = sanitizeName(els.nameInput.value) || "Anna";
      state.mode = els.modeSelect.value;
      state.currentTypeIndex = 0;
      els.settingsDialog.close();
      loadTask(getCurrentTaskType());
    });
  }

  function setupRecognition() {
    const r = new SpeechRecognition();
    r.lang = "de-CH";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      state.recognizing = true;
      state.finalText = "";
      els.heardText.value = "Mikrofon aktiv … ich höre zu.";
      setStatus("Aufnahme läuft");
    };

    r.onresult = e => {
      let final = state.finalText;
      let interim = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript.trim();

        if (e.results[i].isFinal) {
          final += (final ? " " : "") + txt;
        } else {
          interim += (interim ? " " : "") + txt;
        }
      }

      state.finalText = final.trim();
      els.heardText.value = [state.finalText, interim].filter(Boolean).join(" ") || "Mikrofon aktiv … noch nichts erkannt.";
    };

    r.onerror = e => {
      state.recognizing = false;
      stopNoise();
      setRadio("standby");
      setStatus("Fehler");

      let msg = "Spracherkennung fehlgeschlagen.";

      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        msg = "Mikrofon wurde blockiert. Bitte im Browser das Mikrofon erlauben.";
      } else if (e.error === "no-speech") {
        msg = "Kein Sprachsignal erkannt. PTT drücken, kurz warten, dann deutlich sprechen.";
      } else if (e.error === "audio-capture") {
        msg = "Kein Mikrofon gefunden. Prüfe Headset und Windows-Eingabegerät.";
      } else if (e.error === "network") {
        msg = "Netzwerkfehler bei der Browser-Spracherkennung.";
      }

      els.heardText.value = msg;
      els.feedbackText.textContent = msg;
    };

    r.onend = () => {
      state.recognizing = false;
      stopNoise();

      if (!state.pttDown) {
        setRadio("standby");
        setStatus("Bereit");
      }

      const heard = state.finalText.trim();

      if (!heard) {
        els.heardText.value = "Nichts erkannt.";
        els.feedbackText.textContent = "Nichts erkannt. PTT drücken, kurz warten, deutlich sprechen, kurz warten und loslassen.";
        return;
      }

      checkAnswer(heard);
    };

    state.recognition = r;
  }

  function getCurrentTaskType() {
    if (state.mode !== "all") return state.mode;
    return taskOrder[state.currentTypeIndex];
  }

  function loadTask(type) {
    clearTimers();
    stopAllAudio();

    state.currentTask = JSON.parse(JSON.stringify(tasks[type]));
    state.currentTask.type = type;
    state.step = 0;
    state.waitingAfterSuccess = false;
    state.finalText = "";
    state.pttDown = false;
    state.recognizing = false;

    els.goalText.textContent = state.currentTask.goal;
    els.taskText.textContent = state.currentTask.task;
    els.placeText.textContent = state.currentTask.place;
    els.timeText.textContent = state.currentTask.time;
    els.feedbackText.textContent = `Aufgabentyp: ${label(type)}. Lies die Karte und klicke auf „Loslegen“.`;
    els.heardText.value = "Noch keine Aufnahme.";

    renderHints(type);

    els.startBtn.disabled = false;
    els.continueBtn.disabled = true;
    els.newRoundBtn.hidden = true;
    els.pttBtn.disabled = true;

    setRadio("standby");
    setStatus("Auftrag bereit");
  }

  function renderHints(type) {
    const self = state.name || "Anna";

    const hints = {
      receive: {
        main: "Antworte auf den ersten Anruf.",
        one: `Erster Kontakt: „Bruno von ${self}, verstanden, antworten“`,
        two: "Danach keine Rufnamen mehr.",
        three: "Am Schluss: „Verstanden, Treffpunkt …, Schluss“ oder „… Ende“"
      },
      start: {
        main: "Du beginnst das Funkgespräch.",
        one: `Erster Anruf: „Bruno von ${self}, antworten“`,
        two: "Danach: „Treffpunkt …, antworten“",
        three: "Wer „antworten“ sagt, wartet auf die Gegenstelle."
      },
      end: {
        main: "Du bestätigst und beendest.",
        one: "Bestätige gehörte Meldung mit „verstanden“.",
        two: "Dann wiederhole den wichtigen Inhalt kurz.",
        three: "Abschluss: „Schluss“ oder „Ende“"
      },
      notunderstood_pc: {
        main: "Der PC versteht dich nicht.",
        one: "Bei Rückfrage wiederholst du mit „Ich wiederhole“.",
        two: "„Nicht verstanden, wiederholen“ hat kein „antworten“.",
        three: "„antworten“ nur, wenn danach die Gegenstelle sprechen soll."
      },
      notunderstood_student: {
        main: "Du verstehst den PC nicht.",
        one: "Nicht raten.",
        two: "Sage: „Nicht verstanden, wiederholen“",
        three: "Nach der Wiederholung: „Verstanden, …, Schluss“"
      }
    };

    const h = hints[type] || hints.receive;
    els.hintMain.textContent = h.main;
    els.hintOne.textContent = h.one;
    els.hintTwo.textContent = h.two;
    els.hintThree.textContent = h.three;
  }

  function startTask() {
    clearTimers();
    stopAllAudio();

    els.startBtn.disabled = true;
    els.continueBtn.disabled = true;
    els.newRoundBtn.hidden = true;
    els.pttBtn.disabled = false;
    els.feedbackText.textContent = "Das Gespräch läuft.";
    els.heardText.value = "Noch keine Aufnahme.";

    runStep();
  }

  function runStep() {
    const step = currentStep();

    if (!step) {
      finishSolvedTask();
      return;
    }

    if (step.pc) {
      speakPc(step);
      return;
    }

    if (step.user) {
      els.feedbackText.textContent = "Du bist dran. PTT drücken, kurz warten, sprechen, kurz warten, loslassen.";
      setStatus("Warten auf deinen Funkspruch");
      setRadio("standby");
    }
  }

  function speakPc(step) {
    clearTimers();
    stopAllAudio();

    const spoken = step.distorted ? (step.distortedText || fill(step.pc)) : fill(step.pc);

    setStatus("Empfangen");
    setRadio("receive");
    play("buzz");

    if (step.distorted) startNoise(0.9);

    state.pcTimer = setTimeout(() => {
      speak(spoken, !!step.distorted, () => {
        state.pcPostTimer = setTimeout(() => {
          play("buzz");
          stopNoise();
          setRadio("standby");
          setStatus("Bereit");
          state.step++;
          runStep();
        }, TIMING.pcPostSpeech);
      });
    }, TIMING.pcPreSpeech);
  }

  function startPtt() {
    const step = currentStep();

    if (!step || !step.user || state.pttDown || state.recognizing || !state.recognition || state.waitingAfterSuccess) return;

    clearTimers();
    stopAllAudio();

    state.pttDown = true;
    state.finalText = "";

    els.pttBtn.classList.add("active");
    els.heardText.value = "PTT gedrückt … kurz warten.";
    els.feedbackText.textContent = "PTT offen. Kurz warten, dann sprechen.";

    setStatus("Senden");
    setRadio("send");
    play("pttDown");

    state.userStartTimer = setTimeout(() => {
      if (!state.pttDown) return;

      els.heardText.value = "Jetzt sprechen …";

      try {
        state.recognition.start();
      } catch (err) {
        state.recognizing = false;
        els.heardText.value = "Aufnahme konnte nicht gestartet werden. Bitte erneut versuchen.";
      }
    }, TIMING.userPreTalk);
  }

  function stopPtt() {
    if (!state.pttDown) return;

    state.pttDown = false;
    els.pttBtn.classList.remove("active");
    play("pttUp");

    clearTimeout(state.userStartTimer);

    els.feedbackText.textContent = "PTT losgelassen. Auswertung läuft …";

    state.userStopTimer = setTimeout(() => {
      if (state.recognizing) {
        try {
          state.recognition.stop();
        } catch (err) {
          state.recognizing = false;
        }
      } else {
        setRadio("standby");
        setStatus("Bereit");
      }
    }, TIMING.userPostTalk);
  }

  function checkAnswer(heard) {
    const step = currentStep();
    if (!step || !step.user) return;

    const expected = fill(step.user);
    const result = analyseFunkAnswer(heard, expected);

    els.feedbackText.innerHTML = result.html;

    if (result.ok) {
      play("success");
      state.step++;
      state.nextPromptTimer = setTimeout(runStep, TIMING.nextStep);
    } else {
      play("error");
    }
  }

  function analyseFunkAnswer(heard, expected) {
    const contentOk = compare(heard, expected);
    const termResult = analyseFunkTerms(heard, expected);
    const ok = contentOk && termResult.ok;

    let html = `<div class="feedback-line"><strong>Erkannt:</strong> ${highlightFunkTerms(heard, termResult)}</div>`;

    if (ok) {
      html += `<div class="feedback-line feedback-good">Korrekt. Funkbegriffe und Reihenfolge passen.</div>`;
    } else {
      html += `<div class="feedback-line feedback-bad">Noch nicht korrekt.</div>`;

      termResult.problems.forEach(p => {
        html += `<div class="feedback-line feedback-bad">${escapeHtml(p)}</div>`;
      });

      if (!contentOk) {
        html += `<div class="feedback-line feedback-bad">Der Inhalt stimmt noch nicht vollständig.</div>`;
      }

      html += `<div class="feedback-line"><strong>Erwartet:</strong> ${escapeHtml(expected)}</div>`;
    }

    return { ok, html };
  }

  function analyseFunkTerms(heard, expected) {
    const heardNorm = normalize(heard);
    const required = getRequiredTermSequence(expected);
    const problems = [];
    const found = [];
    let lastIndex = -1;

    required.forEach(term => {
      const index = findTermIndex(heardNorm, term, lastIndex + 1);

      if (index === -1) {
        problems.push(`„${term.label}“ fehlt.`);
        found.push({ term: term.key, ok: false });
        return;
      }

      found.push({ term: term.key, ok: true });
      lastIndex = index;
    });

    return {
      ok: problems.length === 0,
      problems,
      found
    };
  }

  function getRequiredTermSequence(expected) {
    const e = normalize(expected);
    const terms = [];

    if (e.includes("nicht verstanden")) terms.push({ key: "nicht verstanden", label: "nicht verstanden" });
    else if (e.includes("verstanden")) terms.push({ key: "verstanden", label: "verstanden" });

    if (e.includes("ich wiederhole")) terms.push({ key: "ich wiederhole", label: "ich wiederhole" });
    else if (e.includes("wiederholen")) terms.push({ key: "wiederholen", label: "wiederholen" });

    if (e.includes("antworten")) terms.push({ key: "antworten", label: "antworten" });
    if (e.includes("schluss")) terms.push({ key: "schluss", label: "schluss/ende" });

    return terms;
  }

  function findTermIndex(text, term, fromIndex) {
    if (term.key === "schluss") {
      const a = text.indexOf("schluss", fromIndex);
      const b = text.indexOf("ende", fromIndex);
      if (a === -1) return b;
      if (b === -1) return a;
      return Math.min(a, b);
    }

    return text.indexOf(term.key, fromIndex);
  }

  function highlightFunkTerms(text, termResult) {
    let safe = escapeHtml(text);
    const goodTerms = termResult.found.filter(x => x.ok).map(x => x.term);
    const allTerms = [
      "nicht verstanden",
      "ich wiederhole",
      "verstanden",
      "wiederholen",
      "antworten",
      "schluss",
      "ende"
    ];

    allTerms.forEach(term => {
      const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
      const good = goodTerms.includes(term) || (term === "ende" && goodTerms.includes("schluss"));

      safe = safe.replace(regex, match => {
        if (good) return `<span class="feedback-good">${match}</span>`;
        return `<span class="feedback-bad">${match}</span>`;
      });
    });

    return safe;
  }

  function finishSolvedTask() {
    state.waitingAfterSuccess = true;
    els.pttBtn.disabled = true;
    setStatus("Aufgabe gelöst");
    setRadio("standby");

    els.feedbackText.textContent = "Aufgabe korrekt gelöst. In 5 Sekunden wird die nächste Übung vorgeschlagen.";

    state.nextPromptTimer = setTimeout(() => {
      if (state.mode === "all") {
        if (state.currentTypeIndex < taskOrder.length - 1) {
          const nextType = taskOrder[state.currentTypeIndex + 1];
          els.feedbackText.textContent = `Gut gemacht. Als Nächstes: ${label(nextType)}. Klicke auf „Weiter“.`;
          els.continueBtn.textContent = `Weiter: ${label(nextType)}`;
          els.continueBtn.disabled = false;
        } else {
          els.feedbackText.textContent = "Alle Aufgabentypen wurden einmal geübt. Starte eine neue Runde – oder wähle über „Einstellungen“ gezielt eine bestimmte Aufgabenart.";
          els.continueBtn.disabled = true;
          els.newRoundBtn.hidden = false;
        }
      } else {
        els.feedbackText.textContent = "Aufgabe gelöst. Klicke auf „Weiter“, um diesen Aufgabentyp nochmals zu üben.";
        els.continueBtn.textContent = "Weiter";
        els.continueBtn.disabled = false;
      }
    }, TIMING.successPause);
  }

  function continueAfterSolvedTask() {
    if (state.mode === "all") state.currentTypeIndex++;
    loadTask(getCurrentTaskType());
  }

  function startNewRound() {
    state.currentTypeIndex = 0;
    loadTask(getCurrentTaskType());
  }

  function currentStep() {
    return state.currentTask?.steps?.[state.step] || null;
  }

  function fill(text) {
    return String(text).replaceAll("{SELF}", state.name);
  }

  function compare(heard, expected) {
    const h = normalize(heard).split(" ").filter(Boolean);
    const e = normalize(expected).split(" ").filter(Boolean);

    const used = new Set();
    let matches = 0;

    for (const token of e) {
      const index = h.findIndex((hToken, i) => !used.has(i) && tokenMatches(hToken, token));
      if (index !== -1) {
        used.add(index);
        matches++;
      }
    }

    return matches / Math.max(e.length, 1) >= 0.8;
  }

  function tokenMatches(heard, expected) {
    if (expected === "schluss" && heard === "ende") return true;
    return heard === expected;
  }

  function speak(text, distorted, done) {
    if (!synth) {
      done?.();
      return;
    }

    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-CH";
    u.rate = distorted ? 0.62 : 0.9;
    u.pitch = distorted ? 0.55 : 1;

    u.onend = () => done?.();
    u.onerror = () => done?.();

    synth.speak(u);
  }

  function setRadio(mode) {
    els.radioImage.src = `./img/${mode}.png`;
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function play(name) {
    const sounds = {
      click: els.sndClick,
      pttDown: els.sndPttDown,
      pttUp: els.sndPttUp,
      buzz: els.sndBuzz,
      error: els.sndError,
      success: els.sndSuccess
    };

    const a = sounds[name];
    if (!a) return;

    try {
      a.pause();
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (err) {}
  }

  function startNoise(volume = 0.25) {
    if (!els.noiseToggle.checked) return;

    try {
      els.sndNoise.volume = volume;
      els.sndNoise.currentTime = 0;
      els.sndNoise.play().catch(() => {});
    } catch (err) {}
  }

  function stopNoise() {
    try {
      els.sndNoise.pause();
      els.sndNoise.currentTime = 0;
    } catch (err) {}
  }

  function stopAllAudio() {
    stopNoise();

    if (synth) synth.cancel();

    [
      els.sndClick,
      els.sndPttDown,
      els.sndPttUp,
      els.sndBuzz,
      els.sndError,
      els.sndSuccess
    ].forEach(a => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch (err) {}
    });
  }

  function clearTimers() {
    clearTimeout(state.pcTimer);
    clearTimeout(state.pcPostTimer);
    clearTimeout(state.userStartTimer);
    clearTimeout(state.userStopTimer);
    clearTimeout(state.nextPromptTimer);

    state.pcTimer = null;
    state.pcPostTimer = null;
    state.userStartTimer = null;
    state.userStopTimer = null;
    state.nextPromptTimer = null;
  }

  function label(type) {
    const labels = {
      receive: "Angerufen werden",
      start: "Gespräch beginnen",
      end: "Gespräch beenden",
      notunderstood_pc: "PC versteht dich nicht",
      notunderstood_student: "Du verstehst den PC nicht"
    };

    return labels[type] || type;
  }

  function normalize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[.,!?;:]/g, " ")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sanitizeName(text) {
    return String(text || "")
      .replace(/[^a-zA-ZÀ-ÿäöüÄÖÜß -]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function readableKey(e) {
    if (e.code === "Space") return "Leertaste";
    if (e.code.startsWith("Key")) return e.code.replace("Key", "");
    if (e.code.startsWith("Digit")) return e.code.replace("Digit", "");
    return e.key || e.code;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  init();
})();
