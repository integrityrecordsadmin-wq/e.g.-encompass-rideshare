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
  startGoogleSignIn, completeGoogleSignInRider, sendMagicLinkRider, completeMagicLinkSignInRider,
  getRiderFlatratePlan,
} from "../../lib/supabase-db";
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [pending, setPending] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const handleSendMagicLink = async () => {
    setError("");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address (e.g. name@example.com).");
      return;
    }
    setBusy(true);
    try {
      await sendMagicLinkRider(email.trim().toLowerCase());
      setLinkSent(true);
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Couldn't send the sign-in link.");
    }
    setBusy(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const magicResult = await completeMagicLinkSignInRider();
        if (magicResult) onAuthed(magicResult);
      } catch (err) {
        setError(err.message?.replace("Firebase: ", "") || "Sign-in failed.");
      }
    })();
  }, []);

  return (
    <div className="min-h-full w-full flex flex-col justify-center px-8" style={{ background: "#111318" }}>
      <div className="mb-10">
        <div className="w-11 h-11 rounded-2xl mb-6 flex items-center justify-center" style={{ background: ACCENT }}>
          <Navigation size={22} color="#111318" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#F5F5F0" }}>Welcome</h1>
        <p className="mt-1 text-sm" style={{ color: "#7A7F8A" }}>Sign in to keep moving.</p>
      </div>
      <div className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          autoComplete="email"
          className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
          style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        {linkSent && (
          <p className="text-xs" style={{ color: ACCENT }}>Check your email for a sign-in link — tap it on this device to continue.</p>
)}
        {error && <p className="text-sm" style={{ color: "#FF6B6B" }}>{error}</p>}
        <button type="button" onClick={handleSendMagicLink} disabled={busy}
          className="w-full py-3.5 rounded-xl font-medium text-base mt-1 transition active:scale-[0.98]"
          style={{ background: ACCENT, color: "#111318" }}>
          {busy ? "One sec…" : "Encompass Rideshare"}
        </button>
      </div>
      <button type="button" onClick={() => setShowHelp((s) => !s)}
        className="mt-6 text-sm text-center font-medium" style={{ color: ACCENT }}>
        Trouble signing in?
      </button>
      {showHelp && (
        <div className="mt-3 rounded-xl p-3 text-xs leading-relaxed" style={{ background: "#1D2028", color: "#B9BBC2", border: "1px solid #2B2F3A" }}>
          <p className="mb-1.5">• If "Continue with Google" doesn't finish, tap it again — sometimes it needs a second try.</p>
          <p className="mb-1.5">• Use the same sign-in method (Google or email) every time — they don't share one account.</p>
          <p>• With email, open the link on this same device to finish signing in.</p>
        </div>
      )}
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

// NOTE: MyPlanScreen / PlanStatusCard / NoPlanCard reference getRiderFlatratePlan (now
// imported above) and requestFlatratePlan (still missing — that function doesn't exist
// yet in lib/supabase-db.js). Tapping "Request Plan" will still error until that's added.
// Flagged separately — out of scope for the round-trip fix.
function MyPlanScreen({ user, onBack }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    async function load() {
      const activePlan = await getRiderFlatratePlan(user.uid);
      setPlan(activePlan);
      setLoading(false);
    }
    load();
  }, [user.uid]);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#F5F5F0" }}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
          <ChevronLeft size={18} color="#111318" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: "#111318" }}>My Weekly Plan</h2>
      </div>
      <div className="px-4 mt-2 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-sm" style={{ color: "#7A7F8A" }}>Loading...</p>
        ) : plan ? (
          <PlanStatusCard plan={plan} />
        ) : (
          <NoPlanCard userId={user.uid} onRequested={() => setShowSignup(false)} />
        )}
      </div>
    </div>
  );
}

