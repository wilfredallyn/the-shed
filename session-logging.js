/**
 * Session Logging Infrastructure (roa.1 stub)
 *
 * This file provides the core session logging infrastructure for capturing
 * practice session data. It serves as a dependency for MIDI handler instrumentation (roa.2).
 */

// ==================== GLOBAL STATE ====================

// Master enable flag for session logging
var sessionLogEnabled = false;

// Array of all completed sessions
var sessionLogSessions = [];

// Current active session (null when no session is active)
var currentSessionLog = null;

// Current active round within a session (null when no round in progress)
var currentRoundLog = null;

// Timestamp when current round started (for calculating offsetMs)
var roundStartTime = null;


// ==================== CORE FUNCTIONS ====================

/**
 * Record a MIDI event during an active round
 *
 * @param {string} type - 'noteOn' or 'noteOff'
 * @param {number} midi - MIDI note number (0-127)
 * @param {number} velocity - MIDI velocity (0-127)
 */
function sessionLogRecordEvent(type, midi, velocity) {
    // Guards: only record when logging is fully active
    if (!sessionLogEnabled || !currentSessionLog || !currentRoundLog || !roundStartTime) {
        return;
    }

    const pitchClass = midi % 12;

    // Calculate isCorrect: only for noteOn events when expectedPitchClasses is available
    let isCorrect = null;
    if (type === 'noteOn' && currentRoundLog.expectedPitchClasses) {
        isCorrect = currentRoundLog.expectedPitchClasses.includes(pitchClass);
    }

    const event = {
        type: type,
        midi: midi,
        pitchClass: pitchClass,
        velocity: velocity || 0,
        offsetMs: Date.now() - roundStartTime,
        isCorrect: isCorrect
    };

    currentRoundLog.events.push(event);
}

/**
 * Start a new logging session
 *
 * @param {string} mode - The practice mode (e.g., 'chords', 'scales')
 * @param {object} config - Mode-specific configuration
 */
function sessionLogStartSession(mode, config) {
    if (!sessionLogEnabled) return;

    currentSessionLog = {
        mode: mode,
        config: config || {},
        startTime: Date.now(),
        rounds: []
    };
}

/**
 * Start a new round within the current session
 *
 * @param {object} challenge - The challenge object for this round
 */
function sessionLogStartRound(challenge) {
    if (!sessionLogEnabled || !currentSessionLog) return;

    // Extract expected pitch classes based on challenge structure
    const expectedPitchClasses = sessionLogExtractExpectedPitchClasses(challenge);

    currentRoundLog = {
        challenge: challenge,
        expectedPitchClasses: expectedPitchClasses,
        events: [],
        startTime: Date.now()
    };

    roundStartTime = Date.now();
}

/**
 * End the current round
 *
 * @param {object} result - Result data for the round
 */
function sessionLogEndRound(result) {
    if (!sessionLogEnabled || !currentSessionLog || !currentRoundLog) return;

    currentRoundLog.endTime = Date.now();
    currentRoundLog.result = result || {};
    currentRoundLog.durationMs = currentRoundLog.endTime - currentRoundLog.startTime;

    currentSessionLog.rounds.push(currentRoundLog);
    currentRoundLog = null;
    roundStartTime = null;
}

/**
 * End the current session
 */
function sessionLogEndSession() {
    if (!sessionLogEnabled || !currentSessionLog) return;

    currentSessionLog.endTime = Date.now();
    currentSessionLog.durationMs = currentSessionLog.endTime - currentSessionLog.startTime;

    sessionLogSessions.push(currentSessionLog);
    sessionLogSaveToStorage();

    currentSessionLog = null;
    currentRoundLog = null;
    roundStartTime = null;

    // Update UI if available
    if (typeof updateSessionLogUI === 'function') {
        updateSessionLogUI();
    }
}

/**
 * Extract expected pitch classes from a challenge object
 * Normalizes different challenge structures across modes
 *
 * @param {object} challenge - The challenge object
 * @returns {number[]|null} Array of pitch classes (0-11) or null
 */
