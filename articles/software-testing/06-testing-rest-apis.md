---
layout: article
title: "Testing REST APIs"
description: "HTTP requests, JSON responses, auth tokens, and all the ways your API can fail — tested"
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

## The Contract

APIs are the **contract** between your backend and everything that consumes it — frontends, mobile apps, third-party services. If the API breaks, everything breaks.

API testing sits between unit testing and E2E testing on the testing pyramid. It tests the **HTTP layer** — routes, request parsing, validation, authentication, response formatting — without needing a browser or UI.

Fast enough to run frequently. Comprehensive enough to catch real bugs.

> 句型解析: "APIs are the contract between your backend and everything that consumes it." — "contract" (合约) 在这里指 API 定义了一套双方都必须遵守的规则。

## What to Test

| Category | What to Verify | Example |
|----------|---------------|---------|
| **Status codes** | Correct HTTP status returned | 200 OK, 201 Created, 404 Not Found |
| **Response body** | Correct data structure and values | `{"id": 1, "name": "Alice"}` |
| **Validation** | Invalid input is rejected | Missing required fields → 400 Bad Request |
| **Authentication** | Protected routes require valid tokens | No token → 401 Unauthorized |
| **Authorization** | Users can only access allowed resources | Regular user → 403 Forbidden on admin route |
| **Error handling** | Errors return *meaningful* (有意义的) messages | `{"error": "Email already exists"}` |
| **Edge cases** | Unusual inputs handled gracefully | Empty strings, very long values, special characters |

## Python API Testing with Flask + pytest

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

    if not data.get('name'):
        return jsonify({"error": "Name is required"}), 400

    if not data.get('email'):
        return jsonify({"error": "Email is required"}), 400

    user = {
        "id": next_id,
        "name": data['name'],
        "email": data['email']
    }
    users[next_id] = user
    next_id += 1

    return jsonify(user), 201

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = users.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user), 200

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if user_id not in users:
        return jsonify({"error": "User not found"}), 404
    del users[user_id]
    return '', 204
```

### The Tests

```python
# test_api.py
import pytest
from app import app

@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_create_user_success(client):
    response = client.post('/users', json={
        'name': 'Alice',
        'email': 'alice@example.com'
    })

    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == 'Alice'
    assert data['email'] == 'alice@example.com'
    assert 'id' in data

def test_create_user_missing_name(client):
    response = client.post('/users', json={
        'email': 'alice@example.com'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'Name' in data['error']

def test_create_user_missing_email(client):
    response = client.post('/users', json={
        'name': 'Alice'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'Email' in data['error']

def test_get_user_success(client):
    # Create a user first
    create_response = client.post('/users', json={
        'name': 'Alice',
        'email': 'alice@example.com'
    })
    user_id = create_response.get_json()['id']

    # Get the user
    response = client.get(f'/users/{user_id}')

    assert response.status_code == 200
    data = response.get_json()
    assert data['name'] == 'Alice'

def test_get_user_not_found(client):
    response = client.get('/users/999')

    assert response.status_code == 404
    data = response.get_json()
    assert 'error' in data

def test_delete_user_success(client):
    # Create a user
    create_response = client.post('/users', json={
        'name': 'Alice',
        'email': 'alice@example.com'
    })
    user_id = create_response.get_json()['id']

    # Delete the user
    response = client.delete(f'/users/{user_id}')
    assert response.status_code == 204

    # Verify user is gone
    get_response = client.get(f'/users/{user_id}')
    assert get_response.status_code == 404
```

## JavaScript API Testing with Express + Supertest

### The API

```javascript
// app.js
const express = require('express');
const app = express();

app.use(express.json());

const users = {};
let nextId = 1;

app.post('/users', (req, res) => {
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = { id: nextId++, name, email };
  users[user.id] = user;

  res.status(201).json(user);
});

app.get('/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

module.exports = app;
```

### The Tests

```javascript
// app.test.js
const request = require('supertest');
const app = require('./app');

describe('POST /users', () => {
  test('creates user successfully', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Alice');
    expect(response.body.email).toBe('alice@example.com');
    expect(response.body.id).toBeDefined();
  });

  test('rejects missing name', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'alice@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Name');
  });

  test('rejects missing email', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Alice' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Email');
  });
});

