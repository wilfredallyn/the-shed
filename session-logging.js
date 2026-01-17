/**
 * Session Logging Infrastructure for Piano Tutor
 * 
 * This module captures detailed practice data during sessions:
 * - MIDI events with timing
 * - Challenge prompts and expected notes
 * - Correctness and response times
 * 
 * Usage:
 *   1. Set sessionLogEnabled = true
 *   2. Call sessionLogStartSession(mode, config) when game starts
 *   3. Call sessionLogStartRound(challenge) for each challenge
 *   4. Call sessionLogRecordEvent(type, midi, velocity) for MIDI events
 *   5. Call sessionLogEndRound(result) when challenge completed
 *   6. Call sessionLogEndSession(summary) when game ends
 * 
 * Data is stored in localStorage under 'sessionLogData'
 */

// ==================== SESSION LOGGING ====================
// Global state for session logging
let sessionLogEnabled = true;
let sessionLogSessions = [];
let currentSessionLog = null;
let currentRoundLog = null;
let roundStartTime = null;

// Load existing sessions from localStorage
function sessionLogLoad() {
    const saved = localStorage.getItem('sessionLogSessions');
    if (saved) {
        try {
            sessionLogSessions = JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to parse session log history:', e);
            sessionLogSessions = [];
        }
    }
}

// Save sessions to localStorage
function sessionLogSave() {
    try {
        localStorage.setItem('sessionLogSessions', JSON.stringify(sessionLogSessions));
    } catch (e) {
        console.warn('Failed to save session log:', e);
    }
}

// Start a new session
function sessionLogStartSession(mode, config) {
    if (!sessionLogEnabled) return null;

    currentSessionLog = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        mode: mode,
        config: JSON.parse(JSON.stringify(config || {})),
        startTime: new Date().toISOString(),
        endTime: null,
        rounds: [],
        summary: null
    };
    currentRoundLog = null;
    roundStartTime = null;

    return currentSessionLog;
}

// Start a new round within the session
function sessionLogStartRound(challenge) {
    if (!sessionLogEnabled || !currentSessionLog) return null;

    roundStartTime = Date.now();

    currentRoundLog = {
        roundNumber: currentSessionLog.rounds.length + 1,
        startTime: new Date().toISOString(),
        challenge: sessionLogNormalizeChallenge(challenge),
        expectedPitchClasses: sessionLogExtractExpectedPitchClasses(challenge),
        events: [],
        result: null
    };

    return currentRoundLog;
}

// Record a MIDI event during the round
function sessionLogRecordEvent(type, midi, velocity) {
    if (!sessionLogEnabled || !currentSessionLog || !currentRoundLog || !roundStartTime) return;

    const event = {
        type: type,  // 'noteOn' or 'noteOff'
        midi: midi,
        pitchClass: midi % 12,
        velocity: velocity || 0,
        offsetMs: Date.now() - roundStartTime
    };

    currentRoundLog.events.push(event);
}

// End the current round
function sessionLogEndRound(result) {
    if (!sessionLogEnabled || !currentSessionLog || !currentRoundLog) return null;

    currentRoundLog.result = {
        correct: result.correct,
        responseTimeMs: result.responseTime ? Math.round(result.responseTime * 1000) : null,
        mistakes: result.mistakes || 0,
        slow: result.slow || false
    };

    currentSessionLog.rounds.push(currentRoundLog);
    const completedRound = currentRoundLog;
    currentRoundLog = null;
    roundStartTime = null;

    return completedRound;
}

// End the session and persist
function sessionLogEndSession(summary) {
    if (!sessionLogEnabled || !currentSessionLog) return null;

    currentSessionLog.endTime = new Date().toISOString();
    currentSessionLog.summary = {
        totalRounds: currentSessionLog.rounds.length,
        correctRounds: summary.correctRounds || 0,
        firstTryPct: summary.firstTryPct || 0,
        totalMistakes: summary.totalMistakes || 0,
        avgResponseTimeMs: summary.avgResponseTimeMs || null,
        slowCount: summary.slowCount || 0
    };

    sessionLogSessions.unshift(currentSessionLog);

    // Keep max 100 sessions
    if (sessionLogSessions.length > 100) {
        sessionLogSessions = sessionLogSessions.slice(0, 100);
    }

    sessionLogSave();

    const completedSession = currentSessionLog;
    currentSessionLog = null;

    return completedSession;
}

