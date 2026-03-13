---
layout: article
title: "Automated Testing Pipelines for Football Games"
description: "How to design an automated regression testing pipeline for a football game — test case modeling, data recording, replay infrastructure, and the case for database-backed results"
lang: en
level: advanced
tags: ["Testing", "Automation", "Pipeline", "Technical"]
series: football-game
series_title: "足球游戏开发入门"
title_suffix: "Football Game Dev"
order: 13
prev:
  title: "Networking & Gameplay Ability Systems"
  url: "12-networking-gameplay-ability.html"
---

## 1. Why Football Games Need Automated Testing

Football games are *notoriously difficult* (出了名地难) to test manually. A single match involves:

- **22 AI-controlled players** making thousands of decisions per minute
- **Ball physics** with spin, bounce, and air resistance
- **Animation blending** across hundreds of motion-captured clips
- **Input handling** for dribbling, passing, shooting — each with timing-sensitive mechanics

> 句型解析: "A single match involves..." 列举了一场比赛中需要同时运作的多个系统，说明手动测试几乎不可能覆盖所有组合。

When a developer tweaks (微调) the dribble turning radius or adjusts shot power curves, how do you verify that the change didn't *regress* (回退、退化) 50 other behaviors? You can't play-test every scenario. You need an **automated testing pipeline** (自动跑测管线).

## 2. Pipeline Architecture

A well-designed automated testing pipeline typically has **three layers**:

```
┌──────────────────────────────────────────────────────┐
│  Layer 1: Orchestration (编排层)                     │
│  Version control sync → Launch game → Collect data   │
│  → Generate reports → Notify team                    │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Layer 2: In-Engine Test Framework (引擎内测试框架)  │
│  Load test cases → Set up world → Execute behaviors  │
│  → Record per-frame data → Output results            │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Layer 3: Results & Analysis (结果分析层)            │
│  Parse data → Compare against baselines              │
│  → Detect regressions → Visualize trends             │
└──────────────────────────────────────────────────────┘
```

### 2.1 Layer 1: Orchestration

The *orchestration layer* (编排层) runs **outside** the game engine, typically as a standalone script. Its responsibilities:

1. **Sync latest code** — pull the latest build from version control (SVN, Git, Perforce)
2. **Launch the game process** — start the engine executable with test parameters passed via command-line arguments
3. **Wait for completion** — monitor the game process until it exits
4. **Trigger analysis** — invoke the results processing pipeline
5. **Notify the team** — send results to Slack, email, or internal messaging

```python
# Pseudocode for orchestration
def run_batch_test(categories, output_dir):
    timestamp = get_current_timestamp()

    sync_version_control()                          # Step 1
    launch_game(timestamp, categories)              # Step 2-3 (blocking)
    generate_results(timestamp, output_dir)         # Step 4
    notify_team(timestamp)                          # Step 5
```

A key design decision is how to pass parameters from the orchestration layer into the engine. Common approaches:

| Method | Pros | Cons |
|--------|------|------|
| Command-line args | Simple, no file I/O | Limited length, string parsing needed |
| Config file | Structured, easy to extend | File path dependencies |
| Named pipe / socket | Two-way communication | More complex setup |

> 句型解析: 编排层和引擎内框架通常运行在不同的 Python 版本（甚至不同语言）上，因此参数传递方式的选择很重要。

### 2.2 Layer 2: In-Engine Test Framework

This is the core of the pipeline. It runs **inside** the game engine's scripting environment and must interact with the engine's *game loop* (游戏主循环).

#### The Singleton Controller

The test framework is typically implemented as a **singleton** (单例) that hooks into the engine's update loop:

```python
class AutoTestController:
    """Singleton that drives test execution inside the engine."""

    def __init__(self):
        self.test_cases = []
        self.current_case = None
        self.data_recorder = DataRecorder()

    def start_batch(self, categories):
        self.test_cases = load_cases(categories)
        # Sort by configuration to minimize world reloads
        self.test_cases.sort(key=lambda tc: tc.world_config)

    def tick(self):
        """Called every frame by the engine."""
        if self.current_case is None or self.current_case.is_complete:
            self.advance_to_next_case()
            return

        self.current_case.tick()
        self.data_recorder.tick(self.current_case)
```

The critical insight is that **the test framework is a guest in the engine's world**. It doesn't control the frame rate or the physics simulation — it rides on top of the engine's existing `tick()` / `update()` callback.

