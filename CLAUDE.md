# vWork — CLAUDE.md

Tài liệu nội bộ cho AI assistant. Mô tả kiến trúc, quy ước code và các pattern quan trọng của project.

---

## Tổng quan

**vWork** là ứng dụng React Native (Expo) cho quản lý nội bộ doanh nghiệp, gồm 3 module chính:
- **Workplace** — quản lý công việc / báo cáo tuần
- **HRM** — nhân sự, chấm công, hồ sơ nhân viên
- **CRM** — khách hàng, KPI, hoa hồng đại lý

Tên package: `vnfite-vwork` | API production: `https://vWork.vnfite.com.vn`

---

## Lệnh thường dùng

```bash
npx expo start          # khởi động Metro bundler
expo run:android        # build + chạy Android
expo run:ios            # build + chạy iOS
```

Không có bước build riêng hay test runner — kiểm tra bằng thiết bị/emulator.

---

## Cấu trúc thư mục

```
src/
├── api/
│   ├── axiosInstance.js      # Axios singleton, interceptor auth + refresh
│   ├── attendanceApi.js      # API chấm công
│   └── crm/                  # API CRM
├── components/
│   ├── CustomDrawerContent.js
│   ├── CustomAlertProvider.js
│   ├── Header.js
│   └── crm/                  # Component CRM (CustomerCard, BottomSheet…)
├── helpers/
│   ├── utils.js              # BASE_URL, format date/time/file
│   ├── permissions.js        # has(), canMgr() — phân quyền frontend
│   └── navigationRef.js      # openDrawer() từ ngoài navigator
├── hooks/
│   └── crm/useCustomer.js    # Custom hook gọi API khách hàng
├── navigators/
│   ├── RootStackNavigator.js
│   ├── RootDrawerNavigator.js
│   ├── stack/                # HRMStackNavigator, CRMStackNavigator, WorkPlaceStackNavigator
│   └── bottomtabs/           # HRMBottomTab, CRMBottomTab, WorkPlaceBottomTab
├── redux/
│   ├── store.js
│   └── slice/
│       ├── authSlice.js      # user, accessToken, refreshToken
│       └── attendanceSlice.js
├── screens/
│   ├── LoginScreen.js
│   ├── SplashScreen.js
│   ├── hrm/
│   ├── crm/
│   └── workplace/
└── mock/
```

---

## State Management — Redux

### authSlice (`state.auth`)

```js
{
  user: {
    user_id, full_name, ma_nv, phone_number, avatar,
    departments[0].position.position_name,
    departments[0].department.department_name,
    leave_balance: { annual },
    // Phân quyền (từ API /user/getUserInfo):
    role: "admin" | "manager" | "user",
    module_access: ["hrm", "workplace", "crm"],
    dept_scope: "all" | "own"
  },
  accessToken: string | null,
  refreshToken: string | null
}
```

### attendanceSlice (`state.attendance`)

```js
{ currentWorkSheet, lichCong }
```

### Quy tắc dùng Redux

- **Trong component**: luôn dùng `useSelector` — không đọc `store.getState()` trong component.
- **Ngoài component** (interceptor, helper): dùng `store.getState()` hoặc `store.dispatch()` trực tiếp.

---

## Hệ thống phân quyền

### 3 field trên `user` (từ API sau login)

| Field | Giá trị |
|-------|---------|
| `role` | `"admin"` \| `"manager"` \| `"user"` |
| `module_access` | `["hrm", "workplace", "crm"]` — mảng, có thể rỗng |
| `dept_scope` | `"all"` \| `"own"` |

### Helper — `src/helpers/permissions.js`

```js
import { has, canMgr } from "../helpers/permissions";

has(user, "crm")       // xem module: admin luôn được, còn lại cần có trong module_access
canMgr(user, "crm")    // quản lý: admin hoặc manager + có module đó
```

### Quy tắc hiển thị theo module

| Tính năng | Điều kiện |
|-----------|-----------|
| Tab Workplace trong drawer | Luôn hiện |
| Tab HRM trong drawer | Luôn hiện |
| Tab CRM trong drawer + navigator | `has(user, "crm")` |
| Thêm/sửa nhân viên | `canMgr(user, "hrm")` |
| Xem danh sách nhân viên, phòng ban | `has(user, "hrm")` |
| Báo cáo tuần tất cả phòng ban | `canMgr(user, "workplace")` |
| Nộp báo cáo phòng mình | Luôn cho phép |
| Thêm khách hàng | `canMgr(user, "crm")` |
| Section quản trị CRM (ExpandCRM) | `canMgr(user, "crm")` |

