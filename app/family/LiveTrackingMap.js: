"use client";
import { useEffect, useRef, useState } from "react";
import { subscribeToFamilyActiveRide } from "../../lib/db";

let mapsLoadingPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoadingPromise) return mapsLoadingPromise;
  mapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return mapsLoadingPromise;
}

export default function LiveTrackingMap({ memberUids }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [activeRide, setActiveRide] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeToFamilyActiveRide(memberUids, setActiveRide);
    return unsub;
  }, [memberUids]);

  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !activeRide?.driverLocation || !mapRef.current) return;
    const { lat, lng } = activeRide.driverLocation;
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng }, zoom: 15, disableDefaultUI: true,
      });
      markerInstance.current = new window.google.maps.Marker({
        position: { lat, lng }, map: mapInstance.current,
      });
    } else {
      markerInstance.current.setPosition({ lat, lng });
      mapInstance.current.panTo({ lat, lng });
    }
  }, [ready, activeRide?.driverLocation]);

  if (!activeRide) {
    return (
      <div className="mx-6 mb-4 rounded-xl p-3 text-center" style={{ color: "#7A7F8A", border: "1px dashed #2B2F3A" }}>
        <p className="text-xs">No family member is currently on a ride.</p>
      </div>
    );
  }
  if (!activeRide.driverLocation) {
    return (
      <div className="mx-6 mb-4 rounded-xl p-3 text-center" style={{ color: "#7A7F8A", border: "1px dashed #2B2F3A" }}>
        <p className="text-xs">Waiting for the driver's location…</p>
      </div>
    );
  }
  return (
    <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #2B2F3A", height: "220px" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
