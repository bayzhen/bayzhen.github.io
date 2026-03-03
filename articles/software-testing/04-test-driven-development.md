---
layout: article
title: "Test-Driven Development (TDD)"
description: "The Red-Green-Refactor cycle — write tests first, then make them pass, then improve the code"
lang: en
level: intermediate
tags: ["TDD", "Methodology", "Red-Green-Refactor"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 4
prev:
  title: "Test Doubles"
  url: "03-test-doubles.html"
next:
  title: "Integration Testing"
  url: "05-integration-testing.html"
---

## 1. What Is TDD?

**Test-Driven Development** (测试驱动开发) is a software development methodology where you write tests **before** writing the production code. It sounds *counterintuitive* (违反直觉的) — how can you test something that does not exist yet? But that is exactly the point.

TDD flips the traditional workflow:

| Traditional | TDD |
| --- | --- |
| 1. Write code | 1. Write a failing test |
| 2. Manually test | 2. Write minimum code to pass |
| 3. Maybe write tests later | 3. Refactor |
| 4. Fix bugs | 4. Repeat |

The idea is simple: **let the tests guide your design**. Each test describes a small piece of behavior, and you write just enough code to make it pass.

## 2. The Red-Green-Refactor Cycle

TDD follows a strict three-step cycle:

```
    ┌───────────┐
    │  🔴 RED   │  Write a failing test
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 🟢 GREEN  │  Write minimum code to pass the test
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ 🔵 REFACTOR│  Improve code without changing behavior
    └─────┬─────┘
          │
          └────────→ Repeat
```

### Step 1: RED — Write a Failing Test

Write a test for the behavior you want. Run it. It **must fail** — if it passes without writing new code, either the test is wrong or the feature already exists.

### Step 2: GREEN — Make It Pass

Write the **simplest possible code** that makes the test pass. Do not over-engineer. Do not add features the test does not require. This *discipline* (纪律/自律) is the hardest part of TDD.

### Step 3: REFACTOR — Clean Up

Now that the test is green, improve the code. Remove duplication, rename variables, extract functions. The test protects you — if refactoring breaks something, the test will catch it immediately.

> 句型解析: "Write the simplest possible code that makes the test pass." — TDD 的核心纪律是只写让测试通过所需的最少代码，不要提前添加不需要的功能。

## 3. TDD in Action — Building a Password Validator

Let us build a password validator step by step using TDD. Each iteration follows Red-Green-Refactor.

### Iteration 1: Password Must Not Be Empty

**RED** — Write the failing test:

```python
# test_password_validator.py
from password_validator import validate_password

def test_empty_password_is_invalid():
    result = validate_password("")
    assert result.is_valid == False
    assert "Password cannot be empty" in result.errors
```

**GREEN** — Write minimum code:

```python
# password_validator.py
from dataclasses import dataclass, field

@dataclass
class ValidationResult:
    is_valid: bool
    errors: list = field(default_factory=list)

def validate_password(password):
    if not password:
        return ValidationResult(is_valid=False, errors=["Password cannot be empty"])
    return ValidationResult(is_valid=True)
```

**REFACTOR** — The code is simple enough; no refactoring needed yet.

### Iteration 2: Password Must Be At Least 8 Characters

**RED** — New failing test:

```python
def test_short_password_is_invalid():
    result = validate_password("abc")
    assert result.is_valid == False
    assert "Password must be at least 8 characters" in result.errors
```

**GREEN** — Add the check:

```python
def validate_password(password):
    errors = []
    if not password:
        errors.append("Password cannot be empty")
    elif len(password) < 8:
        errors.append("Password must be at least 8 characters")

    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )
```

### Iteration 3: Password Must Contain a Number

**RED**:

```python
def test_password_without_number_is_invalid():
    result = validate_password("abcdefgh")
    assert result.is_valid == False
    assert "Password must contain at least one number" in result.errors
```

**GREEN**:

```python
def validate_password(password):
    errors = []
    if not password:
        errors.append("Password cannot be empty")
        return ValidationResult(is_valid=False, errors=errors)

    if len(password) < 8:
        errors.append("Password must be at least 8 characters")

    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")

    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )
```

### Iteration 4: Password Must Contain an Uppercase Letter

**RED**:

```python
def test_password_without_uppercase_is_invalid():
    result = validate_password("abcdefg1")
    assert result.is_valid == False
    assert "Password must contain at least one uppercase letter" in result.errors
```

**GREEN**:

```python
def validate_password(password):
    errors = []
    if not password:
        errors.append("Password cannot be empty")
        return ValidationResult(is_valid=False, errors=errors)

    if len(password) < 8:
        errors.append("Password must be at least 8 characters")

    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")

    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")

    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )
```

**REFACTOR** — Now we see a pattern. Let us extract the rules:

```python
def validate_password(password):
    if not password:
        return ValidationResult(is_valid=False, errors=["Password cannot be empty"])

    rules = [
        (lambda p: len(p) >= 8, "Password must be at least 8 characters"),
        (lambda p: any(c.isdigit() for c in p), "Password must contain at least one number"),
        (lambda p: any(c.isupper() for c in p), "Password must contain at least one uppercase letter"),
    ]

    errors = [msg for check, msg in rules if not check(password)]
    return ValidationResult(is_valid=len(errors) == 0, errors=errors)
```

### Iteration 5: Valid Password Passes All Checks

**RED**:

```python
def test_valid_password():
    result = validate_password("MyPassword1")
    assert result.is_valid == True
    assert result.errors == []
```

**GREEN** — The existing code already handles this. The test passes immediately. This is a *sanity check* (健全性检查) to confirm the happy path works.

## 4. TDD in JavaScript

The same approach works in any language. Here is the password validator in JavaScript with Jest:

```javascript
// passwordValidator.test.js
const { validatePassword } = require('./passwordValidator');

describe('validatePassword', () => {
  it('rejects empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password cannot be empty');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validatePassword('abc');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('rejects password without a number', () => {
    const result = validatePassword('abcdefgh');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('rejects password without an uppercase letter', () => {
    const result = validatePassword('abcdefg1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('accepts a valid password', () => {
    const result = validatePassword('MyPassword1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

## 5. The Three Laws of TDD

Robert C. Martin (Uncle Bob) defined three strict laws for TDD:

1. **You may not write production code until you have written a failing unit test.**
2. **You may not write more of a unit test than is *sufficient* (足够的) to fail** — and compilation failures count as failures.
3. **You may not write more production code than is sufficient to pass the currently failing test.**

These laws create an extremely tight feedback loop — you switch between test code and production code every few minutes.

> 句型解析: "You may not write more production code than is sufficient to pass the currently failing test." — 你写的生产代码不应超过让当前失败测试通过所需的最少量。这确保每行代码都有测试覆盖。

## 6. Benefits of TDD

### Immediate Feedback

You know within seconds whether your code works. No waiting for manual testing, no "I'll test it later."

### Better Design

Code written with TDD tends to be more *modular* (模块化的) and *loosely coupled* (松耦合的). If a class is hard to test, it is a sign that the design needs improvement.

### Living Documentation

The test suite serves as *executable documentation* (可执行文档) — it shows exactly how the code is intended to be used, and it is always up to date.

### Confidence to Refactor

With comprehensive tests, you can refactor *aggressively* (大刀阔斧地) without fear. The tests will immediately tell you if you broke something.

### Fewer Bugs

Studies show that TDD reduces defect density by **40–80%** compared to test-last development (IBM, Microsoft research).

## 7. Common TDD Mistakes

### Mistake 1: Writing Too Many Tests at Once

TDD means writing **one** test at a time. Do not write all tests upfront — that is test-first, not test-driven.

### Mistake 2: Skipping the Refactor Step

The refactor step is not optional. Without it, you accumulate *technical debt* (技术债务) just as fast as without TDD.

### Mistake 3: Testing Implementation Details

```python
# BAD — tests how it works internally
def test_validator_uses_regex():
    validator = PasswordValidator()
    assert hasattr(validator, '_regex_pattern')  # Testing internal state!

# GOOD — tests what it produces
def test_validator_rejects_weak_password():
    result = validate_password("weak")
    assert result.is_valid == False
```

### Mistake 4: Writing Tests That Are Too Large

Each test should verify **one behavior**. If a test has multiple assertions testing different behaviors, split it.

```python
# BAD — testing multiple behaviors in one test
def test_password_validator():
    assert validate_password("").is_valid == False
    assert validate_password("short").is_valid == False
    assert validate_password("NoNumber").is_valid == False
    assert validate_password("ValidPass1").is_valid == True

# GOOD — one behavior per test
def test_empty_password_is_invalid():
    assert validate_password("").is_valid == False

def test_short_password_is_invalid():
    assert validate_password("short").is_valid == False
```

## 8. When Not to Use TDD

TDD is not always the best approach:

- **Exploratory prototyping** — when you do not know what you are building yet, strict TDD adds friction
- **UI layout code** — visual design is hard to test with unit tests; use visual regression testing instead
- **One-off scripts** — throwaway code does not need tests
- **Learning a new technology** — first understand the API, then apply TDD

The key is *pragmatism* (务实主义). Use TDD when it helps, skip it when it does not. As you gain experience, you will develop an *intuition* (直觉) for when TDD is the right tool.

## 9. TDD Kata — Practice Exercises

TDD is a skill that improves with practice. Here are classic exercises:

| Kata | Description |
| --- | --- |
| **FizzBuzz** | Print numbers 1-100; replace multiples of 3 with "Fizz", 5 with "Buzz", both with "FizzBuzz" |
| **String Calculator** | Parse a string of numbers with delimiters and return their sum |
| **Roman Numerals** | Convert integers to Roman numeral strings |
| **Bowling Score** | Calculate the score of a bowling game |
| **Mars Rover** | Move a rover on a grid with commands (L, R, F) |

Pick one and practice the Red-Green-Refactor cycle. Time yourself — aim for 2–3 minute cycles.

## 10. Key Takeaways

- TDD means writing the test **before** the production code
- Follow the **Red-Green-Refactor** cycle: failing test → make it pass → clean up
- The **Three Laws** ensure every line of code has test coverage
- TDD produces **better design**, **fewer bugs**, and **executable documentation**
- Test **behavior** (what the code does), not **implementation** (how it does it)
- Do not skip the **refactor** step — it is where design improvement happens
- TDD is a skill that requires *deliberate practice* (刻意练习) — start with kata exercises
