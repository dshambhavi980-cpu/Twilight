# Privacy Policy

**Last Updated: March 3, 2026**

Twilight Garden ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains in detail what information we collect, how we collect it, why we use it, who we share it with, and how we protect it when you use our mobile application, desktop application, and progressive web app (collectively, the "App").

By using the App, you consent to the practices described in this Privacy Policy. If you do not agree, please discontinue use of the App.

---

## 1. Information We Collect

### 1.1 Account & Profile Information

When you create an account, we collect:

| Data | Required | Purpose |
|------|----------|---------|
| **Email address** | Yes | Account creation, login, password recovery |
| **Password** | Yes (email signup) | Authentication (hashed, never stored in plaintext) |
| **Full name** | Yes | Display name within the App |
| **Avatar photo** | No | Profile picture (uploaded to our servers) |
| **Bio** | No | Personal description shown on your profile |
| **Status text** | No | A short status shown to your partner |
| **Partner nickname** | No | Custom name for your linked partner |

**Authentication methods:** You may sign up using email + password or Google OAuth. When using Google OAuth, we receive your name, email, and profile photo URL from Google.

### 1.2 Health & Cycle Data

The core purpose of the App is cycle tracking and wellness monitoring. We collect:

**Cycle settings:**
- Last period start date
- Average cycle length (default: 28 days)
- Average period length (default: 5 days)
- Irregular cycle flag

**Daily health logs (per day you log):**

| Category | Details |
|----------|---------|
| **Menstrual flow** | Intensity level: spotting, light, medium, or heavy |
| **Moods** | Selection from: calm, happy, energetic, frisky, mood swings, anxious, sad, irritated |
| **Physical symptoms** | Cramps, tender breasts, headache, acne, backache, fatigue, bloating, insomnia, nausea, dizziness, hot flashes, chills, pelvic pain, joint pain, sensory sensitivity |
| **Digestive symptoms** | Bloating, cravings, nausea, gas, diarrhea, constipation, heartburn, indigestion, loss of appetite |
| **Energy level** | High, medium, or low |
| **Sleep quality** | Good, fair, or poor |
| **Sleep hours** | Numeric value |
| **Free-text notes** | Any personal notes you choose to enter |

### 1.3 Chat & Messaging Data

When you use the Love Notes chat feature with your partner, we process:

- **Text messages** between you and your partner
- **Images** you send or receive
- **Voice messages** (audio recordings) you send or receive
- **GIFs** selected from the Giphy library
- **Message metadata**: timestamps, read/delivery status, reactions (emoji), starred/pinned status, reply references, forwarded flag

**Important:** All text messages, images, and voice messages are **end-to-end encrypted** (see Section 5). GIF URLs from Giphy are not encrypted.

### 1.4 Couples & Partner Data

When you use Couples Mode, we collect:

- **Pairing code** used to link accounts
- **Partner roles** (menstruator or supporter)
- **Love code** for unlocking the chat feature
- **Sharing preferences** (whether cycle data is shared with your partner)
- **Ghost Mode status** (whether sharing is currently disabled)

### 1.5 Game Data

When you play any of the 19 interactive games with your partner, we store:

- Game type, current turn, player assignments
- Board/game state (moves, answers, scores)
- Winner and game status (active/ended)

### 1.6 Device & Technical Information

| Data | Purpose |
|------|---------|
| **FCM push token** | Delivering push notifications to your device |
| **Device type** | Android, iOS, web, or desktop — to tailor notification delivery |
| **Device ID** | Identifying which device holds which encryption key |
| **Device name** | Displaying device name in multi-device management |
| **IP address** | Logged by our infrastructure providers (Supabase, Cloudflare) as part of standard web traffic |
| **Browser/OS user agent** | Standard HTTP header collected by servers |

### 1.7 Notification Data

We store in-app notifications including:

- Notification type (reminder, period start prediction, insight, game invite, chat message, partner log update)
- Notification message text
- Read/unread status
- Associated metadata (e.g., game URL, note ID)

