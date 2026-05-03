# 🧘 UniWell - Premium Student Wellness Sanctuary

> [!NOTE]
> **Academic Project Disclaimer**: This application was developed as part of a **Final Year Project**. It is intended for academic and demonstration purposes and is not a commercial product.

**UniWell** is a state-of-the-art student wellness application designed to support university students through the high-pressure academic cycle. Built with a "Liquid Glass" aesthetic inspired by iOS 26, it provides a serene, high-performance environment for mood tracking, stress management, and academic planning.

![UniWell Logo](https://raw.githubusercontent.com/eddiee-jnr/UniWell/main/assets/logo.png)

## ✨ Features

### 💎 Liquid Glass Navigation
A revolutionary floating pill-shaped navigation bar with:
- **70% Frosted Glass Blur** (Adaptive to Light/Dark mode).
- **Specular Top Highlight** for physical depth.
- **Dynamic Active States**: Active icons scale up to 24px with a brightness boost.
- **Perfect Pill Profile**: R40 curvature for a modern, fluid feel.

### 📊 Wellness Dashboard
- **Dynamic Scores**: Real-time wellness and stress averaging.
- **Mood Analytics**: Visual heatmaps and trend lines of your emotional wellbeing.
- **Academic Sync**: High-stress alerts integrated with GIMPA's academic calendar.

### 📅 Academic Flow
- **GIMPA Integrated Calendar**: Pre-loaded with semester milestones (Mid-terms, Finals, Registration).
- **Proactive Reminders**: Smart notifications that trigger based on upcoming high-stress academic periods.

### 🏋️ Exercise Library
- **Micro-habits**: Quick 2-5 minute sessions for box breathing, grounding, and focus.
- **Premium Player**: A dedicated, distraction-free playback environment for wellness sessions.

### 🏢 Campus Support
- **Resource Directory**: Direct access to Campus Security, Counseling, and Health Services.
- **Emergency Help**: One-tap crisis hotline and security contact.

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **State Management**: Zustand (Auth, Mood, Wellness, Tips)
- **Database**: Supabase (Cloud Auth/Sync) & SQLite (Local Persistence)
- **Theming**: Premium Custom Theme System (Light & Dimmed Dark Modes)
- **Icons**: Ionicons & Material Community Icons

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go app on your physical device

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eddiee-jnr/UniWell.git
   cd UniWell
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the application:**
   ```bash
   npx expo start
   ```

## 📁 Project Architecture

```text
src/
├── components/     # UI, Charts, and Forms
├── data/           # Academic calendar and Exercise data
├── hooks/          # Custom hooks (useTheme, useWellnessScore)
├── navigation/     # Modular Stack & Tab Navigators
├── screens/        # Feature-based screen modules
├── services/       # Supabase, Storage, Sync, Notifications
├── store/          # Zustand state management
├── theme/          # Design tokens and color palettes
└── types/          # Centralized TypeScript interfaces
```

---
Developed with ❤️ for students who strive for balance.
