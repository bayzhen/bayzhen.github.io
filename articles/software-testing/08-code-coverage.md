---
layout: article
title: "Code Coverage & Test Quality"
description: "Measuring test effectiveness — coverage metrics, mutation testing, and the difference between quantity and quality"
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

## 1. What Is Code Coverage?

**Code coverage** measures what *percentage* (百分比) of your code is executed when your tests run. It answers the question: "How much of my code is tested?"

```
Total lines of code:      1000
Lines executed by tests:   750
Code coverage:             75%
```

Coverage is the most widely used *metric* (指标) for test quality — but it is also the most *misunderstood* (被误解的). High coverage does not guarantee good tests, and low coverage does not always mean bad tests. Let us explore why.

## 2. Types of Coverage Metrics

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

### Branch Coverage

Measures whether every *branch* (分支) of every decision has been taken.

```python
def calculate_discount(price, is_member):
    if is_member:           # Branch: True ✓, False ?
        discount = price * 0.2
    else:
        discount = 0
    return price - discount
```

With only `calculate_discount(100, True)`:

- **Branches taken**: True branch only (1 out of 2)
- **Branch coverage**: 50%

You need both `calculate_discount(100, True)` and `calculate_discount(100, False)` for 100% branch coverage.

### Function Coverage

Measures what percentage of functions/methods have been called at least once.

### Path Coverage

Measures what percentage of all possible *execution paths* (执行路径) have been followed. This is the most *thorough* (全面的) but also the most expensive metric.

```python
def process(a, b):
    if a > 0:     # Branch 1: True/False
        x = 1
    else:
        x = 2
    if b > 0:     # Branch 2: True/False
        y = 1
    else:
        y = 2
    return x + y
```

- **Branch coverage** needs 2 tests (one for each `if`)
- **Path coverage** needs 4 tests (every combination: TT, TF, FT, FF)

> 句型解析: "Path coverage needs 4 tests (every combination: TT, TF, FT, FF)" — 路径覆盖要求测试所有可能的路径组合，TT表示两个条件都为True，TF表示第一个True第二个False，以此类推。

## 3. Measuring Coverage in Python

### Using `pytest-cov`

```bash
# Install
pip install pytest-cov

# Run with coverage
pytest --cov=src tests/

# Generate HTML report
pytest --cov=src --cov-report=html tests/
```

### Output Example

```
---------- coverage: ----------
Name                    Stmts   Miss  Cover
-------------------------------------------
src/calculator.py          12      2    83%
src/user_service.py        45      8    82%
src/validator.py           30      0   100%
-------------------------------------------
TOTAL                      87     10    89%
```

### Configuration (`.coveragerc`)

```ini
[run]
source = src
omit =
    */tests/*
    */migrations/*
    */__init__.py

[report]
show_missing = true
fail_under = 80

[html]
directory = htmlcov
```

## 4. Measuring Coverage in JavaScript

### Using Jest's Built-in Coverage

```bash
# Run with coverage
npx jest --coverage
```

### Output Example

```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   85.71 |    66.67 |     100 |   85.71 |
 cart.js  |   85.71 |    66.67 |     100 |   85.71 |
----------|---------|----------|---------|---------|
```

### Configuration in `jest.config.js`

```javascript
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/index.{js,ts}',
  ],
};
```

## 5. The Coverage Trap

Here is the most important lesson about coverage: **100% coverage does not mean your code is well-tested.**

### Example: 100% Coverage, Zero Confidence

```python
def divide(a, b):
    return a / b

def test_divide():
    divide(10, 2)   # 100% line coverage — but NO assertion!
```

This test has **100% coverage** but tests **nothing**. It calls the function but never checks the result. It would not catch a bug like `return a * b`.

### The Real Goal

Coverage tells you what code is **not tested** (useful). It does not tell you if the tested code is **well tested** (dangerous to assume).

Think of coverage as a **necessary but not sufficient** condition:

- **Low coverage** = definitely undertested
- **High coverage** = *possibly* well-tested (but not guaranteed)

> 句型解析: "Coverage tells you what code is not tested. It does not tell you if the tested code is well tested." — 覆盖率能告诉你哪些代码没有被测试（有用），但不能告诉你被测试的代码是否测试得好（容易被误导）。

## 6. Setting Coverage Targets

### Reasonable Targets by Project Type

| Project Type | Recommended Coverage | Rationale |
| --- | --- | --- |
| **Libraries / SDKs** | 90–95% | Used by many consumers, must be reliable |
| **Business applications** | 75–85% | Balance between quality and development speed |
| **Prototypes / MVPs** | 50–60% | Focus on critical paths, move fast |
| **Legacy code** | Start at current %, increase gradually | Do not try to reach 80% overnight |

### What to Exclude from Coverage

```ini
# .coveragerc
[run]
omit =
    */tests/*            # Test files themselves
    */migrations/*       # Database migrations
    */config/*           # Configuration files
    */generated/*        # Auto-generated code
    */__main__.py        # Entry points
```

### Ratcheting — Only Go Up

A powerful strategy is **coverage ratcheting**: set your coverage threshold to the **current level**, and only allow it to go up. This prevents *regression* (回退) without demanding an unrealistic jump.

```bash
# In CI pipeline
pytest --cov=src --cov-fail-under=82
# Next sprint: --cov-fail-under=83
# Next sprint: --cov-fail-under=84
```

