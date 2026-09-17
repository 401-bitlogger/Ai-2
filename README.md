# 🎶 Lyrics Sync Discord Bot

Bot Discord đồng bộ lời bài hát có timestamp và hiển thị dòng hiện tại qua **presence của bot** + tin nhắn trong channel.

> Phiên bản này dùng bot Discord thông thường. Nó **không sử dụng user token/self-bot**, không đọc mật khẩu, cookie, token hay phím bấm của người dùng và không thay đổi status cá nhân của tài khoản người dùng.

## Chức năng

- `/lyrics title:<tên bài> artist:<ca sĩ>` — tìm synced lyrics và bắt đầu chạy.
- Bot cập nhật presence theo từng dòng lyrics.
- Bot gửi dòng lyrics hiện tại vào channel theo timestamp.
- Nút **🎵 Chạy Lyrics** / **⏹ Dừng Lyrics** trong panel.
- `/stoplyrics` — dừng phiên.
- `/lyricstatus` — xem trạng thái phiên hiện tại.
- Lyrics được lấy từ LRCLIB và chỉ dùng dữ liệu có timestamp.
- Token bot chỉ đọc từ biến môi trường `DISCORD_TOKEN`.

## Cài đặt

Yêu cầu Node.js 20+.

```bash
npm install
```

Tạo biến môi trường:

```env
DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_guild_id
```

Chạy:

```bash
npm start
```

`GUILD_ID` là tùy chọn. Nếu có, slash commands được đăng ký cho server đó nhanh hơn; nếu bỏ trống, commands được đăng ký toàn ứng dụng.

## Discord Developer Portal

1. Tạo một **Bot Application** mới.
2. Lấy **Bot Token** và đặt vào `DISCORD_TOKEN`.
3. Invite bot vào server với scope `bot` và `applications.commands`.
4. Cấp tối thiểu quyền cần thiết để bot gửi tin nhắn trong channel sử dụng Lyrics Sync.

### Không dùng user token

Ảnh tham khảo có luồng nhập token tài khoản người dùng để thay đổi status cá nhân. Bot này không làm theo phần đó: Discord bot token và user token là hai loại credential khác nhau. Không nhập token tài khoản cá nhân vào bot.

## Ví dụ

```text
/lyrics title:Example artist:Example Artist
```

Bot sẽ tìm lyrics có timestamp, sau đó bắt đầu từ mốc thời gian đầu tiên và cập nhật dòng hiện tại.

## Giới hạn

- Bot presence không phải status cá nhân của người dùng.
- Một phiên được chạy theo đồng hồ của bot; nó không tự phát nhạc.
- Muốn đồng bộ chính xác với một trình phát nhạc cụ thể, cần thêm nguồn thời gian playback hoặc tích hợp player có quyền hợp lệ.
- Không phải bài hát nào cũng có synced lyrics.

## An toàn

Không commit `.env` hoặc token thật vào Git. Nếu token bị lộ, hãy reset token trong Discord Developer Portal.
