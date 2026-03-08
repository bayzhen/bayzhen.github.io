---
layout: article
title: "Testing REST APIs"
description: "Validate your backend — request/response testing, status codes, authentication, and contract testing"
lang: en
level: intermediate
tags: ["API Testing", "REST", "HTTP", "pytest", "Supertest"]
series: software-testing
series_title: "软件测试实战"
title_suffix: "Software Testing Mastery"
order: 6
prev:
  title: "Integration Testing"
  url: "05-integration-testing.html"
next:
  title: "End-to-End Testing"
  url: "07-end-to-end-testing.html"
---

## 1. Why Test APIs?

APIs are the **contract** between your backend and everything that consumes it — frontends, mobile apps, third-party services. If the API breaks, everything breaks.

API testing sits between unit testing and E2E testing on the testing pyramid. It tests the **HTTP layer** — routes, request parsing, validation, authentication, response formatting — without needing a browser or UI.

> 句型解析: "APIs are the contract between your backend and everything that consumes it." — "contract" (合约) 在这里指 API 定义了一套双方都必须遵守的规则，"consumes" (消费/使用) 指调用 API 的客户端。

## 2. What to Test in an API

| Category | What to Verify | Example |
| --- | --- | --- |
| **Status codes** | Correct HTTP status returned | 200 OK, 201 Created, 404 Not Found |
| **Response body** | Correct data structure and values | `{"id": 1, "name": "Alice"}` |
| **Validation** | Invalid input is rejected | Missing required fields → 400 Bad Request |
| **Authentication** | Protected routes require valid tokens | No token → 401 Unauthorized |
| **Authorization** | Users can only access allowed resources | Regular user → 403 Forbidden on admin route |
| **Error handling** | Errors return *meaningful* (有意义的) messages | `{"error": "Email already exists"}` |
| **Edge cases** | Unusual inputs handled gracefully | Empty strings, very long values, special characters |

## 3. Python API Testing with Flask + pytest

### The API Under Test

```python
# app.py
from flask import Flask, request, jsonify

app = Flask(__name__)

users = {}
next_id = 1

@app.route('/users', methods=['POST'])
def create_user():
    global next_id
    data = request.get_json()

    if not data or 'name' not in data or 'email' not in data:
        return jsonify({"error": "name and email are required"}), 400

    if any(u['email'] == data['email'] for u in users.values()):
        return jsonify({"error": "Email already exists"}), 409

    user = {"id": next_id, "name": data['name'], "email": data['email']}
    users[next_id] = user
    next_id += 1
    return jsonify(user), 201

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = users.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user)

@app.route('/users', methods=['GET'])
def list_users():
    return jsonify(list(users.values()))
```

### The Test Suite

```python
# test_app.py
import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def reset_data():
    """Reset the in-memory store before each test."""
    from app import users
    users.clear()
    import app as app_module
    app_module.next_id = 1

class TestCreateUser:
    def test_creates_user_successfully(self, client):
        response = client.post('/users', json={
            "name": "Alice",
            "email": "alice@example.com"
        })

        assert response.status_code == 201
        data = response.get_json()
        assert data['id'] == 1
        assert data['name'] == "Alice"
        assert data['email'] == "alice@example.com"

    def test_returns_400_when_name_missing(self, client):
        response = client.post('/users', json={
            "email": "alice@example.com"
        })

        assert response.status_code == 400
        assert "name and email are required" in response.get_json()['error']

    def test_returns_400_when_body_is_empty(self, client):
        response = client.post('/users',
                              data='',
                              content_type='application/json')

        assert response.status_code == 400

    def test_returns_409_when_email_duplicate(self, client):
        client.post('/users', json={
            "name": "Alice", "email": "alice@example.com"
        })
        response = client.post('/users', json={
            "name": "Bob", "email": "alice@example.com"
        })

        assert response.status_code == 409
        assert "already exists" in response.get_json()['error']

class TestGetUser:
    def test_returns_user_by_id(self, client):
        client.post('/users', json={
            "name": "Alice", "email": "alice@example.com"
        })

        response = client.get('/users/1')

        assert response.status_code == 200
        assert response.get_json()['name'] == "Alice"

    def test_returns_404_for_nonexistent_user(self, client):
        response = client.get('/users/999')

        assert response.status_code == 404
        assert "not found" in response.get_json()['error'].lower()

class TestListUsers:
    def test_returns_empty_list_initially(self, client):
        response = client.get('/users')

        assert response.status_code == 200
        assert response.get_json() == []

    def test_returns_all_users(self, client):
        client.post('/users', json={"name": "Alice", "email": "a@test.com"})
        client.post('/users', json={"name": "Bob", "email": "b@test.com"})

        response = client.get('/users')

        data = response.get_json()
        assert len(data) == 2
```

