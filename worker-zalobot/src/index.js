/* ULIFe — ZALO BOT GATEWAY (worker độc lập, tách khỏi web/main)
 * Nhận webhook Zalo Bot cá nhân (bot-api.zapps.me, kiểu Telegram) -> chuẩn hoá -> gọi bộ não
 * ulife-brain qua HTTP -> gửi trả lời cho khách. Không chứa logic bán hàng.
 *
 * ROUTES
 *   GET  /                  health check
 *   GET  /health           health check
 *   POST /webhook/zalobot  webhook Zalo Bot
 *   POST /admin/set-webhook  (cần Bearer APP_SECRET) đăng ký webhook 1 lần: body {url}
 *
 * Trả 200 NGAY rồi xử lý ở nền (ctx.waitUntil) để Zalo không retry trùng.
 */

import { parseZaloBotWebhook, toBrainBody } from "./normalize.js";
import * as zalobot from "./zalobot.js";
import { askBrain } from "./brain.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "GET" && (path === "/" || path === "/health")) {
      return json({ ok: true, service: "ulife-zalobot-gateway", brain: Boolean(env.BRAIN_URL) });
    }

    if (path === "/webhook/zalobot") {
      return handleWebhook(request, env, ctx);
    }

    if (path === "/admin/set-webhook" && request.method === "POST") {
      return handleSetWebhook(request, env);
    }

    return json({ ok: false, error: "NOT_FOUND" }, 404);
  },
};

async function handleWebhook(request, env, ctx) {
  // Verify secret header (nếu đã đặt ZALOBOT_WEBHOOK_SECRET).
  const v = zalobot.verifySecret(request.headers, env);
  if (!v.ok) return json({ ok: false, error: "BAD_SECRET" }, 401);

  let payload = {};
  try { payload = await request.json(); } catch { payload = {}; }

  // Dedupe theo update_id để tránh xử lý trùng khi Zalo retry.
  const updateId = payload && (payload.update_id ?? payload.updateId);
  if (updateId != null && (await alreadySeen(env, `zbu:${updateId}`))) {
    return json({ ok: true, deduped: true });
  }

  const normalized = parseZaloBotWebhook(payload);

  // Xử lý ở nền, trả 200 ngay.
  ctx.waitUntil(processAll(env, normalized).catch((e) => console.error("zalobot process error", e)));
  return json({ ok: true, accepted: normalized.length });
}

async function processAll(env, normalized) {
  for (const norm of normalized) {
    try {
      await processOne(env, norm);
    } catch (e) {
      console.error("zalobot processOne error", e);
    }
  }
}

async function processOne(env, norm) {
  const chatId = norm.platform_user_id;
  if (!chatId) return;

  // Rate-limit chống spam (mỗi chat / phút). Bỏ qua nếu thiếu KV.
  const limit = Number(env.CHANNEL_RATE_LIMIT_PER_MIN || 20);
  if (limit > 0 && (await overRateLimit(env, chatId, limit))) {
    await zalobot.send(env, chatId, [{ type: "text", text: "Dạ anh/chị nhắn hơi nhanh, ULIFe xin xử lý lần lượt giúp mình nhé 🙏" }]);
    return;
  }

  // Hiệu ứng "đang soạn".
  await zalobot.sendChatAction(env, chatId, "typing").catch(() => {});

  const brainBody = toBrainBody(norm);
  const res = await askBrain(env, brainBody);

  let messages = res.ok ? res.messages : [];
  if (!messages || messages.length === 0) {
    // Fallback khi brain lỗi / chưa cấu hình: không để khách "im lặng".
    if (!res.ok) console.warn("brain unavailable:", res.reason, res.error || "");
    messages = [{ type: "text", text: fallbackText(env) }];
  }

  await zalobot.send(env, chatId, messages, undefined, { quick_replies: res.quick_replies || [] });
}

function fallbackText(env) {
  return (
    env.ZALOBOT_FALLBACK_TEXT ||
    "Dạ ULIFe đã nhận tin của mình ạ. Tư vấn viên sẽ phản hồi sớm nhất. Anh/chị để lại nhu cầu (mẫu, kích thước, ngân sách) giúp ULIFe nhé!"
  );
}

async function handleSetWebhook(request, env) {
  // Chỉ cho phép khi có Bearer APP_SECRET đúng.
  const auth = request.headers.get("authorization") || "";
  if (!env.APP_SECRET || auth !== `Bearer ${env.APP_SECRET}`) {
    return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  }
  let body = {};
  try { body = await request.json(); } catch {}
  const target = body.url;
  if (!target) return json({ ok: false, error: "MISSING_URL" }, 400);
  const r = await zalobot.setWebhook(env, target);
  return json(r, r.ok ? 200 : 502);
}

// ---- KV helpers (đều no-op an toàn nếu thiếu binding KV) ----
async function alreadySeen(env, key) {
  if (!env.KV) return false;
  try {
    const hit = await env.KV.get(key);
    if (hit) return true;
    await env.KV.put(key, "1", { expirationTtl: 600 });
    return false;
  } catch { return false; }
}

async function overRateLimit(env, chatId, limit) {
  if (!env.KV) return false;
  try {
    const slot = Math.floor(Date.now() / 60000);
    const key = `zbrl:${chatId}:${slot}`;
    const cur = Number((await env.KV.get(key)) || 0) + 1;
    await env.KV.put(key, String(cur), { expirationTtl: 120 });
    return cur > limit;
  } catch { return false; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
