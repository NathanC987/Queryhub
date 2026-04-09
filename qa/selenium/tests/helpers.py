import time
from uuid import uuid4

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def unique_user(seed: str = "user"):
    suffix = uuid4().hex[:8]
    username = f"{seed}_{suffix}"
    email = f"{username}@example.com"
    password = "Password123!"
    return username, email, password


def wait_alert_text(driver, wait, timeout_fallback=2.0, wait_seconds=2):
    try:
        alert = WebDriverWait(driver, wait_seconds).until(EC.alert_is_present())
        text = alert.text
        alert.accept()
        return text
    except TimeoutException:
        # Small fallback for environments where alert appears slightly later.
        end = time.time() + timeout_fallback
        while time.time() < end:
            try:
                alert = driver.switch_to.alert
                text = alert.text
                alert.accept()
                return text
            except Exception:
                time.sleep(0.1)
    return ""


def open_path(driver, base_url, path="/"):
    driver.get(f"{base_url}{path}")


def signup_via_ui(driver, wait, base_url, username, email, password):
    open_path(driver, base_url, "/signup")

    wait.until(EC.visibility_of_element_located((By.NAME, "username"))).send_keys(username)
    driver.find_element(By.NAME, "email").send_keys(email)
    driver.find_element(By.NAME, "password").send_keys(password)

    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    # If signup fails, app raises an alert and no token is stored.
    alert_text = wait_alert_text(driver, wait, timeout_fallback=1.0, wait_seconds=2)
    if alert_text:
        raise AssertionError(f"Signup failed with alert: {alert_text}")

    wait.until(EC.url_contains("/"))
    token = driver.execute_script("return window.localStorage.getItem('token');")
    if not token:
        raise AssertionError("Signup did not persist auth token in localStorage")


def logout_if_logged_in(driver):
    buttons = driver.find_elements(By.CSS_SELECTOR, "button.logout-btn")
    if buttons:
        buttons[0].click()


def login_via_ui(driver, wait, base_url, email, password):
    open_path(driver, base_url, "/login")

    wait.until(EC.visibility_of_element_located((By.NAME, "email"))).send_keys(email)
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()


def ensure_logged_in_user(driver, wait, base_url):
    username, email, password = unique_user("qa")
    signup_via_ui(driver, wait, base_url, username, email, password)
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".greeting")))
    return username, email, password


def create_question_via_ui(driver, wait, base_url, title, body, tags):
    open_path(driver, base_url, "/ask")

    wait.until(EC.visibility_of_element_located((By.NAME, "title"))).send_keys(title)
    driver.find_element(By.NAME, "body").send_keys(body)

    tag_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Type a tag and press Enter']")
    for tag in tags:
        tag_input.send_keys(tag)
        tag_input.send_keys(Keys.ENTER)

    driver.find_element(By.CSS_SELECTOR, "button.question-button").click()


def question_card_exists(driver, title_text):
    cards = driver.find_elements(By.CSS_SELECTOR, ".question-card .question-title")
    for card in cards:
        if title_text in card.text:
            return True
    return False


def assert_no_unexpected_alert(driver, wait, context):
    alert_text = wait_alert_text(driver, wait, timeout_fallback=1.0, wait_seconds=2)
    if alert_text:
        raise AssertionError(f"Unexpected alert during {context}: {alert_text}")


def set_nav_search_and_submit(driver, wait, text):
    search = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".navbar-search-input")))
    search.clear()
    search.send_keys(text)
    search.send_keys(Keys.ENTER)


def open_filter_panel(driver):
    driver.find_element(By.CSS_SELECTOR, ".filter-open-btn").click()


def click_status_button(driver, label):
    for btn in driver.find_elements(By.CSS_SELECTOR, ".status-filter-btn"):
        if btn.text.strip().lower() == label.strip().lower():
            btn.click()
            return
    raise AssertionError(f"Status button '{label}' not found")