### 1.8 Encryption Key Material

For end-to-end encryption, we store:

- Your **public key** (ECDH P-256) in our database, associated with your user ID and device
- An **encrypted backup** of your private key (encrypted with your PIN via PBKDF2) if you choose to set up cloud backup
- **Ephemeral public keys** during QR-based device sync sessions

Your **private key** is stored only on your device in secure native storage and is never transmitted in plaintext.

### 1.9 Shared Insight Cards

When you share an insight card via a public link, we store the card content data, a unique share code, and an expiration date.

---

## 2. Device Permissions

The App may request the following device permissions:

| Permission | Platform | Why We Need It |
|------------|----------|----------------|
| **Internet** | All | Core functionality — connecting to our servers |
| **Camera** | Android, Web | Taking profile photos and capturing images to send in chat |
| **Microphone** | Android, Web | Recording voice messages and audio/video calls with your partner |
| **Push Notifications** | Android 13+, Web, Desktop | Delivering reminders, partner messages, and alerts |
| **Read/Write Storage** | Android (legacy) | Saving exported PDF health reports to your device |
| **Read Media (Images, Video, Audio)** | Android 13+ | Selecting photos and media to send in chat |
| **Modify Audio Settings** | Android | Configuring audio during voice/video calls |
| **Install Packages** | Android | Installing in-app APK updates |

You can revoke any permission at any time through your device settings. Some features will not function without their required permissions.

---

## 3. How We Use Your Information

| Purpose | Data Used |
|---------|-----------|
| **Account management** | Email, name, password, avatar |
| **Cycle tracking & predictions** | Period dates, cycle length, period length |
| **Daily health insights** | Flow, moods, symptoms, sleep, energy |
| **AI-generated wellness tips** | Current cycle phase, cycle day, moods, symptoms, sleep quality, energy level, summarized recent logs (up to 15 days) |
| **AI empathy alerts for partner** | Your cycle phase, moods, symptoms, sleep, energy (framed as partner context) |
| **AI gift recommendations** | Partner's phase, moods, symptoms, energy, sleep |
| **Push notifications** | FCM token, device type, notification content |
| **Local reminders** | Scheduled daily reminders at configurable times |
| **Period predictions** | Notifications 3 days and 1 day before predicted period start |
| **Partner data sharing** | Cycle settings, daily logs, and profile visible to your linked partner |
| **End-to-end encrypted chat** | Messages, images, voice notes between partners |
| **Audio/video calls** | Peer-to-peer WebRTC streams between partners (not recorded) |
| **Game play** | Game state synced in real time between partners |
| **PDF health report export** | Profile info, cycle settings, all daily logs compiled into a downloadable PDF |
| **App updates** | Version checking and update delivery |

---

## 4. Third-Party Services & Data Sharing

We use the following third-party services to operate the App. Each processes data according to their own privacy policies:

### 4.1 Supabase (Backend Infrastructure)

