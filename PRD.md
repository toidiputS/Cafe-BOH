# BRIDGE BOH: PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Project: Bridge Café Operations Hub (Station Zero)

---

### 1. Executive Summary
**Bridge BOH** is a high-performance, real-time command center designed for the high-pressure environment of the Bridge Café kitchen. It replaces traditional paper tickets and verbal chaos with a synchronized digital workflow. The system prioritizes speed, clarity, and station-to-station accountability.

---

### 2. User Personas & Views

| Persona | Core Responsibility | Primary View |
| :--- | :--- | :--- |
| **Waitstaff** | Order entry & tabletop management | **Waiter Board**: Live order tracking & ready-for-pickup notifications. |
| **Head Chef** | Line management & pacing | **KDS (Kitchen Display System)**: Master ticket flow & station firing. |
| **Prep/Line Cook** | Item preparation | **Station View**: Filtered feed of specific items (e.g., just Grill or just Fry). |
| **Expeditor (Expo)** | Quality control & tray assembly | **Expo Dashboard**: Final check-off and "Bump" to servers. |
| **Manager** | Operational oversight | **Manager Panel**: Live revenue, occupancy, and staff activity logs. |
| **Takeout Host** | Third-party & phone order flow | **Takeout Board**: Tracking packaging status and customer hand-off. |

---

### 3. Core Functional Requirements

#### 3.1 Real-Time Kitchen Display System (KDS)
- **Ticket Pulse**: Tickets must change color/pulse based on age (e.g., green < 10m, amber < 15m, red pulse > 20m).
- **Relational Firing**: Items within a ticket can be individually "fired" or marked "ready."
- **Atomic Bumping**: A ticket cannot be bumped to "Ready" until all mandatory items are checked off.

#### 3.2 Integrated Messaging (Station Comms)
- **Targeted Transmissions**: A cook can message "Expo" directly without leaving their station.
- **Order Linking**: Messages can be "attached" to a specific Ticket ID for context.
- **Read Receipts**: Visual confirmation when a station has acknowledged a request.

#### 3.3 Managerial Intelligence
- **Live Occupancy**: Real-time map of table statuses (Vacant, Ordering, Seated).
- **Staff Feed**: A non-intrusive stream of "Who did what" (e.g., "Sarah bumped Table 4").
- **Revenue Mock-up**: Calculated live totals based on delivered tickets.

---

### 4. Design Intent (The "Brutalist Kitchen" Aesthetic)
- **High Contrast**: Pure black (#0A0A0A) backgrounds with high-viz accents (Amber-500, Green-500).
- **Legibility First**: Heavy use of Mono fonts (JetBrains Mono) for Table numbers and quantities.
- **Touch Targets**: 44px minimum for all KDS "Bump" and "Fire" buttons to accommodate gloved or greasy hands.
- **Motion**: Subtle layout transitions (`motion/react`) to ensure cooks don't lose where a ticket moved when one is bumped.

---

### 5. Technical Stack
- **Frontend**: React 19 + Vite + Tailwind CSS.
- **State Management**: Zustand (Shared real-time state).
- **Backend/Realtime**: Supabase (PostgreSQL + Realtime Channels).
- **Authentication**: Supabase Magic Link (optimized for tablet/station login).

---

### 6. Roadmap
- **Phase 1**: Core Auth & KDS Logic (Complete).
- **Phase 2**: Messaging & Managerial Analytics (Complete).
- **Phase 3**: Inventory integration & 86-list sync (Planned).
- **Phase 4**: Customer-facing "Order Ready" SMS gateway (Planned).
