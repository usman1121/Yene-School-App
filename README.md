# SMS Mobile (School Management System)

A cross-platform mobile application built with **React Native (Expo SDK 54)** for school management. Supports **7 role-based dashboards**: Super Admin, Admin, Teacher, Student, Parent, Registrar, and Finance.

## Tech Stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Framework          | React Native 0.81 + Expo SDK ~54       |
| Routing            | Expo Router 6 (file-based routing)      |
| Language           | TypeScript ~5.9                         |
| HTTP Client        | Axios 1.7                               |
| Auth Storage       | expo-secure-store                       |
| Icons              | @expo/vector-icons (Ionicons)           |
| Animations         | react-native-reanimated ~4.1            |
| Gestures           | react-native-gesture-handler ~2.28      |
| Web Support        | react-native-web ~0.21                  |

## Architecture

```
app/                          # Expo Router pages (file-based routing)
├── (auth)/login.tsx          # Login screen
├── (teacher)/                # Teacher role (Dashboard, Attendance, Grading, Timetable, Lessons, Profile)
├── (student)/                # Student role (Dashboard, Grades, Attendance, Timetable, Lessons, Profile)
├── (parent)/                 # Parent role (Dashboard, Children, Lessons, Profile, [childId]/*)
├── (admin)/                  # Admin role (Dashboard, Users, Classes, Subjects, Academic Years, Profile)
├── (registrar)/              # Registrar role (Dashboard, Students, Enrollments, Profile)
├── (finance)/                # Finance role (Dashboard, Fee Structures, Payments, Reports, Profile)
├── (super-admin)/            # Super Admin (Dashboard, Schools, Settings, Profile)
├── (notifications)/          # Notifications screen
├── (phase4)/                 # Phase 4 features: Messaging, Events, Discipline, Search
├── _layout.tsx               # Root layout with AuthGate (role-based routing)
└── index.tsx                 # Entry point → redirects to /(auth)/login

src/
├── api/                      # API service modules (admin.api, finance.api, registrar.api, etc.)
│   ├── client.ts             # Axios instance re-export
│   ├── common.api.ts         # Announcements, Notifications, Calendar, Dashboard, Health
│   ├── admin.api.ts          # Users CRUD, Classes, Sections, Subjects, Academic Years
│   ├── student.api.ts        # Student-specific endpoints
│   ├── registrar.api.ts      # Enrollments, Student management
│   ├── finance.api.ts        # Fee structures, Payments, Reports, Discounts
│   └── super-admin.api.ts    # Schools, Platform settings, Subscriptions
├── lib/
│   ├── api/
│   │   ├── core.ts           # Axios instance with Bearer token interceptor + 401 handling
│   │   ├── auth.ts           # Login, Profile, Password management
│   │   ├── teacher.ts        # Attendance, Timetable, Grading, Lessons, Academic API
│   │   ├── parent.ts         # Dashboard, Children, Attendance, Grades, Finance, Timetable
│   │   └── utils.ts          # Data unwrapping + normalization helpers
│   └── storage.ts            # Cross-platform storage (SecureStore for native, localStorage for web)
├── contexts/
│   └── AuthContext.tsx        # Auth state management (login, logout, token persistence)
├── hooks/
│   ├── useApi.ts             # Generic async API hook with loading/error/data states
│   ├── useDebounce.ts        # Debounce hook
│   ├── useNetworkStatus.ts   # Network connectivity monitor
│   ├── usePagination.ts      # Pagination state management
│   └── useRefreshOnFocus.ts  # Refetch data when screen gains focus
├── components/
│   ├── ui/                   # Reusable UI primitives
│   │   ├── Button.tsx        # Primary/outline/ghost/danger variants
│   │   ├── Card.tsx          # Pressable card component
│   │   ├── TextInput.tsx     # Labeled input with focus/error states
│   │   ├── Badge.tsx         # Status badge (draft/submitted/published)
│   │   ├── Chip.tsx          # Selectable chip
│   │   ├── Avatar.tsx        # User avatar circle
│   │   ├── KpiCard.tsx       # Metric display card
│   │   ├── EmptyState.tsx    # Empty state placeholder
│   │   ├── ErrorState.tsx    # Error state display
│   │   ├── SectionHeader.tsx # Section title component
│   │   ├── LoadingOverlay.tsx# Full-screen loading overlay
│   │   └── ScreenContainer.tsx# Scrollable/fixed container with refresh
│   └── ProfileScreen.tsx     # Shared profile screen (edit profile, password, language, theme)
├── theme/
│   ├── colors.ts             # Color palette
│   ├── typography.ts         # Text style presets
│   └── spacing.ts            # Spacing, border radius, icon sizes
└── types/
    └── models.ts             # All TypeScript interfaces (User, TimetableSlot, Grade, Fee, etc.)
```

