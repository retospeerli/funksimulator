(() => {
  "use strict";

  const config = window.APP_CONFIG;
  const scenarios = window.SCENARIOS;

  const state = {
    voices: [],
    selectedVoiceName: "",
    sessionActive: false,
    filteredScenarios: [],
    usedScenarioIds: new Set(),
    currentScenario: null,
    currentIndex: 0,
    score: {
      correct: 0,
      partial: 0,
      wrong: 0
    },
    recognitionSupported: false,
    ttsSupported: "speechSynthesis" in window,
    recognition: null,
    isRecognizing: false,
    transcriptFinal: "",
    staticAudio: null,
    audioCache: {},
    pttPressed: false
  };

  const els = {
    speechSupportBadge: document.getElementById("speechSupportBadge"),
    ttsSupportBadge: document.getElementById("ttsSupportBadge"),
    studentNameInput: document.getElementById("studentNameInput"),
    modeSelect: document.getElementById("modeSelect"),
    difficultySelect: document.getElementById("difficultySelect"),
    noiseToggle: document.getElementById("noiseToggle"),
    autoReadToggle: document.getElementById("autoReadToggle"),
    voiceSelect: document.getElementById("voiceSelect"),
    rateRange: document.getElementById("rateRange"),
    speechVolumeRange: document.getElementById("speechVolumeRange"),
    sfxVolumeRange: document.getElementById("sfxVolumeRange"),
    startSessionBtn: document.getElementById("startSessionBtn"),
    nextTaskBtn: document.getElementById("nextTaskBtn"),
    repeatTaskBtn: document.getElementById("repeatTaskBtn"),
    showSolutionBtn: document.getElementById("showSolutionBtn"),
    resetBtn: document.getElementById("resetBtn"),
    taskModeText: document.getElementById("taskModeText"),
    taskText: document.getElementById("taskText"),
    transcriptBox: document.getElementById("transcriptBox"),
    feedbackBox: document.getElementById("feedbackBox"),
    progressText: document.getElementById("progressText"),
    pttButton: document.getElementById("pttButton"),
    pttHint: document.getElementById("pttHint"),
    ledReceive: document.getElementById("ledReceive"),
    ledSend: document.getElementById("ledSend"),
    scoreCorrect: document.getElementById("scoreCorrect"),
    scorePartial: document.getElementById("scorePartial"),
    scoreWrong: document.getElementById("scoreWrong")
  };

  function init() {
    setupSupportBadges();
    setupVoices();
    setupRecognition();
    setupEvents();
    preloadAudio();
    updateScoreUI();
  }

  function setupSupportBadges() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    state.recognitionSupported = !!SpeechRecognition;

    if (state.recognitionSupported) {
      els.speechSupportBadge.textContent = "Spracherkennung verfügbar";
      els.speechSupportBadge.classList.add("ok");
    } else {
      els.speechSupportBadge.textContent = "Spracherkennung nicht verfügbar";
      els.speechSupportBadge.classList.add("error");
    }

    if (state.ttsSupported) {
      els.ttsSupportBadge.textContent = "Text-to-Speech verfügbar";
      els.ttsSupportBadge.classList.add("ok");
    } else {
      els.ttsSupportBadge.textContent = "Text-to-Speech nicht verfügbar";
      els.ttsSupportBadge.classList.add("error");
    }
  }

  function setupVoices() {
    if (!state.ttsSupported) {
      els.voiceSelect.innerHTML = `<option value="">Keine TTS-Stimme verfügbar</option>`;
      return;
    }

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      state.voices = voices;

      els.voiceSelect.innerHTML = "";

      voices
        .filter((voice) => voice.lang.toLowerCase().startsWith("de"))
        .forEach((voice) => {
          const option = document.createElement("option");
          option.value = voice.name;
          option.textContent = `${voice.name} (${voice.lang})`;
          els.voiceSelect.appendChild(option);
        });

      if (!els.voiceSelect.options.length) {
        voices.forEach((voice) => {
          const option = document.createElement("option");
          option.value = voice.name;
          option.textContent = `${voice.name} (${voice.lang})`;
          els.voiceSelect.appendChild(option);
        });
      }

      const preferred = choosePreferredVoice();
      if (preferred) {
        els.voiceSelect.value = preferred.name;
        state.selectedVoiceName = preferred.name;
      } else if (els.voiceSelect.options.length > 0) {
        state.selectedVoiceName = els.voiceSelect.value;
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function choosePreferredVoice() {
    const germanVoices = state.voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith("de")
    );

    const ranked = germanVoices.find((voice) => {
      const name = voice.name.toLowerCase();
      return config.preferredVoiceKeywords.some((keyword) =>
        name.includes(keyword)
      );
    });

    return ranked || germanVoices[0] || state.voices[0] || null;
  }

  function setupRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = config.recognitionLanguage;
    recognition.interimResults = config.useInterimResults;
    recognition.continuous = config.continuousRecognition;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      state.isRecognizing = true;
      setSendState(true);
      els.pttHint.textContent = "Sprich jetzt klar in das Mikrofon.";
      els.transcriptBox.textContent = "Höre zu …";
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = state.transcriptFinal;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const spoken = result[0]?.transcript?.trim() || "";

        if (result.isFinal) {
          finalTranscript += ` ${spoken}`;
        } else {
          interimTranscript += ` ${spoken}`;
        }
      }

      finalTranscript = finalTranscript.trim();
      interimTranscript = interimTranscript.trim();

      state.transcriptFinal = finalTranscript;

      els.transcriptBox.textContent =
        (finalTranscript + (interimTranscript ? ` ${interimTranscript}` : "")).trim() || "—";
    };

    recognition.onerror = (event) => {
      state.isRecognizing = false;
      setSendState(false);

      if (event.error === "not-allowed") {
        setFeedback(
          "Bitte erlaube den Zugriff auf das Mikrofon. Ohne Mikrofon kann die App den Funkspruch nicht prüfen.",
          "bad"
        );
      } else if (event.error === "no-speech") {
        setFeedback(
          "Ich habe keine Sprache erkannt. Drücke die Sprechtaste und sprich klar und ruhig.",
          "partial"
        );
      } else {
        setFeedback(
          `Spracherkennungs-Fehler: ${event.error}. Versuche es noch einmal.`,
          "bad"
        );
      }

      stopStaticNoise();
      stopPttVisual();
    };

    recognition.onend = () => {
      const wasRecognizing = state.isRecognizing;
      state.isRecognizing = false;
      setSendState(false);
      stopStaticNoise();
      stopPttVisual();

      if (wasRecognizing) {
        evaluateCurrentTranscript();
      }
    };

    state.recognition = recognition;
  }

  function setupEvents() {
    els.voiceSelect.addEventListener("change", () => {
      state.selectedVoiceName = els.voiceSelect.value;
    });

    els.startSessionBtn.addEventListener("click", startSession);
    els.nextTaskBtn.addEventListener("click", nextScenario);
    els.repeatTaskBtn.addEventListener("click", repeatCurrentTask);
    els.showSolutionBtn.addEventListener("click", showSolution);
    els.resetBtn.addEventListener("click", resetApp);

    els.pttButton.addEventListener("mousedown", handlePttPress);
    els.pttButton.addEventListener("touchstart", handlePttPress, { passive: false });

    window.addEventListener("mouseup", handlePttRelease);
    window.addEventListener("touchend", handlePttRelease);

    els.pttButton.addEventListener("mouseleave", () => {
      if (state.pttPressed) {
        handlePttRelease();
      }
    });
  }

  function preloadAudio() {
    Object.entries(config.audio).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.volume = parseFloat(els.sfxVolumeRange.value);
      state.audioCache[key] = audio;
    });

    state.staticAudio = new Audio(config.audio.staticLow);
    state.staticAudio.loop = true;
    state.staticAudio.preload = "auto";
    state.staticAudio.volume = parseFloat(els.sfxVolumeRange.value) * 0.35;
  }

  function playSfx(name) {
    const source = state.audioCache[name];
    if (!source) return;

    try {
      const audio = source.cloneNode();
      audio.volume = parseFloat(els.sfxVolumeRange.value);
      audio.play().catch(() => {});
    } catch (error) {
      console.warn("Audio konnte nicht abgespielt werden:", name, error);
    }
  }

  function startStaticNoise() {
    if (!els.noiseToggle.checked || !state.staticAudio) return;

    state.staticAudio.pause();
    state.staticAudio.currentTime = 0;
    state.staticAudio.volume = parseFloat(els.sfxVolumeRange.value) * 0.35;
    state.staticAudio.play().catch(() => {});
  }

  function stopStaticNoise() {
    if (!state.staticAudio) return;
    state.staticAudio.pause();
    state.staticAudio.currentTime = 0;
  }

  function startSession() {
    const mode = els.modeSelect.value;
    const difficulty = els.difficultySelect.value;

    state.filteredScenarios = scenarios.filter(
      (scenario) =>
        scenario.mode === mode && scenario.difficulty === difficulty
    );

    if (!state.filteredScenarios.length) {
      setFeedback(
        "Für diese Kombination aus Modus und Schwierigkeit gibt es noch keine Aufgaben.",
        "bad"
      );
      return;
    }

    state.sessionActive = true;
    state.usedScenarioIds.clear();
    state.currentIndex = 0;
    state.score.correct = 0;
    state.score.partial = 0;
    state.score.wrong = 0;
    updateScoreUI();

    els.nextTaskBtn.disabled = false;
    els.repeatTaskBtn.disabled = false;
    els.showSolutionBtn.disabled = false;
    els.pttButton.disabled = !state.recognitionSupported;

    nextScenario();
  }

  function nextScenario() {
    if (!state.sessionActive) return;

    const available = state.filteredScenarios.filter(
      (scenario) => !state.usedScenarioIds.has(scenario.id)
    );

    if (!available.length || state.currentIndex >= config.maxTasksPerSession) {
      finishSession();
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const scenario = available[randomIndex];

    state.currentScenario = scenario;
    state.usedScenarioIds.add(scenario.id);
    state.currentIndex += 1;
    state.transcriptFinal = "";

    els.taskModeText.textContent = `${scenario.title} · ${difficultyLabel(scenario.difficulty)}`;
    els.taskText.textContent = scenario.promptText;
    els.transcriptBox.textContent = "—";
    setFeedback("Drücke die Sprechtaste und funke sauber.", "neutral");
    els.progressText.textContent = `${state.currentIndex} / ${Math.min(config.maxTasksPerSession, state.filteredScenarios.length)}`;

    if (els.autoReadToggle.checked) {
      speakScenarioPrompt(scenario);
    }
  }

  function finishSession() {
    state.sessionActive = false;
    state.currentScenario = null;
    els.taskModeText.textContent = "Training abgeschlossen";
    els.taskText.textContent = "Gut gemacht. Du kannst links ein neues Training starten.";
    els.transcriptBox.textContent = "—";
    els.pttButton.disabled = true;
    els.nextTaskBtn.disabled = true;
    els.repeatTaskBtn.disabled = true;
    els.showSolutionBtn.disabled = true;
    playSfx("roundComplete");

    const summary = `Training fertig. Richtig: ${state.score.correct}, teilweise richtig: ${state.score.partial}, noch falsch: ${state.score.wrong}.`;
    setFeedback(summary, "good");
    speakText(summary);
  }

  function repeatCurrentTask() {
    if (!state.currentScenario) return;
    speakScenarioPrompt(state.currentScenario);
  }

  function showSolution() {
    if (!state.currentScenario) return;

    const solution = `Eine mögliche gute Lösung ist: ${state.currentScenario.solutionText}`;
    setFeedback(solution, "partial");
    speakText(state.currentScenario.solutionText);
  }

  function speakScenarioPrompt(scenario) {
    playSfx("incoming");
    setReceiveState(true);

    setTimeout(() => {
      speakText(scenario.promptText, () => {
        setReceiveState(false);
      });
    }, 180);
  }

  function speakText(text, onEnd) {
    if (!state.ttsSupported) {
      if (typeof onEnd === "function") onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language;
    utterance.rate = parseFloat(els.rateRange.value);
    utterance.pitch = config.defaultPitch;
    utterance.volume = parseFloat(els.speechVolumeRange.value);

    const selectedVoice = state.voices.find(
      (voice) => voice.name === els.voiceSelect.value
    );
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (typeof onEnd === "function") onEnd();
    };

    utterance.onerror = () => {
      if (typeof onEnd === "function") onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  function handlePttPress(event) {
    if (event.type === "touchstart") {
      event.preventDefault();
    }

    if (!state.sessionActive || !state.currentScenario || !state.recognitionSupported) {
      return;
    }

    if (state.isRecognizing || state.pttPressed) {
      return;
    }

    state.pttPressed = true;
    state.transcriptFinal = "";
    els.transcriptBox.textContent = "Höre zu …";
    setFeedback("Senden läuft …", "neutral");
    startPttVisual();
    playSfx("pttDown");
    startStaticNoise();

    try {
      state.recognition.lang = config.recognitionLanguage;
      state.recognition.start();
    } catch (error) {
      console.warn("Recognition start fehlgeschlagen:", error);
      setFeedback("Die Aufnahme konnte nicht gestartet werden. Versuche es noch einmal.", "bad");
      stopStaticNoise();
      stopPttVisual();
      state.pttPressed = false;
    }
  }

  function handlePttRelease() {
    if (!state.pttPressed) return;

    state.pttPressed = false;
    playSfx("pttUp");

    if (state.isRecognizing && state.recognition) {
      try {
        state.recognition.stop();
      } catch (error) {
        console.warn("Recognition stop fehlgeschlagen:", error);
      }
    } else {
      stopStaticNoise();
      stopPttVisual();
    }
  }

  function startPttVisual() {
    els.pttButton.classList.add("active");
    els.pttHint.textContent = "Senden … Sprechtaste gedrückt.";
  }

  function stopPttVisual() {
    els.pttButton.classList.remove("active");
    els.pttHint.textContent = "Bereit";
  }

  function setReceiveState(active) {
    els.ledReceive.classList.toggle("active", active);
  }

  function setSendState(active) {
    els.ledSend.classList.toggle("active", active);
  }

  function evaluateCurrentTranscript() {
    if (!state.currentScenario) return;

    const transcript = (state.transcriptFinal || "").trim();

    if (!transcript) {
      state.score.wrong += 1;
      updateScoreUI();
      playSfx("error");
      setFeedback(
        "Ich habe nichts Verständliches erkannt. Drücke die Sprechtaste und sprich klar und ruhig.",
        "bad"
      );
      return;
    }

    const result = evaluateTranscriptAgainstScenario(transcript, state.currentScenario);

    if (result.status === "correct") {
      state.score.correct += 1;
      updateScoreUI();
      playSfx("success");
      setFeedback(result.message, "good");
      speakText("Gut gefunkt.");
    } else if (result.status === "partial") {
      state.score.partial += 1;
      updateScoreUI();
      playSfx("error");
      setFeedback(result.message, "partial");
      speakText("Fast richtig.");
    } else {
      state.score.wrong += 1;
      updateScoreUI();
      playSfx("error");
      setFeedback(result.message, "bad");
      speakText("Noch nicht richtig.");
    }
  }

  function evaluateTranscriptAgainstScenario(rawTranscript, scenario) {
    const normalized = normalizeText(rawTranscript);
    const evalRules = scenario.evaluation;

    let score = 0;
    let maxScore = 0;
    let issues = [];

    if (evalRules.requiredAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evalRules.requiredAny)) {
        score += 1;
      } else {
        issues.push(evalRules.tips?.missingCore || "Wichtiger Inhalt fehlt.");
      }
    }

    if (evalRules.requiredNumberAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evalRules.requiredNumberAny)) {
        score += 1;
      } else {
        issues.push("Die Zeit- oder Zahlangabe fehlt oder wurde nicht klar erkannt.");
      }
    }

    if (evalRules.requiredClosingAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evalRules.requiredClosingAny)) {
        score += 1;
      } else {
        issues.push(evalRules.tips?.missingClosing || "Das Funkwort am Schluss fehlt.");
      }
    }

    if (evalRules.requiredOrderedAny?.length) {
      maxScore += 1;
      if (containsOrderedGroups(normalized, evalRules.requiredOrderedAny)) {
        score += 1;
      } else {
        issues.push(evalRules.tips?.missingCore || "Die Reihenfolge im Funkspruch stimmt noch nicht.");
      }
    }

    if (evalRules.preferredAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evalRules.preferredAny)) {
        score += 1;
      }
    }

    const ratio = maxScore > 0 ? score / maxScore : 0;

    if (ratio >= 0.8) {
      return {
        status: "correct",
        message: "Sehr gut. Inhalt und Funkdisziplin passen."
      };
    }

    if (ratio >= 0.45) {
      return {
        status: "partial",
        message: `Fast richtig. ${uniqueIssues(issues).join(" ")}`
      };
    }

    return {
      status: "wrong",
      message: `Noch nicht korrekt. ${uniqueIssues(issues).join(" ")}`
    };
  }

  function uniqueIssues(list) {
    return [...new Set(list.filter(Boolean))];
  }

  function containsAny(text, variants) {
    return variants.some((variant) => text.includes(normalizeText(variant)));
  }

  function containsOrderedGroups(text, orderedGroups) {
    let lastIndex = -1;

    for (const group of orderedGroups) {
      let foundIndex = -1;

      for (const variant of group) {
        const normalizedVariant = normalizeText(variant);
        const index = text.indexOf(normalizedVariant, lastIndex + 1);
        if (index !== -1) {
          foundIndex = index;
          break;
        }
      }

      if (foundIndex === -1) {
        return false;
      }

      lastIndex = foundIndex;
    }

    return true;
  }

  function normalizeText(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?¿!'"[\]\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function setFeedback(text, type = "neutral") {
    els.feedbackBox.textContent = text;
    els.feedbackBox.className = `feedback-box ${type}`;
  }

  function updateScoreUI() {
    els.scoreCorrect.textContent = String(state.score.correct);
    els.scorePartial.textContent = String(state.score.partial);
    els.scoreWrong.textContent = String(state.score.wrong);
  }

  function difficultyLabel(value) {
    if (value === "easy") return "Leicht";
    if (value === "medium") return "Mittel";
    if (value === "hard") return "Schwer";
    return value;
  }

  function resetApp() {
    window.speechSynthesis?.cancel();

    if (state.recognition && state.isRecognizing) {
      try {
        state.recognition.stop();
      } catch (error) {
        console.warn(error);
      }
    }

    stopStaticNoise();
    stopPttVisual();
    setReceiveState(false);
    setSendState(false);

    state.sessionActive = false;
    state.currentScenario = null;
    state.currentIndex = 0;
    state.usedScenarioIds.clear();
    state.transcriptFinal = "";
    state.score.correct = 0;
    state.score.partial = 0;
    state.score.wrong = 0;
    updateScoreUI();

    els.taskModeText.textContent = "Noch kein Training gestartet";
    els.taskText.textContent = "Wähle links einen Modus und starte das Training.";
    els.transcriptBox.textContent = "—";
    setFeedback("Die App achtet auf Inhalt und Funkdisziplin.", "neutral");
    els.progressText.textContent = "0 / 0";
    els.pttButton.disabled = true;
    els.nextTaskBtn.disabled = true;
    els.repeatTaskBtn.disabled = true;
    els.showSolutionBtn.disabled = true;
    els.pttHint.textContent = "Bereit";
  }

  init();
})();
