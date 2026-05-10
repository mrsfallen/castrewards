"use client";
import { useState, useEffect } from "react";
import { useAccount, useSendTransaction, useConnect } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { parseEther } from "viem";
import { sdk } from "@farcaster/miniapp-sdk";

type Tab = "home" | "spin" | "missions" | "invite" | "wallet";
type SpinPrize = { label: string; pts: number; usdc: number; bg: string };

const PRIZES: SpinPrize[] = [
  { label: "10 pts", pts: 10, usdc: 0, bg: "#6d28d9" },
  { label: "0.02 USDC", pts: 0, usdc: 0.02, bg: "#0f766e" },
  { label: "20 pts", pts: 20, usdc: 0, bg: "#7c3aed" },
  { label: "Try Again", pts: 0, usdc: 0, bg: "#374151" },
  { label: "10 pts", pts: 10, usdc: 0, bg: "#6d28d9" },
  { label: "20 pts", pts: 20, usdc: 0, bg: "#7c3aed" },
  { label: "0.02 USDC", pts: 0, usdc: 0.02, bg: "#0f766e" },
  { label: "Try Again", pts: 0, usdc: 0, bg: "#374151" },
];

const TREASURY = "0x5d7d7dEdF9e4F3cAf57718790646152616Cc82ee";
const APP_URL = "https://castrewards-app.vercel.app";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [pts, setPts] = useState(150);
  const [usdc, setUsdc] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const [spinResult, setSpinResult] = useState<SpinPrize | null>(null);
  const [freeSpins, setFreeSpins] = useState(0);
  const [dailySpinsClaimed, setDailySpinsClaimed] = useState(false);
  const [doneMissions, setDoneMissions] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [streak, setStreak] = useState(3);
  const [checkedIn, setCheckedIn] = useState(false);
  const [redeemAmt, setRedeemAmt] = useState("");
  const [fcUser, setFcUser] = useState<any>(null);
  const [logoErr, setLogoErr] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { sendTransaction } = useSendTransaction();

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
    const text = "Join me on CastRewards! Earn points by completing missions, spin to win USDC rewards, and get bonus points when you sign up. " + refLink;
    const castUrl = "https://warpcast.com/~/compose?text=" + encodeURIComponent(text) + "&embeds[]=" + encodeURIComponent(APP_URL);
    window.open(castUrl, "_blank");
  };

  const claimFreeSpins = () => {
    if (dailySpinsClaimed) { showToast("Already claimed today!"); return; }
    if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
    sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther("0.00002") }, {
      onSuccess: () => { setFreeSpins(f => f + 2); setDailySpinsClaimed(true); showToast("2 free spins claimed!"); },
      onError: () => showToast("Transaction failed!"),
    });
  };

  const runSpinAnimation = () => {
    setSpinning(true);
    setSpinResult(null);
    const winner = Math.floor(Math.random() * PRIZES.length);
    const seg = 360 / PRIZES.length;
    setRot(r => r + 360 * 8 + (360 - winner * seg - seg / 2));
    setTimeout(() => {
      const prize = PRIZES[winner];
      setSpinResult(prize);
      if (prize.pts) setPts(p => p + prize.pts);
      if (prize.usdc) setUsdc(u => +(u + prize.usdc).toFixed(4));
      setSpinning(false);
      showToast(prize.pts ? "+" + prize.pts + " pts!" : prize.usdc ? "+0.02 USDC!" : "Better luck next time!");
    }, 4000);
  };

  const doSpin = (type: "free" | "paid") => {
    if (spinning) return;
    if (type === "free") {
      if (freeSpins <= 0) { showToast("No free spins!"); return; }
      setFreeSpins(f => f - 1);
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
    setDoneMissions(d => [...d, id]);
    setPts(prev => prev + p);
    showToast("+" + p + " pts earned!");
  };

  const doCheckin = () => {
    if (checkedIn) { showToast("Already checked in!"); return; }
    setCheckedIn(true); setStreak(s => s + 1); setPts(p => p + 10);
    showToast("+10 pts! Come back tomorrow.");
  };

  const doRedeem = () => {
    const amt = parseInt(redeemAmt);
    if (!amt || pts < amt) { showToast("Not enough points!"); return; }
    if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
    sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther("0.000001") }, {
      onSuccess: () => { setPts(p => p - amt); showToast("Redeemed " + amt + " pts!"); setRedeemAmt(""); },
      onError: () => showToast("Transaction failed!"),
    });
  };

  const doClaimUsdc = () => {
    if (usdc <= 0) { showToast("No USDC to claim!"); return; }
    if (!isConnected) { connect({ connector: farcasterFrame() }); return; }
    sendTransaction({ to: TREASURY as `0x${string}`, value: parseEther("0.000001") }, {
      onSuccess: () => { setUsdc(0); showToast("USDC sent to wallet!"); },
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
    const cx = 130, cy = 130, r = 120;
    return PRIZES.map((p, i) => {
      const a1 = i * seg - 90, a2 = a1 + seg;
      const x1 = cx + r * Math.cos(a1 * Math.PI / 180), y1 = cy + r * Math.sin(a1 * Math.PI / 180);
      const x2 = cx + r * Math.cos(a2 * Math.PI / 180), y2 = cy + r * Math.sin(a2 * Math.PI / 180);
      const tx = cx + r * 0.65 * Math.cos((a1 + seg / 2) * Math.PI / 180);
      const ty = cy + r * 0.65 * Math.sin((a1 + seg / 2) * Math.PI / 180);
      return (
        <g key={i}>
          <path d={"M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + r + " " + r + " 0 0 1 " + x2 + " " + y2 + " Z"} fill={p.bg} stroke="#0d0d12" strokeWidth="2"/>
          <text x={tx} y={ty} fill="#fff" fontSize="11" fontWeight="600" textAnchor="middle" dominantBaseline="middle" transform={"rotate(" + (a1 + seg / 2 + 90) + " " + tx + " " + ty + ")"}>{p.label}</text>
        </g>
      );
    });
  };

  const shortAddr = isConnected && address ? address.slice(0,6) + "..." + address.slice(-4) : "Not connected";
  const userName = fcUser?.display_name || fcUser?.username || "Your Profile";
  const userHandle = fcUser?.username ? "@" + fcUser.username : shortAddr;
  const userPfp = fcUser?.pfp_url || null;
  const followers = fcUser?.follower_count?.toLocaleString() || "—";
  const following = fcUser?.following_count?.toLocaleString() || "—";
  const refLink = APP_URL + "/ref/" + (fcUser?.fid || "your-fid");

  return (
    <div style={{ background: "#0d0d12", minHeight: "100dvh", width: "100%", maxWidth: 430, margin: "0 auto", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif", color: "#fff", display: "flex", flexDirection: "column" }}>
      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        body{margin:0;padding:0;background:#0d0d12}
        button{font-family:inherit}
        img{display:block}
      `}</style>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>

        <div style={{ background: "#13131a", padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!logoErr
              ? <img src="/icon.png" onError={() => setLogoErr(true)} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="logo" />
              : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>CR</div>
            }
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>CastRewards</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>earn · spin · redeem</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: "rgba(245,158,11,0.12)", border: "0.5px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#fbbf24" }}>🔥 {streak}d</div>
            <div style={{ background: "rgba(139,92,246,0.15)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#a78bfa" }}>🎰 {freeSpins}</div>
          </div>
        </div>

        {tab === "home" && (<>
          <div style={{ margin: "12px 12px 0", background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 18, padding: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -25, right: -25, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 2, letterSpacing: "0.06em" }}>TOTAL POINTS</div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>{pts}</div>
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
              {userPfp
                ? <img src={userPfp} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(139,92,246,0.3)", flexShrink: 0 }} alt="pfp" />
                : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#312e81,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#c4b5fd", flexShrink: 0, border: "2px solid rgba(139,92,246,0.3)" }}>{userName.charAt(0).toUpperCase()}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userHandle}</div>
              </div>
              <div style={{ fontSize: 10, color: isConnected ? "#4ade80" : "#f87171", background: isConnected ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", borderRadius: 20, padding: "3px 8px", border: "0.5px solid " + (isConnected ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"), flexShrink: 0 }}>{isConnected ? "Connected" : "No wallet"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[{ label: "Followers", val: followers }, { label: "Following", val: following }, { label: "FID", val: fcUser?.fid || "—" }, { label: "Score", val: fcUser?.experimental?.neynar_user_score?.toFixed(1) || "—" }].map(s => (
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
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>+10 pts every day</div>
            </div>
            {!checkedIn && <button style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 9, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Check in</button>}
          </div>

          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 9, fontWeight: 600 }}>TODAYS MISSIONS</div>
            {missions.slice(0, 2).map(m => (
              <div key={m.id} onClick={() => doMission(m.id, m.pts)} style={{ background: "#13131a", borderRadius: 13, border: "0.5px solid rgba(255,255,255,0.06)", padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, marginBottom: 7, cursor: doneMissions.includes(m.id) ? "default" : "pointer", opacity: doneMissions.includes(m.id) ? 0.5 : 1 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: m.bg, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>★</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{m.desc}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: doneMissions.includes(m.id) ? "rgba(74,222,128,0.1)" : "rgba(139,92,246,0.15)", color: doneMissions.includes(m.id) ? "#4ade80" : "#c4b5fd", border: "0.5px solid rgba(139,92,246,0.3)", flexShrink: 0 }}>{doneMissions.includes(m.id) ? "Done" : "+" + m.pts + " pts"}</div>
              </div>
            ))}
          </div>
        </>)}

        {tab === "spin" && (
          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ background: "#13131a", borderRadius: 18, padding: "18px 12px", border: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>🎰 Spin to Win</div>
              <div style={{ position: "relative", width: "min(260px, calc(100vw - 80px))", aspectRatio: "1" }}>
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
                  <div style={{ width: 0, height: 0, borderLeft: "11px solid transparent", borderRight: "11px solid transparent", borderTop: "22px solid #ef4444" }} />
                </div>
                <div style={{ borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.1)", boxShadow: "0 0 30px rgba(139,92,246,0.3)", width: "100%", height: "100%" }}>
                  <svg width="100%" height="100%" viewBox="0 0 260 260" style={{ transform: "rotate(" + rot + "deg)", transition: spinning ? "transform 4s cubic-bezier(0.17,0.85,0.12,1)" : "none" }}>
                    {buildWheel()}
                    <circle cx="130" cy="130" r="18" fill="#0d0d12" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
                    <text x="130" y="135" fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle" dominantBaseline="middle">GO</text>
                  </svg>
                </div>
              </div>
              {spinResult && (
                <div style={{ background: spinResult.pts || spinResult.usdc ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: "1px solid " + (spinResult.pts || spinResult.usdc ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"), borderRadius: 11, padding: "10px 16px", textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>You won</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: spinResult.pts || spinResult.usdc ? "#4ade80" : "rgba(255,255,255,0.4)" }}>{spinResult.label}</div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, width: "100%" }}>
                <div style={{ background: "#1a1a24", borderRadius: 13, padding: 12, border: "0.5px solid rgba(139,92,246,0.2)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 3 }}>🎁 Free Spin</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 1 }}>Daily limit: 2</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Fee: 0.00002 ETH</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Available:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: freeSpins > 0 ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>{freeSpins}/2</span>
                  </div>
                  <button onClick={claimFreeSpins} disabled={dailySpinsClaimed} style={{ width: "100%", background: dailySpinsClaimed ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 9, padding: "8px 0", fontSize: 11, color: dailySpinsClaimed ? "rgba(255,255,255,0.3)" : "#fff", fontWeight: 600, cursor: dailySpinsClaimed ? "default" : "pointer", marginBottom: 5 }}>{dailySpinsClaimed ? "Claimed" : "Claim (0.00002 ETH)"}</button>
                  <button onClick={() => doSpin("free")} disabled={freeSpins <= 0 || spinning} style={{ width: "100%", background: freeSpins > 0 && !spinning ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: 9, padding: "8px 0", fontSize: 11, color: freeSpins > 0 && !spinning ? "#a78bfa" : "rgba(255,255,255,0.2)", fontWeight: 600, cursor: freeSpins > 0 && !spinning ? "pointer" : "default" }}>{spinning ? "Spinning..." : "Use free spin"}</button>
                </div>
                <div style={{ background: "#1a1a24", borderRadius: 13, padding: 12, border: "0.5px solid rgba(20,184,166,0.2)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2dd4bf", marginBottom: 3 }}>💎 Paid Spin</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 1 }}>Unlimited</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Cost: ~0.03 USD ETH</div>
                  <div style={{ background: "rgba(20,184,166,0.08)", border: "0.5px solid rgba(20,184,166,0.15)", borderRadius: 7, padding: "7px 8px", marginBottom: 7 }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Prizes</div>
                    <div style={{ fontSize: 10, color: "#2dd4bf" }}>10pts · 20pts · 0.02 USDC</div>
                  </div>
                  <button onClick={() => doSpin("paid")} disabled={spinning} style={{ width: "100%", background: spinning ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg,#0f766e,#14b8a6)", border: "none", borderRadius: 9, padding: "8px 0", fontSize: 11, color: spinning ? "rgba(255,255,255,0.3)" : "#fff", fontWeight: 600, cursor: spinning ? "default" : "pointer" }}>{spinning ? "Spinning..." : "Pay & Spin"}</button>
                </div>
              </div>
              <div style={{ width: "100%", background: "#1a1a24", borderRadius: 11, padding: "11px 13px", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 7, fontWeight: 600, letterSpacing: "0.06em" }}>PRIZE TABLE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {[{ prize: "10 pts", chance: "37.5%", color: "#a78bfa" }, { prize: "20 pts", chance: "25%", color: "#60a5fa" }, { prize: "0.02 USDC", chance: "25%", color: "#2dd4bf" }, { prize: "Try Again", chance: "12.5%", color: "rgba(255,255,255,0.3)" }].map(p => (
                    <div key={p.prize} style={{ display: "flex", justifyContent: "space-between", padding: "5px 7px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}>
                      <span style={{ fontSize: 11, color: p.color, fontWeight: 600 }}>{p.prize}</span>
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
                <button onClick={() => { navigator.clipboard?.writeText(refLink); showToast("Link copied!"); }} style={{ background: "#7c3aed", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>Copy</button>
              </div>

              <button onClick={() => shareOnFarcaster(fcUser?.fid)} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 11, padding: 12, fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>🟣</span> Share on Warpcast
              </button>
              <button onClick={() => { navigator.clipboard?.writeText(refLink); showToast("Link copied!"); }} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: 11, fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Copy invite link</button>
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

            <div style={{ marginTop: 9, background: "#13131a", borderRadius: 13, border: "0.5px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
              {[{ label: "Friends invited", val: "0" }, { label: "Pending joins", val: "0" }, { label: "Bonus pts earned", val: "0 pts" }].map((r, i, arr) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderBottom: i < arr.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{r.val}</span>
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
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 11, padding: "11px 9px", textAlign: "center" }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Points</div><div style={{ fontSize: 19, fontWeight: 700, color: "#a78bfa" }}>{pts}</div></div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 11, padding: "11px 9px", textAlign: "center" }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>USDC won</div><div style={{ fontSize: 19, fontWeight: 700, color: "#2dd4bf" }}>${usdc.toFixed(4)}</div></div>
              </div>
            </div>
            {!isConnected && <button onClick={() => connect({ connector: farcasterFrame() })} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 13, padding: 13, fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer", marginBottom: 9 }}>Connect Wallet</button>}
            <div style={{ background: "#13131a", borderRadius: 14, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)", marginBottom: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 11 }}>💸 Claim USDC Reward</div>
              <div style={{ background: "#1a1a24", borderRadius: 9, padding: "9px 11px", marginBottom: 11, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Claimable USDC</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2dd4bf" }}>${usdc.toFixed(4)}</span>
              </div>
              <button onClick={doClaimUsdc} style={{ width: "100%", background: usdc > 0 ? "linear-gradient(135deg,#0f766e,#14b8a6)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 10, padding: 11, fontSize: 12, color: usdc > 0 ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: 600, cursor: usdc > 0 ? "pointer" : "default" }}>Claim to wallet</button>
            </div>
            <div style={{ background: "#13131a", borderRadius: 14, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)", marginBottom: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 11 }}>🏆 Redeem Points</div>
              <div style={{ background: "#1a1a24", borderRadius: 9, padding: "9px 11px", marginBottom: 9, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Your points</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{pts} pts</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 9 }}>100 pts = 0.001 ETH</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 9 }}>
                {[100, 200, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setRedeemAmt(String(amt))} style={{ background: redeemAmt === String(amt) ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: "0.5px solid " + (redeemAmt === String(amt) ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"), borderRadius: 9, padding: "7px 0", fontSize: 12, color: redeemAmt === String(amt) ? "#a78bfa" : "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 600 }}>{amt} pts</button>
                ))}
              </div>
              <button onClick={doRedeem} style={{ width: "100%", background: redeemAmt && pts >= parseInt(redeemAmt) ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 10, padding: 11, fontSize: 12, color: redeemAmt && pts >= parseInt(redeemAmt) ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: 600, cursor: "pointer" }}>Redeem {redeemAmt ? redeemAmt + " pts" : ""}</button>
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
          <button key={t} onClick={() => setTab(t)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}>
            <span style={{ fontSize: 19, color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.25)" }}>{icon}</span>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: tab === t ? "#8b5cf6" : "transparent", margin: "1px auto" }} />
            <span style={{ fontSize: 9, color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.25)", fontWeight: tab === t ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
      {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(17,17,25,0.95)", border: "0.5px solid rgba(139,92,246,0.3)", color: "#fff", padding: "9px 18px", borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", zIndex: 200 }}>{toast}</div>}
    </div>
  );
}
