"use client";
import { useState, useEffect } from "react";
import { Car, User, DollarSign, Search, CheckCircle2, CircleDot, Star } from "lucide-react";
import { ACCENT, AMBER, BG, CARD, BORDER, MUTED, TEXT } from "../../lib/tokens";
import { subscribeToAllRides, subscribeToDrivers, subscribeToRiders } from "../../lib/db";

const STATUS_META = {
  requested: { label: "Requested", color: MUTED },
  accepted: { label: "Accepted", color: ACCENT },
  arrived_pickup: { label: "At pickup", color: AMBER },
  in_progress: { label: "In progress", color: AMBER },
  completed: { label: "Completed", color: "#4ADE80" },
};

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
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

export default function AdminDashboard() {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsub1 = subscribeToAllRides(setRides);
    const unsub2 = subscribeToDrivers(setDrivers);
    const unsub3 = subscribeToRiders(setRiders);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

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
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: TEXT }}><Car size={15} color={ACCENT} /> Drivers ({drivers.length})</h2>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                {drivers.length === 0 ? (
                  <div className="p-4 text-center text-xs" style={{ color: MUTED, background: CARD }}>No drivers registered yet.</div>
                ) : (
                  drivers.map((d, i) => (
                    <div key={d.uid} className="p-3 flex items-center gap-3" style={{ background: CARD, borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#23262E" }}><User size={14} color={TEXT} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: TEXT }}>{d.name}</p>
                        <p className="text-xs truncate" style={{ color: MUTED }}>{d.carModel}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium" style={{ color: AMBER }}>${(d.earningsToday || 0).toFixed(0)}</p>
                        <p className="text-xs flex items-center gap-0.5 justify-end" style={{ color: MUTED }}><Star size={9} fill={AMBER} color={AMBER} /> {(d.rating || 5).toFixed(1)}</p>
                      </div>
                    </div>
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
    </div>
  );
}
