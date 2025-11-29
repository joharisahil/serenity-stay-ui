export const playSound = (src: string) => {
  const audio = new Audio(src);
  audio.volume = 5.0; // adjust volume if needed
  audio.play().catch(() => {});
};
