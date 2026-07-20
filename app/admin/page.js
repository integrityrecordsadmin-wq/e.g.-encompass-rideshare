"use client";
import { useState, useEffect } from "react";
import { Car, User, DollarSign, Search, CheckCircle2, CircleDot, Star, AlertTriangle, X, Megaphone } from "lucide-react";
import { ACCENT, AMBER, BG, CARD, BORDER, MUTED, TEXT } from "../../lib/tokens";
import {
  subscribeToAllRides, subscribeToDrivers, subscribeToRiders,
  scheduleVerificationCall, reviewDriverDocuments, updateDriverProfile, loginAdmin,
  subscribeToActiveAnnouncements, createAnnouncement, deactivateAnnouncement,
} from "../../lib/db";
export const dynamic = "force-dynamic";
const STATUS_META = {
  requested: { label: "Requested", color: MUTED },
  accepted: { label: "Accepted", color: ACCENT },
  arrived_pickup: { label: "At pickup", color: AMBER },
  in_progress: { label: "In progress", color: AMBER },
  completed: { label: "Completed", color: "#4ADE80" },
};

const DOC_STATUS_META = {
  not_submitted: { label: "Not submitted", color: MUTED },
  call_scheduled: { label: "Call scheduled", color: ACCENT },
  pending_review: { label: "Pending review", color: AMBER },
  approved: { label: "Approved", color: "#4ADE80" },
  rejected: { label: "Rejected", color: "#FF6B6B" },
};

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function daysUntil(ts) {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

function tsToDateInput(ts) {
  if (!ts) return "";
  return new Date(ts).toISOString().slice(0, 10);
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent ? `${accent}22` : "#23262E" }}>
        <Icon size={18} color={accent || TEXT} />
      </div>
      <div>
        <p className="text-xl font-semibold leading-tight" style={{ color: TEXT }}>{value}</p>
        <p className="text-xs" style={{ color: MUTED }}>{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, color: MUTED };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${meta.color}1A`, color: meta.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function InsuranceExpiryBanner({ drivers }) {
  const flagged = drivers
    .map((d) => ({ ...d, daysLeft: daysUntil(d.insuranceExpiresAt) }))
    .filter((d) => d.daysLeft !== null && d.daysLeft <= 5)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (flagged.length === 0) return null;

  return (
    <div className="rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ background: "#3D1F1F", border: "1px solid #6B2E2E" }}>
      <AlertTriangle size={18} color="#FF8A8A" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "#FFD5D5" }}>
          {flagged.length} driver{flagged.length > 1 ? "s" : ""} need an insurance reminder
        </p>
        <div className="mt-2 space-y-1">
          {flagged.map((d) => (
            <p key={d.uid} className="text-xs" style={{ color: "#F0B8B8" }}>
              <span className="font-medium">{d.name}</span>
              {" — "}
              {d.daysLeft < 0
                ? `expired ${Math.abs(d.daysLeft)} day${Math.abs(d.daysLeft) !== 1 ? "s" : ""} ago`
                : d.daysLeft === 0
                ? "expires today"
                : `expires in ${d.daysLeft} day${d.daysLeft !== 1 ? "s" : ""}`}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverDetailPanel({ driver, onClose }) {
  const [callDate, setCallDate] = useState("");
  const [callTime, setCallTime] = useState("");
  const [zoomLink, setZoomLink] = useState(driver.verificationZoomLink || "");
  const [insuranceDate, setInsuranceDate] = useState(tsToDateInput(driver.insuranceExpiresAt));
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const docStatus = DOC_STATUS_META[driver.documentsStatus] || DOC_STATUS_META.not_submitted;

  const handleScheduleCall = async () => {
    if (!callDate || !callTime || !zoomLink.trim()) return;
    setBusy(true);
    const scheduledAt = new Date(`${callDate}T${callTime}`).getTime();
    await scheduleVerificationCall(driver.uid, { scheduledAt, zoomLink: zoomLink.trim() });
    setBusy(false);
  };

  const handleApprove = async () => {
    setBusy(true);
    await reviewDriverDocuments(driver.uid, true);
    setBusy(false);
  };

  const handleReject = async () => {
    setBusy(true);
    await reviewDriverDocuments(driver.uid, false, rejectReason.trim());
    setRejectReason("");
    setBusy(false);
  };

  const handleSaveInsuranceDate = async () => {
    if (!insuranceDate) return;
    setBusy(true);
    await updateDriverProfile(driver.uid, { insuranceExpiresAt: new Date(insuranceDate).getTime() });
    setBusy(false);
  };

  const handleBackgroundCheckToggle = async (status) => {
    setBusy(true);
    await updateDriverProfile(driver.uid, { backgroundCheckStatus: status });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto p-6" style={{ background: BG }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: TEXT }}>{driver.name}</h2>
            <p className="text-xs" style={{ color: MUTED }}>{driver.email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: CARD }}>
            <X size={16} color={TEXT} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="text-xs" style={{ color: MUTED }}>Vehicle</span>
            <span className="text-sm" style={{ color: TEXT }}>{driver.carModel} · {driver.plate}</span>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: MUTED }}>Background check</p>
            <div className="flex gap-2">
              {["pending", "cleared", "failed"].map((s) => (
                <button key={s} disabled={busy} onClick={() => handleBackgroundCheckToggle(s)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium capitalize"
                  style={{
                    background: driver.backgroundCheckStatus === s ? ACCENT : CARD,
                    color: driver.backgroundCheckStatus === s ? "#111318" : TEXT,
                    border: `1px solid ${BORDER}`,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: MUTED }}>Documents & vehicle verification</p>
            <div className="rounded-xl p-3 mb-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <StatusPill status={driver.documentsStatus || "not_submitted"} />
            </div>

            {driver.documentsStatus === "rejected" && driver.documentsRejectionReason && (
              <p className="text-xs mb-3" style={{ color: "#FF6B6B" }}>Last rejection reason: {driver.documentsRejectionReason}</p>
            )}

            <p className="text-xs mb-2" style={{ color: MUTED }}>Schedule verification call</p>
            <div className="flex gap-2 mb-2">
              <input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
              <input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
            </div>
            <input value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} placeholder="Zoom link"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
            <button disabled={busy} onClick={handleScheduleCall}
              className="w-full py-2.5 rounded-lg text-sm font-medium mb-4" style={{ background: ACCENT, color: "#111318" }}>
              Schedule call
            </button>

            <div className="flex gap-2 mb-2">
              <button disabled={busy} onClick={handleApprove}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#1D3A2A", color: "#4ADE80", border: "1px solid #2A5138" }}>
                Approve
              </button>
              <button disabled={busy} onClick={handleReject}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#3D1F1F", color: "#FF6B6B", border: "1px solid #6B2E2E" }}>
                Reject
              </button>
            </div>
            <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason (if rejecting)"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
          </div>

          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: MUTED }}>Insurance expiration</p>
            <div className="flex gap-2">
              <input type="date" value={insuranceDate} onChange={(e) => setInsuranceDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
              <button disabled={busy} onClick={handleSaveInsuranceDate}
                className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: ACCENT, color: "#111318" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeToActiveAnnouncements(setAnnouncements);
    return unsub;
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await createAnnouncement({ text: text.trim(), createdBy: "admin" });
    setText("");
    setBusy(false);
  };

  const handleRemove = async (id) => {
    await deactivateAnnouncement(id);
  };

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: TEXT }}>
        <Megaphone size={15} color={ACCENT} /> Special messages
      </h2>
      <div className="rounded-2xl p-3 mb-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Message for families (e.g. upcoming event, reminder)…"
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none mb-2"
          style={{ background: BG, color: TEXT, border: `1px solid ${BORDER}` }} />
        <button disabled={busy || !text.trim()} onClick={handlePost}
          className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: ACCENT, color: "#111318" }}>
          {busy ? "Posting…" : "Post message"}
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {announcements.length === 0 ? (
          <div className="p-4 text-center text-xs" style={{ color: MUTED, background: CARD }}>No active messages.</div>
        ) : (
          announcements.map((a, i) => (
            <div key={a.id} className="p-3 flex items-start gap-3" style={{ background: CARD, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: TEXT }}>{a.text}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{timeAgo(a.createdAt)}</p>
              </div>
              <button onClick={() => handleRemove(a.id)}
                className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0"
                style={{ background: "#3D1F1F", color: "#FF6B6B" }}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminAuthScreen({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const admin = await loginAdmin({ email: email.trim().toLowerCase(), password });
      onAuthed(admin);
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed.");
    }
    setBusy(false);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-8" style={{ background: BG }}>
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold mb-4" style={{ color: TEXT }}>Corporate Login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
        {error && <p className="text-sm" style={{ color: "#FF6B6B" }}>{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-3 rounded-xl font-medium text-sm" style={{ background: ACCENT, color: "#111318" }}>
          {busy ? "One sec…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    const unsub1 = subscribeToAllRides(setRides);
    const unsub2 = subscribeToDrivers(setDrivers);
    const unsub3 = subscribeToRiders(setRiders);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  useEffect(() => {
    if (!selectedDriver) return;
    const fresh = drivers.find((d) => d.uid === selectedDriver.uid);
    if (fresh) setSelectedDriver(fresh);
  }, [drivers]);

  const filteredRides = rides.filter((r) => {
    const matchesStatus = filter === "all" || r.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || r.riderName?.toLowerCase().includes(q) || r.driverName?.toLowerCase().includes(q) || r.destination?.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const completed = rides.filter((r) => r.status === "completed");
  const active = rides.filter((r) => r.status !== "completed");
  const totalVolume = completed.reduce((sum, r) => sum + (r.fare || 0), 0);

  return (
    <div className="w-full min-h-screen" style={{ background: BG }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: TEXT }}>Rides admin</h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>Live — updates instantly, no refresh needed</p>
          </div>
        </div>

        <InsuranceExpiryBanner drivers={drivers} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Car} label="Total rides" value={rides.length} />
          <StatCard icon={CircleDot} label="Active now" value={active.length} accent={AMBER} />
          <StatCard icon={CheckCircle2} label="Completed" value={completed.length} accent="#4ADE80" />
          <StatCard icon={DollarSign} label="Total volume" value={`$${totalVolume.toFixed(2)}`} accent={ACCENT} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <Search size={15} color={MUTED} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rider, driver, destination…"
                  className="bg-transparent outline-none text-sm w-full" style={{ color: TEXT }} />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm outline-none" style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }}>
                <option value="all">All statuses</option>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              {filteredRides.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: MUTED, background: CARD }}>No rides match yet.</div>
              ) : (
                filteredRides.map((r, i) => (
                  <div key={r.id} className="p-4 flex items-center gap-4" style={{ background: CARD, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate" style={{ color: TEXT }}>{r.riderName}</span>
                        <span style={{ color: MUTED }}>→</span>
                        <span className="text-sm truncate" style={{ color: MUTED }}>{r.destination}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs flex items-center gap-1" style={{ color: MUTED }}><Car size={11} /> {r.driverName || "Unassigned"}</span>
                        <span className="text-xs" style={{ color: MUTED }}>{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: TEXT }}>${(r.fare || 0).toFixed(2)}</span>
                    <StatusPill status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <AnnouncementsPanel />

            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: TEXT }}><Car size={15} color={ACCENT} /> Drivers ({drivers.length})</h2>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                {drivers.length === 0 ? (
                  <div className="p-4 text-center text-xs" style={{ color: MUTED, background: CARD }}>No drivers registered yet.</div>
                ) : (
                  drivers.map((d, i) => (
                    <button key={d.uid} onClick={() => setSelectedDriver(d)}
                      className="w-full p-3 flex items-center gap-3 text-left" style={{ background: CARD, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#23262E" }}><User size={14} color={TEXT} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: TEXT }}>{d.name}</p>
                        <p className="text-xs truncate" style={{ color: MUTED }}>{d.carModel}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium" style={{ color: AMBER }}>${(d.earningsToday || 0).toFixed(0)}</p>
                        <p className="text-xs flex items-center gap-0.5 justify-end" style={{ color: MUTED }}><Star size={9} fill={AMBER} color={AMBER} /> {(d.rating || 5).toFixed(1)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: TEXT }}><User size={15} color={ACCENT} /> Riders ({riders.length})</h2>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                {riders.length === 0 ? (
                  <div className="p-4 text-center text-xs" style={{ color: MUTED, background: CARD }}>No riders registered yet.</div>
                ) : (
                  riders.map((u, i) => (
                    <div key={u.uid} className="p-3 flex items-center gap-3" style={{ background: CARD, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#23262E" }}><User size={14} color={TEXT} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: TEXT }}>{u.name}</p>
                        <p className="text-xs truncate" style={{ color: MUTED }}>{u.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDriver && <DriverDetailPanel driver={selectedDriver} onClose={() => setSelectedDriver(null)} />}
    </div>
  );
}

export default function AdminPage() {
  const [admin, setAdmin] = useState(null);
  if (!admin) return <AdminAuthScreen onAuthed={setAdmin} />;
  return <AdminDashboard />;
}
