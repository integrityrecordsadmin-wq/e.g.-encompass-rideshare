export async function POST(request) {
  try {
    const { fare, destination, rideId } = await request.json();

    if (!fare || fare <= 0) {
      return Response.json({ error: "Invalid fare amount" }, { status: 400 });
    }

    const amountInCents = Math.round(fare * 100);

    const res = await fetch("https://connect.squareupsandbox.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Square-Version": "2024-06-20",
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: `ride-${rideId}-${Date.now()}`,
        quick_pay: {
          name: `Encompass Rideshare — ${destination || "Ride"}`,
          price_money: {
            amount: amountInCents,
            currency: "USD",
          },
          location_id: process.env.SQUARE_LOCATION_ID,
        },
        checkout_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rider?payment=success&rideId=${rideId}`,
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
