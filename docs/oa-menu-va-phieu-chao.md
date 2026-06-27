# Zalo OA: Menu + câu chào + phễu kéo từ nick cá nhân về OA

> **Nguyên tắc không bay nick:** nick cá nhân chỉ dùng **tính năng có sẵn của Zalo** (trả lời
> nhanh/tin tự động trong app) và **thao tác tay** — KHÔNG dùng API/bot không chính thống. OA dùng
> Zalo OA Open API chính chủ. Tài liệu này là nội dung để bạn dán vào Zalo OA Manager / app Zalo.

## A. Menu OA (Zalo OA Manager → Phát triển → Menu, hoặc Open API menu)
Đề xuất 5 nút (Zalo OA cho tối đa 5 mục chính):

| Nút | Loại | Hành động |
| --- | --- | --- |
| 🛋️ Sản phẩm & Bảng giá | Mở link | Link bộ sưu tập Shopify / catalog |
| 🎨 Đặt làm theo yêu cầu | Gửi tin | Trả về form: ảnh mẫu + kích thước + ngân sách |
| 🚚 Phí vận chuyển | Gửi tin | Hướng dẫn gửi tỉnh/địa chỉ để báo phí |
| 🏷️ Ưu đãi hiện có | Mở link | Link trang khuyến mãi |
| ☎️ Liên hệ / Zalo tư vấn | Mở link | `https://zalo.me/0815006531` + giờ làm 8h–18h |

> Nếu bật bot (brain `/webhook/zalo`), các nút "Gửi tin" sẽ kích đúng intent (tư vấn, ship...).

## B. Câu chào khi follow OA (Welcome message)
```
Dạ ULIFe chào anh/chị! 🌿
Nội Thất Gỗ Tự Nhiên ULIFe – gỗ thông thật, đóng theo yêu cầu cho quán cà phê, nhà hàng & gia đình.
Anh/chị cần ULIFe hỗ trợ gì ạ?
• Xem mẫu & bảng giá → bấm 🛋️ menu bên dưới
• Đặt làm riêng → gửi ảnh mẫu + kích thước, ULIFe báo giá nhanh
Giờ làm: 8h–18h hằng ngày ☎️ 0815 006 531
```

## C. Tin trả lời tự động OA (Auto-reply ngoài giờ / chờ tư vấn viên)
```
Dạ ULIFe đã nhận tin của mình ạ 🙏 Tư vấn viên sẽ phản hồi trong giờ làm (8h–18h).
Trong lúc chờ, anh/chị gửi giúp ULIFe: (1) mẫu/ảnh tham khảo, (2) kích thước, (3) khu vực nhận hàng
— để ULIFe báo giá & phí ship chính xác nhất nhé!
```

## D. Phễu kéo khách từ nick cá nhân → OA (đây là chỗ gỡ nút thắt "search số ra nick cá nhân")
Khách search số luôn ra **nick cá nhân** — ta tận dụng điều đó để **đẩy follow OA**, làm hoàn toàn bằng tay/tính năng sẵn có:

**1. Sửa hồ sơ nick cá nhân (làm tay):**
- Ảnh bìa: ghi "Theo dõi OA ULIFe để xem bảng giá & ưu đãi 👇" kèm QR OA.
- Phần giới thiệu/tiểu sử: dán link OA `https://oa.zalo.me/<oa_id>`.

**2. Câu trả lời nhanh trên nick cá nhân** (dùng tính năng "Tin nhắn nhanh" có sẵn của Zalo — hợp lệ):
```
Dạ ULIFe đây ạ 🌿 Để xem đầy đủ mẫu, bảng giá & nhận ưu đãi, anh/chị bấm theo dõi trang chính thức ULIFe nhé:
👉 https://oa.zalo.me/<oa_id>
Mình cứ nhắn ở đây cũng được ạ, ULIFe hỗ trợ ngay!
```
> Vẫn trả lời khách ở nick cá nhân (giữ trải nghiệm), nhưng **mỗi hội thoại đều cài link OA** → dần kéo follow.

**3. Mọi điểm chạm khác đặt QR/link OA:** website, bao bì, hoá đơn, story, bài đăng.

**4. Tăng follow OA hợp lệ & nhanh:** chạy **Zalo Ads mục tiêu "Quan tâm OA"** + mini-game "Follow OA + comment nhận ưu đãi".

## E. Cách lấy `oa_id` / link OA
Zalo OA Manager → Thông tin OA → lấy OA ID, hoặc link dạng `https://oa.zalo.me/<oa_id>`. Thay `<oa_id>` vào các mẫu trên.