## Role-Based Routing (AuthGate)

The `AuthGate` in `app/_layout.tsx` maps roles to route groups:

| Role          | Route Group       | Tabs                                                       |
| ------------- | ----------------- | ---------------------------------------------------------- |
| SUPER_ADMIN   | `/(super-admin)`  | Dashboard, Schools, Settings, Profile                      |
| ADMIN         | `/(admin)`        | Dashboard, Users, Classes, Subjects, Academic Years, Profile |
| IT_MANAGER    | `/(admin)`        | Same as Admin                                              |
| TEACHER       | `/(teacher)`      | Dashboard, Attendance, Grading, Timetable, Lessons, Profile |
| STUDENT       | `/(student)`      | Dashboard, Grades, Attendance, Timetable, Lessons, Profile |
| PARENT        | `/(parent)`       | Dashboard, Children, Lessons, Profile, [childId] sub-pages |
| REGISTRAR     | `/(registrar)`    | Dashboard, Students, Enrollments, Profile                  |
| FINANCE       | `/(finance)`      | Dashboard, Fee Structures, Payments, Reports, Profile      |

## API Endpoints

The app connects to a backend at `EXPO_PUBLIC_API_URL` (default: `http://localhost:5000`). Key endpoint groups:

- **Auth**: `/auth/login`, `/auth/users/me`, `/auth/change-password`
- **Dashboard**: `/dashboard` (role-specific variants)
- **Classes/Sections/Subjects**: CRUD at `/classes`, `/sections`, `/subjects`
- **Attendance**: `/attendance/students`, `/attendance/session/:id`
- **Grading**: `/grading/teacher/students`, `/grading/teacher/grades/bulk`
- **Finance**: `/finance/fee-structures`, `/finance/payments`, `/finance/reports/*`
- **Registrar**: `/registrar/students`, `/registrar/enrollments`
- **Super Admin**: `/schools`, `/platform-settings`, `/subscription/plans`

---

## Setup & Launch

### Prerequisites

- **Node.js** >= 18
- **Bun** (recommended) or **npm**
- **Expo CLI**: `npx expo --version` (auto-installed)
- **iOS Simulator** (macOS only) or **Android Emulator** / **Expo Go** app on device

### 1. Install Dependencies

```bash
# Using npm
npm install

# OR using bun (faster)
bun install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit the API URL in .env to point to your backend server
# Default: EXPO_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start the Development Server

```bash
# Start with LAN connection on port 8082 (recommended for device testing)
npm start

# OR start for a specific platform:
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm run web        # Web browser
```

### 4. Open the App

- **iOS**: Press `i` in terminal or scan QR code with Expo Go
- **Android**: Press `a` in terminal or scan QR code with Expo Go
- **Web**: Press `w` in terminal (opens `http://localhost:8082`)

> **Note:** The `EXPO_OFFLINE=1` flag disables Expo's cloud bundler; the app bundles locally for faster development.

---

## Project Structure Key Files

| File                          | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `app/_layout.tsx`             | Root layout + role-based routing (AuthGate) |
| `src/contexts/AuthContext.tsx` | Auth state management                      |
| `src/lib/api/core.ts`         | Axios instance with JWT interceptor        |
| `src/lib/api/auth.ts`         | Login, profile, password API               |
| `src/lib/api/utils.ts`        | Data normalization helpers                 |
| `src/api/*.api.ts`            | Role-specific API modules                  |
| `src/hooks/useApi.ts`         | Generic API call hook                      |
| `src/hooks/useDebounce.ts`    | Debounce input values                      |
| `src/components/ui/*.tsx`     | Reusable design system components          |
| `src/types/models.ts`         | All TypeScript interfaces                  |
| `src/theme/*.ts`              | Design tokens (colors, typography, spacing)|

## Troubleshooting

- **Connection refused**: Ensure your backend server is running and `EXPO_PUBLIC_API_URL` is correct
- **Metro bundler issues**: Run `npx expo start --clear` to clear the Metro cache
- **iOS build errors**: Run `cd ios && pod install` if native dependencies changed
- **Expo Go limitations**: Some native modules (SecureStore) may have limited support in Expo Go; use development builds for full functionality
