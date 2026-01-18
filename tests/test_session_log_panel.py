"""
Tests for Session Log Panel (bead the-shed-roa.10)

These tests verify the Session Log Panel feature by parsing and analyzing
the index.html file structure and JavaScript code.
"""
import re
import pytest
from pathlib import Path


@pytest.fixture
def html_content():
    """Load the index.html content for testing."""
    html_path = Path(__file__).parent.parent / "index.html"
    return html_path.read_text()


@pytest.fixture
def save_settings_function(html_content):
    """Extract the saveAllSettings function body."""
    match = re.search(
        r'function saveAllSettings\(\)\s*\{(.*?)^\s{8}\}',
        html_content,
        re.MULTILINE | re.DOTALL
    )
    return match.group(1) if match else ""


@pytest.fixture
def load_settings_function(html_content):
    """Extract the loadAllSettings function body."""
    match = re.search(
        r'function loadAllSettings\(\)\s*\{(.*?)^\s{8}\}',
        html_content,
        re.MULTILINE | re.DOTALL
    )
    return match.group(1) if match else ""


class TestPanelStatePersistence:
    """Test that panel expanded/collapsed state persists across reloads."""

    def test_save_settings_includes_session_log(self, save_settings_function):
        """saveAllSettings should include sessionLog settings object."""
        assert "sessionLog:" in save_settings_function or "sessionLog :" in save_settings_function, \
            "saveAllSettings must include a sessionLog settings object"

    def test_save_settings_includes_panel_expanded(self, save_settings_function):
        """saveAllSettings sessionLog should include panelExpanded state."""
        assert "panelExpanded" in save_settings_function, \
            "saveAllSettings sessionLog must include panelExpanded state"

    def test_save_settings_includes_enabled(self, save_settings_function):
        """saveAllSettings sessionLog should include enabled state."""
        # Check for enabled within sessionLog context
        assert "enabled" in save_settings_function and "sessionLog" in save_settings_function, \
            "saveAllSettings sessionLog must include enabled state"

    def test_load_settings_handles_session_log(self, load_settings_function):
        """loadAllSettings should handle sessionLog settings."""
        assert "settings.sessionLog" in load_settings_function, \
            "loadAllSettings must check for settings.sessionLog"

    def test_load_settings_restores_panel_expanded(self, load_settings_function):
        """loadAllSettings should restore panelExpanded state."""
        assert "panelExpanded" in load_settings_function, \
            "loadAllSettings must restore panelExpanded state"


class TestPanelStructure:
    """Test that required HTML elements exist in the Session Log Panel."""

    def test_session_log_panel_container_exists(self, html_content):
        """Session log panel container must exist with correct ID."""
        assert 'id="sessionLogPanel"' in html_content, \
            "Session log panel container must have id='sessionLogPanel'"

    def test_session_log_panel_is_collapsible(self, html_content):
        """Session log panel must have hidden class for collapsibility."""
        panel_match = re.search(
            r'<div[^>]*id="sessionLogPanel"[^>]*class="[^"]*"',
            html_content
        )
        assert panel_match is not None, "Session log panel must exist"
        # Check that the panel uses hidden class for visibility control
        assert 'hidden' in panel_match.group(0) or \
               re.search(r'collapseSessionLogPanel|expandSessionLogPanel', html_content), \
            "Session log panel must be collapsible (hidden class or collapse functions)"

    def test_enable_disable_toggle_exists(self, html_content):
        """Enable/disable toggle for session logging must exist."""
        assert 'id="sessionLogToggle"' in html_content, \
            "Session log toggle must have id='sessionLogToggle'"

    def test_toggle_is_checkbox(self, html_content):
        """Session log toggle must be a checkbox input."""
        toggle_match = re.search(
            r'<input[^>]*id="sessionLogToggle"[^>]*>',
            html_content
        )
        assert toggle_match is not None, "sessionLogToggle element must exist"
        assert 'type="checkbox"' in toggle_match.group(0), \
            "sessionLogToggle must be a checkbox"

    def test_storage_stats_display_exists(self, html_content):
        """Storage stats display element must exist."""
        assert 'id="sessionLogStats"' in html_content, \
            "Storage stats display must have id='sessionLogStats'"

    def test_export_json_button_exists(self, html_content):
        """Export JSON button must exist."""
        assert 'id="exportJsonBtn"' in html_content, \
            "Export JSON button must have id='exportJsonBtn'"

    def test_recent_sessions_list_exists(self, html_content):
        """Recent sessions list container must exist."""
        assert 'id="recentSessionsList"' in html_content, \
            "Recent sessions list must have id='recentSessionsList'"

    def test_clear_all_data_button_exists(self, html_content):
        """Clear All Data button must exist."""
        assert 'id="clearLogBtn"' in html_content, \
            "Clear All Data button must have id='clearLogBtn'"

    def test_clear_button_has_confirmation(self, html_content):
        """Clear button should trigger confirmation dialog."""
        # Look for confirm() in clearSessionLog function
        assert re.search(r'clearSessionLog.*confirm\(', html_content, re.DOTALL) or \
               re.search(r'confirm\(.*[Cc]lear.*session', html_content), \
            "clearSessionLog must include a confirmation dialog"


