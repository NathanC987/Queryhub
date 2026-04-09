from uuid import uuid4

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .helpers import assert_no_unexpected_alert, create_question_via_ui, signup_via_ui, unique_user, wait_alert_text


@pytest.mark.blackbox_bva
def test_bva_question_title_min_minus_one(driver, wait, base_url):
    username, email, password = unique_user("bva_t4")
    signup_via_ui(driver, wait, base_url, username, email, password)

    create_question_via_ui(
        driver,
        wait,
        base_url,
        title="abcd",  # 4 chars, min-1
        body="This body is valid and long enough for backend validation.",
        tags=["bva"],
    )

    alert_text = wait_alert_text(driver, wait)
    assert "between 5 and 200" in alert_text.lower()


@pytest.mark.blackbox_bva
def test_bva_question_title_min_valid(driver, wait, base_url):
    username, email, password = unique_user("bva_t5")
    signup_via_ui(driver, wait, base_url, username, email, password)

    title = f"abcde-{uuid4().hex[:4]}"  # at least 5 chars
    create_question_via_ui(
        driver,
        wait,
        base_url,
        title=title,
        body="Minimum valid title boundary test with valid body and tag.",
        tags=["bva-min"],
    )

    assert_no_unexpected_alert(driver, wait, "BVA min-valid question creation")
    wait.until(EC.url_contains("/"))
    wait.until(
        lambda d: any(
            title in c.text for c in d.find_elements(By.CSS_SELECTOR, ".question-card .question-title")
        )
    )
    cards = driver.find_elements(By.CSS_SELECTOR, ".question-card .question-title")
    assert any(title in c.text for c in cards)


@pytest.mark.blackbox_bva
def test_bva_question_title_max_plus_one(driver, wait, base_url):
    username, email, password = unique_user("bva_t201")
    signup_via_ui(driver, wait, base_url, username, email, password)

    too_long_title = "t" * 201
    create_question_via_ui(
        driver,
        wait,
        base_url,
        title=too_long_title,
        body="This is a valid body for max plus one title boundary test.",
        tags=["bva-max"],
    )

    alert_text = wait_alert_text(driver, wait)
    assert "between 5 and 200" in alert_text.lower()


@pytest.mark.blackbox_bva
def test_bva_max_tags_plus_one(driver, wait, base_url):
    username, email, password = unique_user("bva_tags")
    signup_via_ui(driver, wait, base_url, username, email, password)

    open_url = f"{base_url}/ask"
    driver.get(open_url)

    wait.until(EC.visibility_of_element_located((By.NAME, "title"))).send_keys(f"BVA tags {uuid4().hex[:6]}")
    driver.find_element(By.NAME, "body").send_keys("Body for max-tags boundary test that is sufficiently long.")

    tag_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Type a tag and press Enter']")
    for tag in ["t1", "t2", "t3", "t4", "t5", "t6"]:
        tag_input.send_keys(tag)
        tag_input.send_keys("\n")

    alert_text = wait_alert_text(driver, wait)
    assert "up to 5 tags" in alert_text.lower()
