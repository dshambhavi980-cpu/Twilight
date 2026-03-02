# Twilight Garden — Production Readiness Audit

**Scope:** 19 game files (`pages/games/`), 12 lib files (`lib/`), config files (`vite.config.ts`, `tsconfig.json`, `capacitor.config.ts`), entry files (`App.tsx`, `index.tsx`, `types.ts`)

Issues numbered from **#100**, grouped by severity.

---

## CRITICAL

### #100 — API key leaked to client bundle
**File:** `vite.config.ts` (lines 17–20)  
The Vite `define` block inlines `process.env.GEMINI_API_KEY` and `process.env.API_KEY` as literal strings in the production JS bundle:
```js
define: {
  'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
}
```
Anyone can extract these keys from the compiled JavaScript. API keys granting write/billing access must never be embedded in client code.

**Impact:** Full key compromise; unauthorized usage billed to your account.  
**Fix:** Move AI calls behind a server-side proxy (Edge Function / Cloudflare Worker) and remove the keys from `define`. If the keys are already proxied and unused, remove the `define` entries entirely.

---

### #101 — Game secrets visible to opponent via Supabase Realtime
**Files:** `pages/games/TwentyQuestions.tsx`, `pages/games/WordGuess.tsx`, `pages/games/Hangman.tsx`  
The thinker's/picker's secret (`thingDescription`, `customWord`, picked word) is stored in the `board_state` JSON column. Because both players subscribe to `postgres_changes` on the same `game_sessions` row, the opponent receives the full `board_state` payload — including the answer — in every realtime event. It is trivially visible in the browser DevTools Network tab.

**Impact:** Any technically aware user can cheat in these three games.  
**Fix:** Store the secret in a separate server-side column (or a different table) that is NOT included in the realtime broadcast payload. Alternatively, use an RPC function to validate guesses server-side without exposing the answer.

---

### #102 — Weak token generation for device sync pairing
**File:** `lib/sync.ts` (line ~10)  
```js
const token = Math.random().toString(36).slice(2, 10);
```
`Math.random()` is not cryptographically secure. The 8-character base-36 token (~41 bits of entropy) is used for QR-based device sync, which grants the ability to transfer account data between devices.

**Impact:** Brute-force or prediction attacks could hijack a sync session.  
**Fix:** Use `crypto.getRandomValues` (or `crypto.randomUUID()`) and increase token length to at least 128 bits of entropy.

---

## HIGH

### #103 — TypeScript strict mode disabled
**File:** `tsconfig.json`  
The config has no `strict: true`, no `strictNullChecks`, no `noImplicitAny`, no `noUncheckedIndexedAccess`. In a health/cycle-tracking app handling sensitive medical data, this allows entire classes of null-reference and type-mismatch bugs to slip through silently.

**Impact:** Runtime crashes from `undefined` access, incorrect data processing.  
**Fix:** Add `"strict": true` to `compilerOptions` and incrementally fix type errors.

---

### #104 — Memory leak: uncleared interval in EmojiCharades
**File:** `pages/games/EmojiCharades.tsx` (~line 330–345 inside `submitGuess`)  
`submitGuess` creates a `setInterval` for a countdown timer. This interval is stored in a local variable and is only cleared when the countdown reaches zero. If the component unmounts mid-countdown (user navigates away), the interval continues running and calling `setGame` on an unmounted component.

**Impact:** Memory leak, React "state update on unmounted component" warning, potential stale state corruption.  
**Fix:** Store the interval ID in a `useRef` and clear it in the cleanup function of a `useEffect` (or in the channel cleanup).

---

### #105 — Memory leak: uncleared interval in LoveTrivia
**File:** `pages/games/LoveTrivia.tsx` (~line 340–355 inside `submitAnswer`)  
Identical pattern to #104. The reveal-countdown `setInterval` created inside `submitAnswer` is not cleaned up on unmount.

**Impact:** Same as #104.  
**Fix:** Same as #104.

---

### #106 — Memory leak: TicTacToe confetti animation frames not cancelled
**File:** `pages/games/TicTacToe.tsx` (~line 60–100, `fireConfetti` function)  
`fireConfetti` starts a `requestAnimationFrame` loop that runs for ~2 seconds. The animation frame ID is never cancelled on component unmount. If the user navigates away while confetti is animating, the loop continues painting to a detached canvas.

**Impact:** Leaked animation frames, potential errors accessing detached DOM nodes.  
**Fix:** Store the rAF ID in a ref and cancel it (`cancelAnimationFrame`) in the useEffect cleanup.

---

