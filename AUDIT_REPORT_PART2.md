# Production-Readiness Audit — Part 2: Pages & Components

**Scope:** 20 page files + 12 component files  
**Issues:** #39 – #70 (continuing from Part 1)

---

## CRITICAL

---

### Issue #39 — Race Condition in Notification Toggle Handlers
| Field | Value |
|-------|-------|
| **File** | `pages/settings/NotificationSettings.tsx` |
| **Lines** | ~70–110 (toggle functions) |
| **Category** | Race Condition |
| **Severity** | CRITICAL |

**Description:**  
`togglePeriod` and `toggleReminder` each cancel **ALL** scheduled notifications before re-scheduling the remaining type. If a user taps both toggles in quick succession, the second toggle's "cancel all" call will wipe out the notifications that the first toggle just scheduled, leaving the user with missing notifications and no error feedback.

**Suggested Fix:**
```ts
// Use a mutex/queue to serialize toggle operations
const toggleLock = useRef(false);

const togglePeriod = async () => {
  if (toggleLock.current) return;
  toggleLock.current = true;
  try {
    // ... cancel + reschedule logic
  } finally {
    toggleLock.current = false;
  }
};
```
Or better: cancel only the specific notification IDs for the type being toggled, not all notifications.

---

### Issue #40 — `confirm()` Blocks UI and Fails in WebView Contexts
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 604–612 |
| **Category** | Bug |
| **Severity** | CRITICAL |

**Description:**  
The delete-message flow uses `confirm()` to ask "Delete for everyone?" This is a synchronous browser dialog that blocks the main UI thread and is **unreliable or entirely suppressed** in Capacitor WebViews on some Android versions. Users on native builds may be unable to delete messages at all.

Also appears in `pages/Settings.tsx` (`unlinkDevice`) at approximately line 130.

