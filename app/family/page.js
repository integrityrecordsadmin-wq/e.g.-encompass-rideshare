"use client";

import { useState, useEffect } from "react";
import { Users, Heart, Copy, LogOut } from "lucide-react";
import { ACCENT, AMBER } from "../../lib/tokens";
import {
  signUpFamily, loginFamily, resetPassword,
  createFamily, joinFamily, subscribeToFamily, leaveFamily, getFamilyMembers, removeFamilyMember,
} from "../../lib/db";

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

function CreateOrJoinScreen({ person, onFamilyReady }) {
  const [tab, setTab] = useState("create");
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setBusy(true);
    setError("");
    try {
      const family = await createFamily(person);
      onFamilyReady(family);
    } catch (err) {
      setError(err.message || "Couldn't create a family right now.");
    }
    setBusy(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!codeInput.trim()) { setError("Enter an invite code first."); return; }
    setBusy(true);
    setError("");
    try {
      const family = await joinFamily(person, codeInput);
      onFamilyReady(family);
    } catch (err) {
      setError(err.message || "Couldn't join that family.");
    }
    setBusy(false);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-8" style={{ background: "#111318" }}>
      <div className="mb-6 text-center">
        <Users size={28} color={ACCENT} className="mx-auto" />
        <h2 className="text-xl font-semibold mt-3" style={{ color: "#F5F5F0" }}>
          Hi, {person.name.split(" ")[0]}
        </h2>
        <p className="text-sm mt-1" style={{ color: "#7A7F8A" }}>
          Start a family group, or join one with a code.
        </p>
      </div>

      <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: "1px solid #2B2F3A" }}>
        <button onClick={() => { setTab("create"); setError(""); }}
          className="flex-1 py-2.5 text-sm font-medium"
          style={{ background: tab === "create" ? ACCENT : "transparent", color: tab === "create" ? "#111318" : "#7A7F8A" }}>
          Create a family
        </button>
        <button onClick={() => { setTab("join"); setError(""); }}
          className="flex-1 py-2.5 text-sm font-medium"
          style={{ background: tab === "join" ? ACCENT : "transparent", color: tab === "join" ? "#111318" : "#7A7F8A" }}>
          Join with a code
        </button>
      </div>

      {tab === "create" ? (
        <div>
          <p className="text-sm mb-4" style={{ color: "#B9BBC2" }}>
            You'll get a 6-character invite code to share with the rest of your family.
          </p>
          {error && <p className="text-sm mb-3" style={{ color: "#FF6B6B" }}>{error}</p>}
          <button onClick={handleCreate} disabled={busy}
            className="w-full py-3.5 rounded-xl font-medium text-base"
            style={{ background: ACCENT, color: "#111318" }}>
            {busy ? "Creating…" : "Create my family"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoin}>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Invite code" maxLength={6}
            className="w-full px-4 py-3.5 rounded-xl text-base outline-none mb-3 tracking-widest text-center font-semibold"
            style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }} />
          {error && <p className="text-sm mb-3" style={{ color: "#FF6B6B" }}>{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full py-3.5 rounded-xl font-medium text-base"
            style={{ background: ACCENT, color: "#111318" }}>
            {busy ? "Joining…" : "Join family"}
          </button>
        </form>
      )}
    </div>
  );
}

function FamilyDashboard({ person, family, onLogout }) {
  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (family?.memberUids?.length) getFamilyMembers(family.memberUids).then(setMembers);
  }, [family?.memberUids]);

  const myRole = family.roles?.[person.uid] || "member";
  const isGuardian = myRole === "guardian";

  const copyCode = () => {
    navigator.clipboard?.writeText(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLeave = async () => {
    await leaveFamily(person, family.id);
    onLogout();
  };

  const handleRemove = async (targetUid) => {
    await removeFamilyMember(family.id, targetUid);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#111318" }}>
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>Family Hub</h1>
        <p className="text-sm font-medium mt-0.5" style={{ color: ACCENT }}>Parental Control</p>
      </div>

      {isGuardian && (
        <div className="mx-6 mb-4 rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "#181B22", border: "1px solid #2B2F3A" }}>
          <div>
            <p className="text-xs" style={{ color: "#7A7F8A" }}>Invite code</p>
            <p className="text-lg font-semibold tracking-widest" style={{ color: "#F5F5F0" }}>{family.inviteCode}</p>
          </div>
          <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#111318", color: ACCENT }}>
            <Copy size={13} /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      <div className="px-6 mb-2">
        <p className="text-xs uppercase tracking-wide" style={{ color: "#7A7F8A" }}>
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
      </div>
      <div className="px-6 space-y-2 flex-1 overflow-y-auto">
        {members.map((m) => {
          const role = family.roles?.[m.uid] || "member";
          return (
            <div key={m.uid} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: "#181B22", border: "1px solid #2B2F3A" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                style={{ background: ACCENT, color: "#111318" }}>
                {m.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#F5F5F0" }}>{m.name?.split(" ")[0]}</p>
                <p className="text-xs" style={{ color: role === "guardian" ? ACCENT : "#7A7F8A" }}>
                  {role === "guardian" ? "Guardian" : "Member"}
                </p>
              </div>
              {m.uid === person.uid ? (
                <span className="text-xs" style={{ color: "#7A7F8A" }}>You</span>
              ) : (
                isGuardian && role !== "guardian" && (
                  <button onClick={() => handleRemove(m.uid)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    style={{ background: "#1D2028", color: "#FF6B6B" }}>
                    Remove
                  </button>
                )
              )}
            </div>
          );
        })}
        <div className="rounded-xl p-4 text-center text-xs mt-2" style={{ color: "#7A7F8A", border: "1px dashed #2B2F3A" }}>
          Rides and jobs activity feed coming next.
        </div>
      </div>

      <div className="px-6 py-5">
        <button onClick={handleLeave}
          className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
          style={{ background: "#1D2028", color: "#FF6B6B", border: "1px solid #2B2F3A" }}>
          <LogOut size={15} /> Leave family
        </button>
      </div>
    </div>
  );
}

export default function FamilyApp() {
  const [person, setPerson] = useState(null);
  const [family, setFamily] = useState(null);

  useEffect(() => {
    if (!person?.familyId) { setFamily(null); return; }
    const unsub = subscribeToFamily(person.familyId, setFamily);
    return unsub;
  }, [person?.familyId]);

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden sm:rounded-[2rem] sm:h-[700px] sm:my-8 relative"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
      {!person ? (
        <FamilyAuthScreen onAuthed={setPerson} />
      ) : !person.familyId && !family ? (
        <CreateOrJoinScreen person={person} onFamilyReady={(f) => setPerson({ ...person, familyId: f.id })} />
      ) : family ? (
        <FamilyDashboard person={person} family={family} onLogout={() => { setPerson(null); setFamily(null); }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#111318" }}>
          <p style={{ color: "#7A7F8A" }}>Loading…</p>
        </div>
      )}
    </div>
  );
}
