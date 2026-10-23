# CapNong Mobile

> Expo SDK 58 · React Native 0.88 · React 19 · TypeScript · Expo Router · NativeWind 4

Ứng dụng di động của CapNong – nền tảng giải cứu nông sản, cho **3 vai trò**: Khách Mua (buyer), Nhà Vườn (shop), Tài Xế (shipper). Admin tiếp tục dùng bản web (APRP-FE).

Tầng dữ liệu (`services`, `types`, `schemas`, `stores`) được chép từ APRP-FE và chỉnh cho React Native; giao diện viết lại bằng View/Text/TextInput/Pressable + NativeWind với hệ màu CapNong (`leaf-700 #326318`, `sun-300 #ffea79`).

## Chạy dự án

```bash
npm install
cp .env.example .env          # điền EXPO_PUBLIC_API_URL nếu không chạy BE ở localhost
npx expo start                # quét QR bằng Expo Go (bản mới nhất) hoặc nhấn a / i
```

| Lệnh | Việc |
| --- | --- |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm test` | Chạy Jest (schemas, stores, services) |
| `npx expo install <pkg>` | Cài thư viện native đúng phiên bản SDK (không dùng `npm install` cho thư viện native) |

**Kết nối backend:** `EXPO_PUBLIC_API_URL` phải có `/api` ở cuối, giống `VITE_API_URL` của web. Bỏ trống thì Android emulator dùng `http://10.0.2.2:8080/api`, iOS simulator dùng `http://localhost:8080/api`. Điện thoại thật cần IP LAN của máy chạy BE (vd. `http://192.168.1.10:8080/api`). Đổi `.env` xong phải khởi động lại `expo start`.

## Cấu trúc thư mục

```
src/
├── app/                      ← Expo Router: mỗi file là một màn hình
│   ├── _layout.tsx           ← Providers, nạp font, đọc phiên đăng nhập, chặn route theo vai trò
│   ├── index.tsx             ← Điều hướng theo vai trò
│   ├── (auth)/               ← login, register/{index,buyer,shop,shipper}, verify-otp, pending-approval
│   ├── buyer/                ← Khu vực Khách Mua
│   ├── shop/                 ← Khu vực Nhà Vườn
│   └── shipper/              ← Khu vực Tài Xế
├── components/ui/            ← AppText, Button, TextField, OtpInput, Banner, ChoiceChips, Screen
├── features/<feature>/       ← components, hooks (react-query), schemas (zod), constants, utils
├── services/                 ← API axios, chép từ APRP-FE (giữ tên hàm và endpoint)
├── stores/                   ← Zustand; persist qua SecureStore (auth) / AsyncStorage (giỏ hàng)
├── types/                    ← Kiểu dùng chung, chép từ APRP-FE
├── lib/                      ← authEvents, queryClient
├── mocks/                    ← Dữ liệu giả của web (bật bằng EXPO_PUBLIC_USE_MOCK=true)
├── theme/                    ← colors.ts (màu cho icon), fonts.ts (Be Vietnam Pro)
└── utils/                    ← env, constants, jwt, errors, helpers
```

Alias `@/` trỏ vào `src/`, giống web, nên import từ code web không phải sửa.

## Khác biệt so với APRP-FE

| Web | Mobile | Ghi chú |
| --- | --- | --- |
| `localStorage` | `expo-secure-store` (token, user) · AsyncStorage (giỏ hàng) | Bất đồng bộ: `useAuthStore.hasHydrated` báo đã đọc xong |
| `window.dispatchEvent('auth:unauthorized')` | `authEvents.emit('unauthorized')` | API trả 401 → tự đăng xuất |
| `import.meta.env.VITE_*` | `process.env.EXPO_PUBLIC_*` | Chỉ đọc trong `utils/env.ts` |
| `RequireRole.tsx` | `Stack.Protected` trong `app/_layout.tsx` | |
| `crypto.randomUUID` | `expo-crypto` | |
| `File` trong FormData | `{ uri, name, type }` (`types/upload.types.ts`) | |
| Ô "Email hoặc SĐT" | Chỉ "Email" (`mobileLoginSchema`) | `/auth/login` chỉ nhận email |
| 6 thẻ `<input>` OTP | 1 TextInput ẩn sau 6 ô | Hỗ trợ dán mã, tự điền OTP iOS/Android |

Không mang sang: `export.service.ts` (dùng DOM), CKEditor, Leaflet, recharts.

**Còn dùng API web, sẽ sửa khi làm tới:** `shipper.service.ts` (localStorage trạng thái online), `upload.service.ts`, `wallet.service.ts` (kiểu `File`).

## Tiến độ

- [x] **Giai đoạn 1 – Nền tảng & Auth:** Đăng nhập, Đăng ký 3 vai trò (Nhà Vườn 2 bước), OTP 6 số, Chờ duyệt, giữ phiên, đăng xuất khi 401
- [ ] Giai đoạn 2 – Khách Mua: khám phá nông sản, giỏ hàng, đặt hàng COD / PayOS (WebView), theo dõi đơn
- [ ] Giai đoạn 3 – Nhà Vườn: gian hàng, đăng bán sản phẩm, đơn hàng, voucher
- [ ] Giai đoạn 4 – Tài Xế + realtime: nhận cuốc, quét mã nhận hàng, bản đồ, STOMP WebSocket
- [ ] Quên mật khẩu, đăng nhập Google (cần OAuth Client ID cho iOS/Android)

Danh sách màn hình dự kiến cho từng vai trò nằm trong `legacy/README.md` (README của khung cũ).

## Mã lỗi backend được xử lý ở Auth

1001 trùng email · 1003 sai email/mật khẩu · 1017 trùng SĐT · 1022 chưa xác thực OTP (tự chuyển sang màn OTP) · 1025 chờ duyệt · 1026 bị khoá · 1032 trùng CCCD
