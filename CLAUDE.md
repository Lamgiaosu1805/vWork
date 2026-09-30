# vWork — CLAUDE.md

Tài liệu nội bộ cho AI assistant. Mô tả kiến trúc, quy ước code và các pattern quan trọng của project.

---

## Tổng quan

**vWork** là ứng dụng React Native (Expo) cho quản lý nội bộ doanh nghiệp, gồm 3 module chính:
- **Workplace** — quản lý công việc / báo cáo tuần
- **HRM** — nhân sự, chấm công, hồ sơ nhân viên
- **CRM** — khách hàng, hoa hồng, đầu tư, đại lý

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

Routing dùng **Expo Router** (file-based, thư mục `src/app/`, xem `app.json` →
`expo.extra.router.root`). **Screen viết thẳng trong file route ở `src/app/`** —
không có lớp "thin re-export" trỏ vào `features/<module>/screens/` nữa (đã bỏ hẳn
kiểu này, screen = route). Code nghiệp vụ dùng lại nhiều nơi (API, hook TanStack
Query, component con) mới tổ chức theo **feature-based** dưới `src/features/<module>/`.
Mỗi feature chỉ còn `{api, hooks, components, index.js}` (+ `lib/`/`theme/` tuỳ
module) — **không có `screens/`**.

CRM đang dùng giao diện mới (nguồn tham khảo: prototype AI-Studio
`vnfite-sales-&-ctv-mobile-crm`). Tab "Hỗ trợ" hiện là placeholder "đang phát triển"
(chưa có backend support-ticket), UI gọi điện vẫn dùng lại `OmikitFab`/Omicall cũ
(chưa redesign).

```
src/
├── app/                          # Expo Router — mỗi file = 1 route, chứa thẳng JSX + logic
│   ├── _layout.js                 # Root layout: providers (Redux, TanStack Query,
│   │                               GestureHandler, SafeArea, BottomSheet, Toast,
│   │                               Theme...) + Stack gốc
│   ├── index.js                    # Splash — check accessToken, resolveInitialRoute()
│   ├── login.js                    # Login — dùng hook features/auth
│   ├── notification.js, settings.js
│   └── (drawer)/
│       ├── _layout.js              # Drawer thật (expo-router/drawer), gating
│       │                           # has(user,"crm"), nhớ lastStack
│       ├── change-password.js      # Đổi mật khẩu — dùng chung mọi module, không thuộc riêng hrm
│       ├── workplace/              # Stack + (tabs): dashboard/feed/chat/
│       │                           # weekly-report/internal-files + các leaf route
│       ├── hrm/                    # Stack + (tabs): attendance/requests/profile/
│       │                           # expand + các leaf route
│       └── crm/                    # Stack + (tabs): trang-chu/khach-hang/ho-tro/
│                                    # hoa-hong + khach-hang-chi-tiet, yeu-cau-nhan-khach,
│                                    # dai-ly, dau-tu; mount OmikitFab + AiChatbotModal
├── features/                      # Tách theo NGHIỆP VỤ cụ thể, không gộp theo module
│   │                               # lớn (workplace/hrm/crm chỉ là tiền tố phân biệt tên,
│   │                               # không phải 1 feature ô dù) — mỗi feature chỉ
│   │                               # {api, hooks, components, index.js} (KHÔNG có screens/)
│   ├── auth/                       # login/splash/đổi mật khẩu (+ lib/resolveInitialRoute)
│   ├── attendance/                 # chấm công cá nhân (check-in/out)
│   ├── requests/                   # đơn từ HRM (nghỉ phép, duyệt đơn) — components/{approvalRequest,leaveRequest}
│   ├── workplace/                  # (chưa tách nhỏ tiếp — feed/chat/report/file... còn gộp)
│   ├── hrmEmployee/                 # Danh sách nhân viên
│   ├── hrmDepartment/                # Phòng ban + Chức vụ
│   ├── hrmBranch/                    # Chi nhánh
│   ├── hrmAttendanceAdmin/           # Cấu hình/tổng quan chấm công (khác attendance cá nhân)
│   ├── hrmDocument/                  # Tài liệu hồ sơ
│   ├── hrmPrint/                     # In tài liệu
│   ├── hrmProfile/                   # Hồ sơ cá nhân HRM
│   ├── hrmDashboard/                 # Dashboard HRM (BirthdayPanel...)
│   ├── crm/                        # SHELL only: theme/colors, CrmBottomTab, AiChatbotModal,
│   │                               # omicall/* — mount ở crm/_layout.js, KHÔNG chứa business logic
│   ├── crmDashboard/                 # Trang chủ CRM: dashboard điều hành, biểu đồ doanh số
│   ├── crmCustomer/                  # Khách hàng: list, chi tiết, assign/reassign
│   ├── crmCommission/                # Hoa hồng
│   ├── crmInvestment/                # Đầu tư (read-only)
│   ├── crmAgency/                    # Đại lý (read-only)
│   ├── crmLeadRequest/               # Yêu cầu nhận khách
│   └── crmTicket/                    # Hỗ trợ (placeholder, chưa có backend)
├── api/                            # CHỈ còn API dùng chung toàn app
│   └── axiosInstance.js            # Axios singleton, interceptor auth + refresh
├── components/                     # Component dùng chung toàn app
│   ├── CustomDrawerContent.js, Header.js, PostCard.js, DrawerBridge.js,
│   └── BottomSheet.js              # Bottom sheet reanimated dùng chung (workplace/chat + trước đây CRM)
├── helpers/
│   ├── utils.js                    # BASE_URL, format date/time/file
│   ├── permissions.js              # has(), canMgr() — phân quyền frontend, dùng chung mọi module
│   ├── navigationRef.js            # openDrawer() từ ngoài navigator (qua DrawerBridge)
│   └── layout.js                   # HEIGHT_SHEET (Dimensions.get("screen").height) dùng chung
├── hooks/                          # CHỈ còn hook dùng chung toàn app
│   └── useUser.js, useDailyAppRestart.js, useGetImageMessage.js...
├── navigators/                     # CHỈ còn CustomBottomTab dùng chung + tabConfig
│   └── bottomtabs/CustomBottomTab.js, tabConfig.js
└── redux/
    ├── store.js
    └── slice/{authSlice.js, chatSlice.js}    # State dùng chung toàn app, KHÔNG nằm trong features/auth
```

