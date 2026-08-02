const display = document.getElementById("timer-display");
const timerIcon = document.getElementById("timer-icon");
const focusInput = document.getElementById("focus-input");
const shortBreakInput = document.getElementById("short-break-input");
const longBreakInput = document.getElementById("long-break-input");
const cyclesInput = document.getElementById("cycles-input");
const focusButton = document.getElementById("focus-button");
const shortBreakButton = document.getElementById("short-break-button");
const longBreakButton = document.getElementById("long-break-button");
const settingsToggle = document.getElementById("settings-toggle");
const soundToggle = document.getElementById("sound-toggle");
const soundPanel = document.getElementById("sound-panel");
const soundCloseButton = document.getElementById("sound-close-button");
const soundPrevButton = document.getElementById("sound-prev");
const soundNextButton = document.getElementById("sound-next");
const soundSelectionLabel = document.getElementById("sound-selection-label");
const soundVolumeSlider = document.getElementById("sound-volume");
const settingsPanel = document.getElementById("settings-panel");
const settingsCloseButton = document.getElementById("settings-close-button");
const complimentaryToggle = document.getElementById("complimentary-toggle");
const backgroundPrevButton = document.getElementById("background-prev");
const backgroundNextButton = document.getElementById("background-next");
const backgroundSelectionLabel = document.getElementById("background-selection-label");
const backgroundPreview = document.getElementById("background-preview");
const backgroundColorInput = document.getElementById("background-color-input");
const title = document.querySelector("h1");

let selectedBackgroundImage = "1.png";
let mode = "focus";
let modeButtonState = "start";
let countdown = 25 * 60;
let intervalId = null;
let completedPomodoros = 0;

const backgroundOptions = [
  { value: "1.png", label: "🎧 Study Room" },
  { value: "2.png", label: "🌿 Cozy nook" },
  { value: "3.png", label: "🌅 Sunlit Haven" },
  { value: "none", label: "Off ❌" },
];

function getBackgroundOptionIndex(value) {
  return backgroundOptions.findIndex((option) => option.value === value);
}

function updateBackgroundSelectionLabel() {
  const option = backgroundOptions.find((option) => option.value === selectedBackgroundImage);
  if (backgroundSelectionLabel) {
    backgroundSelectionLabel.textContent = option ? option.label : "Unknown";
  }
  if (backgroundPreview) {
    if (selectedBackgroundImage === "none") {
      backgroundPreview.style.display = "none";
      backgroundPreview.alt = "No background selected";
    } else {
      backgroundPreview.style.display = "block";
      backgroundPreview.src = `images/${selectedBackgroundImage}`;
      backgroundPreview.alt = option ? option.label : "Background preview";
    }
  }
}

function selectBackgroundByIndex(index) {
  const wrappedIndex = (index + backgroundOptions.length) % backgroundOptions.length;
  selectedBackgroundImage = backgroundOptions[wrappedIndex].value;
  applyBackgroundImageSetting();
}

function handleBackgroundPrev() {
  const currentIndex = getBackgroundOptionIndex(selectedBackgroundImage);
  selectBackgroundByIndex(currentIndex - 1);
}

