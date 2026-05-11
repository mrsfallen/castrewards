"use client";
import { useState, useEffect } from "react";
import { useAccount, useSendTransaction, useConnect } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { parseEther } from "viem";
import { sdk } from "@farcaster/miniapp-sdk";

type Tab = "home" | "spin" | "missions" | "invite" | "wallet";
type SpinPrize = { label: string; pts: number; usdc: number; bg: string; light: string };

const PRIZES: SpinPrize[] = [
  { label: "10 pts", pts: 10, usdc: 0, bg: "#e91e8c", light: "#f06eb5" },
  { label: "0.02 USDC", pts: 0, usdc: 0.02, bg: "#00bcd4", light: "#4dd0e1" },
  { label: "20 pts", pts: 20, usdc: 0, bg: "#ff9800", light: "#ffb74d" },
  { label: "Try Again", pts: 0, usdc: 0, bg: "#9c27b0", light: "#ba68c8" },
  { label: "0.5 USDC", pts: 0, usdc: 0.5, bg: "#4caf50", light: "#81c784" },
  { label: "10 pts", pts: 10, usdc: 0, bg: "#f44336", light: "#e57373" },
  { label: "20 pts", pts: 20, usdc: 0, bg: "#ffc107", light: "#ffd54f" },
  { label: "Try Again", pts: 0, usdc: 0, bg: "#3f51b5", light: "#7986cb" },
];

const TREASURY = "0x5d7d7dEdF9e4F3cAf57718790646152616Cc82ee";
const APP_URL = "https://castrewards-app.vercel.app";
const FREE_SPIN_LIMIT = 10;
const FREE_SPIN_COST = "0.00004";

const REDEEM_OPTIONS = [
  { pts: 2500, usdc: 0.1 },
  { pts: 5000, usdc: 0.25 },
  { pts: 10000, usdc: 0.5 },
  { pts: 20000, usdc: 1.0 },
];

