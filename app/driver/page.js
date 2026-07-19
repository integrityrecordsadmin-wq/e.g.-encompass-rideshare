import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Add corporate email addresses here as you create their Firebase Auth
// accounts. Only these emails can log into /admin.
const ADMIN_EMAILS = [
  "rideshare513@gmail.com",
];

const googleProvider = new GoogleAuthProvider();

export async function startGoogleSignIn() {
  await signInWithRedirect(auth, googleProvider);
}

export async function completeGoogleSignInRider() {
  const result = await getRedirectResult(auth);
  if (!result) return null;
  const uid = result.user.uid;
  const snap = await getDoc(doc(db, "riders", uid));
  if (snap.exists()) return { uid, ...snap.data() };
  const profile = {
    name: result.user.displayName || "Rider",
    email: result.user.email,
    audioRecordingEnabled: false, rating: 5.0, ratingCount: 0,
    termsAcceptedAt: Date.now(), createdAt: Date.now(),
  };
  await setDoc(doc(db, "riders", uid), profile);
  return { uid, ...profile };
}

export async function completeGoogleSignInDriver() {
  const result = await getRedirectResult(auth);
  if (!result) return null;
  const uid = result.user.uid;
  const snap = await getDoc(doc(db, "drivers", uid));
  if (snap.exists()) return { uid, ...snap.data(), needsVehicleInfo: false };
  return {
    uid,
    needsVehicleInfo: true,
    name: result.user.displayName || "Driver",
    email: result.user.email,
  };
}

export async function sendMagicLinkDriver(email) {
  const actionCodeSettings = { url: "https://encompassrs.com/driver", handleCodeInApp: true };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("emailForSignIn", email);
}

export async function sendMagicLinkRider(email) {
  const actionCodeSettings = { url: "https://encompassrs.com/rider", handleCodeInApp: true };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("emailForSignIn", email);
}

export async function completeMagicLinkSignInDriver() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;
  let email = window.localStorage.getItem("emailForSignIn");
  if (!email) email = window.prompt("Please confirm your email to complete sign-in:");
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem("emailForSignIn");
  const uid = result.user.uid;
  const snap = await getDoc(doc(db, "drivers", uid));
  if (snap.exists()) return { uid, ...snap.data(), needsVehicleInfo: false };
  return { uid, needsVehicleInfo: true, name: "", email };
}

export async function completeMagicLinkSignInRider() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;
  let email = window.localStorage.getItem("emailForSignIn");
  if (!email) email = window.prompt("Please confirm your email to complete sign-in:");
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem("emailForSignIn");
  const uid = result.user.uid;
  const snap = await getDoc(doc(db, "riders", uid));
  if (snap.exists()) return { uid, ...snap.data() };
  const profile = {
    name: email.split("@")[0], email,
    audioRecordingEnabled: false, rating: 5.0, ratingCount: 0,
    termsAcceptedAt: Date.now(), createdAt: Date.now(),
  };
  await setDoc(doc(db, "riders", uid), profile);
  return { uid, ...profile };
}

export async function completeDriverGoogleSignup(uid, { name, email, carModel, plate, vehicleType }) {
  const profile = {
    name, email, carModel, plate, vehicleType: vehicleType || "standard", rating: 5.0, earningsToday: 0,
    audioRecordingEnabled: false, backgroundCheckStatus: "pending",
    documentsStatus: "not_submitted", documents: {}, pendingApproval: true,
    termsAcceptedAt: Date.now(), createdAt: Date.now(),
  };
  await setDoc(doc(db, "drivers", uid), profile);
  return { uid, ...profile };
}

export async function completeDriverMagicLinkSignup(uid, { name, email, carModel, plate, vehicleType }) {
  const profile = {
    name, email, carModel, plate, vehicleType: vehicleType || "standard", rating: 5.0, earningsToday: 0,
    audioRecordingEnabled: false, backgroundCheckStatus: "pending",
    documentsStatus: "not_submitted", documents: {}, pendingApproval: true,
    termsAcceptedAt: Date.now(), createdAt: Date.now(),
  };
  await setDoc(doc(db, "drivers", uid), profile);
  return { uid, ...profile };
}

