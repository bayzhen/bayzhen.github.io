---
layout: article
title: "Test Doubles — Mocks, Stubs, Fakes, and Spies"
description: "Master the art of isolating code under test using mocks, stubs, fakes, and spies"
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

## 1. The Problem: External Dependencies

Real-world code rarely works in isolation. A function might call a database, send an HTTP request, read a file, or depend on the current time. These *external dependencies* (外部依赖) make testing difficult because:

- They are **slow** — network calls take hundreds of milliseconds
- They are **unreliable** — external services can be down
- They are **non-deterministic** (不确定的) — results change between runs
- They have **side effects** — sending real emails in tests is a bad idea

The solution is to replace these dependencies with **test doubles** — objects that *simulate* (模拟) the behavior of real dependencies.

> 句型解析: "The solution is to replace these dependencies with test doubles — objects that simulate the behavior of real dependencies." — 破折号后面是对 "test doubles" 的解释，即用模拟真实依赖行为的替代对象来代替真正的外部依赖。

## 2. The Five Types of Test Doubles

The term "test double" comes from the movie industry, where a *stunt double* (替身演员) replaces the real actor for dangerous scenes. In testing, a test double replaces a real dependency.

| Type | Purpose | Returns Data? | Records Calls? |
| --- | --- | --- | --- |
| **Dummy** | Fills a parameter slot, never actually used | No | No |
| **Stub** | Returns *predetermined* (预设的) values | Yes | No |
| **Fake** | Has a working implementation, but simplified | Yes | No |
| **Spy** | Wraps the real object, records calls | Yes (real) | Yes |
| **Mock** | Pre-programmed with expectations | Yes (configured) | Yes |

Let us examine each one with concrete examples.

## 3. Dummy Objects

A **dummy** is the simplest test double. It is passed as an argument but never actually used. Its only purpose is to satisfy a *function signature* (函数签名).

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

In this test, we do not care about logging. The `DummyLogger` exists only because `process_order` requires a logger parameter.

## 4. Stubs — Returning Predetermined Values

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

- You need to **control** what a dependency returns
- You want the test to be **deterministic** — same input, same output, every time
- The real dependency is **slow** or **unavailable** in the test environment

## 5. Fakes — Simplified Implementations

A **fake** has a working implementation, but takes shortcuts that make it unsuitable for production. The most common example is an **in-memory database** that replaces a real database.

```python
class FakeUserRepository:
    """In-memory storage — behaves like a real database but uses a dict."""
    def __init__(self):
        self._users = {}
        self._next_id = 1

    def save(self, user):
        user.id = self._next_id
        self._users[self._next_id] = user
        self._next_id += 1
        return user

    def find_by_id(self, user_id):
        return self._users.get(user_id)

    def find_by_email(self, email):
        for user in self._users.values():
            if user.email == email:
                return user
        return None

    def count(self):
        return len(self._users)

def test_register_user():
    fake_repo = FakeUserRepository()
    service = UserService(repository=fake_repo)

    user = service.register("Alice", "alice@example.com")

    assert user.id == 1
    assert user.name == "Alice"
    assert fake_repo.count() == 1
    assert fake_repo.find_by_email("alice@example.com").name == "Alice"
```

> 句型解析: "A fake has a working implementation, but takes shortcuts that make it unsuitable for production." — "take shortcuts" (走捷径) 意思是简化实现，例如用内存字典代替真正的数据库，功能可用但不适合生产环境。

### Fakes vs. Stubs

| Aspect | Stub | Fake |
| --- | --- | --- |
| Complexity | Very simple — returns fixed values | Has real logic, simplified |
| State | Stateless | Stateful — remembers data |
| Use case | Single-response scenarios | Scenarios requiring CRUD operations |

## 6. Spies — Recording Interactions

A **spy** wraps the real object and records how it was called — which methods, with what arguments, and how many times. It lets the real implementation run while *observing* (观察) the interactions.

### Python: Using `unittest.mock`

```python
from unittest.mock import patch, call

class EmailService:
    def send(self, to, subject, body):
        # Real implementation sends actual email
        ...

def test_order_confirmation_sends_email():
    email_service = EmailService()

    with patch.object(email_service, 'send', wraps=email_service.send) as spy:
        order_processor = OrderProcessor(email_service)
        order_processor.complete_order(order_id=42, email="user@test.com")

        # Verify the spy recorded the call
        spy.assert_called_once_with(
            "user@test.com",
            "Order Confirmation",
            "Your order #42 has been confirmed."
        )
```

### JavaScript: Using Jest Spies

```javascript
test('logs a warning when discount exceeds 50%', () => {
  const logger = { warn: jest.fn() };
  const cart = new ShoppingCart(logger);

  cart.applyDiscount(0.75); // 75% discount

  expect(logger.warn).toHaveBeenCalledWith(
    'Discount exceeds 50%: 0.75'
  );
  expect(logger.warn).toHaveBeenCalledTimes(1);
});
```

### When to Use Spies

- You want to verify **side effects** — "was this method called?"
- You need to check **call arguments** — "was it called with the right data?"
- You want to count **call frequency** — "was it called exactly once?"

## 7. Mocks — Pre-Programmed Expectations

A **mock** is the most powerful test double. It is pre-programmed with *expectations* (预期行为) — what methods should be called, with what arguments, and what to return. If expectations are not met, the test fails.

### Python: Using `unittest.mock.Mock`

