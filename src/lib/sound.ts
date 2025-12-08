let alertAudio: HTMLAudioElement | null = null;

// 🔁 Continuous alert for NEW orders
export const startAlertSound = () => {
  console.log("▶️ startAlertSound() called");

  if (!alertAudio) {
    alertAudio = new Audio("/sounds/alarm.mp3");
    alertAudio.loop = true;
    alertAudio.volume = 1.0;
  }

  alertAudio
    .play()
    .then(() => console.log("🔊 LOOPING ALERT PLAYING"))
    .catch((err) => console.log("❌ SOUND BLOCKED:", err));
};

// 🔇 Stop looping alert
export const stopAlertSound = () => {
  console.log("⏹ stopAlertSound() called");

  if (alertAudio) {
    alertAudio.pause();
    alertAudio.currentTime = 0;
  }
};

// 🔊 One-time sound
export const playSound = (src: string) => {
  const audio = new Audio(src);
  audio.volume = 1.0;
  audio.play().catch(() => {});
};