function load(key: string, def: any) {
  try { const v = localStorage.getItem("cr_" + key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
}
function save(key: string, val: any) {
  try { localStorage.setItem("cr_" + key, JSON.stringify(val)); } catch {}
}
function todayStr() { return new Date().toDateString(); }

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [pts, setPts] = useState(() => load("pts", 0));
  const [usdc, setUsdc] = useState(() => load("usdc", 0));
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(() => load("rot", 0));
  const [spinResult, setSpinResult] = useState<SpinPrize | null>(null);
  const [freeSpins, setFreeSpins] = useState(() => load("freeSpins", 0));
  const [dailySpinsClaimed, setDailySpinsClaimed] = useState(() => load("claimDate", "") === todayStr());
  const [doneMissions, setDoneMissions] = useState<number[]>(() => load("missionsDate", "") === todayStr() ? load("missions", []) : []);
  const [toast, setToast] = useState("");
  const [streak, setStreak] = useState(() => load("streak", 0));
  const [checkedIn, setCheckedIn] = useState(() => load("checkinDate", "") === todayStr());
  const [redeemIdx, setRedeemIdx] = useState<number | null>(null);
  const [fcUser, setFcUser] = useState<any>(null);
  const [logoErr, setLogoErr] = useState(false);
  const [lights, setLights] = useState(true);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { sendTransaction } = useSendTransaction();

  useEffect(() => { save("pts", pts); }, [pts]);
  useEffect(() => { save("usdc", usdc); }, [usdc]);
  useEffect(() => { save("rot", rot); }, [rot]);
  useEffect(() => { save("freeSpins", freeSpins); }, [freeSpins]);
  useEffect(() => { save("streak", streak); }, [streak]);
  useEffect(() => { save("missions", doneMissions); save("missionsDate", todayStr()); }, [doneMissions]);

  useEffect(() => {
    const t = setInterval(() => setLights(l => !l), 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    sdk.actions.ready();
    sdk.context.then((ctx: any) => {
      if (ctx?.user?.fid) {
        fetch("/api/users?fids=" + ctx.user.fid)
          .then(r => r.json())
          .then(data => { if (data.users?.[0]) setFcUser(data.users[0]); });
      }
    });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const shareOnFarcaster = (fid?: number) => {
    const refLink = APP_URL + "/ref/" + (fid || "friend");
    const text = "Join me on CastRewards! Earn points, spin to win USDC. " + refLink;
    window.open("https://warpcast.com/~/compose?text=" + encodeURIComponent(text) + "&embeds[]=" + encodeURIComponent(APP_URL), "_blank");
  };

  const claimFreeSpins = () => {
    if (dailySpinsClaimed) { showToast("Already claimed today!"); return; }
    if (freeSpins >= FREE_SPIN_LIMIT) { showToast("Max " + FREE_SPIN_LIMIT + " free spins!"); return; }
    if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
    sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther(FREE_SPIN_COST) }, {
      onSuccess: () => {
        const add = Math.min(2, FREE_SPIN_LIMIT - freeSpins);
        setFreeSpins((f: number) => f + add);
        setDailySpinsClaimed(true);
        save("claimDate", todayStr());
        showToast(add + " free spins claimed!");
      },
      onError: () => showToast("Transaction failed!"),
    });
  };

  const runSpinAnimation = () => {
    setSpinning(true);
    setSpinResult(null);
    const winner = Math.floor(Math.random() * PRIZES.length);
    const seg = 360 / PRIZES.length;
    setRot((r: number) => r + 360 * 8 + (360 - winner * seg - seg / 2));
    setTimeout(() => {
      const prize = PRIZES[winner];
      setSpinResult(prize);
      if (prize.pts) setPts((p: number) => p + prize.pts);
      if (prize.usdc) setUsdc((u: number) => +(u + prize.usdc).toFixed(4));
      setSpinning(false);
      showToast(prize.pts ? "+" + prize.pts + " pts!" : prize.usdc ? "+" + prize.usdc + " USDC! 🎉" : "Try again!");
    }, 4000);
  };

  const doSpin = (type: "free" | "paid") => {
    if (spinning) return;
    if (type === "free") {
      if (freeSpins <= 0) { showToast("No free spins!"); return; }
      setFreeSpins((f: number) => f - 1);
      runSpinAnimation();
    } else {
      if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
      sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther("0.000012") }, {
        onSuccess: runSpinAnimation,
        onError: () => showToast("Transaction failed!"),
      });
    }
  };

  const doMission = (id: number, p: number) => {
    if (doneMissions.includes(id)) return;
    setDoneMissions((d: number[]) => [...d, id]);
    setPts((prev: number) => prev + p);
    showToast("+" + p + " pts earned!");
  };

  const doCheckin = () => {
    if (checkedIn) { showToast("Already checked in today!"); return; }
    setCheckedIn(true); save("checkinDate", todayStr());
    setStreak((s: number) => s + 1); setPts((p: number) => p + 10);
    showToast("+10 pts! Come back tomorrow.");
  };

  const doRedeem = () => {
    if (redeemIdx === null) { showToast("Select an option!"); return; }
    const opt = REDEEM_OPTIONS[redeemIdx];
    if (pts < opt.pts) { showToast("Not enough points!"); return; }
    if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
    sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther("0.000001") }, {
      onSuccess: () => {
        setPts((p: number) => p - opt.pts);
        setUsdc((u: number) => +(u + opt.usdc).toFixed(4));
        showToast("Redeemed for " + opt.usdc + " USDC!");
        setRedeemIdx(null);
      },
      onError: () => showToast("Transaction failed!"),
    });
  };

  const doClaimUsdc = () => {
    if (usdc <= 0) { showToast("No USDC to claim!"); return; }
    if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
    sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther("0.000001") }, {
      onSuccess: () => { setUsdc(0); save("usdc", 0); showToast("USDC sent to wallet!"); },
      onError: () => showToast("Transaction failed!"),
    });
  };

  const missions = [
    { id: 1, name: "Like mission", desc: "Like the featured post", pts: 20, bg: "rgba(109,40,217,0.15)", color: "#a78bfa" },
    { id: 2, name: "Recast mission", desc: "Recast today's post", pts: 30, bg: "rgba(15,118,110,0.15)", color: "#2dd4bf" },
    { id: 3, name: "Comment mission", desc: "Reply to any cast", pts: 15, bg: "rgba(29,78,216,0.15)", color: "#60a5fa" },
    { id: 4, name: "Follow mission", desc: "Follow the featured user", pts: 25, bg: "rgba(180,83,9,0.15)", color: "#fbbf24" },
  ];

  const seg = 360 / PRIZES.length;

  const buildWheel = () => {
    const cx = 160, cy = 160, r = 130;
    const dots: JSX.Element[] = [];
    const numDots = 24;
    for (let i = 0; i < numDots; i++) {
      const angle = (i / numDots) * 360 - 90;
      const dx = cx + (r + 18) * Math.cos(angle * Math.PI / 180);
      const dy = cy + (r + 18) * Math.sin(angle * Math.PI / 180);
      dots.push(<circle key={"d" + i} cx={dx} cy={dy} r="5" fill={lights && i % 2 === 0 ? "#fff9c4" : "#fff176"} opacity={lights && i % 2 === 0 ? "1" : "0.4"}/>);
    }
    const slices = PRIZES.map((p, i) => {
      const a1 = i * seg - 90, a2 = a1 + seg;
      const x1 = cx + r * Math.cos(a1 * Math.PI / 180), y1 = cy + r * Math.sin(a1 * Math.PI / 180);
      const x2 = cx + r * Math.cos(a2 * Math.PI / 180), y2 = cy + r * Math.sin(a2 * Math.PI / 180);
      const tx = cx + r * 0.63 * Math.cos((a1 + seg / 2) * Math.PI / 180);
      const ty = cy + r * 0.63 * Math.sin((a1 + seg / 2) * Math.PI / 180);
      const midAngle = a1 + seg / 2;
      const gx1 = cx + r * 0.3 * Math.cos(midAngle * Math.PI / 180);
      const gy1 = cy + r * 0.3 * Math.sin(midAngle * Math.PI / 180);
      const gx2 = cx + r * 0.95 * Math.cos(midAngle * Math.PI / 180);
      const gy2 = cy + r * 0.95 * Math.sin(midAngle * Math.PI / 180);
      const gradId = "grad" + i;
      return (
        <g key={i}>
          <defs>
            <linearGradient id={gradId} x1={gx1} y1={gy1} x2={gx2} y2={gy2} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={p.light}/>
              <stop offset="100%" stopColor={p.bg}/>
            </linearGradient>
          </defs>
          <path d={"M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + r + " " + r + " 0 0 1 " + x2 + " " + y2 + " Z"} fill={"url(#" + gradId + ")"} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          <text x={tx} y={ty} fill="#fff" fontSize="9.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={"rotate(" + (a1 + seg / 2 + 90) + " " + tx + " " + ty + ")"} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)", fontFamily: "sans-serif" }}>{p.label}</text>
        </g>
      );
    });
    return { slices, dots };
  };

  const { slices, dots } = buildWheel();
  const wheelSize = 320;
  const cx = 160, cy = 160;

  const userName = fcUser?.display_name || fcUser?.username || "Your Profile";
  const userHandle = fcUser?.username ? "@" + fcUser.username : (isConnected && address ? address.slice(0,6) + "..." + address.slice(-4) : "Not connected");
  const userPfp = fcUser?.pfp_url || null;
  const refLink = APP_URL + "/ref/" + (fcUser?.fid || "your-fid");

  return (
    <div style={{ background: "#0d0d12", minHeight: "100dvh", width: "100%", maxWidth: 430, margin: "0 auto", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif", color: "#fff", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box} body{margin:0;padding:0;background:#0d0d12} button{font-family:inherit;cursor:pointer}`}</style>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>

        <div style={{ background: "#13131a", padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!logoErr ? <img src="/icon.png" onError={() => setLogoErr(true)} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} alt="logo" />
              : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>CR</div>}
            <div><div style={{ fontSize: 15, fontWeight: 600 }}>CastRewards</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>earn · spin · redeem</div></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ background: "rgba(245,158,11,0.12)", border: "0.5px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#fbbf24" }}>🔥 {streak}d</div>
            <div style={{ background: "rgba(139,92,246,0.15)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#a78bfa" }}>🎰 {freeSpins}</div>
          </div>
        </div>

        {tab === "home" && (<>
          <div style={{ margin: "12px 12px 0", background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 18, padding: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -25, right: -25, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 2, letterSpacing: "0.06em" }}>TOTAL POINTS</div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>{pts.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3, marginBottom: 14 }}>Keep earning to unlock rewards</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
              {[{ val: String(freeSpins), lbl: "Free spins" }, { val: "$" + usdc.toFixed(2), lbl: "USDC won" }, { val: doneMissions.length + "/4", lbl: "Missions" }].map(s => (
                <div key={s.lbl} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ margin: "10px 12px 0", background: "#13131a", borderRadius: 16, padding: 13, border: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              {userPfp ? <img src={userPfp} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(139,92,246,0.3)", flexShrink: 0 }} alt="pfp" />
                : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#312e81,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#c4b5fd", flexShrink: 0, border: "2px solid rgba(139,92,246,0.3)" }}>{userName.charAt(0).toUpperCase()}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userHandle}</div>
              </div>
              <div style={{ fontSize: 10, color: isConnected ? "#4ade80" : "#f87171", background: isConnected ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", borderRadius: 20, padding: "3px 8px", border: "0.5px solid " + (isConnected ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"), flexShrink: 0 }}>{isConnected ? "Connected" : "No wallet"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[{ label: "Followers", val: fcUser?.follower_count?.toLocaleString() || "—" }, { label: "Following", val: fcUser?.following_count?.toLocaleString() || "—" }, { label: "FID", val: fcUser?.fid || "—" }, { label: "Score", val: fcUser?.experimental?.neynar_user_score?.toFixed(1) || "—" }].map(s => (
                <div key={s.label} style={{ background: "#1a1a24", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div onClick={doCheckin} style={{ margin: "10px 12px 0", background: checkedIn ? "#111" : "#1a1025", border: "1px solid " + (checkedIn ? "rgba(255,255,255,0.06)" : "rgba(139,92,246,0.35)"), borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: checkedIn ? "default" : "pointer" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{checkedIn ? "✓" : "📅"} Daily check-in {checkedIn && <span style={{ fontSize: 10, color: "#4ade80", background: "rgba(74,222,128,0.1)", borderRadius: 20, padding: "2px 7px", marginLeft: 5 }}>Done</span>}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>+10 pts every day · resets midnight</div>
            </div>
            {!checkedIn && <button style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 9, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Check in</button>}
          </div>

          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 9, fontWeight: 600 }}>TODAYS MISSIONS</div>
            {missions.slice(0, 2).map(m => (
              <div key={m.id} onClick={() => doMission(m.id, m.pts)} style={{ background: "#13131a", borderRadius: 13, border: "0.5px solid rgba(255,255,255,0.06)", padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, marginBottom: 7, cursor: doneMissions.includes(m.id) ? "default" : "pointer", opacity: doneMissions.includes(m.id) ? 0.5 : 1 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: m.bg, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>★</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{m.desc}</div></div>
                <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: doneMissions.includes(m.id) ? "rgba(74,222,128,0.1)" : "rgba(139,92,246,0.15)", color: doneMissions.includes(m.id) ? "#4ade80" : "#c4b5fd", border: "0.5px solid rgba(139,92,246,0.3)", flexShrink: 0 }}>{doneMissions.includes(m.id) ? "Done" : "+" + m.pts}</div>
              </div>
            ))}
          </div>
        </>)}

        {tab === "spin" && (
          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ background: "linear-gradient(180deg,#1a0533 0%,#0d0d12 100%)", borderRadius: 20, padding: "20px 12px 16px", border: "0.5px solid rgba(139,92,246,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1 }}>🎰 SPIN TO WIN</div>

              <div style={{ position: "relative", width: wheelSize, height: wheelSize, maxWidth: "calc(100vw - 40px)" }}>
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", zIndex: 20, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.7))" }}>
                  <svg width="28" height="36" viewBox="0 0 28 36">
                    <polygon points="14,0 28,36 0,36" fill="#ff6b00"/>
                    <polygon points="14,4 26,34 2,34" fill="#ff9500"/>
                  </svg>
                </div>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "8px solid #1a237e", boxShadow: "0 0 0 3px #283593, inset 0 0 30px rgba(0,0,0,0.4), 0 0 40px rgba(63,81,181,0.5)", overflow: "hidden", position: "relative" }}>
                  <svg width="100%" height="100%" viewBox="0 0 320 320" style={{ transform: "rotate(" + rot + "deg)", transition: spinning ? "transform 4s cubic-bezier(0.17,0.85,0.12,1)" : "none" }}>
                    {slices}
                    <circle cx={cx} cy={cy} r="26" fill="#1a237e" stroke="#283593" strokeWidth="3"/>
                    <circle cx={cx} cy={cy} r="20" fill="#283593" stroke="#3f51b5" strokeWidth="2"/>
                    <text x={cx} y={cy + 1} fontSize="10" fill="#fff" textAnchor="middle" dominantBaseline="middle" fontWeight="900" style={{ fontFamily: "sans-serif", letterSpacing: "0.5px" }}>SPIN</text>
                  </svg>
                </div>
                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} viewBox="0 0 320 320">
                  {dots}
                </svg>
              </div>

              {spinResult && (
                <div style={{ background: spinResult.usdc >= 0.5 ? "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(251,191,36,0.1))" : spinResult.pts || spinResult.usdc ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: "1.5px solid " + (spinResult.usdc >= 0.5 ? "#f59e0b" : spinResult.pts || spinResult.usdc ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"), borderRadius: 14, padding: "12px 20px", textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>YOU WON</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: spinResult.usdc >= 0.5 ? "#f59e0b" : spinResult.pts || spinResult.usdc ? "#4ade80" : "rgba(255,255,255,0.4)" }}>{spinResult.label} {spinResult.usdc >= 0.5 ? "🏆" : spinResult.usdc > 0 ? "💰" : spinResult.pts ? "⭐" : "😔"}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
                <div style={{ background: "rgba(63,81,181,0.15)", borderRadius: 14, padding: 13, border: "1px solid rgba(63,81,181,0.3)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 3 }}>🎁 Free Spin</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Daily: {freeSpins}/{FREE_SPIN_LIMIT}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 9 }}>Fee: {FREE_SPIN_COST} ETH</div>
                  <button onClick={claimFreeSpins} disabled={dailySpinsClaimed} style={{ width: "100%", background: dailySpinsClaimed ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 9, padding: "8px 0", fontSize: 11, color: dailySpinsClaimed ? "rgba(255,255,255,0.3)" : "#fff", fontWeight: 600, marginBottom: 6 }}>{dailySpinsClaimed ? "✓ Claimed" : "Claim spins"}</button>
                  <button onClick={() => doSpin("free")} disabled={freeSpins <= 0 || spinning} style={{ width: "100%", background: freeSpins > 0 && !spinning ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid " + (freeSpins > 0 ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"), borderRadius: 9, padding: "8px 0", fontSize: 11, color: freeSpins > 0 && !spinning ? "#c4b5fd" : "rgba(255,255,255,0.2)", fontWeight: 600 }}>{spinning ? "Spinning..." : "Spin free"}</button>
                </div>
                <div style={{ background: "rgba(15,118,110,0.15)", borderRadius: 14, padding: 13, border: "1px solid rgba(20,184,166,0.3)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2dd4bf", marginBottom: 3 }}>💎 Paid Spin</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Unlimited</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>~0.03 USD in ETH</div>
                  <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "6px 8px", marginBottom: 9, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>🏆 Top prize: 0.5 USDC</div>
                  </div>
                  <button onClick={() => doSpin("paid")} disabled={spinning} style={{ width: "100%", background: spinning ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#0f766e,#14b8a6)", border: "none", borderRadius: 9, padding: "8px 0", fontSize: 11, color: spinning ? "rgba(255,255,255,0.3)" : "#fff", fontWeight: 700 }}>{spinning ? "Spinning..." : "Pay & Spin"}</button>
                </div>
              </div>

              <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "11px 13px", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em" }}>PRIZE TABLE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {[{ prize: "10 pts", chance: "37.5%", color: "#a78bfa" }, { prize: "20 pts", chance: "25%", color: "#60a5fa" }, { prize: "0.02 USDC", chance: "25%", color: "#2dd4bf" }, { prize: "0.5 USDC", chance: "12.5%", color: "#f59e0b" }, { prize: "Try Again", chance: "0%", color: "rgba(255,255,255,0.3)" }].map(p => (
                    <div key={p.prize} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}>
                      <span style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>{p.prize}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.chance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "missions" && (
          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ background: "#13131a", borderRadius: 13, padding: "11px 13px", border: "0.5px solid rgba(255,255,255,0.07)", marginBottom: 11, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>Daily progress</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{doneMissions.length} of 4 done</div></div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>{Math.round(doneMissions.length / 4 * 100)}%</div>
            </div>
            <div style={{ height: 4, background: "#1a1a24", borderRadius: 3, marginBottom: 13 }}>
              <div style={{ height: 4, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 3, width: Math.round(doneMissions.length / 4 * 100) + "%", transition: "width 0.4s" }} />
            </div>
            {missions.map(m => (
              <div key={m.id} onClick={() => doMission(m.id, m.pts)} style={{ background: "#13131a", borderRadius: 13, border: "0.5px solid rgba(255,255,255,0.06)", padding: "12px 13px", display: "flex", alignItems: "center", gap: 11, marginBottom: 7, cursor: doneMissions.includes(m.id) ? "default" : "pointer", opacity: doneMissions.includes(m.id) ? 0.55 : 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: m.bg, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>★</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{m.desc}</div></div>
                <div style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: doneMissions.includes(m.id) ? "rgba(74,222,128,0.1)" : "rgba(139,92,246,0.15)", color: doneMissions.includes(m.id) ? "#4ade80" : "#c4b5fd", border: "0.5px solid rgba(139,92,246,0.3)", flexShrink: 0 }}>{doneMissions.includes(m.id) ? "Done" : "+" + m.pts + " pts"}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "invite" && (
          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ background: "#13131a", borderRadius: 16, padding: 18, border: "0.5px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>Invite and earn</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, marginBottom: 16 }}>Share your link. When a friend joins and completes their first mission, you both earn bonus points.</div>
              <div style={{ background: "#1a1a24", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "9px 11px", display: "flex", alignItems: "center", gap: 9, marginBottom: 10, textAlign: "left" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{refLink}</span>
                <button onClick={() => { navigator.clipboard?.writeText(refLink); showToast("Link copied!"); }} style={{ background: "#7c3aed", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11, color: "#fff", fontWeight: 600, flexShrink: 0 }}>Copy</button>
              </div>
              <button onClick={() => shareOnFarcaster(fcUser?.fid)} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 11, padding: 12, fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 8 }}>🟣 Share on Warpcast</button>
              <button onClick={() => { navigator.clipboard?.writeText(refLink); showToast("Link copied!"); }} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: 11, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Copy invite link</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 9 }}>
              {[{ val: "+50 pts", lbl: "You earn per referral", icon: "🪙" }, { val: "+25 pts", lbl: "Friend earns on signup", icon: "🎁" }].map(r => (
                <div key={r.val} style={{ background: "#13131a", borderRadius: 13, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 7 }}>{r.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{r.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{r.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "wallet" && (
          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ background: "linear-gradient(135deg,#1a1025,#13131a)", borderRadius: 18, padding: 16, border: "1px solid rgba(139,92,246,0.2)", marginBottom: 9 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3, letterSpacing: "0.06em" }}>WALLET · BASE NETWORK</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#a78bfa", marginBottom: 13, wordBreak: "break-all" }}>{isConnected && address ? address : "Not connected"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 11, padding: "11px 9px", textAlign: "center" }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Points</div><div style={{ fontSize: 19, fontWeight: 700, color: "#a78bfa" }}>{pts.toLocaleString()}</div></div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 11, padding: "11px 9px", textAlign: "center" }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>USDC</div><div style={{ fontSize: 19, fontWeight: 700, color: "#2dd4bf" }}>${usdc.toFixed(4)}</div></div>
              </div>
            </div>
            {!isConnected && <button onClick={() => connect({ connector: farcasterFrame() })} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 13, padding: 13, fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 9 }}>Connect Wallet</button>}
            <div style={{ background: "#13131a", borderRadius: 14, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)", marginBottom: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 11 }}>💸 Claim USDC Reward</div>
              <div style={{ background: "#1a1a24", borderRadius: 9, padding: "9px 11px", marginBottom: 11, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Claimable USDC</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2dd4bf" }}>${usdc.toFixed(4)}</span>
              </div>
              <button onClick={doClaimUsdc} style={{ width: "100%", background: usdc > 0 ? "linear-gradient(135deg,#0f766e,#14b8a6)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 10, padding: 11, fontSize: 12, color: usdc > 0 ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: 600 }}>Claim to wallet</button>
            </div>
            <div style={{ background: "#13131a", borderRadius: 14, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)", marginBottom: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>🏆 Redeem Points for USDC</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 11 }}>Balance: <span style={{ color: "#a78bfa", fontWeight: 700 }}>{pts.toLocaleString()} pts</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
                {REDEEM_OPTIONS.map((opt, i) => (
                  <button key={i} onClick={() => setRedeemIdx(i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 13px", background: redeemIdx === i ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: "0.5px solid " + (redeemIdx === i ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.08)"), borderRadius: 10, opacity: pts < opt.pts ? 0.4 : 1 }}>
                    <span style={{ fontSize: 12, color: redeemIdx === i ? "#c4b5fd" : "rgba(255,255,255,0.7)", fontWeight: 600 }}>{opt.pts.toLocaleString()} pts</span>
                    <span style={{ fontSize: 13, color: "#2dd4bf", fontWeight: 700 }}>= {opt.usdc} USDC</span>
                  </button>
                ))}
              </div>
              <button onClick={doRedeem} style={{ width: "100%", background: redeemIdx !== null && pts >= REDEEM_OPTIONS[redeemIdx].pts ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 10, padding: 11, fontSize: 12, color: redeemIdx !== null && pts >= REDEEM_OPTIONS[redeemIdx].pts ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: 600 }}>
                {redeemIdx !== null ? "Redeem → " + REDEEM_OPTIONS[redeemIdx].usdc + " USDC" : "Select an option above"}
              </button>
            </div>
            <div style={{ background: "#13131a", borderRadius: 14, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 11 }}>📋 Transaction History</div>
              {[{ label: "Spin reward", val: "+10 pts", time: "2m ago", color: "#a78bfa" }, { label: "Mission done", val: "+20 pts", time: "1h ago", color: "#a78bfa" }, { label: "Spin reward", val: "+0.02 USDC", time: "3h ago", color: "#2dd4bf" }, { label: "Check-in", val: "+10 pts", time: "1d ago", color: "#a78bfa" }].map((tx, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div><div style={{ fontSize: 12, fontWeight: 500 }}>{tx.label}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{tx.time}</div></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tx.color }}>{tx.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#13131a", borderTop: "0.5px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "repeat(5,1fr)", padding: "6px 0 calc(env(safe-area-inset-bottom) + 6px)", zIndex: 100 }}>
        {([["home","⌂","Home"],["spin","🎰","Spin"],["missions","◎","Missions"],["invite","👥","Invite"],["wallet","💳","Wallet"]] as [Tab,string,string][]).map(([t,icon,label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", padding: "4px 0" }}>
            <span style={{ fontSize: 19, color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.25)" }}>{icon}</span>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: tab === t ? "#8b5cf6" : "transparent", margin: "1px auto" }} />
            <span style={{ fontSize: 9, color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.25)", fontWeight: tab === t ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
      {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(17,17,25,0.95)", border: "0.5px solid rgba(139,92,246,0.4)", color: "#fff", padding: "9px 18px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", zIndex: 200 }}>{toast}</div>}
    </div>
  );
}
