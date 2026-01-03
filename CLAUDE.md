# CLAUDE.md

## Project Overview
5/3/1 Calculator — a PWA for calculating Jim Wendler's 5/3/1 strength training program weights. Dark monochrome industrial design, mobile-first, offline-capable.

## Tech Stack
- **Build**: Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Storage**: IndexedDB (no backend)
- **PWA**: vite-plugin-pwa with Workbox

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Project Structure
```
src/
├── main.js           # Entry point, initializes app
├── app.js            # State management, exports getState/update/subscribe
├── db.js             # IndexedDB wrapper, DEFAULT_DATA schema
├── calculator.js     # 5/3/1 math (percentages, rounding, set generation)
├── templates.js      # Template definitions (Classic, BBB, FSL, SSL, 5x531)
├── timer.js          # Rest timer (start/stop/format)
├── style.css         # Tailwind imports + custom theme vars
└── ui/
    ├── render.js     # Main view rendering, set tracking
    ├── settings.js   # Settings panel (slide-in)
    └── onboarding.js # First-run 1RM entry
```

## Key Patterns

### State Management
Simple pub/sub in `app.js`:
```js
import { getState, update, subscribe } from './app.js'
subscribe((state) => render())  // Re-render on changes
await update({ settings: {...} })  // Persist to IndexedDB
```

### Data Model (db.js)
```js
{
  lifts: {
    squat: { oneRepMax: 225, template: 'bbb', supplementalPercentage: 50 },
    // bench, deadlift, ohp...
  },
  settings: {
    tmPercentage: 85,      // 80-95
    unit: 'lbs',           // 'lbs' | 'kg'
    roundingIncrement: 5,  // 5, 2.5, 1
    showWarmups: false
  },
  currentWeek: 1,          // 1-4
  isOnboarded: false
}
```

### Templates
Each lift has its own template. Templates defined in `templates.js`:
- `classic` — Main sets only
- `bbb` — 5×10 at supplemental %
- `fsl` — 5×5 at first set %
- `ssl` — 5×5 at second set %
- `5x531` — 5 work sets at top %

### Week Percentages
| Week | Set 1 | Set 2 | Set 3 (AMRAP) |
|------|-------|-------|---------------|
| 1    | 65%×5 | 75%×5 | 85%×5+ |
| 2    | 70%×3 | 80%×3 | 90%×3+ |
| 3    | 75%×5 | 85%×3 | 95%×1+ |
| 4    | 40%×5 | 50%×5 | 60%×5 |

## Important Notes
- Session-only tracking for completed sets (not persisted)
- Deload week (4) hides warmups and supplemental work
- Timer in header is dismissable by tapping
- All weights rounded per user's increment setting
- Bar weight assumed 45lb/20kg (not configurable yet)
