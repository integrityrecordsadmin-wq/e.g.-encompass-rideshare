import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
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
  serverTimestamp,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Accounts. Firebase Auth handles the actual login/password; a matching
// profile document in "riders" or "drivers" (keyed by the auth uid) holds
// the app-specific fields (name, car, plate, earnings, safety prefs, etc).
// ---------------------------------------------------------------------------

export async function signUpRider({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = { name, email, audioRecordingEnabled: false, createdAt: Date.now() };
  await setDoc(doc(db, "riders", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function signUpDriver({ name, email, password, carModel, plate }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = {
    name, email, carModel, plate, rating: 5.0, earningsToday: 0,
    audioRecordingEnabled: false, createdAt: Date.now(),
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

export async function loginDriver({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "drivers", cred.user.uid));
  if (!snap.exists()) throw new Error("No driver profile found for this account.");
  return { uid: cred.user.uid, ...snap.data() };
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function updateRiderProfile(uid, patch) {
  await updateDoc(doc(db, "riders", uid), patch);
}

export async function updateDriverProfile(uid, patch) {
  await updateDoc(doc(db, "drivers", uid), patch);
}

// ---------------------------------------------------------------------------
// Rides. One document per ride in the "rides" collection. Real-time listeners
// (onSnapshot) replace the artifact version's polling — updates from the
// other side arrive instantly instead of every couple seconds.
// ---------------------------------------------------------------------------

export async function createRide(ride) {
  const docRef = await addDoc(collection(db, "rides"), {
    ...ride,
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
// Subscribe to one driver's completed rides — powers the earnings/shift report.
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
// Subscribe to a single ride's live document. Calls onChange(rideData) any
// time it updates (accepted, status change, new message, etc). Returns an
// unsubscribe function — call it in a useEffect cleanup.
export function subscribeToRide(rideId, onChange) {
  return onSnapshot(doc(db, "rides", rideId), (snap) => {
    if (snap.exists()) onChange({ id: snap.id, ...snap.data() });
  });
}

// Subscribe to the single oldest still-"requested" ride, for a driver who is
// online and waiting for a match. Calls onRide(rideData) as soon as one
// appears.
export function subscribeToNextPendingRide(onRide) {
  const q = query(
    collection(db, "rides"),
    where("status", "==", "requested"),
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

// Subscribe to every ride, newest first — used by the admin dashboard.
export function subscribeToAllRides(onChange, max = 100) {
  const q = query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Subscribe to every registered driver / rider — used by the admin dashboard.
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