#### World Setup and Teardown

Each test case requires a specific world state: player positions, ball location, AI configuration. The framework must:

1. **Reset the simulation** — clear all game state (*blackbox reset* / 黑盒重置)
2. **Spawn entities** — place players at configured positions with specified attributes
3. **Wait for readiness** — ensure all character models are loaded, animations are bound
4. **Execute the test** — drive inputs and behaviors
5. **Record and save** — capture per-frame data, then output results

The "wait for readiness" step is often overlooked but *crucial* (至关重要的). In a football game, character models are loaded *asynchronously* (异步地). If the test starts executing before the models are ready, the animation data will be garbage.

```python
def reset_world(self):
    engine.reset_blackbox(self.current_case.player_configs)
    self._waiting_for_models = True

def tick(self):
    if self._waiting_for_models:
        if all_models_ready(self.current_case.player_configs):
            self._waiting_for_models = False
            self.resume_simulation()
        return  # Skip this frame
    # ... normal test execution
```

### 2.3 Layer 3: Results and Analysis

This layer processes the raw test data and answers the question: **"Did anything break?"**

We'll discuss two approaches — file-based reports and database-backed analysis — in detail in Section 7.

## 3. Test Case Modeling

The most important design decision in the entire pipeline is: **how do you represent a test case?**

### 3.1 The Behavior Sequence Model

A football game test case is fundamentally a **sequence of timed behaviors**. Consider testing a "dribble then shoot" scenario:

1. Start running forward (hold joystick up + sprint)
2. After 2 seconds, release sprint
3. After the player's speed drops below 5 m/s, press shoot
4. After 0.3 seconds, release shoot
5. Wait 3 seconds for the ball to reach the goal
6. End test

This maps naturally to a **Behavior → Condition → Action** model:

```
TestCase
├── Behavior "Sprint Forward"
│   ├── Condition: None (immediate)
│   └── Actions: [Move(dir=forward, sprint=true)]
│
├── Behavior "Slow Down"
│   ├── Condition: WaitingTime >= 2.0
│   └── Actions: [Move(dir=forward, sprint=false)]
│
├── Behavior "Shoot"
│   ├── Condition: Speed < 5.0
│   └── Actions: [ShootStart(type=normal)]
│
├── Behavior "Release Shoot"
│   ├── Condition: WaitingTime >= 0.3
│   └── Actions: [Shoot()]
│
└── Behavior "End"
    ├── Condition: WaitingTime >= 3.0
    └── Actions: [Terminal()]
```

### 3.2 Conditions

Conditions determine **when** to transition from one behavior to the next. The most common condition types:

| Condition | Description | Use Case |
|-----------|-------------|----------|
| `WaitingTime >= T` | Current behavior has been active for T seconds | Timed sequences |
| `Speed < V` | Player's current speed is below V | Wait for deceleration |
| `BallDistance < D` | Ball is within D meters of a point | Wait for ball arrival |

Conditions can be composed using **AND / OR logic**:

```json
{
    "type": "group",
    "logic_operator": "AND",
    "conditions": [
        { "type": "condition", "field": "SPEED", "operator": ">=", "threshold": 8.0 },
        { "type": "condition", "field": "WAITING_TIME", "operator": ">=", "threshold": 1.0 }
    ]
}
```

> 句型解析: 条件组合支持嵌套，ConditionGroup 内部可以包含其他 ConditionGroup，实现任意复杂的布尔逻辑。

### 3.3 Actions

Actions are the *atomic operations* (原子操作) that the framework executes. In a football game, actions fall into two categories:

**Input Actions** — simulate player controller input:

| Action | Parameters | Description |
|--------|-----------|-------------|
| Move | direction, sprint | Set joystick direction and sprint state |
| SuddenStop | — | Double-tap joystick to trigger emergency stop |
| ShootStart | shoot_type | Press the shoot button (normal / finesse / chip) |
| Shoot | — | Release the shoot button (power based on press duration) |
| Pass | on_ground, power, pass_type | Execute a pass (normal / through / cross) |
| Fancy | press_time, direction | Trigger a skill move |
| MoveToPos | target_pos, speed_type | AI-controlled movement to a position |

**Utility Actions** — control recording and analysis:

| Action | Parameters | Description |
|--------|-----------|-------------|
| StartCapture | camera_mode, region, target | Begin video recording |
| StopCapture | — | End video recording |
| PlotBegin | target, variable, graph_type | Start tracking a variable for plotting |
| PlotEnd | target, variable, graph_type | Stop tracking |
| Terminal | — | Mark the test case as complete |

