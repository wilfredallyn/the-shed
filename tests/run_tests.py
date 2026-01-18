#!/usr/bin/env python3
"""
Simple test runner for Session Log Panel tests.
Works without pytest by implementing minimal test discovery and execution.
"""
import re
import sys
import traceback
from pathlib import Path


def load_html_content():
    """Load the index.html content for testing."""
    html_path = Path(__file__).parent.parent / "index.html"
    return html_path.read_text()


def extract_save_settings_function(html_content):
    """Extract the saveAllSettings function body."""
    match = re.search(
        r'function saveAllSettings\(\)\s*\{(.*?)^        \}',
        html_content,
        re.MULTILINE | re.DOTALL
    )
    return match.group(1) if match else ""


def extract_load_settings_function(html_content):
    """Extract the loadAllSettings function body."""
    match = re.search(
        r'function loadAllSettings\(\)\s*\{(.*?)^\s{8}\}',
        html_content,
        re.MULTILINE | re.DOTALL
    )
    return match.group(1) if match else ""


class TestResult:
    def __init__(self, name, passed, error=None):
        self.name = name
        self.passed = passed
        self.error = error


def run_test(name, test_fn):
    """Run a single test and return result."""
    try:
        test_fn()
        return TestResult(name, True)
    except AssertionError as e:
        return TestResult(name, False, str(e))
    except Exception as e:
        return TestResult(name, False, f"Exception: {e}")


