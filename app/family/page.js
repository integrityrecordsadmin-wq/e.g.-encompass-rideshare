"use client";

import { useState } from "react";
import { Users, Heart } from "lucide-react";
import { ACCENT, AMBER } from "../../lib/tokens";
import { signUpFamily, loginFamily, resetPassword } from "../../lib/db";

function FamilyAuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || (mode === "signup" && !name)) {
      setError("Fill in every field to continue.");
      return;
    }
    setBusy(true);
    try {
      const person = mode === "signup"
        ? await signUpFamily({ name, email: email.trim().toLowerCase(), password })
        : await loginFamily({ email: email.trim().toLowerCase(), password });
      onAuthed(person);
    } catch (err) {
      const msg = err.message?.replace("Firebase: ", "") || "Something went wrong.";
      setError(msg.includes("already-in-use")
        ? "That email is already registered — try logging in instead (same password as your rider/driver account, if you have one)."
        : msg);
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

  return (
    <div className="min-h-full w-full flex flex-col justify-center px-8" style={{ background: "#111318" }}>
      <div className="mb-8">
        <div className="w-11 h-11 rounded-2xl mb-6 flex items-center justify-center" style={{ background: ACCENT }}>
          <Heart size={20} color="#111318" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#F5F5F0" }}>
  Family Hub
</h1>
<p className="mt-1 text-sm font-medium" style={{ color: ACCENT }}>
  Parental Control
</p>
<p className="mt-2 text-sm" style={{ color: "#7A7F8A" }}>
  {mode === "login" ? "Log in to see rides and jobs across your whole family." : "Create your account to get started."}
</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
          style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password"
          className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
          style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
        {mode === "login" && (
          <button type="button" onClick={handleForgotPassword} className="text-xs text-right w-full" style={{ color: "#7A7F8A" }}>
            Forgot password?
          </button>
        )}
        {resetSent && <p className="text-xs" style={{ color: ACCENT }}>Check your email for a reset link.</p>}
        {error && <p className="text-sm" style={{ color: "#FF6B6B" }}>{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full py-3.5 rounded-xl font-medium text-base mt-2 transition active:scale-[0.98]"
          style={{ background: ACCENT, color: "#111318" }}>
          {busy ? "One sec…" : mode === "login" ? "Log in" : "Create family hub account"}
        </button>
      </form>
      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setResetSent(false); }}
        className="mt-6 text-sm text-center" style={{ color: "#7A7F8A" }}>
        {mode === "login" ? (<>New here? <span style={{ color: "#F5F5F0" }}>Create a family hub account</span></>)
          : (<>Already have an account? <span style={{ color: "#F5F5F0" }}>Log in</span></>)}
      </button>
    </div>
  );
}

function FamilyHomeStub({ person, onLogout }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8" style={{ background: "#111318" }}>
      <Users size={32} color={ACCENT} />
      <p className="text-xl font-semibold mt-4" style={{ color: "#F5F5F0" }}>Hi, {person.name.split(" ")[0]}</p>
      <p className="text-sm mt-1 text-center" style={{ color: "#7A7F8A" }}>Family group linking is coming next.</p>
      <button onClick={onLogout} className="mt-8 px-6 py-3 rounded-xl font-medium text-base"
        style={{ background: "#1D2028", color: "#FF6B6B", border: "1px solid #2B2F3A" }}>
        Log out
      </button>
    </div>
  );
}

export default function FamilyApp() {
  const [person, setPerson] = useState(null);

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
      {!person
        ? <FamilyAuthScreen onAuthed={setPerson} />
        : <FamilyHomeStub person={person} onLogout={() => setPerson(null)} />}
    </div>
  );
}
