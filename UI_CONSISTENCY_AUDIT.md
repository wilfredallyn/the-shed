# UI Consistency Audit

This document lists all UI inconsistencies found across the 17 practice modes.

## Executive Summary

The app has two distinct UI patterns:
- **Old Pattern (Modes 1-13)**: More detailed, colorful stats with separate Start/Stop buttons
- **New Pattern (Modes 14-17)**: Simplified inline stats with single toggle button

This audit identifies specific inconsistencies that should be standardized.

---

## 1. Controls Bar Stats Display

### Current State

**Old Modes (1-13):**
```html
<div class="text-right">
    <p class="text-sm text-slate-400">Round</p>
    <span class="text-2xl font-mono text-white">0</span>
    <span class="text-slate-500">/</span>
    <span class="font-mono text-slate-400">20</span>
    <div class="flex gap-3 justify-end mt-1 text-xs">
        <span class="text-green-400">Score: <span class="font-mono">0</span></span>
        <span class="text-red-400">Mistakes: <span class="font-mono">0</span></span>
        <span class="text-yellow-400">Slow: <span class="font-mono">0</span></span>
    </div>
</div>
```

**New Modes (14-17):**
```html
<div class="flex gap-4 text-xs text-slate-400">
    <span>Round: <span>0</span>/<span>12</span></span>
    <span class="text-green-400">1st Try: <span>0%</span></span>
    <span>Mistakes: <span>0</span></span>
    <span>Slow: <span>0</span></span>
</div>
```

### Inconsistencies Found

| Element | Old Modes | New Modes | Recommendation |
|---------|-----------|-----------|----------------|
| Round display | Two-line with label, `text-2xl font-mono` | Inline `Round: X/Y` | Use inline format |
| Score label | "Score:" | "1st Try:" (or "Score:" in pent) | Standardize to "1st Try:" |
| Score color | `text-green-400` | `text-green-400` (but pent has none) | Always `text-green-400` |
| Mistakes color | `text-red-400` | None (slate-400) | Always `text-red-400` |
| Slow color | `text-yellow-400` | None (slate-400) | Always `text-yellow-400` |
| Number font | `font-mono` | None | Always `font-mono` |

### Proposed Standard
```html
<div class="flex gap-4 text-xs text-slate-400">
    <span>Round: <span class="font-mono">0</span>/<span class="font-mono">12</span></span>
    <span class="text-green-400">1st Try: <span class="font-mono">0%</span></span>
    <span class="text-red-400">Mistakes: <span class="font-mono">0</span></span>
    <span class="text-yellow-400">Slow: <span class="font-mono">0</span></span>
</div>
```

---

## 2. Game Complete Display

### Current State

**Old Modes (1-13):**
- Title: `<p class="text-2xl font-bold text-green-400">Game Complete!</p>`
- Stats: `text-3xl font-bold` with colors (white, blue-400, red-400, purple-400, yellow-400)
- Has explanatory subtitles (e.g., "first-try correct", "responses >2s")
- Columns: Score, Accuracy, Mistakes, Avg Time, Slow

**New Modes (15-17):**
- Title: `<h3 class="text-3xl font-bold text-green-400">Practice Complete!</h3>`
- Stats: `text-2xl font-bold text-white` (all same color)
- No explanatory subtitles
- Columns: Rounds, Avg Time, 1st Try, Mistakes, Slow

### Inconsistencies Found

| Element | Old Modes | New Modes | Recommendation |
|---------|-----------|-----------|----------------|
| Tag | `<p>` | `<h3>` | Use `<h3>` |
| Title size | `text-2xl` | `text-3xl` | Use `text-3xl` |
| Title text | "Game Complete!" | "Practice Complete!" | Use "Practice Complete!" |
| Stats size | `text-3xl` | `text-2xl` | Use `text-2xl` |
| Stats colors | Various colors | All white | Use colors for visual distinction |
| Subtitles | Yes | No | Keep subtle explanations |

### Proposed Standard
```html
<h3 class="text-3xl font-bold text-green-400 mb-4">Practice Complete!</h3>
<div class="grid grid-cols-5 gap-4 mb-4 text-center">
    <div>
        <p class="text-slate-400 text-sm">Rounds</p>
        <p class="text-2xl font-bold text-white">12</p>
    </div>
    <div>
        <p class="text-slate-400 text-sm">Avg Time</p>
        <p class="text-2xl font-bold text-purple-400">1.5s</p>
    </div>
    <div>
        <p class="text-slate-400 text-sm">1st Try</p>
        <p class="text-2xl font-bold text-green-400">83%</p>
    </div>
    <div>
        <p class="text-slate-400 text-sm">Mistakes</p>
        <p class="text-2xl font-bold text-red-400">2</p>
    </div>
    <div>
        <p class="text-slate-400 text-sm">Slow</p>
        <p class="text-2xl font-bold text-yellow-400">1</p>
    </div>
</div>
```