export async function signUpRider({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = { name, email, audioRecordingEnabled: false, rating: 5.0, ratingCount: 0, termsAcceptedAt: Date.now(), createdAt: Date.now() };
  await setDoc(doc(db, "riders", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function signUpDriver({ name, email, password, carModel, plate, vehicleType }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = {
    name, email, carModel, plate, vehicleType: vehicleType || "standard", rating: 5.0, earningsToday: 0,
    audioRecordingEnabled: false, backgroundCheckStatus: "pending",
    documentsStatus: "not_submitted", documents: {}, pendingApproval: true,
    termsAcceptedAt: Date.now(), createdAt: Date.now(),
  };
  await setDoc(doc(db, "drivers", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function loginRider({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "riders", cred.user.uid));
  if (!snap.exists()) throw new Error("No rider profile found for this account.");
  return { uid: cred.user.uid, ...snap.data() };
}

export async function signUpFamily({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = { name, email, createdAt: Date.now() };
  await setDoc(doc(db, "familyProfiles", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function loginFamily({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "familyProfiles", cred.user.uid));
  if (!snap.exists()) {
    const profile = { name: cred.user.email.split("@")[0], email: cred.user.email, createdAt: Date.now() };
    await setDoc(doc(db, "familyProfiles", cred.user.uid), profile);
    return { uid: cred.user.uid, ...profile };
  }
  return { uid: cred.user.uid, ...snap.data() };
}

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createFamily(person) {
  const inviteCode = generateInviteCode();
  const familyRef = await addDoc(collection(db, "families"), {
    inviteCode,
    memberUids: [person.uid],
    roles: { [person.uid]: "guardian" },
    createdAt: Date.now(),
  });
  await updateDoc(doc(db, "familyProfiles", person.uid), { familyId: familyRef.id });
  return { id: familyRef.id, inviteCode, memberUids: [person.uid], roles: { [person.uid]: "guardian" } };
}

export async function joinFamily(person, inviteCode) {
  const q = query(collection(db, "families"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No family found with that invite code.");
  const familyDoc = snap.docs[0];
  const data = familyDoc.data();
  await updateDoc(doc(db, "families", familyDoc.id), {
    memberUids: arrayUnion(person.uid),
    [`roles.${person.uid}`]: "member",
  });
  await updateDoc(doc(db, "familyProfiles", person.uid), { familyId: familyDoc.id });
  return {
    id: familyDoc.id,
    ...data,
    memberUids: [...data.memberUids, person.uid],
    roles: { ...data.roles, [person.uid]: "member" },
  };
}

export function subscribeToFamily(familyId, onChange) {
  return onSnapshot(doc(db, "families", familyId), (snap) => {
    if (snap.exists()) onChange({ id: snap.id, ...snap.data() });
  });
}

export async function leaveFamily(person, familyId) {
  await updateDoc(doc(db, "families", familyId), {
    memberUids: arrayRemove(person.uid),
    [`roles.${person.uid}`]: deleteField(),
  });
  await updateDoc(doc(db, "familyProfiles", person.uid), { familyId: null });
}

export async function getFamilyMembers(memberUids) {
  const profiles = await Promise.all(
    memberUids.map(async (uid) => {
      const snap = await getDoc(doc(db, "familyProfiles", uid));
      return snap.exists() ? { uid, ...snap.data() } : { uid, name: "Member" };
    })
  );
  return profiles;
}

export async function removeFamilyMember(familyId, targetUid) {
  await updateDoc(doc(db, "families", familyId), {
    memberUids: arrayRemove(targetUid),
    [`roles.${targetUid}`]: deleteField(),
  });
}

export async function loginDriver({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "drivers", cred.user.uid));
  if (!snap.exists()) throw new Error("No driver profile found for this account.");
  return { uid: cred.user.uid, ...snap.data() };
}

export async function loginAdmin({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
    await firebaseSignOut(auth);
    throw new Error("This account is not authorized for admin access.");
  }
  return { uid: cred.user.uid, email: cred.user.email };
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function updateRiderProfile(uid, patch) {
  await updateDoc(doc(db, "riders", uid), patch);
}

export async function updateDriverProfile(uid, patch) {
  await updateDoc(doc(db, "drivers", uid), patch);
}

export async function uploadDriverDocument(uid, docType, file) {
  const fileRef = ref(storage, `driver-documents/${uid}/${docType}-${Date.now()}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

export async function submitDriverDocuments(uid, docs) {
  await updateDoc(doc(db, "drivers", uid), {
    documents: docs,
    documentsStatus: "pending_review",
    documentsSubmittedAt: Date.now(),
  });
}

export async function reviewDriverDocuments(uid, approved, reason) {
  await updateDoc(doc(db, "drivers", uid), {
    documentsStatus: approved ? "approved" : "rejected",
    documentsRejectionReason: approved ? null : (reason || "Documents did not meet requirements."),
    documentsReviewedAt: Date.now(),
    ...(approved ? { pendingApproval: false } : {}),
  });
}

export async function scheduleVerificationCall(uid, { scheduledAt, zoomLink }) {
  await updateDoc(doc(db, "drivers", uid), {
    documentsStatus: "call_scheduled",
    verificationCallAt: scheduledAt,
    verificationZoomLink: zoomLink,
  });
}

export async function createRide(ride) {
  const docRef = await addDoc(collection(db, "rides"), {
    ...ride,
    vehicleType: ride.vehicleType || "standard",
    status: "requested",
    createdAt: Date.now(),
    messages: [],
  });
  return docRef.id;
}

export async function updateRide(rideId, patch) {
  await updateDoc(doc(db, "rides", rideId), patch);
}

export async function appendRideMessage(rideId, sender, text) {
  await updateDoc(doc(db, "rides", rideId), {
    messages: arrayUnion({ sender, text, ts: Date.now() }),
  });
}

export function subscribeToRide(rideId, onChange) {
  return onSnapshot(doc(db, "rides", rideId), (snap) => {
    if (snap.exists()) onChange({ id: snap.id, ...snap.data() });
  });
}

export function subscribeToNextPendingRide(vehicleType, onRide) {
  const q = query(
    collection(db, "rides"),
    where("status", "==", "requested"),
    where("vehicleType", "==", vehicleType || "standard"),
    orderBy("createdAt", "asc"),
    limit(1)
  );
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      const d = snap.docs[0];
      onRide({ id: d.id, ...d.data() });
    }
  });
}

export function subscribeToAllRides(onChange, max = 100) {
  const q = query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToDrivers(onChange) {
  return onSnapshot(collection(db, "drivers"), (snap) => {
    onChange(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

export function subscribeToRiders(onChange) {
  return onSnapshot(collection(db, "riders"), (snap) => {
    onChange(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

export function subscribeToDriverRides(driverUid, onChange, max = 300) {
  const q = query(
    collection(db, "rides"),
    where("driverUid", "==", driverUid),
    where("status", "==", "completed"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function rateDriver(rideId, driverUid, stars) {
  await updateDoc(doc(db, "rides", rideId), { driverRatingByRider: stars });
  const driverRef = doc(db, "drivers", driverUid);
  const snap = await getDoc(driverRef);
  if (!snap.exists()) throw new Error("Driver not found.");
  const { rating = 5.0, ratingCount = 0 } = snap.data();
  const newCount = ratingCount + 1;
  const newRating = (rating * ratingCount + stars) / newCount;
  await updateDoc(driverRef, { rating: newRating, ratingCount: newCount });
}

export async function rateRider(rideId, riderUid, stars) {
  await updateDoc(doc(db, "rides", rideId), { riderRatingByDriver: stars });
  const riderRef = doc(db, "riders", riderUid);
  const snap = await getDoc(riderRef);
  if (!snap.exists()) throw new Error("Rider not found.");
  const { rating = 5.0, ratingCount = 0 } = snap.data();
  const newCount = ratingCount + 1;
  const newRating = (rating * ratingCount + stars) / newCount;
  await updateDoc(riderRef, { rating: newRating, ratingCount: newCount });
}

export async function getMemberRideActivity(uid) {
  const asRiderQ = query(collection(db, "rides"), where("riderUid", "==", uid), orderBy("createdAt", "desc"), limit(20));
  const asDriverQ = query(
    collection(db, "rides"),
    where("driverUid", "==", uid),
    where("status", "==", "completed"),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const [riderSnap, driverSnap] = await Promise.all([getDocs(asRiderQ), getDocs(asDriverQ)]);
  const asRider = riderSnap.docs.map((d) => ({ id: d.id, ...d.data(), memberRole: "rider" }));
  const asDriver = driverSnap.docs.map((d) => ({ id: d.id, ...d.data(), memberRole: "driver" }));
  return [...asRider, ...asDriver].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function subscribeToActiveAnnouncements(onChange) {
  const q = query(collection(db, "announcements"), where("active", "==", true), orderBy("createdAt", "desc"), limit(5));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createAnnouncement({ text, createdBy }) {
  await addDoc(collection(db, "announcements"), { text, createdBy, active: true, createdAt: Date.now() });
}

export async function deactivateAnnouncement(id) {
  await updateDoc(doc(db, "announcements", id), { active: false });
}

export async function setDriverOnlineStatus(uid, online, pushToken) {
  const patch = { online };
  if (pushToken) patch.pushToken = pushToken;
  await updateDoc(doc(db, "drivers", uid), patch);
}

export async function getOnlineDriverTokens(vehicleType) {
  const q = query(
    collection(db, "drivers"),
    where("online", "==", true),
    where("vehicleType", "==", vehicleType || "standard")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data())
    .filter((d) => d.pushToken && !d.pushDisabled)
    .map((d) => d.pushToken);
}

export async function createFamilyRideRoom(rideId) {
  const res = await fetch("/api/create-family-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rideId }),
  });
  if (!res.ok) throw new Error("Could not start live video for this ride.");
  const { url } = await res.json();
  await updateDoc(doc(db, "rides", rideId), { familyVideoUrl: url });
  return url;
}
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
          <p>When on, your trips are recorded on your own device — not on a server, not visible to riders or anyone else.</p>
          <p>Recordings stay locked. Only you can choose to submit one if you report a safety issue.</p>
          <p>Riders will see a notice that recording may be on for a trip. In some states, both sides must be notified before recording.</p>
        </div>
      </div>
    </div>
  );
}

// ---------- Home / Online toggle ----------
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
    setTimeout(() => audioCtx.close(), 300);
  } catch (e) {}
}

function DriverHomeScreen({ driver, online, setOnline, onProfile, onIncomingRide, onSafety, onEarnings }) {
  useEffect(() => {
    if (!online) return;
    const unsub = subscribeToNextPendingRide(driver.vehicleType, (ride) => onIncomingRide(ride));
    return unsub;
  }, [online]);

  const vehicleInfo = VEHICLE_TYPES.find((v) => v.id === (driver.vehicleType || "standard"));

  const handleToggleOnline = async () => {
    playChime();
    const next = !online;
    try {
      if (next) {
        let token = null;
        try {
          token = await registerForPush();
        } catch (pushErr) {
          console.error("Push registration failed, going online without it:", pushErr);
        }
        await setDriverOnlineStatus(driver.uid, true, token);
      } else {
        await setDriverOnlineStatus(driver.uid, false);
      }
      setOnline(next);
    } catch (err) {
      alert("Couldn't update your status: " + (err.message || "unknown error"));
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0"><CityMap driverPos={online ? DRIVER_HOME : null} showRoute={false} /></div>
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <button onClick={onProfile} aria-label="Account" className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
          <User size={18} color="#F5F5F0" />
        </button>
        <div className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5"
          style={{ background: "rgba(17,19,24,0.85)", color: "#7A7F8A", border: "1px solid #2B2F3A" }}>
          <DollarSign size={12} color={AMBER} />
          <span>${(driver.earningsToday || 0).toFixed(2)} today</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onEarnings} aria-label="Earnings" className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
            <BarChart3 size={17} color="#F5F5F0" />
          </button>
          <button onClick={onSafety} aria-label="Safety toolkit" className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
            <Shield size={17} color={driver.audioRecordingEnabled ? AMBER : "#F5F5F0"} />
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8" style={{ background: "#F5F5F0" }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: "#D8D6CE" }} />
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="font-semibold text-lg" style={{ color: "#111318" }}>{driver.name.split(" ")[0]}</p>
            <p className="text-xs" style={{ color: "#7A7F8A" }}>{driver.carModel} · {driver.plate}</p>
            <p className="text-xs mt-0.5" style={{ color: ACCENT }}>{vehicleInfo?.name} driver</p>
          </div>
          <div className="flex items-center gap-1">
            <Star size={13} fill={AMBER} color={AMBER} />
            <span className="text-xs font-medium" style={{ color: "#111318" }}>{(driver.rating || 5).toFixed(2)}</span>
          </div>
        </div>
        <button onClick={handleToggleOnline}
          className="w-full mt-5 py-4 rounded-xl font-medium text-base flex items-center justify-center gap-2 active:scale-[0.98] transition"
          style={{ background: online ? "#111318" : ACCENT, color: online ? AMBER : "#111318" }}>
          <Power size={17} />
          {online ? "Go offline" : "Go online"}
        </button>
        <p className="text-xs text-center mt-3" style={{ color: "#9A9890" }}>
          {online ? "You're online — listening for real ride requests…" : "You're offline. Go online to start receiving requests."}
        </p>
      </div>
    </div>
  );
}

// ---------- Incoming request ----------
function IncomingRequestScreen({ ride, onAccept, onDecline }) {
  const [seconds, setSeconds] = useState(15);

  useEffect(() => {
    if (seconds <= 0) { onDecline(); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    let audioCtx;
    let interval;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      };
      beep();
      interval = setInterval(beep, 1200);
      if (navigator.vibrate) navigator.vibrate([250, 150, 250]);
    } catch (e) {}
    return () => {
      clearInterval(interval);
      if (audioCtx) audioCtx.close();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-20 pointer-events-none rounded-[2rem] animate-pulse"
        style={{ boxShadow: `inset 0 0 0 4px ${ACCENT}` }} />
      <CityMap driverPos={PICKUP} markerColor={ACCENT} showRoute={false} pins={[{ ...DROPOFF, color: AMBER }]} />
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="rounded-t-3xl p-5 pb-8" style={{ background: "#F5F5F0" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>New ride request</span>
            <span className="text-xs font-semibold" style={{ color: "#111318" }}>{seconds}s</span>
          </div>
          <div className="w-full h-1 rounded-full mb-5" style={{ background: "#E4E2D9" }}>
            <div className="h-1 rounded-full transition-all" style={{ width: `${(seconds / 15) * 100}%`, background: ACCENT }} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
              <User size={18} color="#111318" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111318" }}>{ride.riderName}</p>
              <p className="text-xs" style={{ color: "#7A7F8A" }}>{ride.miles} mi · ~{ride.minutes} min</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-semibold text-sm" style={{ color: "#111318" }}>${ride.fare.toFixed(2)}</p>
            </div>
          </div>
          {ride.isFamilyRide && (
            <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "#FCE7EF" }}>
              <span className="text-xs font-semibold" style={{ color: "#E8547C" }}>❤ Family Ride — live video required</span>
            </div>
          )}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#111318" }}>
              <MapPin size={14} color={ACCENT} /> Pickup: Rider's current location
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#111318" }}>
              <MapPin size={14} color={AMBER} /> Drop-off: {ride.destination}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onDecline}
              className="flex-1 py-3.5 rounded-xl font-medium text-base flex items-center justify-center gap-2"
              style={{ background: "#EDEBE2", color: "#111318" }}>
              <X size={16} /> Decline
            </button>
            <button onClick={onAccept}
              className="flex-1 py-3.5 rounded-xl font-medium text-base flex items-center justify-center gap-2"
              style={{ background: ACCENT, color: "#111318" }}>
              <Check size={16} /> Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Trip in progress ----------
function TripScreen({ ride, driver, onComplete }) {
  const [phase, setPhase] = useState("toPickup");
  const [t, setT] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [seenMsgCount, setSeenMsgCount] = useState((ride.messages || []).length);
  const [liveMsgCount, setLiveMsgCount] = useState((ride.messages || []).length);
  const rafRef = useRef();
  const startRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToRide(ride.id, (r) => setLiveMsgCount((r.messages || []).length));
    return unsub;
  }, [ride.id]);

  const toPickupPath = [DRIVER_HOME, { x: DRIVER_HOME.x, y: PICKUP.y }, PICKUP];
  const toDropoffPath = [PICKUP, { x: PICKUP.x, y: DROPOFF.y }, DROPOFF];
  const activePath = phase === "toPickup" ? toPickupPath : toDropoffPath;
  const duration = phase === "toPickup" ? 4000 : 5500;

  useEffect(() => {
    if (phase === "arrivedPickup" || phase === "arrivedDropoff") return;
    startRef.current = null;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      setT(progress);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else if (phase === "toPickup") { setPhase("arrivedPickup"); updateRide(ride.id, { status: "arrived_pickup" }); }
      else if (phase === "toDropoff") setPhase("arrivedDropoff");
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const markerPos = phase === "arrivedPickup" ? PICKUP : phase === "arrivedDropoff" ? DROPOFF : pointAt(activePath, t);
  const statusText = {
    toPickup: "Heading to pickup",
    arrivedPickup: "You've arrived at pickup",
    toDropoff: `En route to ${ride.destination}`,
    arrivedDropoff: "You've arrived at drop-off",
  }[phase];

  const startTrip = async () => {
    await updateRide(ride.id, { status: "in_progress" });
    setPhase("toDropoff");
    setT(0);
  };

  const inTrip = phase === "toDropoff" || phase === "arrivedDropoff";

  return (
    <div className="relative w-full h-full">
      <CityMap
        driverPos={markerPos}
        markerColor={ACCENT}
        showRoute
        routePath={phase === "toPickup" || phase === "arrivedPickup" ? toPickupPath : toDropoffPath}
        pins={[{ ...(phase === "toPickup" || phase === "arrivedPickup" ? DROPOFF : PICKUP), color: "#7A7F8A" }]}
      />

      {ride.isFamilyRide && inTrip && ride.familyVideoUrl && (
        <div className="absolute top-4 right-4 w-24 h-24 rounded-2xl overflow-hidden z-10"
          style={{ border: "2px solid #E8547C", boxShadow: "0 6px 16px -4px rgba(0,0,0,0.4)" }}>
          <iframe
            src={`${ride.familyVideoUrl}?userName=Driver`}
            allow="camera; microphone; autoplay; display-capture"
            className="w-full h-full border-0"
          />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
            LIVE
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4">
        {ride.riderRecording && (
          <div className="px-4 py-2.5 rounded-xl flex items-center gap-2 mb-2" style={{ background: "rgba(108,92,231,0.15)", border: `1px solid ${ACCENT}` }}>
            <Shield size={14} color={ACCENT} />
            <span className="text-xs" style={{ color: "#F5F5F0" }}>Rider may be audio recording this trip</span>
          </div>
        )}
        {ride.isFamilyRide && (
          <div className="px-4 py-2 rounded-xl flex items-center gap-2 mb-2" style={{ background: "rgba(232,84,124,0.2)", border: "1px solid #E8547C" }}>
            <span className="text-xs font-medium" style={{ color: "#F5F5F0" }}>❤ Family Ride — parent is watching live</span>
          </div>
        )}
        <div className="px-4 py-2.5 rounded-full flex items-center gap-2" style={{ background: "rgba(17,19,24,0.85)", border: "1px solid #2B2F3A" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: phase.startsWith("arrived") ? "#4ADE80" : AMBER }} />
          <span className="text-sm" style={{ color: "#F5F5F0" }}>{statusText}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8" style={{ background: "#F5F5F0" }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: "#D8D6CE" }} />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
            <User size={18} color="#111318" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#111318" }}>{ride.riderName}</p>
            <p className="text-xs" style={{ color: "#7A7F8A" }}>Rider</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-semibold text-sm" style={{ color: "#111318" }}>${ride.fare.toFixed(2)}</p>
          </div>
          <button onClick={() => { setChatOpen(true); setSeenMsgCount(liveMsgCount); }} aria-label="Open chat"
            className="relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EDEBE2" }}>
            <MessageCircle size={18} color="#111318" />
            {liveMsgCount > seenMsgCount && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ background: AMBER }} />}
          </button>
        </div>
        {(phase === "toPickup" || phase === "toDropoff") && (
          <a href={wazeNavigateUrl(phase === "toPickup" ? `Pickup for ${ride.riderName}` : ride.destination)}
            target="_blank" rel="noopener noreferrer"
            className="w-full mb-2.5 py-3.5 rounded-xl font-medium text-base flex items-center justify-center gap-2"
            style={{ background: "#111318", color: "#F5F5F0" }}>
            <Navigation size={16} color={AMBER} /> Navigate in Waze
          </a>
        )}
        {phase === "arrivedPickup" && (
          <button onClick={startTrip} className="w-full py-3.5 rounded-xl font-medium text-base" style={{ background: ACCENT, color: "#111318" }}>
            Start trip
          </button>
        )}
        {phase === "arrivedDropoff" && (
          <button onClick={onComplete}
            className="w-full py-3.5 rounded-xl font-medium text-base flex items-center justify-center gap-2"
            style={{ background: ACCENT, color: "#111318" }}>
            <Check size={16} /> Complete ride
          </button>
        )}
        {(phase === "toPickup" || phase === "toDropoff") && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#7A7F8A" }}>
            <Clock size={13} /> <span>In progress…</span>
          </div>
        )}
      </div>
      {chatOpen && (
        <ChatPanel rideId={ride.id} mySender="driver" otherName={ride.riderName} quickReplies={QUICK_REPLIES_DRIVER} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

// ---------- Earnings (post-ride) ----------
function EarningsScreen({ fare, onDone }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8" style={{ background: "#111318" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: ACCENT }}>
        <DollarSign size={28} color="#111318" />
      </div>
      <h2 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>Ride complete</h2>
      <p className="text-sm mt-1 mb-2 text-center" style={{ color: "#7A7F8A" }}>You earned</p>
      <p className="text-3xl font-semibold mb-8" style={{ color: AMBER }}>${fare.toFixed(2)}</p>
      <button onClick={onDone} className="w-full py-3.5 rounded-xl font-medium text-base" style={{ background: ACCENT, color: "#111318" }}>Back online</button>
    </div>
  );
}

// ---------- Earnings Hub ----------
function EarningsHubScreen({ driver, onBack, onUpdateDriver }) {
  const [rides, setRides] = useState([]);
  const [filter, setFilter] = useState("All");
  const [mpg, setMpg] = useState(driver.mpg || 25);
  const [gasPrice, setGasPrice] = useState(driver.gasPrice || 3.5);

  useEffect(() => {
    const unsub = subscribeToDriverRides(driver.uid, setRides);
    return unsub;
  }, [driver.uid]);

  const saveVehicleInfo = async () => {
    await updateDriverProfile(driver.uid, { mpg: Number(mpg), gasPrice: Number(gasPrice) });
    onUpdateDriver({ ...driver, mpg: Number(mpg), gasPrice: Number(gasPrice) });
  };

  const periodOf = (ts) => {
    const h = new Date(ts).getHours();
    if (h < 12) return "AM";
    if (h < 17) return "MID";
    return "PM";
  };

  const startOfWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const compute = (list) => {
    const miles = list.reduce((s, r) => s + (r.miles || 0), 0);
    const earnings = list.reduce((s, r) => s + (r.fare || 0), 0);
    const minutes = list.reduce((s, r) => s + (r.minutes || 0), 0);
    const gasCost = mpg > 0 ? (miles / mpg) * gasPrice : 0;
    const net = earnings - gasCost;
    return {
      miles: miles.toFixed(1),
      avgMpg: mpg,
      gasCost: gasCost.toFixed(2),
      earnings: earnings.toFixed(2),
      netPerHour: minutes > 0 ? (net / (minutes / 60)).toFixed(2) : "0.00",
      netPerMile: miles > 0 ? (net / miles).toFixed(2) : "0.00",
    };
  };

  const ytdRides = rides.filter((r) => new Date(r.createdAt).getFullYear() === new Date().getFullYear());
  const weekRides = rides.filter((r) => r.createdAt >= startOfWeek);
  const filteredWeekRides = filter === "All" ? weekRides : weekRides.filter((r) => periodOf(r.createdAt) === filter);

  const ytd = compute(ytdRides);
  const week = compute(weekRides);

  const StatGrid = ({ stats }) => (
    <div className="grid grid-cols-3 gap-2">
      {[
        [stats.miles, "Miles"], [stats.avgMpg, "Avg MPG"], [`$${stats.gasCost}`, "Gas Cost"],
        [`$${stats.earnings}`, "Earnings"], [`$${stats.netPerHour}`, "Net/Hr"], [`$${stats.netPerMile}`, "Net/Mi"],
      ].map(([val, label]) => (
        <div key={label} className="rounded-xl p-3" style={{ background: "#1D2028", border: "1px solid #2B2F3A" }}>
          <p className="text-lg font-semibold" style={{ color: "#F5F5F0" }}>{val}</p>
          <p className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: "#111318" }}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#1D2028" }}>
          <ChevronLeft size={18} color="#F5F5F0" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: "#F5F5F0" }}>Earnings</h2>
      </div>

      <div className="px-4 mt-2">
        <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>{new Date().getFullYear()} — YTD</p>
        <StatGrid stats={ytd} />
      </div>

      <div className="px-4 mt-6">
        <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>This Week</p>
        <StatGrid stats={week} />
      </div>

      <div className="px-4 mt-6 flex items-center justify-between">
        <p className="text-xs" style={{ color: "#9CA3AF" }}>This Week's Shifts</p>
        <div className="flex gap-1">
          {["All", "AM", "MID", "PM"].map((p) => (
            <button key={p} onClick={() => setFilter(p)}
              className="px-3 py-1 rounded-full text-xs"
              style={{ background: filter === p ? ACCENT : "#1D2028", color: filter === p ? "#111318" : "#9CA3AF" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-2 pb-4">
        {filteredWeekRides.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: "#9CA3AF" }}>No shifts yet this period.</p>
        )}
        {filteredWeekRides.map((r) => {
          const gas = mpg > 0 ? (r.miles / mpg) * gasPrice : 0;
          const netHr = r.minutes > 0 ? ((r.fare - gas) / (r.minutes / 60)).toFixed(2) : "0.00";
          return (
            <div key={r.id} className="rounded-xl p-3 flex items-center justify-between text-xs"
              style={{ background: "#1D2028", border: "1px solid #2B2F3A" }}>
              <span style={{ color: "#F5F5F0" }}>{new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <span style={{ color: "#9CA3AF" }}>{r.miles?.toFixed(1)} mi</span>
              <span style={{ color: "#9CA3AF" }}>${gas.toFixed(2)}</span>
              <span style={{ color: AMBER }}>${r.fare?.toFixed(2)}</span>
              <span style={{ color: "#F5F5F0" }}>${netHr}/hr</span>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-2 pb-8">
        <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Vehicle info (for gas cost calc)</p>
        <div className="flex gap-2">
          <input value={mpg} onChange={(e) => setMpg(e.target.value)} type="number" placeholder="MPG"
            aria-label="Vehicle MPG"
            className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
          <input value={gasPrice} onChange={(e) => setGasPrice(e.target.value)} type="number" step="0.01" placeholder="$/gallon"
            aria-label="Gas price per gallon"
            className="w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        </div>
        <button onClick={saveVehicleInfo} className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: ACCENT, color: "#111318" }}>
          Save
        </button>
      </div>
    </div>
  );
}

// ---------- Profile ----------
function ProfileScreen({ driver, onBack, onLogout }) {
  const statusInfo = {
    pending: { label: "Background check pending", color: "#9CA3AF" },
    cleared: { label: "Background check cleared", color: "#4ADE80" },
    failed: { label: "Background check not passed", color: "#FF6B6B" },
  }[driver.backgroundCheckStatus || "pending"];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#111318" }}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#1D2028" }}>
          <ChevronLeft size={18} color="#F5F5F0" />
        </button>
        <h2 className="text-base font-semibold" style={{ color: "#F5F5F0" }}>Profile</h2>
      </div>

      <div className="px-4 mt-4 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: ACCENT }}>
          <User size={32} color="#111318" />
        </div>
        <p className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>{driver.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={13} fill={AMBER} color={AMBER} />
          <span className="text-sm" style={{ color: "#9CA3AF" }}>{(driver.rating || 5).toFixed(2)}</span>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-2">
        <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#1D2028", border: "1px solid #2B2F3A" }}>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Email</span>
          <span className="text-sm" style={{ color: "#F5F5F0" }}>{driver.email}</span>
        </div>
        <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#1D2028", border: "1px solid #2B2F3A" }}>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Vehicle</span>
          <span className="text-sm" style={{ color: "#F5F5F0" }}>{driver.carModel}</span>
        </div>
        <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#1D2028", border: "1px solid #2B2F3A" }}>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Plate</span>
          <span className="text-sm" style={{ color: "#F5F5F0" }}>{driver.plate}</span>
        </div>
        <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#1D2028", border: "1px solid #2B2F3A" }}>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Verification</span>
          <span className="text-sm font-medium" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
        </div>
      </div>

      <div className="px-4 mt-auto pb-8 pt-6">
        <button onClick={onLogout}
          className="w-full py-3.5 rounded-xl font-medium text-base"
          style={{ background: "#1D2028", color: "#FF6B6B", border: "1px solid #2B2F3A" }}>
          Log out
        </button>
      </div>
    </div>
  );
}

// ---------- Root ----------
// ---------- Waiting room gate: catches any account missing vehicle info ----------
function VehicleInfoGateScreen({ driver, onComplete }) {
  const [carModel, setCarModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("standard");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!carModel || !plate) { setError("Fill in your car model and plate to continue."); return; }
    setBusy(true);
    try {
      await updateDriverProfile(driver.uid, { carModel, plate, vehicleType });
      onComplete({ ...driver, carModel, plate, vehicleType });
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Something went wrong.");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-full w-full flex flex-col justify-center px-8" style={{ background: "#111318" }}>
      <div className="mb-8">
        <div className="w-11 h-11 rounded-2xl mb-6 flex items-center justify-center" style={{ background: ACCENT }}>
          <Car size={22} color="#111318" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#F5F5F0" }}>One more thing, {driver.name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm" style={{ color: "#7A7F8A" }}>We need your vehicle details before you can go online.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-3">
          <input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Car (e.g. Silver Camry)"
            className="w-2/3 px-4 py-3.5 rounded-xl text-base outline-none"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
          <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Plate"
            className="w-1/3 px-4 py-3.5 rounded-xl text-base outline-none"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        </div>
        <div>
          <p className="text-xs mb-2" style={{ color: "#7A7F8A" }}>What do you drive?</p>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLE_TYPES.map((v) => {
              const Icon = v.icon;
              const isSelected = vehicleType === v.id;
              return (
                <button key={v.id} type="button" onClick={() => setVehicleType(v.id)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left"
                  style={{ background: isSelected ? ACCENT : "#1D2028", border: `1px solid ${isSelected ? ACCENT : "#2B2F3A"}` }}>
                  <Icon size={16} color={isSelected ? "#111318" : "#F5F5F0"} />
                  <span className="text-xs font-medium" style={{ color: isSelected ? "#111318" : "#F5F5F0" }}>{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: "#FF6B6B" }}>{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full py-3.5 rounded-xl font-medium text-base mt-2 transition active:scale-[0.98]"
          style={{ background: ACCENT, color: "#111318" }}>
          {busy ? "One sec…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

// ---------- Pending admin approval ----------
function PendingApprovalScreen({ onLogout }) {
  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center px-8 text-center" style={{ background: "#111318" }}>
      <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center" style={{ background: ACCENT }}>
        <Shield size={26} color="#111318" strokeWidth={2.5} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: "#F5F5F0" }}>Almost ready</h1>
      <p className="text-sm mb-8" style={{ color: "#7A7F8A" }}>
        Your account is being reviewed. You'll be able to go online as soon as it's approved — this is usually quick.
      </p>
      <button onClick={onLogout}
        className="px-6 py-3 rounded-xl font-medium text-sm" style={{ background: "#1D2028", color: "#FF6B6B", border: "1px solid #2B2F3A" }}>
        Log out
      </button>
    </div>
  );
}

export default function DriverApp() {
  const [driver, setDriver] = useState(null);
  const [online, setOnline] = useState(false);
  const [screen, setScreen] = useState("home");
  const [activeRide, setActiveRide] = useState(null);
  const [lastFare, setLastFare] = useState(0);

  const handleIncomingRide = (ride) => { setActiveRide(ride); setScreen("request"); };

  const handleAccept = async () => {
    await updateRide(activeRide.id, {
      status: "accepted", driverName: driver.name, driverUid: driver.uid,
      carModel: driver.carModel, plate: driver.plate,
      driverRecording: !!driver.audioRecordingEnabled,
    });
    setScreen("trip");
  };

  const handleDecline = async () => {
    if (activeRide) await updateRide(activeRide.id, { status: "cancelled" });
    setActiveRide(null);
    setScreen("home");
  };

  const handleComplete = async () => {
    await updateRide(activeRide.id, { status: "completed" });
    const newEarnings = (driver.earningsToday || 0) + activeRide.fare;
    await updateDriverProfile(driver.uid, { earningsToday: newEarnings });
    setDriver({ ...driver, earningsToday: newEarnings });
    setLastFare(activeRide.fare);
    setActiveRide(null);
    setScreen("earnings");
  };

  if (!driver) {
    return (
      <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <DriverAuthScreen onAuthed={(d) => setDriver(d)} />
      </div>
    );
  }

  if (!driver.carModel || !driver.plate) {
    return (
      <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <VehicleInfoGateScreen driver={driver} onComplete={(updated) => setDriver(updated)} />
      </div>
    );
  }

  if (driver.pendingApproval) {
    return (
      <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <PendingApprovalScreen onLogout={async () => { await signOut(); setDriver(null); }} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
      {screen === "home" && (
        <DriverHomeScreen driver={driver} online={online} setOnline={setOnline}
          onProfile={() => setScreen("profile")}
          onIncomingRide={handleIncomingRide} onSafety={() => setScreen("safety")} onEarnings={() => setScreen("earningsHub")} />
      )}
      {screen === "profile" && (
        <ProfileScreen driver={driver} onBack={() => setScreen("home")}
          onLogout={async () => { await signOut(); setDriver(null); }} />
      )}
      {screen === "safety" && <SafetyToolkitScreen driver={driver} onBack={() => setScreen("home")} onUpdateDriver={setDriver} />}
      {screen === "earningsHub" && <EarningsHubScreen driver={driver} onBack={() => setScreen("home")} onUpdateDriver={setDriver} />}
      {screen === "request" && activeRide && <IncomingRequestScreen ride={activeRide} onAccept={handleAccept} onDecline={handleDecline} />}
      {screen === "trip" && activeRide && <TripScreen ride={activeRide} driver={driver} onComplete={handleComplete} />}
      {screen === "earnings" && <EarningsScreen fare={lastFare} onDone={() => setScreen("home")} />}
    </div>
  );
}
