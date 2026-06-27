/* ULIFe Multi-channel — ZALO BOT ADAPTER (bot.zaloplatforms.com)
 * - Bot chính thống của Zalo, chạy trên Zalo cá nhân/Business cá nhân (KHÔNG cần OA).
 * - API kiểu Telegram: POST https://bot-api.zapps.me/bot<token>/<method>
 *   sendMessage {chat_id,text}, sendPhoto {chat_id,photo,caption}, sendChatAction {chat_id,action}
 * - Xác minh webhook bằng header X-Bot-Api-Secret-Token === ZALOBOT_WEBHOOK_SECRET (nếu có đặt).
 * - Token chỉ lấy từ env (wrangler secret). TUYỆT ĐỐI không hardcode.
 */

const ZBASE = (token) => `https://bot-api.zapps.me/bot${token}`;

export function tokenFromEnv(env = {}) {
  return env.ZALOBOT_TOKEN || env.ZALO_BOT_TOKEN || "";
}

// Webhook secret (Zalo gửi kèm header). Thiếu secret -> bỏ verify (best-effort khi mới setup).
export function verifySecret(headers, env) {
  const want = env.ZALOBOT_WEBHOOK_SECRET || "";
  if (!want) return { ok: true, skipped: true };
  const got = String((headers.get && headers.get("x-bot-api-secret-token")) || (headers["x-bot-api-secret-token"]) || "");
  return { ok: got === want };
}

// Gửi danh sách message [{type:"text",text}|{type:"image",url}] + quick_replies (degrade -> text gợi ý)
export async function send(env, chatId, messages = [], ctx, opts = {}) {
  const token = tokenFromEnv(env);
  if (!token) return { ok: false, reason: "NO_ZALOBOT_TOKEN" };
  if (!chatId) return { ok: false, reason: "NO_RECIPIENT" };

  const results = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const isLast = i === messages.length - 1;
    let r;
    if (m.type === "image" && m.url) {
      r = await callMethod(token, "sendPhoto", { chat_id: chatId, photo: m.url, caption: String(m.caption || "").slice(0, 1000) }, env);
    } else {
      let text = String(m.text || "").slice(0, 1900);
      // Zalo Bot chưa hỗ trợ quick-reply ổn định -> gắn gợi ý dạng text ở message cuối.
      if (isLast && Array.isArray(opts.quick_replies) && opts.quick_replies.length) {
        const tips = opts.quick_replies.slice(0, 6).map(q => `• ${q.title || q.caption}`).join("\n");
        if (tips) text = `${text}\n${tips}`.slice(0, 1900);
      }
      r = await callMethod(token, "sendMessage", { chat_id: chatId, text }, env);
    }
    results.push(r);
    if (!r.ok) break;
  }
  const ok = results.length > 0 && results.every(r => r.ok);
  return { ok, results };
}

export async function sendChatAction(env, chatId, action = "typing") {
  const token = tokenFromEnv(env);
  if (!token || !chatId) return { ok: false };
  return callMethod(token, "sendChatAction", { chat_id: chatId, action }, env);
}

// Đăng ký webhook 1 lần (tiện gọi từ một route admin nếu cần).
export async function setWebhook(env, url) {
  const token = tokenFromEnv(env);
  if (!token || !url) return { ok: false, reason: "MISSING" };
  const body = { url };
  if (env.ZALOBOT_WEBHOOK_SECRET) body.secret_token = env.ZALOBOT_WEBHOOK_SECRET;
  return callMethod(token, "setWebhook", body, env);
}

async function callMethod(token, method, body, env, tries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= tries; attempt++) {
    try {
      const res = await fetch(`${ZBASE(token)}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const txt = await res.text().catch(() => "");
      let data = {}; try { data = JSON.parse(txt); } catch {}
      if (res.ok && (data.ok === undefined || data.ok === true)) return { ok: true, status: res.status };
      // 4xx -> không retry (sai token/chat)
      if (res.status >= 400 && res.status < 500) return { ok: false, status: res.status, error: txt.slice(0, 300) };
      lastErr = `HTTP ${res.status}: ${txt.slice(0, 200)}`;
    } catch (e) { lastErr = String(e && e.message || e); }
    await sleep(250 * (attempt + 1));
  }
  return { ok: false, error: lastErr };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
