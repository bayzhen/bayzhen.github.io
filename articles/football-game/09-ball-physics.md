---
layout: article
title: "Ball Physics & Player Movement"
description: "Physics simulation in football games — ball trajectory, spin, bouncing, player locomotion, and collision detection"
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

## 1. Introduction

Physics is the **invisible hand** that makes a football game feel authentic. When a player strikes the ball, the trajectory, spin, bounce, and *aerodynamic* (空气动力学的) behavior must all look and feel convincing — or the illusion breaks.

This article covers the physics models commonly used in football games for ball behavior and player movement.

## 2. Ball Flight Model

### 2.1 Basic Projectile Motion

At its simplest, a kicked ball follows *projectile motion* (抛体运动):

```
position.x += velocity.x * dt
position.y += velocity.y * dt
position.z += velocity.z * dt

velocity.z -= gravity * dt    // gravity pulls the ball down
```

Where `dt` is the time step (delta time), and `gravity ≈ 9.81 m/s²`.

But real footballs don't follow pure *parabolic* (抛物线的) paths — air resistance and spin cause significant deviations.

### 2.2 Air Resistance (Drag)

Air *drag* (阻力) slows the ball proportionally to the square of its speed:

```
F_drag = -0.5 * Cd * rho * A * |v|² * v_hat

Where:
  Cd    = drag coefficient (~0.25 for a football)
  rho   = air density (~1.225 kg/m³)
  A     = cross-sectional area (π * r², r ≈ 0.11m)
  |v|   = speed magnitude
  v_hat = velocity direction (unit vector)
```

> 句型解析: "Air drag slows the ball proportionally to the square of its speed" — "proportionally to the square of" 意为"与...的平方成正比"。球速越快，空气阻力增长得越快。

### 2.3 Magnus Effect (Spin)

The **Magnus effect** (马格努斯效应) is what makes the ball *curve* (弯曲) in the air. When the ball spins, it creates a pressure difference that pushes it sideways:

```
F_magnus = Cm * (omega × v)

Where:
  Cm    = Magnus coefficient
  omega = angular velocity vector (spin axis and speed)
  ×     = cross product
  v     = linear velocity
```

This is the physics behind:

- **Curl** (弧线球): Side-spin makes the ball curve left or right
- **Topspin** (上旋): Ball dips faster, bounces forward
- **Backspin** (下旋): Ball floats longer, bounces backward
- **Knuckleball** (电梯球): Almost no spin — the ball *wobbles* (摇摆) unpredictably due to turbulent airflow

### 2.4 Combined Ball Update

```
function updateBall(ball, dt) {
    // Forces
    gravity_force = Vector3(0, 0, -mass * g)
    drag_force = -0.5 * Cd * rho * A * ball.speed² * ball.velocity.normalized
    magnus_force = Cm * cross(ball.angular_velocity, ball.velocity)
    
    total_force = gravity_force + drag_force + magnus_force
    
    // Integration
    ball.velocity += (total_force / mass) * dt
    ball.position += ball.velocity * dt
    
    // Spin decay
    ball.angular_velocity *= (1.0 - spin_decay_rate * dt)
}
```

## 3. Ball-Ground Interaction

### 3.1 Bounce Model

When the ball hits the ground, it bounces with energy loss:

```
function handleBounce(ball) {
    if ball.position.z <= ground_height and ball.velocity.z < 0:
        // Coefficient of restitution (恢复系数)
        ball.velocity.z *= -COR    // COR ≈ 0.6-0.8 for grass
        
        // Friction on horizontal velocity
        ball.velocity.x *= (1.0 - ground_friction)
        ball.velocity.y *= (1.0 - ground_friction)
        
        // Spin affects bounce direction (topspin/backspin)
        ball.velocity.x += ball.angular_velocity.y * spin_bounce_factor
        ball.velocity.y -= ball.angular_velocity.x * spin_bounce_factor
        
        ball.position.z = ground_height
}
```

The **coefficient of restitution** (COR, 恢复系数) determines how "bouncy" the surface is. Wet grass has a lower COR than dry grass — the ball *skids* (打滑) more.

### 3.2 Rolling

When the ball is on the ground and moving slowly:

```
function handleRolling(ball, dt) {
    if ball.is_on_ground:
        // Rolling friction
        deceleration = rolling_friction * gravity
        speed = ball.velocity.magnitude
        
        if speed > min_speed:
            ball.velocity -= ball.velocity.normalized * deceleration * dt
        else:
            ball.velocity = Vector3.zero
        
        // Update spin based on rolling (no sliding)
        ball.angular_velocity = cross(Vector3.up, ball.velocity) / ball.radius
}
```

Different pitch conditions affect rolling speed:
- **Dry pitch**: Faster rolling
- **Wet pitch**: Slower, ball may *aquaplane* (水面滑行) on standing water
- **Long grass**: More *friction* (摩擦力), slower rolling
- **Artificial turf**: Consistent, fast surface

## 4. Player Movement

### 4.1 Locomotion Model

Player movement in football games uses a *locomotion* (运动) system with several states:

```
Movement States:
  Idle       → zero velocity, breathing animation
  Walking    → 0-2 m/s, casual movement
  Jogging    → 2-5 m/s, default movement
  Running    → 5-8 m/s, purposeful movement
  Sprinting  → 8-10+ m/s, maximum speed, drains stamina
```

