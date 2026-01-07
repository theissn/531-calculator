# 5/3/1 Calculator — Roadmap

## Vision
A focused, purely functional 5/3/1 calculator with light tracking capabilities. No social features, notifications, or gamification. Cloud sync as a long-term goal.

---

## Priority Order (UX First)

### Phase 1: Core UX Improvements ✓

**1.1 Main Lift Set Tracking** ✓
- ~~Add checkboxes to mark working sets as complete~~
- ~~Simple visual feedback (no timer integration like supplemental)~~
- ~~Session-only state (not persisted)~~

**1.2 Mobile Experience** ✓
- ~~Haptic feedback on button presses~~
- ~~Keep screen awake during workout (Wake Lock API)~~
- ~~Lock to portrait orientation~~

**1.3 Plate Calculator** ✓
- ~~Show plates to load per side~~
- ~~Standard bar weight (45lb / 20kg)~~
- ~~User-configurable available plates in settings~~
- ~~Display below each working set weight~~

---

### Phase 2: Tracking Features

**2.1 PR Records** ✓
- ~~Modal popup after tapping AMRAP set~~
- ~~Input field for reps completed~~
- ~~Calculate and display estimated 1RM~~
- ~~Store PR history in IndexedDB~~

**2.2 TM History** ✓
- ~~Log all TM changes with timestamps~~
- ~~Manual updates only (no auto-prompts)~~
- ~~Simple line charts showing TM progression per lift~~
- ~~New "Progress" view/tab for charts~~

**2.3 Workout Notes**
- Optional text field per session
- Store with date in IndexedDB
- View in history/progress section

---

### Phase 3: Accessories

**3.1 Accessory Templates**
- User creates named accessory templates
- Each template contains a list of exercises
- Assign template to use (can switch between them)

**3.2 Accessory Tracking**
- Checklist UI (just check off when done)
- No weight/rep logging
- Reset with each session

---

### Phase 4: Polish

**4.1 Theme Toggle** ✓
- ~~Add light mode option~~
- ~~Toggle in settings (System/Dark/Light)~~
- ~~Persist preference~~
- ~~Keep dark as default~~
- ~~Respect system preference when set to "System"~~

**4.2 Progress Charts**
- Simple line charts for TM over time
- Simple line charts for estimated 1RM over time
- Per-lift view
- All-lifts comparison view

---

### Phase 5: Cloud (6+ Months)

**5.1 Export/Import**
- Export all data to JSON
- Import from JSON backup
- Prerequisite for cloud sync

**5.2 Cloud Sync**
- Account system (auth)
- Sync settings, PRs, TM history across devices
- Conflict resolution strategy

---

## Exclusions (Explicitly Out of Scope)
- Social features (sharing, leaderboards)
- Push notifications / reminders
- Gamification (badges, streaks, achievements)
- Other training programs (5/3/1 only forever)
- Full workout logging (just light tracking)
- Multiple user profiles

---

## Release Strategy
Continuous deployment — ship features as they're ready, no versioned releases.
