function FamilyWatchModal({ ride, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: FAMILY.bg }}>
      <div className="w-full max-w-sm mx-auto px-5 py-8">
        <button onClick={onClose} className="mb-4 text-sm font-medium" style={{ color: FAMILY.plumSoft }}>← Back to trip</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 mb-1">
            <Heart size={14} fill={FAMILY.rose} color={FAMILY.rose} />
            <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: FAMILY.rose }}>Family Ride</p>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: FAMILY.plum }}>Watching live</h1>
        </div>

        <div className="relative mx-auto" style={{ width: "100%", maxWidth: 340 }}>
          <div className="relative aspect-square rounded-[6px] p-[14px]"
            style={{ background: `linear-gradient(155deg, ${FAMILY.frameGoldLight} 0%, ${FAMILY.frameGold} 100%)`, boxShadow: "0 12px 30px -8px rgba(74,29,63,0.35), inset 0 0 0 1px rgba(255,255,255,0.4)" }}>
            <div className="w-full h-full rounded-[3px] p-[6px]" style={{ background: "#fff", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)" }}>
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

          <div className="mx-auto -mt-3 relative z-10 px-5 py-2 rounded-full text-center" style={{
            width: "82%",
            background: "linear-gradient(180deg, #F3D9DE 0%, #E8B4C4 100%)",
            boxShadow: "0 4px 10px -3px rgba(74,29,63,0.3), inset 0 1px 1px rgba(255,255,255,0.6)",
            border: "1px solid #F6D9E3",
          }}>
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
