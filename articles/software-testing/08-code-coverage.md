---
layout: article
title: "Code Coverage & Test Quality"
description: "The metric everyone uses and everyone misunderstands — why 100% coverage doesn't mean your tests are good"
lang: en
level: intermediate
tags: ["Code Coverage", "Mutation Testing", "Test Quality", "Metrics"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 8
prev:
  title: "End-to-End Testing"
  url: "07-end-to-end-testing.html"
next:
  title: "Testing Patterns & Anti-Patterns"
  url: "09-testing-patterns.html"
---

## The Most Misunderstood Metric

**Code coverage** measures what *percentage* (百分比) of your code is executed when your tests run. It answers the question: "How much of my code is tested?"

```
Total lines of code:      1000
Lines executed by tests:   750
Code coverage:             75%
```

Coverage is the most widely used *metric* (指标) for test quality. It's also the most *misunderstood* (被误解的).

Here's the uncomfortable truth: **high coverage doesn't guarantee good tests, and low coverage doesn't always mean bad tests**.

Let me show you why.

## The Useless Test

```python
def calculate_discount(price, is_member):
    if is_member:
        discount = price * 0.2
    else:
        discount = 0
    return price - discount

def test_calculate_discount():
    calculate_discount(100, True)
    calculate_discount(100, False)
    # No assertions!
```

This test achieves **100% code coverage**. Every line is executed. But it doesn't verify anything. It's completely useless.

Coverage measures **execution**, not **verification**.

## Types of Coverage Metrics

### Line Coverage (Statement Coverage)

The simplest metric — what percentage of lines were executed?

```python
def calculate_discount(price, is_member):
    if is_member:               # Line 1
        discount = price * 0.2  # Line 2
    else:
        discount = 0            # Line 3
    return price - discount     # Line 4
```

If your test only calls `calculate_discount(100, True)`:

- **Lines executed**: 1, 2, 4 (3 out of 4)
- **Line coverage**: 75%

Line 3 was never executed.

### Branch Coverage

More sophisticated — what percentage of decision branches were taken?

```python
def calculate_discount(price, is_member):
    if is_member:               # Branch point
        discount = price * 0.2  # Branch A
    else:
        discount = 0            # Branch B
    return price - discount
```

To achieve 100% branch coverage, you need tests for both branches:

```python
def test_member_discount():
    assert calculate_discount(100, True) == 80

def test_non_member_discount():
    assert calculate_discount(100, False) == 100
```

Branch coverage is more meaningful than line coverage.

### Function Coverage

What percentage of functions were called?

```python
# 3 functions defined
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

# Only 2 functions tested
def test_add():
    assert add(2, 3) == 5

def test_subtract():
    assert subtract(5, 3) == 2

# Function coverage: 66% (2 out of 3)
```

### Condition Coverage

What percentage of boolean sub-expressions were evaluated to both true and false?

```python
def can_vote(age, is_citizen):
    if age >= 18 and is_citizen:
        return True
    return False
```

To achieve 100% condition coverage, you need tests where:
- `age >= 18` is both true and false
- `is_citizen` is both true and false

```python
def test_can_vote_yes():
    assert can_vote(20, True) == True

def test_can_vote_too_young():
    assert can_vote(16, True) == False

def test_can_vote_not_citizen():
    assert can_vote(20, False) == False
```

## Measuring Coverage

### Python with coverage.py

```bash
# Install
pip install coverage pytest-cov

# Run tests with coverage
pytest --cov=src --cov-report=html

# View report
open htmlcov/index.html
```

### JavaScript with Jest

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

```bash
# Run tests with coverage
npm test -- --coverage
```

## The Coverage Trap

### Trap 1: Chasing 100%

Teams often set arbitrary coverage targets: "We need 80% coverage!" or "We must reach 100%!"

This leads to **coverage theater** — writing tests just to increase the number, not to verify behavior.

```python
# Coverage theater — tests that don't test anything
def test_user_creation():
    user = User("Alice", "alice@example.com")
    # No assertions! But coverage goes up!

def test_order_processing():
    order = Order([Item("Book", 10)])
    order.calculate_total()
    # No assertions! But coverage goes up!
```

These tests are worse than no tests — they give false confidence.

### Trap 2: Ignoring Uncovered Code

Low coverage doesn't always mean bad tests. Sometimes it means:

- **Dead code** — code that's never used and should be deleted
- **Error handling** — hard-to-trigger edge cases
- **Defensive code** — "this should never happen" branches

```python
def divide(a, b):
    if b == 0:
        # This is good defensive code
        # But hard to test without mocking
        logger.critical("Division by zero attempted!")
        raise ValueError("Cannot divide by zero")
    return a / b
```

Don't write bad tests just to cover defensive code.

### Trap 3: Testing Implementation, Not Behavior

```python
# ❌ BAD — testing internal implementation
def test_user_service_uses_cache():
    service = UserService()
    service.get_user(1)
    assert service._cache_hits == 1  # Testing internal state!

# ✅ GOOD — testing behavior
def test_user_service_returns_user():
    service = UserService()
    user = service.get_user(1)
    assert user.id == 1
    assert user.name == "Alice"
```

The first test has high coverage but is *brittle* (脆弱的) — it breaks when you refactor.

## What Coverage Actually Tells You

Coverage is a **negative indicator**, not a positive one:

- **Low coverage** → definitely a problem (untested code)
- **High coverage** → maybe good, maybe not (could be useless tests)

Think of it like a smoke detector. It tells you when there's a fire, but it doesn't tell you if your house is well-built.

## Mutation Testing — The Real Quality Metric

**Mutation testing** measures test quality by introducing bugs and checking if tests catch them.

Here's how it works:

1. Tool mutates your code (changes `+` to `-`, `>` to `<`, etc.)
2. Runs your tests against the mutated code
3. If tests still pass, your tests are weak

### Example

Original code:

```python
def calculate_discount(price, is_member):
    if is_member:
        return price * 0.8  # 20% discount
    return price
```

Mutation 1: Change `0.8` to `0.9`:

```python
def calculate_discount(price, is_member):
    if is_member:
        return price * 0.9  # Mutated!
    return price
```

If your test still passes, it's not checking the discount amount.

### Python Mutation Testing with mutmut

```bash
# Install
pip install mutmut

# Run mutation testing
mutmut run

# View results
mutmut results
mutmut show
```

### JavaScript Mutation Testing with Stryker

```bash
# Install
npm install -D @stryker-mutator/core @stryker-mutator/jest-runner

# Run mutation testing
npx stryker run
```

Mutation testing is slow, but it's the best way to measure test quality.

## Practical Coverage Guidelines

### 1. Aim for 70-80%, Not 100%

100% coverage is rarely worth the effort. Focus on critical code.

### 2. Prioritize by Risk

Cover high-risk code first:
- **Business logic** — calculations, validations, workflows
- **Security code** — authentication, authorization, encryption
- **Data transformations** — parsing, serialization, migrations

Skip low-risk code:
- **Getters/setters** — trivial property access
- **Configuration** — static data
- **Generated code** — protobuf, GraphQL schemas

### 3. Use Coverage to Find Gaps

Run coverage, then ask: "Why isn't this code covered?"

- **Should be tested** → write a test
- **Dead code** → delete it
- **Hard to test** → refactor to make it testable

### 4. Track Coverage Over Time

Don't let coverage decrease:

```yaml
# .github/workflows/test.yml
- name: Check coverage
  run: |
    pytest --cov=src --cov-fail-under=75
```

This fails the build if coverage drops below 75%.

## What Good Tests Look Like

Forget coverage for a moment. Good tests have these properties:

1. **Test behavior, not implementation**
2. **Have clear assertions**
3. **Are easy to understand**
4. **Fail when behavior changes**
5. **Pass when behavior is correct**

```python
# ✅ GOOD TEST
def test_member_receives_discount():
    """Members should receive a 20% discount on all purchases."""
    calculator = PriceCalculator()

    original_price = 100
    member_price = calculator.calculate(original_price, is_member=True)

    assert member_price == 80
    assert calculator.discount_applied == 20
```

This test:
- Has a clear purpose (docstring)
- Tests behavior (discount calculation)
- Has meaningful assertions
- Would fail if the discount logic broke

## Key Takeaways

- **Coverage measures execution, not verification** — high coverage doesn't mean good tests
- **Line coverage** is the simplest metric, **branch coverage** is more meaningful
- **Don't chase 100%** — aim for 70-80% and focus on critical code
- **Use coverage to find gaps**, not as a quality metric
- **Mutation testing** is the real measure of test quality
- **Good tests** verify behavior, not implementation
- Coverage is a **negative indicator** — low coverage is bad, high coverage is... maybe good
- **Track coverage over time** to prevent regression

Next up: testing patterns and anti-patterns — reusable solutions and common mistakes.
