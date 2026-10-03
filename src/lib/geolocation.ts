export function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Perangkat ini tidak mendukung GPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      // Force a fresh fix each call; a cached position would make every
      // sample in getPositionSamples identical and defeat the check.
      maximumAge: 0,
    });
  });
}

// Each check-in/out takes this many readings, this far apart.
export const LOCATION_SAMPLE_COUNT = 3;
export const LOCATION_SAMPLE_INTERVAL_MS = 2000;

export type LocationSample = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

// Takes `count` GPS readings `intervalMs` apart. Real GPS jitters slightly
// between readings; fake-GPS apps often return identical values, so the
// stored samples let HR spot suspicious check-ins later.
export async function getPositionSamples(
  count: number,
  intervalMs: number,
  onProgress?: (taken: number) => void
): Promise<LocationSample[]> {
  const samples: LocationSample[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, intervalMs));
    const position = await getCurrentPosition();
    samples.push({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
    onProgress?.(i + 1);
  }
  return samples;
}