The **Terminal** action is special — when a behavior containing a Terminal action is reached, the test case ends and results are saved.

### 3.4 The Action Registry Pattern

A clean way to implement extensible actions is the **registry pattern** (注册表模式):

```python
class Action:
    _registry = {}

    @classmethod
    def register(cls, action_type):
        def decorator(subclass):
            cls._registry[action_type] = subclass
            return subclass
        return decorator

    @classmethod
    def create(cls, action_type, params):
        return cls._registry[action_type](action_type, params)

# Each concrete action registers itself
@Action.register(ActionType.MOVE)
class MoveAction(Action):
    def start(self, context):
        battle_player = self.get_battle_player()
        battle_player.set_joy_stick_direction(self.dir_x, self.dir_z)

@Action.register(ActionType.SHOOT)
class ShootAction(Action):
    def start(self, context):
        battle_player = self.get_battle_player()
        battle_player.set_shoot(self.press_time)
```

This pattern makes it easy to add new action types without modifying existing code — just create a new file with the `@Action.register` decorator.

> 句型解析: 注册表模式的优势在于 *open-closed principle*（开闭原则）—— 对扩展开放，对修改关闭。新增 Action 类型不需要改动框架代码。

## 4. Player Configuration

Each test case specifies the players involved:

```json
{
    "player_configs": [
        {
            "cid": 231747,
            "is_home_team": true,
            "role_index": 1,
            "pos": [10.0, 0, 0],
            "yaw": 90
        },
        {
            "cid": 192119,
            "is_home_team": false,
            "role_index": 0,
            "pos": [0, 0, 0],
            "yaw": 270
        }
    ]
}
```

Key fields:

| Field | Description |
|-------|-------------|
| `cid` | Character ID — determines the player's *attributes* (能力值): speed, shooting, passing |
| `is_home_team` | Which team this player belongs to |
| `role_index` | Position on the team (0 = goalkeeper, 1–10 = outfield) |
| `pos` | Starting position in world coordinates |
| `yaw` | Starting facing direction |

The framework also supports **AI mode configuration** to control how non-test players behave:

| Mode | Behavior |
|------|----------|
| NO_AI | Only basic ball-seeking rules active |
| ONLY_GK | Goalkeepers active, outfield AI disabled |
| ALL_AI | Full AI for all non-controlled players |

Switching AI modes typically requires a **full world reload** because AI task trees are *tightly coupled* (紧耦合的) with the scene initialization. To minimize reload overhead, test cases are sorted by AI mode before execution.

## 5. Per-Frame Data Recording

The data recorder captures a complete snapshot of the simulation every frame. A typical recording structure:

```
TestCaseData
├── metadata (name, category, fps)
├── global_frames[]           ← one per frame
│   ├── input_direction       ← joystick state
│   └── controlled_player_id  ← who the camera follows
├── entities{}                ← keyed by entity ID
│   └── entity_frames[]       ← one per frame, per entity
│       ├── position (x, y, z)
│       ├── yaw (facing angle)
│       └── animation_states[]
│           ├── clip_name
│           ├── play_time
│           ├── blend_weight
│           └── is_mirror
└── events[]
    ├── type (behavior_activate, video_start, plot_begin, ...)
    ├── name
    ├── frame_index
    └── data {}
```

### 5.1 What to Record

The **animation state** data is particularly valuable for regression testing. If a code change causes the wrong animation to play during a dribble turn, the recorded `clip_name` will differ from the baseline — an easy automated check.

**Events** mark *discrete state transitions* (离散状态转换): when a behavior activates, when video capture starts, when a plot region begins. These provide *anchors* (锚点) in the timeline for analysis.

### 5.2 Recording Performance Considerations

Recording every entity every frame generates a lot of data. For a 5-second test case at 30 fps with 23 entities (22 players + ball):

```
150 frames × 23 entities × (position + yaw + animation data)
≈ several hundred KB per test case as JSON
```

For a full suite of hundreds of test cases, this quickly reaches **hundreds of megabytes**. Strategies to manage this:

| Strategy | Description | Trade-off |
|----------|-------------|-----------|
| Record only relevant entities | Skip entities not involved in the test | Loses background context |
| Downsample to key frames | Record every Nth frame, plus event frames | Loses smooth curves |
| Binary format (msgpack, protobuf) | Smaller files, faster I/O | Harder to debug manually |
| Summarize on save | Compute min/max/avg per entity, save summary | Loses raw data |

