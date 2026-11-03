# LAST CIRCLE 3D — Multiplayer prototype

Game sinh tồn 3D góc nhìn thứ ba, nhiều người chơi qua Socket.IO. Tối đa 12 người/phòng, có bắn nhau, máu, hồi sinh, vòng bo và công trình che chắn. **Đây là prototype, chưa phải PUBG đầy đủ.** Hỗ trợ điều khiển máy tính và điện thoại. Chưa có link công khai nếu chưa tự triển khai lên hosting.

## Chạy trên máy tính

Yêu cầu: Node.js 20 trở lên, Internet để tải thư viện Three.js qua CDN.

```bash
npm install
npm start
```

Mở http://localhost:3000 . Các máy trong cùng mạng LAN có thể dùng http://DIA_CHI_IP_CUA_MAY_CHU:3000 .

## Đưa online để gửi link cho bạn bè

1. Đưa cả thư mục này lên repository GitHub của bạn.
2. Trên một dịch vụ host Node.js hỗ trợ kết nối WebSocket liên tục (ví dụ Render Web Service), tạo Web Service từ repository.
3. Build command: `npm install` ; Start command: `npm start` ; Node.js 20+.
4. Dùng URL HTTPS do nhà cung cấp cấp và chia sẻ `https://ten-app-cua-ban.example/?room=DUNG01` cho bạn bè. Mọi người phải nhập cùng mã phòng.
5. Đảm bảo dịch vụ luôn chạy khi bạn bè muốn chơi; gói miễn phí có thể tự ngủ, giới hạn tài nguyên hoặc thay đổi chính sách.

Lưu ý: Mã phòng **không phải mật khẩu bảo mật**. Game chưa có tài khoản, chống gian lận, matchmaking, tối ưu mạng di động, lưu tiến trình hay cơ chế loại khỏi trận vĩnh viễn. Trạng thái phòng chỉ tồn tại trong RAM, reset khi server khởi động lại. Không nên triển khai nhiều server replicas nếu chưa thêm shared state/adapter.

## Điều khiển

Máy tính: WASD di chuyển, chuột xoay hướng, nhấn chuột trái để bắn, Shift để chạy, Esc nhả chuột.

Điện thoại: dùng joystick bên trái để di chuyển, vuốt nửa màn hình còn lại để ngắm, giữ nút BẮN để bắn liên tục, giữ CHẠY để tăng tốc. Có thể dùng đồng thời nhiều ngón tay. Dùng Chrome hoặc Safari phiên bản mới; hiệu năng phụ thuộc thiết bị.
