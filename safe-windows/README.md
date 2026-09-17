# Bản thay thế Windows đã làm sạch

Thư mục này chứa mã nguồn mới, có thể kiểm tra và tự biên dịch, thay cho hai binary không đáng tin cậy:

- `hokkinjector-safe.exe`: chỉ nạp DLL nằm cùng thư mục vào **chính tiến trình của nó** và gọi hàm tự kiểm tra.
- `sdgii23dmkf-safe.dll`: DLL tối giản chỉ cung cấp thông tin build và phép tự kiểm tra.

Đây là bản thay thế sạch, không phải bản vá trực tiếp của binary gốc. Hai file gốc không được đưa vào repository.

## Những chức năng đã loại bỏ

- Không tìm hoặc can thiệp vào cửa sổ VALORANT.
- Không dùng `SetWindowsHookEx`, `OpenProcess`, `WriteProcessMemory` hoặc `CreateRemoteThread`.
- Không đọc Riot lockfile, access token hoặc entitlement token.
- Không chạy `cloudflared.exe`, không tạo HTTP server hoặc tunnel.
- Không dùng WinHTTP, WinINet, Winsock hoặc kết nối mạng.
- Không ghi registry, tạo scheduled task hoặc tự khởi động.
- Không thu thập phím bấm, clipboard hoặc dữ liệu người dùng.

## Biên dịch trên Windows

Yêu cầu Visual Studio 2022 với workload **Desktop development with C++** và CMake.

```powershell
cmake -S safe-windows -B safe-windows/build -A x64
cmake --build safe-windows/build --config Release
```

Kết quả:

```text
safe-windows/build/Release/hokkinjector-safe.exe
safe-windows/build/Release/sdgii23dmkf-safe.dll
```

Đặt hai file trong cùng một thư mục rồi chạy:

```powershell
.\hokkinjector-safe.exe
```

Chương trình sẽ nạp DLL vào chính nó, đọc chuỗi nhận dạng build, chạy self-test và thoát. Nó không tương tác với trò chơi hoặc tiến trình khác.

## Kiểm tra tự động

Workflow `build-safe-windows.yml` biên dịch x64, kiểm tra import bằng `dumpbin`, tạo SHA-256 và xuất hai binary dưới dạng artifact. Build sẽ thất bại nếu phát hiện API mạng, tạo tiến trình, hook, injection hoặc truy cập registry.

## Giới hạn

Không sử dụng EXE gốc để nạp DLL mới. Injector gốc vẫn là binary không đáng tin cậy và có thể gây khóa tài khoản hoặc thực hiện hành vi ngoài dự kiến. Bản thay thế này không chứa các tính năng cheat của DLL gốc.
