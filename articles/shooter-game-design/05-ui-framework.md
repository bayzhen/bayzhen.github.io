---
layout: article
title: "UI Framework Design"
description: "MVC-based UI architecture — view management, page/panel lifecycle, visibility priority, and multi-platform adaptation"
lang: en
level: intermediate
tags: ["UI", "MVC", "Framework"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 5
prev:
  title: "Ability System Design"
  url: "04-ability-system.html"
next:
  title: "Gameplay & Game Mode Design"
  url: "06-gameplay-modes.html"
---

## 1. The Scale of Shooter UI

A competitive shooter can have **200+ distinct UI screens** — from the main menu to the in-game HUD to the post-match scoreboard. Managing this *sheer volume* (庞大数量) requires a dedicated UI framework, not ad hoc screen management.

Key challenges include:

- Opening, closing, and stacking screens without *memory leaks* (内存泄漏)
- Handling input focus correctly (when is the mouse controlling the camera vs. the UI?)
- Supporting keyboard, gamepad, and touchscreen simultaneously
- Adapting layouts between PC and mobile
- Showing context-sensitive HUD elements based on game state

## 2. MVC Architecture

The UI framework follows a **Model-View-Controller** pattern adapted for real-time games:

```
┌──────────────────────────────────────────────┐
│                   Model                       │
│   (Game State, Player State, Weapon Data)     │
│   ← No awareness of UI                       │
├──────────────────────────────────────────────┤
│                Controller                     │
│   (ViewController — business logic)           │
│   ← Reads model, updates view                │
├──────────────────────────────────────────────┤
│                   View                        │
│   (Widget tree — buttons, text, images)       │
│   ← Pure visual, no game logic               │
└──────────────────────────────────────────────┘
```

| Component | Responsibility |
| --- | --- |
| **Model** | Game state data — health, ammo, score, round time |
| **View** | Visual widgets — layout, animation, styling |
| **Controller** | *Glue* (粘合层) — reads the model, pushes updates to the view, handles input events |

The separation ensures that changing the visual layout never breaks game logic, and vice versa.

> 句型解析: "The separation ensures that changing the visual layout never breaks game logic, and vice versa" — MVC 分层确保了修改 UI 外观不会影响游戏逻辑，反过来也一样。

## 3. View Manager

At the center of the framework is a **View Manager** — a singleton subsystem that controls all UI screens:

### Core Responsibilities

```
View Manager
├── Open/Close/Hide Pages
├── Create/Destroy Panels
├── Route Input Events
├── Manage Input Device Detection
├── Show System Tips and Error Messages
└── Track Active Screen Stack
```

### Page vs. Panel

The framework distinguishes between two types of UI containers:

| Concept | Description | Example |
| --- | --- | --- |
| **Page** | Full-screen UI with its own lifecycle | Settings page, Scoreboard, Shop |
| **Panel** | Embedded UI within a page or HUD | Health bar, ammo counter, mini-map |

Pages can be **opened**, **closed**, or **hidden**. Hidden pages stay in memory for fast re-opening. Panels are created inside parent widgets and can be loaded *asynchronously* (异步地) to avoid frame drops.

### Screen Stack (Mobile)

On mobile, screens are managed as a **stack** — pushing a new page adds it on top, and pressing Back pops the top page:

```
Push: Lobby → Settings → Key Bindings
Pop:  Key Bindings (back) → Settings (back) → Lobby
```

## 4. View Controller Lifecycle

Each page and panel has a **ViewController** that manages its business logic:

```
OnInit()        — called once when the screen is first created
    │
OnViewSet()     — called when the widget tree is ready
    │
OnTick(dt)      — called every frame while visible
    │
OnHide()        — called when the screen is hidden (but not destroyed)
    │
OnClose()       — called when the screen is destroyed
```

The ViewController also provides:

- **Animation playback** — trigger UI animations by name
- **Audio integration** — play sound effects tied to UI events
- **Widget lookup** — find child widgets by name for binding
- **Input handling** — respond to key/button events when focused

## 5. Visibility Priority System

In a shooter HUD, many elements compete for screen space. A *naive* (朴素的) show/hide system leads to conflicts — for example, the scoreboard and the settings page might both try to show at the same time.

The solution is a **priority-based visibility system** where each show/hide request has a priority level:

| Priority | Source | Example |
| --- | --- | --- |
| Self | The widget's own logic | Health bar hides when full |
| Setting | Player preferences | "Hide mini-map" toggle |
| Function | Feature toggle | Radar disabled in certain modes |
| Game Mode | Mode-specific rules | No abilities UI in tutorial |
| Spectator | Spectating state | Show spectator controls |
| Mutual Exclusion | UI conflict resolution | Scoreboard hides shop |
| Debug | Developer tools | Show FPS counter |

A widget is only visible when **all** priority levels agree it should be shown. This *eliminates* (消除) the classic bug where two systems fight over a widget's visibility.

> 句型解析: "A widget is only visible when all priority levels agree it should be shown" — 只有当所有优先级层都同意显示时，控件才可见。这种设计避免了多个系统争夺控件显隐状态的经典 Bug。

## 6. In-Game HUD Structure

The in-game HUD is organized into *modular* (模块化的) components:

```
Game HUD
├── Crosshair System       — dynamic crosshair based on weapon spread
├── Health & Armor Display — current/max bars with damage flash
├── Ammo Counter           — magazine / reserve display
├── Ability Icons           — cooldown timers, energy bars
├── Kill Feed              — scrolling kill/death messages
├── Mini-Map / Radar       — top-down position indicator
├── Team Panel             — teammate status (alive/dead/health)
├── Buff Icons             — active buffs and debuffs with timers
├── Overhead Display       — health bars and names above characters
├── Mark System            — ping/callout markers in 3D space
├── Damage Indicator       — directional damage arrows
├── Interaction Prompt     — "Press F to interact"
├── Feedback Tips          — context-sensitive messages
└── Spectator Controls     — camera mode, player selection
```

### Mode-Specific HUD

Each game mode may add or remove HUD elements:

| Mode | Added Elements | Removed Elements |
| --- | --- | --- |
| Bomb Defusal | Bomb timer, bomb indicator | — |
| Escort / Payload | Progress bar, checkpoint markers | — |
| Hide & Seek | Seeker/hider role display | Kill feed |
| Practice | Target stats, reset button | Team panel |

## 7. Feedback System

The **feedback system** provides context-sensitive messages to help players understand what is happening:

### Monitor Types

| Monitor | Watches For | Example Message |
| --- | --- | --- |
| Player Event | Kills, deaths, assists | "Double Kill!" |
| Game State | Round start, bomb planted | "Bomb has been planted" |
| Buff | Effect applied/removed | "Speed boost active" |
| Wave Timer | Respawn wave countdown | "Respawning in 5..." |
| Mode-Specific | Escort progress, mine events | "Checkpoint reached!" |

Messages are queued and displayed with priority — a "round won" message should not be *overshadowed* (被遮盖) by a minor buff notification.

## 8. Input Device Management

Modern shooters must handle three input paradigms *simultaneously* (同时地):

| Device | Characteristics | UI Adaptation |
| --- | --- | --- |
| **Keyboard + Mouse** | Precise cursor, many keys | Standard PC layout, cursor visible in menus |
| **Gamepad** | Stick navigation, fewer buttons | Focus-based navigation, button prompts |
| **Touchscreen** | Direct touch, virtual sticks | Enlarged buttons, drag-to-aim, auto-fire options |

The View Manager detects the **active input device** and broadcasts changes so all UI elements can *dynamically* (动态地) swap button prompt icons and navigation behavior.

## 9. Loading Screen System

Transitions between game states (lobby → match, match → results) need **loading screens** to mask asset loading:

### Loading Styles

| Style | Use Case | Progress Type |
| --- | --- | --- |
| Common | Standard transition | Simulated progress |
| Login | Initial startup | Actual progress |
| Map | Level loading | Actual progress |
| Cinematic | Story cutscene | No progress bar |

### Progress Types

- **Simulated progress** — the bar moves at a fake rate to keep players *engaged* (保持参与感), jumping to 100% when loading finishes
- **Actual progress** — tied to real loading percentage from the engine

## 10. Key Takeaways

- Shooter UI uses an **MVC architecture**: Model (game state) → Controller (business logic) → View (widgets)
- A **View Manager** singleton controls page/panel lifecycle, input routing, and device detection
- Pages and panels have a **ViewController** with init → tick → hide → close lifecycle
- A **priority-based visibility system** prevents show/hide conflicts across game systems
- The in-game HUD is composed of **modular components** that can be added or removed per game mode
- A **feedback system** delivers context-sensitive messages with priority queuing
- **Input device detection** dynamically adapts the UI for keyboard, gamepad, and touchscreen