### #107 — useEffect dependency on boolean expression instead of value (5+ games)
**Files:** `ThisOrThat.tsx`, `LoveTrivia.tsx`, `RapidFire.tsx`, `SongLyrics.tsx`, and others  
Multiple games use a pattern like:
```js
useEffect(() => { ... }, [items.length > 0]);
```
`items.length > 0` evaluates to a **boolean**. Once true, it will never re-trigger even if the array grows, shrinks, or is replaced. This means the effect that initializes the game with loaded data may not re-fire correctly.

**Impact:** Game initialization may silently fail or use stale data after a data refetch.  
**Fix:** Use `items.length` (number) as the dependency, or `items` (reference) with appropriate guards inside the effect body.

---

### #108 — Fire-and-forget Supabase updates across all game files
**Files:** Nearly all 19 game files  
Most games call `supabase.from('game_sessions').update(...)` without `await` and without checking the returned `error`. Examples include `broadcast` helpers in `TwoTruthsOneLie`, `StoryBuilder`, `MemoryMatch`, `TruthOrDare`, `SongLyrics`, `NeverHaveIEver`, `ThisOrThat`, `WouldYouRather`, and others.

**Impact:** If the DB update fails (network drop, RLS error, conflict), the local optimistic state diverges permanently from the server state. The opponent sees stale data; game state becomes corrupted with no user feedback.  
**Fix:** Await the update, check `error`, and either retry or rollback the optimistic state. At minimum, show an error toast.

---

### #109 — Notification listeners accumulate without cleanup
**File:** `lib/notifications.ts` (~line 460–520, `initNotificationListeners`)  
`initNotificationListeners` calls `PushNotifications.addListener(...)` multiple times. These listeners are never removed. Although `registerPushNotifications` has a guard to prevent being called twice, the guard doesn't protect against component re-mounts or hot-reloads appending duplicate listeners.

**Impact:** Duplicate notification handling, growing memory usage over the app's lifetime.  
**Fix:** Return the listener handles from `initNotificationListeners` and remove them in a cleanup function. Or store them in a module-level variable and remove before re-adding.

---

### #110 — `ArrayBuffer` cast may fail in modern browsers
**File:** `lib/encryption.ts` (~line 95)  
```js
ciphertext.buffer as ArrayBuffer
```
In newer browser engines, `Uint8Array.prototype.buffer` returns `ArrayBufferLike` (which may be a `SharedArrayBuffer` or a resizable `ArrayBuffer`). Casting to `ArrayBuffer` via `as` provides no runtime safety. `crypto.subtle.decrypt` may reject the argument.

**Impact:** Decryption failures on newer browser versions, breaking E2EE messaging.  
**Fix:** Create a clean `ArrayBuffer` copy: `new Uint8Array(ciphertext).buffer` or use `ciphertext.slice().buffer`.

---

### #111 — Side effect inside React state updater
**File:** `pages/games/Hangman.tsx` (~line 165–195, `guessLetter`)  
The `guessLetter` function performs a Supabase DB update **inside** a `setGame(prev => { ... })` callback. State updater functions must be pure — side effects inside them can execute multiple times under React StrictMode or concurrent features.

**Impact:** Double DB writes in development; unpredictable behavior in React concurrent mode.  
**Fix:** Compute the new state, then perform the Supabase update outside the state setter.

---

### #112 — RockPaperScissors chained setTimeout without cleanup
**File:** `pages/games/RockPaperScissors.tsx` (~line 200–240, `handleBothChose`)  
`handleBothChose` chains multiple `setTimeout` calls (reveal → result → score update) without storing the timeout IDs. If the component unmounts during the chain, the remaining timeouts will fire on stale/unmounted state.

**Impact:** State updates on unmounted component; potential game state corruption.  
**Fix:** Store timeout IDs in refs and clear them on unmount.

---

## MEDIUM

### #113 — Dev server exposed to entire network
**File:** `vite.config.ts` (line 9)  
```js
host: '0.0.0.0'
```
The dev server binds to all network interfaces, making it accessible to any device on the same network (including public Wi-Fi).

**Impact:** Malicious actors on the same network can access the dev app and any proxied API keys.  
**Fix:** Use `host: 'localhost'` or `host: true` only when explicitly needed for mobile testing. This is dev-only but still a risk during development.

---

### #114 — Module-level caches persist across navigations
**Files:** `RiddleMe.tsx` (`riddleCache`), `StoryBuilder.tsx` (`starterCache`), `WouldYouRather.tsx` (`wyrCache`), `WordGuess.tsx` (`wordBankCache`)  
These module-level `let` variables cache fetched JSON data. Because module scope outlives component lifecycle, the data persists until the page is fully reloaded. This is intentional for performance but means:
- Memory is never freed for games the user has left.
- If game data files are updated on the server, users won't see updates until a hard refresh.

**Impact:** Stale data after server updates; minor memory overhead.  
**Fix:** Accept as intentional, or move caches into a context/store with explicit invalidation.

---

