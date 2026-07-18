import admin from "firebase-admin";

// Initialize the Admin SDK once, reusing the same instance across requests.
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request) {
  try {
    const { token, title, body, url } = await request.json();
    if (!token || !title) {
      return Response.json({ error: "Missing token or title." }, { status: 400 });
    }

    await admin.messaging().send({
      token,
      notification: { title, body: body || "" },
      data: { url: url || "/driver" },
      webpush: {
        fcmOptions: { link: url || "/driver" },
      },
    });

    return Response.json({ sent: true });
  } catch (err) {
    console.error("send-push error:", err);
    return Response.json({ sent: false, error: err.message }, { status: 500 });
  }
}
