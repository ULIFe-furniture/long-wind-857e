# Tích hợp Zalo cho bot bán hàng ULIFe

> Tóm tắt quyết định: **đầu não là worker Cloudflare `ulife-brain`** (đã có sẵn logic bán hàng,
> RAG, PDF, đa kênh). Không dựng worker/đầu-não thứ hai. Việc còn lại chỉ là **bật đúng kênh**.

Bộ não `ulife-brain` (v4.28) **đã tích hợp sẵn** các route — không cần viết code mới:

| Route | Mục đích |
| --- | --- |
| `POST /webhook/zalo` | Zalo OA (Official Account) — khách nhắn OA là bot tự trả lời |
| `POST /webhook/zalobot` | Zalo Bot platform (bot.zaloplatforms.com) — có bước pairing/QR |
| `POST /webhook/messenger` | Facebook Messenger |
| `POST /api/reply` | Nhận `{channel,text,user_id}` → trả `messages` **không tự gửi ra kênh** (dùng cho n8n/web/test) |
| `GET /zalo/oauth/start`, `GET /zalo/oauth/callback` | Lấy/refresh token Zalo OA |

---

## Phương án 1 (KHUYẾN NGHỊ) — Zalo OA, dùng thẳng brain

Khách nhắn OA → `/webhook/zalo` → brain trả lời từng tin **như Messenger**. Chính thống, ổn định,
tiếp cận mọi khách (không cần pairing/QR).

**Checklist bật (không cần code):**
```bash
# 1) Nạp secret cho brain (trong thư mục worker ulife-brain)
npx wrangler secret put APP_SECRET          # bắt buộc ở production
npx wrangler secret put ZALO_APP_ID
npx wrangler secret put ZALO_APP_SECRET     # verify chữ ký + refresh token
npx wrangler secret put ZALO_ACCESS_TOKEN   # token hiện tại (sống ~1 ngày)
npx wrangler secret put ZALO_REFRESH_TOKEN  # để brain tự refresh, lưu vòng mới vào KV

npx wrangler deploy

# 2) Khai báo webhook trên Zalo OA (Zalo for Developers > OA > Webhook):
#    https://ulife-brain.cskhufuniture.workers.dev/webhook/zalo
# 3) Cấp quyền/token lần đầu qua trình duyệt:
#    https://ulife-brain.cskhufuniture.workers.dev/zalo/oauth/start
```

> Hạn chế cần biết: Zalo OA chỉ tự trả lời trong **cửa sổ hội thoại** theo chính sách Zalo (giống
> messaging window của Messenger). Đây là giới hạn nền tảng, không phải lỗi bot.

---

## Phương án 2 (DỰ PHÒNG) — Zalo cá nhân qua n8n, đầu não vẫn là Cloudflare

Dùng khi P1 chưa sẵn sàng (chưa có OA) và chấp nhận rủi ro. **Không chính thống.**

```
Zalo cá nhân  ⇄  zca-js / n8n-nodes-zalo-user (trong n8n)
              →  HTTP POST  ulife-brain  /api/reply  (Authorization: Bearer APP_SECRET)
              →  nhận messages  →  gửi lại qua zca-js
```

Body gọi brain (n8n → HTTP Request node):
```json
POST https://ulife-brain.cskhufuniture.workers.dev/api/reply
Authorization: Bearer <APP_SECRET>
{ "channel": "zalo_user", "text": "<tin khách>", "user_id": "<id khách>", "customer_id": "zalo_user:<id>" }
```
Response: `{ ok, reply, messages, intent, handoff, data }` → lấy `reply`/`messages` gửi về khách.

**⚠️ Rủi ro & lưu ý:**
- `zca-js` mô phỏng Zalo Web bằng tài khoản cá nhân thật → **có thể bị Zalo khoá/treo tài khoản**.
- Thư viện không chính thống, dễ hỏng khi Zalo cập nhật → tốn bảo trì.
- Nên dùng **tài khoản phụ / thử nghiệm**, không đặt cược tài khoản chính.

Tham khảo: zca-js (Unofficial Zalo API), node n8n `n8n-nodes-zalo-user`.

---

## Vì sao không dùng worker gateway riêng cho zalobot
Brain đã có sẵn `/webhook/zalobot`; thêm một worker cổng riêng chỉ tạo thêm 1 bước HTTP và 1 worker
thừa, không giúp gì cho dự án chính. Nếu cần, lịch sử git vẫn còn bản gateway cũ để khôi phục.