describe('GET /users/:id', () => {
  test('returns user when found', async () => {
    // Create user first
    const createResponse = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' });

    const userId = createResponse.body.id;

    // Get user
    const response = await request(app).get(`/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Alice');
  });

  test('returns 404 when user not found', async () => {
    const response = await request(app).get('/users/999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });
});
```

## Testing Authentication

Most APIs require authentication. Test it.

### JWT Authentication Example

```python
import jwt
import pytest
from datetime import datetime, timedelta

SECRET_KEY = "test-secret"

def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def test_protected_route_requires_token(client):
    response = client.get('/protected')
    assert response.status_code == 401

def test_protected_route_rejects_invalid_token(client):
    response = client.get('/protected', headers={
        'Authorization': 'Bearer invalid-token'
    })
    assert response.status_code == 401

def test_protected_route_accepts_valid_token(client):
    token = create_token(user_id=1)
    response = client.get('/protected', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200

def test_protected_route_rejects_expired_token(client):
    # Create token that expired 1 hour ago
    payload = {
        'user_id': 1,
        'exp': datetime.utcnow() - timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    response = client.get('/protected', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 401
```

## Testing Edge Cases

Don't just test the happy path. Test the weird stuff.

```python
def test_create_user_with_very_long_name(client):
    long_name = "A" * 10000
    response = client.post('/users', json={
        'name': long_name,
        'email': 'alice@example.com'
    })
    # Should either accept it or reject with 400, not crash
    assert response.status_code in [201, 400]

def test_create_user_with_special_characters(client):
    response = client.post('/users', json={
        'name': "Alice <script>alert('xss')</script>",
        'email': 'alice@example.com'
    })
    assert response.status_code == 201
    # Verify special characters are escaped
    data = response.get_json()
    assert '<script>' not in data['name']

def test_create_user_with_unicode(client):
    response = client.post('/users', json={
        'name': '张三',
        'email': 'zhangsan@example.com'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == '张三'

def test_create_user_with_empty_strings(client):
    response = client.post('/users', json={
        'name': '',
        'email': ''
    })
    assert response.status_code == 400
```

## Testing Rate Limiting

If your API has rate limiting, test it.

```python
def test_rate_limiting(client):
    # Make 100 requests
    for i in range(100):
        response = client.get('/api/data')
        if i < 50:
            assert response.status_code == 200
        else:
            # After 50 requests, should be rate limited
            assert response.status_code == 429
```

## Contract Testing with Pact

For APIs consumed by multiple clients, use **contract testing** to ensure compatibility.

```python
from pact import Consumer, Provider

pact = Consumer('Frontend').has_pact_with(Provider('Backend'))

def test_get_user_contract():
    expected = {
        'id': 1,
        'name': 'Alice',
        'email': 'alice@example.com'
    }

    (pact
     .given('user 1 exists')
     .upon_receiving('a request for user 1')
     .with_request('GET', '/users/1')
     .will_respond_with(200, body=expected))

    with pact:
        response = requests.get('http://localhost:1234/users/1')
        assert response.json() == expected
```

## Testing with Real HTTP Calls

Sometimes you need to test against a real running server.

```python
import requests

def test_api_health_check():
    response = requests.get('http://localhost:5000/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'

def test_api_returns_json():
    response = requests.get('http://localhost:5000/users/1')
    assert response.headers['Content-Type'] == 'application/json'
```

## Key Takeaways

- **API tests** verify the HTTP layer without needing a UI
- Test **status codes**, **response bodies**, **validation**, **auth**, and **error handling**
- Use **test clients** (Flask test_client, Supertest) for fast in-process testing
- Test **authentication** explicitly — tokens, expiration, invalid credentials
- Test **edge cases** — long inputs, special characters, unicode, empty strings
- Use **contract testing** for APIs consumed by multiple clients
- API tests are faster than E2E tests but more comprehensive than unit tests

Next up: End-to-End testing — browser automation, Playwright, Cypress, and testing like a real user.
