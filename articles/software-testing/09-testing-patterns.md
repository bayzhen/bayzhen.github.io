---
layout: article
title: "Testing Patterns & Anti-Patterns"
description: "Reusable solutions and common mistakes — how to write tests that last"
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

## Patterns vs. Anti-Patterns

A **pattern** is a proven solution to a recurring problem. An **anti-pattern** is a common practice that *appears* to be a solution but actually creates more problems than it solves.

In testing, patterns make your tests **reliable**, **readable**, and **maintainable**. Anti-patterns make them **fragile**, **slow**, and *misleading* (误导性的).

Let's learn to recognize both.

## Pattern: One Assertion Per Concept

Each test should verify **one** logical concept. This doesn't mean one `assert` statement — it means one *behavioral expectation* (行为期望).

### ✅ Good: Focused Assertions

```python
def test_user_registration_creates_account():
    result = register_user("Alice", "alice@test.com")

    assert result.success == True
    assert result.user.name == "Alice"
    assert result.user.email == "alice@test.com"
```

These three assertions all verify the same behavior: "registration creates an account with the correct data."

### ❌ Bad: Multiple Unrelated Behaviors

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

## Pattern: Clear AAA Separation

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

### ❌ Anti-Pattern: Interleaved Act and Assert

```python
def test_shopping_cart():
    cart = ShoppingCart()
    cart.add_item(Item("Book", 50))
    assert cart.total == 50  # Assert in the middle!
    cart.add_item(Item("Pen", 10))
    assert cart.total == 60  # Another assert!
    cart.apply_coupon("SAVE20")
    assert cart.total == 48  # Yet another!
```

This is hard to read and debug. Stick to AAA.

## Pattern: Test Data Builders

When tests need complex objects, use builders:

```python
class UserBuilder:
    def __init__(self):
        self.name = "Test User"
        self.email = "test@example.com"
        self.age = 25
        self.is_active = True

    def with_name(self, name):
        self.name = name
        return self

    def with_email(self, email):
        self.email = email
        return self

    def inactive(self):
        self.is_active = False
        return self

    def build(self):
        return User(self.name, self.email, self.age, self.is_active)

# Usage
def test_inactive_users_cannot_login():
    user = UserBuilder().inactive().build()
    result = login(user)
    assert result.success == False
```

This is more readable than passing 10 parameters to a constructor.

## Pattern: Object Mother

For common test objects, use factory methods:

```python
class TestUsers:
    @staticmethod
    def alice():
        return User("Alice", "alice@test.com", age=25)

    @staticmethod
    def bob():
        return User("Bob", "bob@test.com", age=30)

    @staticmethod
    def admin():
        return User("Admin", "admin@test.com", role="admin")

# Usage
def test_admin_can_delete_users():
    admin = TestUsers.admin()
    user = TestUsers.alice()

    result = admin.delete_user(user.id)
    assert result.success == True
```

## Anti-Pattern: Test Interdependence

Tests should be **independent**. Each test should run in isolation.

### ❌ Bad: Tests Depend on Each Other

```python
user_id = None

def test_create_user():
    global user_id
    user = create_user("Alice")
    user_id = user.id
    assert user_id is not None

def test_get_user():
    global user_id
    user = get_user(user_id)  # Depends on previous test!
    assert user.name == "Alice"
```

If `test_create_user` fails, `test_get_user` also fails. If tests run in a different order, everything breaks.

### ✅ Good: Independent Tests

```python
def test_create_user():
    user = create_user("Alice")
    assert user.id is not None

def test_get_user():
    # Create user in this test
    user = create_user("Alice")

    retrieved = get_user(user.id)
    assert retrieved.name == "Alice"
```

## Anti-Pattern: Sleeps and Arbitrary Waits

Never use `sleep()` in tests. It makes tests slow and flaky.

### ❌ Bad: Arbitrary Sleep

```python
def test_async_operation():
    start_async_task()
    time.sleep(5)  # Hope it finishes in 5 seconds!
    result = get_result()
    assert result.status == "completed"
```

What if the task takes 6 seconds? What if it takes 1 second? You're either waiting too long or not long enough.

### ✅ Good: Wait for Condition

```python
def test_async_operation():
    start_async_task()

    # Wait up to 10 seconds for completion
    for _ in range(100):
        result = get_result()
        if result.status == "completed":
            break
        time.sleep(0.1)

    assert result.status == "completed"
```

Or better yet, use a proper async testing library.

## Anti-Pattern: Testing Private Methods

Don't test private methods directly. Test them through the public API.

### ❌ Bad: Testing Implementation

