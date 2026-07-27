const display = document.getElementById("timer-display");
const modeDisplay = document.getElementById("mode-display");
const modeSelect = document.getElementById("mode-select");
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const resetButton = document.getElementById("reset-button");
const focusInput = document.getElementById("focus-input");
const shortBreakInput = document.getElementById("short-break-input");
const longBreakInput = document.getElementById("long-break-input");
const cyclesInput = document.getElementById("cycles-input");

let mode = "focus";
let countdown = 25 * 60;
let intervalId = null;
let completedPomodoros = 0;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  display.textContent = formatTime(countdown);
  let label = "Focus";
  if (mode === "short-break") label = "Short Break";
  if (mode === "long-break") label = "Long Break";
  modeDisplay.textContent = `Mode: ${label}`;
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
  modeSelect.value = newMode;
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

startButton.addEventListener("click", startTimer);
stopButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);

modeSelect.addEventListener("change", () => {
  setMode(modeSelect.value);
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

resetTimer();