function sessionLogExtractExpectedPitchClasses(challenge) {
    if (!challenge) return null;

    // Direct array
    if (Array.isArray(challenge.expectedPitchClasses)) {
        return challenge.expectedPitchClasses;
    }

    // Chord modes: requiredPitchClasses (Set or Array)
    if (challenge.requiredPitchClasses) {
        if (challenge.requiredPitchClasses instanceof Set) {
            return Array.from(challenge.requiredPitchClasses);
        }
        return challenge.requiredPitchClasses;
    }

    // Interval mode: targetMidi
    if (typeof challenge.targetMidi === 'number') {
        return [challenge.targetMidi % 12];
    }

    // Full pitch classes (tritone, voiceleading)
    if (challenge.fullPitchClasses instanceof Set) {
        return Array.from(challenge.fullPitchClasses);
    }

    // Shell pitch classes
    if (challenge.shellPitchClasses instanceof Set) {
        return Array.from(challenge.shellPitchClasses);
    }

    // Target chord pitch classes
    if (challenge.targetChord && challenge.targetChord.pitchClasses) {
        if (challenge.targetChord.pitchClasses instanceof Set) {
            return Array.from(challenge.targetChord.pitchClasses);
        }
        return challenge.targetChord.pitchClasses;
    }

    // Direct pitchClasses (dom7v voicings)
    if (challenge.pitchClasses instanceof Set) {
        return Array.from(challenge.pitchClasses);
    }

    // Scale modes: expectedNotes (pent, bebop)
    if (Array.isArray(challenge.expectedNotes)) {
        return challenge.expectedNotes;
    }

    return null;
}

/**
 * Save sessions to localStorage
 */
function sessionLogSaveToStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('sessionLogData', JSON.stringify(sessionLogSessions));
        }
    } catch (e) {
        console.warn('Failed to save session log data:', e);
    }
}

/**
 * Load sessions from localStorage
 */
function sessionLogLoadFromStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            const data = localStorage.getItem('sessionLogData');
            if (data) {
                const parsed = JSON.parse(data);
                // Ensure it's an array (guard against corrupted/old format data)
                sessionLogSessions = Array.isArray(parsed) ? parsed : [];
            }
        }
    } catch (e) {
        console.warn('Failed to load session log data:', e);
        sessionLogSessions = [];
    }
}

/**
 * Clear all session data
 */
function sessionLogClear() {
    sessionLogSessions = [];
    currentSessionLog = null;
    currentRoundLog = null;
    roundStartTime = null;
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sessionLogData');
    }
}

// ==================== CSV EXPORT FUNCTIONS ====================

// Note names for MIDI to note conversion
var SESSION_LOG_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Escape a value for CSV (RFC 4180 compliant)
 * @param {*} value - Value to escape
 * @returns {string} CSV-safe string
 */
function sessionLogEscapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }
    var str = String(value);
    // If contains comma, quote, or newline, wrap in quotes and double any quotes
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Extract a human-readable prompt from a challenge object
 * @param {object} challenge - Challenge object
 * @returns {string} Challenge prompt text
 */
function sessionLogGetChallengePrompt(challenge) {
    if (!challenge) return '';
    if (challenge.prompt) return challenge.prompt;
    if (challenge.intervalName) return challenge.intervalName;
    if (challenge.chordName) return challenge.chordName;
    if (challenge.name) return challenge.name;
    return JSON.stringify(challenge);
}

/**
 * Count mistakes (incorrect noteOn events) in an events array
 * @param {Array} events - Array of event objects
 * @returns {number} Count of incorrect notes
 */
function sessionLogCountMistakes(events) {
    if (!events || !Array.isArray(events)) return 0;
    var count = 0;
    for (var i = 0; i < events.length; i++) {
        if (events[i].type === 'noteOn' && events[i].isCorrect === false) {
            count++;
        }
    }
    return count;
}

/**
 * Trigger a CSV file download
 * @param {string} content - CSV content
 * @param {string} filename - Download filename
 */
