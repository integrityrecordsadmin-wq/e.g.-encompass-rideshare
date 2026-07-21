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
