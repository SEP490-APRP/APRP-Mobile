# CapNong Mobile — APP

> Expo ~51 · React Native 0.74.5 · NativeWind v2 · JavaScript

Ứng dụng mobile cho hệ thống CapNong gồm **3 vai trò**: Buyer (người mua), Shop Owner (nhà vườn/nhà bán), Shipper (người giao hàng).

---

## Cấu trúc thư mục `src/`

```
src/
├── screens/          ← Màn hình theo vai trò
│   ├── auth/         ← Màn hình xác thực (dùng chung 3 role)
│   ├── buyer/        ← Màn hình dành cho người mua
│   ├── shopOwner/    ← Màn hình dành cho nhà vườn / nhà bán
│   │   ├── tabs/     ← Tab chính của Shop Owner
│   │   └── pages/    ← Các trang con của Shop Owner
│   ├── shipper/      ← Màn hình dành cho shipper
│   │   ├── tabs/     ← Tab chính của Shipper
│   │   └── pages/    ← Các trang con của Shipper
│   └── shared/       ← Màn hình dùng chung (chat, chatbot)
├── components/       ← Reusable UI components
│   ├── cart/         ← Components liên quan đến giỏ hàng
│   ├── layout/       ← Layout / navigation bars
│   ├── order/        ← Components liên quan đến đơn hàng
│   ├── payment/      ← Components liên quan đến thanh toán
│   ├── shared/       ← Shared components (cards, modals, maps)
│   ├── ui/           ← Primitive UI elements (Button, Badge, Toast…)
│   └── common/       ← Base primitives (AppButton, AppText…)
├── navigation/       ← React Navigation (AppNavigator.jsx)
├── services/         ← Tất cả API calls theo domain
├── contexts/         ← React Contexts (ChatBotContext)
├── hooks/            ← Custom hooks
├── utils/            ← Utility / helper functions
├── constants/        ← App-wide constants (colors, theme, status enums)
├── config/           ← Environment config (env.js)
├── types/            ← Shared type definitions
└── assets/           ← fonts, icons, images
```

---

## Danh sách màn hình (Screens)

> **Quy tắc đặt tên:**
> - Tên file/component: **tiếng Anh**, PascalCase
> - Text hiển thị trên UI: **tiếng Việt**
> - Route name trong Navigator: cũng tiếng Anh (xem `AppNavigator.jsx`)

---

### 🔐 Auth — `screens/auth/`

| File | Route | Mô tả |
|---|---|---|
| `SplashScreen.jsx` | `Splash` | Màn hình khởi động, kiểm tra phiên đăng nhập |
| `LoginScreen.jsx` | `Login` | Đăng nhập bằng email/password |
| `RegisterScreen.jsx` | `Register` | Đăng ký tài khoản mới |
| `ForgotPasswordScreen.jsx` | `ForgotPassword` | Quên mật khẩu, gửi OTP |
| `OAuthRegisterScreen.jsx` | `OAuthRegister` | Hoàn thiện hồ sơ sau đăng nhập Google |

---

### 🛍️ Buyer — `screens/buyer/`

| File | Route | Mô tả |
|---|---|---|
| `HomeScreen.jsx` | `Home` | Trang chủ — banner, sản phẩm nổi bật, danh mục |
| `ProductsScreen.jsx` | `Products` | Danh sách sản phẩm, lọc/tìm kiếm |
| `ProductDetailScreen.jsx` | `ProductDetail` | Chi tiết sản phẩm + thêm vào giỏ |
| `CartScreen.jsx` | `Cart` | Giỏ hàng |
| `CheckoutScreen.jsx` | `Checkout` | Thanh toán — địa chỉ, phương thức, voucher |
| `OrderHistoryScreen.jsx` | `OrderHistory` | Lịch sử đơn hàng (theo tab trạng thái) |
| `OrderDetailScreen.jsx` | `OrderDetail` | Chi tiết một đơn hàng |
| `OrderTrackingScreen.jsx` | `OrderTracking` | Theo dõi đơn hàng đang giao (map) |
| `PaymentResultScreen.jsx` | `PaymentResult` | Kết quả thanh toán (thành công / thất bại) |
| `PayOSWebViewScreen.jsx` | `PayOSWebView` | WebView cổng thanh toán PayOS |
| `CodSuccessScreen.jsx` | `CodSuccess` | Xác nhận đặt hàng COD thành công |
| `AccountScreen.jsx` | `Account` | Trang tài khoản cá nhân |
| `ProfileEditScreen.jsx` | `ProfileEdit` | Chỉnh sửa thông tin cá nhân |
| `ShopInfoScreen.jsx` | `ShopInfo` | Trang thông tin shop (xem từ buyer) |
| `ShopVouchersScreen.jsx` | `ShopVouchers` | Voucher của shop (xem từ buyer) |
| `VoucherWalletScreen.jsx` | `VoucherWallet` | Ví voucher của buyer |
| `BuyerWalletScreen.jsx` | `BuyerWallet` | Ví tiền của buyer |
| `NewsScreen.jsx` | `News` | Tin tức / bài viết nông nghiệp |
| `NewsDetailScreen.jsx` | `NewsDetail` | Chi tiết bài viết |
| `MysteryBoxListScreen.jsx` | `MysteryBoxList` | Danh sách túi mù |
| `MysteryBoxDetailScreen.jsx` | `MysteryBoxDetail` | Chi tiết túi mù |

