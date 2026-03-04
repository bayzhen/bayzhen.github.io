---
layout: article
title: "Ball Physics & Player Movement"
description: "The invisible magic that makes football games feel real — trajectory, spin, collisions, and why FIFA's ball physics are harder than rocket science"
lang: en
level: advanced
tags: ["Physics", "Movement", "Technical"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 9
prev:
  title: "Football Game Architecture Patterns"
  url: "08-architecture-patterns.html"
next:
  title: "Football Game UI/UX Conventions"
  url: "10-ui-ux.html"
---

## Why Physics Matters

You can have perfect AI, beautiful graphics, and deep career modes. But if the ball doesn't *feel* right when it leaves a player's foot, your game is broken.

Physics is the invisible hand that makes football games convincing. When a player strikes the ball, the trajectory, spin, bounce, and curve must all look and feel authentic — or the illusion shatters.

This article covers the physics models used in real football games. Spoiler: it's not actually realistic physics. It's *convincing* physics.

## Ball Flight — The Three Forces

A kicked football is affected by three forces:

1. **Gravity** — pulls the ball down
2. **Drag** — air resistance slows the ball
3. **Magnus Effect** — spin makes the ball curve

### Basic Projectile Motion

Start with simple physics:

```cpp
// Every frame
position.x += velocity.x * dt;
position.y += velocity.y * dt;
position.z += velocity.z * dt;

velocity.z -= GRAVITY * dt;  // gravity = 9.81 m/s²
```

This gives you a parabolic (抛物线) arc. But real footballs don't follow perfect parabolas.

### Air Drag

Air resistance slows the ball proportionally to the **square** of its speed:

```cpp
F_drag = -0.5 * Cd * rho * A * |v|² * v_normalized

Where:
  Cd    = drag coefficient (~0.25 for a football)
  rho   = air density (~1.225 kg/m³)
  A     = cross-sectional area (π * r², r ≈ 0.11m)
  |v|   = speed magnitude
  v_normalized = velocity direction (unit vector)
```

**What this means**: A ball kicked at 100 km/h experiences 4x more drag than one kicked at 50 km/h. This is why long shots slow down dramatically in flight.

### Magnus Effect — The Curve Ball

The **Magnus effect** (马格努斯效应) is what makes the ball curve. When the ball spins, it creates a pressure difference that pushes it sideways.

```cpp
F_magnus = Cm * cross(angular_velocity, velocity)

Where:
  Cm    = Magnus coefficient (tunable)
  cross = cross product (gives perpendicular force)
  angular_velocity = spin axis and speed (rad/s)
  velocity = linear velocity
```

This creates:

- **Curl** (弧线球): Side-spin makes the ball curve left/right
- **Topspin** (上旋): Ball dips faster, bounces forward
- **Backspin** (下旋): Ball floats longer, bounces backward
- **Knuckleball** (电梯球): Almost no spin — the ball wobbles unpredictably

### Combined Ball Update

```cpp
void updateBall(Ball& ball, float dt) {
    // Calculate forces
    Vec3 gravity_force = Vec3(0, 0, -ball.mass * GRAVITY);

    float speed_sq = ball.velocity.lengthSquared();
    Vec3 drag_force = -0.5f * Cd * rho * A * speed_sq * ball.velocity.normalized();

    Vec3 magnus_force = Cm * cross(ball.angular_velocity, ball.velocity);

    Vec3 total_force = gravity_force + drag_force + magnus_force;

    // Integration (Euler method — simple but works)
    ball.velocity += (total_force / ball.mass) * dt;
    ball.position += ball.velocity * dt;

    // Spin decays over time (air friction)
    ball.angular_velocity *= (1.0f - spin_decay_rate * dt);
}
```

## Ball-Ground Interaction

### Bounce Model

When the ball hits the ground, it bounces with energy loss:

```cpp
void handleBounce(Ball& ball) {
    if (ball.position.z <= GROUND_HEIGHT && ball.velocity.z < 0) {
        // Coefficient of restitution (恢复系数)
        // COR = 0.6-0.8 for grass, 0.9 for artificial turf
        ball.velocity.z *= -COR;

        // Horizontal friction
        ball.velocity.x *= (1.0f - ground_friction);
        ball.velocity.y *= (1.0f - ground_friction);
       // Spin affects bounce direction
        // Topspin makes the ball bounce forward
        // Backspin makes it bounce backward
        ball.velocity.x += ball.angular_velocity.y * spin_bounce_factor;
        ball.velocity.y -= ball.angular_velocity.x * spin_bounce_factor;

        ball.position.z = GROUND_HEIGHT;
    }
}
```

**Coefficient of Restitution** (COR, 恢复系数) determines how "bouncy" the surface is:

- **Dry grass**: COR ≈ 0.7 — moderate bounce
- **Wet grass**: COR ≈ 0.5 — ball skids (打滑)
- **Artificial turf**: COR ≈ 0.85 — high bounce

### Rolling

When the ball is on the ground and moving slowly:

```cpp
void handleRolling(Ball& ball, float dt) {
    if (ball.isOnGround()) {
        // Rolling friction
        float deceleration = rolling_friction * GRAVITY;
        float speed = ball.velocity.length();

        if (speed > min_speed) {
            ball.velocity -= ball.velocity.normalized() * deceleration * dt;
        } else {
            ball.velocity = Vec3::zero();
        }

        // Update spin based on rolling (no sliding)
        ball.angular_velocity = cross(Vec3::up(), ball.velocity) / ball.radius;
    }
}
```

Different pitch conditions:

- **Dry pitch**: Fast rolling, low friction
- **Wet pitch**: Slow rolling, ball may aquaplane (水面滑行) on standing water
- **Long grass**: High friction, slower rolling
- **Artificial turf**: Consistent, fast surface

## Player Movement

### Locomotion States

Player movement uses a state machine:

```
Movement States:
  Idle       → 0 m/s, breathing animation
  Walking    → 0-2 m/s, casual movement
  Jogging    → 2-5 m/s, default movement
  Running    → 5-8 m/s, purposeful movement
  Sprinting  → 8-10+ m/s, maximum speed, drains stamina
```

### Acceleration and Turning

Players don't instantly reach top speed — they accelerate based on attributes:

```cpp
void updatePlayerMovement(Player& player, Vec2 input_direction, float dt) {
    // Target speed based on input
    float target_speed = getTargetSpeed(player, input_type);
    float max_accel = player.acceleration * accel_scale;

    // Smooth acceleration
    float speed_diff = target_speed - player.current_speed;
    float accel = clamp(speed_diff / dt, -max_decel, max_accel);
    player.current_speed += accel * dt;

    // Turning — slower at high speeds (inertia)
    Vec2 current_dir = player.facing_direction;
    Vec2 target_dir = input_direction;
    float turn_speed = player.agility * turn_scale;

    // Speed penalty for turning
    float effective_turn = turn_speed / (1.0f + player.current_speed * speed_turn_penalty);
    player.facing_direction = rotateToward(current_dir, target_dir, effective_turn * dt);

    // Apply movement
    player.position += player.facing_direction * player.current_speed * dt;
}
```

**Key insight**: Players turn slower at high speeds. This simulates inertia — you can't make sharp turns while sprinting at full speed.

### Stamina System

Stamina (体力) depletes during intense actions:

```cpp
void updateStamina(Player& , float dt) {
    // Drain rates per action
    float drain = 0.0f;
    switch (player.current_action) {
        case SPRINTING: drain = 3.0f; break;
        case PRESSING:  drain = 2.0f; break;
        case RUNNING:   drain = 1.0f; break;
        case JOGGING:   drain = 0.2f; break;
        case IDLE:      drain = -1.5f; break;  // recovery
    }

    player.stamina -= drain * dt;
    player.stamina = clamp(player.stamina, 0.0f, player.max_stamina);

    // Stamina affects performance
    float stamina_ratio = player.stamina / player.max_stamina;
    if (stamina_ratio < 0.3f) {
        player.effective_speed *= 0.85f;     // noticeably slower
        player.effective_accuracy *= 0.80f;  // less accurate
    }
}
```

## Collision Detection

### Player-Ball Collision

Detecting when a player can interact with the ball:

```cpp
enum ControlType { None, Feet, Header, Chest };

ControlType checkBallControl(Player& player, Ball& ball) {
    float distance = length(ball.position - player.position);

    // Feet control range
    if (distance < feet_range && ball.height < knee_height) {
        return ControlType::Feet;
    }

    // Header range
    if (distance < head_rangeheight > chest_height) {
        return ControlType::Header;
    }

    // Chest control
    if (distance < body_range && ball.height >= waist && ball.height <= shoulder) {
        return ControlType::Chest;
    }

    return ControlType::None;
}
```

### Player-Player Collision

Physical contests (身体对抗) between players:

```cpp
void resolvePlayerCollision(Player& a, Player& b) {
    float overlap = (a.radius + b.radius) - distance(a.position, b.position);

    if (overlap > 0) {
        // Separation direction
        Vec2 normal = normalize(b.position - a.position);

        // Strength-based resolution
        float strength_ratio = a.strength / (a.strength + b.strength);

        // Push players apart
        a.position -= normal * overlap * (1.0f - strength_ratio);
        b.position += normal * overlap * strength_ratio;

        // Check for foul
        float collision_force = calculateCollisionForce(a, b);
        if (collision_force > foul_threshold) {
            evaluateFoul(a, b, collision_force);
        }
    }
}
```

## Camera Physics

The camera follows the ball with smoothing to avoid jerky movement:

```cpp
void updateCamera(Camera& camera, Ball& ball, float dt) {
    // Target position: ahead of the ball's movement
    Vec3 look_ahead = ball.velocity.normalized() * look_ahead_distance;
    Vec3 target = ball.position + look_ahead + camera_offset;

    // Smooth follow with damping (lerp = linear interpolation)
    camera.position = lerp(camera.position, target, smoothing * dt);

    // Dynamic zoom based on context
    float target_zoom;
    if (is_set_piece) {
        target_zoom = close_zoom;
    } else if (ball_in_penalty_area) {
        target_zoom = medium_zoom;
    } else {
        target_zoom = default_zoom;
    }

    camera.zoom = lerp(camera.zoom, target_zoom, zoom_speed * dt);
}
```

**lerp** (linear interpolation, 线性插值) is fundamental for smooth movement in games:

```cpp
float lerp(float a, float b, float t) {
    return a + (a - b) * t;
}
```

## The Pragmatic Approach

Real physics is computationally expensive. Football games make smart simplifications:

| Real Physics | Game Simplification |
|--------------|---------------------|
| Continuous collision detection | Discrete time steps with swept checks |
| Full rigid body dynamics | Simplified impulse-based response |
| Accurate aerodynamics | Tunable drag + Magnus coefficients |
| Grass deformation | Purely visual, no gameplay impact |
| Weather effects | Modifier values on friction and drag |

**The goal**: Results that **look and feel** correct, even if the underlying math is simplified.

## PES vs FIFA — Different Physics Philosophies

**PES (eFootball)**: Prioritizes realistic ball weight and momentum. The ball feels "heavy" — passes and shots have more inertia. Players praise it as more "simulation-like."

**FIFA (EA Sports FC)**: Prioritizes responsiveness. The ball reacts instantly to input. Feels more "arcade-like" but more accessible to casual players.

Neither is "correct" — it's a design choice about what feels fun.

## Key Takeaways

- Ball flight combines **gravity**, **drag**, and the **Magnus effect** (spin)
- **Coefficient of restitution** (COR) determines bounce behavior
- Player movement uses **acceleration curves** and **turning penalties** at speed
- **Stamina** directly modifies player performance at runtime
- Collision detection handles **player-ball** interaction and **player-player** physical contests
- Football games **pragmatically simplify** real physics — correctness matters less than feel
- Different games make different trade-offs between realism and responsiveness

## Next Up

Physics makes the game feel real, but [UI/UX](10-ui-ux.html) makes it playable. Let's talk about how football games communicate information to players.
