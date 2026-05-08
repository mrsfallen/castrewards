"use client";
import { useEffect, useState } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

type Tab = "home" | "spin" | "missions" | "invite";

export default function CastRewards() {
  const { context } = useMiniAppContext();
  const user = context?.user;

  const [tab, setTab] = useState<Tab>("home");
  const [pts, setPts] = useState(150);
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const [spinResult, setSpinResult] = useState("");
  const [doneMissions, setDoneMissions] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [streak, setStreak] = useState(3);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const doCheckin = () => {
    setPts((p) => p + 10);
    setStreak((s) => s + 1);
    showToast("Checked in! +10 pts & 2 free spins");
  };

  const doSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setSpinResult("");
    const prizes = ["+50 pts", "Free spin", "+100 pts", "+25 pts"];
    const winner = Math.floor(Math.random() * 4);
    const newRot = rot + 360 * 6 + (360 - winner * 90 - 45);
    setRot(newRot);
    setTimeout(() => {
      const prize = prizes[winner];
      setSpinResult(`You won: ${prize}!`);
      if (prize === "+50 pts") setPts((p) => p + 50);
      if (prize === "+100 pts") setPts((p) => p + 100);
      if (prize === "+25 pts") setPts((p) => p + 25);
      setSpinning(false);
      showToast(`You won ${prize}!`);
    }, 3400);
  };

  const doMission = (id: number, p: number) => {
    if (doneMissions.includes(id)) return;
    setDoneMissions((d) => [...d, id]);
    setPts((prev) => prev + p);
    showToast(`+${p} pts earned!`);
  };

  const missions = [
    { id: 1, name: "Like mission", desc: "Like the featured post", pts: 20, bg: "rgba(109,40,217,0.15)", color: "#a78bfa" },
    { id: 2, name: "Recast mission", desc: "Recast today's post", pts: 30, bg: "rgba(15,118,110,0.15)", color: "#2dd4bf" },
    { id: 3, name: "Comment mission", desc: "Reply to any cast", pts: 15, bg: "rgba(29,78,216,0.15)", color: "#60a5fa" },
    { id: 4, name: "Follow mission", desc: "Follow the featured user", pts: 25, bg: "rgba(180,83,9,0.15)", color: "#fbbf24" },
  ];

  const S: Record<string, React.CSSProperties> = {
    root: { background: "#0d0d12", minHeight: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "sans-serif", color: "#fff", display: "flex", flexDirection: "column", position: "relative" },
    scroll: { flex: 1, overflowY: "auto", paddingBottom: 80 },
    topbar: { background: "#13131a", padding: "14px 18px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    brandRow: { display: "flex", alignItems: "center", gap: 10 },
    logo: { width: 34, height: 34, borderRadius: "50%", background: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 },
    brandName: { fontSize: 16, fontWeight: 500 },
    brandSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 },
    streakPill: { background: "rgba(245,158,11,0.12)", border: "0.5px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#fbbf24" },
    hero: { margin: "14px 14px 0", background: "#6d28d9", borderRadius: 16, padding: 16 },
    heroLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4, letterSpacing: "0.04em" },
    heroPts: { fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 },
    heroSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, marginBottom: 14 },
    heroGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
    heroStat: { background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px" },
    heroStatVal: { fontSize: 15, fontWeight: 500 },
    heroStatLbl: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 },
    card: { margin: "10px 14px 0", background: "#13131a", borderRadius: 16, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)" },
    secLabel: { fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", marginBottom: 10 },
    missionItem: { background: "#13131a", borderRadius: 14, border: "0.5px solid rgba(255,255,255,0.06)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8, cursor: "pointer" },
    missionIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
    missionName: { fontSize: 14, fontWeight: 500 },
    missionDesc: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 },
    ptsBadge: { fontSize: 12, fontWeight: 500, padding: "4px 11px", borderRadius: 20, whiteSpace: "nowrap" as const },
    checkinCard: { margin: "10px 14px 0", background: "#1a1025", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" },
    checkinBtn: { background: "#7c3aed", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" },
    navBar: { position: "fixed" as const, bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#13131a", borderTop: "0.5px solid rgba(255,255,255,0.07)", display: "grid", gridTemplateColumns: "repeat(4,1fr)", padding: "8px 0 24px", zIndex: 100 },
    navBtn: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" },
    toast: { position: "fixed" as const, bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(139,92,246,0.95)", color: "#fff", padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" as const, zIndex: 200 },
    userCard: { display: "flex", alignItems: "center", gap: 11, marginBottom: 12 },
    userGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
    userStat: { background: "#1a1a24", borderRadius: 10, padding: "9px 11px" },
    userStatVal: { fontSize: 13, fontWeight: 500 },
    userStatLbl: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  };

  const navIcons: Record<Tab, string> = { home: "⌂", spin: "⟳", missions: "◎", invite: "↗" };

  return (
    <div style={S.root}>
      <div style={S.scroll}>

        {/* TOP BAR */}
        <div style={S.topbar}>
          <div style={S.brandRow}>
            <div style={S.logo}>CR</div>
            <div>
              <div style={S.brandName}>CastRewards</div>
              <div style={S.brandSub}>earn · spin · redeem</div>
            </div>
          </div>
          <div style={S.streakPill}>🔥 {streak} day streak</div>
        </div>

        {/* ── HOME ── */}
        {tab === "home" && (
          <>
            {/* Points hero */}
            <div style={S.hero}>
              <div style={S.heroLabel}>TOTAL POINTS</div>
              <div style={S.heroPts}>{pts}</div>
              <div style={S.heroSub}>Keep earning to unlock rewards</div>
              <div style={S.heroGrid}>
                <div style={S.heroStat}><div style={S.heroStatVal}>0</div><div style={S.heroStatLbl}>Free spins</div></div>
                <div style={S.heroStat}><div style={S.heroStatVal}>0</div><div style={S.heroStatLbl}>Today earned</div></div>
              </div>
            </div>

            {/* User profile */}
            <div style={S.card}>
              <div style={S.userCard}>
                {user?.pfpUrl
                  ? <img src={user.pfpUrl} style={{ width: 46, height: 46, borderRadius: "50%", border: "2px solid rgba(139,92,246,0.35)", flexShrink: 0 }} />
                  : <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#312e81", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#c4b5fd", flexShrink: 0 }}>U</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{user?.displayName || "Connect wallet"}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>@{user?.username || "..."}</div>
                </div>
                <div style={{ fontSize: 11, color: "#a78bfa", background: "rgba(139,92,246,0.15)", borderRadius: 20, padding: "3px 10px", border: "0.5px solid rgba(139,92,246,0.3)" }}>Active</div>
              </div>
              <div style={S.userGrid}>
                {[
                  { label: "Followers", val: user?.followerCount?.toLocaleString() ?? "—" },
                  { label: "Following", val: user?.followingCount?.toLocaleString() ?? "—" },
                ].map((s) => (
                  <div key={s.label} style={S.userStat}>
                    <div style={S.userStatVal}>{s.val}</div>
                    <div style={S.userStatLbl}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Check-in */}
            <div style={S.checkinCard} onClick={doCheckin}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Daily check-in</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>+10 pts · 2 free spins</div>
              </div>
              <button style={S.checkinBtn}>Check in</button>
            </div>

            {/* Quick missions */}
            <div style={{ padding: "14px 14px 0" }}>
              <div style={S.secLabel}>TODAY'S MISSIONS</div>
              {missions.slice(0, 2).map((m) => (
                <div key={m.id} style={{ ...S.missionItem, opacity: doneMissions.includes(m.id) ? 0.5 : 1 }} onClick={() => doMission(m.id, m.pts)}>
                  <div style={{ ...S.missionIcon, background: m.bg, color: m.color }}>★</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.missionName}>{m.name}</div>
                    <div style={S.missionDesc}>{m.desc}</div>
                  </div>
                  <div style={{ ...S.ptsBadge, background: doneMissions.includes(m.id) ? "rgba(20,184,166,0.1)" : "rgba(139,92,246,0.15)", color: doneMissions.includes(m.id) ? "#2dd4bf" : "#c4b5fd", border: `0.5px solid ${doneMissions.includes(m.id) ? "rgba(20,184,166,0.3)" : "rgba(139,92,246,0.3)"}` }}>
                    {doneMissions.includes(m.id) ? "Done" : `+${m.pts} pts`}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SPIN ── */}
        {tab === "spin" && (
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ background: "#13131a", borderRadius: 16, padding: 20, border: "0.5px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 210, height: 210 }}>
                <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "16px solid #ef4444", zIndex: 10 }} />
                <svg width="210" height="210" viewBox="0 0 210 210"
                  style={{ transform: `rotate(${rot}deg)`, transition: spinning ? "transform 3.4s cubic-bezier(0.17,0.85,0.18,1)" : "none" }}>
                  <path d="M105,105 L105,8 A97,97 0 0,1 202,105 Z" fill="#6d28d9"/>
                  <path d="M105,105 L202,105 A97,97 0 0,1 105,202 Z" fill="#14b8a6"/>
                  <path d="M105,105 L105,202 A97,97 0 0,1 8,105 Z" fill="#7c3aed"/>
                  <path d="M105,105 L8,105 A97,97 0 0,1 105,8 Z" fill="#0f766e"/>
                  <text x="148" y="58" fontSize="10" fill="rgba(255,255,255,0.9)" textAnchor="middle" transform="rotate(45,148,58)">+50 pts</text>
                  <text x="158" y="148" fontSize="10" fill="rgba(255,255,255,0.9)" textAnchor="middle" transform="rotate(135,158,148)">Free spin</text>
                  <text x="62" y="158" fontSize="10" fill="rgba(255,255,255,0.9)" textAnchor="middle" transform="rotate(225,62,158)">+100 pts</text>
                  <text x="52" y="58" fontSize="10" fill="rgba(255,255,255,0.9)" textAnchor="middle" transform="rotate(315,52,58)">+25 pts</text>
                  <circle cx="105" cy="105" r="14" fill="#0d0d12"/>
                </svg>
              </div>
              {spinResult && (
                <div style={{ background: "rgba(20,184,166,0.08)", border: "0.5px solid rgba(20,184,166,0.3)", borderRadius: 10, padding: "10px 20px", color: "#2dd4bf", fontSize: 14, fontWeight: 500, textAlign: "center", width: "100%" }}>
                  {spinResult}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              {[
                { title: "Free spin", cost: "Small gas fee only", btn: "Claim & spin", outline: false },
                { title: "Paid spin", cost: "0.03 USD in ETH", btn: "Pay & spin", outline: true },
              ].map((opt) => (
                <div key={opt.title} style={{ background: "#13131a", borderRadius: 16, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{opt.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{opt.cost}</div>
                  <button onClick={doSpin} style={{ width: "100%", background: opt.outline ? "transparent" : "#7c3aed", border: opt.outline ? "0.5px solid rgba(139,92,246,0.4)" : "none", borderRadius: 10, padding: 9, fontSize: 12, color: opt.outline ? "#a78bfa" : "#fff", fontWeight: 500, cursor: "pointer" }}>
                    {opt.btn}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, background: "#13131a", borderRadius: 14, padding: "13px 14px", border: "0.5px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: "0.04em" }}>HOW IT WORKS</div>
              {["Free spin requires a small gas tx — one per day", "Paid spin costs 0.03 USD in ETH — unlimited spins", "Prizes: points, bonus spins, or special rewards"].map((t) => (
                <div key={t} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#8b5cf6", marginTop: 5, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MISSIONS ── */}
        {tab === "missions" && (
          <div style={{ padding: "14px 14px 0" }}>
            {/* Progress */}
            <div style={{ height: 4, background: "#1a1a24", borderRadius: 2, marginBottom: 6 }}>
              <div style={{ height: 4, background: "#7c3aed", borderRadius: 2, width: `${Math.round(doneMissions.length / 4 * 100)}%`, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              <span>{doneMissions.length} of 4 done</span>
              <span style={{ color: "#8b5cf6" }}>{Math.round(doneMissions.length / 4 * 100)}%</span>
            </div>

            {missions.map((m) => (
              <div key={m.id}
                style={{ ...S.missionItem, opacity: doneMissions.includes(m.id) ? 0.5 : 1, pointerEvents: doneMissions.includes(m.id) ? "none" : "auto" }}
                onClick={() => doMission(m.id, m.pts)}>
                <div style={{ ...S.missionIcon, background: m.bg, color: m.color }}>★</div>
                <div style={{ flex: 1 }}>
                  <div style={S.missionName}>{m.name}</div>
                  <div style={S.missionDesc}>{m.desc}</div>
                </div>
                <div style={{ ...S.ptsBadge, background: doneMissions.includes(m.id) ? "rgba(20,184,166,0.1)" : "rgba(139,92,246,0.15)", color: doneMissions.includes(m.id) ? "#2dd4bf" : "#c4b5fd", border: "0.5px solid rgba(139,92,246,0.3)" }}>
                  {doneMissions.includes(m.id) ? "Done" : `+${m.pts} pts`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INVITE ── */}
        {tab === "invite" && (
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ background: "#13131a", borderRadius: 16, padding: 20, border: "0.5px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "0.5px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26, color: "#a78bfa" }}>+</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Invite & earn together</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 16 }}>Share your link. When a friend joins and completes their first mission, you both earn bonus points.</div>

              <div style={{ background: "#1a1a24", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 12, textAlign: "left" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  castrewards-app.vercel.app/ref/{user?.fid ?? "..."}
                </span>
                <button onClick={() => showToast("Link copied!")} style={{ background: "#7c3aed", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 500 }}>Copy</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => showToast("Opening Warpcast...")} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: 10, fontSize: 13, color: "#fff", fontWeight: 500, cursor: "pointer" }}>Share cast</button>
                <button onClick={() => showToast("Link copied!")} style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Copy link</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              {[{ val: "+50 pts", lbl: "You earn per referral" }, { val: "+25 pts", lbl: "Friend earns on signup" }].map((r) => (
                <div key={r.val} style={{ background: "#13131a", borderRadius: 14, padding: 14, border: "0.5px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 22, color: "#8b5cf6", marginBottom: 6 }}>◆</div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{r.val}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{r.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={S.navBar}>
        {(["home", "spin", "missions", "invite"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={S.navBtn}>
            <span style={{ fontSize: 22, color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.25)" }}>{navIcons[t]}</span>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: tab === t ? "#8b5cf6" : "transparent", margin: "0 auto" }} />
            <span style={{ fontSize: 10, color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.25)", textTransform: "capitalize" }}>{t}</span>
          </button>
        ))}
      </div>

      {/* TOAST */}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}