# Lost Then Found — Complete Website Guide

> **A comprehensive guide to every feature, page, workflow, and process in the Lost Then Found platform for Pleasant Valley High School (PVHS).**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Getting Started — Running the Website](#3-getting-started--running-the-website)
4. [User Accounts & Authentication](#4-user-accounts--authentication)
5. [Admin Access & Unlocking](#5-admin-access--unlocking)
6. [Page-by-Page Breakdown](#6-page-by-page-breakdown)
   - [Home Page](#61-home-page)
   - [Search / Browse Page](#62-search--browse-page)
   - [Report Lost Item](#63-report-lost-item)
   - [Report Found Item](#64-report-found-item)
   - [Item Details](#65-item-details)
   - [Claim Item](#66-claim-item)
   - [User Dashboard](#67-user-dashboard)
   - [Admin Dashboard](#68-admin-dashboard)
   - [About](#69-about)
   - [FAQ](#610-faq)
   - [Documentation](#611-documentation)
   - [Sources](#612-sources)
   - [Accessibility](#613-accessibility)
   - [Privacy Policy](#614-privacy-policy)
   - [Terms of Service](#615-terms-of-service)
7. [Complete User Workflows](#7-complete-user-workflows)
   - [Student Loses an Item](#71-workflow-a-student-loses-an-item)
   - [Someone Finds an Item](#72-workflow-someone-finds-an-item)
   - [Claiming a Found Item](#73-workflow-claiming-a-found-item)
   - [Admin Reviews & Approves](#74-workflow-admin-reviews--approves)
   - [Item Return & Rating](#75-workflow-item-return--rating)
8. [AI-Powered Features](#8-ai-powered-features)
9. [Navigation & Layout](#9-navigation--layout)
10. [Data Categories & Constants](#10-data-categories--constants)
11. [Internationalization (i18n)](#11-internationalization-i18n)
12. [Backend Architecture](#12-backend-architecture)
13. [File Structure Overview](#13-file-structure-overview)

---

## 1. Project Overview

**Lost Then Found** is a full-stack lost-and-found web application built for Pleasant Valley High School (PVHS) as an FBLA 2025–2026 project. It digitizes the entire lost-and-found workflow — from reporting lost or found items, through AI-powered matching, claim verification, admin moderation, to item return confirmation and user feedback.

### Key Goals
- **Make item recovery faster** by allowing students to search, filter, and claim found items online.
- **Reduce administrative burden** by providing staff a moderation dashboard with smart queues and risk scoring.
- **Ensure trust and privacy** with verified claims, ownership proof, consent checkboxes, and audit logging.
- **Demonstrate accessible, responsive, modern web design** with internationalization support.

### Target Users
| Role | Description |
|------|-------------|
| **Students** | Report lost items, browse found items, submit claims, track status |
| **Staff / Finders** | Report found items with photos and details |
| **Administrators** | Approve/reject items and claims, manage lost reports, view audit logs |

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 with Vite |
| **Routing** | React Router v6 (HashRouter) |
| **State Management** | TanStack Query (React Query) for server state |
| **UI Components** | Radix UI primitives (shadcn/ui) |
| **Animation** | Framer Motion (with reduced-motion support) |
| **Styling** | Tailwind CSS |
| **Internationalization** | react-i18next |
| **Charts** | Recharts (bar charts, pie charts) |
| **Backend** | Express.js with Mongoose (MongoDB) |
| **Dev Server** | Vite dev server with API proxy to Express |

---

## 3. Getting Started — Running the Website

### Prerequisites
- Node.js (v18 or later)
- npm

### Step-by-Step

1. **Install dependencies** (both frontend and backend):
   ```bash
   cd WebCodingDev26
   npm install
   cd backend
   npm install
   cd ..
   ```

2. **Start the backend server** (runs on port 5001):
   ```bash
   cd backend
   node server.js
   ```

3. **Start the frontend dev server** (runs on port 5173):
   ```bash
   # In a separate terminal, from the project root
   npm run dev
   ```

4. **Open the website**:
   Navigate to `http://localhost:5173` in your browser.

> **Note:** The Vite dev server proxies all `/api/*` requests to `http://localhost:5001`, so both servers must be running simultaneously.

---

## 4. User Accounts & Authentication

The app uses a simplified sign-in system with two pre-configured demo accounts:

### Demo Accounts

| Account | Name | Email | Role |
|---------|------|-------|------|
| **Student** | Jordan Kim | jordan.kim@pleasantvalley.edu | Student |
| **Admin** | Avery Patel | avery.patel@pleasantvalley.edu | Admin |

### How to Sign In

1. Click the **"Sign In"** button in the top-right corner of the navigation bar.
2. A dialog appears with two quick-fill demo account buttons:
   - **Student Demo** — Pre-fills Jordan Kim's credentials
   - **Admin Demo** — Pre-fills Avery Patel's credentials
3. You can also manually type any name and email.
4. Click **"Sign In"** to authenticate.

### What Signing In Enables
- Access to **My Dashboard** (User Dashboard)
- Ability to **submit claims** with your name/email auto-filled
- Ability to **file lost reports** linked to your account
- View your personal **notifications**, **claims history**, and **lost reports**

### How to Sign Out
- Click your **profile avatar/name** in the navbar → Select **"Sign Out"**

---

## 5. Admin Access & Unlocking

Admin access is a **separate layer** on top of regular authentication. Even the admin demo account (Avery Patel) must explicitly unlock admin mode.

### How to Unlock Admin Access

1. **Sign in** with any account (the admin demo account is recommended).
2. Click the **shield icon (🛡️)** in the navigation bar, or find the "Unlock Admin" option in the user menu.
3. An **Admin Access Dialog** appears asking for a password.
4. Enter the admin password: **`PVHS-Admin-2026`**
5. Click **"Unlock Admin"**.
6. A success toast confirms admin mode is active.

### What Admin Access Enables
- Access to the **Admin Dashboard** (`/AdminDashboard`)
- The navbar shows an "Admin Dashboard" link
- The Search page shows **both** found items and lost reports (non-admins only see lost reports)
- Record type toggle filters appear (All / Lost / Found)

### Admin Mode Toggle
Once unlocked, the admin can switch between **Admin Mode** and **Student Mode** via the navbar, which changes what's visible across the app.

---

## 6. Page-by-Page Breakdown

### 6.1 Home Page
**URL:** `/#/Home`

The landing page and entry point for all users.

**What It Contains:**
- **Hero section** with animated floating background paths (SVG animation)
- **Brand header**: "Lost Then Found · PVHS" with tagline
- **Quick search bar**: Type a keyword and click "Search Inventory" to jump directly to filtered search results
- **Two primary action buttons**:
  - 🔶 **"I lost something"** → Navigates to `/Search?type=lost` to browse lost reports
  - 🔵 **"I found something"** → Navigates to `/ReportFound` to submit a found item
- **Dashboard shortcut section** at the bottom:
  - If signed in as admin in admin mode: Shows "Moderator Workspace Active" with link to Admin Dashboard
  - If signed in as student: Shows "My Dashboard" link
  - If not signed in: Shows link to Documentation page

---

### 6.2 Search / Browse Page
**URL:** `/#/Search`

The central browsing and filtering hub for all records.

**What It Contains:**

1. **Search bar** — Full-text search across title, description, brand, color, location, tags, and more
2. **Filters panel** (accessible via the "Filters" button or slide-out drawer):
   - **Category**: Electronics, Clothing, Accessories, School Supplies, Sports Equipment, Food & Containers, Keys & IDs, Bags & Cases, Personal Items, Other
   - **Color**: Black, White, Red, Blue, Green, Yellow, Orange, Purple, Pink, Brown, Gray, Silver, Gold, Multi-color
   - **Location**: 20 PVHS locations (Gymnasium, Cafeteria, Library, etc.)
   - **Sort**: Newest first / Oldest first
   - **Record Type** (admin only): All / Lost / Found
3. **Quick filter tags** — One-click category buttons (Electronics, Clothing, Keys & IDs, Bags & Cases)
4. **View mode toggle** — Switch between **List view** and **Grid view**
5. **Results count** and active filter badges
6. **Item cards** — Each showing:
   - Photo thumbnail
   - Title and status badge
   - Description snippet
   - Category, color, location, date
   - Click to navigate to Item Details
7. **Lost item CTA** — Banner at the bottom encouraging users to file a lost report if their item isn't listed

**How Filtering Works:**
- Filters are applied client-side in real-time
- Multiple filters combine (AND logic)
- Active filters show as removable badges
- "Clear All" button resets everything

---

### 6.3 Report Lost Item
**URL:** `/#/ReportLost`

A multi-step wizard for students to report items they've lost.

**Step 1 — Item Identity:**
- Item type/name (required) — e.g., "Blue Nike Backpack"
- Category dropdown
- Color dropdown
- Brand (text input)
- Reference photo upload (optional)

**Step 2 — Time & Place:**
- Date lost (required, date picker)
- Last seen location (dropdown of PVHS locations)
- Urgency level: Low / Medium / High / Critical
- Additional notes (free text)

**Step 3 — Verification & Contact:**
- Detailed description (required)
- Full name (required)
- Email address (required)
- Student ID (optional)
- Accuracy confirmation checkbox (required)
- Submit button

**After Submission:**
1. A **loading screen** appears: "Scanning database for potential matches..." with a progress bar
2. The AI matching engine runs, comparing the lost report against all found items
3. **Results page** shows:
   - If matches found: Cards showing each potential match with confidence percentage, match reasons (category match, color match, etc.), and "View" buttons
   - If no matches: A message saying staff will be notified

**Visual Progress Tracker:**
A 3-step progress bar at the top shows which step the user is on, with checkmarks for completed steps and a colored progress line.

---

### 6.4 Report Found Item
**URL:** `/#/ReportFound`

A multi-step form for anyone who finds an item on campus.

**Step 1 — Item Identity:**
- Item title (required) — e.g., "Black Hydro Flask Water Bottle"
- Category (required, dropdown)
- Subcategory (text input)
- Color (dropdown)
- Brand (text input)
- Condition: Excellent / Good / Fair / Damaged

**Step 2 — Time & Place:**
- Date found (required)
- Time found
- Location found (required, dropdown)
- Storage location (where the item is being kept)

**Step 3 — Photos & Details:**
- Photo upload (up to 3 photos)
- Detailed description
- Distinguishing features (scratches, stickers, initials, etc.)
- AI-generated description enhancement
- AI-generated tags

**Step 4 — Finder Contact & Submission:**
- Finder name
- Finder email
- Finder role (student / staff / visitor)
- Consent checkbox
- Submit button

**After Submission:**
- Duplicate detection runs to check for similar existing items
- If a duplicate is detected, a warning is shown with a link to the existing item
- The item enters "Pending Review" status and appears in the admin moderation queue
- A unique item code is generated (e.g., `FB-2026-A3K7`)
- Success confirmation page with links to view the item or submit another

---

### 6.5 Item Details
**URL:** `/#/ItemDetails?id={item_id}`

A full detail view for any found item.

**What It Shows:**
- **Photo gallery** — Full-size main photo
- **Status badge** (Pending Review / Approved / Claimed / Returned / Archived)
- **Item code** (e.g., FB-2026-HF82)
- **Category and subcategory** badges
- **Title** and detailed description
- **AI-enhanced description** (italic, labeled "AI Enhancements")
- **Metadata grid**:
  - Location found
  - Date & time found
  - Color
  - Brand
  - Condition
  - Storage location (admin only)
  - Finder information (admin only)
- **Tags** — Clickable keyword badges
- **Distinguishing features** section
- **Claim button** — "Claim This Item" navigates to the claim form (only for approved items)
- **User reviews/ratings** section (if any completed claims have left ratings)

---

### 6.6 Claim Item
**URL:** `/#/ClaimItem?id={item_id}`

The ownership verification and claim submission form.

**Layout:**
The page has a **two-column layout**:
- **Left column** (sticky): Item photo, title, status, description, and a "Review Flow" guide explaining the 3-step process
- **Right column**: The claim form

**Form Sections:**

**Section 1 — Your Information:**
- Full name (required, auto-filled if signed in)
- Email (required, auto-filled if signed in)
- Student ID (optional)

**Section 2 — Ownership Verification:**
- Reason for claim (required) — "Explain why you believe this is your item"
- Identifying details — "Describe unique marks, contents, or features only the owner would know"
- Supporting photo upload (optional proof of ownership)
- Pickup availability — When you can pick up the item

**Section 3 — Consent & Submit:**
- Truthfulness checkbox (required)
- **Slide-to-submit button** — A special interactive button where you drag a slider to confirm submission (prevents accidental submissions)

**After Submission:**
- The AI **risk scoring engine** evaluates the claim:
  - Checks if the reason is detailed enough
  - Checks if identifying details are provided
  - Checks if proof photo is uploaded
  - Checks if the brand name is mentioned
  - Assigns a risk score (0–92) and risk flags
- The item status changes to "Claimed"
- The claim enters the admin review queue
- A confirmation page appears with links to "View My Claims" and "Back to Search"

---

### 6.7 User Dashboard
**URL:** `/#/UserDashboard`

A personal command center for signed-in users.

**Requires:** Sign-in (shows a sign-in prompt if not authenticated)

**Quick Stats Grid (3 cards):**
| Stat | Description |
|------|-------------|
| **Lost Reports** | Total number of lost item reports filed |
| **Active Claims** | Claims currently in progress (not completed/rejected) |
| **Unread Alerts** | Number of unread notifications |

**Three Tabs:**

**Tab 1 — My Lost Reports:**
- Lists all lost reports filed by the user
- Each card shows: photo thumbnail, item type, status badge, description, reported date, location
- **AI Match Suggestions**: If the matching engine found potential matches, they appear as clickable cards in a purple "AI-Suggested Found Matches" section with item thumbnails and "→" arrows to view each match

**Tab 2 — My Claims:**
- Lists all claims the user has submitted
- Each card shows: item photo, claim status, item title, submission date, claim reason
- **Admin Notes**: If an admin has added notes to the claim, they appear in a blue callout box
- **Pickup Confirmation**: For approved claims, a green "Have you received your item?" section with a "Confirm Received" button
- **After Confirmation**: Shows a green "Confirmed received on [date]" badge
- **Star Rating & Review**: After confirming receipt, users can:
  - Rate the experience 1–5 stars (clickable star buttons with hover effects)
  - Write a text review
  - Submit the rating (goes to "pending" review by admin)
  - Review status badges: Pending / Approved / Rejected

**Tab 3 — Notifications:**
- Chronological list of all notifications
- Unread notifications are highlighted with a blue background
- Clicking an unread notification marks it as read
- Each shows: icon, title, message, date

---

### 6.8 Admin Dashboard
**URL:** `/#/AdminDashboard`

The comprehensive administration hub. Protected by the `AdminRouteGuard`.

**Requires:** Sign-in + Admin access unlocked

**Top Stats Row (3 colored cards):**
| Stat | Color | Description |
|------|-------|-------------|
| **Pending Items** | Amber | Found items awaiting review |
| **Pending Claims** | Indigo | Claims awaiting verification |
| **Open Reports** | Sky | Active lost reports |

**Three Tabs:**

**Tab 1 — Command Center (Overview):**
- **4 stat panels**: Total Items, Pending Review, Items Returned, Active Claims (with helper text)
- **Items by Category** bar chart (Recharts) — Shows distribution of found items across categories
- **Status Distribution** pie chart — Shows breakdown of Pending/Approved/Claimed/Returned items with a legend
- **Return Rate** percentage
- **Recent Activity** feed — Latest audit log entries showing admin actions with timestamps

**Tab 2 — Moderation Queue:**
Split into two side-by-side columns:

*Left Column — Found Items Review:*
- Search bar to filter items
- Status filter dropdown (All / Pending Review / Approved / Claimed / Returned / Archived)
- Item cards showing: photo, title, status, description, location, date, finder name
- **"Review" button** on each card opens a detail dialog:
  - Full item photo and details
  - Location and date info panels
  - Description and AI-enhanced description
  - **Status update dropdown** — Change status directly
  - **Flag/Unflag button** — Flag suspicious items
  - **Admin note textarea** — Add internal notes
  - **Quick action buttons** (for pending items): Reject / Approve
  - **Delete button** — Permanently remove item

*Right Column — Claims Verification:*
- Search bar to filter claims
- Claim cards showing: item photo, claimant name/email, claim reason, status, risk score badge, proof photo indicator
- **Risk score badges**: Color-coded (green <40, amber 40-69, red 70+)
- **Risk flags**: Visual badges (e.g., "vague reason", "missing identifying details", "no proof photo")
- **Star ratings**: If the claimant left a rating, stars are displayed
- **"Review" button** opens a detail dialog:
  - Claimant info (name, email, student ID)
  - Current status and status actions
  - Claim reason and identifying details
  - Proof photo (if uploaded)
  - Risk score panel with flags
  - **Action buttons**: Approve / Reject / Mark Under Review / Request More Info / Complete Hand-off
  - **Admin notes textarea**
  - **Claimant rating review**: Approve or reject the claimant's star rating/review
  - **Received confirmation** date (if claimant confirmed pickup)

**Tab 3 — Reference Desk (Lost Reports):**
- Summary card with total report count
- Each report card shows:
  - Photo thumbnail
  - Item type and status badge
  - AI match count badge (if matches exist)
  - Description
  - Contact name, date lost, last seen location
  - Urgency badge (Low / Medium / High / Critical)

---

### 6.9 About
**URL:** `/#/About`

Project overview page explaining the goals, architecture, and technical decisions.

**Contains:**
- Project mission statement
- 4 highlight cards: Real school workflow, Intelligent matching, Privacy-aware design, Split frontend/backend
- Technical snapshot: React 18, TanStack Query, Radix UI, Framer Motion, Spring Boot API
- FBLA 2025–2026 context card

---

### 6.10 FAQ
**URL:** `/#/FAQ`

Frequently asked questions in collapsible accordion format.

Covers: How to report items, how claiming works, how long items are kept, privacy, admin contact info, etc.

---

### 6.11 Documentation
**URL:** `/#/Documentation`

Technical project documentation for judges and reviewers.

---

### 6.12 Sources
**URL:** `/#/Sources`

Citations and attributions for all third-party libraries, assets, and resources used.

---

### 6.13 Accessibility
**URL:** `/#/Accessibility`

Accessibility statement explaining WCAG compliance efforts, keyboard navigation, screen reader support, reduced motion, color contrast, and semantic HTML usage.

---

### 6.14 Privacy Policy
**URL:** `/#/Privacy`

Privacy policy detailing what data is collected, how it's stored, and user rights.

---

### 6.15 Terms of Service
**URL:** `/#/Terms`

Terms and conditions for using the platform.

---

## 7. Complete User Workflows

### 7.1 Workflow: A Student Loses an Item

```
Student notices item is missing
    │
    ▼
Goes to Lost Then Found website (localhost:5173)
    │
    ▼
Clicks "I lost something" on Home page
    │
    ▼
Redirected to Search page filtered by lost reports
    │
    ▼
Browses existing lost reports to see if already filed
    │
    ├── Found their item listed? → Views Item Details → Submits a Claim
    │
    └── Not found? → Clicks "Report a Lost Item" banner
            │
            ▼
        Fills out 3-step Report Lost form:
        Step 1: Item type, category, color, brand, optional photo
        Step 2: Date lost, location, urgency, notes
        Step 3: Description, contact info, student ID, consent
            │
            ▼
        AI Matching Engine scans all found items
            │
            ├── Matches found → Shown potential matches with confidence %
            │   Student can click "View" on any match → Goes to Item Details
            │
            └── No matches → Notified that staff will watch for it
            │
            ▼
        Report saved with status "open" (or "matched" if matches found)
        Appears in student's Dashboard under "My Lost Reports"
        Appears in Admin Dashboard under "Reference Desk"
```

### 7.2 Workflow: Someone Finds an Item

```
Person finds an item on campus
    │
    ▼
Goes to Lost Then Found → Clicks "I found something"
    │
    ▼
Fills out 4-step Report Found form:
    Step 1: Title, category, subcategory, color, brand, condition
    Step 2: Date found, time, location, storage location
    Step 3: Upload up to 3 photos, description, distinguishing features
    Step 4: Finder name, email, role, consent checkbox
    │
    ▼
On submit:
    1. Duplicate detection runs against existing items
    2. AI generates enhanced description and tags
    3. Unique item code assigned (e.g., FB-2026-A3K7)
    4. Item created with status "pending_review"
    │
    ▼
Item enters Admin Moderation Queue
Admin receives it in their "Found Items Review" panel
```

### 7.3 Workflow: Claiming a Found Item

```
Student finds a matching item (via Search, AI match, or browsing)
    │
    ▼
Clicks item → Goes to Item Details page
    │
    ▼
Clicks "Claim This Item" button
    │
    ▼
Redirected to Claim Item page (two-column layout)
    Left: Item details as reference
    Right: Claim form
    │
    ▼
Fills out claim form:
    - Name and email (auto-filled if signed in)
    - Student ID
    - Reason for claim (why they believe it's theirs)
    - Identifying details (unique marks only owner would know)
    - Optional proof photo
    - Pickup availability
    - Truthfulness checkbox
    │
    ▼
Drags the "Slide to Submit" button to confirm
    │
    ▼
AI Risk Scoring runs:
    - Evaluates claim detail quality
    - Checks for proof photo
    - Checks if brand is mentioned
    - Assigns risk score (0-92) and flags
    │
    ▼
Claim saved with status "submitted"
Item status changes to "claimed"
    │
    ▼
Claim appears in:
    - Student's Dashboard → "My Claims" tab
    - Admin Dashboard → "Claims Verification" panel
```

### 7.4 Workflow: Admin Reviews & Approves

```
Admin signs in → Unlocks admin access (PVHS-Admin-2026)
    │
    ▼
Opens Admin Dashboard → Moderation Queue tab
    │
    ▼
═══ FOUND ITEMS REVIEW ═══
    │
    ▼
Sees pending items → Clicks "Review" on an item
    │
    ▼
Review dialog opens showing:
    - Photo, title, status
    - Location, date, finder info
    - Description (original + AI-enhanced)
    │
    ▼
Admin can:
    ✅ Approve → Item becomes publicly visible in Search
    ❌ Reject → Item archived
    🚩 Flag → Marks item for further review
    📝 Add admin note → Internal comment saved
    🗑️ Delete → Permanently remove
    │
    ▼
═══ CLAIMS VERIFICATION ═══
    │
    ▼
Sees pending claims → Clicks "Review"
    │
    ▼
Review dialog shows:
    - Claimant info and student ID
    - Claim reason and identifying details
    - Proof photo (if uploaded)
    - Risk score with colored indicator
    - Risk flags (e.g., "vague reason", "no proof photo")
    │
    ▼
Admin can:
    ✅ Approve → Claim approved, student notified
    ❌ Reject → Claim rejected, item goes back to "approved"
    🔍 Mark Under Review → Intermediate status
    ❓ Request More Info → Student prompted for details
    ✔️ Complete Hand-off → Final confirmation item was physically returned
    📝 Add admin notes
```

### 7.5 Workflow: Item Return & Rating

```
Admin approves a claim
    │
    ▼
Student sees claim status "Approved" in their Dashboard
    │
    ▼
Student picks up item from the office
    │
    ▼
In Dashboard → Claims tab, clicks "Confirm Received"
    │
    ▼
Claim status → "completed"
Item status → "returned"
Confirmation date recorded
    │
    ▼
Star Rating section appears:
    │
    ▼
Student clicks 1-5 stars and writes optional review
    │
    ▼
Clicks "Submit Rating"
    │
    ▼
Rating status → "pending" (awaiting admin approval)
    │
    ▼
Admin sees rating in Claims review dialog
    │
    ▼
Admin can Approve or Reject the rating
    │
    ├── Approved → Rating becomes visible on the Item Details page
    │
    └── Rejected → Student can re-submit with different content
```

---

## 8. AI-Powered Features

The app includes several AI-like features powered by **deterministic heuristic algorithms** (no external API calls needed):

### 8.1 Lost-to-Found Matching Engine
**Triggered when:** A lost report is submitted

**How it works:**
1. Extracts keywords from the lost report (item type, description, category, brand, color, location)
2. Compares against all found items in the database
3. Scoring breakdown:
   - Category match: +24 points
   - Brand match: +18 points
   - Location match: +16 points
   - Color match: +15 points
   - Date proximity (≤2 days): +12 points / (≤5 days): +6 points
   - Description keyword overlap: up to +28 points
4. Items scoring >20 points are returned as matches (max 5)
5. Results shown with confidence percentage and reason tags

### 8.2 Claim Risk Scoring
**Triggered when:** A claim is submitted

**Scoring factors:**
| Factor | Risk Added |
|--------|-----------|
| Vague reason (< 8 words) | +24 |
| No identifying details | +20 |
| No proof photo | +12 |
| Brand not mentioned in reason | +8 |
| Base score | +18 |

Risk scores are capped at 92. Visual color coding:
- 🟢 Green (< 40): Low risk
- 🟡 Amber (40–69): Medium risk
- 🔴 Red (70+): High risk

### 8.3 Duplicate Detection
**Triggered when:** A found item is submitted

Compares the new item against existing items using keyword overlap, category, and color matching. If similarity score exceeds 45, a duplicate warning is shown.

### 8.4 Auto-Tag Generation
**Triggered when:** A found item is submitted

Extracts meaningful keywords from the title and description, filters out stop words, and generates up to 6 tags automatically.

### 8.5 Description Cleanup
Automatically formats and sentence-cases descriptions for consistency.

---

## 9. Navigation & Layout

### Navbar
- **Logo/Brand**: "Lost Then Found" — links to Home
- **Navigation links**: Home, Search, Report Found
- **User section** (right side):
  - Not signed in: "Sign In" button
  - Signed in: User avatar, name, and dropdown menu
    - My Dashboard
    - Admin Dashboard (if admin)
    - Sign Out
  - Admin shield icon for unlocking admin access
- **Language switcher**: Switch between English and Spanish
- **Mobile**: Hamburger menu with slide-out drawer

### Footer
- Column 1: Brand logo and tagline
- Column 2: Quick links (Home, Search, Report Found, Report Lost)
- Column 3: Resources (About, FAQ, Documentation, Sources)
- Column 4: Legal (Privacy, Terms, Accessibility)
- Contact info: Email, phone, location
- Copyright notice

---

## 10. Data Categories & Constants

### Item Categories
| Value | Label |
|-------|-------|
| electronics | Electronics |
| clothing | Clothing & Apparel |
| accessories | Accessories |
| school_supplies | School Supplies |
| sports_equipment | Sports Equipment |
| food_containers | Food & Containers |
| keys_ids | Keys & IDs |
| bags_cases | Bags & Cases |
| personal_items | Personal Items |
| other | Other |

### Campus Locations
Gymnasium, Cafeteria, Library, Main Office, Science Hall, Auditorium, Parking Lot, Bus Loop, Front Desk, Art Room, Music Room, Computer Lab, Hallway (1st/2nd/3rd Floor), Restroom Area, Outdoor Courtyard, Football Field, Track & Field, Student Lounge

### Item Statuses
| Status | Meaning |
|--------|---------|
| `pending_review` | Newly submitted, awaiting admin approval |
| `approved` | Admin-approved, visible to all users |
| `claimed` | Someone has submitted a claim |
| `returned` | Item physically returned to owner |
| `archived` | Rejected or expired item |

### Claim Statuses
| Status | Meaning |
|--------|---------|
| `submitted` | Newly filed claim |
| `under_review` | Admin is reviewing |
| `need_more_info` | Admin requested additional details |
| `approved` | Claim verified, ready for pickup |
| `rejected` | Claim denied |
| `completed` | Item physically handed over |

### Lost Report Statuses
| Status | Meaning |
|--------|---------|
| `open` | Active report, no matches yet |
| `matched` | AI found potential matching items |
| `in_review` | Staff reviewing the report |
| `resolved` | Item found and returned |
| `closed` | Report closed (expired/withdrawn) |

---

## 11. Internationalization (i18n)

The app supports multiple languages via `react-i18next`:
- **English** (default)
- **Spanish** (Español)

The language switcher is in the navbar. All UI text, labels, error messages, status badges, and category/color/location names are translatable.

Translation files are stored in the `src/locales/` directory.

---

## 12. Backend Architecture

### Server
- **Express.js** on port 5001
- **MongoDB** via Mongoose for data persistence
- Seed data loaded on startup for demo purposes

### API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/items` | List all found items |
| `GET /api/entities/{type}` | Generic entity CRUD (FoundItem, LostReport, Claim, Notification, AuditLog) |
| `POST /api/auth/login` | Sign in |
| `POST /api/uploads` | File upload for photos |
| `GET /api/health` | Health check |

### Data Models
- **FoundItem** — Found item records with photos, metadata, AI descriptions
- **LostReport** — Lost item reports with contact info and AI match results
- **Claim** — Ownership claims with risk scores and admin notes
- **Notification** — User notifications (admin actions, match alerts)
- **AuditLog** — Admin action audit trail (who did what, when)
- **User** — User accounts

### Frontend API Client
The `src/api/appClient.js` provides a unified client with:
- API-backed operations (when backend is running)
- LocalStorage fallback (when API is unavailable)
- Response normalization (consistent field naming)
- Entity CRUD methods: `list()`, `filter()`, `create()`, `update()`, `delete()`

---

## 13. File Structure Overview

```
WebCodingDev26/
├── backend/                    # Express.js backend
│   ├── server.js              # Main server entry point
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API route handlers
│   ├── data/                  # Seed data (items, users, reports)
│   └── lib/                   # Utility functions
│
├── public/                    # Static assets
│   ├── items/                 # Item photos (PNG/JPG)
│   └── images/                # Other images
│
├── src/                       # React frontend source
│   ├── App.jsx               # Root component with routing
│   ├── main.jsx              # Entry point
│   ├── api/
│   │   └── appClient.js      # API client with localStorage fallback
│   ├── components/
│   │   ├── admin/            # Admin dashboard components
│   │   │   ├── AdminOverview.jsx
│   │   │   ├── AdminItemsQueue.jsx
│   │   │   └── AdminClaimsQueue.jsx
│   │   ├── auth/             # Authentication components
│   │   │   ├── SignInDialog.jsx
│   │   │   ├── AdminAccessDialog.jsx
│   │   │   └── AdminRouteGuard.jsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── PublicLayout.jsx
│   │   │   └── LanguageSwitcher.jsx
│   │   ├── search/           # Search components
│   │   │   └── ItemCard.jsx
│   │   ├── shared/           # Reusable components
│   │   │   ├── PhotoUploader.jsx
│   │   │   ├── RecordThumbnail.jsx
│   │   │   └── ConsentCheckboxField.jsx
│   │   └── ui/               # UI primitives (shadcn/ui)
│   ├── lib/                  # Utilities and context
│   │   ├── AuthContext.jsx   # Authentication state
│   │   ├── ModeContext.jsx   # Admin/student mode state
│   │   ├── ai-services.js    # AI matching, risk scoring
│   │   ├── constants.js      # App-wide constants
│   │   ├── media.js          # Photo URL helpers
│   │   └── i18n-helpers.js   # Translation helpers
│   ├── locales/              # i18n translation files
│   └── pages/                # Page components
│       ├── Home.jsx
│       ├── Search.jsx
│       ├── ReportFound.jsx
│       ├── ReportLost.jsx
│       ├── ItemDetails.jsx
│       ├── ClaimItem.jsx
│       ├── UserDashboard.jsx
│       ├── AdminDashboard.jsx
│       ├── About.jsx
│       ├── FAQ.jsx
│       ├── Documentation.jsx
│       ├── Sources.jsx
│       ├── Accessibility.jsx
│       ├── Privacy.jsx
│       └── Terms.jsx
│
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── WEBSITE_GUIDE.md          # This file
```

---

## Quick Reference Card

| Action | How To |
|--------|--------|
| **Run the website** | Start backend (`node server.js`) then frontend (`npm run dev`) |
| **Sign in as student** | Click Sign In → Student Demo → Sign In |
| **Sign in as admin** | Click Sign In → Admin Demo → Sign In → Shield icon → Enter `PVHS-Admin-2026` |
| **Report a lost item** | Home → "I lost something" → Fill 3-step form |
| **Report a found item** | Home → "I found something" → Fill 4-step form |
| **Search items** | Navigate to Search → Use filters/search bar |
| **Claim an item** | Search → Click item → Item Details → "Claim This Item" |
| **Check your claims** | Sign in → My Dashboard → Claims tab |
| **Admin: Review items** | Admin Dashboard → Moderation Queue → Click "Review" |
| **Admin: Approve a claim** | Admin Dashboard → Claims Verification → Review → Approve |
| **Confirm item pickup** | My Dashboard → Claims → "Confirm Received" |
| **Leave a rating** | My Dashboard → Claims → Click stars → Submit Rating |
| **Switch language** | Click language switcher in navbar |

---

*Last updated: June 2026*
*Built for FBLA 2025–2026 · Pleasant Valley High School*
