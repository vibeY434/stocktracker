export function calculateVolumeComparison(
  currentVolume: number,
  avgVolume: number
): number {
  if (avgVolume === 0) {
    return 0;
  }
  return ((currentVolume - avgVolume) / avgVolume) * 100;
}