class TestHeaderElements:
    """Test header expand button and badge."""

    def test_expand_button_exists(self, html_content):
        """Session log expand button must exist in header."""
        assert 'id="sessionLogExpandBtn"' in html_content, \
            "Session log expand button must have id='sessionLogExpandBtn'"

    def test_badge_element_exists(self, html_content):
        """Session count badge must exist."""
        assert 'id="sessionLogBadge"' in html_content, \
            "Session log badge must have id='sessionLogBadge'"


class TestOldDropdownRemoved:
    """Test that old header dropdown log UI has been removed."""

    def test_no_log_dropdown_in_header(self, html_content):
        """Old log dropdown should not exist in header area."""
        # The header is roughly lines 131-152, extract that region
        header_match = re.search(
            r'<header[^>]*>(.*?)</header>',
            html_content,
            re.DOTALL
        )
        if header_match:
            header_content = header_match.group(1)
            # Check that there's no dropdown-style log menu
            assert 'logDropdown' not in header_content, \
                "Old logDropdown should not exist in header"
            # Check for old-style log button that opens a dropdown
            assert not re.search(r'onclick="toggleLogDropdown|onclick="showLogDropdown', header_content), \
                "Old log dropdown toggle should not exist in header"

    def test_no_inline_log_panel_in_header(self, html_content):
        """Old inline log panel should not exist in header."""
        header_match = re.search(
            r'<header[^>]*>(.*?)</header>',
            html_content,
            re.DOTALL
        )
        if header_match:
            header_content = header_match.group(1)
            # Session log panel should NOT be inside header
            assert 'sessionLogContent' not in header_content, \
                "Session log content should not be inside header (should be in body)"


class TestJavaScriptFunctions:
    """Test that required JavaScript functions exist."""

    def test_expand_function_exists(self, html_content):
        """expandSessionLogPanel function must exist."""
        assert 'function expandSessionLogPanel' in html_content, \
            "expandSessionLogPanel function must be defined"

    def test_collapse_function_exists(self, html_content):
        """collapseSessionLogPanel function must exist."""
        assert 'function collapseSessionLogPanel' in html_content, \
            "collapseSessionLogPanel function must be defined"

    def test_toggle_function_exists(self, html_content):
        """toggleSessionLog function must exist."""
        assert 'function toggleSessionLog' in html_content, \
            "toggleSessionLog function must be defined"

    def test_export_json_function_exists(self, html_content):
        """exportSessionLogJSON function must exist."""
        assert 'function exportSessionLogJSON' in html_content, \
            "exportSessionLogJSON function must be defined"

    def test_clear_function_exists(self, html_content):
        """clearSessionLog function must exist."""
        assert 'function clearSessionLog' in html_content, \
            "clearSessionLog function must be defined"

    def test_log_session_function_exists(self, html_content):
        """logSession function must exist for recording sessions."""
        assert 'function logSession' in html_content, \
            "logSession function must be defined"

    def test_update_ui_function_exists(self, html_content):
        """updateSessionLogUI function must exist."""
        assert 'function updateSessionLogUI' in html_content, \
            "updateSessionLogUI function must be defined"

    def test_load_from_storage_function_exists(self, html_content):
        """sessionLogLoadFromStorage function must exist."""
        assert 'function sessionLogLoadFromStorage' in html_content, \
            "sessionLogLoadFromStorage function must be defined"

    def test_save_to_storage_function_exists(self, html_content):
        """sessionLogSaveToStorage function must exist."""
        assert 'function sessionLogSaveToStorage' in html_content, \
            "sessionLogSaveToStorage function must be defined"


class TestInitialization:
    """Test that session log is properly initialized."""

    def test_load_from_storage_called_on_init(self, html_content):
        """sessionLogLoadFromStorage should be called during initialization."""
        # Look for the call after loadAllSettings
        init_section = re.search(
            r'loadAllSettings\(\);(.*?)(?:</script>|$)',
            html_content,
            re.DOTALL
        )
        if init_section:
            assert 'sessionLogLoadFromStorage()' in init_section.group(1), \
                "sessionLogLoadFromStorage must be called after loadAllSettings"
        else:
            pytest.fail("Could not find initialization section after loadAllSettings")

    def test_update_ui_called_on_init(self, html_content):
        """updateSessionLogUI should be called during initialization."""
        init_section = re.search(
            r'loadAllSettings\(\);(.*?)(?:</script>|$)',
            html_content,
            re.DOTALL
        )
        if init_section:
            assert 'updateSessionLogUI()' in init_section.group(1), \
                "updateSessionLogUI must be called after loadAllSettings"
        else:
            pytest.fail("Could not find initialization section after loadAllSettings")