---

### 💬 Shared — `screens/shared/`

| File | Route | Mô tả |
|---|---|---|
| `ChatInboxScreen.jsx` | `ChatInbox` | Danh sách hộp thư chat (dùng chung) |
| `ChatDetailScreen.jsx` | `ChatDetail` | Cuộc trò chuyện cụ thể |
| `ChatBotScreen.jsx` | `ChatBot` | Chat với AI Chatbot hỗ trợ |

---

### 🏪 Shop Owner — `screens/shopOwner/`

#### Tabs (Bottom Navigation)

| File | Mô tả |
|---|---|
| `tabs/OrderTab.jsx` | Quản lý đơn hàng (chờ xác nhận, đang xử lý, hoàn thành) |
| `tabs/NotificationTab.jsx` | Thông báo hệ thống của shop |
| `tabs/ManageTab.jsx` | Quản lý chung — truy cập profile, ví, voucher, đánh giá |

#### Pages

| File | Route | Mô tả |
|---|---|---|
| `pages/DashboardScreen.jsx` | `ShopOwnerDashboard` | Tổng quan — doanh thu, đơn hàng, thống kê |
| `pages/ProductListScreen.jsx` | `ShopOwnerProductList` | Danh sách sản phẩm của shop |
| `pages/AddProductScreen.jsx` | `ShopOwnerAddProduct` | Thêm sản phẩm mới |
| `pages/EditProductScreen.jsx` | `ShopOwnerEditProduct` | Chỉnh sửa sản phẩm |
| `pages/AddMysteryBoxScreen.jsx` | `ShopOwnerAddMysteryBox` | Tạo túi mù mới |
| `pages/ProfileScreen.jsx` | `ShopOwnerProfile` | Hồ sơ cá nhân shop owner |
| `pages/EditProfileScreen.jsx` | `ShopOwnerEditProfile` | Chỉnh sửa hồ sơ |
| `pages/WalletScreen.jsx` | `ShopOwnerWallet` | Ví tiền — số dư, giao dịch, rút tiền |
| `pages/VoucherScreen.jsx` | `ShopOwnerVoucher` | Quản lý voucher của shop |
| `pages/ReviewScreen.jsx` | `ShopOwnerReview` | Đánh giá từ khách hàng |
| `pages/ChatAdminScreen.jsx` | `ShopOwnerChatAdmin` | Chat với admin hệ thống |
| `pages/CustomerChatScreen.jsx` | `ShopOwnerCustomerChat` | Chat với khách hàng cụ thể |

---

### 🚚 Shipper — `screens/shipper/`

#### Tabs (Bottom Navigation)

| File | Mô tả |
|---|---|
| `tabs/NewOrderTab.jsx` | Đơn hàng mới — chấp nhận hoặc từ chối nhận giao |
| `tabs/DeliveringTab.jsx` | Đang giao — danh sách đơn đang thực hiện + bản đồ |
| `tabs/NotificationTab.jsx` | Thông báo hệ thống của shipper |
| `tabs/PersonalTab.jsx` | Cá nhân — truy cập profile, ví, thu nhập, xác minh |

#### Pages

| File | Route | Mô tả |
|---|---|---|
| `ShipperDeliveryMapScreen.jsx` | `ShipperDeliveryMap` | Bản đồ giao hàng thực tế (VietMap) |
| `pages/ProfileScreen.jsx` | `ShipperProfile` | Hồ sơ cá nhân shipper |
| `pages/SettingsScreen.jsx` | `ShipperSettings` | Cài đặt ứng dụng |
| `pages/EarningsScreen.jsx` | `ShipperEarnings` | Thu nhập — lịch sử theo ngày/tuần/tháng |
| `pages/WalletScreen.jsx` | `ShipperWallet` | Ví shipper — số dư, rút tiền |
| `pages/VerificationScreen.jsx` | `ShipperVerification` | Xác minh danh tính, CCCD, phương tiện |

---

## Services — `src/services/`