`authSlice.js` và `permissions.js` cố ý **không** nằm trong `features/auth/` dù
liên quan tới auth — vì cả 2 đang được import trực tiếp bởi hàng chục file trên
khắp workplace/hrm/crm (đọc `state.auth.user`/`accessToken`, check `canMgr(user,
"<module>")` cho quyền của chính module đó). Coi như hạ tầng dùng chung, cùng
nhóm với `redux/store.js`/`api/axiosInstance.js`, không phải logic riêng của màn
login.

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

### Hệ thống permission mới — `src/features/permission/`

Song song với `role`/`module_access`/`dept_scope` ở trên (hệ cũ, vẫn dùng cho các
check `has()`/`canMgr()`/`can()`/`canAny()` trong bảng dưới), có **hệ permission
mới, cấp quyền chi tiết hơn** — BE cấp qua CASL (`core/authorization/require-
permission.middleware`), **không tự bypass `role === "admin"`** (khác hệ cũ).
FE lấy qua `GET /permissions/me` → `useMyPermissions()` (`src/features/permission/
hooks/useMyPermissions.js`, TanStack Query, `queryKey: ["my-effective-permissions"]`)
→ `{ permissions, canAny, isLoading }`. Đây là bản port 1:1 từ `website-crm`'s
`features/permission/` (cùng tên hook, cùng field, cùng rule không bypass admin).

Dùng để ẩn/hiện **tab module trong drawer** (Workplace/HRM/CRM) — khớp cách
`website-crm`'s `Header.jsx` module-switcher check — và các **feature con** bên
trong CRM cần quyền CASL riêng (ví dụ Đại lý cần `agent.view`, Quản lý Đầu tư cần
`investment.view`/`investment.leaderboard`). Các nhóm quyền module-level/feature-
level định nghĩa sẵn trong `src/features/permission/constants.js`
(`CRM_ACCESS_PERMISSIONS`, `HRM_ACCESS_PERMISSIONS`, `CRM_AGENT_PERMISSIONS`,
`CRM_INVESTMENT_PERMISSIONS`).

Ở Splash (`app/index.js`) và Login (`app/login.js`), do chạy trong hàm async
(không phải component render nên không gọi hook được), gọi trực tiếp
`permissionApi.getMyPermissions()` rồi `queryClient.setQueryData(["my-effective-
permissions"], ...)` để warm cache TanStack Query trước khi `router.replace()` —
tránh Drawer bị flash "ẩn hết tab" do `useMyPermissions()` phải fetch lại từ đầu
lúc mount.

### Quy tắc hiển thị theo module

