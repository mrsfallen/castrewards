"use client";

import { useState, useRef, useReducer } from "react";

const C = {
  bg: "#0f0b1e",
  card: "#1a1535",
  card2: "#15102a",
  border: "#2a2050",
  purple: "#7C3AED",
  pink: "#EC4899",
  text: "#e2d9f3",
  muted: "#6b5f8a",
  green: "#22c55e",
  orange: "#f97316",
};

const INIT = {
  pts: 150, today: 0, spins: 2, streak: 3,
  checkedIn: false,
  missions: [false, false, false, false, false],
  spinLog: [
    { time: "Today 10:23 AM", reward: 50 },
    { time: "Yesterday 7:11 PM", reward: 20 },
  ],
  redeemLog: [
    { icon: "⚡", name: "Boost Pack", date: "May 3", pts: 200 },
  ],
};

function reducer(state: any, action: any) {
  switch (action.type) {
    case "checkin":
      if (state.checkedIn) return state;
      return { ...state, checkedIn: true, pts: state.pts + 10, today: state.today + 10, spins: state.spins + 2 };
    case "mission": {
      if (state.missions[action.idx]) return state;
      const ms = [...state.missions]; ms[action.idx] = true;
      return { ...state, missions: ms, pts: state.pts + action.pts, today: state.today + action.pts };
    }
    case "spin-use":
      return { ...state, spins: state.spins - 1 };
    case "spin-win": {
      const log = [{ time: "Just now", reward: action.prize }, ...state.spinLog];
      return { ...state, pts: state.pts + action.prize, today: state.today + action.prize, spinLog: log };
    }
    case "redeem": {
      if (state.pts < action.cost) return state;
      const icons = ["🎁", "💎", "⚡", "🔵"];
      const rlog = [{ icon: icons[action.idx], name: action.name, date: "Now", pts: action.cost }, ...state.redeemLog];
      return { ...state, pts: state.pts - action.cost, spins: state.spins + (action.idx === 3 ? 5 : 0), redeemLog: rlog };
    }
    default: return state;
  }
}

