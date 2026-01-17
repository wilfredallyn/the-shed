---
type: project-spec
status: ready-for-breakdown
date: 2026-01-17
author: user
---

# Project: Session Logging

## Problem Statement

The Piano Tutor app currently shows in-session stats (round count, first-try %, mistakes) but doesn't persist detailed practice data. Users cannot analyze patterns in their mistakes over time or identify which specific challenges (chords, intervals, progressions) cause consistent trouble. The desired state is having exportable practice data that enables pattern analysis across sessions.

## Success Criteria

- [ ] Can export practice data and identify which specific chord types/intervals have highest mistake rates
- [ ] Data includes enough detail to see what wrong notes were played (not just "you made a mistake")
- [ ] Logging works consistently across all 20 practice modes

## Scope

### In Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| Core logging infrastructure | Global state, session/round lifecycle functions, challenge normalizer | P0 |
| MIDI event recording | Capture every noteOn/noteOff with timestamps and correctness | P0 |
| Mode instrumentation | Add logging hooks to all 20 modes' StartGame/NextChallenge/OnNoteOn/EndGame | P0 |
| Header toggle button | Quick on/off toggle visible during practice | P0 |
| Session log panel | Collapsible panel with enable toggle, storage stats, export buttons, recent sessions list, clear button | P0 |
| JSON export | Full structured data for programmatic analysis | P0 |
| Summary CSV export | One row per challenge round (response time, correctness, mistake count) | P0 |
| Detailed CSV export | One row per MIDI event (keystroke-level data) | P0 |
| Storage management | 100 session limit with prompt-to-export when approaching limit | P1 |
| Settings persistence | Save logging enabled state across page reloads | P1 |

### Out of Scope

- Cloud sync or remote storage
- Real-time streaming of events
- Built-in visualization/charts (export to external tools instead)
- Audio recording
- Automatic analysis or recommendations

## Work Items

### 1. Core Logging Infrastructure

**Why:** Foundation that all other features depend on. Defines the data structure and lifecycle management.

**Acceptance Criteria:**
- Global state variables exist: `sessionLogEnabled`, `sessionLogSessions`, `currentSessionLog`
- `sessionLogStartSession(mode, config)` creates new session with mode, config, and start timestamp
- `sessionLogStartRound(challenge)` records challenge prompt and expected pitch classes
- `sessionLogRecordEvent(type, midi, velocity)` appends event with offset from round start
- `sessionLogEndRound(result)` closes round with correctness, response time, mistake count
- `sessionLogEndSession(summary)` finalizes session and persists to localStorage
- Challenge normalizer extracts consistent `{prompt, pitchClasses}` from any mode's challenge format

**Dependencies:** None

**Notes:** See docs/session-logging.md for detailed data structure. Add around line 4268 in index.html per the doc.

### 2. MIDI Handler Instrumentation

**Why:** Captures the raw input data - every note the user plays with precise timing.

**Acceptance Criteria:**
- `handleMIDI()` calls `sessionLogRecordEvent('noteOn', note, velocity)` when logging enabled
- Note-off events also recorded with `sessionLogRecordEvent('noteOff', note, 0)`
- Events only recorded when `sessionLogEnabled && currentSessionLog` (guards prevent errors)
- Event timestamps are offset from round start (not absolute time)
- Each event includes `isCorrect` flag based on whether note is in expected pitch classes

**Dependencies:** Core Logging Infrastructure

**Notes:** Modify handleMIDI() around line 4455.

### 3. Mode Instrumentation (All 20 Modes)

**Why:** Connects the logging infrastructure to each practice mode's lifecycle.

**Acceptance Criteria:**
- Every mode's `StartGame()` calls `sessionLogStartSession(mode, config)` with mode-specific config
- Every mode's `NextChallenge()` calls `sessionLogStartRound(challenge)` with normalized challenge
- Every mode's correct-answer handler calls `sessionLogEndRound(result)`
- Every mode's `EndGame()` calls `sessionLogEndSession(summary)`
- All 20 modes instrumented: chords, inversions, intervals, interval-id, scales, scale-id, note-id, key-sig, chord-prog, ii-v-i, tritone-sub, arpeg, arpeg-inv, voicing, voice-leading, melody-match, rhythm, sight-read, rel-pitch, ear-train

**Dependencies:** Core Logging Infrastructure

**Notes:** Follow same pattern for each mode. Can be done in one pass since pattern is identical.

### 4. Header Toggle Button

**Why:** Users need quick access to turn logging on/off without digging into settings.

**Acceptance Criteria:**
- Toggle button visible in header area (near existing controls)
- Shows current state clearly (e.g., "Log: On" / "Log: Off" or icon with indicator)
- Clicking toggles `sessionLogEnabled` state
- Visual feedback on state change
- State persists across page reloads via localStorage

