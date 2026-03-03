---
layout: article
title: "Testing Patterns & Anti-Patterns"
description: "Best practices and common mistakes — test smells, flaky tests, and writing tests that stand the test of time"
lang: en
level: advanced
tags: ["Testing Patterns", "Anti-Patterns", "Best Practices", "Test Smells"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 9
prev:
  title: "Code Coverage & Test Quality"
  url: "08-code-coverage.html"
next:
  title: "Testing in CI/CD Pipelines"
  url: "10-testing-in-cicd.html"
---

## 1. Patterns vs. Anti-Patterns

A **pattern** is a proven solution to a recurring problem. An **anti-pattern** is a common practice that *appears* to be a solution but actually creates more problems than it solves.

In testing, patterns make your tests **reliable**, **readable**, and **maintainable**. Anti-patterns make them **fragile**, **slow**, and *misleading* (误导性的). Learning to recognize both is essential for writing tests that last.

## 2. Pattern: One Assertion Per Test

Each test should verify **one** logical concept. This does not necessarily mean one `assert` statement — it means one *behavioral expectation* (行为期望).

### Good: Focused Assertions

```python
def test_user_registration_creates_account():
    result = register_user("Alice", "alice@test.com")
    assert result.success == True
    assert result.user.name == "Alice"
    assert result.user.email == "alice@test.com"
```

These three assertions all verify the same behavior: "registration creates an account with the correct data."

### Bad: Multiple Unrelated Behaviors

```python
def test_user_system():
    # Testing registration
    user = register_user("Alice", "alice@test.com")
    assert user is not None

    # Testing login
    token = login("alice@test.com", "password")
    assert token is not None

    # Testing profile update
    updated = update_profile(user.id, name="Bob")
    assert updated.name == "Bob"
```

If this test fails, which behavior broke? Split it into three tests.

## 3. Pattern: Arrange-Act-Assert Separation

Keep the three phases **visually distinct** with blank lines:

```python
def test_apply_coupon_reduces_total():
    # Arrange
    cart = ShoppingCart()
    cart.add_item(Item("Book", 50))
    cart.add_item(Item("Pen", 10))

    # Act
    cart.apply_coupon("SAVE20")

    # Assert
    assert cart.total == 48  # 20% off 60 = 48
```

### Anti-Pattern: Interleaved Act and Assert

```python
# BAD — mixing actions and assertions
def test_shopping_flow():
    cart = ShoppingCart()

    cart.add_item(Item("Book", 50))
    assert cart.total == 50        # Assert after first action

    cart.add_item(Item("Pen", 10))
    assert cart.total == 60        # Assert after second action

    cart.apply_coupon("SAVE20")
    assert cart.total == 48        # Assert after third action
```

This is three tests disguised as one.

## 4. Pattern: Test Data Builders

Instead of constructing complex objects in every test, use **builder functions** with sensible defaults:

```python
def make_user(
    name="Test User",
    email="test@example.com",
    role="user",
    is_active=True,
):
    return User(name=name, email=email, role=role, is_active=is_active)

def make_order(
    user=None,
    items=None,
    status="pending",
):
    if user is None:
        user = make_user()
    if items is None:
        items = [Item("Default Item", 10)]
    return Order(user=user, items=items, status=status)

# Tests only specify what matters for the scenario
def test_admin_can_cancel_any_order():
    admin = make_user(role="admin")
    order = make_order(status="confirmed")

    result = cancel_order(admin, order)

    assert result.success == True
    assert order.status == "cancelled"
```

> 句型解析: "Tests only specify what matters for the scenario." — 测试只需要指定与当前场景相关的参数，其他参数使用默认值。这使测试更简洁，也让读者一眼就能看出哪些数据对测试结果有影响。

## 5. Pattern: Given-When-Then (BDD Style)

For tests that describe *user stories* (用户故事), the **Given-When-Then** format reads naturally:

```python
def test_given_premium_member_when_purchasing_then_free_shipping():
    # Given a premium member with items in cart
    user = make_user(membership="premium")
    cart = ShoppingCart(user)
    cart.add_item(Item("Laptop", 999))

    # When they proceed to checkout
    order = checkout(cart)

    # Then shipping is free
    assert order.shipping_cost == 0
```

### In JavaScript (Cucumber-style)

```javascript
describe('Shipping costs', () => {
  it('should be free for premium members', () => {
    // Given
    const user = createUser({ membership: 'premium' });
    const cart = new ShoppingCart(user);
    cart.addItem({ name: 'Laptop', price: 999 });

    // When
    const order = checkout(cart);

    // Then
    expect(order.shippingCost).toBe(0);
  });
});
```

## 6. Anti-Pattern: The Liar

A **Liar** test always passes but does not actually test anything:

```python
# The Liar — no assertions, just calls code
def test_process_order():
    order = create_order()
    process_order(order)
    # Passes even if process_order is completely broken

# Another Liar — trivially true assertion
def test_add():
    result = add(2, 3)
    assert True  # Always passes!
```

**How to spot it**: If you can delete the production code and the test still passes, it is a liar.

## 7. Anti-Pattern: The Giant

A **Giant** test is too long and tests too many things:

```python
# BAD — 50+ lines testing multiple features
def test_everything():
    user = register("alice@test.com", "password123")
    assert user is not None

    token = login("alice@test.com", "password123")
    assert token is not None

    profile = get_profile(token)
    assert profile.name == "alice"

    update_profile(token, name="Alice Smith")
    profile = get_profile(token)
    assert profile.name == "Alice Smith"

    create_post(token, "Hello World")
    posts = get_posts(token)
    assert len(posts) == 1

    delete_account(token)
    assert login("alice@test.com", "password123") is None
```

**Fix**: Split into focused, independent tests.

## 8. Anti-Pattern: Flaky Tests

A **flaky test** is one that sometimes passes and sometimes fails without any code changes. Flaky tests are *insidious* (隐匿的/有害的) because they *erode* (侵蚀) trust in the test suite.

### Common Causes of Flakiness

| Cause | Example | Fix |
| --- | --- | --- |
| **Timing dependencies** | `sleep(1)` then check result | Use explicit waits or polling |
| **Shared state** | Test A modifies global variable | Reset state in `setUp` |
| **Order dependency** | Test B assumes Test A ran first | Make each test independent |
| **Random data** | Using `random.choice()` in tests | Use fixed seeds or deterministic data |
| **Time-based logic** | Testing code that uses `datetime.now()` | Inject a clock/time provider |
| **Network calls** | External API is sometimes slow | Mock external dependencies |

### Example: Fixing a Time-Based Flaky Test

```python
# FLAKY — depends on current time
def test_greeting_says_good_morning():
    assert get_greeting() == "Good morning"  # Fails in the afternoon!

# FIXED — inject the time
def test_greeting_says_good_morning():
    morning_time = datetime(2024, 1, 1, 9, 0, 0)
    assert get_greeting(current_time=morning_time) == "Good morning"
```

### Example: Fixing a Shared State Flaky Test

```python
# FLAKY — depends on test execution order
counter = 0

def test_increment():
    global counter
    counter += 1
    assert counter == 1  # Fails if another test modified counter first!

# FIXED — reset state before each test
@pytest.fixture(autouse=True)
def reset_counter():
    global counter
    counter = 0
```

> 句型解析: "Flaky tests are insidious because they erode trust in the test suite." — "insidious" (隐匿有害的) 指表面上看不出问题但暗中造成伤害。flaky tests 会让团队逐渐不信任测试结果，最终忽略测试失败。

## 9. Anti-Pattern: Testing Implementation Details

Tests should verify **what** the code does, not **how** it does it internally:

```python
# BAD — testing internal implementation
def test_sort_uses_quicksort():
    sorter = Sorter()
    sorter.sort([3, 1, 2])
    assert sorter._algorithm == "quicksort"  # Testing private state!

# GOOD — testing observable behavior
def test_sort_returns_sorted_list():
    assert Sorter().sort([3, 1, 2]) == [1, 2, 3]
```

```javascript
// BAD — testing internal method calls
test('calls internal helper', () => {
  const spy = jest.spyOn(calculator, '_validateInput');
  calculator.add(2, 3);
  expect(spy).toHaveBeenCalled();  // Tests HOW, not WHAT
});

// GOOD — testing the result
test('adds two numbers', () => {
  expect(calculator.add(2, 3)).toBe(5);
});
```

## 10. Anti-Pattern: Excessive Setup

If your test requires 30 lines of setup, the code under test might have too many dependencies:

```python
# BAD — excessive setup indicates design problem
def test_process_payment():
    db = MockDatabase()
    cache = MockCache()
    logger = MockLogger()
    config = MockConfig()
    metrics = MockMetrics()
    validator = InputValidator(config)
    sanitizer = InputSanitizer(config)
    gateway = MockPaymentGateway()
    notifier = MockNotifier(logger)
    auditor = MockAuditor(db, logger)
    processor = PaymentProcessor(
        db, cache, logger, config, metrics,
        validator, sanitizer, gateway, notifier, auditor
    )

    result = processor.process(amount=100)
    assert result.success
```

**Fix**: The `PaymentProcessor` class has too many dependencies. Refactor it into smaller, focused classes.

## 11. Pattern: Test Isolation Strategies

### Strategy 1: Fresh Instances

Create new objects for every test — the simplest approach:

```python
def test_cart_starts_empty():
    cart = ShoppingCart()  # Fresh instance
    assert cart.total == 0

def test_cart_adds_items():
    cart = ShoppingCart()  # Another fresh instance
    cart.add_item(Item("Book", 10))
    assert cart.total == 10
```

### Strategy 2: Setup and Teardown

```python
class TestUserService:
    def setup_method(self):
        self.db = FakeDatabase()
        self.service = UserService(self.db)

    def teardown_method(self):
        self.db.clear()

    def test_create_user(self):
        self.service.create("Alice")
        assert self.db.count("users") == 1
```

### Strategy 3: Database Transactions

```python
@pytest.fixture
def db_session():
    session = create_session()
    session.begin_nested()
    yield session
    session.rollback()
```

## 12. Pattern: Testing Error Paths

Do not just test the happy path — test **every way** things can go wrong:

```python
class TestWithdrawal:
    def test_successful_withdrawal(self):
        account = Account(balance=100)
        account.withdraw(50)
        assert account.balance == 50

    def test_insufficient_funds(self):
        account = Account(balance=30)
        with pytest.raises(InsufficientFundsError):
            account.withdraw(50)

    def test_negative_amount(self):
        account = Account(balance=100)
        with pytest.raises(ValueError, match="Amount must be positive"):
            account.withdraw(-10)

    def test_zero_amount(self):
        account = Account(balance=100)
        with pytest.raises(ValueError, match="Amount must be positive"):
            account.withdraw(0)

    def test_withdrawal_exceeding_daily_limit(self):
        account = Account(balance=100000, daily_limit=5000)
        with pytest.raises(DailyLimitExceededError):
            account.withdraw(6000)
```

## 13. Pattern: Descriptive Failure Messages

When a test fails, the failure message should tell you **what went wrong** without reading the code:

```python
# BAD — unhelpful failure message
def test_discount():
    assert calculate_discount(100, "VIP") == 80
    # Failure: assert 90 == 80 — but why?

# GOOD — descriptive failure message
def test_vip_discount_is_20_percent():
    actual = calculate_discount(100, "VIP")
    expected = 80
    assert actual == expected, (
        f"VIP discount should be 20%: "
        f"expected {expected} for price 100, got {actual}"
    )
```

## 14. Test Smell Checklist

Use this checklist to *audit* (审计/审查) your test suite:

| Smell | Symptom | Remedy |
| --- | --- | --- |
| **Fragile test** | Breaks when *unrelated* code changes | Test behavior, not implementation |
| **Slow test** | Takes more than 1 second | Mock external dependencies |
| **Mystery guest** | Test uses data defined elsewhere, unclear where it comes from | Define test data inline or use named fixtures |
| **Eager test** | Tests multiple behaviors | Split into focused tests |
| **Obscure test** | Hard to understand what is being tested | Use descriptive names and clear AAA structure |
| **Conditional logic in test** | Contains `if/else` in test code | Each branch should be a separate test |
| **Magic numbers** | Uses unexplained numeric values | Use named constants or comments |
| **Dead test** | Always passes, never fails | Review or delete it |

## 15. Key Takeaways

- Write **one behavior per test** — if a test fails, you should immediately know why
- Follow **Arrange-Act-Assert** with clear visual separation
- Use **test data builders** to keep tests clean and focused on what matters
- **Flaky tests** destroy team trust — fix or delete them immediately
- Test **behavior** (outputs and side effects), not **implementation** (internal method calls)
- Test **error paths** as *thoroughly* (全面地) as happy paths
- Excessive setup is a *design smell* (设计异味) — it tells you the code needs refactoring
- Use the **test smell checklist** to regularly audit your test suite quality
- Good tests are **readable**, **reliable**, and **fast** — like good documentation that runs
