# 🎮 VG Tracker (Video Game Tracker)

**VG Tracker** is a sleek, responsive, and feature-rich web application built with **React 19**, **TypeScript**, and **Vite** designed to help gamers manage, organize, and analyze their video game collections. Featuring real-time synchronization via **Supabase**, automated metadata retrieval via the **RAWG API**, advanced charts via **Recharts**, and fully formatted spreadsheet exports via **SheetJS**, VG Tracker delivers a premium dashboard experience for managing your gaming backlog.

---

## ✨ Key Features

- 📂 **Dynamic Backlog Dashboard**
  - Group and track games across four main statuses: `Playing`, `On Hold`, `Backlog`, and `Played`.
  - Interactive game cards featuring cover art, ratings, format tags, and quick-action edits/deletions.

- 🔄 **Real-Time Synchronization & Security**
  - Powered by a **Supabase PostgreSQL** database with real-time replication. Updates sync instantly across active tabs.
  - Secured via Row-Level Security (RLS) policies—users can only view, add, modify, or delete their own data.

- 🔎 **RAWG API Metadata Integration**
  - Auto-suggests titles, platform configurations, genre lists, and fetches cover art images as you type.
  - Locally caches API query results (like platform and genre configurations) for 24 hours in `localStorage` to optimize performance and rate limits.

- 📊 **Rich Gaming Analytics & Charts**
  - **Financial Metrics**: Track total money spent, money made back by selling games, net liquid spent, and cost per hour of entertainment.
  - **Interactive Visual Charts (powered by Recharts)**:
    - *Hours Played*: Historical area timeline of gaming hours grouped by finish dates.
    - *Genre & Platform Distributions*: breakdown of game distribution by genre categories and platform shares.
    - *Playtime Analysis*: Playtime histograms (`0-10h`, `10-30h`, etc.) and average playtime per genre.
    - *Time & Rating Distributions*: Days-to-finish bucket analysis and star rating bar charts (1–10).
    - *Format Distributions*: Pie chart comparing physical, digital, and cloud ownership.
    - *Engagement Rankings*: Top 5 most played games, average rating per platform, and monthly spending over time.

- 📅 **Timeline**
  - Flat chronological timeline grouping non-backlog events (started or finished games) by month.

- 📤 **Excel Export Service**
  - Export your entire game collection to a fully styled and configured `.xlsx` spreadsheet using SheetJS (`xlsx`).

- 👤 **Secure User Profiles**
  - Complete user authentication flow (Sign In, Sign Up, Sign Out).
  - Update user metadata (full name), change emails/passwords, or securely disable the account.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite, React Router DOM (v7)
- **Database & Authentication**: Supabase client (`@supabase/supabase-js`)
- **Data Visualizations**: Recharts
- **Spreadsheet Generation**: SheetJS (`xlsx`)
- **Icons**: Lucide React, React Icons (FaPlaystation, FaXbox, SiNintendoswitch, etc.)
- **Styling**: Vanilla CSS featuring glassmorphism, responsive CSS variables, and modern dark design.
- **Testing Suite**: Vitest, React Testing Library, jsdom

---

## 📁 Project Directory Structure

```text
vg-tracker/
├── src/
│   ├── __tests__/             # Unit and integration tests (Vitest)
│   │   ├── components/        # Tests for buttons, logins, forms, timelines, etc.
│   │   ├── contexts/          # Tests for authentication and game state providers
│   │   └── lib/               # Tests for utility wrappers (RAWG API, Excel export)
│   ├── assets/                # Static assets (logos, fallback images)
│   ├── components/            # UI components and view layouts
│   │   ├── forms/             # Game forms and validation (GameForm)
│   │   ├── game/              # Section containers and Game cards (GameCard)
│   │   ├── profile/           # Profile management and account disable modals
│   │   ├── statistics/        # Recharts visualizations dashboard
│   │   ├── timeline/          # Gaming timeline event cards
│   │   └── ui/                # Reusable design components (Modals, Inputs, Buttons)
│   ├── contexts/              # React Context Providers for global state
│   │   ├── AuthContext.tsx    # Supabase authentication wrapper
│   │   └── GameContext.tsx    # Game inventory state manager & real-time sync
│   ├── hooks/                 # Custom React Hooks
│   │   └── useGameStats.ts    # Memoized stats processing and KPI calculators
│   ├── lib/                   # Integrations and utilities
│   │   ├── exportToExcel.ts   # SheetJS parser for spreadsheet downloads
│   │   ├── platforms.ts       # Platform icon mapping and dynamic colors
│   │   ├── rawg.ts            # RAWG API query wrapper and caching logic
│   │   └── supabase.ts        # Supabase client initializer
│   ├── types/                 # TypeScript type interfaces
│   │   └── game.ts            # Database schema interfaces (Game, Status, Format)
│   ├── App.css                # Global layout styling
│   ├── App.tsx                # Main router setup and view navigation
│   ├── index.css              # Typography, CSS variables, utility glassmorphism
│   ├── main.tsx               # Client entry point
│   └── setupTests.ts          # Vitest setup environment
├── .env.example               # Template for environment variables
├── eslint.config.js           # ESLint workspace configuration
├── tsconfig.json              # TypeScript compilation setup
└── vite.config.ts             # Vite development server and Vitest options
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v18+ recommended) and **npm** installed.

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory and configure it with your API keys:
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the parameters:
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_RAWG_API_KEY=your-rawg-api-key
```
> [!NOTE]
> You can acquire a free RAWG API Key by signing up at [rawg.io/apidocs](https://rawg.io/apidocs).

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Running Tests
Run the automated test suite with Vitest:
```bash
npm run test
```

### 6. Build for Production
Bundle the optimized application assets for deployment:
```bash
npm run build
```

---

## 🗄️ Database Schema Details

For the application to function correctly, your Supabase PostgreSQL instance should have a `games` table configured as follows:

```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    genres TEXT[] NOT NULL DEFAULT '{}',
    platform TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    status TEXT NOT NULL CHECK (status IN ('Playing', 'On Hold', 'Backlog', 'Played')),
    format TEXT NOT NULL CHECK (format IN ('Digital', 'Physical', 'Cloud')),
    purchasing_price NUMERIC,
    selling_price NUMERIC,
    start_date DATE,
    end_date DATE,
    hours_played NUMERIC,
    cover_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own games" 
    ON games 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 📝 License
This project is private and for educational use.