## 7. Mutation Testing — The Real Quality Metric

**Mutation testing** is a technique that goes beyond coverage. It modifies your source code in small ways (called *mutations* (变异)) and checks whether your tests catch the changes.

### How It Works

1. The tool creates a **mutant** — a version of your code with one small change
2. It runs your test suite against the mutant
3. If the tests **fail** → the mutant is **killed** (good — your tests caught the change)
4. If the tests **pass** → the mutant **survived** (bad — your tests missed the change)

### Example

Original code:

```python
def is_adult(age):
    return age >= 18
```

Mutations:

| Mutant | Change | Your Tests Should... |
| --- | --- | --- |
| `return age > 18` | Changed `>=` to `>` | Fail (catches the boundary bug) |
| `return age >= 19` | Changed `18` to `19` | Fail (catches the off-by-one) |
| `return age <= 18` | Changed `>=` to `<=` | Fail (logic is inverted) |
| `return True` | Returns constant | Fail (always returns True) |

### Using `mutmut` (Python)

```bash
# Install
pip install mutmut

# Run mutation testing
mutmut run --paths-to-mutate=src/

# View results
mutmut results

# See a specific surviving mutant
mutmut show 42
```

### The Mutation Score

```
Total mutants:     100
Killed:             85
Survived:           12
Timed out:           3

Mutation score:    85% (killed / total)
```

A **mutation score of 85%** means your tests caught 85% of the injected bugs. This is a much more *meaningful* (有意义的) metric than line coverage.

> 句型解析: "Mutation testing modifies your source code in small ways and checks whether your tests catch the changes." — 变异测试通过对源代码进行微小修改来检验你的测试是否能捕获这些变化。如果测试仍然通过（变异存活），说明测试覆盖有盲区。

## 8. Coverage Reports in Practice

### HTML Coverage Reports

Both `coverage.py` and Istanbul generate interactive HTML reports. Open them in a browser to see:

- **Green lines**: covered by tests
- **Red lines**: not covered
- **Yellow branches**: partially covered (only one branch taken)

```bash
# Python
pytest --cov=src --cov-report=html
open htmlcov/index.html

# JavaScript
npx jest --coverage
open coverage/lcov-report/index.html
```

### Identifying Untested Code

Focus your attention on red lines in these areas:

1. **Error handling** — `catch` blocks that were never triggered
2. **Edge cases** — branches for null, empty, or extreme values
3. **Feature flags** — dead code behind disabled flags
4. **Complex conditionals** — nested `if` statements with untested combinations

## 9. Coverage Anti-Patterns

### Anti-Pattern 1: Coverage as a KPI

Making coverage a *Key Performance Indicator* (关键绩效指标) for developers leads to **gaming** — writing tests that boost coverage without adding value.

```python
# This "test" exists only to increase coverage numbers
def test_nothing_useful():
    result = complex_function(1, 2, 3)
    # No assertions — just calling the function
```

### Anti-Pattern 2: 100% Coverage Obsession

Chasing 100% coverage wastes time on *diminishing returns* (递减回报). The last 5% often covers trivial code (getters, setters, constructors) that rarely contains bugs.

### Anti-Pattern 3: Ignoring Branch Coverage

Focusing only on line coverage and ignoring branch coverage misses half the picture.

```python
def validate(value):
    if value is not None and len(value) > 0:
        return True
    return False

# This test gives 100% line coverage but only 50% branch coverage
def test_validate():
    assert validate("hello") == True
    # Missing: validate(None), validate("")
```

## 10. Practical Guidelines

### The "Coverage + Mutation" Strategy

1. Set a **coverage threshold** (e.g., 80%) as a *baseline* (基准线)
2. Use **mutation testing** on critical modules to measure true test quality
3. Focus manual review on **surviving mutants** — these are the real gaps
4. Review coverage reports to find **completely untested** code paths

### What High-Quality Tests Look Like

```python
def test_discount_for_member():
    # Clear arrangement
    price = 100
    is_member = True

    # Clear action
    result = calculate_discount(price, is_member)

    # Specific assertion
    assert result == 80  # 20% discount applied

def test_no_discount_for_non_member():
    result = calculate_discount(100, False)
    assert result == 100  # Full price

def test_zero_price_returns_zero():
    result = calculate_discount(0, True)
    assert result == 0  # 20% of 0 is still 0

def test_negative_price_raises_error():
    with pytest.raises(ValueError):
        calculate_discount(-50, True)
```

Each test has a **clear name**, **one scenario**, and a **specific assertion**. This is quality.

## 11. Key Takeaways

- **Code coverage** measures what percentage of code is executed by tests
- Four types: **line**, **branch**, **function**, and **path** coverage
- Coverage is a **necessary but not sufficient** indicator of test quality
- **100% coverage does not mean well-tested** — assertions matter more than execution
- **Mutation testing** is the gold standard for measuring test *effectiveness* (有效性)
- Set **reasonable coverage targets**: 80% for most projects, 90%+ for libraries
- Use **coverage ratcheting** — only allow coverage to increase, never decrease
- Avoid **coverage as a KPI** — it leads to gaming and meaningless tests
- Focus on testing **behavior** and **edge cases**, not just hitting coverage numbers