function PlanStatusCard({ plan }) {
  if (plan.status === 'pending') {
    return (
      <div className="rounded-xl p-4" style={{ background: "#EDEBE2" }}>
        <p className="font-semibold" style={{ color: "#111318" }}>Request pending</p>
        <p className="text-sm mt-1" style={{ color: "#7A7F8A" }}>
          We're reviewing your plan request. We'll notify you once it's approved.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-4" style={{ background: "#EDEBE2" }}>
      <p className="font-semibold" style={{ color: "#111318" }}>Active Plan</p>
      <p className="text-sm mt-1" style={{ color: "#7A7F8A" }}>
        {plan.workdays.map(d => d.toUpperCase()).join(', ')} • {plan.rides_per_workday} rides/day • ${plan.weekly_price}/week
      </p>
    </div>
  );
}

function NoPlanCard({ userId, onRequested }) {
  const [ridesPerDay, setRidesPerDay] = useState(2);
  const [workdays, setWorkdays] = useState(['mon','tue','wed','thu','fri']);
  const [submitted, setSubmitted] = useState(false);
  const days = [['sun','Sun'],['mon','Mon'],['tue','Tue'],['wed','Wed'],['thu','Thu'],['fri','Fri'],['sat','Sat']];

  async function submit() {
    try {
      await requestFlatratePlan(userId, ridesPerDay, workdays);
      setSubmitted(true);
    } catch (err) {
      alert("Couldn't send your plan request yet — this feature isn't fully set up. (" + (err.message || "unknown error") + ")");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl p-4" style={{ background: "#EDEBE2" }}>
        <p className="font-semibold" style={{ color: "#111318" }}>Request sent!</p>
        <p className="text-sm mt-1" style={{ color: "#7A7F8A" }}>We'll follow up once your plan is approved.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ background: "#EDEBE2" }}>
      <p className="font-semibold mb-2" style={{ color: "#111318" }}>Request a Weekly Work Ride Plan</p>
      <p className="text-sm mb-3" style={{ color: "#7A7F8A" }}>Flat weekly rate for standard vehicle commute rides.</p>
      <label className="text-sm" style={{ color: "#111318" }}>Rides per workday</label>
      <input type="number" min="1" max="10" value={ridesPerDay}
        onChange={(e) => setRidesPerDay(Number(e.target.value))}
        className="border rounded p-2 w-full mt-1 mb-3" />
      <label className="text-sm" style={{ color: "#111318" }}>Work days</label>
      <div className="flex gap-2 flex-wrap mt-1 mb-3">
        {days.map(([key, label]) => (
          <button key={key} type="button"
            onClick={() => setWorkdays(w => w.includes(key) ? w.filter(d => d !== key) : [...w, key])}
            className={`px-3 py-1 rounded-full text-xs`}
            style={{ background: workdays.includes(key) ? "#111318" : "#fff", color: workdays.includes(key) ? "#fff" : "#111318" }}>
            {label}
          </button>
        ))}
      </div>
      <button onClick={submit} className="w-full py-3 rounded-xl font-medium" style={{ background: "#111318", color: "#F5F5F0" }}>
        Request Plan
      </button>
    </div>
  );
}
// ---------- Home ----------
function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || !deferredPrompt) return null;

  async function handleInstall() {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <button onClick={handleInstall} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-2"
      style={{ background: "#EDEBE2" }}>
      <span style={{ color: "#111318" }}>Download App</span>
    </button>
  );
}

