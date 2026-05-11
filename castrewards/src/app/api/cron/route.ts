import { NextRequest } from "next/server";
import { sendNeynarMiniAppNotification } from "~/lib/neynar";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const msgs = [
      { title: "🎰 Time to spin!", body: "Your daily free spins are waiting. Win USDC now!" },
      { title: "📅 Daily check-in ready!", body: "Check in for +10 pts and keep your streak!" },
      { title: "⭐ Missions available!", body: "Complete missions to earn points and rewards." },
    ];
    const msg = msgs[Math.floor(Date.now() / (12 * 60 * 60 * 1000)) % msgs.length];
    const result = await sendNeynarMiniAppNotification({ title: msg.title, body: msg.body });
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}