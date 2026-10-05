const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Great-circle distance between two lat/lng points, in meters.
export function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

// Smallest check-in radius HR may set for an office. Phone GPS is routinely
// off by 10-30m (more indoors), so anything tighter rejects staff who are
// genuinely on site.
export const MIN_OFFICE_RADIUS_METERS = 30;
