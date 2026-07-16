// Real fare formula, matching how Uber/Lyft actually price a ride:
// base fare + (per-mile x distance) + (per-minute x time) + service fee, with a minimum floor.
export const FARE_RATES = {
  base: 1.75,
  perMile: 1.10,
  perMinute: 0.28,
  serviceFee: 2.75,
  minimumFare: 7.50,
};

// TODO once a Google Maps API key is wired in: replace this with a real
// Directions API call (distance + duration) and drop this function. Every
// caller already expects { miles, minutes } back, so nothing downstream
// needs to change.
export function seededTrip(destination) {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = (hash * 31 + destination.charCodeAt(i)) >>> 0;
  }
  const miles = 1.5 + (hash % 1200) / 100;
  const minutesPerMile = 2.6 + ((hash >> 3) % 100) / 100;
  const minutes = Math.round(miles * minutesPerMile);
  return { miles: Math.round(miles * 10) / 10, minutes };
}

export function fareFor(destination) {
  const { miles, minutes } = seededTrip(destination);
  const raw =
    FARE_RATES.base + miles * FARE_RATES.perMile + minutes * FARE_RATES.perMinute + FARE_RATES.serviceFee;
  const fare = Math.max(raw, FARE_RATES.minimumFare);
  return { fare: Math.round(fare * 100) / 100, miles, minutes };
}