- **What:** Database, authentication, file storage, real-time subscriptions, and serverless edge functions
- **Data processed:** All account data, health logs, encrypted messages, files, and push tokens
- **Region:** Asia Pacific (ap-south-1)
- **Their policy:** [supabase.com/privacy](https://supabase.com/privacy)

### 4.2 Cloudflare (Network Proxy)

- **What:** All traffic between the App and our backend is routed through a Cloudflare Worker
- **Data processed:** All API requests and responses, IP addresses, request headers
- **Their policy:** [cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/)

### 4.3 Google Firebase / FCM (Push Notifications)

- **What:** Firebase Cloud Messaging delivers push notifications to your device
- **Data processed:** FCM device token, notification payload (title, body, notification type)
- **Their policy:** [firebase.google.com/support/privacy](https://firebase.google.com/support/privacy)

### 4.4 Google Gemini AI (AI Insights)

- **What:** Generates wellness tips, empathy alerts, love note suggestions, and gift recommendations
- **Data sent to Gemini:** Cycle phase, cycle day, moods, symptoms, sleep quality, energy level, summarized recent health logs. For love notes: mood category and optional custom prompt
- **Data NOT sent:** Your name, email address, or any other personally identifiable information
- **How:** All requests are made server-side via a Supabase Edge Function — the App never contacts Google Gemini directly
- **Their policy:** [ai.google/privacy](https://ai.google/privacy/)

### 4.5 Giphy (GIF Search & Display)

- **What:** Provides GIF search and trending GIF feeds in the chat
- **Data processed:** Your search queries and IP address (direct client-to-Giphy connection)
- **Content rating:** Filtered to PG-13
- **Their policy:** [giphy.com/privacy](https://giphy.com/privacy)

### 4.6 TURN/STUN Servers (Audio/Video Calls)

- **What:** Relay servers that facilitate peer-to-peer WebRTC calls when direct connections are not possible
- **Providers:** ExpressTurn (primary), Metered OpenRelay (fallback), Google STUN
- **Data processed:** IP addresses and relayed audio/video streams during active calls
- **Note:** Call audio and video are **not recorded or stored** by us or the relay providers. Streams exist only for the duration of the call.

### 4.7 Serper API (Product Search)

- **What:** Web search API used for AI-powered product/gift search recommendations
- **Data processed:** Search queries generated from partner wellness context
- **Their policy:** [serper.dev/privacy](https://serper.dev/privacy)

### 4.8 Other Sharing

- **Partner sharing:** If you enable Couples Mode, your cycle data, daily logs, and profile information are visible to your linked partner. You can disable data sharing at any time using Ghost Mode.
- **Shared insight cards:** If you generate a share link for an insight card, anyone with the link can view it until it expires.
- **Admin access:** App administrators can view user profiles and daily log data for operational and support purposes.
- **Legal requirements:** We may disclose information if required by law, legal process, or to protect the rights, property, or safety of our users or the public.

**We do not sell your personal data to any third party.**

---

## 5. End-to-End Encryption (E2EE)

We implement strong end-to-end encryption to protect your most sensitive data:

### What Is Encrypted

- All **chat messages** (text content)
- All **images** sent in chat
- All **voice messages** sent in chat
- **Daily health log payloads** (encrypted_payload field)
- **Cycle settings payloads** (encrypted_payload field)

### What Is NOT Encrypted

- Profile information (name, email, avatar, bio)
- Game session data
- Notification messages
- GIF URLs from Giphy
- Message metadata (timestamps, read/delivery status, reactions)

### Encryption Details

| Component | Technical Detail |
|-----------|-----------------|
| **Key exchange** | ECDH (Elliptic Curve Diffie-Hellman) using P-256 curve |
| **Message encryption** | AES-GCM with 256-bit keys |
| **Initialization vector** | 12 bytes, randomly generated per message |
| **Media encryption** | Same AES-GCM scheme; IV prepended to ciphertext |
| **PIN backup** | PBKDF2 with 100,000 iterations (SHA-256) + 16-byte random salt → AES-GCM 256-bit |
| **Verification** | SHA-256 fingerprint of both parties' public keys → 60-digit security code |

Your private encryption key never leaves your device unless you explicitly set up a PIN-encrypted cloud backup. Even then, the backup is encrypted with your PIN before upload — we cannot decrypt it.

---

## 6. Data Storage & Retention

### Where Data Is Stored

- **Server-side:** Supabase (hosted on AWS, Asia Pacific region), behind Cloudflare proxy
- **On-device (mobile/desktop):** Encryption private key in native secure storage; cached profile, settings, logs, and recent messages in local storage (cleared on logout); auth session token in native secure storage
- **Browser (web):** localStorage for caching, session data, and UI preferences

### Retention

- Your data is retained for as long as your account exists.
- Cached data on your device is cleared when you log out.
- Shared insight cards expire after their set expiration date.
- You may request full account deletion at any time (see Section 8).

---

## 7. Data Security

We implement multiple layers of security:

- **End-to-end encryption** for chat messages, media, and health log payloads
- **Row Level Security (RLS)** on all database tables — users can only access their own data
- **HTTPS/TLS** for all data in transit
- **Hashed passwords** — we never store plaintext passwords
- **Server-side API keys** — sensitive API keys (Gemini AI, FCM service account) are stored as server-side secrets, not in client code
- **Authenticated API calls** — all server requests require a valid session token
- **Realtime authorization** — real-time data channels enforce authenticated access

---

## 8. Your Rights & Choices

### Access & Correction
You can view and update your profile, health logs, and settings at any time within the App.

### Data Export
You can export a comprehensive PDF report of your profile and all daily health logs from the App.

### Data Deletion
You can request full deletion of your account and all associated data (profile, logs, messages, settings, encryption keys, notifications, game sessions, and couple relationships). Contact us at **privacy@twilightgarden.app**.

### Notification Preferences
- Toggle push notifications on or off in Settings
- Control period reminders and daily logging reminders independently
- Revoke notification permissions at the OS level at any time

### Partner Sharing Controls
- Enable or disable cycle data sharing with your partner using Ghost Mode
- Unlink from your partner at any time
- Chat messages remain end-to-end encrypted regardless of Ghost Mode status

### Withdraw Consent
You may stop using the App at any time. Uninstalling the App removes all locally cached data and encryption keys from your device. Server-side data persists until you request deletion.

---

## 9. Cookies & Local Storage

The App does not use traditional browser cookies. We use **localStorage** and **native secure storage** for the following purposes:

| Storage Key | Data | Purpose |
|-------------|------|---------|
| Cached auth user | Auth user object | Prevents UI flash on app load |
| Cached profile | Name, avatar URL, bio, status | Faster profile rendering |
| Cached couple data | Couple relationship data | Faster couples feature loading |
| Cached messages | Last 50 decrypted messages | Instant chat display |
| Cached settings | Cycle settings | Offline-capable settings display |
| Cached logs | Recent daily logs | Offline-capable log display |
| Onboarding flag | Boolean | Skip onboarding for returning users |
| Theme preferences | UI settings | Dark/light mode, colors, animations |

All cached data is cleared when you sign out.

---

## 10. Service Worker & PWA

The App can be installed as a Progressive Web App (PWA). Our service worker:

- Handles incoming push notification display
- Opens the relevant App screen when you tap a notification
- Does **not** cache assets for offline use
- Does **not** track or collect any additional data

---

## 11. Audio & Video Calls

When you make an audio or video call with your partner:

- Calls are **peer-to-peer** using WebRTC technology
- Audio and video streams are transmitted directly between devices (or via a TURN relay if a direct connection is not possible)
- We do **not** record, store, or have access to call audio or video content
- Call signaling data (offer/answer/connection candidates) is transmitted via real-time channels and is not persisted after the call ends

---

## 12. Children's Privacy

The App is not intended for individuals under the age of 13. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has provided us with personal information, please contact us at **privacy@twilightgarden.app** and we will promptly delete it.

---

## 13. International Data Transfers

Your data may be processed in regions outside your country of residence, including:

- **Asia Pacific (AWS ap-south-1)** — Database and file storage
- **United States** — CDN/proxy, push notifications, AI processing, GIF service, STUN/TURN servers

By using the App, you consent to the transfer and processing of your data in these regions.

---

## 14. Changes to This Privacy Policy

We may update this Privacy Policy periodically. When we make material changes, we will update the "Last Updated" date at the top. We may also notify you via in-app notification for significant changes.

We encourage you to review this policy regularly.

---

## 15. Contact Us

If you have questions about this Privacy Policy, wish to exercise your data rights, or have concerns about your privacy, please contact us at:

**Email:** privacy@twilightgarden.app
