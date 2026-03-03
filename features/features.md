# 🌺 Twilight Garden - Complete Feature Matrix

_Twilight Garden is a beautifully designed, offline-first menstrual cycle and relationship tracking ecosystem. This document explicitly defines the boundaries and capabilities of the platform across three core verticals: The Primary User (Menstruator), The Supporter (Partner), and The Intelligence (AI Support)._

---

## 👩🏻‍🦰 The Menstruator (Primary User) Experience

The primary experience is designed to be an absolute sanctuary. It is private, deeply customizable, and operates fundamentally offline. The philosophy is to eliminate clinical charting entirely in favor of an airy, aesthetic ritual.

### 🖼️ Core Aesthetic & Interface Customization

- **Seasons Theme Engine**: Dynamic, handcrafted themes built directly into `index.css` (e.g., _Blush_, _Twilight_) that completely recolor the application interface, text layers, and gradients.
- **Framer Motion Physics**: The entire application utilizes spring-based fluid animations.
  - Transitioning between the history grid and deep-dive lists physically morphs cards through `framer-motion` layout ID routing.
  - Modal entrances and navigation switches employ soft bouncy delays to ease the user experience.
- **Visual Ergonomics Control**: Global toggle states stored dynamically (`animationsEnabled`, `solidNavBg`) allow users affected by motion sensitivity to immediately convert the app to a static, high-visibility mode.

### 🔒 Security, Privacy & The Offline-First Paradigm

- **Zero-Internet Functionality**: The application core does not require an active connection. Data logic writes immediately to an IndexedDB wrapper (`storageAdapter.ts`), meaning the app functions deep in the woods or completely offline.
- **E2E Device Encryption**: Before any data packet ever leaves to touch the cloud (for backups or secure partner sync), the payload is converted using AES device-key encryption. Supabase tables only see hashed blobs.
- **The PIN Lock Mechanism**: Using `PinSetupPrompt.tsx`, users establish a hardware-local combination. The application intercepts routing attempts the moment it opens, forcing a visual numpad lock before the DOM resolves any private data layers.
- **Granular Partner Privacy Control**: The primary user maintains absolute authority over outbound syncing. They can share specific modules (e.g., "Allow partner to see cycle phase only, but hide logged symptoms and moods").

### 📝 Health Tracking & Lifecycle Database

- **Ambient Cycle Dashboard**: Rather than presenting clinical graphs, the main dashboard provides a serene visual representing the current phase (Follicular, Luteal, Menstrual, Ovulation) with a counting prediction.
- **The Daily Ritual Form**: An intuitive, flowing input screen covering multi-dimensional health parameters:
  - _Somatic Inputs_: Bleeding volume, breast tenderness, headaches, bloating, acne.
  - _Psychological Inputs_: Brain fog, focus levels, anxiety, depressive waves, fatigue.
- **Historical Archive (`LogHistory.tsx`)**:
  - A massive, dynamically loading history view utilizing infinite scroll patterns.
  - Toggleable Grid vs. List views optimized for both visual mood-scanning or literal data-reading.
  - Selecting a historic day triggers an immersive pop-up modal showing the exact snapshot of how the user felt precisely on that day relative to their phase.

---

## 👨‍💼 The Partner (Supporter) Experience

Twilight Garden creates an entirely separate, specialized app-environment for the partner. The goal is not to have them analyze random data, but to foster immediate, actionable empathy and to bridge physiological communication gaps.

### 📡 Secure Onboarding & Asymmetrical Syncing

- **The Connect Handshake**: A dedicated flow (`PartnerSignUp` -> `PartnerLogin`) wherein the partner inputs a secure, encoded pairing link provided by the primary user.
- **One-Way Data Diode**: The relationship architecture is strictly asymmetrical. The partner account operates in a pure "Read Only" or "Receive" mode. The database Row Level Security utterly prevents a partner token from ever writing or modifying the primary user's logs.

### 🧠 The Empathy Dashboard

- **Phase Translation Layer**: Instead of showing the partner raw data like "Day 19: Luteal Phase," the dashboard actively acts as an educational interface.
- **Biological "What This Means" Snippets**: The interface displays brief, non-medicalized explanations of what the current phase physically feels like (e.g., _“Energy may be dipping as progesterone rises.”_).
- **Live Mood Stream**: If the menstruator logs sudden anxiety or cramping, the partner's dashboard actively updates to reflect this state shift securely.

### 🔔 Direct Action & Real-Time Broadcasts

- **The Support Ping System**: The primary user has access to quick-action broadcast buttons ("Feeling overwhelmed," "Cramps are bad," "I need hugs/snacks").
- **Native Real-Time Delivery**: These pings bypass traditional sync intervals and trigger immediate `broadcast` notifications globally via WebSockets (`CouplesContext.tsx`).
- **Desktop Notification Integration**: For partners running the `.exe` desktop application in the background while working or gaming, Twilight Garden intercepts these pings and routes them through Rust directly into native Windows toast notifications (`@tauri-apps/plugin-notification`). This ensures immediate attention without requiring the partner to have the app open visually.

---

## 🤖 The Artificial Intelligence Assistant

Twilight Garden utilizes AI not as a generic chatbot, but as an invisible string pulling contextual insight from raw logging data. It prevents users from having to "figure out" what their data means.

### ✨ AI For the Primary User

- **Pattern Recognition Engine**: Once enough cycle data is collected, the AI analyzes phase-shift timing against logged symptoms to deduce predictive triggers (e.g., _“You have logged severe tension headaches exactly 3 days before your period begins for the last 4 cycles.”_).
- **Holistic Suggestions**: When the user triggers an active log containing intense symptoms, the AI generates gentle, highly-specific wellness actions. For instance, suggesting specific herbal teas for cramps, or acknowledging that a sudden drop in mood is deeply connected to natural hormonal drops rather than an external failure.

### 🤝 AI For the Relationship (The Translator)

- **Actionable Partner Prompts**: The most powerful feature of the AI is translating the menstruator's state into _instructions_ for the partner. If the partner opens their dashboard while the primary user is experiencing severe Luteal phase fatigue, the AI generates direct coaching prompts:
  - _“She is likely experiencing rapid energy drops today. Consider taking over dinner responsibilities tonight without asking her what she wants to eat.”_
- **Friction Warnings (Forecasting)**: The AI preemptively notifies the partner of upcoming hormonal valley shifts _before_ they occur. This acts as an emotional buffer:
  - _“The PMS window is likely opening in 48 hours. Communication might require extra patience and grace this weekend.”_
- **Medical Glossary Simplification**: It inherently strips frightening or confusing biological terminology into relatable analogies for the partner, lowering the barrier to empathy.
