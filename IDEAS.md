# Practice Mode Ideas

A collection of ideas for new practice games, inspired by jazz piano pedagogy and resources like [Open Studio Jazz](https://www.openstudiojazz.com/).

---

## Voicing-Based Games

These focus on learning specific chord voicings in all 12 keys.

### Shell Voicings (Root-3-7)
- **Description:** The most fundamental jazz voicing - just root, 3rd, and 7th
- **Position A:** Root-3-7 (spans about a 7th)
- **Position B:** Root-7-3 (spans a 10th, may need RH assist)
- **Notes:** 3 notes
- **Use case:** Left hand comping foundation, ballad playing
- **Source:** Core concept in Peter Martin's curriculum

### Rootless Type A (3-5-7-9)
- **Description:** Classic rootless voicing, assumes bass plays root
- **Formula:** 3rd - 5th - 7th - 9th
- **Notes:** 4 notes
- **Variations:** Works for maj7, min7, dom7 (adjust intervals)
- **Use case:** Comping with a bassist, Bud Powell style

### Rootless Type B (7-9-3-5)
- **Description:** Alternate rootless voicing, voice-leads smoothly with Type A
- **Formula:** 7th - 9th - 3rd - 5th
- **Notes:** 4 notes
- **Practice idea:** Alternate A and B through ii-V-I

### So What / Quartal Voicing
- **Description:** The iconic Bill Evans voicing from "Kind of Blue"
- **Formula:** Three stacked 4ths + major 3rd on top (e.g., D-G-C-F-A for Dm)
- **Notes:** 5 notes (2 LH, 3 RH)
- **Use case:** Modal jazz, minor chords
- **Source:** McCoy Tyner, Herbie Hancock also use this extensively

### Two-Handed Fourth Voicings
- **Description:** Stacked perfect 4ths across both hands
- **Notes:** 5 notes
- **Practice idea:** Move diatonically through a scale with this shape
- **Source:** Peter Martin's "2 Minute Jazz" episode on this topic

### Diminished 7th Voicings
- **Description:** Symmetric voicing (minor 3rds), useful as passing chords
- **Notes:** 4 notes
- **Practice idea:** Learn all 3 diminished chord shapes (only 3 unique ones exist)

---

## Progression-Based Games

These practice common chord movements in all 12 keys.

### Tritone Substitution
- **Description:** Replace V7 with bII7 (e.g., Db7 instead of G7 in C major)
- **Mental exercise:** Quick mental math to find the tritone sub
- **Practice idea:** Play ii - bII7 - I instead of ii - V - I

### Descending ii-V Chain
- **Description:** Series of ii-V's descending in whole steps or minor 3rds
- **Example:** Dm7-G7 | Cm7-F7 | Bbm7-Eb7 | etc.
- **Use case:** Common in standards like "Autumn Leaves" bridge

### Minor ii-V-i with Alterations
- **Description:** More complex minor ii-V with altered dominant
- **Chords:** iiø7 (half-dim) → V7alt (b9, #9, b13) → imMaj7 or im7
- **Notes:** Could require specific altered voicing for V7

### Charleston Rhythm Progression
- **Description:** Practice chord changes with syncopated rhythm
- **Rhythm:** Dotted quarter + eighth note pattern
- **Source:** Emphasized in Open Studio's "5 Easy Chords" article
- **Implementation idea:** Could add rhythm/timing element to existing modes

---

## Extended Chord Games

### Maj9 Voicing (Root + 3-5-7-9)
- **Description:** Full major 9th chord
- **Notes:** 5 notes (root in LH, 3-5-7-9 in RH)
- **Example:** CMaj9 = C in LH, E-G-B-D in RH

### Min9 Voicing
- **Description:** Full minor 9th chord
- **Notes:** 5 notes
- **Example:** Dm9 = D in LH, F-A-C-E in RH

### Dom13 Voicing
- **Description:** Dominant with 9th and 13th
- **Notes:** 5-6 notes
- **Common voicing:** 3-13-7-9 (like we built for Dom7 Voicing mode)

### Altered Dominant (V7alt)
- **Description:** Dominant with b9, #9, #11, b13 alterations
- **Voicing ideas:** 3-b7-b9-b13 or 3-b7-#9-b13
- **Use case:** Resolving to minor chords

---

## Scale/Pattern Games

### Pentatonic Fingering Drill
- **Description:** Play minor or major pentatonic with correct fingering
- **Source:** Peter Martin has specific exercises for this
- **Notes:** 5 notes per octave, focus on fingering consistency

### Bebop Scale
- **Description:** Major scale + chromatic passing tone between 5-6
- **Notes:** 8 notes per octave
- **Use case:** Creates chord tones on downbeats when playing 8th notes

### Diatonic Quartal Movement
- **Description:** Move a 4th-based voicing through all notes of a major/minor scale
- **Practice idea:** Stay in one key, move shape diatonically

---

## Implementation Notes

Each game should follow the established pattern:
- Practice in all 12 keys
- Target response time under 2 seconds
- Track accuracy (first-try correct)
- Identify problem areas across sessions
- Settings for rounds (6, 12, 24)
- Optional hints toggle

---

## Ear Training / Theory Games

These focus on recognizing relationships between notes.

### Root Movement Drill
- **Description:** Practice hearing and playing just the roots of progressions
- **Concept:** The bass line IS a melody - practice it as such
- **Example:** Play D → G → C for ii-V-I, then try in all 12 keys
- **Why:** Internalizes the sound of common root movements (down a 5th, up a 4th)
- **Source:** Peter Martin emphasizes this as foundational before adding voicings
- **Implementation idea:** Show progression, player plays just the roots with correct timing

### Melody/Bass Interval Identification
- **Description:** Given a bass note and melody note, identify the interval
- **Concept:** Quick recognition of "what scale degree is the melody relative to the bass?"
- **Examples:**
  - Bass: C, Melody: E → "Major 3rd" or "3rd"
  - Bass: G, Melody: F → "Minor 7th" or "b7"
- **Why:** Essential for reading lead sheets, understanding chord/melody relationships
- **Source:** Peter Martin's "root, shell, pretty, melody" framework
- **Implementation ideas:**
  - Random bass + melody notes, identify the interval
  - Could show chord symbol and melody note, ask "what chord tone is this?"
  - Practice recognizing guide tones (3rds and 7ths) vs extensions (9ths, 11ths, 13ths)

### Guide Tone Line Practice
- **Description:** Play just the 3rds and 7ths through a progression
- **Concept:** Guide tones define the harmony and voice-lead smoothly
- **Example:** Through ii-V-I: F-C → F-B → E-B (for Dm7-G7-Cmaj7)
- **Why:** Builds awareness of how 7ths resolve to 3rds (and vice versa)
- **Implementation idea:** Show progression, player plays only 3-7 of each chord

---

## Priority / Interest Level

Games we're most likely to build next:
1. ~~Shell Voicings~~ **IMPLEMENTED** (Mode 17)
2. Rootless Type A/B (natural progression from Dom7 Voicing)
3. So What Voicing (iconic, distinct sound)
4. ~~Tritone Subs~~ **IMPLEMENTED** (Mode 16)
5. Root Movement Drill (foundational ear training)
6. Guide Tone Lines (voice-leading awareness)

---

## Resources

- [Open Studio Jazz](https://www.openstudiojazz.com/) - Peter Martin's platform
- [2 Minute Jazz Podcast](https://podcasts.apple.com/us/podcast/2-minute-jazz/id307243677) - 123+ short technique episodes
- [5 Easy Jazz Piano Chords](https://www.openstudiojazz.com/5-easy-jazz-piano-chords-that-sound-great/)