function HomeScreen({ user, onRequest, onLogout, onSafety, onMyPlan }) {
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
<button onClick={onMyPlan} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-2"
  style={{ background: "#EDEBE2" }}>
  <span style={{ color: "#111318" }}>My Weekly Plan</span>
</button><InstallAppButton />
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
function DestinationScreen({ onBack, onConfirm, isReturnTrip }) {
  const [dest, setDest] = useState("");
  const [vehicle, setVehicle] = useState("standard");
  const [isFamilyRide, setIsFamilyRide] = useState(false);
  const [familyConsent, setFamilyConsent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
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
        <h2 className="text-base font-semibold" style={{ color: "#111318" }}>{isReturnTrip ? "Book your return ride" : "Set destination"}</h2>
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
              className="w-full flex items-center gap-3 p-3 rounded-xl transition"
              style={{ background: isFamilyRide ? "#FCE7EF" : "#fff", border: isFamilyRide ? "1.5px solid #E8547C" : "1px solid #E4E2D9" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isFamilyRide ? "#E8547C" : "#EDEBE2" }}>
                <Heart size={16} color={isFamilyRide ? "#fff" : "#7A7F8A"} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: "#111318" }}>This is a Family Ride</p>
                <p className="text-xs mt-0.5" style={{ color: "#7A7F8A" }}>Trusted, verified driver + live video for a child's trip</p>
              </div>
            </button>

            {isFamilyRide && (
              <div className="rounded-xl p-3.5" style={{ background: "#FCE7EF", border: "1px solid #F6C7D6" }}>
                <label className="flex items-start gap-2.5">
                  <input type="checkbox" checked={familyConsent} onChange={(e) => setFamilyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 flex-shrink-0" />
                  <span className="text-xs leading-relaxed" style={{ color: "#4A1D3F" }}>
                    I consent to live camera monitoring during this trip. I understand only I, as the booking parent/guardian, will be able to watch the live feed, and it ends automatically when the trip is complete.
                  </span>
                </label>
              </div>
            )}

            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#EDEBE2" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#111318" }}>{selectedVehicle.name} estimate</p>
                <p className="text-xs mt-0.5" style={{ color: "#7A7F8A" }}>
                  {baseTrip.miles} mi · ~{baseTrip.minutes} min
                </p>
              </div>
              <p className="text-xl font-semibold" style={{ color: ACCENT }}>${finalFare.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide mb-2 mt-1" style={{ color: "#9A9890" }}>How will you pay?</p>
              <div className="flex gap-2">
                <button onClick={() => setPaymentMethod("card")}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition"
                  style={{ background: paymentMethod === "card" ? "#111318" : "#fff", color: paymentMethod === "card" ? "#F5F5F0" : "#111318", border: paymentMethod === "card" ? `1.5px solid ${ACCENT}` : "1px solid #E4E2D9" }}>
                  💳 Card
                </button>
                <button onClick={() => setPaymentMethod("cash")}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition"
                  style={{ background: paymentMethod === "cash" ? "#111318" : "#fff", color: paymentMethod === "cash" ? "#F5F5F0" : "#111318", border: paymentMethod === "cash" ? `1.5px solid ${ACCENT}` : "1px solid #E4E2D9" }}>
                  💵 Cash
                </button>
              </div>
              {paymentMethod === "cash" && (
                <p className="text-xs mt-2" style={{ color: "#7A7F8A" }}>
                  Have ${finalFare.toFixed(2)} ready to pay your driver directly at the end of the trip.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        <button disabled={!canConfirm} onClick={() => onConfirm(dest.trim(), vehicle, finalFare, isFamilyRide, paymentMethod)}
          className="w-full py-3.5 rounded-xl font-medium text-base disabled:opacity-40" style={{ background: ACCENT, color: "#111318" }}>
          {dest.trim() ? `Confirm ${selectedVehicle.name} • $${finalFare.toFixed(2)}` : "Confirm destination"}
        </button>
      </div>
    </div>
  );
}

// ---------- Finding driver ----------
function FindingDriverScreen({ rideId, destination, onAccepted, onCancelled }) {
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const unsub = subscribeToRide(rideId, (ride) => {
      if (ride.status === "accepted") onAccepted(ride);
      else if (ride.status === "cancelled") setCancelled(true);
    });
    return unsub;
  }, [rideId]);

  if (cancelled) {
    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center px-8" style={{ background: "#111318" }}>
        <p className="text-base font-medium text-center" style={{ color: "#F5F5F0" }}>No driver was available for this ride.</p>
        <p className="text-sm mt-1 text-center" style={{ color: "#7A7F8A" }}>Please try requesting again.</p>
        <button onClick={onCancelled}
          className="mt-6 px-6 py-3 rounded-xl font-medium text-base"
          style={{ background: ACCENT, color: "#111318" }}>
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <CityMap driverPos={DRIVER_START} showRoute={false} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: ACCENT, opacity: 0.3 }} />
          <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
            <Car size={26} color="#111318" />
          </div>
        </div>
        <p className="text-base font-medium" style={{ color: "#F5F5F0" }}>Finding you a driver…</p>
        <p className="text-sm mt-1" style={{ color: "#7A7F8A" }}>Headed to {destination}</p>
      </div>
    </div>
  );
}