### #115 — Inconsistent fetch paths for game data files
**Files:** `RiddleMe.tsx` (`./Games_data/riddle_me.json`), `WordGuess.tsx` (`./Games_data/words_30000_categorized.json`) use **relative** paths. `EmojiCharades.tsx` (`/Games_data/emoji_charades.json`), `WouldYouRather.tsx` (`/Games_data/would_you_rather.json`) use **absolute** paths.

**Impact:** Relative paths resolve from the current URL path, which in a HashRouter may not be the document root. This can cause 404s depending on deployment configuration.  
**Fix:** Use absolute paths (`/Games_data/...`) consistently for all game data fetches.

---

### #116 — Pervasive `as any` casting on Supabase queries
**Files:** All 19 game files  
Every game casts the Supabase query builder: `(supabase.from('game_sessions') as any)`. This completely bypasses TypeScript's type checking for all DB operations — column names, filter values, and return types are unchecked.

**Impact:** Typos in column names or wrong value types won't be caught at compile time.  
**Fix:** Add proper typed overloads for `game_sessions` in your `Database` type (already partially defined in `types.ts`), then remove the `as any` casts.

---

### #117 — No input sanitization for user-generated text in board_state
**Files:** `StoryBuilder.tsx` (story entries), `WordGuess.tsx` (custom words), `TwentyQuestions.tsx` (thing description, questions, answers), `TwoTruthsOneLie.tsx` (statements), `Hangman.tsx` (custom word)  
User-provided text is stored directly in the `board_state` JSON column and rendered with `{text}` in JSX. While React auto-escapes JSX interpolation (preventing basic XSS), the raw text is stored in Supabase without any validation or length limits.

**Impact:** Users could store oversized payloads, emoji spam, or invisible characters that break layout. If any code path uses `dangerouslySetInnerHTML`, XSS becomes possible.  
**Fix:** Add server-side validation (max length, character whitelist) via Supabase RLS policies or database constraints. Add client-side input length limits.

---

### #118 — `searchShoppingProducts` has no request timeout
**File:** `lib/wellnessAI.ts` (~line 185)  
Unlike `generateWellnessTips` and `generateEmpathyAlert` which use a 30-second `AbortController` timeout, `searchShoppingProducts` calls `supabase.functions.invoke(...)` with no timeout at all.

**Impact:** If the edge function hangs, the UI will wait indefinitely with no way to recover.  
**Fix:** Add an `AbortController` with a reasonable timeout (e.g., 15 seconds).

---

### #119 — cycleUtils date calculation vulnerable to DST transitions
**File:** `lib/cycleUtils.ts` (~line 15–20)  
```js
const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
```
Dates are constructed with `new Date(dateStr + 'T00:00:00')` which uses **local time**. At DST boundaries, the time difference between two consecutive days at midnight may be 23 or 25 hours. `Math.round` mitigates this but can still produce off-by-one errors during the transition hour.

**Impact:** Cycle phase displayed incorrectly for ~1 hour during DST transitions (affects ~4 billion people twice a year).  
**Fix:** Use UTC dates: `new Date(dateStr + 'T00:00:00Z')` or `Date.UTC()`.

---

### #120 — decryptMessage fallback scans ALL stored keys
**File:** `lib/encryption.ts` (~line 175–210)  
When `userId` is not provided, `decryptMessage` falls back to iterating over **all** Capacitor Preferences keys to find a matching private key. On devices with many stored keys, this creates an O(n) scan on every message decryption attempt.

**Impact:** Slow decryption, noticeable lag on older devices with many stored entries.  
**Fix:** Always pass `userId` to `decryptMessage`, or maintain a dedicated key index.

---