function downloadSessionLogCSV(content, filename) {
    var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export session log data as summary CSV (one row per round)
 * Columns: session_id, mode, config, round_num, challenge_prompt, expected_notes, response_ms, correct, mistakes, slow
 * @returns {string} CSV content
 */
function exportSessionLogSummaryCSV() {
    var headers = ['session_id', 'mode', 'config', 'round_num', 'challenge_prompt', 'expected_notes', 'response_ms', 'correct', 'mistakes', 'slow'];
    var rows = [headers.join(',')];

    for (var i = 0; i < sessionLogSessions.length; i++) {
        var session = sessionLogSessions[i];
        var sessionId = session.startTime || i;
        var mode = session.mode || '';
        var config = sessionLogEscapeCSV(JSON.stringify(session.config || {}));

        for (var j = 0; j < session.rounds.length; j++) {
            var round = session.rounds[j];
            var roundNum = j + 1;
            var challengePrompt = sessionLogEscapeCSV(sessionLogGetChallengePrompt(round.challenge));

            // Convert expected pitch classes to note names
            var expectedNotes = '';
            if (round.expectedPitchClasses && Array.isArray(round.expectedPitchClasses)) {
                var noteNames = [];
                for (var k = 0; k < round.expectedPitchClasses.length; k++) {
                    noteNames.push(SESSION_LOG_NOTE_NAMES[round.expectedPitchClasses[k]]);
                }
                expectedNotes = noteNames.join(' ');
            }

            var responseMs = round.result && round.result.responseTime !== undefined ? round.result.responseTime : round.durationMs || '';
            var correct = round.result && round.result.correct !== undefined ? round.result.correct : '';
            var mistakes = round.result && round.result.mistakes !== undefined ? round.result.mistakes : sessionLogCountMistakes(round.events);
            var slow = round.result && round.result.slow !== undefined ? round.result.slow : '';

            var row = [
                sessionId,
                sessionLogEscapeCSV(mode),
                config,
                roundNum,
                challengePrompt,
                sessionLogEscapeCSV(expectedNotes),
                responseMs,
                correct,
                mistakes,
                slow
            ];
            rows.push(row.join(','));
        }
    }

    return rows.join('\n');
}

/**
 * Export session log data as detailed CSV (one row per MIDI event)
 * Columns: session_id, mode, round_num, challenge_prompt, event_type, midi_note, note_name, octave, offset_ms, is_correct, round_result
 * @returns {string} CSV content
 */
function exportSessionLogDetailedCSV() {
    var headers = ['session_id', 'mode', 'round_num', 'challenge_prompt', 'event_type', 'midi_note', 'note_name', 'octave', 'offset_ms', 'is_correct', 'round_result'];
    var rows = [headers.join(',')];

    for (var i = 0; i < sessionLogSessions.length; i++) {
        var session = sessionLogSessions[i];
        var sessionId = session.startTime || i;
        var mode = session.mode || '';

        for (var j = 0; j < session.rounds.length; j++) {
            var round = session.rounds[j];
            var roundNum = j + 1;
            var challengePrompt = sessionLogEscapeCSV(sessionLogGetChallengePrompt(round.challenge));
            var roundResult = round.result && round.result.correct !== undefined ?
                (round.result.correct ? 'correct' : 'incorrect') : '';

            if (round.events && Array.isArray(round.events)) {
                for (var k = 0; k < round.events.length; k++) {
                    var event = round.events[k];
                    var noteName = SESSION_LOG_NOTE_NAMES[event.midi % 12];
                    var octave = Math.floor(event.midi / 12) - 1;
                    var isCorrect = event.isCorrect !== null ? event.isCorrect : '';

                    var row = [
                        sessionId,
                        sessionLogEscapeCSV(mode),
                        roundNum,
                        challengePrompt,
                        event.type,
                        event.midi,
                        noteName,
                        octave,
                        event.offsetMs,
                        isCorrect,
                        roundResult
                    ];
                    rows.push(row.join(','));
                }
            }
        }
    }

    return rows.join('\n');
}

/**
 * Generate timestamp string for filenames (YYYY-MM-DD_HHMMSS)
 */
function sessionLogTimestamp() {
    var now = new Date();
    var date = now.toISOString().slice(0, 10);
    var time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return date + '_' + time;
}

/**
 * Download summary CSV file
 */
function downloadSessionLogSummaryCSV() {
    downloadSessionLogCSV(exportSessionLogSummaryCSV(), 'piano-tutor-summary-' + sessionLogTimestamp() + '.csv');
}

/**
 * Download detailed CSV file
 */
function downloadSessionLogDetailedCSV() {
    downloadSessionLogCSV(exportSessionLogDetailedCSV(), 'piano-tutor-detailed-' + sessionLogTimestamp() + '.csv');
}

/**
 * Export all session data as JSON file download
 */
function exportSessionLogJSON() {
    var exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        sessionCount: sessionLogSessions.length,
        sessions: sessionLogSessions
    };

    var jsonString = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonString], { type: 'application/json' });
    var date = new Date().toISOString().split('T')[0];
    var filename = 'piano-tutor-sessions-' + date + '.json';

    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download JSON file (wrapper for UI button)
 */
function downloadSessionLogJSON() {
    exportSessionLogJSON();
}

// Initialize on load
sessionLogLoadFromStorage();
