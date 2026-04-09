from uuid import uuid4

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .helpers import (
    assert_no_unexpected_alert,
    create_question_via_ui,
    login_via_ui,
    logout_if_logged_in,
    question_card_exists,
    unique_user,
    wait_alert_text,
    signup_via_ui,
)


@pytest.mark.blackbox_ep
@pytest.mark.smoke
def test_ep_signup_valid_partition(driver, wait, base_url):
    username, email, password = unique_user("ep_signup")

    signup_via_ui(driver, wait, base_url, username, email, password)

    greeting = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".greeting")))
    assert username in greeting.text


@pytest.mark.blackbox_ep
def test_ep_login_invalid_partition(driver, wait, base_url):
    logout_if_logged_in(driver)

    email = f"invalid_{uuid4().hex[:8]}@example.com"
    login_via_ui(driver, wait, base_url, email, "WrongPassword123!")

    alert_text = wait_alert_text(driver, wait)
    assert alert_text
    lower = alert_text.lower()
    assert (
        "login" in lower
        or "invalid" in lower
        or "failed" in lower
        or "user not found" in lower
    )


@pytest.mark.blackbox_ep
def test_ep_create_question_invalid_without_tag(driver, wait, base_url):
    username, email, password = unique_user("ep_notag")
    signup_via_ui(driver, wait, base_url, username, email, password)

    create_question_via_ui(
        driver,
        wait,
        base_url,
        title=f"EP invalid no-tag title {uuid4().hex[:6]}",
        body="This question body is valid by length but has no tags.",
        tags=[],
    )

    alert_text = wait_alert_text(driver, wait)
    assert "at least one tag" in alert_text.lower()


@pytest.mark.blackbox_ep
def test_ep_create_question_valid_partition(driver, wait, base_url):
    username, email, password = unique_user("ep_validq")
    signup_via_ui(driver, wait, base_url, username, email, password)

    title = f"EP valid question {uuid4().hex[:8]}"
    body = "This is a valid EP question body with enough length for validation."

    create_question_via_ui(driver, wait, base_url, title=title, body=body, tags=["ep-valid"])

    assert_no_unexpected_alert(driver, wait, "valid EP question creation")
    wait.until(EC.url_contains("/"))
    wait.until(lambda d: question_card_exists(d, title))
    assert question_card_exists(driver, title)
