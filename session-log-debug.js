/**
 * Session Logging Debug Panel
 *
 * Load this in browser console with:
 *   fetch('session-log-debug.js').then(r=>r.text()).then(eval)
 *
 * Or press backtick (`) after loading to toggle panel
 */

(function() {
    // Don't double-inject
    if (document.getElementById('debugPanel')) {
        document.getElementById('debugPanel').classList.toggle('hidden');
        return;
    }

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        #debugPanel {
            position: fixed;
            bottom: 16px;
            right: 16px;
            width: 384px;
            background: #1e293b;
            border: 1px solid #475569;
            border-radius: 8px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            padding: 16px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
        }
        #debugPanel .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        #debugPanel .title {
            color: #fbbf24;
            font-weight: bold;
        }
        #debugPanel .close {
            color: #94a3b8;
            cursor: pointer;
            background: none;
            border: none;
            font-size: 16px;
        }
        #debugPanel .close:hover { color: white; }
        #debugPanel .row {
            color: #cbd5e1;
            margin: 4px 0;
        }
        #debugPanel .value-on { color: #4ade80; }
        #debugPanel .value-off { color: #f87171; }
        #debugPanel .value-muted { color: #64748b; }
        #debugPanel .value-cyan { color: #22d3ee; }
        #debugPanel .divider {
            border-top: 1px solid #475569;
            margin: 8px 0;
            padding-top: 8px;
        }
        #debugPanel .buttons {
            display: flex;
            gap: 8px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #475569;
        }
        #debugPanel button {
            padding: 4px 8px;
            border-radius: 4px;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 11px;
        }
        #debugPanel .btn-green { background: #15803d; }
        #debugPanel .btn-green:hover { background: #16a34a; }
        #debugPanel .btn-red { background: #b91c1c; }
        #debugPanel .btn-red:hover { background: #dc2626; }
        #debugPanel .btn-blue { background: #1d4ed8; }
        #debugPanel .btn-blue:hover { background: #2563eb; }
        #debugPanel.hidden { display: none; }
    `;
    document.head.appendChild(style);

    // Inject HTML
    const panel = document.createElement('div');
    panel.id = 'debugPanel';
    panel.innerHTML = `
        <div class="header">
            <span class="title">Session Log Debug</span>
            <button class="close" onclick="document.getElementById('debugPanel').classList.add('hidden')">&times;</button>
        </div>
        <div class="row">Enabled: <span id="dbg_enabled" class="value-off">false</span></div>
        <div class="row">Session: <span id="dbg_session" class="value-muted">none</span></div>
        <div class="row">Round: <span id="dbg_round" class="value-muted">none</span></div>
        <div class="row">Expected: <span id="dbg_expected" class="value-muted">-</span></div>
        <div class="row">Events: <span id="dbg_eventCount" class="value-cyan">0</span></div>
        <div class="divider">Last Event:</div>
        <div class="row"><span id="dbg_lastEvent" class="value-on">-</span></div>
        <div class="buttons">
            <button class="btn-green" onclick="sessionLogEnabled=true;window.updateDebugPanel()">Enable</button>
            <button class="btn-red" onclick="sessionLogEnabled=false;window.updateDebugPanel()">Disable</button>
            <button class="btn-blue" onclick="window.debugStartTestRound()">Test Round</button>
        </div>
    `;
    document.body.appendChild(panel);

    // Update function
    window.updateDebugPanel = function() {
        const panel = document.getElementById('debugPanel');
        if (!panel || panel.classList.contains('hidden')) return;

        const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

        document.getElementById('dbg_enabled').textContent = sessionLogEnabled;
        document.getElementById('dbg_enabled').className = sessionLogEnabled ? 'value-on' : 'value-off';

        document.getElementById('dbg_session').textContent = currentSessionLog ? currentSessionLog.mode : 'none';
        document.getElementById('dbg_round').textContent = currentRoundLog ? 'active' : 'none';

        const expected = currentRoundLog?.expectedPitchClasses;
        document.getElementById('dbg_expected').textContent = expected ? expected.map(p => NOTE_NAMES[p]).join(', ') : '-';

        const events = currentRoundLog?.events || [];
        document.getElementById('dbg_eventCount').textContent = events.length;

        if (events.length > 0) {
            const last = events[events.length - 1];
            const noteName = NOTE_NAMES[last.midi % 12] + Math.floor(last.midi / 12 - 1);
            const correct = last.isCorrect ? '✓' : '✗';
            document.getElementById('dbg_lastEvent').textContent = `${last.type} ${noteName} ${correct} @${last.offsetMs}ms`;
            document.getElementById('dbg_lastEvent').className = last.isCorrect ? 'value-on' : 'value-off';
        } else {
            document.getElementById('dbg_lastEvent').textContent = '-';
        }
    };

    // Test round function
    window.debugStartTestRound = function() {
        sessionLogEnabled = true;
        sessionLogStartSession('debug', {});
        // Use requiredPitchClasses (Set) which matches how chord modes work
        sessionLogStartRound({prompt: 'C Major', requiredPitchClasses: new Set([0, 4, 7])});
        window.updateDebugPanel();
        console.log('Test round started. Expected notes: C, E, G');
    };

    // Poll for updates (MIDI wrapper doesn't work - callback already bound)
    let lastEventCount = 0;
    let hadSession = false;
    let hadRound = false;
    setInterval(() => {
        const panel = document.getElementById('debugPanel');
        if (!panel || panel.classList.contains('hidden')) return;

        const currentCount = currentRoundLog?.events?.length || 0;
        const hasSession = !!currentSessionLog;
        const hasRound = !!currentRoundLog;

        // Update when event count changes OR session/round state changes (including ending)
        if (currentCount !== lastEventCount || hasSession !== hadSession || hasRound !== hadRound) {
            lastEventCount = currentCount;
            hadSession = hasSession;
            hadRound = hasRound;
            window.updateDebugPanel();
        }
    }, 100);

    // Toggle with backtick key
    document.addEventListener('keydown', (e) => {
        if (e.key === '`' && !e.target.matches('input, textarea')) {
            document.getElementById('debugPanel').classList.toggle('hidden');
            window.updateDebugPanel();
        }
    });

    // Initial update
    window.updateDebugPanel();
    console.log('Session Log Debug Panel loaded. Press ` to toggle.');
})();
