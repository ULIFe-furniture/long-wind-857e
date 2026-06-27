# Đồng bộ sản phẩm Shopify → Zalo OA (chính thống, không bay nick)

> Chỉ dùng **API chính chủ**: Shopify Admin API + Zalo OA Open API (`openapi.zalo.me`). Không đụng
> nick cá nhân → không có rủi ro bay nick. Điều phối bằng **n8n** (file mẫu: `n8n/shopify-to-oa-sync.json`).

## Luồng
```
[Lịch / webhook Shopify]  →  Lấy sản phẩm (Shopify Admin API)
   →  Định dạng nội dung (tên, giá, ảnh, link mua)
   →  Đăng/broadcast bài viết lên Zalo OA (openapi.zalo.me)
```

## Endpoint dùng
- **Shopify**: `GET https://<shop>.myshopify.com/admin/api/2024-01/products.json`
  header `X-Shopify-Access-Token: <token>` (Admin API access token, tạo trong Shopify → Settings → Apps → Develop apps).
- **Zalo OA**: `POST https://openapi.zalo.me/v2.0/oa/message` (gửi/broadcast) — header/param `access_token`.
  Tạo bài viết & broadcast theo tài liệu OA (mục "Quản lý bài viết / Broadcast").

## ⚠️ Giới hạn cần biết (đọc trước khi kỳ vọng)
- **Broadcast OA bị giới hạn số lần/tháng** tuỳ loại OA (OA thường rất hạn chế). Đừng dùng broadcast
  để spam — vừa hết quota vừa làm follower tắt thông báo.
- Cách bền hơn: đăng **bài viết OA (timeline)** đều đặn + đính link Shopify; broadcast chỉ dành cho
  ưu đãi lớn.
- Đồng bộ nên **chọn lọc** (sản phẩm mới / đang khuyến mãi), không đẩy toàn bộ catalog mỗi lần.

## Cách dùng file n8n
1. n8n → Import → chọn `n8n/shopify-to-oa-sync.json`.
2. Mở node **Shopify - Lấy sản phẩm**: điền `shop` domain + tạo credential header `X-Shopify-Access-Token`.
3. Mở node **Zalo OA - Đăng bài**: điền `ZALO_OA_ACCESS_TOKEN` (Credential), kiểm tra lại payload theo
   tài liệu OA mới nhất (Zalo có thể đổi schema).
4. Node **Định dạng nội dung**: chỉnh mẫu câu, số sản phẩm/lần, lọc theo tag/collection.
5. Đặt lịch ở node **Lịch chạy** (mặc định 1 lần/ngày, khung giờ vàng) rồi Activate.

> Token Zalo OA sống ngắn — nên kèm bước refresh token (xem template OAuth của Zalo OA trên n8n.io)
> hoặc để **brain Cloudflare tự refresh** rồi n8n đọc token từ brain.

## Liên kết với brain (tuỳ chọn)
Brain đã có `worker_products_index.json` + endpoint nội bộ. Có thể cho n8n lấy nội dung sản phẩm đã
chuẩn hoá từ brain thay vì gọi Shopify trực tiếp, để dùng chung định dạng giá/ảnh với chatbot.
