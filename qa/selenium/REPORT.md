# QueryHub Testing Experiment Report

## Aim
Perform black-box testing using Equivalence Partitioning (EP) and Boundary Value Analysis (BVA), and white-box testing using basis path concepts, then automate the designed test cases using Selenium.

## Theory

### Selenium-Based Test Automation
Selenium WebDriver is a browser automation framework that drives a real browser instance through a programmable API. It can execute user actions such as page navigation, text entry, keyboard events, button clicks, alert handling, URL checks, and DOM assertions. In this experiment, Selenium validates QueryHub through true user-visible behavior rather than mocked components.

Key testing concepts applied with Selenium:
- Explicit synchronization via waits: Web pages are asynchronous, so WebDriverWait and expected conditions are used to avoid race conditions between action and assertion.
- Stable element targeting: CSS selectors are used to locate actionable UI elements and verify expected page state.
- Negative-path handling: Browser alerts are captured and asserted for validation failures.
- Reproducibility: pytest + Selenium provides deterministic test organization, marker-based suite execution, and report generation.

### Black-Box Testing
Black-box testing validates system behavior against requirements without depending on source code internals. The test oracle is derived from expected functional behavior: redirects, alerts, URL parameters, and visible cards/titles.

Equivalence Partitioning:
- Input space is partitioned into classes expected to behave similarly.
- A representative from each class is selected to reduce redundant tests.
- This technique is effective for form-driven systems such as signup/login/question posting, where many inputs map to a small number of behavioral outcomes.

Boundary Value Analysis:
- Validation defects often cluster at lower and upper limits.
- Values are tested at boundary, just below boundary, and just above boundary.

### White-Box Basis Path Testing
Basis path testing identifies linearly independent paths in program flow so that each decision outcome is exercised at least once. Classical basis path analysis uses control-flow graphs and cyclomatic complexity computed from source code.

In this experiment, white-box basis path intent is satisfied through UI-observable branch approximation:
- Default listing path is validated through base Home rendering.
- Search + tag + status path is validated through query/filter URL mutation and resulting list behavior.
- Sort path is validated through most-votes option activation and URL branch confirmation.

Although this does not provide formal internal path coverage metrics, it still validates branch-sensitive user flows that map to major conditional behavior in the application.

### 2.4 Oracle Strategy and Pass/Fail Logic
The following practical oracles were used:
- Navigation oracle: expected route transition after successful workflows.
- Validation oracle: alert text appears for invalid partitions/boundaries.
- Persistence oracle: newly created question appears in question list.
- Branch oracle: URL query parameters reflect selected search/status/sort branches.
- Stability oracle: no unexpected alert appears in valid-path tests.

A test is considered pass when all expected observable conditions are met within configured wait windows.

## 3. System Under Test
- Application: QueryHub (Q&A web application)
- Frontend: React
- Backend: Node.js + Express
- Data layer: PostgreSQL via Prisma ORM
- Authentication: JWT

## 4. Environment
- Python: 3.14.3
- pytest: 9.0.3
- pluggy: 1.6.0
- Selenium browser: Chromium/Chrome (session output indicates chrome 146.0.7680.177)
- Selenium plugins:
	- pytest-html 4.2.0
	- pytest-json-report 1.5.0
	- pytest-xdist 3.8.0
	- pytest-metadata 3.1.1
- Frontend URL: http://localhost:3000
- Backend URL: http://localhost:5000

## Execution Procedure

Black-box BVA suite:
- pytest -m blackbox_bva -v --junitxml=reports/junit-bva.xml --html=reports/report-bva.html --self-contained-html --json-report --json-report-file=reports/report-bva.json --capture=tee-sys | tee reports/run-bva.log

Black-box EP suite:
- pytest -m blackbox_ep -v --junitxml=reports/junit-ep.xml --html=reports/report-ep.html --self-contained-html --json-report --json-report-file=reports/report-ep.json --capture=tee-sys | tee reports/run-ep.log

White-box basis suite:
- pytest -m whitebox_basis -v --junitxml=reports/junit-basis.xml --html=reports/report-basis.html --self-contained-html --json-report --json-report-file=reports/report-basis.json --capture=tee-sys | tee reports/run-basis.log

## Test Design

### Black-Box Equivalence Partitioning (EP)

EP-01: Valid signup partition
- Goal: Verify valid user registration succeeds.
- Partition: Valid username, valid email, valid password.
- Expected result: Signup succeeds, user redirected, greeting visible.
- Automated test: test_ep_signup_valid_partition

EP-02: Invalid login partition
- Goal: Verify invalid credentials are rejected.
- Partition: Nonexistent email and wrong password.
- Expected result: Error alert shown (invalid credentials/user not found/login failure semantics).
- Automated test: test_ep_login_invalid_partition

EP-03: Invalid question creation partition (missing mandatory tag)
- Goal: Verify mandatory tag validation.
- Partition: Valid title/body but empty tag set.
- Expected result: Alert indicates at least one tag is required.
- Automated test: test_ep_create_question_invalid_without_tag

EP-04: Valid question creation partition
- Goal: Verify successful question posting for valid inputs.
- Partition: Valid title, valid body, at least one valid tag.
- Expected result: No unexpected alert, redirect to listing, new question card visible.
- Automated test: test_ep_create_question_valid_partition