## 6. Test Categories

A football game naturally organizes test cases into *functional categories* (功能分类):

| Category | What It Tests |
|----------|---------------|
| Dribble | Ball control while running — turning radius, speed curves, touch angles |
| Move | Off-ball movement — sprinting, jogging, direction changes |
| Shoot | Shot mechanics — power curves, accuracy, animation timing |
| Pass | Ground passes, through balls, crosses |
| BallPhysics | Ball trajectory, spin, bounce behavior |
| Head | Heading mechanics |
| Trap | First touch / ball reception |
| Fancy | Skill moves and tricks |
| GK | Goalkeeper diving, positioning, reflexes |
| Attack | Complex multi-player offensive scenarios |

Categories serve double duty: they organize test case files on disk and they filter which tests to run. Running `--categories=Dribble/Shoot` executes only dribble and shooting tests, which is useful during development when you only want to validate the systems you changed.

## 7. Results Analysis: Files vs. Database

This is where pipeline design decisions have the biggest long-term impact.

### 7.1 The File-Based Approach

The simplest approach: each test run produces JSON files, and a report generator reads them to create an HTML report.

```
DataRecord-2026-03-12-14-30-00/
├── Dribble/
│   ├── DribbleStraight-2026-03-12-14-30-15.json
│   └── DribbleTurn-2026-03-12-14-31-00.json
├── Shoot/
│   └── NormalShot-2026-03-12-14-32-00.json
└── traceback.json  (errors, if any)
```

**Advantages:**
- Simple to implement — `json.dump()` and you're done
- Human-readable — developers can open files and inspect data
- No infrastructure — no database server to maintain

**Disadvantages:**
- **No cross-run comparison** — to compare today's results with yesterday's, you need to find the right directory, load both files, and diff them manually
- **No trend analysis** — "how has dribble turn radius changed over the last 30 builds?" requires loading and parsing 30 directories of JSON files
- **No regression detection** — there's no baseline to compare against automatically
- **Scales poorly** — hundreds of test cases × daily runs = thousands of JSON files accumulating on disk

### 7.2 The Database Approach

A more *scalable* (可扩展的) approach stores results in a database:

```sql
-- Test runs
CREATE TABLE test_runs (
    id          INTEGER PRIMARY KEY,
    timestamp   DATETIME,
    commit_hash VARCHAR(40),
    categories  TEXT,
    duration_s  REAL
);

-- Per-case results (summary, not raw frames)
CREATE TABLE test_results (
    id          INTEGER PRIMARY KEY,
    run_id      INTEGER REFERENCES test_runs(id),
    case_name   VARCHAR(100),
    category    VARCHAR(50),
    status      VARCHAR(20),  -- 'pass', 'fail', 'error'
    metrics     JSON          -- {avg_speed: 8.2, max_speed: 12.1, ...}
);

-- Baselines for regression detection
CREATE TABLE baselines (
    case_name   VARCHAR(100) PRIMARY KEY,
    metrics     JSON,
    updated_at  DATETIME
);
```

**Advantages:**
- **Instant regression detection:**

```sql
SELECT r.case_name,
       r.metrics->>'avg_speed' AS current,
       b.metrics->>'avg_speed' AS baseline,
       ABS(r.metrics->>'avg_speed' - b.metrics->>'avg_speed') AS delta
FROM test_results r
JOIN baselines b ON r.case_name = b.case_name
WHERE r.run_id = (SELECT MAX(id) FROM test_runs)
  AND ABS(r.metrics->>'avg_speed' - b.metrics->>'avg_speed') > 0.5;
```

- **Trend analysis:**

```sql
SELECT tr.timestamp, AVG(r.metrics->>'turn_radius')
FROM test_results r
JOIN test_runs tr ON r.run_id = tr.id
WHERE r.category = 'Dribble'
GROUP BY tr.timestamp
ORDER BY tr.timestamp DESC
LIMIT 30;
```

- **Incremental testing** — skip cases whose code dependencies haven't changed since the last passing run

**Database choice:**
- **SQLite** — zero deployment, single file, good enough for most teams. Can handle millions of rows.
- **PostgreSQL** — if you need concurrent access from multiple CI machines or a team dashboard

### 7.3 The Hybrid Approach

In practice, the best approach combines both:

