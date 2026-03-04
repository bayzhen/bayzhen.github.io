---
layout: article
title: "Football Game Architecture Patterns"
description: "ECS, state machines, event systems — the software patterns that keep 22 AI players from turning your codebase into spaghetti"
lang: en
level: intermediate
tags: ["Architecture", "Design Patterns", "Technical"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 8
prev:
  title: "Football Game AI Design"
  url: "07-ai-design.html"
next:
  title: "Ball Physics & Player Movement"
  url: "09-ball-physics.html"
---

## The Problem

A football game is a complex real-time simulation with dozens of interacting systems: physics, AI, animation, input, audio, rendering, networking. Without good architecture, your codebase becomes unmaintainable spaghetti.

This article covers the patterns that keep football games from collapsing under their own complexity.

## Entity-Component-System (ECS)

**ECS** is widely used in modern game engines, and it fits football games perfectly. You have many similar entities (22 players + ball + referee) that share some behaviors but differ in others.

### Core Concepts

- **Entity** (实体): A unique ID — a player, the ball, a goal post
- **Component** (组件): Raw data attached to an entity — `Position`, `Velocity`, `PlayerAttributes`
- **System** (系统): Logic that operates on entities with specific component combinations

### Example

```cpp
// Components (pure data, no logic)
struct Position { float x, y, z; };
struct Velocity { float vx, vy, vz; };
struct PlayerAttributes { int pace, shooting, passing, ...; };
struct BallOwnership { entity_id owner; };
struct TeamMembership { int team_id; };

// Systems (logic, no data)
class MovementSystem {
    void update(float dt) {
        for (auto [entity, pos, vel] : query<Position, Velocity>()) {
            pos.x += vel.vx * dt;
            pos.y += vel.vy * dt;
            pos.z += vel.vz * dt;
        }
    }
};

class AIDecisionSystem {
    void update(float dt) {
        for (auto [entity, pos, attrs, team] : query<Position, PlayerAttributes, TeamMembership>()) {
            // AI logic here
            decide_action(entity, pos, attrs, team);
        }
    }
};
```

### Why ECS Works for Football

- **Uniform entities**: All players share the same base components but differ in attribute values
- **Cache-friendly**: Component data is stored contiguously (连续地) in memory, improving performance
- **Easy to add features**: Adding a new behavior = adding a new component + system, without modifying existing code
- **Parallelizable**: Systems that don't share write access can run concurrently (并发地)

### Real-World Example

Unity's DOTS (Data-Oriented Technology Stack) uses ECS. If you're building in Unity, consider using DOTS for player and ball entities.

## State Machine Patterns

Football games use state machines at multiple levels.

### Match State Machine

Controls the overall flow of the match:

```cpp
enum MatchState {
    PreMatch,           // team sheets, coin toss
    KickOff,            // waiting for kick-off
    InPlay,             // normal play
    FreeKick,           // free kick setup
    CornerKick,         // corner kick
    ThrowIn,            // throw-in
    GoalKick,           // goal kick
    Pen     // penalty
    GoalCelebration,    // goal scored animation
    HalfTime,           // half-time break
    FullTime,           // match ended
    ExtraTime,          // additional time
    PenaltyShootout     // penalty shootout
};

class MatchStateMachine {
    MatchState current_state;

    void transition_to(MatchState new_state) {
        on_exit(current_state);
        current_state = new_state;
        on_enter(current_state);
    }

    void on_enter(MatchState state) {
        switch (state) {
            case KickOff:
                position_players_for_kickoff();
                set_camera_angle(KICKOFF_CAMERA);
                break;
            case FreeKick:
                pause_game();
                show_free_kick_ui();
                break;
            // ...
        }
    }
};
```

### Player State Machine

Each player has their own FSM for physical actions:

```cpp
enum PlayerState {
    Idle,
    Running,
    Sprinting,
    Dribb    Passing,
    Shooting,
    Tackling,
    Heading,
    Falling,
    Celebrating
};

class PlayerFSM {
    PlayerState current_state;

    void update(float dt) {
        switch (current_state) {
            case Idle:
                if (input.move_pressed()) transition_to(Running);
                if (ball_nearby()) transition_to(Dribbling);
                break;
            case Running:
                if (input.sprint_pressed()) transition_to(Sprinting);
                if (input.shoot_pressed()) transition_to(Shooting);
                break;
            // ...
        }
    }
};
```

### Why State Machines Work

- **Clear transitions**: Easy to see what states can lead to what
- **Debuggable**: You can visualize the current state in real-time
- **Animation integration**: Each state maps to an animation or animation blend

## Event System

An event system decouples systems that need to react to game events.

### Example Events

```cpp
struct GoalScoredEvent {
    entity_id scorer;
    entity_id assister;
    int team_id;
    float time;
};

struct FoulCommittedEvent {
    entity_id fouler;
    entity_id victim;
    FoulSeverity severity;
    Vec3 location;
};

struct SubstitutionEvent {
    entity_id player_off;
    entity_id player_on;
    int team_id;
};
```

### Event Bus

```cpp
class EventBus {
    std::unordered_map<std::type_index, std::vector<std::function<void(void*)>>> listeners;

    template<typename T>
    void subscribe(std::function<void(const T&)> callback) {
        listeners[typeid(T)].push_back([callback](void* event) {
            callback(*static_cast<T*>(event));
        });
    }

    template<typename T>
    void publish(const T& event) {
        for (auto& callback : listeners[typeid(T)]) {
            callback((void*)&event);
        }
    }
};

// Usage
event_bus.subscribe<GoalScoredEvent>([](const GoalScoredEvent& e) {
    ui_system.show_goal_notification(e.scorer);
    audio_system.play_crowd_cheer();
    stats_system.record_goal(e.scorer, e.assister);
    camera_system.start_celebration_camera(e.scorer);
});

event_bus.publish(GoalScoredEvent{scorer_id, assister_id, team_id, match_time});
```

### Why Event Systems Work

- **Decoupling**: Systems don't need to know about each other
- **Extensibility**: Adding a new reaction to an event doesn't require modifying existing code
- **Debugging**: You can log all events to see the sequence of what happened

## Data-Driven Design

Football games have massive amounts of data: player attributes, team rosters, formations, tactics. Hard-coding this data is a nightmare.

### Player Data (JSON)

```json
{
  "player_id": 12345,
  "name": "Lionel Messi",
  "position": "RW",
  "attributes": {
    "pace": 85,
    "shooting": 92,
    "passing": 91,
    "dribbling": 95,
    "defending": 35,
    "physical": 65
  },
  "traits": ["finesse_shot", "speed_dribbler", "playmaker"],
  "work_rates": { "attacking": "high", "defensive": "low" },
  "potential": 93,
  "age": 36
}
```

### Formation Data (JSON)

```json
{
  "formation_id": -3-3",
  "positions": [
    { "role": "GK", "x": 5, "y": 50 },
    { "role": "LB", "x": 20, "y": 15 },
    { "role": "CB", "x": 20, "y": 35 },
    { "role": "CB", "x": 20, "y": 65 },
    { "role": "RB", "x": 20, "y": 85 },
    { "role": "CM", "x": 40, "y": 30 },
    { "role": "CM", "x": 40, "y": 50 },
    { "role": "CM", "x": 40, "y": 70 },
    { "role": "LW", "x": 70, "y": 20 },
    { "role": "ST", "x": 75, "y": 50 },
    { "role": "RW", "x": 70, "y": 80 }
  ]
}
```

### Why Data-Driven Design Works

- **Iteration speed**: Designers can tweak values without recompiling
- **Modding support**: Players can create custom content
- **Localization**: Text is separated from code
- **Version control**: Data changes are easy to review in diffs

## Networking Architecture

For online multiplayer, you need a robust networking architecture.

### Client-Server Model

```
Client A                Server                Client B
   │                      │                      │
   │──── Input ──────────▶│                      │
   │                      │◀──── Input ──────────│
   │                      │                      │
   │                   Simulate                  │
   │                   (Authoritative)           │
   │                      │                      │
   │◀──── State ──────────│                      │
   │                      │──── State ──────────▶│
   │                      │                      │
   │                   Render                 Render
```

**Server is authoritative**: The server simulates the match. Clients send inputs, receive state updates, and render.

### Lag Compensation

```cpp
// Client-side prediction
void client_update(float dt) {
    // Apply local input immediately (feels responsive)
    apply_input(local_player, local_input);

    // When server state arrives, reconcile
    if (server_state_received) {
        if (server_state.position != predicted_position) {
            // Snap to server position (or smoothly interpolate)
            local_player.position = server_state.position;
        }
    }
}

// Server-side lag compensation
void server_process_input(PlayerInput input, float client_timestamp) {
    // Rewind the game state to when the client sent the input
    GameState past_state = history.get_state_at(client_timestamp);

    // Apply the input in that past state
    apply_input(past_state, input);

    // Check if the action succeeded (e.g., did the tackle connect?)
    bool success = check_action_success(past_state, input);

    // Send result to client
    send_result(client, success);
}
```

### Why This Architecture Works

- **Responsive**: Client-side prediction makes the game feel instant
- **Fair**: Server authority prevents cheating
- **Lag compensation**: Players with high ping can still compete

## Key Takeaways

- **ECS** is ideal for football games — uniform entities, cache-friendly, parallelizable
- **State machines** comatch flow and player actions ear, debuggable, animation-friendly
- **Event systems** decouple systems — extensible, maintainable
- **Data-driven design** separates content from code — faster iteration, modding support
- **Client-server architecture** with lag compensation enables fair online play

## Next Up

Architecture keeps your code clean, but [Ball Physics](09-ball-physics.html) makes your game feel real. Let's talk about trajectory, spin, and why FIFA's ball physics are harder than rocket science.
