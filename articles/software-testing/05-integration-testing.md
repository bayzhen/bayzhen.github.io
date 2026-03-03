---
layout: article
title: "Integration Testing"
description: "Testing how components work together — databases, services, and module boundaries"
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

## 1. Beyond Unit Tests

Unit tests verify that individual components work correctly in isolation. But software is more than isolated components — it is a network of *interconnected* (相互连接的) parts. **Integration tests** verify that these parts work correctly **together**.

Consider this analogy: testing each instrument in an orchestra individually tells you each one is in tune. But the real question is: **do they sound good when playing together?** That is what integration testing answers.

> 句型解析: "Testing each instrument in an orchestra individually tells you each one is in tune. But the real question is: do they sound good when playing together?" — 这个比喻说明单元测试只能检验各个部分单独是否正常，而集成测试才能检验它们协同工作的效果。

## 2. Unit Tests vs. Integration Tests

| Aspect | Unit Test | Integration Test |
| --- | --- | --- |
| **Scope** | Single function/class | Multiple components together |
| **Dependencies** | All mocked/stubbed | Real or partially real |
| **Speed** | Milliseconds | Seconds to minutes |
| **Failure diagnosis** | Pinpoints exact issue | Broader — harder to locate root cause |
| **Setup complexity** | Minimal | May need databases, services |
| **When to write** | For all business logic | For component boundaries and data flow |

## 3. Types of Integration Tests

### Type 1: Module Integration

Tests that two or more modules in your codebase work together correctly.

```python
# Testing that UserService and EmailService work together
def test_registration_sends_welcome_email():
    user_repo = FakeUserRepository()
    email_service = FakeEmailService()
    auth_service = AuthService(user_repo, email_service)

    auth_service.register("alice@example.com", "StrongPass1")

    assert user_repo.find_by_email("alice@example.com") is not None
    assert email_service.last_sent_to == "alice@example.com"
    assert "Welcome" in email_service.last_subject
```

### Type 2: Database Integration

Tests that your code interacts with a real database correctly — queries, transactions, and *schema constraints* (模式约束).

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.rollback()
    session.close()

def test_save_and_retrieve_user(db_session):
    repo = SqlAlchemyUserRepository(db_session)

    repo.save(User(name="Alice", email="alice@test.com"))

    user = repo.find_by_email("alice@test.com")
    assert user is not None
    assert user.name == "Alice"
```

### Type 3: External Service Integration

Tests that your code communicates correctly with external APIs, message queues, or file systems.

```python
def test_s3_upload_and_download():
    # Uses a local S3-compatible service (MinIO) for testing
    storage = S3Storage(endpoint="http://localhost:9000", bucket="test")

    storage.upload("test.txt", b"Hello, World!")
    content = storage.download("test.txt")

    assert content == b"Hello, World!"
```

## 4. Database Integration Testing

Database tests are the most common type of integration test. Here are the key patterns.

### Pattern 1: In-Memory Database

Use an in-memory database (like SQLite) that is fast and *disposable* (一次性的).

```python
@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.close()
```

**Pros**: Very fast, no external setup needed.
**Cons**: SQLite may behave differently from PostgreSQL or MySQL — subtle SQL *dialect* (方言) differences can hide bugs.

### Pattern 2: Test Containers

Use Docker containers to spin up real database instances for testing.

```python
import testcontainers.postgres as tc

@pytest.fixture(scope="module")
def postgres_db():
    with tc.PostgresContainer("postgres:15") as pg:
        engine = create_engine(pg.get_connection_url())
        Base.metadata.create_all(engine)
        yield Session(engine)
```

**Pros**: Tests against the real database engine.
**Cons**: Slower startup (a few seconds), requires Docker.

### Pattern 3: Transaction Rollback

Wrap each test in a database *transaction* (事务) and roll it back after the test. This ensures tests do not *pollute* (污染) each other's data.

```python
@pytest.fixture
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

> 句型解析: "Wrap each test in a database transaction and roll it back after the test." — 把每个测试包裹在一个数据库事务中，测试结束后回滚事务。这样测试中写入的数据不会残留，避免测试之间互相干扰。

## 5. Testing with Docker Compose

For complex setups with multiple services, use Docker Compose:

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    ports:
      - "5433:5432"

  redis:
    image: redis:7
    ports:
      - "6380:6379"

  app-test:
    build: .
    command: pytest tests/integration/
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://testuser:testpass@postgres:5432/testdb
      REDIS_URL: redis://redis:6379
```

Run tests with:

```bash
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

## 6. Integration Testing Patterns

### Pattern: Arrange-Act-Assert with Real Dependencies

