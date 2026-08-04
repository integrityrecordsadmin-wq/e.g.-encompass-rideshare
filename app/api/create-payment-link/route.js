export async function POST(request) {
  try {
    const body = await request.json();
    const { fare, destination } = body;

    if (!fare || fare <= 0) {
      return Response.json({ error: "Invalid fare amount" }, { status: 400 });
    }

    const amountInCents = Math.round(fare * 100);

    // Pack the ride details into the redirect URL so they survive the trip
    // to Square's checkout page and back. The ride itself is NOT created in
    // the database yet — that only happens once the rider actually pays and
    // lands back here with these params, so a driver can never see or accept
    // a ride that hasn't been paid for.
    const bookingParams = new URLSearchParams({
      payment: "success",
      riderName: body.riderName || "",
      riderUid: body.riderUid || "",
      destination: body.destination || "",
      fare: String(body.fare || 0),
      miles: String(body.miles || 0),
      minutes: String(body.minutes || 0),
      vehicleType: body.vehicleType || "standard",
      isFamilyRide: body.isFamilyRide ? "1" : "0",
      riderRecording: body.riderRecording ? "1" : "0",
      pickupLat: body.pickupLat != null ? String(body.pickupLat) : "",
      pickupLng: body.pickupLng != null ? String(body.pickupLng) : "",
      dropoffLat: body.dropoffLat != null ? String(body.dropoffLat) : "",
      dropoffLng: body.dropoffLng != null ? String(body.dropoffLng) : "",
      guestPhone: body.guestPhone || "",
      pickupHotel: body.pickupHotel || "",
      returnTo: body.returnTo || "/rider",
    });

    const idempotencyKey = `booking-${body.riderUid || "guest"}-${Date.now()}`;

    const res = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Square-Version": "2024-06-20",
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: `Encompass Rideshare — ${destination || "Ride"}`,
          price_money: {
            amount: amountInCents,
            currency: "USD",
          },
          location_id: process.env.SQUARE_LOCATION_ID,
        },
        checkout_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}${body.returnTo || "/rider"}?${bookingParams.toString()}`,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Square error:", data);
      return Response.json({ error: data.errors?.[0]?.detail || "Couldn't create payment link" }, { status: 500 });
    }

    return Response.json({ url: data.payment_link.url });
  } catch (err) {
    console.error("Payment link error:", err);
    return Response.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
