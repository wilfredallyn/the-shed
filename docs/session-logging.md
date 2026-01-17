# Session Logging Feature for Piano Tutor

## Summary

Add a session logging feature that records:
1. **What was displayed** (challenge prompt, expected notes)
2. **What was played** (every MIDI note with timestamp)
3. **The result** (correct/incorrect, timing, mistakes)

Data can be exported as JSON (full detail) or CSV (flattened for spreadsheet analysis).

## Data Structure

Each session contains:
- Mode, config, timestamps
- Array of rounds, each with:
  - Challenge details (prompt, expected pitch classes)
  - Array of MIDI events (noteOn/Off, timing offset, correctness)
  - Result (first-try correct, mistakes, slow flag)
- Summary stats

## Files to Modify

**Single file:** `/workspaces/the-shed/index.html`

| Location | Change |
|----------|--------|
| ~line 140 | Add session log toggle button to header |
| ~line 186 | Add session log panel (collapsible) |
| ~line 4268 | Add global logging state and functions |
| ~line 4455 | Instrument `handleMIDI()` to record events |
| ~line 5119+ | Add calls in each mode's StartGame/NextChallenge/EndGame |
| ~line 13363 | Add logging toggle to saveAllSettings/loadAllSettings |

## Implementation Steps

### 1. Add Core Logging Infrastructure (~100 lines)
- Global state: `sessionLogEnabled`, `sessionLogSessions`, `currentSessionLog`
- Functions: `sessionLogStartSession()`, `sessionLogStartRound()`, `sessionLogRecordEvent()`, `sessionLogEndRound()`, `sessionLogEndSession()`
- Challenge normalizer for cross-mode compatibility
- Export functions (JSON + CSV)

### 2. Instrument MIDI Handler
- Add `sessionLogRecordEvent('noteOn', note, vel)` in handleMIDI()
- Add `sessionLogRecordEvent('noteOff', note, 0)` for note off

### 3. Instrument Each Mode (20 modes)
Add calls at these points in each mode:
- `StartGame()` → `sessionLogStartSession(mode, config)`
- `NextChallenge()` → `sessionLogStartRound(challenge)`
- Correct answer in `OnNoteOn()` → `sessionLogEndRound(result)`
- `EndGame()` → `sessionLogEndSession(summary)`

### 4. Add UI
- Toggle button in header (shows "Log On/Off")
- Collapsible panel with:
  - Enable/disable toggle
  - Storage stats (X/100 sessions, ~Y KB)
  - Export JSON / Export CSV buttons
  - Recent sessions list
  - Clear data button

## Export Formats

**JSON** - Full structured data for programmatic analysis:
```json
{
  "mode": "chords",
  "rounds": [{
    "challenge": { "prompt": "C Maj7", "expected": { "pitchClasses": [0,4,7,11] }},
    "events": [
      { "type": "noteOn", "midi": 60, "noteName": "C", "offsetMs": 800, "isCorrect": true }
    ],
    "result": { "correct": true, "responseTimeMs": 2500 }
  }]
}
```

**CSV** - Flattened event log for spreadsheet analysis:
```
session_id,mode,round,challenge_prompt,event_type,midi_note,note_name,offset_ms,is_correct,round_result
abc123,chords,1,"C Maj7",noteOn,60,C,800,true,correct
```

## Storage Strategy

- localStorage with 100 session limit (~1.5MB max)
- Only persist at session end (not per-event)
- Export before clearing for long-term storage

## Verification

1. Enable logging, play a short game (6 rounds)
2. Check localStorage for `sessionLogData` key
3. Export JSON and verify structure
4. Export CSV and open in spreadsheet
5. Verify events match actual keypresses (use known sequence)
6. Test with different modes (chords, intervals, ii-V-I)
