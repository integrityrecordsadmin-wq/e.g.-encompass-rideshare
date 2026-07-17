import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Add corporate email addresses here as you create their Firebase Auth
// accounts. Only these emails can log into /admin.
const ADMIN_EMAILS = [
  "rideshareadmin513@gmail.com",
];

export async function signUpRider({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = { name, email, audioRecordingEnabled: false, termsAcceptedAt: Date.now(), createdAt: Date.now() };
  await setDoc(doc(db, "riders", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function signUpDriver({ name, email, password, carModel, plate, vehicleType }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = {
    name, email, carModel, plate, vehicleType: vehicleType || "standard", rating: 5.0, earningsToday: 0,
    audioRecordingEnabled: false, backgroundCheckStatus: "pending",
    documentsStatus: "not_submitted", documents: {},
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

export async function loginDriver({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "drivers", cred.user.uid));
  if (!snap.exists()) throw new Error("No driver profile found for this account.");
  return { uid: cred.user.uid, ...snap.data() };
}

// Admin login — reuses Firebase Auth, but only allows access if the signed-in
// email is on the approved admin list above.
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
  });
}

// Corporate schedules a driver's verification call (documents + vehicle check).
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
