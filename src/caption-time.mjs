// Offset only the caption clock; media playback and original timestamps stay intact.
export const defaultLeadMs = 150;
export function captionTime(videoSeconds, leadMs = defaultLeadMs) {
  return videoSeconds + leadMs / 1000;
}