1. **Raw per-frame data** → JSON files (for debugging specific failures)
2. **Summarized metrics** → Database (for regression detection and trend analysis)
3. **Dashboard** → query the database instead of generating static HTML reports

```python
# After a test case completes:
def on_case_complete(case, raw_data):
    # Save raw data for debugging (keep last N runs)
    save_json(raw_data, get_raw_data_path(case))

    # Compute summary metrics
    metrics = {
        'avg_speed': mean(raw_data.player_speeds),
        'max_speed': max(raw_data.player_speeds),
        'animation_sequence': raw_data.get_animation_hash(),
    }

    # Insert into database
    db.insert('test_results', case_name=case.name, metrics=metrics)

    # Check against baseline
    baseline = db.get_baseline(case.name)
    if baseline and exceeds_threshold(metrics, baseline):
        flag_regression(case.name, metrics, baseline)
```

## 8. Optimization Strategies

### 8.1 Minimize World Reloads

Loading a game world is expensive (several seconds). Two strategies:

- **Sort test cases by world configuration** — group cases that need the same AI mode, weather, pitch, etc. Only reload when the configuration changes.
- **Incremental reset** — if the world configuration is identical, reset player positions and ball state without reloading the entire scene. This requires the engine to support a "soft reset" that clears game state but keeps assets loaded.

### 8.2 Parallel Execution

If tests are *independent* (互不依赖的), you can run multiple game instances in parallel:

```
Instance 1: Dribble tests (AI_MODE = NO_AI)
Instance 2: Shoot tests   (AI_MODE = NO_AI)
Instance 3: GK tests      (AI_MODE = ONLY_GK)
Instance 4: Attack tests   (AI_MODE = ALL_AI)
```

This requires:
- The orchestration layer to spawn multiple game processes
- Each instance writes to its own output directory
- Results are merged after all instances complete

### 8.3 Selective Testing

Don't run all tests every time. Use *dependency tracking* (依赖追踪) to determine which tests are affected by a code change:

```python
# Map source files to test categories
DEPENDENCY_MAP = {
    'DribbleSystem.py': ['Dribble'],
    'ShootSystem.py': ['Shoot'],
    'BallPhysics.py': ['BallPhysics', 'Shoot', 'Pass'],
    'AIController.py': ['Attack', 'GK'],
}

def get_affected_categories(changed_files):
    categories = set()
    for f in changed_files:
        categories.update(DEPENDENCY_MAP.get(f, []))
    return categories or ALL_CATEGORIES  # If unknown, run everything
```

### 8.4 Record Only What You Need

Instead of recording every entity every frame, let each test case declare what it needs:

```json
{
    "record_config": {
        "entities": [100, 101],
        "fields": ["position", "speed"],
        "sample_rate": 2
    }
}
```

This can reduce data volume by 10x or more for large test suites.

## 9. Putting It All Together

A mature automated testing pipeline for a football game looks like this:

```
Developer pushes code
        │
        ▼
CI triggers orchestration script
        │
        ├── Sync latest build
        ├── Determine affected test categories (from git diff)
        ├── Launch N game instances in parallel
        │
        ▼
Each instance runs its assigned tests
        │
        ├── Per-frame data → JSON (kept for debugging)
        ├── Summary metrics → Database
        │
        ▼
Regression check
        │
        ├── Compare metrics against baselines
        ├── If delta > threshold → flag regression
        │
        ▼
Dashboard updates automatically
        │
        └── Team sees: "Dribble turn radius increased 15%
            after commit abc123 — likely regression"
```

The key *takeaway* (要点): the pipeline's value isn't in generating pretty reports. It's in **automatically detecting regressions** before they reach QA or players. Every design decision should serve that goal.

## 10. Summary

| Concept | Key Point |
|---------|-----------|
| Pipeline layers | Orchestration → In-Engine Framework → Results Analysis |
| Test case model | Behavior chain: Condition triggers → Actions execute |
| Action system | Registry pattern for extensibility |
| Data recording | Per-frame snapshots of position, animation, events |
| Results storage | Database for regression detection, JSON for debugging |
| Optimization | Sort by config, parallel instances, selective testing |
| Core goal | Automatic regression detection, not report generation |

Building this pipeline is a significant engineering investment, but for a football game with hundreds of *interacting systems* (相互关联的系统), it's the only way to maintain quality at scale. The alternative — manual play-testing every scenario after every code change — simply doesn't scale.
