import os
import re
import urllib.error
import urllib.request
from datetime import datetime

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait


SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")


def _as_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


@pytest.fixture(scope="session")
def base_url() -> str:
    return os.environ.get("BASE_URL", "http://localhost:3000")


def _url_reachable(url: str, timeout: float = 2.0) -> tuple[bool, str]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return True, str(getattr(response, "status", "ok"))
    except urllib.error.HTTPError as exc:
        # HTTP errors still indicate server reachability.
        return True, f"http {exc.code}"
    except Exception as exc:
        return False, str(exc)


@pytest.fixture(scope="session", autouse=True)
def ensure_test_services_up(base_url):
    backend_probe = os.environ.get("API_BASE_URL", "http://localhost:5000/api/questions")

    ui_ok, ui_info = _url_reachable(base_url)
    api_ok, api_info = _url_reachable(backend_probe)

    if ui_ok and api_ok:
        return

    details = [
        "Selenium preflight failed: required app services are not reachable.",
        f"UI ({base_url}): {'up' if ui_ok else 'down'} ({ui_info})",
        f"API ({backend_probe}): {'up' if api_ok else 'down'} ({api_info})",
        "Start frontend and backend before running pytest.",
    ]
    pytest.exit("\n".join(details), returncode=2)


@pytest.fixture(scope="function")
def driver():
    options = Options()

    # Headless by default for repeatable CI/report runs.
    if _as_bool(os.environ.get("HEADLESS", "1")):
        options.add_argument("--headless=new")

    options.add_argument("--window-size=1440,1000")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service()
    drv = webdriver.Chrome(service=service, options=options)
    drv.implicitly_wait(1)

    yield drv

    drv.quit()


@pytest.fixture(scope="function")
def wait(driver):
    timeout = int(os.environ.get("SELENIUM_WAIT", "12"))
    return WebDriverWait(driver, timeout)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when != "call":
        return

    drv = item.funcargs.get("driver")
    if drv is not None:
        current_url = "<unavailable>"
        token_present = False

        try:
            current_url = drv.current_url or "<none>"
        except Exception:
            current_url = "<unavailable>"

        try:
            token = drv.execute_script("return window.localStorage.getItem('token');")
            token_present = bool(token)
        except Exception:
            token_present = False

        report.sections.append(
            (
                "webdriver state",
                f"nodeid={item.nodeid}\ncurrent_url={current_url}\ntoken_present={token_present}",
            )
        )

    if report.passed:
        return

    if drv is None:
        return

    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]+", "_", item.nodeid)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = os.path.join(SCREENSHOT_DIR, f"{safe_name}-{timestamp}.png")

    try:
        drv.save_screenshot(path)
    except Exception:
        pass
