/* ULIFe Zalo Bot gateway — CLIENT GỌI BỘ NÃO (ulife-brain)
 * Triết lý: kênh chỉ là cổng vào/ra; quyết định bán hàng nằm ở worker trung tâm.
 * Gateway này KHÔNG chứa logic bán hàng — nó gọi sang worker ulife-brain qua HTTP
 * rồi map câu trả lời về danh sách message để zalobot.js gửi đi.
 *
 * Cấu hình qua env (wrangler [vars] + secret):
 *   BRAIN_URL        gốc worker brain, vd https://ulife-brain.cskhufuniture.workers.dev
 *   BRAIN_REPLY_PATH đường dẫn endpoint trả lời của brain, vd "/reply" hoặc "/" (CHỈNH cho khớp brain)
 *   APP_SECRET       (secret) brain yêu cầu "Authorization: Bearer <APP_SECRET>"
 *   BRAIN_TIMEOUT_MS thời gian chờ tối đa (mặc định 20000)
 */

// Gọi brain và trả về { ok, messages:[{type:'text'|'image', text|url, caption}], quick_replies, raw }
export async function askBrain(env, brainBody, ctx) {
  const base = String(env.BRAIN_URL || "").replace(/\/$/, "");
  const path = env.BRAIN_REPLY_PATH || "/reply";
  if (!base) return { ok: false, reason: "NO_BRAIN_URL", messages: [] };

  const url = `${base}${path.startsWith("/") ? path : "/" + path}`;
  const timeoutMs = Number(env.BRAIN_TIMEOUT_MS || 20000);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);

  try {
    const headers = { "content-type": "application/json" };
    if (env.APP_SECRET) headers["authorization"] = `Bearer ${env.APP_SECRET}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(brainBody),
      signal: ctl.signal,
    });
    const txt = await res.text().catch(() => "");
    let data = null; try { data = JSON.parse(txt); } catch {}
    if (!res.ok) {
      return { ok: false, reason: `BRAIN_HTTP_${res.status}`, error: txt.slice(0, 300), messages: [] };
    }
    const messages = mapBrainReply(data ?? txt);
    return {
      ok: true,
      messages,
      quick_replies: extractQuickReplies(data),
      raw: data,
    };
  } catch (e) {
    return { ok: false, reason: "BRAIN_FETCH_ERROR", error: String((e && e.message) || e), messages: [] };
  } finally {
    clearTimeout(timer);
  }
}

// Chuẩn hoá nhiều dạng response của brain về [{type,text|url,caption}].
// Chấp nhận: { messages:[...] }, { next_messages:[...] }, { reply, images }, { text }, { answer }, string, string[].
export function mapBrainReply(data) {
  if (data == null) return [];
  if (typeof data === "string") return data.trim() ? [{ type: "text", text: data.trim() }] : [];
  if (Array.isArray(data)) return data.flatMap(normalizeOne).filter(Boolean);

  // Các field danh sách message thường gặp (next_messages dùng trong /pdf-order, /quote-order).
  const listKeys = ["next_messages", "messages", "replies", "reply_messages", "outbound"];
  for (const k of listKeys) {
    if (Array.isArray(data[k]) && data[k].length) {
      return data[k].flatMap(normalizeOne).filter(Boolean);
    }
  }

  const out = [];
  // Text trả lời chính (nhiều tên gọi khác nhau giữa các endpoint brain).
  const textKeys = ["reply", "text", "answer", "message", "content", "tra_loi", "noi_dung"];
  for (const k of textKeys) {
    if (typeof data[k] === "string" && data[k].trim()) {
      out.push({ type: "text", text: data[k].trim() });
      break;
    }
  }
  // Ảnh kèm theo (link sản phẩm / QR cọc / PDF...).
  const imgs = []
    .concat(data.images || [], data.image_urls || [], data.photos || [])
    .filter(Boolean);
  for (const im of imgs) {
    if (typeof im === "string") out.push({ type: "image", url: im });
    else if (im && im.url) out.push({ type: "image", url: im.url, caption: im.caption || "" });
  }
  // PDF báo giá trả về pdf_url -> gửi như một dòng link text.
  if (typeof data.pdf_url === "string" && data.pdf_url) {
    out.push({ type: "text", text: data.pdf_url });
  }
  return out.filter(Boolean);
}

function normalizeOne(m) {
  if (m == null) return [];
  if (typeof m === "string") return m.trim() ? [{ type: "text", text: m.trim() }] : [];
  // {type:'image',url} | {image_url} | {photo}
  const url = m.url || m.image_url || m.image || m.photo || m.pdf_url || "";
  const type = (m.type || "").toLowerCase();
  if (type === "image" || (url && (type === "" || type === "photo") && !m.text)) {
    return url ? [{ type: "image", url, caption: m.caption || m.text || "" }] : [];
  }
  const text = m.text || m.caption || m.message || "";
  const arr = [];
  if (text && String(text).trim()) arr.push({ type: "text", text: String(text).trim() });
  if (url) arr.push({ type: "image", url, caption: "" });
  return arr;
}

function extractQuickReplies(data) {
  if (!data || typeof data !== "object") return [];
  const qr = data.quick_replies || data.quickReplies || data.suggestions || [];
  if (!Array.isArray(qr)) return [];
  return qr
    .map(q => (typeof q === "string" ? { title: q } : { title: q.title || q.caption || q.label || "" }))
    .filter(q => q.title);
}