function HomeTab({ S }: { S: any }) {
  const rankData = S.pts < 100
    ? { name: "Bronze Caster", icon: "🥉", next: `${100 - S.pts} pts → Silver`, pct: S.pts }
    : S.pts < 300
    ? { name: "Silver Caster", icon: "🥈", next: `${300 - S.pts} pts → Gold`, pct: (S.pts - 100) / 2 }
    : S.pts < 600
    ? { name: "Gold Caster", icon: "🥇", next: `${600 - S.pts} pts → Diamond`, pct: (S.pts - 300) / 3 }
    : { name: "Diamond Caster", icon: "💎", next: "Max rank!", pct: 100 };

  return (
    <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 9 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🦊</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>@oxshafe.eth</div>
            <div style={{ fontSize: 10, color: C.muted }}>FID: 261600</div>
          </div>
          <div style={{ marginLeft: "auto", background: "#1f0d00", border: `1px solid ${C.orange}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: C.orange }}>🔥 Day {S.streak}</div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Total Points</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.pink, lineHeight: 1 }}>{S.pts}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.green, marginTop: 6 }}>
            <span style={{ width: 5, height: 5, background: C.green, borderRadius: "50%", display: "inline-block" }} />
            Live data
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
          {[["Today", S.today, C.text], ["Free Spins", S.spins, C.text], ["Streak", `${S.streak}d 🔥`, C.orange]].map(([l, v, col]: any) => (
            <div key={l} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: col }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, background: C.card2, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{rankData.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{rankData.name}</div>
            <div style={{ fontSize: 9, color: C.muted }}>Individual rank</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: C.muted }}>{rankData.next}</div>
        </div>
        <div style={{ background: C.card2, borderRadius: 3, height: 4 }}>
          <div style={{ background: C.purple, borderRadius: 3, height: 4, width: `${Math.min(rankData.pct, 100)}%`, transition: "width .6s" }} />
        </div>
      </div>
    </div>
  );
}

function FactionTab({ S, dispatch, toast }: { S: any; dispatch: any; toast: any }) {
  const missions = [
    { icon: "🔥", bg: "#1a0800", name: "Like Mission", desc: "Like the featured post", link: "warpcast.com/~/post/featured", pts: 20 },
    { icon: "🔄", bg: "#041028", name: "Recast Mission", desc: "Recast today's featured post", link: "warpcast.com/~/post/daily", pts: 30 },
    { icon: "💬", bg: "#0d0520", name: "Comment Mission", desc: "Reply to any cast", link: "warpcast.com/~/post/trending", pts: 15 },
    { icon: "👥", bg: "#001a0d", name: "Follow Mission", desc: "Follow the featured user", link: "warpcast.com/~/oxshafe.eth", pts: 25 },
    { icon: "✏️", bg: "#1a0d00", name: "Cast Mission", desc: "Publish your own cast", link: "warpcast.com/~/compose", pts: 40 },
  ];
  const done = (S.checkedIn ? 1 : 0) + S.missions.filter(Boolean).length;

  return (
    <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>MISSIONS</div>
        <div style={{ background: "#1a0f35", border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 9px", fontSize: 10, color: C.purple }}>{done}/5 done</div>
      </div>
      <button onClick={() => { if (!S.checkedIn) { dispatch({ type: "checkin" }); toast("Check-in done! +10 pts, +2 spins"); } }}
        style={{ width: "100%", padding: "11px 14px", border: "none", borderRadius: 10, background: S.checkedIn ? C.green : C.purple, color: "#fff", fontSize: 12, fontWeight: 600, cursor: S.checkedIn ? "default" : "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {S.checkedIn ? "✅ Checked in! +10 pts" : "📅 Check-in → +10 pts + 2 free spin"}
      </button>
      {missions.map((m, i) => (
        <div key={i} onClick={() => { if (!S.missions[i]) { dispatch({ type: "mission", idx: i, pts: m.pts }); toast(`${m.name} done! +${m.pts} pts`); } }}
          style={{ background: C.card, border: `1px solid ${S.missions[i] ? C.green + "55" : C.border}`, borderRadius: 12, padding: "11px 13px", marginBottom: 7, display: "flex", alignItems: "center", gap: 11, cursor: S.missions[i] ? "default" : "pointer", opacity: S.missions[i] ? 0.65 : 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{m.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{m.name}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{m.desc}</div>
            <div style={{ fontSize: 9, color: C.purple, marginTop: 2, opacity: 0.75 }}>🔗 {m.link}</div>
          </div>
          <div style={{ background: S.missions[i] ? "#002015" : "#1a0f35", border: `1px solid ${S.missions[i] ? C.green : C.border}`, borderRadius: 20, padding: "2px 9px", fontSize: 11, color: S.missions[i] ? C.green : "#a78bfa", whiteSpace: "nowrap", flexShrink: 0 }}>
            {S.missions[i] ? "Done" : `+${m.pts}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpinTab({ S, dispatch, toast }: { S: any; dispatch: any; toast: any }) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinning = useRef(false);
  const [result, setResult] = useState("");

  function doSpin() {
    if (spinning.current) return;
    if (S.spins <= 0) { toast("No spins left! Complete missions to earn more"); return; }
    spinning.current = true;
    dispatch({ type: "spin-use" });
    const prizes = [5, 10, 15, 20, 25, 30, 40, 50];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    const deg = Math.random() * 1440 + 1080;
    const start = performance.now();
    setResult("");
    function step(now: number) {
      const t = Math.min((now - start) / 1400, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${Math.round(deg * ease)}deg)`;
      if (t < 1) { requestAnimationFrame(step); return; }
      spinning.current = false;
      setResult(`🎉 You won ${prize} pts!`);
      dispatch({ type: "spin-win", prize });
      toast(`Spin won ${prize} pts!`);
    }
    requestAnimationFrame(step);
  }

  return (
    <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
      <div style={{ textAlign: "center", paddingBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Free Spins Available</div>
        <div style={{ fontSize: 30, fontWeight: 700, color: C.purple, marginBottom: 2 }}>{S.spins}</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 14 }}>Complete missions to earn more</div>
        <div ref={wheelRef} onClick={doSpin} style={{ width: 140, height: 140, borderRadius: "50%", border: `3px solid ${C.purple}`, background: C.card, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, cursor: "pointer", userSelect: "none" }}>🎰</div>
        <div style={{ minHeight: 24, fontSize: 13, fontWeight: 600, color: C.green, marginBottom: 10 }}>{result}</div>
        <button onClick={doSpin} disabled={S.spins <= 0} style={{ padding: "10px 26px", background: S.spins > 0 ? C.purple : C.card2, border: "none", borderRadius: 9, color: S.spins > 0 ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: S.spins > 0 ? "pointer" : "default" }}>Spin Now</button>
      </div>
      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>Spin History</div>
      {S.spinLog.map((l: any, i: number) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.text }}>
          <span>{l.time}</span><span style={{ color: C.green }}>+{l.reward} pts</span>
        </div>
      ))}
    </div>
  );
}

function RedeemTab({ S, dispatch, toast }: { S: any; dispatch: any; toast: any }) {
  const opts = [
    { icon: "🎁", name: "Gift Card", pts: 500 },
    { icon: "💎", name: "Premium Badge", pts: 300 },
    { icon: "⚡", name: "Boost Pack", pts: 200 },
    { icon: "🔵", name: "Free Spins x5", pts: 100 },
  ];
  return (
    <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 13, marginBottom: 10, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Available Points</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.purple }}>{S.pts}</div>
      </div>
      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Redeem Options</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
        {opts.map((o, i) => {
          const ok = S.pts >= o.pts;
          return (
            <div key={i} onClick={() => { if (ok) { dispatch({ type: "redeem", idx: i, cost: o.pts, name: o.name }); toast(`${o.name} redeemed!`); } }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, textAlign: "center", cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.4 }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{o.icon}</div>
              <div style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{o.name}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{o.pts} pts</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>Redeem Log</div>
      {S.redeemLog.map((l: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 26, height: 26, background: C.card2, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{l.icon}</div>
          <div><div style={{ fontSize: 11, color: C.text }}>{l.name}</div><div style={{ fontSize: 9, color: C.muted }}>{l.date}</div></div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#ff4455" }}>-{l.pts} pts</div>
        </div>
      ))}
    </div>
  );
}

export default function CastRewards() {
  const [S, dispatch] = useReducer(reducer, INIT);
  const [tab, setTab] = useState("home");
  const [toastMsg, setToastMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toast(msg: string) {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(""), 2200);
  }

  const navItems = [
    { id: "home", label: "Home", icon: "⊞" },
    { id: "faction", label: "Faction", icon: "⚔" },
    { id: "spin", label: "Spin", icon: "◎" },
    { id: "redeem", label: "Redeem", icon: "◈" },
  ];

  return (
    <div style={{ width: 360, height: 660, background: C.bg, borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: C.text, position: "relative", margin: "0 auto", border: `1px solid ${C.border}` }}>
      {toastMsg && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: C.purple, color: "#fff", fontSize: 11, padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap", zIndex: 99, pointerEvents: "none" }}>{toastMsg}</div>
      )}
      <div style={{ background: "#0a0718", padding: "12px 14px 0", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, background: C.purple, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0 }}>CR</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#c4b5fd" }}>CastRewards</div>
            <div style={{ fontSize: 9, color: C.muted }}>earn · spin · redeem</div>
          </div>
          <div style={{ marginLeft: "auto", background: "#1a0d30", border: `1px solid ${C.purple}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#a78bfa" }}>🔥 {S.streak} day streak</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "home" && <HomeTab S={S} />}
        {tab === "faction" && <FactionTab S={S} dispatch={dispatch} toast={toast} />}
        {tab === "spin" && <SpinTab S={S} dispatch={dispatch} toast={toast} />}
        {tab === "redeem" && <RedeemTab S={S} dispatch={dispatch} toast={toast} />}
      </div>
      <div style={{ display: "flex", background: "#0a0718", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, padding: "10px 0 8px", background: "none", border: "none", color: tab === n.id ? C.purple : C.muted, fontSize: 9, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderTop: tab === n.id ? `2px solid ${C.purple}` : "2px solid transparent", transition: "all .15s" }}>
            <span style={{ fontSize: 19 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}