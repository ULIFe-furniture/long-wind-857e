/* ULIFe Multi-channel — LỚP CHUẨN HOÁ (normalize)
 * Mọi tin nhắn từ Zalo OA / Facebook Messenger / web / botcake đều được map về MỘT schema chung,
 * rồi mới đưa vào "bộ não" (Sales Decision Layer) trong index.js.
 * Kênh chỉ là cổng vào/ra; quyết định bán hàng nằm ở worker trung tâm.
 */

export const CHANNELS = Object.freeze({
  MESSENGER: "messenger",
  ZALO: "zalo",        // Zalo OA (Official Account) — Open API v3.0
  ZALOBOT: "zalobot",  // Zalo Bot chính thống (bot.zaloplatforms.com) — chạy trên Zalo cá nhân
  WEB: "web",
  BOTCAKE: "botcake",
});

// Schema chuẩn (giữ ổn định — adapter mới chỉ cần điền đủ field này):
//   channel, platform_user_id, platform_thread_id, display_name,
//   message_text, attachments[{type,url}], image_urls[], postback_payload,
//   quick_reply_payload, timestamp, customer_id, intent_hint, raw_event
export function makeNormalized(partial = {}) {
  const channel = String(partial.channel || "").toLowerCase();
  const platform_user_id = String(partial.platform_user_id || "");
  const attachments = Array.isArray(partial.attachments) ? partial.attachments : [];
  const image_urls = Array.isArray(partial.image_urls) && partial.image_urls.length
    ? partial.image_urls
    : attachments.filter(a => a && /image/i.test(a.type || "") && a.url).map(a => a.url);
  return {
    channel,
    platform_user_id,
    platform_thread_id: String(partial.platform_thread_id || platform_user_id || ""),
    display_name: String(partial.display_name || ""),
    message_text: String(partial.message_text || "").trim(),
    attachments,
    image_urls,
    postback_payload: partial.postback_payload || "",
    quick_reply_payload: partial.quick_reply_payload || "",
    timestamp: Number(partial.timestamp || Date.now()),
    // customer_id ổn định để gộp hội thoại cùng 1 người trên 1 kênh
    customer_id: partial.customer_id || (channel && platform_user_id ? `${channel}:${platform_user_id}` : ""),
    intent_hint: partial.intent_hint || "",
    raw_event: partial.raw_event || null,
  };
}

// ---- Facebook Messenger webhook ----
// payload: { object:"page", entry:[{ id:pageId, messaging:[ event ... ] }] }
export function parseMessengerWebhook(payload = {}) {
  const out = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  for (const entry of entries) {
    const pageId = String(entry.id || "");
    const events = Array.isArray(entry.messaging) ? entry.messaging : [];
    for (const ev of events) {
      const psid = String(ev.sender && ev.sender.id || "");
      if (!psid) continue;
      // Bỏ qua echo do chính page gửi
      if (ev.message && ev.message.is_echo) continue;
      const base = {
        channel: CHANNELS.MESSENGER,
        platform_user_id: psid,
        platform_thread_id: pageId ? `${pageId}:${psid}` : psid,
        timestamp: Number(ev.timestamp || Date.now()),
        raw_event: ev,
      };
      if (ev.message) {
        const m = ev.message;
        const attachments = (Array.isArray(m.attachments) ? m.attachments : [])
          .map(a => ({ type: a.type || "", url: (a.payload && a.payload.url) || "" }))
          .filter(a => a.url);
        out.push(makeNormalized({
          ...base,
          message_text: m.text || "",
          attachments,
          quick_reply_payload: (m.quick_reply && m.quick_reply.payload) || "",
        }));
      } else if (ev.postback) {
        out.push(makeNormalized({
          ...base,
          message_text: ev.postback.title || "",
          postback_payload: ev.postback.payload || "",
        }));
      } else if (ev.referral) {
        out.push(makeNormalized({
          ...base,
          intent_hint: "referral",
          postback_payload: ev.referral.ref || "",
        }));
      }
    }
  }
  return out;
}

// ---- Zalo OA webhook ----
// payload ví dụ: { event_name:"user_send_text", sender:{id}, recipient:{id},
//                  message:{ text, attachments:[{type,payload:{url|thumbnail}}] }, timestamp }
export function parseZaloWebhook(payload = {}) {
  const ev = payload || {};
  const userId = String((ev.sender && ev.sender.id) || ev.user_id || "");
  const oaId = String((ev.recipient && ev.recipient.id) || ev.oa_id || "");
  if (!userId) return [];
  const name = String(ev.event_name || "");
  const base = {
    channel: CHANNELS.ZALO,
    platform_user_id: userId,
    platform_thread_id: oaId ? `${oaId}:${userId}` : userId,
    timestamp: Number(ev.timestamp || Date.now()),
    raw_event: ev,
  };
  const msg = ev.message || {};
  const attachments = (Array.isArray(msg.attachments) ? msg.attachments : [])
    .map(a => ({ type: a.type || "", url: (a.payload && (a.payload.url || a.payload.thumbnail)) || "" }))
    .filter(a => a.url);
  if (/postback/i.test(name)) {
    return [makeNormalized({
      ...base,
      message_text: (msg.text || (ev.postback && ev.postback.title)) || "",
      postback_payload: (ev.postback && ev.postback.payload) || (msg && msg.payload) || "",
    })];
  }
  return [makeNormalized({
    ...base,
    message_text: msg.text || "",
    attachments,
    intent_hint: /image|photo|sticker/i.test(name) ? "gui_anh" : "",
  })];
}

