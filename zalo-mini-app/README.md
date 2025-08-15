# Zalo Mini App

Thự mục này chỡa các tài nguyẹn cần thít để đóng gói website ULIFe Furniture thành Zalo Mini App.

## Hướng dẫn triển khai

1. Xuất ứng dụng Next.js thành các tệp tỉnh:
   ```bash
   npm install
   npm run build
   npm run export
   ```
   Các tệp tỉnh sẽ được tạo ra trong thư mục `out/`.

2. Sao chép toàn bộ nội dung của thư mục `out/` vào thư mục `www/` trong thư mục mini app này.

3. Cập nhật `miniapp.config.json` với `appId` (ID cũa ứng dụng Zalo), tên, biểu tựơng và mô tả.

4. Nén thư mục và tải lên bãng quản lý Zalo Mini App để phát hành.

## Lưu ý

- Zalo Mini App không hỗ trợ Server‑Side Rendering; vì vậy, website phải được xuất dưới dạng trang tỉnh.
- Nếu cấn dữ liêu động, hãy gọi API hoặc sử dụng SDK cũa Zalo Mini App.