// ---------- Family Ride live-watch modal (pink frame) ----------
function FamilyWatchModal({ ride, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: FAMILY.bg }}>
      <div className="w-full max-w-sm mx-auto px-5 py-8">
        <button onClick={onClose} className="mb-4 text-sm font-medium" style={{ color: FAMILY.plumSoft }}>← Back to tracking</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 mb-1">
            <Heart size={14} fill={FAMILY.rose} color={FAMILY.rose} />
            <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: FAMILY.rose }}>Family Ride</p>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: FAMILY.plum }}>Watching live</h1>
        </div>

        <div className="relative mx-auto" style={{ width: "100%", maxWidth: 340 }}>
          <div className="relative aspect-square rounded-[6px] p-[14px]"
            style={{ background: `linear-gradient(155deg, ${FAMILY.frameGoldLight} 0%, ${FAMILY.frameGold} 45%, #B5748C 100%)`,
              boxShadow: "0 12px 30px -8px rgba(74,29,63,0.35), inset 0 0 0 1px rgba(255,255,255,0.4)" }}>
            <div className="w-full h-full rounded-[3px] p-[6px]" style={{ background: "#fff", boxShadow: "inset 0 2px 6px rgba(74,29,63,0.25)" }}>
              <div className="relative w-full h-full rounded-[2px] overflow-hidden bg-black">
                {ride.familyVideoUrl ? (
                  <iframe
                    src={`${ride.familyVideoUrl}?userName=Parent`}
                    allow="camera; microphone; autoplay; display-capture"
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xs" style={{ color: "#fff" }}>Waiting for driver to start the trip…</p>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(74,29,63,0.55)", color: "#fff" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: FAMILY.coral }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: FAMILY.coral }} />
                  </span>
                  LIVE
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: FAMILY.rose, boxShadow: "0 4px 10px -2px rgba(232,84,124,0.6)" }}>
              <Heart size={14} fill="#fff" color="#fff" />
            </div>
          </div>

          <div className="mx-auto -mt-3 relative z-10 px-5 py-2 rounded-full text-center" style={{ width: "82%",
            background: "linear-gradient(180deg, #F3D9DE 0%, #E8B4C4 100%)",
            boxShadow: "0 4px 10px -3px rgba(74,29,63,0.3), inset 0 1px 1px rgba(255,255,255,0.6)", border: "1px solid #D89AAE" }}>
            <p className="text-xs font-semibold tracking-wide" style={{ color: FAMILY.plum }}>
              Heading to {ride.destination}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: FAMILY.card, border: `1px solid ${FAMILY.cardBorder}` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: FAMILY.rose }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: FAMILY.plum }}>{ride.driverName || "Your driver"}</p>
            <p className="text-xs truncate" style={{ color: FAMILY.plumSoft }}>{ride.carModel}{ride.plate ? ` · ${ride.plate}` : ""}</p>
          </div>
        </div>

        <p className="text-center text-[11px] mt-6 leading-relaxed" style={{ color: FAMILY.plumSoft }}>
          This driver is Family Ride verified and background-checked.<br />
          The live feed ends automatically when the trip is complete.
        </p>
      </div>
    </div>
  );
}

