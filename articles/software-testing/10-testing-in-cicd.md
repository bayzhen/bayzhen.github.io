---
layout: article
title: "Testing in CI/CD Pipelines"
description: "Automate everything — GitHub Actions, quality gates, and never shipping broken code again"
lang: en
level: advanced
tags: ["CI/CD", "GitHub Actions", "Automation", "Quality Gates"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 10
prev:
  title: "Testing Patterns & Anti-Patterns"
  url: "09-testing-patterns.html"
---

## The Manual Testing Problem

You've written unit tests, integration tests, E2E tests. Your test suite is comprehensive. But there's a problem:

**Tests only work if people run them.**

And people forget. Or they're in a hurry. Or they think "this is just a small change, it'll be fine."

Then production breaks.

**CI/CD** (Continuous Integration / Continuous Delivery) solves this by running tests **automatically** — on every push, every pull request, every deployment. No human *intervention* (介入) needed.

| Without CI/CD | With CI/CD |
|---------------|------------|
| "I forgot to run the tests" | Tests run automatically on every push |
| "It works on my machine" | Tests run in a consistent environment |
| "Who broke the build?" | Broken commit is identified immediately |
| "Can we deploy this?" | Green pipeline = safe to deploy |

> 句型解析: "Tests are only valuable if they run consistently." — 测试只有在持续运行时才有价值。

## The CI/CD Pipeline

A typical pipeline with good testing looks like this:

```
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌──────────┐   ┌────────┐
│  Push   │──▶│   Lint   │──▶│ Unit Tests  │──▶│Integration│──▶│  E2E   │
│  Code   │   │  + Format │   │ + Coverage  │   │  Tests    │   │ Tests  │
└─────────┘   └──────────┘   └─────────────┘   └──────────┘   └────────┘
                                                                    │
                                                              ┌─────▼─────┐
                                                              │  Deploy   │
                                                              │ (if green)│
                                                              └───────────┘
```

Each stage acts as a **quality gate** — if any stage fails, the pipeline stops and the team is notified.

## GitHub Actions — Your First Pipeline

**GitHub Actions** is the most popular CI/CD platform for open-source projects. Let's build a complete testing pipeline.

### Basic Python Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run tests with coverage
        run: |
          pytest --cov=src --cov-report=xml --cov-report=term

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
          fail_ci_if_error: true
```

### Basic JavaScript Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests with coverage
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Multi-Stage Pipeline

Separate fast tests from slow tests:

```yaml
name: CI Pipeline

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install linters
        run: pip install black flake8 mypy
      - name: Run black
        run: black --check .
      - name: Run flake8
        run: flake8 .
      - name: Run mypy
        run: mypy src/

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint  # Only run if lint passes
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run unit tests
        run: pytest tests/unit/ -v

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests  # Only run if unit tests pass
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run integration tests
        run: pytest tests/integration/ -v
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests  # Only run if integration tests pass
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Testing Multiple Versions

Test against multiple Python/Node versions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
      - uses: actions/checkout@v4
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest
```

This creates 3 parallel jobs, one for each Python version.

## Quality Gates

Enforce quality standards:

### Coverage Threshold

```yaml
- name: Check coverage threshold
  run: |
    pytest --cov=src --cov-fail-under=80
```

Build fails if coverage drops below 80%.

### No Failing Tests

```yaml
- name: Run tests
  run: pytest --maxfail=1 --strict-markers
```

Stop at first failure.

### Linting Must Pass

```yaml
- name: Lint code
  run: |
    black --check .
    flake8 .
    mypy src/
```

## Caching Dependencies

Speed up builds by caching dependencies:

```yaml
- name: Cache pip packages
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-

- name: Install dependencies
  run: pip install -r requirements.txt
```

## Running Tests in Docker

For consistent environments:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: python:3.12

    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest
```

## Parallel Test Execution

Speed up slow test suites:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r requirements.txt pytest-xdist
      - name: Run tests (shard ${{ matrix.shard }}/4)
        run: |
          pytest --splits 4 --group ${{ matrix.shard }}
```

This splits tests into 4 groups and runs them in parallel.

## Deployment Pipeline

Only deploy if all tests pass:

```yaml
jobs:
  test:
    # ... test jobs ...

  deploy:
    runs-on: ubuntu-latest
    needs: [lint, unit-tests, integration-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Your deployment script here

      - name: Notify team
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ Deployment successful!"}'
```

## Handling Flaky Tests

Retry flaky tests automatically:

```yaml
- name: Run E2E tests with retry
  uses: nick-fields/retry@v3
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npx playwright test
```

But remember: **fix flaky tests, don't just retry them**.

## Test Reports

Generate and publish test reports:

```yaml
- name: Run tests
  run: pytest --junitxml=test-results.xml

- name: Publish test results
  uses: EnricoMi/publish-unit-test-result-action@v2
  if: always()
  with:
    files: test-results.xml
```

## Security Scanning

Add security checks to your pipeline:

```yaml
- name: Run security scan
  run: |
    pip install bandit safety
    bandit -r src/
    safety check
```

## Performance Testing

Run performance tests in CI:

```yaml
- name: Run performance tests
  run: |
    pytest tests/performance/ --benchmark-only

- name: Check performance regression
  run: |
    pytest-benchmark compare --fail-if-slower=10%
```

## Branch Protection Rules

On GitHub, enforce that tests must pass before merging:

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select your test workflows

Now no one can merge code that breaks tests.

## Notifications

Get notified when builds fail:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Tests failed on ${{ github.ref }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

### 1. Fast Feedback

Run fast tests first (lint, unit tests), slow tests last (E2E).

### 2. Fail Fast

Stop the pipeline at the first failure. Don't waste time running E2E tests if unit tests fail.

### 3. Keep Builds Fast

Target: under 10 minutes for the full pipeline. Use caching, parallelization, and selective test execution.

### 4. Test in Production-Like Environments

Use Docker containers that match your production environment.

### 5. Monitor Build Times

Track how long builds take. If they're getting slower, investigate.

## Key Takeaways

- **CI/CD automates testing** — no more "I forgot to run tests"
- **GitHub Actions** is the easiest way to get started
- **Multi-stage pipelines** run fast tests first, slow tests last
- **Quality gates** enforce standards (coverage, linting, security)
- **Cache dependencies** to speed up builds
- **Run tests in parallel** to reduce total time
- **Only deploy if tests pass** — green pipeline = safe to deploy
- **Branch protection** prevents merging broken code
- **Fast feedback** is critical — aim for under 10 minutes

## You Made It

Congratulations! You've completed the Software Testing Mastery series.

You now know:
- Why testing matters and how to build a testing culture
- How to write unit tests with the AAA pattern
- When to use mocks, stubs, fakes, and spies
- How to practice TDD with Red-Green-Refactor
- How to test databases, APIs, and browsers
- What code coverage really means (and doesn't mean)
- Common patterns and anti-patterns
- How to automate everything with CI/CD

**The next step is practice.** Pick a project and start writing tests. Start small — one function, one test. Then build from there.

Testing is a skill. Like any skill, it improves with deliberate practice.

Now go write some tests. Your future self will thank you.