### 4.2 Acceleration and Deceleration

Players don't instantly reach top speed — they *accelerate* (加速) based on their attributes:

```
function updatePlayerMovement(player, input_direction, dt) {
    target_speed = getTargetSpeed(player, input_type)
    max_accel = player.acceleration_attribute * accel_scale
    
    // Smooth acceleration
    speed_diff = target_speed - player.current_speed
    accel = clamp(speed_diff / dt, -max_decel, max_accel)
    player.current_speed += accel * dt
    
    // Turning
    current_dir = player.facing_direction
    target_dir = input_direction
    turn_speed = player.agility * turn_scale
    
    // Players turn slower at higher speeds
    effective_turn = turn_speed / (1.0 + player.current_speed * speed_turn_penalty)
    player.facing_direction = rotateToward(current_dir, target_dir, effective_turn * dt)
    
    // Apply movement
    player.position += player.facing_direction * player.current_speed * dt
}
```

> 句型解析: "Players turn slower at higher speeds" — 意为"球员在高速运动时转向更慢"。这模拟了真实世界中惯性的影响——跑得越快越难急转弯。

### 4.3 Stamina System

**Stamina** (体力) depletes during intense actions and recovers during rest:

```
function updateStamina(player, dt) {
    // Drain rates per action type
    drain_rates = {
        sprinting: 3.0,
        pressing:  2.0,
        running:   1.0,
        jogging:   0.2,
        idle:     -1.5   // recovery
    }
    
    drain = drain_rates[player.current_action]
    player.stamina -= drain * dt
    player.stamina = clamp(player.stamina, 0, player.max_stamina)
    
    // Stamina affects performance
    stamina_ratio = player.stamina / player.max_stamina
    if stamina_ratio < 0.3:
        player.effective_speed *= 0.85    // noticeably slower
        player.effective_accuracy *= 0.80  // less accurate
}
```

## 5. Collision Detection

### 5.1 Player-Ball Collision

Detecting when a player can interact with the ball:

```
function checkBallControl(player, ball) {
    distance = length(ball.position - player.position)
    
    // Feet control range
    if distance < feet_range and ball.height < knee_height:
        return ControlType.Feet
    
    // Header range
    if distance < head_range and ball.height > chest_height:
        return ControlType.Header
    
    // Chest control
    if distance < body_range and ball.height between waist and shoulder:
        return ControlType.Chest
    
    return ControlType.None
}
```

### 5.2 Player-Player Collision

*Physical contests* (身体对抗) between players use a simplified collision model:

```
function resolvePlayerCollision(player_a, player_b) {
    overlap = (player_a.radius + player_b.radius) - distance(a, b)
    
    if overlap > 0:
        // Separation direction
        normal = normalize(player_b.position - player_a.position)
        
        // Strength-based resolution
        strength_ratio = player_a.strength / (player_a.strength + player_b.strength)
        
        player_a.position -= normal * overlap * (1 - strength_ratio)
        player_b.position += normal * overlap * strength_ratio
        
        // Check for foul
        if collision_force > foul_threshold:
            evaluateFoul(player_a, player_b, collision_force)
}
```

## 6. Camera Physics

The camera in a football game follows *smoothing* (平滑) algorithms to avoid jerky movement:

```
function updateCamera(camera, ball, dt) {
    // Target position: ahead of the ball's movement direction
    look_ahead = ball.velocity.normalized * look_ahead_distance
    target = ball.position + look_ahead + camera_offset
    
    // Smooth follow with damping
    camera.position = lerp(camera.position, target, smoothing * dt)
    
    // Dynamic zoom based on play context
    if is_set_piece:
        target_zoom = close_zoom
    elif ball_in_penalty_area:
        target_zoom = medium_zoom
    else:
        target_zoom = default_zoom
    
    camera.zoom = lerp(camera.zoom, target_zoom, zoom_speed * dt)
}
```

`lerp` stands for **linear interpolation** (线性插值), a fundamental tool for smooth movement in games.

## 7. Physics Simplifications

Real physics is computationally expensive. Football games make *pragmatic* (务实的) simplifications:

| Real Physics | Game Simplification |
| --- | --- |
| Continuous collision detection | Discrete time steps with *swept* (扫掠) checks for the ball |
| Full rigid body dynamics | Simplified impulse-based ball response |
| Accurate aerodynamics | Tunable drag + Magnus coefficients |
| Grass deformation | Purely visual effect, no gameplay impact |
| Weather effects on physics | Modifier values on friction and drag |

The goal is to achieve results that **look and feel** correct, even if the underlying math is simplified.

## 8. Key Takeaways

- Ball flight combines **gravity**, **drag**, and the **Magnus effect** (spin) — these three forces create realistic trajectories
- The **coefficient of restitution** and surface friction determine bounce behavior
- Player movement uses **acceleration curves** and **turning penalties** at speed for realism
- **Stamina** directly modifies player performance attributes at runtime
- Collision detection handles both **player-ball** interaction and **player-player** physical contests
- Football games *pragmatically simplify* (务实地简化) real physics — correctness is less important than feel