---

## 3. Hint Display

### Current State

| Mode | Hint Style |
|------|------------|
| Bebop | `text-sm text-slate-500` |
| Tritone | `text-lg text-blue-400` |
| Shell | `text-lg text-blue-400` |

### Proposed Standard
All hints should use: `text-lg text-blue-400`

---

## 4. Show Hints Checkbox Label

### Current State

| Mode | Label Text |
|------|------------|
| Most modes | "Show hints" |
| dom7v, extv, r251 | "Show note names" |

### Recommendation
Standardize to "Show hints" since hints can include note names, formulas, or other guidance.

---

## 5. Element ID Naming

### Current State

| Pattern | Old Modes | New Modes |
|---------|-----------|-----------|
| Complete display | `{prefix}_gameCompleteDisplay` | `{prefix}_completeDisplay` |
| Slow stat | `{prefix}_slowDisplay` | `{prefix}_slow` |
| Mistakes stat | `{prefix}_mistakesDisplay` | `{prefix}_mistakes` |
| Round stat | `{prefix}_roundDisplay` | `{prefix}_roundDisplay` (consistent) |

### Recommendation
Choose one pattern and apply consistently. Suggested: shorter names without "Display" suffix.

---

## 6. Challenge Display Chord Color

### Current State

| Mode | Chord Name Color |
|------|------------------|
| Most modes | `text-white` |
| Kenny Barron (kb) | `text-teal-400` |

### Recommendation
Keep teal for Kenny Barron as it's a distinctive mode with a specific technique.

---

## 7. Piano SVG Container

### Current State

**Old Modes:**
```html
<div class="w-full overflow-x-auto mb-6 bg-slate-900 rounded-lg p-2 border border-slate-700">
    <svg id="pianoSvg" viewBox="0 0 1000 120" class="w-full h-32"></svg>
</div>
```

**New Modes:**
```html
<div class="flex justify-center mb-6">
    <svg id="{prefix}_pianoSvg" viewBox="0 0 700 150" class="max-w-full h-auto"></svg>
</div>
```

### Inconsistencies

| Element | Old | New |
|---------|-----|-----|
| Container | Has background, border, padding | Just flex centering |
| ViewBox | 1000x120 | 700x150 |
| Height | `h-32` | `h-auto` |

### Recommendation
Keep both patterns as-is since piano size may vary by mode needs.

---

## 8. Modes Missing "Score" Indicator

The following modes show neither Score nor 1st Try in the controls bar:
- **Jazz Scales (13)** - sc
- **Minor ii-V-i (8)** - miivi
- **ii-V-I (3)** - iivi

These progression modes track stats differently (per-key breakdown).

### Recommendation
Add "1st Try" indicator to all modes for consistency, even if it shows 0%.

---

## 9. Feedback Text Styles

Various modes use different feedback styles for correct/incorrect:

| Mode Type | Correct Style | Incorrect Style |
|-----------|--------------|-----------------|
| Old modes | Various floating overlays | Red text |
| New modes | `text-green-400` inline | `text-red-400` inline |

### Recommendation
Standardize feedback display approach across all modes.

---

## Summary of Changes Needed

### High Priority (Most Visible)
1. Add colors to new modes' controls bar stats (Mistakes=red, Slow=yellow)
2. Add `font-mono` to all numeric displays
3. Standardize "1st Try:" label across all modes
4. Update complete display titles to "Practice Complete!" with `<h3 class="text-3xl">`

### Medium Priority
5. Add color coding to complete display stats (not all white)
6. Update hint styles to `text-lg text-blue-400`
7. Standardize "Show hints" label

### Lower Priority
8. Standardize element ID naming convention
9. Add 1st Try indicator to progression modes (iivi, miivi, sc)
10. Review feedback text consistency

---

## Modes Reference

| # | Mode Name | Prefix | Pattern |
|---|-----------|--------|---------|
| 1 | Intervals | int | Old |
| 2 | 7th Chords | ch | Old |
| 3 | ii-V-I | iivi | Old |
| 4 | Minor ii-V-i | miivi | Old |
| 5 | Rootless | r251 | Old |
| 6 | 6/9 Voicings | extv | Old |
| 7 | Rootless ii-V-I | r251 | Old |
| 8 | Add 9/11/13 | ext | Old |
| 9 | Altered | alt | Old |
| 10 | Advanced Chords | adv | Old |
| 11 | Kenny Barron | kb | Old |
| 12 | JTOU | jtou | Old |
| 13 | Jazz Scales | sc | Old |
| 14 | Pentatonic | pent | Mixed |
| 15 | Bebop | bebop | New |
| 16 | Tritone Sub | tritone | New |
| 17 | Shell | shell | New |
