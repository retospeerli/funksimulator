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

    sndPttDown: document.getElementById("sndPttDown"),
    sndPttUp: document.getElementById("sndPttUp"),
    sndBuzz: document.getElementById("sndBuzz"),
    sndNoise: document.getElementById("sndNoise"),
    sndError: document.getElementById("sndError"),
    sndSuccess: document.getElementById("sndSuccess")
  };

  const state = {
    recognition: null,
    recognizing: false,
    finalText: "",
    pttDown: false,
    currentTask: null,
    step: 0
  };

  const tasks = {
    receive: {
      goal: "Du wirst angerufen und antwortest korrekt.",
      task: "Der PC ruft dich. Antworte korrekt und bestätige danach die Meldung.",
      place: "grosser Stein",
      time: "3 Uhr",
      steps: [
        { pc: "Anna von Bruno, antworten" },
        { user: "Bruno von Anna, verstanden, antworten" },

        { pc: "Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { user: "Verstanden, Treffpunkt beim grossen Stein um drei Uhr, Schluss" },

        { pc: "Schluss" }
      ]
    },

    start: {
      goal: "Du beginnst ein Funkgespräch korrekt.",
      task: "Rufe Bruno und teile Treffpunkt und Zeit mit.",
      place: "alter Baum",
      time: "4 Uhr",
      steps: [
        { user: "Bruno von Anna, antworten" },
        { pc: "Anna von Bruno, verstanden, antworten" },

        { user: "Treffpunkt beim alten Baum um vier Uhr, antworten" },
        { pc: "Verstanden, Treffpunkt beim alten Baum um vier Uhr, Schluss" },

        { user: "Schluss" }
      ]
    },

    end: {
      goal: "Du beendest ein Gespräch korrekt.",
      task: "Bestätige die letzte Meldung und schliesse korrekt ab.",
      place: "rote Bank",
      time: "halb vier",
      steps: [
        { pc: "Treffpunkt bei der roten Bank um halb vier, antworten" },
        { user: "Verstanden, Treffpunkt bei der roten Bank um halb vier, Schluss" },
        { pc: "Schluss" }
      ]
    },

    notunderstood_pc: {
      goal: "Du wiederholst korrekt, wenn du nicht verstanden wirst.",
      task: "Gib eine Meldung und wiederhole sie korrekt.",
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
      goal: "Du verlangst korrekt eine Wiederholung.",
      task: "Der PC ist unverständlich. Fordere korrekt Wiederholung.",
      place: "-",
      time: "-",
      steps: [
        { pc: "krrr ... schtai ... drei ... krr", distorted: true },
        { user: "Nicht verstanden, wiederholen" },

        { pc: "Ich wiederhole, Treffpunkt beim grossen Stein um drei Uhr, antworten" },
        { user: "Verstanden, Treffpunkt beim grossen Stein um drei Uhr, Schluss" },

        { pc: "Schluss" }
      ]
    }
  };

  function init() {
    setupRecognition();
    loadTask("receive");
  }

  function loadTask(type) {
    state.currentTask = tasks[type];
    state.step = 0;

    els.goalText.textContent = state.currentTask.goal;
    els.taskText.textContent = state.currentTask.task;
    els.placeText.textContent = state.currentTask.place;
    els.timeText.textContent = state.currentTask.time;

    els.feedbackText.textContent = "Bereit.";
    els.heardText.value = "";

    runStep();
  }

  function runStep() {
    const step = state.currentTask.steps[state.step];

    if (!step) return;

    if (step.pc) {
      speakPc(step);
    } else {
      els.feedbackText.textContent = "Du bist dran.";
    }
  }

  function speakPc(step) {
    setRadio("receive");
    play("buzz");

    setTimeout(() => {
      speak(step.pc, step.distorted);
      setTimeout(() => {
        play("buzz");
        setRadio("standby");
        state.step++;
        runStep();
      }, 2000);
    }, 1000);
  }

  function startPtt() {
    const step = state.currentTask.steps[state.step];
    if (!step || !step.user) return;

    state.pttDown = true;
    setRadio("send");
    play("pttDown");

    setTimeout(() => {
      try {
        state.recognition.start();
      } catch {}
    }, 1000);
  }

  function stopPtt() {
    if (!state.pttDown) return;

    state.pttDown = false;
    play("pttUp");

    setTimeout(() => {
      try {
        state.recognition.stop();
      } catch {}

      setRadio("standby");
    }, 1000);
  }

  function checkAnswer(heard) {
    const expected = state.currentTask.steps[state.step].user;

    if (normalize(heard).includes(normalize(expected))) {
      play("success");
      els.feedbackText.textContent = "Korrekt.";
      state.step++;
      setTimeout(runStep, 1000);
    } else {
      play("error");
      els.feedbackText.textContent = "Nicht korrekt.";
    }
  }

  function setupRecognition() {
    const r = new SpeechRecognition();
    r.lang = "de-CH";
    r.interimResults = true;

    r.onresult = e => {
      const text = e.results[0][0].transcript;
      els.heardText.value = text;
      state.finalText = text;
    };

    r.onend = () => {
      if (state.finalText) checkAnswer(state.finalText);
    };

    state.recognition = r;
  }

  function speak(text, distorted) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-CH";
    u.rate = distorted ? 0.6 : 0.9;
    synth.speak(u);
  }

  function setRadio(mode) {
    els.radioImage.src = `./img/${mode}.png`;
  }

  function play(name) {
    const map = {
      pttDown: els.sndPttDown,
      pttUp: els.sndPttUp,
      buzz: els.sndBuzz,
      error: els.sndError,
      success: els.sndSuccess
    };

    const a = map[name];
    if (!a) return;

    a.currentTime = 0;
    a.play().catch(() => {});
  }

  function normalize(t) {
    return t.toLowerCase().replace(/[.,]/g, "").trim();
  }

  window.addEventListener("keydown", e => {
    if (e.code === "Space") startPtt();
  });

  window.addEventListener("keyup", e => {
    if (e.code === "Space") stopPtt();
  });

  init();
})();
