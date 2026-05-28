# Shivam Jangid — AI Backend Engineer Portfolio

An immersive, "Terminal Noir" single-page portfolio showcasing AI backend engineering experience, scalable system design, and full-stack projects.

## 🚀 Frontend Tech Stack

This frontend is built for extreme performance, smooth animations, and a sleek developer-centric aesthetic.

* **Core Framework**: React (via Vite)
* **Language**: TypeScript
* **Routing**: React Router DOM (`react-router-dom`)
* **Styling**: Tailwind CSS (with a custom CSS-variable driven theme system)
* **State Management**: Zustand (for persistent theme state)
* **Animations**: 
  * Framer Motion (for declarative reveal and layout animations)
  * GSAP (for scroll-triggered timeline animations)
  * Lenis (for buttery smooth scrolling)

## 📁 Folder Structure

The application follows a highly modular, scalable, and feature-driven architecture:

```text
frontend/
├── public/           # Static public assets
├── src/
│   ├── assets/       # Media files (images, videos)
│   ├── components/   # Reusable, stateless UI components (Button, Card, Terminal, etc.)
│   ├── config/       # Centralized data files (experience, skills, projects, profile, metrics)
│   ├── context/      # React Context providers (ThemeProvider, LenisContext)
│   ├── hooks/        # Custom React hooks (useTypingEffect, useScrollReveal, useReducedMotion)
│   ├── layouts/      # High-level layout wrappers (MainLayout, Navbar, Footer)
│   ├── pages/        # Route-level components (Home, ProjectDetails)
│   ├── sections/     # Modular landing page sections (Hero, Experience, TechStack, Impact)
│   ├── stores/       # Global state stores (Zustand themeStore)
│   ├── styles/       # Global CSS (theme tokens, keyframes, base styles)
│   └── utils/        # Utility functions (cn for Tailwind merging, animationHelpers)
├── package.json      # Dependencies and npm scripts
├── tailwind.config.ts# Tailwind design system configuration
└── vite.config.ts    # Vite bundler settings
```

## 🎨 Theme System

The portfolio features a robust theme switching architecture:
- `data-theme` attribute is injected onto the `<html>` tag to prevent Flash of Unstyled Content (FOUC).
- Supports the default `terminal-noir` theme along with 5 MAANG-inspired color overrides (Meta, Apple, Amazon, Netflix, Google).
- All colors and animation speeds are tied to global CSS variables defined in `src/styles/theme.css`.

## ⚙️ Running Locally

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Build for production: `npm run build`
