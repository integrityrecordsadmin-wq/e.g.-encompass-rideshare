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