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
let sessionLogEnabled = false;
let sessionLogSessions = [];
let currentSessionLog = null;
let currentRoundLog = null;

// Load existing sessions from localStorage
function sessionLogLoad() {
    const saved = localStorage.getItem('sessionLogData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            sessionLogSessions = data.sessions || [];
            // Enforce 100 session limit on load
            if (sessionLogSessions.length > 100) {
                sessionLogSessions = sessionLogSessions.slice(0, 100);
            }
        } catch (e) {
            console.warn('Failed to parse session log history:', e);
            sessionLogSessions = [];
        }
    }
}

// Save sessions to localStorage
function sessionLogSave() {
    try {
        // Enforce 100 session limit before save
        if (sessionLogSessions.length > 100) {
            sessionLogSessions = sessionLogSessions.slice(0, 100);
        }
        const data = {
            version: 1,
            exportDate: new Date().toISOString(),
            sessions: sessionLogSessions
        };
        localStorage.setItem('sessionLogData', JSON.stringify(data));
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
        startTime: Date.now(),
        endTime: null,
        rounds: [],
        summary: null
    };
    currentRoundLog = null;

    return currentSessionLog;
}

// Start a new round within the session
function sessionLogStartRound(challenge) {
    if (!sessionLogEnabled || !currentSessionLog) return null;

    // Normalize the challenge and extract expected pitch classes
    const normalized = sessionLogNormalizeChallenge(currentSessionLog.mode, challenge);
    const expectedPitchClasses = sessionLogExtractExpectedPitchClasses(currentSessionLog.mode, challenge);

    currentRoundLog = {
        roundNumber: currentSessionLog.rounds.length + 1,
        startTime: Date.now(),
        challenge: normalized,
        expectedPitchClasses: expectedPitchClasses,
        events: [],
        result: null
    };

    return currentRoundLog;
}

// Record a MIDI event during the round
function sessionLogRecordEvent(type, midi, velocity) {
    if (!sessionLogEnabled || !currentSessionLog || !currentRoundLog) return;

    const pitchClass = midi % 12;
    const expectedPitchClasses = currentRoundLog.expectedPitchClasses || currentRoundLog.challenge?.expectedPitchClasses || [];
    const isCorrect = expectedPitchClasses.includes(pitchClass);

    const event = {
        type: type,  // 'noteOn' or 'noteOff'
        midi: midi,
        pitchClass: pitchClass,
        velocity: velocity || 0,
        offsetMs: Date.now() - currentRoundLog.startTime,
        isCorrect: isCorrect
    };

    currentRoundLog.events.push(event);
}

// End the current round
function sessionLogEndRound(result) {
    if (!sessionLogEnabled || !currentSessionLog || !currentRoundLog) return null;

    const responseMs = Date.now() - currentRoundLog.startTime;

    currentRoundLog.result = {
        correct: result.correct,
        mistakes: result.mistakes || 0,
        slow: result.slow || false
    };
    currentRoundLog.responseMs = responseMs;

    currentSessionLog.rounds.push(currentRoundLog);
    const completedRound = currentRoundLog;
    currentRoundLog = null;

    return completedRound;
}