```python
class PriceCalculator:
    def calculate(self, items):
        subtotal = self._calculate_subtotal(items)
        tax = self._calculate_tax(subtotal)
        return subtotal + tax

    def _calculate_subtotal(self, items):
        return sum(item.price for item in items)

    def _calculate_tax(self, amount):
        return amount * 0.1

# Don't do this!
def test_calculate_subtotal():
    calc = PriceCalculator()
    result = calc._calculate_subtotal([Item(10), Item(20)])
    assert result == 30
```

### ✅ Good: Testing Behavior

```python
def test_calculate_includes_tax():
    calc = PriceCalculator()
    items = [Item(10), Item(20)]

    total = calc.calculate(items)

    assert total == 33  # 30 + 10% tax
```

If you refactor `_calculate_subtotal`, the first test breaks. The second test doesn't care about implementation.

## Anti-Pattern: Mocking Everything

Over-mocking makes tests brittle and meaningless.

### ❌ Bad: Excessive Mocking

```python
def test_order_processing():
    mock_db = Mock()
    mock_email = Mock()
    mock_payment = Mock()
    mock_inventory = Mock()
    mock_logger = Mock()

    service = OrderService(mock_db, mock_email, mock_payment, mock_inventory, mock_logger)
    service.process_order(order)

    # What are we even testing here?
    mock_db.save.assert_called_once()
```

### ✅ Good: Mock Only External Dependencies

```python
def test_order_processing():
    fake_db = InMemoryDatabase()
    mock_payment_gateway = Mock()  # External service

    service = OrderService(fake_db, mock_payment_gateway)
    order = Order(items=[Item("Book", 10)])

    service.process_order(order)

    # Verify behavior
    assert fake_db.orders.count() == 1
    mock_payment_gateway.charge.assert_called_with(amount=10)
```

## Pattern: Parameterized Tests for Similar Cases

Don't copy-paste tests. Use parameterization.

### ❌ Bad: Repetitive Tests

```python
def test_add_positive_numbers():
    assert add(2, 3) == 5

def test_add_negative_numbers():
    assert add(-2, -3) == -5

def test_add_zero():
    assert add(0, 5) == 5

def test_add_large_numbers():
    assert add(1000, 2000) == 3000
```

### ✅ Good: Parameterized Test

```python
@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (-2, -3, -5),
    (0, 5, 5),
    (1000, 2000, 3000),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

## Pattern: Custom Assertions

For complex assertions, create helpers:

```python
def assert_user_valid(user):
    """Assert that a user object is valid."""
    assert user is not None, "User should not be None"
    assert user.id > 0, "User ID should be positive"
    assert "@" in user.email, "Email should contain @"
    assert len(user.name) > 0, "Name should not be empty"

# Usage
def test_user_registration():
    user = register_user("Alice", "alice@test.com")
    assert_user_valid(user)
```

## Anti-Pattern: Ignoring Flaky Tests

A flaky test is one that sometimes passes and sometimes fails, without code changes.

**Never ignore flaky tests.** They're a sign of:
- Race conditions
- Timing issues
- Shared state between tests
- External dependencies

Fix them or delete them. Don't just re-run until they pass.

## Pattern: Test Naming Convention

Use descriptive names that explain the scenario and expected outcome:

```python
# ✅ Good names
def test_login_with_valid_credentials_succeeds()
def test_login_with_invalid_password_returns_error()
def test_login_with_nonexistent_user_returns_error()
def test_login_with_expired_token_requires_reauth()

# ❌ Bad names
def test_login()
def test_login_2()
def test_login_edge_case()
def test_it_works()
```

## Pattern: Given-When-Then Comments

For complex tests, use Given-When-Then comments:

```python
def test_checkout_with_coupon():
    # Given a cart with items and a valid coupon
    cart = ShoppingCart()
    cart.add_item(Item("Book", 100))
    coupon = Coupon("SAVE20", discount=0.2)

    # When the user applies the coupon and checks out
    cart.apply_coupon(coupon)
    order = cart.checkout()

    # Then the order total reflects the discount
    assert order.total == 80
    assert order.discount_applied == 20
```

## Key Takeaways

- **One assertion per concept** — test one behavior at a time
- **Keep AAA phases separate** — visually distinct Arrange, Act, Assert
- **Use builders and factories** for complex test data
- **Tests must be independent** — no shared state
- **Never use sleep()** — wait for specific conditions
- **Don't test private methods** — test through public API
- **Don't over-mock** — use fakes for internal dependencies
- **Parameterize similar tests** — avoid copy-paste
- **Fix flaky tests** — don't ignore them
- **Use descriptive names** — explain scenario and outcome

Next up: CI/CD pipelines — automating all of this so you never have to think about it.