| Tính năng | Điều kiện |
|-----------|-----------|
| Tab Workplace trong drawer | Luôn hiện |
| Tab HRM trong drawer | `canAny(HRM_ACCESS_PERMISSIONS)` (hệ permission mới, xem trên) |
| Tab CRM trong drawer + navigator | `canAny(CRM_ACCESS_PERMISSIONS)` (hệ permission mới, xem trên) |
| Thêm/sửa nhân viên | `canMgr(user, "hrm")` |
| Xem danh sách nhân viên, phòng ban | `has(user, "hrm")` |
| Báo cáo tuần tất cả phòng ban | `canMgr(user, "workplace")` |
| Nộp báo cáo phòng mình | Luôn cho phép |
| Xem "Tất cả khách hàng" + gán/chuyển sale (tab Khách hàng) | `canMgr(user, "crm")` |
| Duyệt/từ chối/thu hồi yêu cầu nhận khách | `canMgr(user, "crm")` (thu hồi cần thêm `role === "admin"`) |
| Dashboard điều hành CRM (Trang chủ) | `canMgr(user, "crm")` |

### API gán quyền (admin)

```
PATCH /auth/set-permission/:accountId
Authorization: Bearer <admin_token>
Body: { role, module_access, dept_scope }
```

---

## Auth Flow

Logic dùng lại (hook, API, resolve route) nằm trong `src/features/auth/`
(`useLogin`, `useFetchUserInfoWithToken`, `useChangeFirstPassword`,
`useChangePassword`, `resolveInitialRoute`) — screen (`app/index.js`,
`app/login.js`, `app/(drawer)/change-password.js`) chỉ gọi hook, không tự
`api.post/get` trực tiếp (trừ `useFetchUserInfoWithToken` cần nhận token tường
minh vì gọi trước khi token kịp vào Redux — xem `authApi.getUserInfoWithToken`).

```
SplashScreen (app/index.js)
  └─ AsyncStorage có accessToken?
       ├─ Có → useFetchUserInfoWithToken(accessToken) → setCredentials
       │        → resolveInitialRoute() → router.replace("/workplace" | "/hrm" | "/crm")
       └─ Không → router.replace("/login")

LoginScreen (app/login.js)
  └─ useLogin({username, password})
       ├─ isFirstLogin: true → ChangeFirstPasswordModal (useChangeFirstPassword)
       └─ false → useFetchUserInfoWithToken(accessToken) → setCredentials
                → resolveInitialRoute() → router.replace("/workplace" | "/hrm" | "/crm")

Token hết hạn (401 TOKEN_EXPIRED)
  └─ axiosInstance tự POST /auth/refreshToken
       ├─ OK → cập nhật token Redux + AsyncStorage → retry request gốc
       └─ Lỗi → logoutUser() + xóa AsyncStorage → router.replace("/login")
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

Dùng **Expo Router** (file-based, xem thư mục `src/app/`). Cấu trúc tương đương:

```
app/_layout.js (Stack gốc)
  ├─ index.js (Splash)
  ├─ login.js
  ├─ notification.js
  ├─ settings.js
  └─ (drawer)/_layout.js (Drawer thật, gating has(user,"crm"))
       ├─ change-password.js (dùng chung mọi module)
       ├─ workplace/_layout.js (Stack)
       │    └─ (tabs)/_layout.js: dashboard/feed/chat/weekly-report/internal-files
       │    + file-viewer, comment, compose-post, announcements, profile,
       │      chat-room, chat-settings, chat-members
       ├─ hrm/_layout.js (Stack)
       │    └─ (tabs)/_layout.js: attendance/requests/profile/expand
       │    + document-info, document-detail, show-file, department, branch,
       │      print, attendance-config, attendance-overview, employee-list,
       │      add-request, approval-request, attendance-detail
       └─ crm/_layout.js (Stack, chỉ hiện khi has(user, "crm"))
            └─ (tabs)/_layout.js: trang-chu/khach-hang/ho-tro/hoa-hong
            + khach-hang-chi-tiet, yeu-cau-nhan-khach, dai-ly, dau-tu