// End the session and persist
function sessionLogEndSession(summary) {
    if (!sessionLogEnabled || !currentSessionLog) return null;

    currentSessionLog.endTime = Date.now();
    currentSessionLog.summary = {
        totalRounds: currentSessionLog.rounds.length,
        avgTime: summary.avgTime || null,
        firstTryPct: summary.firstTryPct || 0,
        mistakes: summary.mistakes || 0,
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
// Accepts (mode, challenge) or just (challenge) for backwards compatibility
function sessionLogNormalizeChallenge(modeOrChallenge, challenge) {
    // Handle both (mode, challenge) and (challenge) signatures
    let mode, ch;
    if (challenge === undefined) {
        ch = modeOrChallenge;
        mode = null;
    } else {
        mode = modeOrChallenge;
        ch = challenge;
    }

    if (!ch) return { prompt: '', expectedPitchClasses: [] };

    // If challenge has a prompt field, use it directly
    if (ch.prompt) {
        return {
            prompt: ch.prompt,
            expectedPitchClasses: ch.expectedPitchClasses || ch.expectedMidi?.map(n => n % 12) || []
        };
    }

    // If challenge has a name field, use it as prompt
    if (ch.name) {
        let expectedPitchClasses = [];
        if (ch.notes && Array.isArray(ch.notes)) {
            expectedPitchClasses = ch.notes.map(n => n % 12);
        } else if (ch.expectedMidi && Array.isArray(ch.expectedMidi)) {
            expectedPitchClasses = ch.expectedMidi.map(n => n % 12);
        } else if (ch.requiredPitchClasses) {
            expectedPitchClasses = ch.requiredPitchClasses instanceof Set
                ? Array.from(ch.requiredPitchClasses)
                : ch.requiredPitchClasses;
        }
        return {
            prompt: ch.name,
            expectedPitchClasses: expectedPitchClasses
        };
    }

    // Intervals mode
    if (ch.rootNote !== undefined && ch.targetNote !== undefined) {
        return {
            prompt: ch.name || `Interval from ${ch.rootNote} to ${ch.targetNote}`,
            expectedPitchClasses: [ch.targetNote % 12]
        };
    }

    // Intervals mode (alternative format)
    if (ch.interval && (ch.startMidi !== undefined || ch.targetMidi !== undefined)) {
        return {
            prompt: ch.interval || ch.name || 'Interval',
            expectedPitchClasses: ch.targetMidi !== undefined ? [ch.targetMidi % 12] : []
        };
    }

    // Chords with requiredPitchClasses
    if (ch.requiredPitchClasses) {
        const pcs = ch.requiredPitchClasses instanceof Set
            ? Array.from(ch.requiredPitchClasses)
            : ch.requiredPitchClasses;
        return {
            prompt: ch.name || ch.chordName || `${ch.root || ''} ${ch.type || 'chord'}`.trim(),
            expectedPitchClasses: pcs
        };
    }

    // Scales
    if (ch.scaleNotes || (ch.notes && ch.scale)) {
        const notes = ch.scaleNotes || ch.notes;
        return {
            prompt: ch.name || `${ch.root || ''} ${ch.scale || ch.type || 'scale'}`.trim(),
            expectedPitchClasses: Array.isArray(notes) ? notes.map(n => n % 12) : []
        };
    }

    // Generic fallback
    const normalized = {
        prompt: ch.name || ch.prompt || JSON.stringify(ch).substring(0, 50),
        expectedPitchClasses: []
    };

    // Try to extract pitch classes from common fields
    if (ch.notes) normalized.expectedPitchClasses = ch.notes.map(n => n % 12);
    else if (ch.expectedMidi) normalized.expectedPitchClasses = ch.expectedMidi.map(n => n % 12);
    else if (ch.pitchClasses) normalized.expectedPitchClasses = Array.isArray(ch.pitchClasses) ? ch.pitchClasses : Array.from(ch.pitchClasses);

    return normalized;
}

// Extract expected pitch classes from challenge
// Accepts (mode, challenge) or just (challenge) for backwards compatibility
function sessionLogExtractExpectedPitchClasses(modeOrChallenge, challenge) {
    // Handle both signatures
    let ch;
    if (challenge === undefined) {
        ch = modeOrChallenge;
    } else {
        ch = challenge;
    }

    if (!ch) return [];

    // Direct expectedPitchClasses
    if (ch.expectedPitchClasses) {
        return Array.isArray(ch.expectedPitchClasses) ? ch.expectedPitchClasses : Array.from(ch.expectedPitchClasses);
    }

    // expectedMidi array
    if (ch.expectedMidi && Array.isArray(ch.expectedMidi)) {
        return ch.expectedMidi.map(n => n % 12);
    }

    // notes array
    if (ch.notes && Array.isArray(ch.notes)) {
        return ch.notes.map(n => n % 12);
    }

    // Intervals - target note
    if (ch.targetNote !== undefined) {
        return [ch.targetNote % 12];
    }
    if (ch.targetMidi !== undefined) {
        return [ch.targetMidi % 12];
    }

    // Chords with requiredPitchClasses
    if (ch.requiredPitchClasses) {
        return ch.requiredPitchClasses instanceof Set
            ? Array.from(ch.requiredPitchClasses)
            : ch.requiredPitchClasses;
    }

    // Scales
    if (ch.scaleNotes && Array.isArray(ch.scaleNotes)) {
        return ch.scaleNotes.map(n => n % 12);
    }

    return [];
}
