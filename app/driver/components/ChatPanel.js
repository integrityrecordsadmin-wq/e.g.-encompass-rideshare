
"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { ACCENT, AMBER } from "../lib/tokens";
import { subscribeToRide, appendRideMessage } from "../lib/db";

export default function ChatPanel({ rideId, mySender, otherName, quickReplies = [], onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToRide(rideId, (ride) => {
      setMessages(ride.messages || []);
    });
    return unsub;
  }, [rideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (msg) => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    setText("");
    await appendRideMessage(rideId, mySender, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-sm h-[70vh] rounded-t-3xl flex flex-col" style={{ background: "#F5F5F0" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 pt-5 border-b" style={{ borderColor: "#E4E2D9" }}>
          <h2 className="text-base font-semibold" style={{ color: "#111318" }}>{otherName}</h2>
          <button onClick={onClose} aria-label="Close chat" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#EDEBE2" }}>
            <X size={16} color="#111318" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: "#7A7F8A" }}>No messages yet.</p>
          )}
          {messages.map((m, i) => {
            const isMine = m.sender === mySender;
            return (
              <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%] px-3.5 py-2 rounded-2xl text-sm"
                  style={{ background: isMine ? ACCENT : "#fff", color: isMine ? "#111318" : "#111318", border: isMine ? "none" : "1px solid #E4E2D9" }}>
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {quickReplies.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {quickReplies.map((q) => (
              <button key={q} onClick={() => send(q)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: "#EDEBE2", color: "#111318" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 pt-2 flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(text); }}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#fff", color: "#111318", border: "1px solid #E4E2D9" }} />
          <button onClick={() => send(text)} aria-label="Send"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: ACCENT }}>
            <Send size={16} color="#111318" />
          </button>
        </div>
      </div>
    </div>
  );
                              }
