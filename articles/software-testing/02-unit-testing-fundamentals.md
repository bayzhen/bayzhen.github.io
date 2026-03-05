---
layout: article
title: "Unit Testing Fundamentals"
description: "Your first unit test — AAA pattern, assertions, test runners, and the art of testing one thing at a time"
lang: en
level: beginner
tags: ["Unit Testing", "pytest", "Jest", "Fundamentals"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 2
prev:
  title: "Why Testing Matters"
  url: "01-why-testing-matters.html"
next:
  title: "Test Doubles"
  url: "03-test-doubles.html"
---

## The Brick Analogy

A **unit test** tests the smallest *testable* unit of your application — usually a single function, method, or class. The word "unit" means **one thing in isolation**.

Think of it like checking a single brick before building a wall. If every brick is solid, the wall will be strong. If you skip checking individual bricks and only test the finished wall, a single cracked brick can bring everything down.

And when the wall collapses, good luck figuring out which brick was the problem.

> 句型解析: "If you skip checking individual bricks and only test the finished wall, a single cracked brick can bring everything down." — 条件句，用砖和墙的比喻说明单元测试的必要性。

## The AAA Pattern

Every unit test follows a three-step structure called **AAA** — Arrange, Act, Assert.

This is not a suggestion. This is the pattern. Learn it, use it, love it.

```python
def test_addition():
    # Arrange — set up the test data
    a = 3
    b = 5

    # Act — call the function being tested
    result = add(a, b)

    # Assert — verify the result
    assert result == 8
```

| Step | Purpose | What You Do |
|------|---------|-------------|
| **Arrange** | Prepare inputs and expected outputs | Create objects, set variables |
| **Act** | Execute the code under test | Call the function or method |
| **Assert** | Verify the outcome | Check return values, state changes, side effects |

This pattern makes tests **readable** and **consistent**. Every test tells a story: "Given this setup, when I do this action, then I expect this result."

### The Same Pattern in JavaScript

```javascript
test('addition works correctly', () => {
  // Arrange
  const a = 3;
  const b = 5;

  // Act
  const result = add(a, b);

  // Assert
  expect(result).toBe(8);
});
```

See? Same pattern, different syntax. Once you learn AAA, you can write tests in any language.

## Your First Test with pytest

**pytest** is the most popular testing framework for Python. Let's write a complete example.

### The Production Code

```python
# calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

### The Test Code

```python
# test_calculator.py
import pytest
from calculator import add, subtract, multiply, divide

def test_add_positive_numbers():
    assert add(2, 3) == 5

def test_add_negative_numbers():
    assert add(-1, -1) == -2

def test_add_zero():
    assert add(0, 5) == 5

def test_subtract():
    assert subtract(10, 3) == 7

def test_multiply():
    assert multiply(4, 3) == 12

def test_divide():
    assert divide(10, 2) == 5.0

def test_divide_by_zero_raises_error():
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(10, 0)
```

### Running the Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest test_calculator.py

# Run a specific test function
pytest test_calculator.py::test_add_positive_numbers
```

Output:

```
test_calculator.py::test_add_positive_numbers PASSED
test_calculator.py::test_add_negative_numbers PASSED
test_calculator.py::test_add_zero PASSED
test_calculator.py::test_subtract PASSED
test_calculator.py::test_multiply PASSED
test_calculator.py::test_divide PASSED
test_calculator.py::test_divide_by_zero_raises_error PASSED

7 passed in 0.03s
```

That's it. You just wrote and ran your first unit tests.

## Assertions — The Heart of Testing

An *assertion* (断言) is a statement that checks whether a condition is true. If the condition is false, the test fails.

Assertions are the **core mechanism** of every test. Without assertions, you're just running code, not testing it.

### Python Assertions with pytest

```python
# Equality
assert result == expected

# Truthiness
assert is_valid
assert not is_expired

# Containment
assert "error" in message
assert item in collection

# Type checking
assert isinstance(user, User)

# Approximate equality (for floating-point numbers)
assert result == pytest.approx(3.14, abs=0.01)

# Exception checking
with pytest.raises(TypeError):
    function_that_should_raise()
```

### JavaScript Assertions with Jest

```javascript
// Equality
expect(result).toBe(expected);        // strict equality (===)
expect(result).toEqual(expected);     // deep equality for objects

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(10);
expect(value).toBeCloseTo(0.3, 5);    // floating-point comparison

// Strings
expect(message).toMatch(/error/i);    // regex match

// Arrays
expect(array).toContain('item');
expect(array).toHaveLength(3);

// Exceptions
expect(() => dangerousFunction()).toThrow('error message');
```

## Test Naming — The Most Underrated Skill

Good test names describe **what** is being tested and **what** the expected outcome is. A reader should understand the test without reading the code.

Bad test names are *vague* (模糊的). Good test names are *specific* (具体的).

### Pattern: `test_[method]_[scenario]_[expected_result]`

```python
# ✅ Good names — descriptive and specific
def test_divide_by_zero_raises_value_error():
    ...

def test_login_with_wrong_password_returns_false():
    ...

def test_cart_total_with_discount_applies_percentage():
    ...

# ❌ Bad names — vague and uninformative
def test_divide():         # What scenario? What result?
    ...

def test_login():          # Success? Failure? What input?
    ...

def test_it_works():       # What is "it"?
    ...
```

### JavaScript: Using `describe` and `it`

```javascript
describe('ShoppingCart', () => {
  describe('calculateTotal', () => {
    it('should return 0 for an empty cart', () => {
      const cart = new ShoppingCart();
      expect(cart.calculateTotal()).toBe(0);
    });

    it('should sum all item prices', () => {
      const cart = new ShoppingCart();
      cart.addItem({ name: 'Book', price: 10 });
      cart.addItem({ name: 'Pen', price: 2 });
      expect(cart.calculateTotal()).toBe(12);
    });

    it('should apply discount when coupon is valid', () => {
      const cart = new ShoppingCart();
      cart.addItem({ name: 'Book', price: 100 });
      cart.applyCoupon('SAVE20');
      expect(cart.calculateTotal()).toBe(80);
    });
  });
});
```

The `describe` blocks create a hierarchy. The `it` blocks read like sentences: "ShoppingCart calculateTotal should return 0 for an empty cart."

> 句型解析: "A reader should understand the test without reading the code." — 读者应该仅通过测试名称就能理解测试的目的，而不需要阅读测试代码本身。

## Test Fixtures — Don't Repeat Yourself

When multiple tests need the same setup, use *fixtures* (测试夹具) to avoid *duplication* (重复).

### Python Fixtures with pytest

```python
import pytest

@pytest.fixture
def calculator():
    """Create a fresh calculator for each test."""
    return Calculator()

@pytest.fixture
def sample_users():
    """Provide a list of test users."""
    return [
        User("Alice", "alice@test.com"),
        User("Bob", "bob@test.com"),
    ]

def test_add(calculator):
    assert calculator.add(2, 3) == 5

def test_subtract(calculator):
    assert calculator.subtract(5, 3) == 2

def test_find_user_by_email(sample_users):
    result = find_by_email(sample_users, "alice@test.com")
    assert result.name == "Alice"
```

pytest automatically injects fixtures into test functions that request them by name. Magic? No, just good design.

### JavaScript Setup with `beforeEach`

```javascript
describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  test('adds two numbers', () => {
    expect(calculator.add(2, 3)).toBe(5);
  });

  test('subtracts two numbers', () => {
    expect(calculator.subtract(5, 3)).toBe(2);
  });
});
```

### Fixture Scope in pytest

```python
@pytest.fixture(scope="function")   # Default: new instance per test
def db_connection():
    ...

@pytest.fixture(scope="module")     # One instance per test file
def db_connection():
    ...

@pytest.fixture(scope="session")    # One instance for entire test run
def db_connection():
    ...
```

> 句型解析: "When multiple tests need the same setup, you can use fixtures to avoid duplication." — fixtures (夹具) 在测试中指的是预先准备好的测试数据或环境配置。

## Parameterized Tests — One Test, Many Inputs

Instead of writing separate tests for each input, use *parameterized* (参数化的) tests to run the same logic with different data.

### Python: `@pytest.mark.parametrize`

```python
import pytest

@pytest.mark.parametrize("a, b, expected", [
    (1, 1, 2),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
    (-5, -3, -8),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

This single test function generates **five** test cases. Much cleaner than writing five separate functions.

### JavaScript: `test.each`

```javascript
test.each([
  [1, 1, 2],
  [0, 0, 0],
  [-1, 1, 0],
  [100, 200, 300],
  [-5, -3, -8],
])('add(%i, %i) should return %i', (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});
```

## Edge Cases — Where Bugs Hide

Good tests cover not just the "happy path" but also *edge cases* (边界情况) — unusual or extreme inputs that are likely to cause bugs.

### Common Edge Cases to Test

```python
# Empty inputs
def test_sort_empty_list():
    assert sort_list([]) == []

# Single element
def test_sort_single_element():
    assert sort_list([42]) == [42]

# Boundary values
def test_age_at_minimum_boundary():
    assert is_adult(18) == True

def test_age_below_minimum():
    assert is_adult(17) == False

# None / null
def test_format_name_with_none():
    with pytest.raises(TypeError):
        format_name(None)

# Very large inputs
def test_fibonacci_large_number():
    result = fibonacci(100)
    assert result == 354224848179261915075

# Special characters
def test_sanitize_html_entities():
    assert sanitize("<script>alert('xss')</script>") == ""

# Unicode
def test_username_with_chinese_characters():
    user = create_user("张三")
    assert user.name == "张三"
```

### The ZOMBIES Mnemonic

Use **ZOMBIES** to remember which scenarios to test:

- **Z**ero — empty collections, zero values, null
- **O**ne — single element, first/last item
- **M**any — multiple elements, typical usage
- **B**oundary — min/max values, off-by-one errors
- **I**nterface — public API contracts
- **E**xceptions — error conditions, invalid inputs
- **S**imple — the simplest happy path

## Organizing Test Files

A well-organized test structure mirrors your source code:

```
project/
├── src/
│   ├── models/
│   │   ├── user.py
│   │   └── order.py
│   ├── services/
│   │   ├── auth_service.py
│   │   └── order_service.py
│   └── utils/
│       └── validators.py
├── tests/
│   ├── models/
│   │   ├── test_user.py
│   │   └── test_order.py
│   ├── services/
│   │   ├── test_auth_service.py
│   │   └── test_order_service.py
│   └── utils/
│       └── test_validators.py
├── conftest.py              # Shared fixtures
└── pytest.ini               # pytest configuration
```

### Naming Conventions

| Language | Test File | Test Function |
|----------|-----------|---------------|
| Python | `test_module.py` or `module_test.py` | `def test_something():` |
| JavaScript | `module.test.js` or `module.spec.js` | `test('something', ...)` or `it('should ...', ...)` |
| Java | `ModuleTest.java` | `@Test void shouldDoSomething()` |

## Configuration Files

### pytest Configuration (`pytest.ini`)

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = -v --tb=short
```

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  verbose: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

## Useful pytest Commands

```bash
# Run tests and stop at first failure
pytest -x

# Show local variables on failure
pytest -l

# Run only tests matching a keyword
pytest -k "login"

# Run tests that failed last time
pytest --lf

# Run tests with coverage report
pytest --cov=src --cov-report=html
```

## Key Takeaways

- A unit test tests the **smallest unit** of code in isolation
- Follow the **AAA pattern**: Arrange → Act → Assert
- Use **descriptive test names** that explain the scenario and expected result
- Use **fixtures** to share setup code and avoid duplication
- Use **parameterized tests** to run one test with multiple inputs
- **Mirror** your source structure in your test directory
- Test **edge cases** using the ZOMBIES mnemonic
- Well-organized tests are *maintainable* (可维护的) and serve as living documentation

Next up: test doubles — mocks, stubs, and fakes. Because sometimes you need to lie to your code.
