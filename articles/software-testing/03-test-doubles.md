---
layout: article
title: "Test Doubles — Mocks, Stubs, Fakes, and Spies"
description: "How to test code that talks to databases, APIs, and other things you can't control — without actually talking to them"
lang: en
level: intermediate
tags: ["Test Doubles", "Mocking", "Isolation", "pytest", "Jest"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 3
prev:
  title: "Unit Testing Fundamentals"
  url: "02-unit-testing-fundamentals.html"
next:
  title: "Test-Driven Development (TDD)"
  url: "04-test-driven-development.html"
---

## The Problem

You're writing a function that sends an email. How do you test it without actually sending emails?

You're testing a payment processor. How do you test it without charging real credit cards?

You're building a weather app. How do you test it without waiting for the weather to change?

**Answer: You lie.**

Not to your users. To your tests. You replace real dependencies with fake ones that behave exactly how you need them to. These fakes are called **test doubles**.

## The Five Types of Test Doubles

The term "test double" comes from the movie industry, where a *stunt double* (替身演员) replaces the real actor for dangerous scenes. In testing, a test double replaces a real dependency.

| Type | Purpose | Returns Data? | Records Calls? | Complexity |
|------|---------|---------------|----------------|------------|
| **Dummy** | Fills a parameter slot, never used | No | No | Trivial |
| **Stub** | Returns *predetermined* (预设的) values | Yes | No | Simple |
| **Fake** | Has a working implementation, but simplified | Yes | No | Medium |
| **Spy** | Wraps the real object, records calls | Yes (real) | Yes | Medium |
| **Mock** | Pre-programmed with expectations | Yes (configured) | Yes | Complex |

Let's examine each one with real examples.

> 句型解析: "The term 'test double' comes from the movie industry, where a stunt double replaces the real actor for dangerous scenes." — "where" 引导定语从句，解释 movie industry 中 stunt double 的作用。

## Dummy Objects — Just Filling Space

A **dummy** is the simplest test double. It's passed as an argument but never actually used. Its only purpose is to satisfy a *function signature* (函数签名).

```python
class DummyLogger:
    """Never actually called — just fills the logger parameter."""
    pass

def test_process_order_calculates_total():
    dummy_logger = DummyLogger()
    order = Order(items=[Item("Book", 10), Item("Pen", 2)])

    total = process_order(order, logger=dummy_logger)

    assert total == 12
```

In this test, we don't care about logging. The `DummyLogger` exists only because `process_order` requires a logger parameter. If the function tries to call a method on it, the test will fail — which is fine, because that means the function is doing something we didn't expect.

## Stubs — Returning Canned Answers

A **stub** provides *canned answers* (预设答案) to calls made during the test. It replaces a dependency that would normally fetch data from an external source.

### Python Example

```python
class StubWeatherAPI:
    """Always returns sunny weather, regardless of location."""
    def get_weather(self, city):
        return {"temperature": 25, "condition": "sunny"}

def test_outdoor_activity_recommendation():
    stub_api = StubWeatherAPI()
    recommender = ActivityRecommender(weather_api=stub_api)

    result = recommender.suggest("Beijing")

    assert result == "Go for a walk in the park"
```

The stub doesn't care what city you pass. It always returns sunny weather. This makes the test *deterministic* (确定性的) — it produces the same result every time.

### JavaScript Example

```javascript
test('recommends outdoor activity when weather is sunny', () => {
  const stubWeatherAPI = {
    getWeather: () => ({ temperature: 25, condition: 'sunny' }),
  };

  const recommender = new ActivityRecommender(stubWeatherAPI);
  const result = recommender.suggest('Beijing');

  expect(result).toBe('Go for a walk in the park');
});
```

### When to Use Stubs

- Testing code that depends on external APIs
- Simulating different scenarios (success, failure, timeout)
- Making tests fast and repeatable

## Fakes — Simplified Working Implementations

A **fake** has a working implementation, but it's simplified for testing. The classic example is an in-memory database.

```python
class FakeDatabase:
    """In-memory database for testing."""
    def __init__(self):
        self.users = {}

    def save_user(self, user):
        self.users[user.id] = user

    def get_user(self, user_id):
        return self.users.get(user_id)

    def delete_user(self, user_id):
        if user_id in self.users:
            del self.users[user_id]

def test_user_repository():
    fake_db = FakeDatabase()
    repo = UserRepository(fake_db)

    # Save a user
    user = User(id=1, name="Alice")
    repo.save(user)

    # Retrieve the user
    retrieved = repo.get(1)
    assert retrieved.name == "Alice"

    # Delete the user
    repo.delete(1)
    assert repo.get(1) is None
```

The `FakeDatabase` behaves like a real database, but it stores data in memory instead of on disk. This makes tests **fast** and **isolated** — no need to set up a real database.

### JavaScript Example

```javascript
class FakeUserService {
  constructor() {
    this.users = new Map();
  }

  async createUser(user) {
    this.users.set(user.id, user);
    return user;
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async deleteUser(id) {
    this.users.delete(id);
  }
}

test('user repository saves and retrieves users', async () => {
  const fakeService = new FakeUserService();
  const repo = new UserRepository(fakeService);

  await repo.save({ id: 1, name: 'Alice' });
  const user = await repo.get(1);

  expect(user.name).toBe('Alice');
});
```

### When to Use Fakes

- Replacing databases, file systems, or other infrastructure
- When you need realistic behavior but don't want external dependencies
- When stubs are too simple and mocks are too complex

## Spies — Recording What Happened

A **spy** wraps the real object and records how it was used. You can then assert that certain methods were called with specific arguments.

### Python Example with unittest.mock

```python
from unittest.mock import Mock

def test_order_processor_sends_confirmation_email():
    spy_email_service = Mock()
    processor = OrderProcessor(email_service=spy_email_service)

    order = Order(customer_email="alice@example.com", total=100)
    processor.process(order)

    # Verify the email service was called
    spy_email_service.send_email.assert_called_once_with(
        to="alice@example.com",
        subject="Order Confirmation",
        body="Your order of $100 has been processed."
    )
```

The spy doesn't prevent the real method from being called — it just records the call so you can verify it later.

### JavaScript Example with Jest

```javascript
test('order processor sends confirmation email', () => {
  const spyEmailService = {
    sendEmail: jest.fn(),
  };

  const processor = new OrderProcessor(spyEmailService);
  const order = { customerEmail: 'alice@example.com', total: 100 };

  processor.process(order);

  expect(spyEmailService.sendEmail).toHaveBeenCalledWith({
    to: 'alice@example.com',
    subject: 'Order Confirmation',
    body: 'Your order of $100 has been processed.',
  });
});
```

### When to Use Spies

- Verifying that a method was called
- Checking the arguments passed to a method
- Counting how many times a method was called

## Mocks — Pre-Programmed Expectations

A **mock** is pre-programmed with expectations about how it should be used. If those expectations aren't met, the test fails.

Mocks are the most powerful test double, but also the most *brittle* (脆弱的). Use them sparingly.

### Python Example

```python
from unittest.mock import Mock

def test_payment_processor_charges_correct_amount():
    mock_payment_gateway = Mock()
    mock_payment_gateway.charge.return_value = {"status": "success", "transaction_id": "12345"}

    processor = PaymentProcessor(mock_payment_gateway)
    result = processor.process_payment(amount=100, card="4111111111111111")

    # Verify the gateway was called correctly
    mock_payment_gateway.charge.assert_called_once_with(
        amount=100,
        card="4111111111111111"
    )

    assert result["status"] == "success"
```

### JavaScript Example

```javascript
test('payment processor charges correct amount', () => {
  const mockPaymentGateway = {
    charge: jest.fn().mockResolvedValue({
      status: 'success',
      transactionId: '12345',
    }),
  };

  const processor = new PaymentProcessor(mockPaymentGateway);
  const result = await processor.processPayment({
    amount: 100,
    card: '4111111111111111',
  });

  expect(mockPaymentGateway.charge).toHaveBeenCalledWith({
    amount: 100,
    card: '4111111111111111',
  });

  expect(result.status).toBe('success');
});
```

### When to Use Mocks

- Verifying interactions with external services
- Testing error handling (simulate failures)
- Ensuring specific methods are called in a specific order

## The Danger of Over-Mocking

Mocks are powerful, but they come with a cost: **they couple your tests to implementation details**.

### Bad Example — Testing Implementation

```python
def test_user_service_saves_to_database():
    mock_db = Mock()
    service = UserService(mock_db)

    service.create_user("Alice", "alice@example.com")

    # ❌ This test knows too much about how the service works internally
    mock_db.execute.assert_called_with(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        ("Alice", "alice@example.com")
    )
```

If you refactor the `UserService` to use an ORM instead of raw SQL, this test breaks — even though the behavior didn't change.

### Good Example — Testing Behavior

```python
def test_user_service_creates_user():
    fake_db = FakeDatabase()
    service = UserService(fake_db)

    user = service.create_user("Alice", "alice@example.com")

    # ✅ This test only cares about the outcome
    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    assert fake_db.get_user(user.id) is not None
```

This test is *resilient* (有韧性的) — it survives refactoring because it tests behavior, not implementation.

> 句型解析: "Mocks couple your tests to implementation details." — "couple" 在这里是动词，意为"使耦合"，即 mocks 会让测试与实现细节紧密绑定。

## Practical Guidelines

### Use This Decision Tree

```
Need to replace a dependency?
│
├─ Never actually used? → Dummy
│
├─ Just need return values? → Stub
│
├─ Need realistic behavior? → Fake
│
├─ Need to verify calls? → Spy
│
└─ Need to verify call order/arguments? → Mock
```

### Prefer Fakes Over Mocks

Fakes are more *maintainable* (可维护的) because they test behavior, not implementation. Mocks are more *fragile* (脆弱的) because they break when you refactor.

### Don't Mock What You Don't Own

Never mock third-party libraries directly. Instead, wrap them in your own interface and mock that.

```python
# ❌ Bad — mocking a third-party library
mock_requests = Mock()
mock_requests.get.return_value = Mock(status_code=200, json=lambda: {"data": "..."})

# ✅ Good — wrap the library in your own interface
class HTTPClient:
    def get(self, url):
        response = requests.get(url)
        return response.json()

fake_http_client = FakeHTTPClient()
```

## Tools of the Trade

### Python

- **unittest.mock** — built-in mocking library
- **pytest-mock** — pytest plugin for easier mocking
- **responses** — mock HTTP requests
- **freezegun** — mock datetime

### JavaScript

- **Jest** — built-in mocking with `jest.fn()` and `jest.mock()`
- **Sinon** — standalone mocking library
- **nock** — mock HTTP requests
- **MockDate** — mock Date objects

## Key Takeaways

- **Test doubles** replace real dependencies to make tests fast, isolated, and repeatable
- **Dummies** fill parameter slots but are never used
- **Stubs** return predetermined values
- **Fakes** have simplified working implementations
- **Spies** record how they were used
- **Mocks** are pre-programmed with expectations
- **Prefer fakes over mocks** — they're more maintainable
- **Don't mock what you don't own** — wrap third-party libraries first
- **Test behavior, not implementation** — avoid coupling tests to internal details

Next up: Test-Driven Development (TDD) — writing tests before code. Sounds crazy, but it works.