```

- Điều hướng dùng `router` từ `expo-router`: `router.push("/hrm/employee-list")`,
  `router.replace(...)`, `router.back()`. Không dùng `navigation.navigate()` ở
  bất kỳ module nào nữa.
- Đọc tham số route bằng `useLocalSearchParams()` thay cho `route.params`. Expo
  Router chỉ truyền được **string** qua URL — muốn truyền nguyên object
  (`post`, `conversation`...) phải `JSON.stringify` lúc `router.push()` và
  `JSON.parse` lúc đọc lại ở màn đích.
- Screen viết thẳng trong file route (JSX + logic UI thật nằm trong
  `src/app/(drawer)/<module>/...`), import hook/component từ
  `src/features/<module>/`. Không có file "thin re-export" nào cả.

### Lưu module cuối cùng

Module đang xem được lưu vào `AsyncStorage("lastStack")` với giá trị `"workplace"` |
`"hrm"` | `"crm"`. Logic resolve (đọc AsyncStorage + fallback nếu không còn quyền
CRM) nằm ở `src/features/auth/lib/resolveInitialRoute.js`, được gọi từ
`app/index.js` (Splash) và `app/login.js` (Login) để biết `router.replace()` vào
đâu.

### Mở drawer từ màn hình bất kỳ

```js
import { openDrawer } from "../../helpers/navigationRef";
openDrawer();
```

Cơ chế: mỗi route gốc của 1 module (`workplace/_layout.js`, `hrm/_layout.js`,
`crm/_layout.js`) mount `<DrawerBridge />` (`src/components/DrawerBridge.js`) —
component này lấy `navigation` thật của Drawer qua `useNavigation()` rồi đăng ký
vào `navigationRef.js`, để `openDrawer()` gọi được từ bất kỳ đâu.

---

## Quy ước code

### Tạo màn hình mới

1. Tạo file route trong `src/app/(drawer)/<module>/` (hoặc `(tabs)/` nếu là tab)
   — viết thẳng JSX + logic UI trong file này, không tạo file "screen" riêng ở
   `features/`.
2. API/hook/component dùng lại thì đặt trong feature **đúng theo nghiệp vụ cụ
   thể** (`src/features/<nghiệpVụ>/{api,hooks,components}/`), không dồn vào 1
   feature ô dù theo tên module lớn (`hrm`/`crm`) — ví dụ màn "Chi nhánh" của
   HRM đặt trong `features/hrmBranch/`, không phải `features/hrm/`. Xem cây thư
   mục ở trên để biết feature nào đã có sẵn trước khi tạo mới.
3. Điều hướng tới bằng `router.push("/<module>/...")`, không dùng tên screen như
   React Navigation cũ.

### Gọi API

- Đặt API thuần trong `src/features/<feature>/api/` (object-of-methods,
  `api.get/post/patch/delete(..., {requiresAuth:true})`), hook TanStack Query
  (1 hook / 1 API call) trong `src/features/<feature>/hooks/`. Feature khác
  muốn dùng thì import qua `index.js` (public API) của feature đó, không import
  thẳng vào `hooks/`/`api/` bên trong feature khác (ví dụ `crmDashboard`/
  `crmCustomer` đang tái dùng `useBranches` từ `hrmBranch` qua barrel).
- Component chỉ gọi hook, không tự `api.get(...)` trực tiếp — áp dụng cho mọi
  feature.

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

### Tên file từ URI — luôn decode

`expo-image-picker` và nhiều API native trả về URI có tên file bị URL-encode (`%20` thay khoảng trắng, `%C3%A9` thay ký tự có dấu...). Luôn decode trước khi hiển thị hoặc gửi lên server:

```js
// Hiển thị
decodeURIComponent(file.originalName ?? '')

// Lấy tên từ URI khi pick ảnh
name: decodeURIComponent(a.fileName ?? a.uri.split('/').pop())
```

Áp dụng cho mọi chỗ render tên file và mọi chỗ tạo object file từ `ImagePicker.launchImageLibraryAsync`.

---

## Thư viện đáng chú ý

| Thư viện | Dùng cho |
|----------|----------|
| `react-native-reanimated` | Animation slide-up bottom sheet (`src/components/BottomSheet.js`, cũ) |
| `@gorhom/bottom-sheet` | Bottom sheet chuẩn cho tính năng mới (`BottomSheetModal`, provider mount ở root layout) |
| `react-native-gesture-handler` | Gesture hỗ trợ drawer + swipe |
| `react-native-element-dropdown` | Dropdown filter |
| `react-native-gifted-charts` | Biểu đồ dashboard CRM (bar/pie) |
| `react-native-pdf` | Xem tài liệu PDF |
| `react-native-qrcode-svg` | QR code sale |
| `expo-image-picker` + `expo-image-manipulator` | Upload avatar (resize 400×400) |
| `expo-location` | Lấy vị trí GPS cho check-in |
| `react-native-wifi-reborn` | Lấy tên WiFi cho check-in |
| `react-native-toast-message` | Toast thông báo toàn app |
| `dayjs` | Xử lý ngày giờ (locale vi) |
