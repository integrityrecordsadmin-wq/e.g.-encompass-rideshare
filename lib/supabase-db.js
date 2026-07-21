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