**Dependencies:** Core Logging Infrastructure

**Notes:** Add around line 140 per the doc.

### 5. Session Log Panel

**Why:** Provides detailed management interface for viewing, exporting, and clearing logged data.

**Acceptance Criteria:**
- Collapsible panel (hidden by default, expandable)
- Shows enable/disable toggle with label
- Shows storage stats: "X/100 sessions (~Y KB)"
- "Export JSON" button downloads full structured data
- "Export Summary CSV" button downloads one-row-per-round format
- "Export Detailed CSV" button downloads one-row-per-event format
- Recent sessions list shows last 5-10 sessions with mode, date, round count
- "Clear All Data" button with confirmation prompt
- Panel state (expanded/collapsed) persists across reloads

**Dependencies:** Core Logging Infrastructure, Export Functions

**Notes:** Add around line 186 per the doc.

### 6. JSON Export Function

**Why:** Enables programmatic analysis with Python, JavaScript, or other tools.

**Acceptance Criteria:**
- `exportSessionLogJSON()` generates valid JSON with all session data
- Includes metadata: export date, version, session count
- Downloads as `piano-tutor-sessions-{date}.json`
- Contains full nested structure: sessions → rounds → events
- File is valid JSON (parseable by standard tools)

**Dependencies:** Core Logging Infrastructure

**Notes:** See docs/session-logging.md for exact JSON structure.

### 7. CSV Export Functions

**Why:** Enables spreadsheet analysis (Excel, Google Sheets) and quick pivot table creation.

**Acceptance Criteria:**
- `exportSessionLogSummaryCSV()` creates one row per round with columns: session_id, mode, config, round_num, challenge_prompt, expected_notes, response_ms, correct, mistakes, slow
- `exportSessionLogDetailedCSV()` creates one row per event with columns: session_id, mode, round_num, challenge_prompt, event_type, midi_note, note_name, octave, offset_ms, is_correct, round_result
- Both download as `piano-tutor-{type}-{date}.csv`
- CSV properly escapes commas and quotes in challenge prompts
- Files open correctly in Excel and Google Sheets

**Dependencies:** Core Logging Infrastructure

**Notes:** Summary CSV for high-level analysis, detailed CSV for keystroke-level debugging.

### 8. Storage Management

**Why:** Prevents localStorage from filling up while protecting user data.

**Acceptance Criteria:**
- Sessions stored under `sessionLogData` key in localStorage
- Maximum 100 sessions retained
- When at 90+ sessions, show non-blocking notification: "Storage nearly full (95/100). Export your data?"
- When at 100 sessions, prompt before new session: "Storage full. Export and clear old sessions?"
- After export, offer to clear oldest N sessions to make room
- Storage size estimate shown in panel (calculated from JSON string length)

**Dependencies:** Session Log Panel

**Notes:** localStorage limit is ~5MB; 100 sessions estimated at ~1.5MB max.

### 9. Settings Persistence

**Why:** Users shouldn't have to re-enable logging every time they reload the page.

**Acceptance Criteria:**
- `sessionLogEnabled` state saved in existing settings storage
- Loaded on page init with other settings
- Added to `saveAllSettings()` and `loadAllSettings()` functions

**Dependencies:** Core Logging Infrastructure

**Notes:** Modify around line 13363 per the doc.

## Risks & Constraints

| Risk/Constraint | Impact | Mitigation |
|-----------------|--------|------------|
| Large codebase (single file) | Merge conflicts if other changes in progress | Coordinate timing, work in focused sections |
| 20 modes to instrument | Tedious, risk of missing one | Checklist approach, grep to verify all modes covered |
| localStorage limits | Could hit 5MB browser limit | 100 session cap, size monitoring, prompt to export |
| Performance impact | Logging could slow down MIDI handling | Guard checks are fast, only record when enabled |

## Technical Context

**Codebase areas affected:**
- `/workspaces/the-shed/index.html` ~line 140 - Header toggle button
- `/workspaces/the-shed/index.html` ~line 186 - Session log panel HTML
- `/workspaces/the-shed/index.html` ~line 4268 - Core logging functions
- `/workspaces/the-shed/index.html` ~line 4455 - MIDI handler instrumentation
- `/workspaces/the-shed/index.html` ~line 5119+ - Mode instrumentation (20 locations)
- `/workspaces/the-shed/index.html` ~line 13363 - Settings persistence

**Related research:** docs/session-logging.md contains detailed implementation notes

**Tech stack/patterns to follow:**
- Vanilla JavaScript (no frameworks)
- localStorage for persistence
- Existing mode patterns (prefix naming, lifecycle functions)
- Tailwind CSS classes for UI

## Open Questions

- None - implementation details are well-defined in docs/session-logging.md
