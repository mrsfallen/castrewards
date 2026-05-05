"use client";

import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState("missions");
  const [points, setPoints] = useState(150);
  const [freeSpins, setFreeSpins] = useState(0);
  const [todayPts, setTodayPts] = useState(0);
  const [streak, setStreak] = useState(3);
  const [checkedIn, setCheckedIn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prizeMsg, setPrizeMsg] = useState("");
  const [prizeWin, setPrizeWin] = useState(false);
  const [toast, setToast] = useState("");
  const [doneMissions, setDoneMissions] = useState<string[]>([]);

  const prizes = [
    { label: "+50 pts", pts: 50 },
    { label: "+20 pts", pts: 20 },
    { label: "+100 pts", pts: 100 },
    { label: "Try again", pts: 0 },
    { label: "+0.001 ETH", pts: 0 },
    { label: "+30 pts", pts: 30 },
    { label: "+5 pts", pts: 5 },
    { label: "Try again", pts: 0 },
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const doCheckin = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    setPoints((p) => p + 10);
    setTodayPts((p) => p + 10);
    setFreeSpins((s) => s + 2);
    setStreak((s) => s + 1);
    showToast("+10 pts + 2 free spin পেয়েছ!");
  };

  const doMission = (id: string, pts: number) => {
    if (doneMissions.includes(id)) return;
    setDoneMissions((d) => [...d, id]);
    setPoints((p) => p + pts);
    setTodayPts((p) => p + pts);
    showToast(`+${pts} points পেয়েছ!`);
  };

  const doSpin = (isFree: boolean) => {
    if (spinning) return;
    if (isFree && freeSpins === 0) { showToast("Free spin নেই!"); return; }
    if (!isFree && points < 50) { showToast("কমপক্ষে 50 pts লাগবে!"); return; }
    if (isFree) setFreeSpins((s) => s - 1);
    else setPoints((p) => p - 50);
    setSpinning(true);
    setPrizeMsg("");
    setTimeout(() => {
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      if (win.pts > 0) {
        setPoints((p) => p + win.pts);
        setTodayPts((p) => p + win.pts);
        setPrizeWin(true);
        setPrizeMsg(`জিতেছ! ${win.label} 🎉`);
        showToast(`${win.label} জিতেছ!`);
      } else if (win.label.includes("ETH")) {
        setPrizeWin(true);
        setPrizeMsg(`জিতেছ! ${win.label} 🎉`);
        showToast(`${win.label} জিতেছ!`);
      } else {
        setPrizeWin(false);
        setPrizeMsg("আবার চেষ্টা করো!");
      }
      setSpinning(false);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "1rem", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#3C3489", borderRadius: 16, padding: "12px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600 }}>CR</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>CastRewards</div>
            <div style={{ color: "#AFA9EC", fontSize: 11 }}>earn · spin · redeem</div>
          </div>
        </div>
        <div style={{ background: "#534AB7", color: "#EEEDFE", fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>🔥 {streak} day streak</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[{ label: "total points", val: points }, { label: "free spins", val: freeSpins }, { label: "today", val: todayPts }].map((s) => (
          <div key={s.label} style={{ background: "#f5f5f5", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#3C3489" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["missions", "spin", "redeem"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px 4px", border: activeTab === tab ? "1.5px solid #AFA9EC" : "1px solid #ddd", background: activeTab === tab ? "#EEEDFE" : "#fff", borderRadius: 10, fontSize: 12, color: activeTab === tab ? "#3C3489" : "#888", fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer" }}>
            {tab === "missions" ? "📋 Missions" : tab === "spin" ? "🎰 Spin" : "💎 Redeem"}
          </button>
        ))}
      </div>

      {/* Missions Tab */}
      {activeTab === "missions" && (
        <div>
          <button onClick={doCheckin} style={{ width: "100%", padding: "12px", background: checkedIn ? "#f0f0f0" : "#3C3489", color: checkedIn ? "#888" : "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: checkedIn ? "default" : "pointer", marginBottom: 10 }}>
            {checkedIn ? "আজকের check-in হয়ে গেছে ✓" : "Check-in করো → +10 pts + 2 free spin"}
          </button>
          {[{ id: "like", icon: "👍", name: "Like mission", desc: "featured post like করো", pts: 20 },
            { id: "recast", icon: "🔁", name: "Recast mission", desc: "আজকের post recast করো", pts: 30 },
            { id: "comment", icon: "💬", name: "Comment mission", desc: "যেকোনো cast-এ reply করো", pts: 15 },
            { id: "follow", icon: "👥", name: "Follow mission", desc: "featured user follow করো", pts: 25 },
          ].map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{m.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{m.desc}</div>
                </div>
              </div>
              <div onClick={() => doMission(m.id, m.pts)} style={{ background: doneMissions.includes(m.id) ? "#f0f0f0" : "#EEEDFE", color: doneMissions.includes(m.id) ? "#888" : "#3C3489", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, cursor: doneMissions.includes(m.id) ? "default" : "pointer" }}>
                {doneMissions.includes(m.id) ? "Done ✓" : `+${m.pts} pts`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spin Tab */}
      {activeTab === "spin" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🎰</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
            <div style={{ background: "#EEEDFE", borderRadius: 12, padding: "10px 20px" }}>
              <div style={{ fontSize: 10, color: "#7F77DD" }}>FREE SPINS</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#3C3489" }}>{freeSpins}</div>
            </div>
            <div style={{ background: "#EEEDFE", borderRadius: 12, padding: "10px 20px" }}>
              <div style={{ fontSize: 10, color: "#7F77DD" }}>PAID SPIN</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#3C3489" }}>50 pts</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => doSpin(true)} disabled={freeSpins === 0 || spinning} style={{ flex: 1, padding: "12px", background: freeSpins === 0 || spinning ? "#f0f0f0" : "#3C3489", color: freeSpins === 0 || spinning ? "#888" : "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: freeSpins === 0 || spinning ? "default" : "pointer" }}>
              {spinning ? "Spinning..." : "Free Spin"}
            </button>
            <button onClick={() => doSpin(false)} disabled={points < 50 || spinning} style={{ flex: 1, padding: "12px", background: points < 50 || spinning ? "#f0f0f0" : "#EEEDFE", color: points < 50 || spinning ? "#888" : "#3C3489", border: "1px solid #AFA9EC", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: points < 50 || spinning ? "default" : "pointer" }}>
              50 pts Spin
            </button>
          </div>
          {prizeMsg && (
            <div style={{ padding: "12px 20px", borderRadius: 12, background: prizeWin ? "#EEEDFE" : "#f0f0f0", color: prizeWin ? "#3C3489" : "#888", fontWeight: 600, fontSize: 15 }}>
              {prizeMsg}
            </div>
          )}
        </div>
      )}

      {/* Redeem Tab */}
      {activeTab === "redeem" && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "20px" }}>
          <div style={{ background: "#EEEDFE", borderRadius: 10, padding: "10px", textAlign: "center", marginBottom: 12, color: "#3C3489", fontWeight: 600 }}>100 points = 0.001 ETH</div>
          <input placeholder="0x... wallet address" style={{ width: "100%", padding: "10px 12px", border: "1px solid #eee", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" as const }} />
          <input type="number" placeholder="কত points redeem করবে?" style={{ width: "100%", padding: "10px 12px", border: "1px solid #eee", borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: "border-box" as const }} />
          <button style={{ width: "100%", padding: "12px", background: "#3C3489", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Redeem Here
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#3C3489", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const }}>
          {toast}
        </div>
      )}
    </div>
  );
}