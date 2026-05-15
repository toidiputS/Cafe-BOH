# BRIDGE BOH (Back of House) 🍳
### Real-Time Kitchen Operations Command Center for Bridge Café

Bridge BOH is a high-performance, role-aware restaurant management ecosystem built for speed, accuracy, and cross-staff communication. From the first order entry at the Waitress Board to the final hand-off at the Driver Dispatch, every update is synchronized in real-time.

---

## 🚀 Key Features

### 1. Multi-Station KDS (Kitchen Display System)
*   **Station-Specific Routing**: Intelligent filtering for Head Chef, Prep Cook, Expeditor, and Bartender.
*   **Heat Mapping**: Tickets change visual state and animations based on age to prioritize urgent orders.
*   **Atomic Completion**: Orders are tracked by item-level status (Ready/Pending).

### 2. Smart Connectivity
*   **Station-to-Station Messaging**: Integrated chat for instant coordination (e.g., "86 the salmon" or "Need Expo at Plate").
*   **Voice-to-Text Dictation**: Using the Web Speech API, staff can dictate messages hands-free—critical for busy kitchen environments.
*   **Push Notifications**: System-wide browser notifications for incoming tickets and high-priority transmissions.

### 3. Specialized Service Boards
*   **Waitress Board**: Live tracking of table statuses and pickup notifications.
*   **Takeout/Pickup Hub**: Dedicated flow for phone and third-party orders with SMS readiness indicators.
*   **Driver Dispatch**: Integrated navigation links (Google Maps) and real-time delivery status tracking.

### 4. Directorial Intelligence
*   **Manager Dashboard**: Live business metrics, real-time staff activity feeds, and station oversight.

---

## 🛠 Tech Stack

*   **Runtime**: React 19 + Vite
*   **Styling**: Tailwind CSS (Brutalist High-Contrast Dark Mode)
*   **State**: Zustand (Real-time store management)
*   **Backend**: Supabase (PostgreSQL + Realtime CDC)
*   **Animations**: Motion (formerly Framer Motion)

---

## 🔐 Access & Authentication

### Staff Authorization
The app uses **Supabase Magic Links** for device authorization. Once an email is authorized, the device stays logged in to prevent session timeouts during a shift.

### Default Testing Credentials
For development and demonstration purposes, use the following:
*   **Authorized Emails**: `klutchkanobi@gmail.com`, `staff@bridgecafe.com`
*   **Default Staff PIN**: `1234`
*   **Quick Station Switcher**: Located at the top of the app in development mode for instantaneous role-swapping.

---

## 📂 Project Structure

*   `/src/components`: Role-specific boards (Waitress, Kitchen, Takeout, Driver, Manager).
*   `/src/store`: Zustand stores for centralized state handling.
*   `/src/lib`: Supabase client, Utility functions, and Notification service.
*   `/supabase-schema.sql`: Idempotent database schema for deployment.
*   `PRD.md`: Detailed Product Requirements and design philosophy.

---

## 📜 Development Logs
*   **Microphone Permissions**: Added to `metadata.json` for voice-to-text functionality.
*   **Notification Support**: Added to `metadata.json` and implemented via `Notification API`.
*   **Bypass Modes**: Implemented "Quick Portals" on the sign-in screen to mitigate email rate-limiting during testing.