// ---------- Tracking ----------
function TrackingScreen({ rideId, destination, onComplete }) {
  const [ride, setRide] = useState(null);
  const [t, setT] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [seenMsgCount, setSeenMsgCount] = useState(0);
  const [watchOpen, setWatchOpen] = useState(false);
  const rafRef = useRef();
  const startRef = useRef(null);
  const lastStatusRef = useRef(null);

  const pickupPath = [DRIVER_START, { x: DRIVER_START.x, y: 78 }, HOME];
  const tripPath = [HOME, { x: HOME.x, y: 45 }, { x: DEST.x, y: 45 }, DEST];

  useEffect(() => {
    const unsub = subscribeToRide(rideId, (r) => {
      setRide(r);
      if (r.status === "completed") onComplete(r);
    });
    return unsub;
  }, [rideId]);

  const status = ride?.status || "accepted";
  const phase = status === "accepted" ? "toPickup" : status === "arrived_pickup" ? "waitingPickup" : "toDest";

  useEffect(() => {
    if (lastStatusRef.current === phase) return;
    lastStatusRef.current = phase;
    setT(0);
    startRef.current = null;
  }, [phase]);

  useEffect(() => {
    if (phase === "waitingPickup") return;
    const duration = phase === "toPickup" ? 5000 : 6000;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      setT(progress);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const driverPos = phase === "waitingPickup" ? HOME : pointAt(phase === "toDest" ? tripPath : pickupPath, t);
  const statusText = {
    toPickup: "Driver is on the way",
    waitingPickup: "Driver has arrived — hop in",
    toDest: `Heading to ${destination}`,
  }[phase];

  const driverName = ride?.driverName || "Your driver";
  const carModel = ride?.carModel || "";
  const plate = ride?.plate || "";

  return (
    <div className="w-full h-full relative">
      <CityMap driverPos={driverPos} showRoute={phase !== "toPickup"} />
      <div className="absolute top-4 left-4 right-4">
        {ride?.driverRecording && (
          <div className="px-4 py-2.5 rounded-xl flex items-center gap-2 mb-2" style={{ background: "rgba(108,92,231,0.15)", border: `1px solid ${ACCENT}` }}>
            <Shield size={14} color={ACCENT} />
            <span className="text-xs" style={{ color: "#F5F5F0" }}>This trip may be audio recorded for safety</span>
          </div>
        )}
        {ride?.isFamilyRide && (
          <button onClick={() => setWatchOpen(true)}
            className="w-full px-4 py-2.5 rounded-xl flex items-center gap-2 mb-2" style={{ background: "#E8547C" }}>
            <Video size={14} color="#fff" />
            <span className="text-xs font-semibold" style={{ color: "#fff" }}>Watch live — Family Ride</span>
          </button>
        )}
        <div className="px-4 py-2.5 rounded-full flex items-center gap-2" style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: AMBER }} />
          <span className="text-sm" style={{ color: "#F5F5F0" }}>{statusText}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8" style={{ background: "#F5F5F0" }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: "#D8D6CE" }} />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
            <Car size={20} color="#111318" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "#111318" }}>{driverName}</p>
            <p className="text-xs" style={{ color: "#7A7F8A" }}>{carModel}{plate ? ` · ${plate}` : ""}</p>
          </div>
          <button onClick={() => { setChatOpen(true); setSeenMsgCount((ride?.messages || []).length); }} aria-label="Open chat"
            className="relative w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
            <MessageCircle size={18} color="#111318" />
            {(ride?.messages || []).length > seenMsgCount && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ background: AMBER }} />
            )}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "#7A7F8A" }}>
          <Clock size={13} />
          <span>{phase === "toPickup" ? "Arriving soon" : phase === "waitingPickup" ? "Waiting to start" : "En route"}</span>
        </div>
      </div>
      {chatOpen && (
        <ChatPanel rideId={rideId} mySender="rider" otherName={driverName} quickReplies={QUICK_REPLIES_RIDER} onClose={() => setChatOpen(false)} />
      )}
      {watchOpen && ride && <FamilyWatchModal ride={ride} onClose={() => setWatchOpen(false)} />}
    </div>
  );
}

