# Selenium Experiment Test Case Matrix

## Black-box: Equivalence Partitioning (EP)

| ID | Category | Partition | Description |
|---|---|---|---|
| EP-01 | Signup | Valid | Valid username/email/password allows account creation and login state |
| EP-02 | Login | Invalid | Non-existing credentials should fail with alert |
| EP-03 | Question create | Invalid | Missing tags should be rejected |
| EP-04 | Question create | Valid | Valid title/body/tag should create question |

## Black-box: Boundary Value Analysis (BVA)

| ID | Field | Boundary | Description |
|---|---|---|---|
| BVA-01 | Title length | min-1 (4) | Reject question title below minimum |
| BVA-02 | Title length | min (5) | Accept title at lower boundary |
| BVA-03 | Title length | max+1 (201) | Reject title above upper boundary |
| BVA-04 | Tags per question | max+1 (6) | Reject adding more than 5 tags |

## White-box: Basis Path (UI-observable)

> Selenium-only basis path approximation across decision branches exposed in UI and routing/filter state.

| ID | Workflow Path | Main Decision Outcomes |
|---|---|---|
| BP-01 | Home default path | No filters, default listing path |
| BP-02 | Search + tag + unanswered | q present, tags present, status=unanswered branch |
| BP-03 | Sort most-votes | sort=most-votes branch |