def main():
    html_content = load_html_content()
    save_settings = extract_save_settings_function(html_content)
    load_settings = extract_load_settings_function(html_content)

    results = []

    # Panel State Persistence Tests
    def test_save_settings_includes_session_log():
        assert "sessionLog:" in save_settings or "sessionLog :" in save_settings, \
            "saveAllSettings must include a sessionLog settings object"
    results.append(run_test("test_save_settings_includes_session_log", test_save_settings_includes_session_log))

    def test_save_settings_includes_panel_expanded():
        assert "panelExpanded" in save_settings, \
            "saveAllSettings sessionLog must include panelExpanded state"
    results.append(run_test("test_save_settings_includes_panel_expanded", test_save_settings_includes_panel_expanded))

    def test_save_settings_includes_enabled():
        assert "enabled" in save_settings and "sessionLog" in save_settings, \
            "saveAllSettings sessionLog must include enabled state"
    results.append(run_test("test_save_settings_includes_enabled", test_save_settings_includes_enabled))

    def test_load_settings_handles_session_log():
        assert "settings.sessionLog" in load_settings, \
            "loadAllSettings must check for settings.sessionLog"
    results.append(run_test("test_load_settings_handles_session_log", test_load_settings_handles_session_log))

    def test_load_settings_restores_panel_expanded():
        assert "panelExpanded" in load_settings, \
            "loadAllSettings must restore panelExpanded state"
    results.append(run_test("test_load_settings_restores_panel_expanded", test_load_settings_restores_panel_expanded))

    # Panel Structure Tests
    def test_session_log_panel_container_exists():
        assert 'id="sessionLogPanel"' in html_content, \
            "Session log panel container must have id='sessionLogPanel'"
    results.append(run_test("test_session_log_panel_container_exists", test_session_log_panel_container_exists))

    def test_session_log_panel_is_collapsible():
        panel_match = re.search(
            r'<div[^>]*id="sessionLogPanel"[^>]*class="[^"]*"',
            html_content
        )
        assert panel_match is not None or \
               re.search(r'collapseSessionLogPanel|expandSessionLogPanel', html_content), \
            "Session log panel must be collapsible"
    results.append(run_test("test_session_log_panel_is_collapsible", test_session_log_panel_is_collapsible))

    def test_enable_disable_toggle_exists():
        assert 'id="sessionLogToggle"' in html_content, \
            "Session log toggle must have id='sessionLogToggle'"
    results.append(run_test("test_enable_disable_toggle_exists", test_enable_disable_toggle_exists))

    def test_toggle_is_checkbox():
        toggle_match = re.search(
            r'<input[^>]*id="sessionLogToggle"[^>]*>',
            html_content
        )
        assert toggle_match is not None, "sessionLogToggle element must exist"
        assert 'type="checkbox"' in toggle_match.group(0), \
            "sessionLogToggle must be a checkbox"
    results.append(run_test("test_toggle_is_checkbox", test_toggle_is_checkbox))

    def test_storage_stats_display_exists():
        assert 'id="sessionLogStats"' in html_content, \
            "Storage stats display must have id='sessionLogStats'"
    results.append(run_test("test_storage_stats_display_exists", test_storage_stats_display_exists))

    def test_export_json_button_exists():
        assert 'id="exportJsonBtn"' in html_content, \
            "Export JSON button must have id='exportJsonBtn'"
    results.append(run_test("test_export_json_button_exists", test_export_json_button_exists))

    def test_recent_sessions_list_exists():
        assert 'id="recentSessionsList"' in html_content, \
            "Recent sessions list must have id='recentSessionsList'"
    results.append(run_test("test_recent_sessions_list_exists", test_recent_sessions_list_exists))

    def test_clear_all_data_button_exists():
        assert 'id="clearLogBtn"' in html_content, \
            "Clear All Data button must have id='clearLogBtn'"
    results.append(run_test("test_clear_all_data_button_exists", test_clear_all_data_button_exists))

    def test_clear_button_has_confirmation():
        assert re.search(r'clearSessionLog.*confirm\(', html_content, re.DOTALL) or \
               re.search(r'confirm\(.*[Cc]lear.*session', html_content), \
            "clearSessionLog must include a confirmation dialog"
    results.append(run_test("test_clear_button_has_confirmation", test_clear_button_has_confirmation))

    # Header Elements Tests
    def test_expand_button_exists():
        assert 'id="sessionLogExpandBtn"' in html_content, \
            "Session log expand button must have id='sessionLogExpandBtn'"
    results.append(run_test("test_expand_button_exists", test_expand_button_exists))

    def test_badge_element_exists():
        assert 'id="sessionLogBadge"' in html_content, \
            "Session log badge must have id='sessionLogBadge'"
    results.append(run_test("test_badge_element_exists", test_badge_element_exists))

    # Old Dropdown Removed Tests
    def test_no_log_dropdown_in_header():
        header_match = re.search(
            r'<header[^>]*>(.*?)</header>',
            html_content,
            re.DOTALL
        )
        if header_match:
            header_content = header_match.group(1)
            assert 'logDropdown' not in header_content, \
                "Old logDropdown should not exist in header"
            assert not re.search(r'onclick="toggleLogDropdown|onclick="showLogDropdown', header_content), \
                "Old log dropdown toggle should not exist in header"
    results.append(run_test("test_no_log_dropdown_in_header", test_no_log_dropdown_in_header))

    def test_no_inline_log_panel_in_header():
        header_match = re.search(
            r'<header[^>]*>(.*?)</header>',
            html_content,
            re.DOTALL
        )
        if header_match:
            header_content = header_match.group(1)
            assert 'sessionLogContent' not in header_content, \
                "Session log content should not be inside header"
    results.append(run_test("test_no_inline_log_panel_in_header", test_no_inline_log_panel_in_header))

    # JavaScript Functions Tests
    def test_expand_function_exists():
        assert 'function expandSessionLogPanel' in html_content, \
            "expandSessionLogPanel function must be defined"
    results.append(run_test("test_expand_function_exists", test_expand_function_exists))

    def test_collapse_function_exists():
        assert 'function collapseSessionLogPanel' in html_content, \
            "collapseSessionLogPanel function must be defined"
    results.append(run_test("test_collapse_function_exists", test_collapse_function_exists))

    def test_toggle_function_exists():
        assert 'function toggleSessionLog' in html_content, \
            "toggleSessionLog function must be defined"
    results.append(run_test("test_toggle_function_exists", test_toggle_function_exists))

    def test_export_json_function_exists():
        assert 'function exportSessionLogJSON' in html_content, \
            "exportSessionLogJSON function must be defined"
    results.append(run_test("test_export_json_function_exists", test_export_json_function_exists))

    def test_clear_function_exists():
        assert 'function clearSessionLog' in html_content, \
            "clearSessionLog function must be defined"
    results.append(run_test("test_clear_function_exists", test_clear_function_exists))

    def test_log_session_function_exists():
        assert 'function logSession' in html_content, \
            "logSession function must be defined"
    results.append(run_test("test_log_session_function_exists", test_log_session_function_exists))

    def test_update_ui_function_exists():
        assert 'function updateSessionLogUI' in html_content, \
            "updateSessionLogUI function must be defined"
    results.append(run_test("test_update_ui_function_exists", test_update_ui_function_exists))

    def test_load_from_storage_function_exists():
        assert 'function sessionLogLoadFromStorage' in html_content, \
            "sessionLogLoadFromStorage function must be defined"
    results.append(run_test("test_load_from_storage_function_exists", test_load_from_storage_function_exists))

    def test_save_to_storage_function_exists():
        assert 'function sessionLogSaveToStorage' in html_content, \
            "sessionLogSaveToStorage function must be defined"
    results.append(run_test("test_save_to_storage_function_exists", test_save_to_storage_function_exists))

    # Initialization Tests
    def test_load_from_storage_called_on_init():
        init_section = re.search(
            r'loadAllSettings\(\);(.*?)(?:</script>|$)',
            html_content,
            re.DOTALL
        )
        assert init_section is not None, "Could not find initialization section"
        assert 'sessionLogLoadFromStorage()' in init_section.group(1), \
            "sessionLogLoadFromStorage must be called after loadAllSettings"
    results.append(run_test("test_load_from_storage_called_on_init", test_load_from_storage_called_on_init))

    def test_update_ui_called_on_init():
        init_section = re.search(
            r'loadAllSettings\(\);(.*?)(?:</script>|$)',
            html_content,
            re.DOTALL
        )
        assert init_section is not None, "Could not find initialization section"
        assert 'updateSessionLogUI()' in init_section.group(1), \
            "updateSessionLogUI must be called after loadAllSettings"
    results.append(run_test("test_update_ui_called_on_init", test_update_ui_called_on_init))

    # Print results
    passed = [r for r in results if r.passed]
    failed = [r for r in results if not r.passed]

    print(f"\n{'='*60}")
    print(f"Session Log Panel Tests (bead the-shed-roa.10)")
    print(f"{'='*60}\n")

    for r in results:
        status = "PASS" if r.passed else "FAIL"
        print(f"[{status}] {r.name}")
        if not r.passed and r.error:
            print(f"       {r.error}")

    print(f"\n{'='*60}")
    print(f"Results: {len(passed)} passed, {len(failed)} failed, {len(results)} total")
    print(f"{'='*60}\n")

    return 0 if len(failed) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
