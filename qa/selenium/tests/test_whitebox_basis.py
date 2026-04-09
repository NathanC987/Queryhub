from uuid import uuid4

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .helpers import (
    assert_no_unexpected_alert,
    click_status_button,
    create_question_via_ui,
    open_filter_panel,
    question_card_exists,
    set_nav_search_and_submit,
    signup_via_ui,
    unique_user,
)


@pytest.mark.whitebox_basis
@pytest.mark.smoke
def test_basis_path_default_listing(driver, wait, base_url):
    driver.get(base_url)
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".home-title")))
    assert "Latest Questions" in driver.find_element(By.CSS_SELECTOR, ".home-title").text


@pytest.mark.whitebox_basis
def test_basis_path_search_and_status_branch(driver, wait, base_url):
    username, email, password = unique_user("basis_search")
    signup_via_ui(driver, wait, base_url, username, email, password)

    unique_title = f"Basis search branch {uuid4().hex[:7]}"
    unique_tag = f"basis-{uuid4().hex[:5]}"

    create_question_via_ui(
        driver,
        wait,
        base_url,
        title=unique_title,
        body="Basis-path setup question with no answers to hit unanswered branch.",
        tags=[unique_tag],
    )

    assert_no_unexpected_alert(driver, wait, "basis-path setup question creation")
    wait.until(EC.url_contains("/"))
    set_nav_search_and_submit(driver, wait, unique_title)
    wait.until(lambda d: "q=" in d.current_url)

    open_filter_panel(driver)
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".inline-filter-panel")))

    tag_buttons = driver.find_elements(By.CSS_SELECTOR, ".inline-filter-panel .tag-chip")
    for btn in tag_buttons:
        if unique_tag in btn.text:
            btn.click()
            break

    click_status_button(driver, "Unanswered")
    wait.until(EC.url_contains("status=unanswered"))

    assert question_card_exists(driver, unique_title)


@pytest.mark.whitebox_basis
def test_basis_path_sort_most_votes_branch(driver, wait, base_url):
    driver.get(base_url)
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".home-title")))

    open_filter_panel(driver)
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".inline-filter-panel")))

    options = driver.find_elements(By.CSS_SELECTOR, ".sort-radio-option")
    matched = False
    for option in options:
        if "Most Votes" in option.text:
            option.click()
            matched = True
            break

    assert matched, "Most Votes sort option not found"
    wait.until(EC.url_contains("sort=most-votes"))

    # Presence assertion to ensure page remains functional after branch switch.
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".home-title")))