## 4. JavaScript API Testing with Express + Supertest

### The API Under Test

```javascript
// app.js
const express = require('express');
const app = express();
app.use(express.json());

const users = new Map();
let nextId = 1;

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  for (const user of users.values()) {
    if (user.email === email) {
      return res.status(409).json({ error: 'Email already exists' });
    }
  }

  const user = { id: nextId++, name, email };
  users.set(user.id, user);
  res.status(201).json(user);
});

app.get('/users/:id', (req, res) => {
  const user = users.get(parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = app;
```

### The Test Suite with Supertest

```javascript
// app.test.js
const request = require('supertest');
const app = require('./app');

describe('POST /users', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@test.com' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Alice',
      email: 'alice@test.com',
    });
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 409 when email is duplicate', async () => {
    await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'same@test.com' });

    const res = await request(app)
      .post('/users')
      .send({ name: 'Bob', email: 'same@test.com' });

    expect(res.status).toBe(409);
  });
});

describe('GET /users/:id', () => {
  it('returns 404 for nonexistent user', async () => {
    const res = await request(app).get('/users/999');

    expect(res.status).toBe(404);
  });
});
```

## 5. Testing Authentication

### Testing JWT-Protected Routes

```python
import jwt

@pytest.fixture
def auth_token():
    """Generate a valid JWT token for testing."""
    return jwt.encode(
        {"user_id": 1, "role": "admin"},
        "test-secret",
        algorithm="HS256"
    )

def test_protected_route_requires_token(client):
    response = client.get('/admin/dashboard')
    assert response.status_code == 401

def test_protected_route_accepts_valid_token(client, auth_token):
    response = client.get('/admin/dashboard',
                         headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200

def test_protected_route_rejects_expired_token(client):
    expired_token = jwt.encode(
        {"user_id": 1, "exp": 0},  # Already expired
        "test-secret",
        algorithm="HS256"
    )
    response = client.get('/admin/dashboard',
                         headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
```

### Testing Role-Based Authorization

```python
def test_regular_user_cannot_access_admin_route(client):
    token = create_token(user_id=2, role="user")

    response = client.get('/admin/dashboard',
                         headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403  # Forbidden, not 401

def test_admin_can_access_admin_route(client):
    token = create_token(user_id=1, role="admin")

    response = client.get('/admin/dashboard',
                         headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
```

> 句型解析: "Forbidden, not 401" — 401 Unauthorized 表示"未认证"（没有提供身份），403 Forbidden 表示"未授权"（身份已确认，但没有权限）。这两个状态码经常被混淆。

## 6. Testing Request Validation

```python
class TestInputValidation:
    def test_rejects_email_without_at_sign(self, client):
        response = client.post('/users', json={
            "name": "Alice",
            "email": "not-an-email"
        })
        assert response.status_code == 400

    def test_rejects_name_exceeding_max_length(self, client):
        response = client.post('/users', json={
            "name": "A" * 256,
            "email": "alice@test.com"
        })
        assert response.status_code == 400

    def test_rejects_negative_price(self, client):
        response = client.post('/products', json={
            "name": "Widget",
            "price": -10
        })
        assert response.status_code == 400
        assert "price" in response.get_json()['error'].lower()

    def test_handles_missing_content_type(self, client):
        response = client.post('/users', data='{"name":"Alice"}')
        # Should either parse or return a clear error
        assert response.status_code in (400, 415)
```