```python
from unittest.mock import Mock, patch

def test_payment_processing():
    # Create a mock payment gateway
    mock_gateway = Mock()
    mock_gateway.charge.return_value = {"status": "success", "transaction_id": "txn_123"}

    # Use the mock
    processor = PaymentProcessor(gateway=mock_gateway)
    result = processor.process_payment(amount=99.99, card="4111111111111111")

    # Verify behavior
    mock_gateway.charge.assert_called_once_with(
        amount=99.99,
        card_number="4111111111111111"
    )
    assert result.transaction_id == "txn_123"
```

### Python: Using `patch` as a Decorator

```python
from unittest.mock import patch

@patch('myapp.services.requests.get')
def test_fetch_user_profile(mock_get):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "name": "Alice",
        "email": "alice@example.com"
    }

    profile = fetch_user_profile(user_id=1)

    assert profile.name == "Alice"
    mock_get.assert_called_once_with("https://api.example.com/users/1")
```

### JavaScript: Using Jest Mocks

```javascript
// Mock an entire module
jest.mock('./emailService');

const { sendEmail } = require('./emailService');

test('sends welcome email on registration', async () => {
  sendEmail.mockResolvedValue({ delivered: true });

  const result = await registerUser('alice@test.com', 'password123');

  expect(sendEmail).toHaveBeenCalledWith({
    to: 'alice@test.com',
    subject: 'Welcome!',
    template: 'welcome',
  });
  expect(result.success).toBe(true);
});
```

## 8. Choosing the Right Test Double

Use this decision tree:

```
Do you need the dependency at all?
├── No → Use a DUMMY
└── Yes
    ├── Do you need it to return specific data?
    │   ├── Simple, fixed data → Use a STUB
    │   └── Needs CRUD / state → Use a FAKE
    └── Do you need to verify interactions?
        ├── Just check calls → Use a SPY
        └── Configure returns + check calls → Use a MOCK
```

### A Practical Rule of Thumb

> *Prefer stubs and fakes over mocks.* Stubs and fakes test **what** your code produces (output). Mocks test **how** your code does it (behavior). Testing output is more *resilient* (有弹性的) to *refactoring* (重构) than testing behavior.

> 句型解析: "Testing output is more resilient to refactoring than testing behavior." — 测试输出结果比测试具体行为更能适应代码重构。如果你只检查"结果是否正确"，内部实现改变时测试仍然通过；但如果你检查"是否调用了某个方法"，一旦重构就可能导致测试失败。

## 9. Dependency Injection — Making Code Testable

The key to using test doubles effectively is **Dependency Injection** (DI, 依赖注入) — passing dependencies into a class or function instead of creating them internally.

### Bad: Hard-Coded Dependency (Hard to Test)

```python
class OrderService:
    def __init__(self):
        self.db = PostgresDatabase()      # Hard-coded!
        self.email = SmtpEmailService()    # Hard-coded!

    def place_order(self, order):
        self.db.save(order)
        self.email.send(order.user_email, "Order placed")
```

### Good: Injected Dependencies (Easy to Test)

```python
class OrderService:
    def __init__(self, db, email_service):
        self.db = db                       # Injected!
        self.email = email_service         # Injected!

    def place_order(self, order):
        self.db.save(order)
        self.email.send(order.user_email, "Order placed")

# In production
service = OrderService(PostgresDatabase(), SmtpEmailService())

# In tests
service = OrderService(FakeDatabase(), Mock())
```

## 10. Common Mocking Mistakes

### Mistake 1: Over-Mocking

```python
# BAD: Mocking everything, testing nothing
def test_process_data():
    mock_reader = Mock()
    mock_transformer = Mock()
    mock_writer = Mock()
    mock_reader.read.return_value = "data"
    mock_transformer.transform.return_value = "transformed"

    process_data(mock_reader, mock_transformer, mock_writer)

    mock_writer.write.assert_called_with("transformed")
    # This test only verifies that mocks are wired together!
```

### Mistake 2: Mocking What You Don't Own

Do not mock third-party libraries directly. Instead, create a thin *wrapper* (包装器) around them and mock the wrapper.

```python
# BAD: Mocking requests directly everywhere
@patch('requests.get')
def test_fetch_data(mock_get):
    ...

# GOOD: Wrap the HTTP client and mock the wrapper
class HttpClient:
    def get(self, url):
        return requests.get(url)

# Now mock HttpClient in tests
```

### Mistake 3: Not Resetting Mocks

```javascript
// BAD: Shared mock state leaks between tests
const mockFn = jest.fn();

test('first test', () => {
  mockFn('hello');
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test('second test', () => {
  // FAILS! mockFn was already called once
  expect(mockFn).toHaveBeenCalledTimes(0);
});

// GOOD: Reset in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 11. Key Takeaways

- **Test doubles** replace real dependencies to make tests fast, isolated, and deterministic
- There are five types: **Dummy**, **Stub**, **Fake**, **Spy**, and **Mock**
- **Stubs** return predetermined values — use them to control test inputs
- **Fakes** have simplified but working implementations — use them for stateful dependencies like databases
- **Spies** record interactions — use them to verify side effects
- **Mocks** combine configured returns with call verification — use them *sparingly* (谨慎地)
- **Dependency Injection** is the key technique that makes code testable
- *Prefer testing outputs over interactions* — it makes your tests more resilient to refactoring
