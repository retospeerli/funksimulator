window.APP_CONFIG = {
  appTitle: "Funksimulator",
  language: "de-CH",
  recognitionLanguage: "de-CH",
  fallbackRecognitionLanguage: "de-DE",
  defaultRate: 0.9,
  defaultPitch: 1,
  defaultSpeechVolume: 1,
  defaultSfxVolume: 0.7,
  maxTasksPerSession: 8,
  useInterimResults: true,
  continuousRecognition: false,
  preferredVoiceKeywords: [
    "natural",
    "microsoft",
    "google",
    "male",
    "de",
    "german"
  ],
  closingWords: [
    "kommen",
    "antworten",
    "ende",
    "verstanden"
  ],
  acceptedRepeatWords: [
    "wiederholen",
    "bitte wiederholen",
    "nicht verstanden"
  ],
  audio: {
    pttDown: "audio/sfx/ptt-down.wav",
    pttUp: "audio/sfx/ptt-up-beep.wav",
    staticLow: "audio/sfx/static-low.mp3",
    success: "audio/sfx/success.wav",
    error: "audio/sfx/error.wav",
    incoming: "audio/sfx/message-incoming.wav",
    roundComplete: "audio/sfx/round-complete.wav"
  }
};