### Black-Box Boundary Value Analysis (BVA)

BVA-01: Title length min minus one
- Boundary: Minimum title length = 5
- Input: Length 4
- Expected result: Validation alert indicating title must be between 5 and 200.
- Automated test: test_bva_question_title_min_minus_one

BVA-02: Title length at minimum valid
- Boundary: Minimum title length = 5
- Input: Length 5 (or above)
- Expected result: Question creation succeeds and appears in listing.
- Automated test: test_bva_question_title_min_valid

BVA-03: Title length max plus one
- Boundary: Maximum title length = 200
- Input: Length 201
- Expected result: Validation alert indicating title must be between 5 and 200.
- Automated test: test_bva_question_title_max_plus_one

BVA-04: Tag count max plus one
- Boundary: Maximum tags = 5
- Input: 6 tags
- Expected result: Alert indicates maximum 5 tags.
- Automated test: test_bva_max_tags_plus_one

### White-Box Basis Path (UI-Observable Path Approximation)

BP-01: Default listing path
- Path intent: Home route loaded with default listing branch.
- Expected result: Home title visible with latest questions context.
- Automated test: test_basis_path_default_listing

BP-02: Search + status filter branch
- Path intent: Create question, search by title, apply tag and unanswered status branch.
- Expected result: URL reflects query and status branch; created question remains discoverable.
- Automated test: test_basis_path_search_and_status_branch

BP-03: Sort branch (most votes)
- Path intent: Enter filter panel and switch to most votes sorting branch.
- Expected result: URL includes sort=most-votes and page remains functional.
- Automated test: test_basis_path_sort_most_votes_branch

## Execution Outputs and Results

### Suite-Wise Results

| Suite | Selected | Passed | Failed | Deselected | Duration |
|---|---:|---:|---:|---:|---:|
| Black-box BVA | 4 | 4 | 0 | 7 | 23.12s |
| Black-box EP | 4 | 4 | 0 | 7 | 19.01s |
| White-box Basis | 3 | 3 | 0 | 8 | 10.95s |

- BVA:
	- reports/junit-bva.xml
	- reports/report-bva.html
	- reports/report-bva.json
	- reports/run-bva.log
- EP:
	- reports/junit-ep.xml
	- reports/report-ep.html
	- reports/report-ep.json
	- reports/run-ep.log
- Basis path:
	- reports/junit-basis.xml
	- reports/report-basis.html
	- reports/report-basis.json
	- reports/run-basis.log

## Observations

### Functional inference from outcomes:
- Authentication workflow is stable for tested valid and invalid partitions.
- Signup creates usable sessions that allow protected operations (for example, question submission).
- Invalid login is gracefully handled through user-visible error alert behavior.
- Mandatory tag validation is enforced before question creation is accepted.
- Question creation works correctly for valid inputs and list refresh behavior is sufficient for immediate discoverability.

### Non-Functional Inference from outcomes:
- End-to-end browser tests require explicit service health checks to separate infrastructure faults from product defects.
- Preflight validation significantly improves signal quality of test results by preventing false defect reporting.

### Inference gained from reporting:
- Test triage is faster when each case includes contextual runtime metadata.
- For this application, token presence and current URL are highly diagnostic because many flows depend on auth state and route transitions.

### Inference from Boundary and Branch Coverage
- Title length boundaries behaved as specified at both invalid and valid edges, indicating robust backend validation propagation to UI.
- Tag cardinality limit was correctly enforced at max+1, indicating client-side constraint handling is active.
- Search + status + sort branch tests passing indicate query state management and URL synchronization are functioning for key filtering scenarios.
- Default listing and sort branch tests indicate Home page remains stable under branch transitions and does not regress into broken rendering states for tested paths.

## Limitations
- Basis path coverage is approximated through UI-observable behavior and URL branch assertions; this does not compute formal cyclomatic complexity or guarantee internal path completeness.
- Selenium cannot directly verify internal backend decision nodes, middleware branches, or database transaction branches without instrumentation or API/unit-level tests.
- The experiment scope is focused on selected user journeys (auth, question creation, filtering); many modules remain out of scope, such as voting edge cases, accepted-answer state transitions, and role/authorization permutations not represented in these 11 tests.
- Assertions are largely behavior-level and message-level; textual changes to alerts can break tests even when underlying behavior remains correct.
- Browser E2E execution is slower and more flaky-prone than lower-level tests due to rendering timing, network latency, and external process startup order.
- Test correctness depends on deterministic environment setup: running frontend/backend services, reachable ports, and stable database state.
- Data isolation is best-effort via unique runtime data generation; parallel or repeated external manual actions could still influence list-order-sensitive assertions.
- Security, performance, and load characteristics are not measured by this suite.

## Conclusion
The experiment objective was achieved successfully. Black-box EP, black-box BVA, and Selenium-based white-box basis-path approximation were designed, automated, executed, and reported. Final execution results show complete pass status (11/11 for selected categorized runs), indicating that the tested user flows and validation boundaries in QueryHub behave as expected under the specified scenarios.

The generated HTML, JSON, XML, and log artifacts provide traceable evidence suitable for academic submission and DOCX conversion.