### API gán quyền (admin)

```
PATCH /auth/set-permission/:accountId
Authorization: Bearer <admin_token>
Body: { role, module_access, dept_scope }
```

---

## Auth Flow

```
SplashScreen
  └─ AsyncStorage có accessToken?
       ├─ Có → GET /user/getUserInfo → setCredentials → RootDrawer
       └─ Không → LoginScreen

LoginScreen
  └─ POST /auth/login
       ├─ isFirstLogin: true → ChangeFirstPasswordModal
       └─ false → GET /user/getUserInfo → setCredentials → RootDrawer

Token hết hạn (401 TOKEN_EXPIRED)
  └─ axiosInstance tự POST /auth/refreshToken
       ├─ OK → cập nhật token Redux + AsyncStorage → retry request gốc
       └─ Lỗi → logoutUser() + xóa AsyncStorage → LoginScreen
```

---

## API — axiosInstance

**File**: `src/api/axiosInstance.js`

Mọi request đều dùng singleton `api` import từ file này:

```js
import api from "../api/axiosInstance";

// GET có auth
const res = await api.get("/endpoint", { requiresAuth: true });

// POST có auth
const res = await api.post("/endpoint", body, { requiresAuth: true });
```

- Thêm `requiresAuth: true` để interceptor tự gắn `Authorization: Bearer`.
- Không cần truyền token thủ công trừ một số trường hợp đặc biệt trong LoginScreen.
- Header `x-request-id` được thêm tự động vào mọi request.

### Chuyển môi trường API

Trong `src/helpers/utils.js`:

```js
const BASE_URL = apiLive;  // hoặc apiTest để test
```

---

## Navigation

### Cấu trúc 3 tầng

```
RootStackNavigator
  ├─ SplashScreen
  ├─ LoginScreen
  └─ RootDrawer (RootDrawerNavigator)
       ├─ WorkPlaceStackNavigator
       │    └─ WorkPlaceBottomTab (Dashboard, Tasks, Profile)
       ├─ HRMStackNavigator
       │    └─ HRMBottomTab (HRM, Chấm công, Yêu cầu, Hồ sơ, Mở rộng)
       │    + DocumentInfoScreen, DocumentUserDetailScreen, ShowFileScreen
       └─ CRMStackNavigator  ← chỉ đăng ký khi has(user, "crm")
            └─ CRMBottomTab (Home, Khách hàng, KPI, Hoa hồng, Mở rộng)
            + ListAgentScreen
```

### Lưu module cuối cùng

Module đang xem được lưu vào `AsyncStorage("lastStack")` và restore khi mở lại app. Nếu `lastStack` là `CRMStackNavigator` nhưng user không có quyền CRM, tự fallback về `WorkPlaceStackNavigator`.

### Mở drawer từ màn hình bất kỳ

```js
import { openDrawer } from "../../helpers/navigationRef";
openDrawer();
```

---

## Quy ước code

### Tạo màn hình mới

1. Tạo file trong `src/screens/<module>/`.
2. Đăng ký vào Stack tương ứng trong `src/navigators/stack/`.
3. Nếu là tab mới: thêm vào `src/navigators/bottomtabs/`.

### Gọi API

- Tạo hook trong `src/hooks/<module>/` nếu logic gọi API phức tạp hoặc tái dùng nhiều nơi.
- Đặt hàm gọi API thuần trong `src/api/<module>/` nếu không cần local state.

### Xử lý ngày/giờ

Dùng `dayjs` với locale `vi`:

```js
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");
```

Format chuẩn qua `src/helpers/utils.js`: `formatDate()`, `formatTime()`.

### Không dùng comment giải thích WHAT

Chỉ comment khi WHY không rõ ràng (ràng buộc ẩn, workaround, bất biến tinh tế).

---

## Thư viện đáng chú ý

| Thư viện | Dùng cho |
|----------|----------|
| `react-native-reanimated` | Animation slide-up bottom sheet |
| `react-native-gesture-handler` | Gesture hỗ trợ drawer + swipe |
| `react-native-element-dropdown` | Dropdown filter |
| `react-native-gifted-charts` | Biểu đồ KPI |
| `react-native-pdf` | Xem tài liệu PDF |
| `react-native-qrcode-svg` | QR code sale |
| `expo-image-picker` + `expo-image-manipulator` | Upload avatar (resize 400×400) |
| `expo-location` | Lấy vị trí GPS cho check-in |
| `react-native-wifi-reborn` | Lấy tên WiFi cho check-in |
| `react-native-toast-message` | Toast thông báo toàn app |
| `dayjs` | Xử lý ngày giờ (locale vi) |