// Normalize challenge object to common format for logging
function sessionLogNormalizeChallenge(challenge) {
    if (!challenge) return null;

    // Create a serializable copy
    const normalized = {};

    // Intervals mode
    if ('targetMidi' in challenge) {
        normalized.type = 'interval';
        normalized.startMidi = challenge.startMidi;
        normalized.targetMidi = challenge.targetMidi;
        normalized.interval = challenge.interval;
        normalized.direction = challenge.direction;
    }
    // Chords mode (7th chords, extensions, etc.)
    else if ('requiredPitchClasses' in challenge) {
        normalized.type = 'chord';
        normalized.root = challenge.root;
        normalized.chordType = challenge.type;
        normalized.name = challenge.name;
        // Convert Set to Array for JSON serialization
        normalized.requiredPitchClasses = challenge.requiredPitchClasses instanceof Set
            ? Array.from(challenge.requiredPitchClasses)
            : challenge.requiredPitchClasses;
    }
    // Tritone substitution mode (actual field names from codebase)
    else if ('subRoot' in challenge && 'fullPitchClasses' in challenge) {
        normalized.type = 'tritone';
        normalized.originalRoot = challenge.originalRoot;
        normalized.subRoot = challenge.subRoot;
        normalized.fullPitchClasses = challenge.fullPitchClasses instanceof Set
            ? Array.from(challenge.fullPitchClasses)
            : challenge.fullPitchClasses;
        normalized.shellPitchClasses = challenge.shellPitchClasses instanceof Set
            ? Array.from(challenge.shellPitchClasses)
            : challenge.shellPitchClasses;
    }
    // ii-V-I and similar progression modes
    else if ('chords' in challenge && Array.isArray(challenge.chords)) {
        normalized.type = 'progression';
        normalized.key = challenge.key;
        normalized.currentStep = challenge.currentStep;
        normalized.chords = challenge.chords.map(c => ({
            root: c.root,
            type: c.type,
            pitchClasses: c.pitchClasses instanceof Set ? Array.from(c.pitchClasses) : (c.pitchClasses || [])
        }));
    }
    // Scales mode (actual field names: scaleNotes, currentNoteIndex)
    else if ('scaleNotes' in challenge || 'scale' in challenge || 'notes' in challenge) {
        normalized.type = 'scale';
        normalized.root = challenge.root;
        normalized.scaleType = challenge.scale || challenge.type;
        normalized.notes = challenge.scaleNotes
            ? Array.from(challenge.scaleNotes)
            : (challenge.notes ? Array.from(challenge.notes) : null);
        normalized.currentIndex = challenge.currentNoteIndex || challenge.currentIndex;
    }
    // Voice leading mode (actual field names: sourceChord, targetChord)
    else if ('sourceChord' in challenge && 'targetChord' in challenge) {
        normalized.type = 'voiceLeading';
        normalized.sourceChord = challenge.sourceChord;
        normalized.targetChord = challenge.targetChord;
        normalized.sourceNotes = challenge.sourceNotes;
        normalized.targetNotes = challenge.targetNotes;
    }
    // Voice leading mode (alternative format: from, to)
    else if ('from' in challenge && 'to' in challenge) {
        normalized.type = 'voiceLeading';
        normalized.from = challenge.from;
        normalized.to = challenge.to;
    }
    // Generic fallback - copy all enumerable properties
    else {
        normalized.type = 'unknown';
        for (const key in challenge) {
            if (challenge.hasOwnProperty(key)) {
                const val = challenge[key];
                if (val instanceof Set) {
                    normalized[key] = Array.from(val);
                } else if (typeof val !== 'function') {
                    normalized[key] = val;
                }
            }
        }
    }

    return normalized;
}

// Extract expected pitch classes from challenge
function sessionLogExtractExpectedPitchClasses(challenge) {
    if (!challenge) return [];

    // Intervals - single target note
    if ('targetMidi' in challenge) {
        return [challenge.targetMidi % 12];
    }

    // Chords with requiredPitchClasses Set
    if (challenge.requiredPitchClasses instanceof Set) {
        return Array.from(challenge.requiredPitchClasses);
    }

    // Chords with requiredPitchClasses Array
    if (Array.isArray(challenge.requiredPitchClasses)) {
        return challenge.requiredPitchClasses;
    }

    // Tritone - use fullPitchClasses or shellPitchClasses
    if ('fullPitchClasses' in challenge) {
        return challenge.fullPitchClasses instanceof Set
            ? Array.from(challenge.fullPitchClasses)
            : (challenge.fullPitchClasses || []);
    }

    // Progressions - current chord's pitch classes
    if ('chords' in challenge && Array.isArray(challenge.chords)) {
        const currentStep = challenge.currentStep || 0;
        const currentChord = challenge.chords[currentStep];
        if (currentChord && currentChord.pitchClasses) {
            return currentChord.pitchClasses instanceof Set
                ? Array.from(currentChord.pitchClasses)
                : currentChord.pitchClasses;
        }
    }

    // Scales - current note (handles both scaleNotes and notes)
    if ('scaleNotes' in challenge && Array.isArray(challenge.scaleNotes)) {
        const idx = challenge.currentNoteIndex || 0;
        if (idx < challenge.scaleNotes.length) {
            return [challenge.scaleNotes[idx] % 12];
        }
    }
    if ('notes' in challenge && Array.isArray(challenge.notes)) {
        const idx = challenge.currentIndex || 0;
        if (idx < challenge.notes.length) {
            return [challenge.notes[idx] % 12];
        }
    }

    // Voice leading - target chord (handles sourceChord/targetChord format)
    if ('targetChord' in challenge && challenge.targetChord) {
        if (challenge.targetNotes && Array.isArray(challenge.targetNotes)) {
            return challenge.targetNotes.map(n => n % 12);
        }
    }

    // Voice leading - target chord (handles from/to format)
    if ('to' in challenge && challenge.to) {
        if (challenge.to.pitchClasses) {
            return challenge.to.pitchClasses instanceof Set
                ? Array.from(challenge.to.pitchClasses)
                : challenge.to.pitchClasses;
        }
    }

    // Tritone - target pitch class (legacy format)
    if ('target' in challenge && typeof challenge.target === 'number') {
        return [challenge.target % 12];
    }

    return [];
}

