"use client";

import { useState, useRef, useEffect } from "react";

const prizes = [
  { label: "+50 pts", pts: 50, color: "#EEEDFE", text: "#3C3489" },
  { label: "+20 pts", pts: 20, color: "#E6F1FB", text: "#0C447C" },
  { label: "+100 pts", pts: 100, color: "#EAF3DE", text: "#27500A" },
  { label: "Try again", pts: 0, color: "#F1EFE8", text: "#5F5E5A" },
  { label: "+0.001 ETH", pts: 0, color: "#FAEEDA", text: "#633806" },
  { label: "+30 pts", pts: 30, color: "#FBEAF0", text: "#72243E" },
  { label: "+5 pts", pts: 5, color: "#E1F5EE", text: "#085041" },
  { label: "Try again", pts: 0, color: "#F1EFE8", text: "#5F5E5A" },
];

const NUM = prizes.length;
const ARC = (2 * Math.PI) / NUM;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = 140, cy = 140, r = 135;
    ctx.clearRect(0, 0, 280, 280);
    prizes.forEach((p, i) => {
      const start = angle + i * ARC;
      const end = start + ARC;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + ARC / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = p.text;
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(p.label, r - 10, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#AFA9EC";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#3C3489";
    ctx.fill();
  };

  useEffect(() => {
    if (activeTab === "spin") drawWheel(angleRef.current);
  }, [activeTab]);

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

    const winIdx = Math.floor(Math.random() * NUM);
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = angleRef.current + extraSpins * 2 * Math.PI + (2 * Math.PI - (winIdx * ARC + ARC / 2 - (Math.PI / 2 - ARC / 2)));
    const duration = 3500;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + (targetAngle - startAngle) * ease;
      angleRef.current = current;
      drawWheel(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        angleRef.current = targetAngle % (2 * Math.PI);
        setSpinning(false);
        const prize = prizes[winIdx];
        if (prize.pts > 0) {
          setPoints((p) => p + prize.pts);
          setTodayPts((p) => p + prize.pts);
          setPrizeWin(true);
          setPrizeMsg(`জিতেছ! ${prize.label} 🎉`);
          showToast(`${prize.label} জিতেছ!`);
        } else if (prize.label.includes("ETH")) {
          setPrizeWin(true);
          setPrizeMsg(`জিতেছ! ${prize.label} 🎉`);
          showToast(`${prize.label} জিতেছ!`);
        } else {
          setPrizeWin(false);
          setPrizeMsg("আবার চেষ্টা করো!");
        }
      }
    };
    requestAnimationFrame(animate);
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
          {[
            { id: "like", icon: "👍", name: "Like mission", desc: "featured post like করো", pts: 20 },
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: 280, height: 280, marginBottom: 14 }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "22px solid #3C3489", zIndex: 10 }} />
            <canvas ref={canvasRef} width={280} height={280} style={{ borderRadius: "50%", display: "block" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "#EEEDFE", border: "1px solid #AFA9EC", borderRadius: 12, padding: "8px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#7F77DD", textTransform: "uppercase" }}>Free Spins</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#3C3489" }}>{freeSpins}</div>
            </div>
            <div style={{ background: "#EEEDFE", border: "1px solid #AFA9EC", borderRadius: 12, padding: "8px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#7F77DD", textTransform: "uppercase" }}>Paid Spin</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#3C3489" }}>50 pts</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, width: "100%", marginBottom: 12 }}>
            <button onClick={() => doSpin(true)} disabled={freeSpins === 0 || spinning} style={{ flex: 1, padding: "12px", background: freeSpins === 0 || spinning ? "#f0f0f0" : "#3C3489", color: freeSpins === 0 || spinning ? "#888" : "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: freeSpins === 0 || spinning ? "default" : "pointer" }}>
              {spinning ? "Spinning... 🎰" : "Free Spin"}
            </button>
            <button onClick={() => doSpin(false)} disabled={points < 50 || spinning} style={{ flex: 1, padding: "12px", background: points < 50 || spinning ? "#f0f0f0" : "#EEEDFE", color: points < 50 || spinning ? "#888" : "#3C3489", border: "1px solid #AFA9EC", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: points < 50 || spinning ? "default" : "pointer" }}>
              50 pts দিয়ে Spin
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
          <input placeholder="0x... wallet address" style={{ width: "100%", padding: "10px 12px", border: "1px solid #eee", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
          <input type="number" placeholder="কত points redeem করবে?" style={{ width: "100%", padding: "10px 12px", border: "1px solid #eee", borderRadius: 10, fontSize: 13, marginBottom: 12, boxSizing: "border-box" }} />
          <button style={{ width: "100%", padding: "12px", background: "#3C3489", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Redeem করো
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#3C3489", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}