## 7. Contract Testing

**Contract testing** ensures that the API producer and consumer agree on the *interface contract* (接口合约) — request format, response structure, and status codes.

### Response Schema Validation

```python
from jsonschema import validate

USER_SCHEMA = {
    "type": "object",
    "required": ["id", "name", "email"],
    "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string", "minLength": 1},
        "email": {"type": "string", "format": "email"},
    },
    "additionalProperties": False
}

def test_user_response_matches_schema(client):
    client.post('/users', json={"name": "Alice", "email": "a@test.com"})

    response = client.get('/users/1')

    validate(instance=response.get_json(), schema=USER_SCHEMA)
```

### Snapshot Testing for APIs

```javascript
test('user response matches snapshot', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'Alice', email: 'alice@test.com' });

  expect(res.body).toMatchSnapshot({
    id: expect.any(Number),     // ID changes, so use a matcher
    name: 'Alice',
    email: 'alice@test.com',
  });
});
```

> 句型解析: "Contract testing ensures that the API producer and consumer agree on the interface contract." — 合约测试确保 API 的提供方和消费方对接口格式达成一致。如果 API 返回的数据结构发生变化，合约测试会立即发现。

## 8. Testing Pagination and Filtering

```python
class TestPagination:
    @pytest.fixture(autouse=True)
    def seed_data(self, client):
        """Create 25 users for pagination tests."""
        for i in range(25):
            client.post('/users', json={
                "name": f"User {i}",
                "email": f"user{i}@test.com"
            })

    def test_default_page_returns_10_items(self, client):
        response = client.get('/users')
        data = response.get_json()
        assert len(data['items']) == 10
        assert data['total'] == 25
        assert data['page'] == 1

    def test_second_page(self, client):
        response = client.get('/users?page=2')
        data = response.get_json()
        assert len(data['items']) == 10
        assert data['page'] == 2

    def test_last_page_has_remaining_items(self, client):
        response = client.get('/users?page=3')
        data = response.get_json()
        assert len(data['items']) == 5

    def test_invalid_page_returns_400(self, client):
        response = client.get('/users?page=-1')
        assert response.status_code == 400

    def test_filter_by_name(self, client):
        response = client.get('/users?name=User 1')
        data = response.get_json()
        assert all("User 1" in item['name'] for item in data['items'])
```

## 9. Performance Considerations

### Testing Response Time

```python
import time

def test_list_users_responds_within_200ms(client):
    # Seed 1000 users
    for i in range(1000):
        client.post('/users', json={
            "name": f"User {i}", "email": f"u{i}@test.com"
        })

    start = time.time()
    response = client.get('/users?page=1')
    elapsed = time.time() - start

    assert response.status_code == 200
    assert elapsed < 0.2, f"Response took {elapsed:.3f}s, expected < 0.2s"
```

### Testing Rate Limiting

```python
def test_rate_limit_returns_429(client):
    """API should return 429 Too Many Requests after exceeding limit."""
    for _ in range(100):
        client.get('/users')

    response = client.get('/users')
    assert response.status_code == 429
    assert "rate limit" in response.get_json()['error'].lower()
```

## 10. Key Takeaways

- API tests validate the **HTTP contract** — status codes, response bodies, headers
- Test the **happy path**, **validation errors**, **authentication**, and **edge cases**
- Use **test clients** (Flask's `test_client`, Express + Supertest) — no need to start a real server
- Test **authentication** (401) and **authorization** (403) separately — they are different concepts
- Use **schema validation** to ensure response structure does not drift over time
- **Contract testing** protects against breaking changes between API producer and consumer
- Test **pagination**, **filtering**, and **sorting** — these are common sources of bugs
- Include basic **performance assertions** for critical endpoints
