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
  onAuthStateChanged,
} from "firebase/auth";

// Safari on iOS sometimes clears the storage getRedirectResult() needs to read
// across the Google redirect, even though the sign-in itself succeeded. This
// fallback checks the live auth state directly as a second chance before
// giving up and treating it as "not signed in."
function waitForCurrentUser(timeoutMs = 2500) {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const timeout = setTimeout(() => {
      unsub();
      resolve(null);
    }, timeoutMs);
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsub();
      resolve(user);
    });
  });
}
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
  runTransaction,
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
  let user = result ? result.user : null;
  if (!user) user = await waitForCurrentUser();
  if (!user) return null;
  const uid = user.uid;
  const snap = await getDoc(doc(db, "riders", uid));
  if (snap.exists()) return { uid, ...snap.data() };
  const profile = {
    name: user.displayName || "Rider",
    email: user.email,
    audioRecordingEnabled: false, rating: 5.0, ratingCount: 0,
    termsAcceptedAt: Date.now(), createdAt: Date.now(),
  };
  await setDoc(doc(db, "riders", uid), profile);
  return { uid, ...profile };
}

export async function completeGoogleSignInDriver() {
  const result = await getRedirectResult(auth);
  let user = result ? result.user : null;
  if (!user) user = await waitForCurrentUser();
  if (!user) return null;
  const uid = user.uid;
  const snap = await getDoc(doc(db, "drivers", uid));
  if (snap.exists()) return { uid, ...snap.data(), needsVehicleInfo: false };
  return {
    uid,
    needsVehicleInfo: true,
    name: user.displayName || "Driver",
    email: user.email,
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
useEffect(() => {
  if (!ride || ride.status !== "in_progress") return;
  if (!navigator.geolocation) return;

  let lastSent = 0;
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const now = Date.now();
      if (now - lastSent < 5000) return;
      lastSent = now;
      updateDriverLocation(ride.id, pos.coords.latitude, pos.coords.longitude);
    },
    (err) => console.error("Location error:", err),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [ride?.id, ride?.status]);
export async function completeGoogleSignInFamily() {
  const result = await getRedirectResult(auth);
  let user = result ? result.user : null;
  if (!user) user = await waitForCurrentUser();
  if (!user) return null;
  const uid = user.uid;
  const snap = await getDoc(doc(db, "familyProfiles", uid));
  if (snap.exists()) return { uid, ...snap.data() };
  const profile = { name: user.displayName || "Family", email: user.email, createdAt: Date.now() };
  await setDoc(doc(db, "familyProfiles", uid), profile);
  return { uid, ...profile };
}

export async function sendMagicLinkFamily(email) {
  const actionCodeSettings = { url: "https://encompassrs.com/family", handleCodeInApp: true };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("emailForSignIn", email);
}

export async function completeMagicLinkSignInFamily() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;
  let email = window.localStorage.getItem("emailForSignIn");
  if (!email) email = window.prompt("Please confirm your email to complete sign-in:");
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem("emailForSignIn");
  const uid = result.user.uid;
  const snap = await getDoc(doc(db, "familyProfiles", uid));
  if (snap.exists()) return { uid, ...snap.data() };
  const profile = { name: email.split("@")[0], email, createdAt: Date.now() };
  await setDoc(doc(db, "familyProfiles", uid), profile);
  return { uid, ...profile };
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
export async function updateDriverLocation(rideId, lat, lng) {
  await updateDoc(doc(db, "rides", rideId), {
    driverLocation: { lat, lng, updatedAt: Date.now() },
  });
}

export function subscribeToFamilyActiveRide(memberUids, onChange) {
  if (!memberUids?.length) { onChange(null); return () => {}; }
  const q = query(
    collection(db, "rides"),
    where("status", "==", "in_progress"),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const rides = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const match = rides.find((r) => memberUids.includes(r.riderUid));
    onChange(match || null);
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

// ---------- Job Board ----------
export async function createJobPost({ postedByName, postedByUid, pickup, dropoff, price, vehicleType }) {
  const post = {
    postedByName, postedByUid, pickup, dropoff, price, vehicleType,
    claimed: false, claimedByName: null, claimedByUid: null,
    createdAt: Date.now(),
  };
  const docRef = await addDoc(collection(db, "jobPosts"), post);
  return { id: docRef.id, ...post };
}

export function subscribeToOpenJobPosts(callback) {
  const q = query(collection(db, "jobPosts"), where("claimed", "==", false), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function claimJobPost(jobId, claimedByName, claimedByUid) {
  const jobRef = doc(db, "jobPosts", jobId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists()) throw new Error("This job is no longer available.");
    if (snap.data().claimed) throw new Error("This job was already claimed by someone else.");
    tx.update(jobRef, { claimed: true, claimedByName, claimedByUid, claimedAt: Date.now() });
  });
}
