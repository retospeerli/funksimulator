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
    selfCallsign: "Anna",
    pendingConversationTemplate: null,
    settingsDraft: null
  };

  const els = {
    speechSupportBadge: document.getElementById("speechSupportBadge"),
    ttsSupportBadge: document.getElementById("ttsSupportBadge"),

    openSettingsBtn: document.getElementById("openSettingsBtn"),
    settingsModal: document.getElementById("settingsModal"),
    settingsOkBtn: document.getElementById("settingsOkBtn"),
    settingsCancelBtn: document.getElementById("settingsCancelBtn"),

    studentNameInput: document.getElementById("studentNameInput"),
    noiseToggle: document.getElementById("noiseToggle"),
    autoReadToggle: document.getElementById("autoReadToggle"),
    voiceSelect: document.getElementById("voiceSelect"),
    rateRange: document.getElementById("rateRange"),
    speechVolumeRange: document.getElementById("speechVolumeRange"),
    sfxVolumeRange: document.getElementById("sfxVolumeRange"),

    assignmentModal: document.getElementById("assignmentModal"),
    assignmentTitle: document.getElementById("assignmentTitle"),
    assignmentGoal: document.getElementById("assignmentGoal"),
    assignmentLearning: document.getElementById("assignmentLearning"),
    assignmentBriefing: document.getElementById("assignmentBriefing"),
    assignmentDetails: document.getElementById("assignmentDetails"),
    assignmentChecklist: document.getElementById("assignmentChecklist"),
    assignmentHelper: document.getElementById("assignmentHelper"),
    assignmentModeChip: document.getElementById("assignmentModeChip"),
    assignmentStartBtn: document.getElementById("assignmentStartBtn"),

    modeSelect: document.getElementById("modeSelect"),
    difficultySelect: document.getElementById("difficultySelect"),
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
    applySettingsToUI();
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
    els.openSettingsBtn.addEventListener("click", openSettingsModal);
    els.settingsCancelBtn.addEventListener("click", closeSettingsModalWithoutSave);
    els.settingsOkBtn.addEventListener("click", saveSettingsAndClose);

    els.assignmentStartBtn.addEventListener("click", startPendingConversation);

    els.voiceSelect.addEventListener("change", () => {
      state.selectedVoiceName = els.voiceSelect.value;
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
      audio.volume = parseFloat(els.sfxVolumeRange.value || config.defaultSfxVolume);
      state.audioCache[key] = audio;
    });

    state.staticAudio = new Audio(config.audio.staticLow);
    state.staticAudio.loop = true;
    state.staticAudio.preload = "auto";
    state.staticAudio.volume = parseFloat(els.sfxVolumeRange.value || config.defaultSfxVolume) * 0.5;
  }

  function applySettingsToUI() {
    els.studentNameInput.value = state.selfCallsign;
    els.rateRange.value = String(config.defaultRate);
    els.speechVolumeRange.value = String(config.defaultSpeechVolume);
    els.sfxVolumeRange.value = String(config.defaultSfxVolume);
    els.autoReadToggle.checked = true;
    els.noiseToggle.checked = false;
  }

  function snapshotSettings() {
    return {
      selfCallsign: state.selfCallsign,
      noiseEnabled: els.noiseToggle.checked,
      autoRead: els.autoReadToggle.checked,
      voiceName: els.voiceSelect.value,
      rate: els.rateRange.value,
      speechVol: els.speechVolumeRange.value,
      sfxVol: els.sfxVolumeRange.value
    };
  }

  function openSettingsModal() {
    state.settingsDraft = snapshotSettings();
    els.settingsModal.classList.remove("hidden");
    els.settingsModal.setAttribute("aria-hidden", "false");
  }

  function closeSettingsModalWithoutSave() {
    if (!state.settingsDraft) {
      hideSettingsModal();
      return;
    }

    state.selfCallsign = state.settingsDraft.selfCallsign;
    els.studentNameInput.value = state.settingsDraft.selfCallsign;
    els.noiseToggle.checked = state.settingsDraft.noiseEnabled;
    els.autoReadToggle.checked = state.settingsDraft.autoRead;
    els.voiceSelect.value = state.settingsDraft.voiceName;
    els.rateRange.value = state.settingsDraft.rate;
    els.speechVolumeRange.value = state.settingsDraft.speechVol;
    els.sfxVolumeRange.value = state.settingsDraft.sfxVol;
    updateAudioVolumes();
    hideSettingsModal();
  }

  function saveSettingsAndClose() {
    state.selfCallsign = sanitizeCallsign(els.studentNameInput.value) || "Anna";
    els.studentNameInput.value = state.selfCallsign;
    state.selectedVoiceName = els.voiceSelect.value;
    updateAudioVolumes();
    hideSettingsModal();
  }

  function hideSettingsModal() {
    els.settingsModal.classList.add("hidden");
    els.settingsModal.setAttribute("aria-hidden", "true");
    state.settingsDraft = null;
  }

  function updateAudioVolumes() {
    if (state.staticAudio) {
      state.staticAudio.volume = parseFloat(els.sfxVolumeRange.value) * 0.5;
    }
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

  function startStaticNoise(level = 0.5) {
    if (!els.noiseToggle.checked || !state.staticAudio) return;
    state.staticAudio.pause();
    state.staticAudio.currentTime = 0;
    state.staticAudio.volume = parseFloat(els.sfxVolumeRange.value) * level;
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
    state.pendingConversationTemplate = chosen;
    state.usedScenarioIds.add(chosen.id);
    state.currentConversationIndex += 1;

    els.progressText.textContent = `${state.currentConversationIndex} / ${Math.min(config.maxConversationsPerSession, state.filteredScenarios.length)}`;
    openAssignmentCard(chosen);
  }

  function openAssignmentCard(template) {
    const assignment = template.assignment || {};
    els.assignmentTitle.textContent = template.title || "Auftragskarte";
    els.assignmentGoal.textContent = assignment.goal || "—";
    els.assignmentLearning.textContent = assignment.learning || "—";
    els.assignmentBriefing.textContent = assignment.briefing || "—";
    els.assignmentDetails.textContent = assignment.details || "—";
    els.assignmentModeChip.textContent = modeLabel(template.mode);

    renderChecklist(template.mode);
    renderHelper(template.mode);

    els.assignmentModal.classList.remove("hidden");
    els.assignmentModal.setAttribute("aria-hidden", "false");
  }

  function renderChecklist(mode) {
    const itemsByMode = {
      receive: [
        "Ich höre zuerst genau zu.",
        "Ich antworte mit dem richtigen Rufnamen.",
        "Ich beende das Gespräch sauber."
      ],
      start: [
        "Ich nenne zuerst, wen ich rufe.",
        "Dann sage ich „von“ und meinen Rufnamen.",
        "Danach funke ich die Meldung kurz und klar."
      ],
      end: [
        "Ich höre den letzten Funkspruch genau.",
        "Ich benutze die richtige Schlussformel.",
        "Ich beende das Gespräch eindeutig."
      ],
      notunderstood_pc: [
        "Ich funke zuerst die normale Meldung.",
        "Wenn der PC es nicht versteht, beginne ich mit „Ich wiederhole“.",
        "Ich wiederhole die ganze Meldung sauber."
      ],
      notunderstood_student: [
        "Ich rate nicht.",
        "Wenn ich nichts verstehe, verlange ich korrekt eine Wiederholung.",
        "Danach bestätige ich sauber."
      ]
    };

    els.assignmentChecklist.innerHTML = "";
    const items = itemsByMode[mode] || [];

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      els.assignmentChecklist.appendChild(li);
    });
  }

  function renderHelper(mode) {
    const helperSets = {
      receive: [
        { label: "Antwort auf Anruf", text: "Bruno von Anna, verstanden, antworten" },
        { label: "Sauber beenden", text: "Richtig, Schluss" }
      ],
      start: [
        { label: "Gespräch eröffnen", text: "Bruno von Anna, antworten" },
        { label: "Meldung funken", text: "Treffpunkt … um … , antworten" }
      ],
      end: [
        { label: "Gespräch abschliessen", text: "Richtig, Schluss" },
        { label: "Letztes Wort", text: "Schluss" }
      ],
      notunderstood_pc: [
        { label: "Normale Meldung", text: "Treffpunkt … um … , antworten" },
        { label: "Wiederholung", text: "Ich wiederhole, Treffpunkt … um … , antworten" }
      ],
      notunderstood_student: [
        { label: "Wiederholung verlangen", text: "Nicht verstanden, wiederholen, antworten" },
        { label: "Danach bestätigen", text: "Richtig, Schluss" }
      ]
    };

    els.assignmentHelper.innerHTML = "";
    const set = helperSets[mode] || [];

    set.forEach((entry) => {
      const wrapper = document.createElement("div");
      wrapper.className = "helper-item";

      const label = document.createElement("span");
      label.className = "helper-label";
      label.textContent = entry.label;

      const text = document.createElement("span");
      text.className = "helper-text";
      text.textContent = entry.text;

      wrapper.appendChild(label);
      wrapper.appendChild(text);
      els.assignmentHelper.appendChild(wrapper);
    });
  }

  function startPendingConversation() {
    if (!state.pendingConversationTemplate) return;

    els.assignmentModal.classList.add("hidden");
    els.assignmentModal.setAttribute("aria-hidden", "true");

    const chosen = state.pendingConversationTemplate;
    state.currentConversation = buildConversation(chosen, state.selfCallsign);
    state.currentStepIndex = 0;
    state.transcriptFinal = "";
    state.pendingConversationTemplate = null;

    els.taskModeText.textContent = `${chosen.title} · ${difficultyLabel(chosen.difficulty)}`;
    els.situationText.textContent = chosen.situation || "—";
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
      els.taskText.textContent = step.distorted ? "Gestörte Funkmeldung …" : "Höre genau zu. Danach funke deine Antwort.";
      els.conversationStatus.textContent = "Die Gegenstation spricht.";
      if (autoSpeak && els.autoReadToggle.checked) {
        speakIncoming(step);
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
      speakIncoming(step);
    }
  }

  function speakPrompt(text) {
    setReceiveState(true);
    setTimeout(() => {
      speakText(text, { distorted: false }, () => {
        setReceiveState(false);
        els.conversationStatus.textContent = "Jetzt bist du am Zug.";
      });
    }, 100);
  }

  function speakIncoming(step) {
    playSfx("incoming");
    setReceiveState(true);

    const shownText = step.distorted ? "Gestörte Funkmeldung …" : step.text;
    els.taskText.textContent = shownText;

    setTimeout(() => {
      speakText(step.text, {
        distorted: !!step.distorted,
        distortedSpeakText: step.distortedSpeakText || ""
      }, () => {
        setReceiveState(false);
        els.conversationStatus.textContent = "Jetzt antworte mit der Sprechtaste.";
      });
    }, 180);
  }

  function speakText(text, options = {}, onEnd) {
    if (!state.ttsSupported) {
      if (typeof onEnd === "function") onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    stopStaticNoise();

    const distorted = !!options.distorted;
    const speakContent = distorted && options.distortedSpeakText
      ? options.distortedSpeakText
      : text;

    const utterance = new SpeechSynthesisUtterance(speakContent);
    utterance.lang = config.language;
    utterance.rate = distorted ? 0.62 : parseFloat(els.rateRange.value);
    utterance.pitch = distorted ? 0.55 : config.defaultPitch;
    utterance.volume = parseFloat(els.speechVolumeRange.value);

    const selectedVoice = findVoiceForSpeech(distorted);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    if (distorted) {
      startStaticNoise(0.95);
    }

    utterance.onend = () => {
      stopStaticNoise();
      if (typeof onEnd === "function") onEnd();
    };

    utterance.onerror = () => {
      stopStaticNoise();
      if (typeof onEnd === "function") onEnd();
    };

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
    startStaticNoise(0.35);

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

    runAutomaticPcSteps();
  }

  function runAutomaticPcSteps() {
    const step = getCurrentStep();

    if (!step) {
      finishConversation();
      return;
    }

    if (step.role === "pc") {
      speakIncoming(step);
      const spokenLength = estimateSpeechDuration(step.distorted ? (step.distortedSpeakText || step.text) : step.text) + 250;

      setTimeout(() => {
        state.currentStepIndex += 1;
        runAutomaticPcSteps();
      }, spokenLength);
      return;
    }

    if (step.role === "instruction") {
      presentCurrentStep(true);
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
    speakText(summary, { distorted: false });
  }

  function showSolution() {
    const step = getCurrentStep();
    if (!step || step.role !== "student") return;

    const solution = `Eine passende Lösung ist: ${step.expectedResponse}`;
    setFeedback(solution, "partial");
    speakText(step.expectedResponse, { distorted: false });
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

      if (typeof nextStep.distortedSpeakText === "string") {
        nextStep.distortedSpeakText = replaceSelfPlaceholder(nextStep.distortedSpeakText, selfCallsign);
      }

      if (typeof nextStep.expectedResponse === "string") {
        nextStep.expectedResponse = replaceSelfPlaceholder(nextStep.expectedResponse, selfCallsign);
      }

      if (nextStep.evaluation) {
        const evalClone = JSON.parse(JSON.stringify(nextStep.evaluation));
        evalClone.requiredAny = (evalClone.requiredAny || []).map((item) => replaceSelfPlaceholder(item, selfCallsign));
        evalClone.requiredClosingAny = (evalClone.requiredClosingAny || []).map((item) => replaceSelfPlaceholder(item, selfCallsign));
        evalClone.requiredNumberAny = (evalClone.requiredNumberAny || []).map((item) => replaceSelfPlaceholder(item, selfCallsign));
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

  function modeLabel(mode) {
    if (mode === "receive") return "Angerufen werden";
    if (mode === "start") return "Gespräch beginnen";
    if (mode === "end") return "Gespräch beenden";
    if (mode === "notunderstood_pc") return "PC versteht dich nicht";
    if (mode === "notunderstood_student") return "Du verstehst den PC nicht";
    return "Training";
  }

  function estimateSpeechDuration(text) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1400, words * 480);
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
    state.pendingConversationTemplate = null;
    state.currentConversationIndex = 0;
    state.currentStepIndex = 0;
    state.usedScenarioIds.clear();
    state.transcriptFinal = "";
    state.score.correct = 0;
    state.score.partial = 0;
    state.score.wrong = 0;
    updateScoreUI();

    els.taskModeText.textContent = "Noch kein Training gestartet";
    els.taskText.textContent = "Starte links ein neues Gespräch. Vor jedem Gespräch erscheint zuerst eine Auftragskarte.";
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
