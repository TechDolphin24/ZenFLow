const display = document.getElementById("timer-display");
const timerIcon = document.getElementById("timer-icon");
const toggleButton = document.getElementById("toggle-button");
const resetButton = document.getElementById("reset-button");
const focusInput = document.getElementById("focus-input");
const shortBreakInput = document.getElementById("short-break-input");
const longBreakInput = document.getElementById("long-break-input");
const cyclesInput = document.getElementById("cycles-input");
const focusModeButton = document.getElementById("focus-mode");
const shortBreakModeButton = document.getElementById("short-break-mode");
const longBreakModeButton = document.getElementById("long-break-mode");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const settingsCloseButton = document.getElementById("settings-close-button");
const complimentaryToggle = document.getElementById("complimentary-toggle");
const backgroundOptionButtons = document.querySelectorAll(".background-option");
const backgroundColorInput = document.getElementById("background-color-input");
const title = document.querySelector("h1");

let selectedBackgroundImage = "1.png";
let mode = "focus";
let countdown = 25 * 60;
let intervalId = null;
let completedPomodoros = 0;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getModeIcon() {
  if (mode === "short-break") return "☕";
  if (mode === "long-break") return "🛌";
  return "💻";
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

function updateModeButtons() {
  focusModeButton.classList.toggle("active", mode === "focus");
  shortBreakModeButton.classList.toggle("active", mode === "short-break");
  longBreakModeButton.classList.toggle("active", mode === "long-break");
}

function updateDisplay() {
  display.textContent = formatTime(countdown);
  timerIcon.textContent = getModeIcon();
  updateModeButtons();
}

function applyBackgroundColor(color) {
  document.body.style.backgroundColor = color;
  const useComplementary = complimentaryToggle.checked;

  if (useComplementary) {
    const complementary = getComplementaryColor(color);
    title.style.color = complementary;
    display.style.color = complementary;
    timerIcon.style.color = complementary;
  } else {
    title.style.color = "";
    display.style.color = "";
    timerIcon.style.color = "";
  }
}

function updateBackgroundSelection() {
  backgroundOptionButtons.forEach((button) => {
    const isActive = button.dataset.bg === selectedBackgroundImage;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function applyBackgroundImageSetting() {
  if (selectedBackgroundImage === "none") {
    document.body.style.backgroundImage = "none";
  } else {
    document.body.style.backgroundImage = `url("images/${selectedBackgroundImage}")`;
  }
  updateBackgroundSelection();
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
  toggleButton.textContent = "Stop";
}

function stopTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  toggleButton.textContent = "Start";
}

function toggleTimer() {
  if (intervalId === null) {
    startTimer();
  } else {
    stopTimer();
  }
}

toggleButton.addEventListener("click", toggleTimer);
resetButton.addEventListener("click", resetTimer);

focusModeButton.addEventListener("click", () => {
  setMode("focus");
});

shortBreakModeButton.addEventListener("click", () => {
  setMode("short-break");
});

longBreakModeButton.addEventListener("click", () => {
  setMode("long-break");
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
  applyBackgroundColor(backgroundColorInput.value);
};

backgroundOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedBackgroundImage = button.dataset.bg;
    applyBackgroundImageSetting();
  });
});

backgroundColorInput.addEventListener("input", applyColorValue);
backgroundColorInput.addEventListener("change", applyColorValue);

function openSettingsPanel() {
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

settingsToggle.addEventListener("click", toggleSettingsPanel);
settingsCloseButton.addEventListener("click", closeSettingsPanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsPanel.classList.contains("open")) {
    closeSettingsPanel();
  }
});

applyBackgroundImageSetting();
applyColorValue();
resetTimer();