// ---- Zalo Bot webhook (bot.zaloplatforms.com — kiểu Telegram) ----
// payload ví dụ: { update_id, message:{ message_id, from:{id,display_name}, chat:{id},
//                  text, photo:[{file_url|url}], date } }
export function parseZaloBotWebhook(payload = {}) {
  const ev = payload || {};
  const m = ev.message || ev.edited_message || (ev.callback_query && ev.callback_query.message) || {};
  const chatId = String((m.chat && m.chat.id) || (m.from && m.from.id) || "");
  if (!chatId) return [];
  const display = String((m.from && (m.from.display_name || m.from.first_name || m.from.username)) || "");
  const photoUrl = extractZaloBotPhoto(m);
  const cb = ev.callback_query || null;
  const base = {
    channel: CHANNELS.ZALOBOT,
    platform_user_id: chatId,
    platform_thread_id: chatId,
    display_name: display,
    timestamp: Number(m.date ? m.date * 1000 : Date.now()),
    raw_event: ev,
  };
  if (cb) {
    return [makeNormalized({
      ...base,
      message_text: cb.data || "",
      postback_payload: cb.data || "",
    })];
  }
  return [makeNormalized({
    ...base,
    message_text: m.text || m.caption || "",
    image_urls: photoUrl ? [photoUrl] : [],
    intent_hint: photoUrl ? "gui_anh" : "",
  })];
}

function extractZaloBotPhoto(m) {
  if (!m) return null;
  if (Array.isArray(m.photo) && m.photo.length) {
    const last = m.photo[m.photo.length - 1];
    return typeof last === "string" ? last : (last.file_url || last.url || null);
  }
  if (m.photo && (m.photo.file_url || m.photo.url)) return m.photo.file_url || m.photo.url;
  if (m.photo_url) return m.photo_url;
  if (m.image && (m.image.url || m.image.file_url)) return m.image.url || m.image.file_url;
  if (Array.isArray(m.attachments) && m.attachments[0]) {
    const a = m.attachments[0];
    return (a.payload && a.payload.url) || a.url || a.file_url || null;
  }
  return null;
}

// ---- Generic (web widget / botcake JSON / test) ----
export function parseGeneric(body = {}, channel = CHANNELS.WEB) {
  const uid = String(body.user_id || body.sender_id || body.psid || body.zalo_user_id || body.customer_id || "anon");
  const img = body.image_url || body.image || "";
  return [makeNormalized({
    channel,
    platform_user_id: uid,
    platform_thread_id: body.thread_id || uid,
    display_name: body.name || body.display_name || "",
    message_text: body.text || body.message || body.noi_dung || "",
    image_urls: img ? [img] : [],
    postback_payload: body.payload || body.postback || "",
    quick_reply_payload: body.quick_reply || "",
    raw_event: body,
  })];
}

// Map message chuẩn -> body cho bộ não (replyMessage trong index.js).
export function toBrainBody(norm = {}) {
  // Postback/quick-reply mang payload dạng câu lệnh -> dùng làm text nếu không có text thường.
  const text = norm.message_text
    || decodePayloadToText(norm.postback_payload)
    || decodePayloadToText(norm.quick_reply_payload)
    || "";
  return {
    text,
    message: text,
    image_url: norm.image_urls && norm.image_urls[0] ? norm.image_urls[0] : "",
    has_image: Boolean(norm.image_urls && norm.image_urls.length),
    // định danh để storage layer gắn session/log đúng người
    sender_id: norm.platform_user_id,
    psid: norm.channel === CHANNELS.MESSENGER ? norm.platform_user_id : undefined,
    zalo_user_id: norm.channel === CHANNELS.ZALO ? norm.platform_user_id : undefined,
    customer_id: norm.customer_id,
    platform: norm.channel,
    channel: norm.channel,
    page_id: (norm.platform_thread_id || "").includes(":") ? norm.platform_thread_id.split(":")[0] : "",
    postback: norm.postback_payload || norm.quick_reply_payload || "",
    intent_hint: norm.intent_hint || "",
  };
}

// payload kiểu "INTENT:xem mẫu bàn ăn" hoặc JSON {message:"..."} -> text người-đọc-được
function decodePayloadToText(payload) {
  if (!payload) return "";
  const s = String(payload);
  try { const o = JSON.parse(s); if (o && (o.message || o.text)) return String(o.message || o.text); } catch {}
  const m = s.match(/^[A-Z_]+:(.+)$/);
  if (m) return m[1].trim();
  return s;
}
