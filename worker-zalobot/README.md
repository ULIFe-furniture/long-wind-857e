# ULIFe — Zalo Bot Gateway (`worker-zalobot`)

Worker **độc lập** làm cổng cho **Zalo Bot cá nhân** (`bot-api.zapps.me`, API kiểu Telegram —
chạy trên Zalo cá nhân, **không cần OA**). Worker này **không chứa logic bán hàng**: nó nhận
webhook, chuẩn hoá tin nhắn rồi **gọi sang bộ não `ulife-brain`** qua HTTP và gửi câu trả lời
về cho khách.

> Tách hẳn khỏi web Next.js ở thư mục gốc và khỏi worker `ulife-brain` → **không xung đột** với
> nhánh gốc. Deploy riêng (`name = "ulife-zalobot"`).

## Luồng xử lý
```
Zalo Bot  →  POST /webhook/zalobot  →  verify secret  →  parseZaloBotWebhook (normalize.js)
          →  toBrainBody  →  askBrain (HTTP → ulife-brain)  →  zalobot.send (trả lời khách)
```
Trả `200` ngay, xử lý ở nền (`ctx.waitUntil`) để Zalo không gửi trùng. Có dedupe theo
`update_id` và rate-limit theo chat/phút (khi bật KV).

## Cấu trúc
| File | Vai trò |
| --- | --- |
| `src/index.js` | Router webhook, verify, dedupe/rate-limit (KV), gọi brain, gửi trả lời |
| `src/normalize.js` | Lớp chuẩn hoá đa kênh (dùng `parseZaloBotWebhook`, `toBrainBody`) |
| `src/zalobot.js` | Adapter gọi Zalo Bot API (`sendMessage`/`sendPhoto`/`setWebhook`) |
| `src/brain.js` | Client HTTP gọi `ulife-brain` + parser dung sai nhiều dạng response |
| `wrangler.toml` | Cấu hình worker `ulife-zalobot` |

## Thiết lập & deploy
```bash
cd worker-zalobot
npm install

# (nên có) KV để dedupe + rate-limit
npx wrangler kv namespace create ZALOBOT_KV   # copy id, dán vào wrangler.toml, bỏ comment khối [[kv_namespaces]]

# secrets
npx wrangler secret put ZALOBOT_TOKEN           # token Zalo Bot
npx wrangler secret put ZALOBOT_WEBHOOK_SECRET  # chuỗi tự đặt
npx wrangler secret put APP_SECRET              # brain yêu cầu Bearer này

npx wrangler deploy

# đăng ký webhook (1 lần)
curl -X POST https://ulife-zalobot.<subdomain>.workers.dev/admin/set-webhook \
  -H "authorization: Bearer $APP_SECRET" -H "content-type: application/json" \
  -d '{"url":"https://ulife-zalobot.<subdomain>.workers.dev/webhook/zalobot"}'
```

## ⚠️ Cần xác nhận để chốt phần nối brain
`src/brain.js` POST sang `BRAIN_URL + BRAIN_REPLY_PATH`. Hai giá trị cần đúng với `ulife-brain`:

- **`BRAIN_REPLY_PATH`** — endpoint trả lời của brain (đang để mặc định `/reply`). Cần khớp route
  thật trong `src/index.js` của `ulife-brain` (vd có thể là `/`, `/reply`, `/botcake`…).
- **Hình dạng response của brain** — parser hiện chấp nhận: `next_messages[]`, `messages[]`,
  `{reply|text|answer}`, `images[]`, `pdf_url`, chuỗi, mảng chuỗi. Nếu brain trả dạng khác,
  cập nhật `mapBrainReply()` cho khớp.

Khi có `src/index.js` của brain (hoặc thông tin endpoint + mẫu response), phần map sẽ được chốt
chính xác. Trong lúc chờ, gateway vẫn chạy: nếu brain lỗi/chưa đúng path, khách nhận câu fallback
thay vì im lặng.
