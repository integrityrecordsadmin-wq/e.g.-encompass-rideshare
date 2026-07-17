
// Server-side only — creates a Daily.co video room for a Family Ride trip.
// The API key never reaches the browser since this runs on Vercel's server.

export async function POST(request) {
  const { rideId } = await request.json();

  if (!rideId) {
    return Response.json({ error: "Missing rideId" }, { status: 400 });
  }

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `family-ride-${rideId}`,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 90, // room expires 90 min after creation
        enable_chat: false,
        enable_screenshare: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const room = await res.json();
  return Response.json({ url: room.url, name: room.name });
}