```python
def test_order_processing_workflow(db_session, fake_payment_gateway):
    # Arrange
    user = create_test_user(db_session)
    product = create_test_product(db_session, price=29.99)
    order_service = OrderService(db_session, fake_payment_gateway)

    # Act
    order = order_service.place_order(user.id, [product.id])

    # Assert
    assert order.status == "confirmed"
    assert order.total == 29.99
    saved_order = db_session.query(Order).filter_by(id=order.id).first()
    assert saved_order is not None
    assert saved_order.user_id == user.id
```

### Pattern: Test Data Builders

Create *helper functions* (辅助函数) that build test data with sensible defaults:

```python
def create_test_user(db, name="Test User", email="test@example.com"):
    user = User(name=name, email=email)
    db.add(user)
    db.flush()
    return user

def create_test_product(db, name="Test Product", price=9.99):
    product = Product(name=name, price=price)
    db.add(product)
    db.flush()
    return product

def test_user_can_have_multiple_orders(db_session):
    user = create_test_user(db_session)
    product_a = create_test_product(db_session, name="Book", price=15)
    product_b = create_test_product(db_session, name="Pen", price=3)

    service = OrderService(db_session)
    service.place_order(user.id, [product_a.id])
    service.place_order(user.id, [product_b.id])

    orders = db_session.query(Order).filter_by(user_id=user.id).all()
    assert len(orders) == 2
```

### Pattern: Cleanup After Test

```python
@pytest.fixture(autouse=True)
def cleanup_uploads():
    """Remove any files uploaded during tests."""
    yield
    upload_dir = Path("./test_uploads")
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
```

## 7. JavaScript Integration Testing

### Testing with a Real Database (Node.js + Prisma)

```javascript
const { PrismaClient } = require('@prisma/client');

let prisma;

beforeAll(async () => {
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean all tables before each test
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
});

test('creates a user and retrieves it', async () => {
  await prisma.user.create({
    data: { name: 'Alice', email: 'alice@test.com' },
  });

  const user = await prisma.user.findUnique({
    where: { email: 'alice@test.com' },
  });

  expect(user).not.toBeNull();
  expect(user.name).toBe('Alice');
});

test('enforces unique email constraint', async () => {
  await prisma.user.create({
    data: { name: 'Alice', email: 'alice@test.com' },
  });

  await expect(
    prisma.user.create({
      data: { name: 'Bob', email: 'alice@test.com' },
    })
  ).rejects.toThrow();
});
```

## 8. Common Integration Testing Mistakes

### Mistake 1: Testing Too Much in One Test

```python
# BAD — this test does too many things
def test_entire_checkout_flow(db_session):
    user = create_user(...)
    product = create_product(...)
    cart = add_to_cart(user, product)
    order = checkout(cart)
    payment = process_payment(order)
    email = send_confirmation(order)
    # If this fails, which step broke?
```

Break it into focused tests, each covering one *integration point* (集成点).

### Mistake 2: Not Isolating Test Data

```python
# BAD — tests share data and depend on execution order
def test_create_user():
    create_user("alice@test.com")

def test_find_user():
    user = find_user("alice@test.com")  # Depends on previous test!
    assert user is not None
```

Each test must create its own data and clean up after itself.

### Mistake 3: Ignoring Test Environment Differences

If your production database is PostgreSQL, testing with SQLite might miss:

- JSON column support differences
- Full-text search behavior
- Concurrent transaction handling
- Specific SQL functions

When *fidelity* (保真度) matters, use the same database engine in tests.

## 9. Integration Test Organization

Separate integration tests from unit tests:

```
tests/
├── unit/                   # Fast, no external dependencies
│   ├── test_calculator.py
│   └── test_validator.py
├── integration/            # Slower, needs database/services
│   ├── test_user_repository.py
│   ├── test_order_service.py
│   └── test_payment_flow.py
├── conftest.py             # Shared fixtures
└── pytest.ini
```

### Running Them Separately

```ini
# pytest.ini
[pytest]
markers =
    integration: marks tests as integration tests
    slow: marks tests as slow
```

```python
@pytest.mark.integration
def test_database_query(db_session):
    ...
```

```bash
# Run only unit tests (exclude integration)
pytest -m "not integration"

# Run only integration tests
pytest -m integration

# Run all tests
pytest
```

## 10. Key Takeaways

- **Integration tests** verify that components work together correctly — they complement unit tests
- The most common type tests **database interactions** — use in-memory databases for speed or test containers for *fidelity* (保真度)
- Use **transaction rollback** to keep tests isolated from each other
- **Test data builders** create reusable helper functions for setting up test data
- **Separate** integration tests from unit tests in your project structure
- Each integration test should cover **one integration point**, not an entire workflow
- Use **Docker Compose** for complex multi-service test environments
- When the database engine matters, test against the **same engine** you use in production