function handleBackgroundNext() {
  const currentIndex = getBackgroundOptionIndex(selectedBackgroundImage);
  selectBackgroundByIndex(currentIndex + 1);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getModeIcon() {
  if (mode === "short-break") return "☕";
  if (mode === "long-break") return "🛌";
  return "🧘";
}

function getComplementaryColor(hex) {
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return "#000000";
  }

  let normalized = hex.slice(1);
  if (normalized.length === 3) {
    normalized = normalized.split("").map((char) => char + char).join("");
  }

  const r = 255 - parseInt(normalized.slice(0, 2), 16);
  const g = 255 - parseInt(normalized.slice(2, 4), 16);
  const b = 255 - parseInt(normalized.slice(4, 6), 16);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getModeLabel(modeKey) {
  if (modeKey === "short-break") return "Short Break";
  if (modeKey === "long-break") return "Long Break";
  return "Focus";
}

function getNextModeOptions() {
  if (mode === "focus") return ["short-break", "long-break"];
  if (mode === "short-break") return ["long-break", "focus"];
  return ["focus", "short-break"];
}

function getModeEmoji(modeKey) {
  if (modeKey === "short-break") return "☕";
  if (modeKey === "long-break") return "🛌";
  return "📘";
}

function getModeButtonText(buttonMode) {
  if (buttonMode !== mode) {
    return buttonMode === "focus"
      ? `<span class="button-emoji">🧘</span><span class="button-label">Start Focus</span>`
      : `<span class="button-emoji">${getModeEmoji(buttonMode)}</span><span class="button-label">${getModeLabel(buttonMode)}</span>`;
  }

  if (modeButtonState === "start") {
    return buttonMode === "focus"
      ? `<span class="button-emoji">🧘</span><span class="button-label">Start ${getModeLabel(buttonMode)}</span>`
      : `<span class="button-emoji">${getModeEmoji(buttonMode)}</span><span class="button-label">${getModeLabel(buttonMode)}</span>`;
  }
  if (modeButtonState === "pause") {
    return `<span class="button-emoji">⏸</span><span class="button-label">Pause</span>`;
  }
  return `<span class="button-emoji">↻</span><span class="button-label">Reset</span>`;
}

function updateModeButtons() {
  focusButton.innerHTML = getModeButtonText("focus");
  shortBreakButton.innerHTML = getModeButtonText("short-break");
  longBreakButton.innerHTML = getModeButtonText("long-break");
}

let selectedSound = "ocean";

function getSelectedAudio() {
  if (selectedSound === "river") return riverAudio;
  if (selectedSound === "wind") return windAudio;
  if (selectedSound === "forest") return forestAudio;
  if (selectedSound === "beats") return beatsAudio;
  return oceanAudio;
}

function stopNonSelectedAudio() {
  const activeAudio = getSelectedAudio();
  [oceanAudio, riverAudio, windAudio, forestAudio, beatsAudio].forEach((audio) => {
    if (audio !== activeAudio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

function handleVolumeChange() {
  if (!soundVolumeSlider) return;

  const audio = getSelectedAudio();
  const volume = Number(soundVolumeSlider.value) / 100;
  audio.volume = volume;

  if (volume > 0) {
    if (audio.paused) {
      audio.play().catch(() => {
        /* playback may require user interaction */
      });
    }
  } else {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  stopNonSelectedAudio();
}

const soundOptions = [
  { value: "ocean", label: "🌊 Ocean" },
  { value: "river", label: "🌿 River" },
  { value: "wind", label: "🍃 Wind Chimes" },
  { value: "forest", label: "🌲 Forest" },
  { value: "beats", label: "🥁 Instrumental Beats" },
];

function getSoundOptionIndex(soundValue) {
  return soundOptions.findIndex((option) => option.value === soundValue);
}

function updateSoundSelectionLabel() {
  if (!soundSelectionLabel) return;
  const option = soundOptions.find((option) => option.value === selectedSound);
  soundSelectionLabel.textContent = option ? option.label : "Unknown";
}

function selectSoundByIndex(index) {
  const wrappedIndex = (index + soundOptions.length) % soundOptions.length;
  selectedSound = soundOptions[wrappedIndex].value;
  updateSoundSelectionLabel();
  stopNonSelectedAudio();

  if (!soundVolumeSlider) return;
  const audio = getSelectedAudio();
  const volume = Number(soundVolumeSlider.value) / 100;
  audio.volume = volume;

  if (volume > 0 && audio.paused) {
    audio.play().catch(() => {
      /* playback may require user interaction */
    });
  }
}

function handleSoundPrev() {
  const currentIndex = getSoundOptionIndex(selectedSound);
  selectSoundByIndex(currentIndex - 1);
}

function handleSoundNext() {
  const currentIndex = getSoundOptionIndex(selectedSound);
  selectSoundByIndex(currentIndex + 1);
}

updateSoundSelectionLabel();

function updateDisplay() {
  display.textContent = formatTime(countdown);
  timerIcon.textContent = getModeIcon();
  updateModeButtons();
}

function applyBackgroundImageSetting() {
  if (selectedBackgroundImage === "none") {
    document.body.style.backgroundImage = "none";
  } else {
    document.body.style.backgroundImage = `url("images/${selectedBackgroundImage}")`;
  }
  updateBackgroundSelectionLabel();
}

function playBeep(repeat = 3) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.frequency.value = 660;
  gain.gain.value = 0.08;
  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);

  let count = 1;
  oscillator.onended = () => {
    if (count < repeat) {
      count += 1;
      const nextOsc = context.createOscillator();
      const nextGain = context.createGain();
      nextOsc.connect(nextGain);
      nextGain.connect(context.destination);
      nextOsc.frequency.value = 660;
      nextGain.gain.value = 0.08;
      nextOsc.start();
      nextOsc.stop(context.currentTime + 0.1);
      nextOsc.onended = () => {
        if (count < repeat) {
          playBeep(repeat - count);
        } else {
          context.close();
        }
      };
    } else {
      context.close();
    }
  };
}

function getFocusSeconds() {
  const minutes = parseInt(focusInput.value, 10);
  return Number.isNaN(minutes) || minutes < 1 ? 25 * 60 : minutes * 60;
}

function getShortBreakSeconds() {
  const minutes = parseInt(shortBreakInput.value, 10);
  return Number.isNaN(minutes) || minutes < 1 ? 5 * 60 : minutes * 60;
}

function getLongBreakSeconds() {
  const minutes = parseInt(longBreakInput.value, 10);
  return Number.isNaN(minutes) || minutes < 1 ? 15 * 60 : minutes * 60;
}

function getPomodorosBeforeLongBreak() {
  const value = parseInt(cyclesInput.value, 10);
  return Number.isNaN(value) || value < 1 ? 4 : value;
}

function getCurrentModeSeconds() {
  if (mode === "short-break") return getShortBreakSeconds();
  if (mode === "long-break") return getLongBreakSeconds();
  return getFocusSeconds();
}

const oceanAudio = new Audio(encodeURI("sounds/ocean.mp3"));
oceanAudio.loop = true;
oceanAudio.volume = 0;

const riverAudio = new Audio(encodeURI("sounds/river.mp3"));
riverAudio.loop = true;
riverAudio.volume = 0;

const windAudio = new Audio(encodeURI("sounds/wind_chimes.mp3"));
windAudio.loop = true;
windAudio.volume = 0;

const forestAudio = new Audio(encodeURI("sounds/forest.mp3"));
forestAudio.loop = true;
forestAudio.volume = 0;

const beatsAudio = new Audio(encodeURI("sounds/Instrumental beats.mp3"));
beatsAudio.loop = true;
beatsAudio.volume = 0;

[oceanAudio, riverAudio, windAudio, forestAudio, beatsAudio].forEach((audio) => {
  audio.addEventListener("error", () => {
    console.warn("Audio failed to load:", audio.src);
  });
});

function resetTimer() {
  stopTimer();
  countdown = getCurrentModeSeconds();
  updateDisplay();
}

function setMode(newMode) {
  mode = newMode;
  countdown = getCurrentModeSeconds();
  updateDisplay();
}

function changeMode(newMode) {
  stopTimer();
  setMode(newMode);
  modeButtonState = "pause";
  startTimer();
  updateModeButtons();
}

function switchMode() {
  playBeep(3);
  if (mode === "focus") {
    completedPomodoros += 1;
    const threshold = getPomodorosBeforeLongBreak();
    if (completedPomodoros >= threshold) {
      completedPomodoros = 0;
      setMode("long-break");
    } else {
      setMode("short-break");
    }
  } else {
    setMode("focus");
  }
  stopTimer();
}

function startTimer() {
  if (intervalId !== null) return;
  if (countdown <= 0) {
    countdown = getCurrentModeSeconds();
  }
  updateDisplay();
  intervalId = setInterval(() => {
    if (countdown > 0) {
      countdown -= 1;
      updateDisplay();
    } else {
      switchMode();
    }
  }, 1000);
}

function stopTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

focusButton.addEventListener("click", () => {
  if (mode !== "focus") {
    changeMode("focus");
    return;
  }

  if (modeButtonState === "start") {
    startTimer();
    modeButtonState = "pause";
  } else if (modeButtonState === "pause") {
    stopTimer();
    modeButtonState = "reset";
  } else {
    resetTimer();
    modeButtonState = "start";
  }
  updateModeButtons();
});

shortBreakButton.addEventListener("click", () => {
  if (mode !== "short-break") {
    changeMode("short-break");
    return;
  }

  if (modeButtonState === "start") {
    startTimer();
    modeButtonState = "pause";
  } else if (modeButtonState === "pause") {
    stopTimer();
    modeButtonState = "reset";
  } else {
    resetTimer();
    modeButtonState = "start";
  }
  updateModeButtons();
});

longBreakButton.addEventListener("click", () => {
  if (mode !== "long-break") {
    changeMode("long-break");
    return;
  }

  if (modeButtonState === "start") {
    startTimer();
    modeButtonState = "pause";
  } else if (modeButtonState === "pause") {
    stopTimer();
    modeButtonState = "reset";
  } else {
    resetTimer();
    modeButtonState = "start";
  }
  updateModeButtons();
});

focusInput.addEventListener("change", () => {
  if (intervalId === null && mode === "focus") {
    countdown = getFocusSeconds();
    updateDisplay();
  }
});

shortBreakInput.addEventListener("change", () => {
  if (intervalId === null && mode === "short-break") {
    countdown = getShortBreakSeconds();
    updateDisplay();
  }
});

longBreakInput.addEventListener("change", () => {
  if (intervalId === null && mode === "long-break") {
    countdown = getLongBreakSeconds();
    updateDisplay();
  }
});

cyclesInput.addEventListener("change", () => {
  if (intervalId === null) {
    updateDisplay();
  }
});

const applyColorValue = () => {
  document.body.style.backgroundColor = backgroundColorInput.value;
};

if (backgroundPrevButton) {
  backgroundPrevButton.addEventListener("click", handleBackgroundPrev);
}
if (backgroundNextButton) {
  backgroundNextButton.addEventListener("click", handleBackgroundNext);
}

backgroundColorInput.addEventListener("input", applyColorValue);
backgroundColorInput.addEventListener("change", applyColorValue);

function openSettingsPanel() {
  closeSoundPanel();
  settingsPanel.classList.add("open");
  settingsToggle.setAttribute("aria-expanded", "true");
  settingsPanel.setAttribute("aria-hidden", "false");
}

function closeSettingsPanel() {
  settingsPanel.classList.remove("open");
  settingsToggle.setAttribute("aria-expanded", "false");
  settingsPanel.setAttribute("aria-hidden", "true");
}

function toggleSettingsPanel() {
  if (settingsPanel.classList.contains("open")) {
    closeSettingsPanel();
  } else {
    openSettingsPanel();
  }
}

function openSoundPanel() {
  if (!soundPanel) return;
  closeSettingsPanel();
  soundPanel.classList.add("open");
  soundPanel.setAttribute("aria-hidden", "false");
}

function closeSoundPanel() {
  if (!soundPanel) return;
  soundPanel.classList.remove("open");
  soundPanel.setAttribute("aria-hidden", "true");
}

function toggleSoundPanel() {
  if (!soundPanel) return;
  if (soundPanel.classList.contains("open")) {
    closeSoundPanel();
  } else {
    openSoundPanel();
  }
}

settingsToggle.addEventListener("click", toggleSettingsPanel);
if (soundToggle) {
  soundToggle.addEventListener("click", toggleSoundPanel);
}
if (soundCloseButton) {
  soundCloseButton.addEventListener("click", closeSoundPanel);
}
if (soundPrevButton) {
  soundPrevButton.addEventListener("click", handleSoundPrev);
}
if (soundNextButton) {
  soundNextButton.addEventListener("click", handleSoundNext);
}
if (soundVolumeSlider) {
  soundVolumeSlider.addEventListener("input", handleVolumeChange);
}
settingsCloseButton.addEventListener("click", closeSettingsPanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsPanel.classList.contains("open")) {
    closeSettingsPanel();
  }
});

applyBackgroundImageSetting();updateBackgroundSelectionLabel();applyColorValue();
if (soundVolumeSlider) {
  soundVolumeSlider.value = "0";
  handleVolumeChange();
}
[oceanAudio, riverAudio, windAudio].forEach((audio) => {
  audio.pause();
  audio.currentTime = 0;
});
resetTimer();
