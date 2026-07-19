
"use client";
import { useState, useEffect, useRef } from "react";
import {
  MapPin, Navigation, Search, User, Car, Clock, ChevronLeft, Check, Shield, Mic, X, MessageCircle,
  Heart, Video, ShieldCheck, Star as StarIcon,
} from "lucide-react";
import CityMap from "../../components/CityMap";
import ChatPanel from "../../components/ChatPanel";
import { ACCENT, AMBER } from "../../lib/tokens";
import { fareFor, seededTrip } from "../../lib/fare";
import { VEHICLE_TYPES } from "../../lib/vehicleTypes";
import {
  signUpRider, loginRider, signOut, updateRiderProfile,
  createRide, subscribeToRide, resetPassword, createFamilyRideRoom, getOnlineDriverTokens,
} from "../../lib/db";
import { sendPushNotification } from "../../lib/messaging";

const HOME = { x: 20, y: 78 };
const DEST = { x: 82, y: 22 };
const DRIVER_START = { x: 8, y: 30 };
const QUICK_REPLIES_RIDER = ["I'm outside", "On my way down", "Running 2 min late", "Thank you!"];

// Pink theme for the Family Ride live-watch frame only.
const FAMILY = {
  bg: "#FDF3F6",
  frameGold: "#C98A9E",
  frameGoldLight: "#E8B4C4",
  plum: "#4A1D3F",
  plumSoft: "#8A5A78",
  rose: "#E8547C",
  card: "#FFFFFF",
  cardBorder: "#F6D9E3",
  coral: "#FB7185",
};

function lerp(a, b, t) { return a + (b - a) * t; }
function pointAt(path, t) {
  const segCount = path.length - 1;
  const scaled = t * segCount;
  const i = Math.min(Math.floor(scaled), segCount - 1);
  const localT = scaled - i;
  const a = path[i], b = path[i + 1];
  return { x: lerp(a.x, b.x, localT), y: lerp(a.y, b.y, localT) };
}

