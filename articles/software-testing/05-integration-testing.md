---
layout: article
title: "Integration Testing"
description: "When units meet reality — testing databases, APIs, and the messy boundaries between components"
lang: en
level: intermediate
tags: ["Integration Testing", "Database Testing", "Service Testing"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 5
prev:
  title: "Test-Driven Development (TDD)"
  url: "04-test-driven-development.html"
next:
  title: "Testing REST APIs"
  url: "06-testing-rest-apis.html"
---

## The Orchestra Problem

Unit tests verify that individual components work correctly in isolation. But software is more than isolated components — it's a network of *interconnected* (相互连接的) parts.

Think of it like an orchestra. Testing each instrument individually tells you each one is in tune. But the real question is: **do they sound good when playing together?**

That's what integration testing answers.

> 句型解析: "Testing each instrument in an orchestra individually tells you each one is in tune." — 这个比喻说明单元测试只能检验各个部分单独是否正常，而集成测试才能检验它们协同工作的效果。

## Unit Tests vs. Integration Tests

| Aspect | Unit Test | Integration Test |
|--------|-----------|------------------|
| **Scope** | Single function/class | Multiple components together |
| **Dependencies** | All mocked/stubbed | Real or partially real |
| **Speed** | Milliseconds | Seconds to minutes |
| **Failure diagnosis** | Pinpoints exact issue | Broader — harder to locate root cause |
| **Setup complexity** | Minimal | May need databases, services |
| **When to write** | For all business logic | For component boundaries and data flow |

Integration tests are slower and harder to debug, but they catch a different class of bugs — the ones that only appear when components interact.

## What Can Go Wrong at Integration Points?

Even if every unit test passes, integration can fail because:

- **Data format mismatches** — one component returns JSON, another expects XML
- **Timing issues** — async operations complete in unexpected order
- **Transaction boundaries** — database commits happen at the wrong time
- **Network failures** — services are unreachable or slow
- **Configuration drift** — dev environment differs from production

Integration tests catch these issues before users do.

## Type 1: Module Integration

Tests that two or more modules in your codebase work together correctly.

```python
# Testing that UserService and EmailService work together
def test_registration_sends_welcome_email():
    user_repo = FakeUserRepository()
    email_service = FakeEmailService()
    auth_service = AuthService(user_repo, email_service)

    auth_service.register("alice@example.com", "StrongPass1")

    # Verify both services were used correctly
    assert user_repo.find_by_email("alice@example.com") is not None
    assert email_service.last_sent_to == "alice@example.com"
    assert "Welcome" in email_service.last_subject
```

Notice we're still using fakes here. This is a **narrow integration test** — we're testing the integration between our own modules, not external systems.

## Type 2: Database Integration

Tests that your code interacts with a real database correctly — queries, transactions, and *schema constraints* (模式约束).

### Python Example with SQLAlchemy

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.rollback()
    session.close()

def test_save_and_retrieve_user(db_session):
    repo = SqlAlchemyUserRepository(db_session)

    # Save a user
    user = User(name="Alice", email="alice@test.com")
    repo.save(user)

    # Retrieve the user
    retrieved = repo.find_by_email("alice@test.com")
    assert retrieved.name == "Alice"

def test_unique_email_constraint(db_session):
    repo = SqlAlchemyUserRepository(db_session)

    # First user succeeds
    repo.save(User(name="Alice", email="alice@test.com"))

    # Second user with same email should fail
    with pytest.raises(IntegrityError):
        repo.save(User(name="Bob", email="alice@test.com"))
```

### JavaScript Example with Prisma

```javascript
import { PrismaClient } from '@prisma/client';

describe('UserRepository', () => {
  let prisma;

  beforeEach(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  test('saves and retrieves user', async () => {
    const repo = new UserRepository(prisma);

    await repo.save({ name: 'Alice', email: 'alice@test.com' });
    const user = await repo.findByEmail('alice@test.com');

    expect(user.name).toBe('Alice');
  });

  test('enforces unique email constraint', async () => {
    const repo = new UserRepository(prisma);

    await repo.save({ name: 'Alice', email: 'alice@test.com' });

    await expect(
      repo.save({ name: 'Bob', email: 'alice@test.com' })
    ).rejects.toThrow();
  });
});
```

### Use In-Memory Databases for Speed

For integration tests, use in-memory databases when possible:

- **SQLite** `:memory:` — fast, no disk I/O
- **H2** (Java) — in-memory mode
- **Redis** — already in-memory

This keeps tests fast while still testing real database behavior.

## Type 3: External Service Integration

Tests that your code interacts correctly with external services — APIs, message queues, cloud services.

### Strategy 1: Use Test Instances

Many services provide test environments:

```python
import stripe

def test_payment_processing():
    # Use Stripe's test API key
    stripe.api_key = "sk_test_..."

    charge = stripe.Charge.create(
        amount=1000,
        currency="usd",
        source="tok_visa",  # Test token
    )

    assert charge.status == "succeeded"
```

### Strategy 2: Use Docker Containers

Spin up real services in Docker for testing:

```python
import pytest
import docker
import redis

@pytest.fixture(scope="session")
def redis_container():
    client = docker.from_env()
    container = client.containers.run(
        "redis:7-alpine",
        ports={"6379/tcp": 6379},
        detach=True,
    )
    yield container
    container.stop()
    container.remove()

def test_redis_caching(redis_container):
    cache = redis.Redis(host="localhost", port=6379)
    cache.set("key", "value")
    assert cache.get("key") == b"value"
```

### Strategy 3: Use Contract Testing

Instead of testing against the real service, test against a **contract** — a specification of how the service should behave.

Tools like **Pact** let you define contracts and verify both sides independently.

## Testing Transactions

Database transactions are a common source of bugs. Test them explicitly.

```python
def test_transfer_money_is_atomic(db_session):
    account_repo = AccountRepository(db_session)

    # Create two accounts
    alice = Account(name="Alice", balance=100)
    bob = Account(name="Bob", balance=50)
    account_repo.save(alice)
    account_repo.save(bob)

    # Transfer money
    transfer_service = TransferService(account_repo, db_session)
    transfer_service.transfer(from_id=alice.id, to_id=bob.id, amount=30)

    # Verify balances updated correctly
    alice_updated = account_repo.find(alice.id)
    bob_updated = account_repo.find(bob.id)

    assert alice_updated.balance == 70
    assert bob_updated.balance == 80

def test_transfer_rolls_back_on_insufficient_funds(db_session):
    account_repo = AccountRepository(db_session)

    alice = Account(name="Alice", balance=10)
    bob = Account(name="Bob", balance=50)
    account_repo.save(alice)
    account_repo.save(bob)

    transfer_service = TransferService(account_repo, db_session)

    # Attempt to transfer more than Alice has
    with pytest.raises(InsufficientFundsError):
        transfer_service.transfer(from_id=alice.id, to_id=bob.id, amount=30)

    # Verify no changes were made
    alice_unchanged = account_repo.find(alice.id)
    bob_unchanged = account_repo.find(bob.id)

    assert alice_unchanged.balance == 10
    assert bob_unchanged.balance == 50
```

## Testing Async Code

Async code introduces timing issues. Test them carefully.

### Python Example with asyncio

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_concurrent_requests():
    api = AsyncAPIClient()

    # Make multiple requests concurrently
    results = await asyncio.gather(
        api.fetch_user(1),
        api.fetch_user(2),
        api.fetch_user(3),
    )

    assert len(results) == 3
    assert all(user.id is not None for user in results)

@pytest.mark.asyncio
async def test_timeout_handling():
    api = AsyncAPIClient(timeout=0.1)

    with pytest.raises(asyncio.TimeoutError):
        await api.fetch_slow_endpoint()
```

### JavaScript Example with Promises

```javascript
test('handles concurrent requests', async () => {
  const api = new APIClient();

  const results = await Promise.all([
    api.fetchUser(1),
    api.fetchUser(2),
    api.fetchUser(3),
  ]);

  expect(results).toHaveLength(3);
  expect(results.every(user => user.id !== null)).toBe(true);
});

test('handles timeout', async () => {
  const api = new APIClient({ timeout: 100 });

  await expect(api.fetchSlowEndpoint()).rejects.toThrow('Timeout');
});
```

## Test Data Management

Integration tests need data. Manage it carefully.

### Strategy 1: Fixtures

Load known data before each test:

```python
@pytest.fixture
def sample_users(db_session):
    users = [
        User(name="Alice", email="alice@test.com"),
        User(name="Bob", email="bob@test.com"),
        User(name="Charlie", email="charlie@test.com"),
    ]
    for user in users:
        db_session.add(user)
    db_session.commit()
    return users

def test_search_users(db_session, sample_users):
    repo = UserRepository(db_session)
    results = repo.search("alice")
    assert len(results) == 1
    assert results[0].name == "Alice"
```

### Strategy 2: Factories

Generate test data programmatically:

```python
from factory import Factory, Faker

class UserFactory(Factory):
    class Meta:
        model = User

    name = Faker('name')
    email = Faker('email')
    age = Faker('random_int', min=18, max=80)

def test_user_statistics(db_session):
    # Create 100 random users
    users = [UserFactory() for _ in range(100)]
    for user in users:
        db_session.add(user)
    db_session.commit()

    stats = UserStatistics(db_session)
    avg_age = stats.average_age()

    assert 18 <= avg_age <= 80
```

### Strategy 3: Database Snapshots

For complex setups, use database snapshots:

```bash
# Create a snapshot
pg_dump mydb > test_snapshot.sql

# Restore before each test
psql mydb < test_snapshot.sql
```

## Integration Test Patterns

### Pattern 1: Test Pyramid Compliance

Keep integration tests focused. Don't test business logic here — that's what unit tests are for.

```python
# ❌ BAD — testing business logic in integration test
def test_discount_calculation(db_session):
    order = Order(items=[Item(price=100)])
    order.apply_discount(0.1)
    db_session.add(order)
    db_session.commit()
    assert order.total == 90  # Business logic should be unit tested

# ✅ GOOD — testing database interaction
def test_order_persists_with_discount(db_session):
    order = Order(items=[Item(price=100)])
    order.apply_discount(0.1)
    db_session.add(order)
    db_session.commit()

    retrieved = db_session.query(Order).first()
    assert retrieved.total == 90  # Verifying persistence, not calculation
```

### Pattern 2: Test Isolation

Each test should be independent. Use transactions or cleanup:

```python
@pytest.fixture(autouse=True)
def cleanup_database(db_session):
    yield
    # Rollback after each test
    db_session.rollback()
```

### Pattern 3: Meaningful Assertions

Don't just check that queries don't crash. Verify the actual behavior:

```python
# ❌ BAD — weak assertion
def test_save_user(db_session):
    repo = UserRepository(db_session)
    repo.save(User(name="Alice"))
    # Test passes even if save() does nothing

# ✅ GOOD — strong assertion
def test_save_user(db_session):
    repo = UserRepository(db_session)
    user = User(name="Alice")
    repo.save(user)

    retrieved = repo.find(user.id)
    assert retrieved is not None
    assert retrieved.name == "Alice"
```

## When to Write Integration Tests

Write integration tests for:

- **Database queries** — especially complex joins and transactions
- **External API calls** — verify request/response handling
- **Message queue interactions** — publish/subscribe patterns
- **File I/O** — reading/writing files
- **Authentication flows** — login, token refresh, logout
- **Critical user journeys** — checkout, payment, registration

Don't write integration tests for:

- **Pure business logic** — use unit tests
- **UI rendering** — use E2E tests
- **Every possible scenario** — focus on critical paths

## Key Takeaways

- **Integration tests** verify that components work correctly together
- They're slower than unit tests but catch different bugs
- Use **in-memory databases** for speed
- Use **Docker containers** for external services
- Test **transactions** explicitly — they're a common source of bugs
- Test **async code** carefully — timing issues are subtle
- Keep integration tests **focused** — don't test business logic here
- Each test should be **isolated** and **independent**
- Write integration tests for **component boundaries** and **critical paths**

Next up: testing REST APIs — requests, responses, auth, and all the ways HTTP can fail.
