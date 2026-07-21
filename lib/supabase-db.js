import { supabase } from "./supabase";

// ---------- Rider Auth ----------
export async function signUpRider({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const profile = {
    id: data.user.id, name, email,
    audio_recording_enabled: false, rating: 5.0, rating_count: 0,
    created_at: new Date().toISOString(),
  };
  const { error: insertError } = await supabase.from("riders").insert(profile);
  if (insertError) throw insertError;
  return { uid: data.user.id, ...profile };
}

export async function loginRider({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase
    .from("riders").select("*").eq("id", data.user.id).single();
  if (profileError) throw new Error("No rider profile found for this account.");
  return { uid: data.user.id, ...profile };
}

// ---------- Driver Auth ----------
export async function signUpDriver({ name, email, password, carModel, plate, vehicleType }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const profile = {
    id: data.user.id, name, email, car_model: carModel, plate,
    vehicle_type: vehicleType || "standard", rating: 5.0, earnings_today: 0,
    audio_recording_enabled: false, background_check_status: "pending",
    documents_status: "not_submitted", documents: {}, pending_approval: true,
    created_at: new Date().toISOString(),
  };
  const { error: insertError } = await supabase.from("drivers").insert(profile);
  if (insertError) throw insertError;
  return { uid: data.user.id, ...profile };
}

export async function loginDriver({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase
    .from("drivers").select("*").eq("id", data.user.id).single();
  if (profileError) throw new Error("No driver profile found for this account.");
  return { uid: data.user.id, ...profile };
}

// ---------- Family Auth ----------
export async function signUpFamily({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const profile = { id: data.user.id, name, email, created_at: new Date().toISOString() };
  const { error: insertError } = await supabase.from("family_profiles").insert(profile);
  if (insertError) throw insertError;
  return { uid: data.user.id, ...profile };
}

export async function loginFamily({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase
    .from("family_profiles").select("*").eq("id", data.user.id).single();
  if (!profile) {
    const newProfile = { id: data.user.id, name: email.split("@")[0], email, created_at: new Date().toISOString() };
    await supabase.from("family_profiles").insert(newProfile);
    return { uid: data.user.id, ...newProfile };
  }
  return { uid: data.user.id, ...profile };
}

// ---------- Shared ----------
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
// ---------- Google Sign-In (shared pattern, per role) ----------
export async function startGoogleSignIn(redirectPath = "/rider") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${redirectPath}` },
  });
  if (error) throw error;
}

export async function completeGoogleSignInRider() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const uid = session.user.id;
  const { data: profile } = await supabase.from("riders").select("*").eq("id", uid).single();
  if (profile) return { uid, ...profile };
  const newProfile = {
    id: uid, name: session.user.user_metadata?.full_name || "Rider",
    email: session.user.email, audio_recording_enabled: false,
    rating: 5.0, rating_count: 0, created_at: new Date().toISOString(),
  };
  await supabase.from("riders").insert(newProfile);
  return { uid, ...newProfile };
}

export async function completeGoogleSignInDriver() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const uid = session.user.id;
  const { data: profile } = await supabase.from("drivers").select("*").eq("id", uid).single();
  if (profile) return { uid, ...profile, needsVehicleInfo: false };
  return {
    uid, needsVehicleInfo: true,
    name: session.user.user_metadata?.full_name || "Driver",
    email: session.user.email,
  };
}

export async function completeGoogleSignInFamily() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const uid = session.user.id;
  const { data: profile } = await supabase.from("family_profiles").select("*").eq("id", uid).single();
  if (profile) return { uid, ...profile };
  const newProfile = {
    id: uid, name: session.user.user_metadata?.full_name || "Family",
    email: session.user.email, created_at: new Date().toISOString(),
  };
  await supabase.from("family_profiles").insert(newProfile);
  return { uid, ...newProfile };
}

export async function completeDriverGoogleSignup(uid, { name, email, carModel, plate, vehicleType }) {
  const profile = {
    id: uid, name, email, car_model: carModel, plate,
    vehicle_type: vehicleType || "standard", rating: 5.0, earnings_today: 0,
    audio_recording_enabled: false, background_check_status: "pending",
    documents_status: "not_submitted", documents: {}, pending_approval: true,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("drivers").insert(profile);
  if (error) throw error;
  return { uid, ...profile };
}

// ---------- Magic Link (passwordless) ----------
export async function sendMagicLinkRider(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: `${window.location.origin}/rider` },
  });
  if (error) throw error;
}

export async function sendMagicLinkDriver(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: `${window.location.origin}/driver` },
  });
  if (error) throw error;
}

export async function sendMagicLinkFamily(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: `${window.location.origin}/family` },
  });
  if (error) throw error;
}

// Supabase handles the magic-link session automatically on page load —
// these just check for an existing session and fetch/create the profile,
// same pattern as the Google functions above.
export async function completeMagicLinkSignInRider() {
  return completeGoogleSignInRider();
}
export async function completeMagicLinkSignInDriver() {
  return completeGoogleSignInDriver();
}
export async function completeMagicLinkSignInFamily() {
  return completeGoogleSignInFamily();
}
// ---------- Rides ----------
export async function createRide(ride) {
  const { data, error } = await supabase
    .from("rides")
    .insert({
      rider_uid: ride.riderUid,
      rider_name: ride.riderName,
      destination: ride.destination,
      vehicle_type: ride.vehicleType || "standard",
      fare: ride.fare,
      miles: ride.miles,
      minutes: ride.minutes,
      is_family_ride: ride.isFamilyRide || false,
      rider_recording: ride.riderRecording || false,
      status: "requested",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateRide(rideId, patch) {
  // Convert camelCase keys to snake_case for Postgres columns
  const snakePatch = {};
  for (const [key, value] of Object.entries(patch)) {
    const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    snakePatch[snakeKey] = value;
  }
  const { error } = await supabase.from("rides").update(snakePatch).eq("id", rideId);
  if (error) throw error;
}

export function subscribeToRide(rideId, onChange) {
  // Initial fetch
  supabase.from("rides").select("*").eq("id", rideId).single()
    .then(({ data }) => { if (data) onChange({ id: data.id, ...data }); });

  // Realtime subscription for changes
  const channel = supabase
    .channel(`ride-${rideId}`)
    .on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
      (payload) => onChange({ id: payload.new.id, ...payload.new })
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToNextPendingRide(vehicleType, onRide) {
  const channel = supabase
    .channel("pending-rides")
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "rides",
        filter: `vehicle_type=eq.${vehicleType || "standard"}` },
      (payload) => {
        if (payload.new.status === "requested") onRide({ id: payload.new.id, ...payload.new });
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToAllRides(onChange, max = 100) {
  supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(max)
    .then(({ data }) => { if (data) onChange(data.map((r) => ({ id: r.id, ...r }))); });

  const channel = supabase
    .channel("all-rides")
    .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => {
      supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(max)
        .then(({ data }) => { if (data) onChange(data.map((r) => ({ id: r.id, ...r }))); });
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToDriverRides(driverUid, onChange, max = 300) {
  const fetch = () => {
    supabase.from("rides").select("*")
      .eq("driver_uid", driverUid).eq("status", "completed")
      .order("created_at", { ascending: false }).limit(max)
      .then(({ data }) => { if (data) onChange(data.map((r) => ({ id: r.id, ...r }))); });
  };
  fetch();
  const channel = supabase
    .channel(`driver-rides-${driverUid}`)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "rides", filter: `driver_uid=eq.${driverUid}` },
      fetch
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function rateDriver(rideId, driverUid, stars) {
  await supabase.from("rides").update({ driver_rating_by_rider: stars }).eq("id", rideId);
  const { data: driver } = await supabase.from("drivers").select("rating, rating_count").eq("id", driverUid).single();
  if (!driver) throw new Error("Driver not found.");
  const newCount = driver.rating_count + 1;
  const newRating = (driver.rating * driver.rating_count + stars) / newCount;
  await supabase.from("drivers").update({ rating: newRating, rating_count: newCount }).eq("id", driverUid);
}

export async function rateRider(rideId, riderUid, stars) {
  await supabase.from("rides").update({ rider_rating_by_driver: stars }).eq("id", rideId);
  const { data: rider } = await supabase.from("riders").select("rating, rating_count").eq("id", riderUid).single();
  if (!rider) throw new Error("Rider not found.");
  const newCount = rider.rating_count + 1;
  const newRating = (rider.rating * rider.rating_count + stars) / newCount;
  await supabase.from("riders").update({ rating: newRating, rating_count: newCount }).eq("id", riderUid);
}

// ---------- Ride messages ----------
export async function appendRideMessage(rideId, sender, text) {
  const { error } = await supabase.from("ride_messages").insert({
    ride_id: rideId, sender, text, created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------- Driver location (for live tracking) ----------
export async function updateDriverLocation(rideId, lat, lng) {
  const { error } = await supabase.from("rides")
    .update({ driver_location: { lat, lng, updatedAt: Date.now() } })
    .eq("id", rideId);
  if (error) throw error;
}

export function subscribeToFamilyActiveRide(memberUids, onChange) {
  if (!memberUids?.length) { onChange(null); return () => {}; }

  const fetch = () => {
    supabase.from("rides").select("*").eq("status", "in_progress")
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => {
        const match = data?.find((r) => memberUids.includes(r.rider_uid));
        onChange(match ? { id: match.id, ...match, driverLocation: match.driver_location } : null);
      });
  };
  fetch();
  const channel = supabase
    .channel("family-active-ride")
    .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, fetch)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