// ---------- Ride complete ----------
function CompleteScreen({ destination, driverName, onDone, onRequestReturn }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8" style={{ background: "#111318" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: ACCENT }}>
        <Check size={28} color="#111318" />
      </div>
      <h2 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>Ride complete</h2>
      <p className="text-sm mt-1 mb-8 text-center" style={{ color: "#7A7F8A" }}>You arrived at {destination}{driverName ? ` with ${driverName}` : ""}.</p>
      <button onClick={onRequestReturn} className="w-full py-3.5 rounded-xl font-medium text-base mb-3"
        style={{ background: ACCENT, color: "#111318" }}>
        Need a ride back? Book return trip
      </button>
      <button onClick={onDone} className="w-full py-3.5 rounded-xl font-medium text-base"
        style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }}>
        Done
      </button>
    </div>
  );
}

// ---------- Root ----------
export default function RiderApp() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [destination, setDestination] = useState("");
  const [rideId, setRideId] = useState(null);
  const [finalDriverName, setFinalDriverName] = useState("");
  const [isReturnTrip, setIsReturnTrip] = useState(false);

  const handleConfirmDestination = async (dest, vehicleType, finalFare, isFamilyRide, paymentMethod) => {
    setDestination(dest);
    const trip = seededTrip(dest);

    const rideData = {
      riderName: user.name, riderUid: user.uid,
      destination: dest, fare: finalFare, miles: trip.miles, minutes: trip.minutes,
      vehicleType,
      isFamilyRide: !!isFamilyRide,
      riderRecording: !!user.audioRecordingEnabled,
      paymentMethod: paymentMethod || "card",
    };

    const id = await createRide(rideData);
    if (isFamilyRide) {
      try { await createFamilyRideRoom(id); } catch (e) { /* room creation failed — trip still proceeds without video */ }
    }
    setRideId(id);
    setIsReturnTrip(false);
    setScreen("finding");
  };

  const handleAccepted = (ride) => { setFinalDriverName(ride.driverName || ""); setScreen("tracking"); };
  const handleComplete = (ride) => { setFinalDriverName(ride.driverName || ""); setScreen("complete"); };
  const handleRequestReturn = () => { setIsReturnTrip(true); setScreen("destination"); };

  if (!user) {
    return (
      <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <AuthScreen onAuthed={(u) => { setUser(u); setScreen("home"); }} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
      {screen === "home" && <HomeScreen user={user} onRequest={() => { setIsReturnTrip(false); setScreen("destination"); }} onLogout={async () => { await signOut(); setUser(null); }} onSafety={() => setScreen("safety")} onMyPlan={() => setScreen("myplan")} />}
      {screen === "myplan" && <MyPlanScreen user={user} onBack={() => setScreen("home")} />}
      {screen === "safety" && <SafetyToolkitScreen user={user} onBack={() => setScreen("home")} onUpdateUser={setUser} />}
      {screen === "destination" && <DestinationScreen onBack={() => setScreen(isReturnTrip ? "complete" : "home")} onConfirm={handleConfirmDestination} isReturnTrip={isReturnTrip} />}
      {screen === "finding" && <FindingDriverScreen rideId={rideId} destination={destination} onAccepted={handleAccepted} onCancelled={() => setScreen("home")} />}
      {screen === "tracking" && <TrackingScreen rideId={rideId} destination={destination} onComplete={handleComplete} />}
      {screen === "complete" && <CompleteScreen destination={destination} driverName={finalDriverName} onDone={() => setScreen("home")} onRequestReturn={handleRequestReturn} />}
    </div>
  );
}
