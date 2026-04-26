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

    newTaskBtn: document.getElementById("newTaskBtn"),
    startBtn: document.getElementById("startBtn"),
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
    difficultySelect: document.getElementById("difficultySelect"),
    noiseToggle: document.getElementById("noiseToggle"),

    sndButton: document.getElementById("sndButton"),
    sndBeep: document.getElementById("sndBeep"),
    sndNoise: document.getElementById("sndNoise")
  };

  const state = {
    name: "Anna",
    mode: "receive",
    difficulty: "easy",
    currentTask: null,
    step: 0,
    recognition: null,
    recognizing: false,
    finalText: "",
    pttDown: false,
    chooseKeyMode: false,
    pttCode: "Space",
    pttLabel: "Leertaste",
    voices: [],
    settingsSnapshot: null
  };

  const tasks = [
    {
      mode: "receive",
      difficulty: "easy",
      title: "Angerufen werden",
      goal: "Du lernst, wie du auf einen Funkruf korrekt antwortest und ein Gespräch sauber beendest.",
      task: "Der PC ruft dich an. Antworte korrekt. Danach hörst du Treffpunkt und Uhrzeit.",
      place: "grosser Stein",
      time: "3 Uhr",
      steps: [
        { pc: "{SELF} von Bruno, antworten" },
        { user: "Bruno von {SELF}, verstanden, antworten" },
        { pc: "Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { user: "Richtig, Schluss" },
        { pc: "Schluss" }
      ]
    },
    {
      mode: "start",
      difficulty: "easy",
      title: "Gespräch beginnen",
      goal: "Du lernst, wie du ein Funkgespräch korrekt eröffnest.",
      task: "Rufe Bruno. Teile dann Treffpunkt und Uhrzeit mit.",
      place: "grosser Stein",
      time: "3 Uhr",
      steps: [
        { user: "Bruno von {SELF}, antworten" },
        { pc: "{SELF} von Bruno, verstanden, antworten" },
        { pc: "Wo und wann treffen wir uns? antworten" },
        { user: "Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { pc: "Richtig, Schluss" },
        { user: "Schluss" }
      ]
    },
    {
      mode: "notunderstood_pc",
      difficulty: "easy",
      title: "PC versteht dich nicht",
      goal: "Du lernst, wie du korrekt wiederholst, wenn die Gegenstation dich nicht verstanden hat.",
      task: "Nenne Treffpunkt und Uhrzeit. Danach verlangt der PC eine Wiederholung.",
      place: "alter Baum",
      time: "3 Uhr",
      steps: [
        { pc: "{SELF} von Bruno, verstanden, wo und wann treffen wir uns? antworten" },
        { user: "Treffpunkt beim alten Baum um drei Uhr, antworten" },
        { pc: "Nicht verstanden, wiederholen, antworten" },
        { user: "Ich wiederhole, Treffpunkt beim alten Baum um drei Uhr, antworten" },
        { pc: "Richtig, Schluss" },
        { user: "Schluss" }
      ]
    },
    {
      mode: "notunderstood_student",
      difficulty: "easy",
      title: "Du verstehst den PC nicht",
      goal: "Du lernst, wann du „Nicht verstanden, wiederholen, antworten“ sagen musst.",
      task: "Der PC spricht zuerst absichtlich gestört. Verlange korrekt eine Wiederholung.",
      place: "nicht hörbar",
      time: "nicht hörbar",
      steps: [
        {
          pc: "Treffpunkt beim grossen Stein um drei Uhr, antworten",
          distorted: true,
          distortedText: "krrr ... gromm ... schtai ... drii ... antworr ... krr"
        },
        { user: "Nicht verstanden, wiederholen, antworten" },
        { pc: "Ich wiederhole, Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { user: "Richtig, Schluss" },
        { pc: "Schluss" }
      ]
    },
    {
      mode: "receive",
      difficulty: "medium",
      title: "Angerufen werden",
      goal: "Du übst das korrekte Antworten mit einer anderen Meldung.",
      task: "Der PC ruft dich an. Antworte korrekt und schliesse sauber ab.",
      place: "rote Bank",
      time: "halb vier",
      steps: [
        { pc: "{SELF} von Mia, antworten" },
        { user: "Mia von {SELF}, verstanden, antworten" },
        { pc: "Treffpunkt bei der roten Bank um halb vier, antworten" },
        { user: "Richtig, Schluss" },
        { pc: "Schluss" }
      ]
    },
    {
      mode: "start",
      difficulty: "medium",
      title: "Gespräch beginnen",
      goal: "Du übst, ein Gespräch zu beginnen und präzise Angaben zu machen.",
      task: "Rufe Mia. Teile Treffpunkt und Uhrzeit mit.",
      place: "rote Bank",
      time: "halb vier",
      steps: [
        { user: "Mia von {SELF}, antworten" },
        { pc: "{SELF} von Mia, verstanden, antworten" },
        { pc: "Wo und wann treffen wir uns? antworten" },
        { user: "Treffpunkt bei der roten Bank um halb vier, antworten" },
        { pc: "Richtig, Schluss" },
        { user: "Schluss" }
      ]
    }
  ];

  function init() {
    if (!SpeechRecognition) {
      els.feedbackText.textContent = "Dieser Browser unterstützt keine Spracherkennung.";
      els.pttBtn.disabled = true;
    } else {
      setupRecognition();
    }

    setupVoices();
    bindEvents();
    setRadio("standby");
    setStatus("Bereit");
    loadNewTask();
  }

  function setupVoices() {
    if (!synth) return;

    const load = () => {
      state.voices = synth.getVoices();
    };

    load();
    synth.onvoiceschanged = load;
  }

  function setupRecognition() {
    const recognition = new SpeechRecognition();
    recognition.lang = "de-CH";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      state.recognizing = true;
      state.finalText = "";
      els.heardText.textContent = "Ich höre zu …";
      setStatus("Senden");
      setRadio("send");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = state.finalText;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          final += (final ? " " : "") + text;
        } else {
          interim += (interim ? " " : "") + text;
        }
      }

      state.finalText = final.trim();
      els.heardText.textContent = [state.finalText, interim].filter(Boolean).join(" ") || "Ich höre zu …";
    };

    recognition.onerror = () => {
      state.recognizing = false;
      setStatus("Bereit");
      setRadio("standby");
      stopNoise();
    };

    recognition.onend = () => {
      const text = state.finalText.trim();
      state.recognizing = false;
      setStatus("Bereit");
      setRadio("standby");
      stopNoise();

      if (text) {
        checkAnswer(text);
      } else {
        els.feedbackText.textContent = "Nichts erkannt. Versuche es noch einmal.";
      }
    };

    state.recognition = recognition;
  }

  function bindEvents() {
    els.newTaskBtn.addEventListener("click", loadNewTask);
    els.startBtn.addEventListener("click", startTask);

    els.pttBtn.addEventListener("mousedown", startPtt);
    els.pttBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startPtt();
    }, { passive: false });

    window.addEventListener("mouseup", stopPtt);
    window.addEventListener("touchend", stopPtt);

    window.addEventListener("keydown", (e) => {
      if (state.chooseKeyMode) {
        e.preventDefault();
        state.pttCode = e.code;
        state.pttLabel = readableKey(e);
        els.keyName.textContent = state.pttLabel;
        state.chooseKeyMode = false;
        els.chooseKeyBtn.textContent = "Taste definieren";
        return;
      }

      if (e.code === state.pttCode && !state.pttDown) {
        e.preventDefault();
        startPtt();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === state.pttCode) {
        e.preventDefault();
        stopPtt();
      }
    });

    els.chooseKeyBtn.addEventListener("click", () => {
      state.chooseKeyMode = true;
      els.chooseKeyBtn.textContent = "Taste drücken …";
    });

    els.helpBtn.addEventListener("click", () => els.helpDialog.showModal());
    els.closeHelpBtn.addEventListener("click", () => els.helpDialog.close());

    els.settingsBtn.addEventListener("click", openSettings);
    els.cancelSettingsBtn.addEventListener("click", cancelSettings);
    els.okSettingsBtn.addEventListener("click", saveSettings);
  }

  function openSettings() {
    state.settingsSnapshot = {
      name: state.name,
      mode: state.mode,
      difficulty: state.difficulty,
      noise: els.noiseToggle.checked
    };

    els.nameInput.value = state.name;
    els.modeSelect.value = state.mode;
    els.difficultySelect.value = state.difficulty;
    els.settingsDialog.showModal();
  }

  function cancelSettings() {
    if (state.settingsSnapshot) {
      state.name = state.settingsSnapshot.name;
      state.mode = state.settingsSnapshot.mode;
      state.difficulty = state.settingsSnapshot.difficulty;
      els.noiseToggle.checked = state.settingsSnapshot.noise;
    }
    els.settingsDialog.close();
  }

  function saveSettings() {
    state.name = sanitizeName(els.nameInput.value) || "Anna";
    state.mode = els.modeSelect.value;
    state.difficulty = els.difficultySelect.value;
    els.settingsDialog.close();
    loadNewTask();
  }

  function loadNewTask() {
    const pool = tasks.filter(t => t.mode === state.mode && t.difficulty === state.difficulty);
    state.currentTask = clone(pool[Math.floor(Math.random() * pool.length)] || tasks[0]);
    state.step = 0;

    els.goalText.textContent = state.currentTask.goal;
    els.taskText.textContent = state.currentTask.task;
    els.placeText.textContent = state.currentTask.place;
    els.timeText.textContent = state.currentTask.time;
    els.feedbackText.textContent = "Lies die Auftragskarte. Dann klicke auf Loslegen.";
    els.heardText.textContent = "Noch keine Aufnahme.";
    els.startBtn.disabled = false;
    els.pttBtn.disabled = true;
    setStatus("Auftrag bereit");
    setRadio("standby");
  }

  function startTask() {
    els.startBtn.disabled = true;
    els.pttBtn.disabled = false;
    els.feedbackText.textContent = "Das Gespräch läuft.";
    runStep();
  }

  function runStep() {
    const step = getStep();

    if (!step) {
      finishTask();
      return;
    }

    if (step.pc) {
      speakPc(step);
      return;
    }

    if (step.user) {
      els.feedbackText.textContent = "Du bist dran. Sprechtaste gedrückt halten.";
      setStatus("Warten auf deinen Funkspruch");
      setRadio("standby");
    }
  }

  function speakPc(step) {
    const line = fill(step.pc);
    const spoken = step.distorted ? (step.distortedText || line) : line;

    setStatus("Empfangen");
    setRadio("receive");
    playSound("button");

    if (step.distorted) startNoise(0.9);

    speak(spoken, step.distorted, () => {
      stopNoise();
      state.step++;
      setStatus("Bereit");
      setRadio("standby");
      runStep();
    });
  }

  function startPtt() {
    const step = getStep();
    if (!step || !step.user || state.pttDown || !state.recognition) return;

    state.pttDown = true;
    els.pttBtn.classList.add("active");
    playSound("button");
    setRadio("send");
    setStatus("Senden");
    startNoise(0.25);

    try {
      state.recognition.start();
    } catch (err) {}
  }

  function stopPtt() {
    if (!state.pttDown) return;

    state.pttDown = false;
    els.pttBtn.classList.remove("active");
    playSound("beep");

    if (state.recognizing) {
      try {
        state.recognition.stop();
      } catch (err) {}
    } else {
      stopNoise();
      setStatus("Bereit");
      setRadio("standby");
    }
  }

  function checkAnswer(heard) {
    const expected = fill(getStep().user);
    const result = compare(heard, expected);

    if (result.ok) {
      els.feedbackText.textContent = "Richtig. Der Funkverkehr geht weiter.";
      state.step++;
      setTimeout(runStep, 600);
    } else {
      els.feedbackText.textContent = `Noch nicht korrekt. Erwartet: ${expected}`;
    }
  }

  function finishTask() {
    setStatus("Gespräch beendet");
    setRadio("standby");
    els.feedbackText.textContent = "Gespräch abgeschlossen. Klicke auf Neue Aufgabe.";
    els.pttBtn.disabled = true;
  }

  function speak(text, distorted, onEnd) {
    if (!synth) {
      onEnd?.();
      return;
    }

    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-CH";
    u.rate = distorted ? 0.62 : 0.9;
    u.pitch = distorted ? 0.55 : 1;
    u.volume = 1;

    const voice = findVoice(distorted);
    if (voice) u.voice = voice;

    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();

    synth.speak(u);
  }

  function findVoice(distorted) {
    const german = state.voices.filter(v => /^de/i.test(v.lang));
    if (!german.length) return null;
    if (!distorted) return german[0];
    return german[1] || german[0];
  }

  function setRadio(mode) {
    const map = {
      standby: "img/standby.png",
      receive: "img/receive.png",
      send: "img/send.png"
    };

    els.radioImage.classList.add("switching");
    setTimeout(() => {
      els.radioImage.src = map[mode] || map.standby;
      els.radioImage.classList.remove("switching");
    }, 60);
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function playSound(name) {
    const el = name === "button" ? els.sndButton : els.sndBeep;
    try {
      el.pause();
      el.currentTime = 0;
      el.play().catch(() => {});
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

  function getStep() {
    return state.currentTask?.steps?.[state.step] || null;
  }

  function fill(text) {
    return String(text).replaceAll("{SELF}", state.name);
  }

  function compare(heard, expected) {
    const h = tokenize(heard);
    const e = tokenize(expected);

    let matches = 0;
    e.forEach(token => {
      if (h.includes(token)) matches++;
    });

    return {
      ok: matches / Math.max(e.length, 1) >= 0.8
    };
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter(Boolean);
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

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  init();
})();
