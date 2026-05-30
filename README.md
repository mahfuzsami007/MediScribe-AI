# MediScribe AI — React + Vite Project

Built with React 18, Vite, Tailwind CSS v4, React Router v6, Lucide React.

## 🚀 Quick Start in VS Code

### Prerequisites
- Node.js v18+ → https://nodejs.org
- VS Code → https://code.visualstudio.com

Check versions: `node -v` and `npm -v`

### Run the app

```bash
cd mediscribe-react
npm install
npm run dev
```

Open http://localhost:5173 🎉

### Recommended VS Code Extensions
- ES7+ React/Redux Snippets: dsznajder.es7-react-js-snippets
- Tailwind CSS IntelliSense: bradlc.vscode-tailwindcss
- Prettier: esbenp.prettier-vscode
- ESLint: dbaeumer.vscode-eslint

## 🗂️ Project Structure

```
src/
├── components/
│   ├── auth/AuthFlow.jsx             # Register / OTP / Login
│   ├── layout/
│   │   ├── AppLayout.jsx             # Sidebar shell
│   │   └── Sidebar.jsx               # Collapsible nav
│   ├── preview/PrescriptionPreview.jsx  # A4 Rx card (compact + full-page)
│   ├── ui/
│   │   ├── StatusPill.jsx
│   │   ├── Toast.jsx
│   │   └── WaveForm.jsx
│   └── voicerx/
│       ├── RxStepper.jsx             # Step progress bar
│       └── VoiceStep.jsx             # Voice capture card (resets per step)
├── context/AppContext.jsx            # Global state
├── data/mockData.js                  # Demo data + mock AI
├── pages/
│   ├── DashboardPage.jsx
│   ├── HistoryPage.jsx
│   ├── LandingPage.jsx
│   ├── ProfilePage.jsx
│   ├── TemplatesPage.jsx
│   └── VoiceRxPage.jsx
├── App.jsx                           # Router
├── index.css                         # Tailwind + animations
└── main.jsx
```

## Routes
| Route | Page |
|-------|------|
| / | Landing |
| /login | Sign in |
| /register | Register + OTP |
| /dashboard | Stats + patients |
| /prescription | Voice Rx workflow |
| /history | Patient history |
| /templates | Templates |
| /profile | Profile settings |

## Bug Fixes in this version

**Fix 1 — Recorder resets to Ready on each new step**
VoiceStep uses `key={cur}` so React remounts it on step change → useState('idle') resets.

**Fix 2 — Large prescription preview on completion**
PrescriptionPreview has a `fullPage` prop. On the preview step it renders as a wide centered A4 card with a New Prescription CTA below.

## Scripts
```bash
npm run dev      # Dev server → http://localhost:5173
npm run build    # Production build
npm run preview  # Preview build
```

## Connect Supabase Auth
```bash
npm install @supabase/supabase-js
```
Replace mock submit() in AuthFlow.jsx with supabase.auth.signUp() etc.

## Connect Real Voice (Whisper)
Replace MOCK_AI in src/data/mockData.js with OpenAI Whisper API calls.
