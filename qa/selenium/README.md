# QueryHub Selenium Test Harness

## Prerequisites
- Backend running at http://localhost:5000
- Frontend running at http://localhost:3000

## Activate Environment
```bash
cd /home/nathan/Queryhub
source qa/selenium/.venv/bin/activate
```

## Run All Tests (with full artifacts)
```bash
cd /home/nathan/Queryhub/qa/selenium
pytest -v \
  --junitxml=reports/junit-all.xml \
  --html=reports/report-all.html --self-contained-html \
  --json-report --json-report-file=reports/report-all.json \
  --capture=tee-sys | tee reports/run-all.log
```

## Run By Category
```bash
pytest -m blackbox_ep -v \
  --junitxml=reports/junit-ep.xml \
  --html=reports/report-ep.html --self-contained-html \
  --json-report --json-report-file=reports/report-ep.json \
  --capture=tee-sys | tee reports/run-ep.log

pytest -m blackbox_bva -v \
  --junitxml=reports/junit-bva.xml \
  --html=reports/report-bva.html --self-contained-html \
  --json-report --json-report-file=reports/report-bva.json \
  --capture=tee-sys | tee reports/run-bva.log

pytest -m whitebox_basis -v \
  --junitxml=reports/junit-basis.xml \
  --html=reports/report-basis.html --self-contained-html \
  --json-report --json-report-file=reports/report-basis.json \
  --capture=tee-sys | tee reports/run-basis.log
```

## Optional: Headed Run
```bash
HEADLESS=0 pytest -m smoke -v --capture=tee-sys
```

## Evidence Locations
- HTML reports: qa/selenium/reports/report-*.html
- JUnit XML: qa/selenium/reports/junit-*.xml
- JSON reports: qa/selenium/reports/report-*.json
- Console logs: qa/selenium/reports/run-*.log
- Failure screenshots: qa/selenium/screenshots/

## Bundle Evidence
```bash
cd /home/nathan/Queryhub/qa/selenium
tar -czf reports/selenium-evidence.tar.gz reports screenshots
```
