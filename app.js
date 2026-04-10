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
    currentConversation: null,
    currentConversationIndex: 0,
    currentStepIndex: 0,
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
    pttPressed: false,
    selfCallsign: "Anna"
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
    stepText: document.getElementById("stepText"),
    situationText: document.getElementById("situationText"),
    transcriptBox: document.getElementById("transcriptBox"),
    feedbackBox: document.getElementById("feedbackBox"),
    progressText: document.getElementById("progressText"),
    pttButton: document.getElementById("pttButton"),
    pttHint: document.getElementById("pttHint"),
    ledReceive: document.getElementById("ledReceive"),
    ledSend: document.getElementById("ledSend"),
    scoreCorrect: document.getElementById("scoreCorrect"),
    scorePartial: document.getElementById("scorePartial"),
    scoreWrong: document.getElementById("scoreWrong"),
    conversationStatus: document.getElementById("conversationStatus")
  };

  function init() {
    setupSupportBadges();
    setupVoices();
    setupRecognition();
    setupEvents();
    preloadAudio();
    updateScoreUI();
    els.studentNameInput.value = state.selfCallsign;
  }

  function setupSupportBadges() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

      const germanVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("de"));
      const usable = germanVoices.length ? germanVoices : voices;

      usable.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        els.voiceSelect.appendChild(option);
      });

      const preferred = choosePreferredVoice();
      if (preferred) {
        els.voiceSelect.value = preferred.name;
        state.selectedVoiceName = preferred.name;
      } else if (els.voiceSelect.options.length) {
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
      return config.preferredVoiceKeywords.some((keyword) => name.includes(keyword));
    });

    return ranked || germanVoices[0] || state.voices[0] || null;
  }

  function setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = config.recognitionLanguage;
    recognition.interimResults = config.useInterimResults;
    recognition.continuous = config.continuousRecognition;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      state.isRecognizing = true;
      setSendState(true);
      els.pttHint.textContent = "Senden läuft …";
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
      stopStaticNoise();
      stopPttVisual();

      if (event.error === "not-allowed") {
        setFeedback("Bitte Mikrofon erlauben. Sonst kann der Funkspruch nicht geprüft werden.", "bad");
      } else if (event.error === "no-speech") {
        setFeedback("Ich habe keine Sprache erkannt. Drücke die Sprechtaste und sprich klar.", "partial");
      } else {
        setFeedback(`Spracherkennungs-Fehler: ${event.error}.`, "bad");
      }
    };

    recognition.onend = () => {
      const wasRecognizing = state.isRecognizing;
      state.isRecognizing = false;
      setSendState(false);
      stopStaticNoise();
      stopPttVisual();

      if (wasRecognizing) {
        evaluateCurrentStep();
      }
    };

    state.recognition = recognition;
  }

  function setupEvents() {
    els.voiceSelect.addEventListener("change", () => {
      state.selectedVoiceName = els.voiceSelect.value;
    });

    els.studentNameInput.addEventListener("input", () => {
      state.selfCallsign = sanitizeCallsign(els.studentNameInput.value) || "Anna";
    });

    els.startSessionBtn.addEventListener("click", startSession);
    els.nextTaskBtn.addEventListener("click", nextConversation);
    els.repeatTaskBtn.addEventListener("click", repeatCurrentStepPrompt);
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
    state.selfCallsign = sanitizeCallsign(els.studentNameInput.value) || "Anna";
    els.studentNameInput.value = state.selfCallsign;

    const mode = els.modeSelect.value;
    const difficulty = els.difficultySelect.value;

    state.filteredScenarios = scenarios.filter(
      (scenario) => scenario.mode === mode && scenario.difficulty === difficulty
    );

    if (!state.filteredScenarios.length) {
      setFeedback("Für diese Auswahl gibt es noch keine Gespräche.", "bad");
      return;
    }

    state.sessionActive = true;
    state.usedScenarioIds.clear();
    state.currentConversationIndex = 0;
    state.score.correct = 0;
    state.score.partial = 0;
    state.score.wrong = 0;
    updateScoreUI();

    els.nextTaskBtn.disabled = false;
    els.repeatTaskBtn.disabled = false;
    els.showSolutionBtn.disabled = false;
    els.pttButton.disabled = !state.recognitionSupported;

    nextConversation();
  }

  function nextConversation() {
    if (!state.sessionActive) return;

    const available = state.filteredScenarios.filter(
      (scenario) => !state.usedScenarioIds.has(scenario.id)
    );

    if (!available.length || state.currentConversationIndex >= config.maxConversationsPerSession) {
      finishSession();
      return;
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    state.currentConversation = buildConversation(chosen, state.selfCallsign);
    state.usedScenarioIds.add(chosen.id);
    state.currentConversationIndex += 1;
    state.currentStepIndex = 0;
    state.transcriptFinal = "";

    els.taskModeText.textContent = `${chosen.title} · ${difficultyLabel(chosen.difficulty)}`;
    els.situationText.textContent = chosen.situation || "—";
    els.progressText.textContent = `${state.currentConversationIndex} / ${Math.min(config.maxConversationsPerSession, state.filteredScenarios.length)}`;
    els.conversationStatus.textContent = "Gespräch aktiv.";
    setFeedback("Das Gespräch startet jetzt.", "neutral");

    presentCurrentStep(true);
  }

  function presentCurrentStep(autoSpeak = true) {
    const step = getCurrentStep();
    if (!step || !state.currentConversation) return;

    const studentSteps = state.currentConversation.steps.filter((entry) => entry.role === "student").length;
    const currentStudentStep = countStudentStepsUntilIndex(state.currentConversation.steps, state.currentStepIndex);

    els.stepText.textContent = studentSteps ? `${currentStudentStep} / ${studentSteps}` : "—";
    els.transcriptBox.textContent = "—";
    state.transcriptFinal = "";

    if (step.role === "instruction") {
      els.taskText.textContent = step.text;
      els.conversationStatus.textContent = "Du musst jetzt selbst funken.";
      if (autoSpeak && els.autoReadToggle.checked) {
        speakPrompt(step.text);
      }
      return;
    }

    if (step.role === "pc") {
      els.taskText.textContent = "Höre genau zu. Danach funke deine Antwort.";
      els.conversationStatus.textContent = "Die Gegenstation spricht.";
      if (autoSpeak && els.autoReadToggle.checked) {
        speakIncoming(step.text, !!step.distorted);
      }
      return;
    }

    if (step.role === "student") {
      els.taskText.textContent = "Jetzt bist du am Zug.";
      els.conversationStatus.textContent = "Drücke die Sprechtaste und funke korrekt.";
    }
  }

  function repeatCurrentStepPrompt() {
    const step = getCurrentStep();
    if (!step) return;

    if (step.role === "instruction") {
      speakPrompt(step.text);
    } else if (step.role === "pc") {
      speakIncoming(step.text, !!step.distorted);
    }
  }

  function speakPrompt(text) {
    setReceiveState(true);
    setTimeout(() => {
      speakText(text, false, () => {
        setReceiveState(false);
        els.conversationStatus.textContent = "Jetzt bist du am Zug.";
      });
    }, 100);
  }

  function speakIncoming(text, distorted = false) {
    playSfx("incoming");
    setReceiveState(true);
    els.taskText.textContent = text;

    setTimeout(() => {
      speakText(text, distorted, () => {
        setReceiveState(false);
        els.conversationStatus.textContent = "Jetzt antworte mit der Sprechtaste.";
      });
    }, 180);
  }

  function speakText(text, distorted = false, onEnd) {
    if (!state.ttsSupported) {
      if (typeof onEnd === "function") onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    stopStaticNoise();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language;
    utterance.rate = distorted ? 0.8 : parseFloat(els.rateRange.value);
    utterance.pitch = distorted ? 0.82 : config.defaultPitch;
    utterance.volume = parseFloat(els.speechVolumeRange.value);

    const selectedVoice = findVoiceForSpeech(distorted);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    if (distorted && els.noiseToggle.checked) {
      startStaticNoise();
      utterance.onend = () => {
        stopStaticNoise();
        if (typeof onEnd === "function") onEnd();
      };
      utterance.onerror = () => {
        stopStaticNoise();
        if (typeof onEnd === "function") onEnd();
      };
    } else {
      utterance.onend = () => {
        if (typeof onEnd === "function") onEnd();
      };
      utterance.onerror = () => {
        if (typeof onEnd === "function") onEnd();
      };
    }

    window.speechSynthesis.speak(utterance);
  }

  function findVoiceForSpeech(distorted = false) {
    if (!state.voices.length) return null;

    if (!distorted) {
      return state.voices.find((voice) => voice.name === els.voiceSelect.value) || choosePreferredVoice();
    }

    const normal = state.voices.find((voice) => voice.name === els.voiceSelect.value) || choosePreferredVoice();
    return state.voices.find(
      (voice) => voice.lang.toLowerCase().startsWith("de") && (!normal || voice.name !== normal.name)
    ) || normal;
  }

  function handlePttPress(event) {
    if (event.type === "touchstart") {
      event.preventDefault();
    }

    if (!state.sessionActive || !state.currentConversation || !state.recognitionSupported) return;
    if (state.isRecognizing || state.pttPressed) return;

    const currentStep = getCurrentStep();
    if (!currentStep || currentStep.role !== "student") return;

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

  function getCurrentStep() {
    if (!state.currentConversation) return null;
    return state.currentConversation.steps[state.currentStepIndex] || null;
  }

  function evaluateCurrentStep() {
    const step = getCurrentStep();
    if (!step || step.role !== "student") return;

    const transcript = (state.transcriptFinal || "").trim();

    if (!transcript) {
      state.score.wrong += 1;
      updateScoreUI();
      playSfx("error");
      setFeedback("Ich habe nichts Verständliches erkannt. Drücke die Sprechtaste und sprich klar.", "bad");
      return;
    }

    const result = evaluateTranscript(transcript, step.evaluation);

    if (result.status === "correct") {
      state.score.correct += 1;
      updateScoreUI();
      playSfx("success");
      setFeedback(result.message, "good");
      proceedAfterCorrectStep();
      return;
    }

    if (result.status === "partial") {
      state.score.partial += 1;
      updateScoreUI();
      playSfx("error");
      setFeedback(result.message, "partial");
      return;
    }

    state.score.wrong += 1;
    updateScoreUI();
    playSfx("error");
    setFeedback(result.message, "bad");
  }

  function proceedAfterCorrectStep() {
    els.conversationStatus.textContent = "Schritt richtig gelöst.";
    state.currentStepIndex += 1;

    if (!getCurrentStep()) {
      finishConversation();
      return;
    }

    while (getCurrentStep() && getCurrentStep().role === "pc") {
      const pcStep = getCurrentStep();
      speakIncoming(pcStep.text, !!pcStep.distorted);

      const waitTime = estimateSpeechDuration(pcStep.text) + 200;
      const nextIndex = state.currentStepIndex + 1;

      setTimeout(() => {
        state.currentStepIndex = nextIndex;

        if (!getCurrentStep()) {
          finishConversation();
          return;
        }

        if (getCurrentStep().role === "pc") {
          proceedAfterCorrectStepFromPcLoop();
        } else {
          presentCurrentStep(false);
        }
      }, waitTime);

      return;
    }

    presentCurrentStep(true);
  }

  function proceedAfterCorrectStepFromPcLoop() {
    while (getCurrentStep() && getCurrentStep().role === "pc") {
      const pcStep = getCurrentStep();
      speakIncoming(pcStep.text, !!pcStep.distorted);

      const waitTime = estimateSpeechDuration(pcStep.text) + 200;
      const nextIndex = state.currentStepIndex + 1;

      setTimeout(() => {
        state.currentStepIndex = nextIndex;
        if (!getCurrentStep()) {
          finishConversation();
          return;
        }

        if (getCurrentStep().role === "pc") {
          proceedAfterCorrectStepFromPcLoop();
        } else {
          presentCurrentStep(false);
        }
      }, waitTime);

      return;
    }

    if (!getCurrentStep()) {
      finishConversation();
      return;
    }

    presentCurrentStep(false);
  }

  function finishConversation() {
    els.conversationStatus.textContent = "Gespräch abgeschlossen.";
    setFeedback("Gespräch sauber abgeschlossen. Gut gemacht.", "good");
    playSfx("success");

    if (state.currentConversationIndex >= Math.min(config.maxConversationsPerSession, state.filteredScenarios.length)) {
      setTimeout(finishSession, 800);
    } else {
      setTimeout(() => {
        els.taskText.textContent = "Dieses Gespräch ist fertig. Klicke auf „Nächstes Gespräch“.";
        els.stepText.textContent = "fertig";
      }, 300);
    }
  }

  function finishSession() {
    state.sessionActive = false;
    state.currentConversation = null;
    els.taskModeText.textContent = "Training abgeschlossen";
    els.taskText.textContent = "Gut gemacht. Du kannst links ein neues Training starten.";
    els.stepText.textContent = "—";
    els.situationText.textContent = "—";
    els.transcriptBox.textContent = "—";
    els.pttButton.disabled = true;
    els.nextTaskBtn.disabled = true;
    els.repeatTaskBtn.disabled = true;
    els.showSolutionBtn.disabled = true;
    els.conversationStatus.textContent = "Kein Gespräch aktiv.";
    playSfx("roundComplete");

    const summary = `Training fertig. Richtig: ${state.score.correct}, teilweise richtig: ${state.score.partial}, noch falsch: ${state.score.wrong}.`;
    setFeedback(summary, "good");
    speakText(summary, false);
  }

  function showSolution() {
    const step = getCurrentStep();
    if (!step || step.role !== "student") return;

    const solution = `Eine passende Lösung ist: ${step.expectedResponse}`;
    setFeedback(solution, "partial");
    speakText(step.expectedResponse, false);
  }

  function evaluateTranscript(rawTranscript, evaluationRules) {
    const normalized = normalizeText(rawTranscript);
    let score = 0;
    let maxScore = 0;
    const issues = [];

    if (evaluationRules.requiredAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evaluationRules.requiredAny)) {
        score += 1;
      } else {
        issues.push(evaluationRules.tips?.missingCore || "Wichtiger Inhalt fehlt.");
      }
    }

    if (evaluationRules.requiredNumberAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evaluationRules.requiredNumberAny)) {
        score += 1;
      } else {
        issues.push("Zeit oder Zahl fehlt oder wurde nicht klar erkannt.");
      }
    }

    if (evaluationRules.requiredClosingAny?.length) {
      maxScore += 1;
      if (containsAny(normalized, evaluationRules.requiredClosingAny)) {
        score += 1;
      } else {
        issues.push(evaluationRules.tips?.missingClosing || "Das Funkwort am Schluss fehlt.");
      }
    }

    if (evaluationRules.requiredOrderedAny?.length) {
      maxScore += 1;
      if (containsOrderedGroups(normalized, evaluationRules.requiredOrderedAny)) {
        score += 1;
      } else {
        issues.push(evaluationRules.tips?.missingCore || "Die Reihenfolge stimmt noch nicht.");
      }
    }

    const ratio = maxScore > 0 ? score / maxScore : 0;

    if (ratio >= 0.8) {
      return {
        status: "correct",
        message: "Sehr gut. Inhalt und schweizerische Funkdisziplin passen."
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

  function containsAny(text, variants) {
    return variants.some((variant) => {
      const prepared = prepareRuleVariant(variant);
      return text.includes(prepared);
    });
  }

  function containsOrderedGroups(text, orderedGroups) {
    let lastIndex = -1;

    for (const group of orderedGroups) {
      let foundIndex = -1;

      for (const variant of group) {
        const prepared = prepareRuleVariant(variant);
        const index = text.indexOf(prepared, lastIndex + 1);
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

  function prepareRuleVariant(variant) {
    return normalizeText(replaceSelfPlaceholder(String(variant), state.selfCallsign));
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

  function replaceSelfPlaceholder(text, selfCallsign) {
    return String(text).replace(/\{SELF\}|\{self\}/g, selfCallsign);
  }

  function buildConversation(template, selfCallsign) {
    const clone = JSON.parse(JSON.stringify(template));

    clone.steps = clone.steps.map((step) => {
      const nextStep = { ...step };

      if (typeof nextStep.text === "string") {
        nextStep.text = replaceSelfPlaceholder(nextStep.text, selfCallsign);
      }

      if (typeof nextStep.expectedResponse === "string") {
        nextStep.expectedResponse = replaceSelfPlaceholder(nextStep.expectedResponse, selfCallsign);
      }

      if (nextStep.evaluation) {
        const evalClone = JSON.parse(JSON.stringify(nextStep.evaluation));
        evalClone.requiredAny = (evalClone.requiredAny || []).map((item) =>
          replaceSelfPlaceholder(item, selfCallsign)
        );
        evalClone.requiredClosingAny = (evalClone.requiredClosingAny || []).map((item) =>
          replaceSelfPlaceholder(item, selfCallsign)
        );
        evalClone.requiredNumberAny = (evalClone.requiredNumberAny || []).map((item) =>
          replaceSelfPlaceholder(item, selfCallsign)
        );
        evalClone.requiredOrderedAny = (evalClone.requiredOrderedAny || []).map((group) =>
          group.map((item) => replaceSelfPlaceholder(item, selfCallsign))
        );
        nextStep.evaluation = evalClone;
      }

      return nextStep;
    });

    return clone;
  }

  function countStudentStepsUntilIndex(steps, index) {
    let count = 0;
    for (let i = 0; i <= index; i += 1) {
      if (steps[i] && steps[i].role === "student") {
        count += 1;
      }
    }
    return count || 1;
  }

  function uniqueIssues(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function sanitizeCallsign(text) {
    return String(text || "")
      .replace(/[^A-Za-zÀ-ÿÄÖÜäöüß\s-]/g, "")
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

  function estimateSpeechDuration(text) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1500, words * 420);
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
    state.currentConversation = null;
    state.currentConversationIndex = 0;
    state.currentStepIndex = 0;
    state.usedScenarioIds.clear();
    state.transcriptFinal = "";
    state.score.correct = 0;
    state.score.partial = 0;
    state.score.wrong = 0;
    updateScoreUI();

    els.taskModeText.textContent = "Noch kein Training gestartet";
    els.taskText.textContent = "Wähle links einen Modus und starte das Training.";
    els.stepText.textContent = "—";
    els.situationText.textContent = "—";
    els.transcriptBox.textContent = "—";
    els.progressText.textContent = "0 / 0";
    els.pttButton.disabled = true;
    els.nextTaskBtn.disabled = true;
    els.repeatTaskBtn.disabled = true;
    els.showSolutionBtn.disabled = true;
    els.pttHint.textContent = "Bereit";
    els.conversationStatus.textContent = "Noch kein Gespräch aktiv.";
    setFeedback("Die App prüft Reihenfolge, Inhalt und schweizerische Funkwörter.", "neutral");
  }

  init();
})();