// ---------- Auth ----------
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const steps = mode === "signup" ? ["email", "password", "name"] : ["email", "password"];
  const current = steps[step];

  const next = () => {
    setError("");
    if (current === "email" && !email.trim()) { setError("Enter your email to continue."); return; }
    if (current === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address (e.g. name@example.com).");
      return;
    }
    if (current === "password" && !password) { setError("Enter a password to continue."); return; }
    if (current === "name" && !name.trim()) { setError("Enter your name to continue."); return; }
    if (current === "name" && mode === "signup" && !agreed) { setError("You must agree to the terms to continue."); return; }
    setStep((s) => s + 1);
  };

  const back = () => {
    setError("");
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const user = mode === "signup"
        ? await signUpRider({ name, email: email.trim().toLowerCase(), password })
        : await loginRider({ email: email.trim().toLowerCase(), password });
      onAuthed(user);
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Something went wrong.");
    }
    setBusy(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Enter your email above first."); return; }
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
      setError("");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Couldn't send reset email.");
    }
  };

  const isLastStep = step === steps.length - 1;

  const titles = {
    email: mode === "login" ? "Welcome back" : "Let's get you a ride",
    password: mode === "login" ? "Enter your password" : "Create a password",
    name: "What's your name?",
  };
  const subtitles = {
    email: mode === "login" ? "Log in to keep moving." : "First, your email.",
    password: "Keep it secure — at least 6 characters.",
    name: "So your driver knows who's riding.",
  };

  return (
    <div className="min-h-full w-full flex flex-col justify-center px-8" style={{ background: "#111318" }}>
      <div className="mb-10">
        <div className="w-11 h-11 rounded-2xl mb-6 flex items-center justify-center" style={{ background: ACCENT }}>
          <Navigation size={22} color="#111318" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#F5F5F0" }}>{titles[current]}</h1>
        <p className="mt-1 text-sm" style={{ color: "#7A7F8A" }}>{subtitles[current]}</p>
      </div>

      <div className="space-y-3">
        {current === "email" && (
          <input autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        )}
        {current === "password" && (
          <>
            <input autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
              style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
            {mode === "login" && (
              <button type="button" onClick={handleForgotPassword} className="text-xs text-right w-full" style={{ color: "#7A7F8A" }}>
                Forgot password?
              </button>
            )}
            {resetSent && (
              <p className="text-xs" style={{ color: ACCENT }}>Check your email for a reset link.</p>
            )}
          </>
        )}
        {current === "name" && (
          <>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              autoComplete="name"
              className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
              style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
            {mode === "signup" && (
              <label className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 flex-shrink-0" />
                <span className="text-xs leading-relaxed" style={{ color: "#7A7F8A" }}>
                  I agree to the <a href="/terms" className="underline" style={{ color: "#F5F5F0" }}>Terms & Conditions</a> and <a href="/policies" className="underline" style={{ color: "#F5F5F0" }}>Company Policies</a>.
                </span>
              </label>
            )}
          </>
        )}

        {error && <p className="text-sm" style={{ color: "#FF6B6B" }}>{error}</p>}

        <button
          onClick={isLastStep ? submit : next}
          disabled={busy}
          className="w-full py-3.5 rounded-xl font-medium text-base mt-2 transition active:scale-[0.98]"
          style={{ background: ACCENT, color: "#111318" }}>
          {busy ? "One sec…" : isLastStep ? (mode === "login" ? "Log in" : "Create account") : "Continue"}
        </button>

        {step > 0 && (
          <button onClick={back} className="w-full text-sm text-center py-1" style={{ color: "#7A7F8A" }}>
            Back
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-6">
        {steps.map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all" style={{ width: i === step ? 20 : 6, background: i <= step ? ACCENT : "#2B2F3A" }} />
        ))}
      </div>

      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setStep(0); setError(""); setResetSent(false); }}
        className="mt-6 text-sm text-center" style={{ color: "#7A7F8A" }}>
        {mode === "login" ? (<>New here? <span style={{ color: "#F5F5F0" }}>Create an account</span></>)
          : (<>Already have an account? <span style={{ color: "#F5F5F0" }}>Log in</span></>)}
      </button>
    </div>
  );
}

// ---------- Safety Toolkit ----------
function SafetyToolkitScreen({ user, onBack, onUpdateUser }) {
  const [enabled, setEnabled] = useState(!!user.audioRecordingEnabled);
  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await updateRiderProfile(user.uid, { audioRecordingEnabled: next });
    onUpdateUser({ ...user, audioRecordingEnabled: next });
  };
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#F5F5F0" }}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
          <ChevronLeft size={18} color="#111318" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: "#111318" }}>Safety Toolkit</h2>
      </div>
      <div className="px-4 mt-4">
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #E4E2D9" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${ACCENT}22` }}>
              <Mic size={18} color={ACCENT} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#111318" }}>Audio recording</p>
              <p className="text-xs mt-0.5" style={{ color: "#7A7F8A" }}>Record trip audio on your device for safety</p>
            </div>
            <button onClick={toggle}
              className="w-12 h-7 rounded-full flex items-center px-0.5 transition"
              style={{ background: enabled ? ACCENT : "#D8D6CE", justifyContent: enabled ? "flex-end" : "flex-start" }}>
              <span className="w-6 h-6 rounded-full bg-white block" />
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-xs" style={{ color: "#7A7F8A" }}>
          <p>When on, your trips are recorded on your own device — not on a server, not visible to your driver or anyone else.</p>
          <p>Recordings stay locked. Only you can choose to submit one if you report a safety issue.</p>
          <p>Your driver will see a notice that recording may be on for a trip. In some states, both sides must be notified before recording.</p>
        </div>
      </div>
    </div>
  );
}