### #121 — sendGameNotification performs 2 DB queries per call with no caching
**File:** `lib/notifications.ts` (~line 400–430)  
Each call to `sendGameNotification` queries `users` twice (once for the sending user's nickname, once implicitly) before sending the notification via edge function.

**Impact:** Unnecessary DB load, increased latency for game notifications.  
**Fix:** Cache the user's display name in memory or pass it as a parameter.

---

### #122 — Firebase config hardcoded in source
**File:** `lib/firebase.ts`  
The Firebase configuration object (API key, project ID, messaging sender ID, app ID) is hardcoded. While Firebase API keys are considered semi-public (security is enforced by Firebase Security Rules), hardcoding them prevents environment-specific configurations and makes key rotation difficult.

**Impact:** Cannot rotate keys without a code change and redeploy.  
**Fix:** Move to environment variables loaded at build time via `import.meta.env`.

---

### #123 — DotsBoxes `checkBoxes` callback has stale closure risk
**File:** `pages/games/DotsBoxes.tsx` (~line 90–140)  
`checkBoxes` is wrapped in `useCallback` but depends on the current `game` state. If `game` is not in its dependency array (or if the function captures a stale reference), completed boxes may be miscounted.

**Impact:** Incorrect box ownership, wrong scores in DotsBoxes game.  
**Fix:** Verify that `checkBoxes` has `game` (or the relevant board state) in its `useCallback` dependency array, or use a ref to always access current state.

---

### #124 — ConnectFour `checkWin` uses `useCallback` with potentially stale board
**File:** `pages/games/ConnectFour.tsx` (~line 60–100)  
`checkWin` is a `useCallback` that checks the board for four-in-a-row. If the board state captured in the closure is stale relative to the latest move, the win check may give a false negative.

**Impact:** A winning move might not be detected until the next render cycle.  
**Fix:** Pass the board array as an argument to `checkWin` instead of reading it from closure.

---

## LOW

### #125 — Deep link listener cleanup returns Promise, not synchronous
**File:** `App.tsx` (~line 480–490)  
```js
return () => {
  listener.then(handle => handle.remove());
  restoreListener.then(handle => handle.remove());
};
```
The useEffect cleanup function calls `.then()` on the listener Promises. Cleanup functions should be synchronous. The `.then()` callbacks will run asynchronously — after React has already considered the cleanup complete — meaning listeners briefly remain active during unmount.

**Impact:** Negligible for `App` (which rarely unmounts), but sets a bad pattern.  
**Fix:** Use `useRef` to store the resolved handles, then remove synchronously in cleanup.

---

### #126 — Game routes triplicated for each role
**File:** `App.tsx` (~lines 530–640)  
Every game has three route entries (user, admin, partner), each wrapping the same component in a different route guard. This is 57 route definitions for 19 games.

**Impact:** Maintenance burden; adding a new game requires 3 route entries.  
**Fix:** Generate routes programmatically from an array of game configs, applying the appropriate guard based on the URL prefix.

---

### #127 — `exportPDF.ts` log history hardcoded to 30 entries
**File:** `lib/exportPDF.ts` (~line 180)  
The PDF export limits log history to the last 30 entries with no user control.

**Impact:** Users with longer tracking periods may expect a complete export.  
**Fix:** Make the limit configurable or export all data with pagination in the PDF.

---

### #128 — VAPID key hardcoded in notifications.ts
**File:** `lib/notifications.ts` (~line 50)  
The VAPID public key is hardcoded as a string literal. VAPID public keys are meant to be public, but hardcoding prevents multi-environment setups.

**Impact:** Cannot change the VAPID key without a code change.  
**Fix:** Move to `import.meta.env.VITE_VAPID_KEY`.

---

### #129 — Hardcoded Cloudflare Worker URL
**File:** `lib/ai.ts` (~line 5)  
The worker endpoint URL is a hardcoded string. This prevents staging/production environment separation.

**Impact:** No environment-specific AI endpoint configuration.  
**Fix:** Use `import.meta.env.VITE_AI_WORKER_URL`.

---

### #130 — `index.tsx` deep link handler reloads window after `setSession`
**File:** `index.tsx` (~line 40)  
After calling `supabase.auth.setSession(...)`, the code calls `window.location.reload()`. This is a brute-force approach to session hydration that causes a full page reload, losing any in-memory state.

**Impact:** Poor UX — flash of loading screen after OAuth callback.  
**Fix:** Use Supabase's `onAuthStateChange` listener to reactively update the auth context without a full reload.

---

### #131 — `MemoryMatch` broadcast fires DB update without error handling
**File:** `pages/games/MemoryMatch.tsx` (~line 120)  
The `broadcast()` call triggers a Supabase update without `await` or `.then()/.catch()`. While this is part of the broader #108 pattern, MemoryMatch is especially sensitive because rapid card flips can generate many concurrent fire-and-forget updates.

**Impact:** Board state divergence between players during rapid play.  
**Fix:** Debounce/coalesce rapid updates, or await with rollback.

---

---

## Summary Table

| Severity | Count | Issue Numbers |
|----------|-------|---------------|
| **CRITICAL** | 3 | #100, #101, #102 |
| **HIGH** | 10 | #103 – #112 |
| **MEDIUM** | 12 | #113 – #124 |
| **LOW** | 7 | #125 – #131 |
| **Total** | **32** | |

### Top Priority Fixes (recommended order)
1. **#100** — Remove API keys from client bundle immediately
2. **#101** — Fix game secret exposure (TwentyQuestions, WordGuess, Hangman)
3. **#102** — Replace `Math.random()` with `crypto.getRandomValues` in sync.ts
4. **#103** — Enable TypeScript strict mode
5. **#104, #105, #106** — Fix all memory leaks (intervals + rAF)
6. **#107** — Fix boolean useEffect dependencies
7. **#108** — Add error handling to fire-and-forget DB updates