**Suggested Fix:**  
Replace `confirm()` with an in-app confirmation modal or bottom sheet (consistent with the rest of the app's UI).

---

## HIGH

---

### Issue #41 — GIF Search Timeout Ref Never Cleared on Unmount (Memory Leak)
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 100, 128–131 |
| **Category** | Memory Leak |
| **Severity** | HIGH |

**Description:**  
`gifSearchTimeout` ref stores a `setTimeout` ID used for debouncing GIF searches. If the component unmounts while a timeout is pending, the callback fires on an unmounted component, attempting `setGifResults` and `setGifLoading` state updates. There is no cleanup `useEffect` to clear this timeout.

**Suggested Fix:**
```ts
useEffect(() => {
  return () => {
    if (gifSearchTimeout.current) clearTimeout(gifSearchTimeout.current);
  };
}, []);
```

---

### Issue #42 — Long-Press Timer Ref Not Cleared on Unmount
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 86, 498–507 |
| **Category** | Memory Leak |
| **Severity** | HIGH |

**Description:**  
`longPressTimerRef` is cleared on `touchEnd` and `touchMove`, but if the component unmounts mid-press (e.g., partner disconnects, navigation occurs), the 500ms timeout fires on an unmounted component, calling `openContextMenu` → `setContextMenu` on unmounted state.

**Suggested Fix:**  
Add unmount cleanup alongside the GIF timeout fix:
```ts
useEffect(() => {
  return () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };
}, []);
```

---

### Issue #43 — `markAsRead` Fires on Every Notes Array Change (API Flooding)
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 279–289 |
| **Category** | Race Condition / Optimization |
| **Severity** | HIGH |

**Description:**  
The `useEffect` that calls `markAsRead` depends on `[notes, user]`. Every time any note changes (new message, reaction, status update, star/pin toggle), this effect re-runs and fires a Supabase API call. In an active conversation, this can produce dozens of redundant calls per minute, risking rate limits.

**Suggested Fix:**  
Debounce the markAsRead call, and track which IDs have already been marked:
```ts
const markedRef = useRef(new Set<string>());

useEffect(() => {
  if (!user || !notes?.length) return;
  const unread = notes
    .filter(n => n.sender_id !== user.id && n.status !== 'read' && !markedRef.current.has(n.id))
    .map(n => n.id);
  if (unread.length > 0) {
    markedRef.current = new Set([...markedRef.current, ...unread]);
    markAsRead(unread);
  }
}, [notes, user]);
```

---

### Issue #44 — `fetchDevices` Has No Error Handling
| Field | Value |
|-------|-------|
| **File** | `pages/Settings.tsx` |
| **Lines** | ~78–90 |
| **Category** | Error Handling |
| **Severity** | HIGH |

**Description:**  
The `fetchDevices` function calls `supabase.from('user_devices').select(...)` with no `try/catch`. If the query fails (network error, RLS issue), the `error` object is silently ignored — no toast, no log, no fallback. The user sees an empty device list with no explanation.

**Suggested Fix:**
```ts
const { data, error } = await supabase.from('user_devices').select('*')...;
if (error) {
  console.error('Failed to fetch devices:', error);
  showToast('Error', 'Could not load devices', 'error');
  return;
}
```

---

### Issue #45 — Reset Button Has No `onClick` Handler (Dead UI)
| Field | Value |
|-------|-------|
| **File** | `pages/LogDetails.tsx` |
| **Lines** | ~149 |
| **Category** | Bug |
| **Severity** | HIGH |

**Description:**  
The "Reset" button in the LogDetails header renders but does nothing when clicked — it has no `onClick` prop. Users see a clickable button that provides no feedback or action.

**Suggested Fix:**
```tsx
<button onClick={() => {
  setFlow(''); setMoods([]); setSymptoms([]); setPhysical([]);
  setDigestion([]); setEnergy(''); setSleep(''); setSleepHours(7);
  setNotes('');
}}>
  Reset
</button>
```

---

### Issue #46 — `handleSave` Has No Error Handling or User Feedback
| Field | Value |
|-------|-------|
| **File** | `pages/LogDetails.tsx` |
| **Lines** | ~90–120 (save handler) |
| **Category** | Error Handling |
| **Severity** | HIGH |

**Description:**  
The save handler calls `saveLog()` (from DataContext) but doesn't wrap it in try/catch. If the save fails (offline, RLS error, etc.), the user has no idea their data was lost. The form navigates back regardless.

**Suggested Fix:**
```ts
try {
  await saveLog({...});
  showToast('Saved!', 'Log saved successfully');
  navigate(-1);
} catch (error) {
  showToast('Error', 'Failed to save log. Please try again.', 'error');
}
```

---

### Issue #47 — O(n×m) Log Lookups in Calendar Render
| Field | Value |
|-------|-------|
| **File** | `pages/Calendar.tsx` |
| **Lines** | ~80–120 (`getDayStatus` function) |
| **Category** | Optimization |
| **Severity** | HIGH |

**Description:**  
`getDayStatus` calls `logs.find()` for each day cell in the visible month on every render. With 30–42 visible day cells and potentially hundreds of logs, this is O(n×m) per render. Scrolling between months triggers re-renders, causing noticeable lag on lower-end devices.

**Suggested Fix:**  
Build a `Map` keyed by date string once via `useMemo`:
```ts
const logsByDate = useMemo(() => {
  const map = new Map<string, DailyLog>();
  for (const log of logs) map.set(log.date, log);
  return map;
}, [logs]);
```

---

### Issue #48 — `searchGifs` Has Stale `gifLoading` Closure
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 108–121 |
| **Category** | Race Condition |
| **Severity** | HIGH |

**Description:**  
`searchGifs` is defined in the component body and checks `if (gifLoading) return;` as a guard. However, when called from the debounced timeout in `handleGifSearchChange`, the `gifLoading` value is captured from the closure at definition time — not the current state. This means the guard can fail, allowing duplicate concurrent fetches.

**Suggested Fix:**  
Use a ref for the loading guard:
```ts
const gifLoadingRef = useRef(false);

const searchGifs = async (query: string) => {
  if (gifLoadingRef.current || !GIPHY_API_KEY) return;
  gifLoadingRef.current = true;
  setGifLoading(true);
  try { ... } finally {
    gifLoadingRef.current = false;
    setGifLoading(false);
  }
};
```

---

### Issue #49 — No File Type or Size Validation on Chat Image Upload
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 417–435 (`handleFileSelected`) |
| **Category** | Security / Error Handling |
| **Severity** | HIGH |

**Description:**  
`handleFileSelected` accepts any file from the `<input type="file" accept="image/*">` element without validating the actual MIME type or file size. The HTML `accept` attribute is only a UI hint and can be bypassed. Extremely large files (50MB+) will exhaust memory during encryption and cause the upload to fail silently or crash the tab.

**Suggested Fix:**
```ts
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!ALLOWED_TYPES.includes(file.type)) {
  showToast('Error', 'Only image files are allowed', 'error');
  return;
}
if (file.size > MAX_SIZE) {
  showToast('Error', 'Image must be under 10MB', 'error');
  return;
}
```

---

### Issue #50 — No File Size Validation on Avatar Upload
| Field | Value |
|-------|-------|
| **File** | `pages/EditProfile.tsx` |
| **Lines** | ~70–100 (`handleFileChange`) |
| **Category** | Error Handling |
| **Severity** | HIGH |

**Description:**  
The avatar upload handler accepts any file size. Users can accidentally select a 100MB photo, which will fail during upload with no meaningful error — or succeed and create an enormous avatar that slows down profile loading for them and their partner.

**Suggested Fix:**  
Add validation before upload:
```ts
if (file.size > 5 * 1024 * 1024) {
  showToast('Error', 'Avatar must be under 5MB', 'error');
  return;
}
```

---

### Issue #51 — Share Code Uses `Math.random()` (Not Cryptographically Secure)
| Field | Value |
|-------|-------|
| **File** | `pages/Insights.tsx` |
| **Lines** | ~200–210 (share code generation) |
| **Category** | Security |
| **Severity** | HIGH |

**Description:**  
The public share code for cycle insights is generated using `Math.random()`, which is a predictable PRNG. An attacker could enumerate share codes and access other users' cycle/health data via the public `SharedCard` route.

**Suggested Fix:**
```ts
const array = new Uint8Array(4);
crypto.getRandomValues(array);
const shareCode = Array.from(array, b => b.toString(36)).join('').slice(0, 6).toUpperCase();
```

---

### Issue #52 — `sendTestNotification` Crashes on Web Platform
| Field | Value |
|-------|-------|
| **File** | `pages/settings/NotificationSettings.tsx` |
| **Lines** | ~150–170 |
| **Category** | Bug |
| **Severity** | HIGH |

**Description:**  
`sendTestNotification` dynamically imports `@capacitor/local-notifications` and calls `LocalNotifications.schedule()`. On web browsers without the Capacitor native bridge, this will throw an unhandled error. The function has no platform check or try/catch around the scheduling call.

**Suggested Fix:**
```ts
const sendTestNotification = async () => {
  if (!Capacitor.isNativePlatform()) {
    showToast('Info', 'Notifications only work on mobile devices');
    return;
  }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({...});
  } catch (e) {
    showToast('Error', 'Failed to send notification', 'error');
  }
};
```

---

### Issue #53 — `fetchSettings` Triggers Notification Scheduling as Side Effect
| Field | Value |
|-------|-------|
| **File** | `pages/settings/NotificationSettings.tsx` |
| **Lines** | ~55–62 |
| **Category** | Bug |
| **Severity** | HIGH |

**Description:**  
The `fetchSettings` function (which is supposed to read settings from the DB) also calls notification scheduling functions. This means every time settings are fetched (component mount, re-render triggers, context changes), notifications are re-scheduled — potentially creating duplicate scheduled notifications.

**Suggested Fix:**  
Separate the data fetching from the scheduling side effect. Schedule once on mount after initial fetch, using a `hasScheduled` ref guard.

---

## MEDIUM

---

### Issue #54 — Missing `useEffect` Dependencies in Settings
| Field | Value |
|-------|-------|
| **File** | `pages/Settings.tsx` |
| **Lines** | ~52–71 |
| **Category** | Bug |
| **Severity** | MEDIUM |

**Description:**  
The settings initialization `useEffect` depends on `[user]` but reads `animationsEnabled` and `solidNavBg` from ThemeContext without listing them as dependencies. If theme values change externally, the effect won't re-synchronize.

---

### Issue #55 — Fire-and-Forget Async Operations in Settings
| Field | Value |
|-------|-------|
| **File** | `pages/Settings.tsx` |
| **Lines** | ~200–230 (toggle handlers), ~350 (nickname blur) |
| **Category** | Error Handling |
| **Severity** | MEDIUM |

**Description:**  
Multiple handlers (`handleToggleAnimations`, `handleToggleSolidNav`, partner nickname `onBlur`) perform async DB updates with no error feedback. If the update fails, the UI shows the toggled state but the DB retains the old value — a silent desync.

---

### Issue #56 — Symptom/Digestion Option Arrays Recreated Every Render
| Field | Value |
|-------|-------|
| **File** | `pages/LogDetails.tsx` |
| **Lines** | ~25–60 (option arrays) |
| **Category** | Optimization |
| **Severity** | MEDIUM |

**Description:**  
`physicalOptions` and `digestionOptions` are defined inside the component body, causing new array allocations on every render. Since these are static data, they should be moved outside the component or wrapped in `useMemo` with no dependencies.

---

### Issue #57 — Uses `alert()` for Error Messages
| Field | Value |
|-------|-------|
| **File** | `pages/EditProfile.tsx` |
| **Lines** | ~80, ~120 |
| **Category** | Bug |
| **Severity** | MEDIUM |

**Description:**  
Error messages in `handleFileChange` use `alert()` instead of the app's Toast system. This creates an inconsistent UX and, like `confirm()`, can be suppressed in WebView contexts.

---

### Issue #58 — `handleFinish` Doesn't Show Error on Failure
| Field | Value |
|-------|-------|
| **File** | `pages/Onboarding.tsx` |
| **Lines** | ~200–230 |
| **Category** | Error Handling |
| **Severity** | MEDIUM |

**Description:**  
If saving cycle settings fails during onboarding completion, the error is caught and logged to console, but the user receives no feedback. They may think setup succeeded while their data was never saved.

---

### Issue #59 — No Error Handling or Feedback on Cycle/Period Length Save
| Field | Value |
|-------|-------|
| **File** | `pages/CycleLengthSettings.tsx`, `pages/PeriodLengthSettings.tsx` |
| **Lines** | ~60–75 (handleSave) |
| **Category** | Error Handling |
| **Severity** | MEDIUM |

**Description:**  
Both settings pages call `updateSettings()` and immediately navigate back. If the update fails, the user sees no error, and their changes are lost.

---

### Issue #60 — `handleLogout` Doesn't Clear localStorage Caches
| Field | Value |
|-------|-------|
| **File** | `pages/Admin/AdminProfile.tsx` |
| **Lines** | ~70–85 |
| **Category** | Security |
| **Severity** | MEDIUM |

**Description:**  
On admin logout, `signOut()` is called but localStorage entries (cached profile, sidebar state, settings) are not cleared. On a shared device, the next user could see stale profile data from the previous admin session.

---

### Issue #61 — No Pagination for User List and Log Fetching (Admin)
| Field | Value |
|-------|-------|
| **File** | `pages/Admin/AdminDashboard.tsx`, `pages/Admin/AdminLogs.tsx` |
| **Lines** | Full files |
| **Category** | Optimization |
| **Severity** | MEDIUM |

**Description:**  
The admin dashboard renders the entire user list in a single pass (no pagination, no virtual scrolling). `AdminLogs.tsx` fetches all logs for a selected user in one query. With a growing user base, this will cause increasingly slow load times and potential memory pressure.

---

### Issue #62 — `URL_REGEX` Without Global Flag Misses Multiple URLs
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 164 |
| **Category** | Bug |
| **Severity** | MEDIUM |

**Description:**  
`URL_REGEX = /(https?:\/\/[^\s]+)/` (non-global). While `split()` with a capture group correctly splits on all occurrences, `text.match(URL_REGEX)` returns only the first match. The "Open" and "Copy" link action bar below messages only shows a button for the **first URL**, even if the message contains multiple links.

**Suggested Fix:**  
Use `text.match(/https?:\/\/[^\s]+/g)` to get all URLs for the action bar.

---

### Issue #63 — `<style>` Tag Injected into `<head>` Never Removed on Unmount
| Field | Value |
|-------|-------|
| **File** | `pages/Insights.tsx` |
| **Lines** | ~54–60 |
| **Category** | Memory Leak |
| **Severity** | MEDIUM |

**Description:**  
A `useEffect` injects a `<style>` element into `document.head` for custom chart styles. The cleanup function does not remove this element. Navigating to and from Insights repeatedly will add duplicate `<style>` tags to the DOM.

**Suggested Fix:**
```ts
useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `...`;
  document.head.appendChild(style);
  return () => { document.head.removeChild(style); };
}, []);
```

---

### Issue #64 — Hardcoded Dark Theme Classes in Calendar Header
| Field | Value |
|-------|-------|
| **File** | `pages/Calendar.tsx` |
| **Lines** | ~40–50 (header) |
| **Category** | Bug |
| **Severity** | MEDIUM |

**Description:**  
The calendar header uses `bg-background-dark/80` unconditionally, ignoring light mode. When the user has selected light theme, the header still renders with a dark background.

---

### Issue #65 — Stale `Date` Object in TodayReportModal
| Field | Value |
|-------|-------|
| **File** | `components/TodayReportModal.tsx` |
| **Lines** | 36 |
| **Category** | Bug |
| **Severity** | MEDIUM |

**Description:**  
`const today = new Date()` is evaluated once when the component renders. If the modal stays open past midnight (e.g., user leaves their phone on the report screen), the exported report will display yesterday's date while being titled "Today's Report."

---

## LOW

---

### Issue #66 — Unused `AnimatePresence` Import
| Field | Value |
|-------|-------|
| **File** | `components/Layout.tsx`, `components/AdminLayout.tsx` |
| **Lines** | 3, 3 |
| **Category** | Optimization |
| **Severity** | LOW |

**Description:**  
`AnimatePresence` is imported from `framer-motion` in both layout components but never used. This is dead code that adds minor bundle weight and triggers linter warnings.

---

### Issue #67 — OTP `maxLength` Inconsistency Between SignUp and ForgotPassword
| Field | Value |
|-------|-------|
| **File** | `pages/SignUp.tsx` (line ~184), `pages/ForgotPassword.tsx` (line ~100) |
| **Category** | Bug |
| **Severity** | LOW |

**Description:**  
The OTP input in SignUp allows 8 characters (`maxLength={8}`) while ForgotPassword allows 6 (`maxLength={6}`). Supabase OTPs are 6 digits — the inconsistency in SignUp could confuse users into entering additional characters.

---

### Issue #68 — `handleGoogleLogin` Doesn't Set Loading State
| Field | Value |
|-------|-------|
| **File** | `pages/Login.tsx` |
| **Lines** | ~100–120 |
| **Category** | Bug |
| **Severity** | LOW |

**Description:**  
The email/password login sets `setLoading(true)` at the start of the handler, but `handleGoogleLogin` does not. Users can double-tap the Google button during the OAuth redirect, potentially opening multiple OAuth windows.

---

### Issue #69 — `new Date()` in Dashboard Render Body May Become Stale
| Field | Value |
|-------|-------|
| **File** | `pages/Dashboard.tsx` |
| **Lines** | ~24 |
| **Category** | Bug |
| **Severity** | LOW |

**Description:**  
`const today = new Date()` is captured once per render. If the Dashboard stays mounted overnight without re-rendering (common on mobile where apps are backgrounded), the cycle day, phase, and "days until next period" will all show yesterday's values until a state change triggers a re-render.

---

### Issue #70 — `setIsChatOpen` Missing from `useEffect` Dependency Array
| Field | Value |
|-------|-------|
| **File** | `pages/LoveLock.tsx` |
| **Lines** | 271–274 |
| **Category** | Bug |
| **Severity** | LOW |

**Description:**  
The useEffect that calls `setIsChatOpen(true)` on mount has an empty dependency array `[]`, but ESLint's exhaustive-deps rule would flag `setIsChatOpen` as missing. While context dispatch functions are typically stable, the linting violation is a code smell. The comment or explicit ignore should be present.

---

## Summary

| Severity | Count | Issue Numbers |
|----------|-------|---------------|
| **CRITICAL** | 2 | #39, #40 |
| **HIGH** | 13 | #41 – #53 |
| **MEDIUM** | 12 | #54 – #65 |
| **LOW** | 5 | #66 – #70 |
| **Total** | **32** | #39 – #70 |

### Priority Fix Order
1. **#39** (notification race condition) — can cause silent notification loss
2. **#40** (confirm in WebView) — blocks or crashes native users  
3. **#41 + #42** (unmount timer leaks) — fix together, same pattern
4. **#43** (markAsRead flooding) — Supabase rate limit risk in production
5. **#51** (Math.random share code) — health data exposure via enumeration
6. **#45 + #46** (LogDetails dead button + silent save) — direct data loss risk
7. **#49 + #50** (upload validation) — crash prevention on large files