// ---------- Home ----------
function HomeScreen({ user, onRequest, onLogout, onSafety }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0"><CityMap driverPos={null} showRoute={false} /></div>
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <button onClick={onLogout} aria-label="Account" className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
          <User size={18} color="#F5F5F0" />
        </button>
        <div className="px-3 py-1.5 rounded-full text-xs"
          style={{ background: "rgba(17,19,24,0.85)", color: "#7A7F8A", border: "1px solid #2B2F3A" }}>
          Hi, {user.name.split(" ")[0]}
        </div>
        <button onClick={onSafety} aria-label="Safety toolkit" className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
          <Shield size={17} color={user.audioRecordingEnabled ? AMBER : "#F5F5F0"} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8" style={{ background: "#F5F5F0" }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: "#D8D6CE" }} />
        <h2 className="text-lg font-semibold mb-3" style={{ color: "#111318" }}>Where to?</h2>
        <button onClick={onRequest} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl active:scale-[0.98] transition"
          style={{ background: "#111318" }}>
          <Search size={17} color="#7A7F8A" />
          <span className="text-sm" style={{ color: "#9CA0AA" }}>Enter destination</span>
        </button>
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#9A9890" }}>Suggestions</p>
          {["Downtown Office", "The Studio", "Riverside Market"].map((place) => (
            <button key={place} onClick={onRequest} className="w-full flex items-center gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: "#E4E2D9" }}>
              <MapPin size={16} color={ACCENT} />
              <span className="text-sm" style={{ color: "#111318" }}>{place}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Destination entry ----------
function DestinationScreen({ onBack, onConfirm }) {
  const [dest, setDest] = useState("");
  const [vehicle, setVehicle] = useState("standard");
  const [isFamilyRide, setIsFamilyRide] = useState(false);
  const [familyConsent, setFamilyConsent] = useState(false);

  const baseTrip = dest.trim() ? seededTrip(dest.trim()) : null;
  const baseFare = dest.trim() ? fareFor(dest.trim()).fare : 0;
  const selectedVehicle = VEHICLE_TYPES.find((v) => v.id === vehicle);
  const finalFare = baseFare * selectedVehicle.multiplier;
  const canConfirm = dest.trim() && (!isFamilyRide || familyConsent);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#F5F5F0" }}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
          <ChevronLeft size={18} color="#111318" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: "#111318" }}>Set destination</h2>
      </div>
      <div className="px-4 mt-2 space-y-3 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#EDEBE2" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
          <span className="text-sm" style={{ color: "#111318" }}>Current location</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#fff", border: `1.5px solid ${ACCENT}` }}>
          <div className="w-2 h-2 rounded-sm" style={{ background: AMBER }} />
          <input autoFocus value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Where are you headed?"
            name="ride-destination-field" autoComplete="off" autoCorrect="off" spellCheck="false"
            className="text-sm outline-none w-full bg-transparent" style={{ color: "#111318" }} />
        </div>

        {dest.trim() && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide mb-2 mt-1" style={{ color: "#9A9890" }}>Choose a ride</p>
              <div className="space-y-2">
                {VEHICLE_TYPES.map((v) => {
                  const Icon = v.icon;
                  const isSelected = vehicle === v.id;
                  const price = (baseFare * v.multiplier).toFixed(2);
                  return (
                    <button key={v.id} onClick={() => setVehicle(v.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition"
                      style={{ background: isSelected ? "#111318" : "#fff", border: isSelected ? `1.5px solid ${ACCENT}` : "1px solid #E4E2D9" }}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: isSelected ? ACCENT : "#EDEBE2" }}>
                        <Icon size={20} color={isSelected ? "#111318" : "#7A7F8A"} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold" style={{ color: isSelected ? "#F5F5F0" : "#111318" }}>{v.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: isSelected ? "#9CA3AF" : "#7A7F8A" }}>{v.note}</p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: isSelected ? AMBER : "#111318" }}>${price}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => setIsFamilyRide(!isFamilyRide)}