| File | Domain | Các method chính |
|---|---|---|
| `auth.service.js` | Xác thực | login, register, logout, refreshToken, googleLogin, sendOtp, verifyOtp, resetPassword |
| `user.service.js` | Người dùng | getProfile, updateProfile, changePassword, uploadAvatar |
| `product.service.js` | Sản phẩm | getProducts, getProductById, searchProducts, getMerchantProducts, createProduct, updateProduct, deleteProduct |
| `order.service.js` | Đơn hàng | getOrders, getOrderById, createOrder, cancelOrder, trackOrder |
| `cart.service.js` | Giỏ hàng | getCart, addItem, removeItem, updateQuantity, clearCart |
| `payment.service.js` | Thanh toán | createPayOSPayment, verifyCOD, getPaymentStatus |
| `voucher.service.js` | Voucher | getVouchers, applyVoucher, getMerchantVouchers, createVoucher, deleteVoucher |
| `wallet.service.js` | Ví buyer/shopOwner | getWalletBalance, getTransactions, topUp, withdraw |
| `wallet.shipper.service.js` | Ví shipper | getShipperWallet, getShipperTransactions, requestWithdraw |
| `shipper.service.js` | Shipper | getShipperProfile, updateLocation, getAssignedOrders, acceptOrder, completeDelivery |
| `review.service.js` | Đánh giá | getProductReviews, createReview, getMerchantReviews |
| `mysteryBox.service.js` | Túi mù | getMysteryBoxes, getMysteryBoxById, purchaseMysteryBox |
| `notification.service.js` | Thông báo | getNotifications, markAsRead, registerPushToken |
| `chat.service.js` | Chat | getChatInbox, getChatMessages, sendMessage, markAsRead |
| `chatbot.service.js` | AI Chatbot | sendMessage, getHistory |
| `blog.service.js` | Tin tức | getBlogs, getBlogById |
| `category.service.js` | Danh mục | getCategories, getCategoryById |
| `export.service.js` | Xuất báo cáo | exportOrders, exportRevenue |
| `vehicle.service.js` | Phương tiện | getVehicles, addVehicle, deleteVehicle |

---

## Constants — `src/constants/`

| File | Mô tả |
|---|---|
| `colors.js` | Màu sắc cơ bản |
| `dimensions.js` | Kích thước màn hình |
| `theme.js` | Design tokens — colors, spacing, borderRadius, fontSize |
| `orderStatus.js` | Enum + label + màu trạng thái đơn hàng |
| `productStatus.js` | Enum + label trạng thái sản phẩm |
| `banks.js` | Danh sách ngân hàng Việt Nam (bin code) |

---

## Utils — `src/utils/`

| File | Mô tả |
|---|---|
| `formatters.js` | Format tiền (VNĐ), ngày giờ |
| `alert.js` | Wrapper cho Alert — showAlert, showConfirm, showError, showSuccess |
| `toast.js` | Wrapper toast — showToast, showSuccessToast, showErrorToast |
| `errorTranslate.js` | Map API error → thông báo tiếng Việt |
| `imageUrl.js` | Build URL ảnh từ path tương đối |
| `pendingPayOSPayment.js` | Lưu/đọc PayOS payment chưa hoàn thành (AsyncStorage) |
| `resumePayOSPayment.js` | Resume PayOS payment bị gián đoạn |
| `pickEvidenceImage.js` | Chọn ảnh từ thư viện / camera (bằng chứng giao hàng) |
| `groupOrdersByBatch.js` | Nhóm đơn hàng theo batch checkout |
| `reverseGeocode.js` | Toạ độ → địa chỉ chuỗi (VietMap) |
| `routeNavigation.js` | Tính route / khoảng cách giao hàng |
| `vietmap.js` | VietMap SDK helpers (API key, place search) |
| `chatbotMessageUtils.js` | Format tin nhắn chatbot |

---

## Components chú ý

| Component | Mô tả |
|---|---|
| `shared/DeliveryRouteMap.jsx` | Bản đồ route giao hàng thời gian thực (VietMap) — dùng trong ShipperDeliveryMapScreen & OrderTrackingScreen |
| `shared/DisputeDecisionModal.jsx` | Modal xử lý tranh chấp buyer (chấp nhận / từ chối hàng) |
| `shared/OnboardingTour.jsx` | Tour hướng dẫn sử dụng lần đầu |
| `payment/PendingPayOSBanner.jsx` | Banner cảnh báo còn thanh toán PayOS dang dở |
| `payment/ResumePaymentModal.jsx` | Modal tiếp tục thanh toán dang dở |
| `ui/Toggle.jsx` | Switch on/off dùng Reanimated |
| `ui/PasswordInput.jsx` | Input mật khẩu với nút ẩn/hiện |

---

## Flow hoạt động

```
Buyer  ────────────────────────────────────────────────► Đặt hàng
           │
           ▼
Shop Owner ─── Xác nhận đơn ──► Chuẩn bị hàng ──► Sẵn sàng giao
                                                       │
                                                       ▼
Shipper ──── Nhận đơn (NewOrderTab) ──► Lấy hàng tại shop ──► Giao cho buyer
```

> **Không có tính năng ghép đơn / chuyến đi (đã loại bỏ)**. Shipper lấy hàng trực tiếp từ shop và giao đến buyer.

---

## Cách thêm màn hình mới

1. Tạo file `.jsx` đúng folder (`screens/<role>/pages/` hoặc `screens/<role>/tabs/`)
2. Đặt tên file theo tiếng Anh, suffix `Screen` hoặc `Tab`
3. Uncomment import + `<Stack.Screen>` tương ứng trong `AppNavigator.jsx`
4. Nếu cần service mới: thêm vào `services/<domain>.service.js` và export trong `services/index.js`

---

## Chạy dự án

```bash
cd APP
npm install
npx expo start
```
