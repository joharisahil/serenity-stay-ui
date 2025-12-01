export const playSound = (src: string) => {
  const audio = new Audio(src);
  audio.volume = 1.0; // adjust volume if needed
  audio.play().catch(() => {});
};
