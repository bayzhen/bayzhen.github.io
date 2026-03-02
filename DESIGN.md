# CMTDAI Plugin Design Document

## 1. Overview

**CMTDAI** is an Unreal Engine editor plugin that generates AI navigation and cover data for cover-based combat games. It works inside the UE editor (not at runtime) and produces JSON files that describe:

- Where AI characters can take cover.
- Which cover positions are visible from any given location on the map.
- Navigation training points for AI path-finding.

The plugin depends on a third-party plugin called **CoverGenerator**, which detects cover positions around walls and obstacles.

---

## 2. Goals

1. **Automate AI data generation** — Replace manual placement of AI data with a one-click pipeline.
2. **Export structured JSON** — Provide machine-readable data for external AI training or runtime decision-making systems.
3. **Visualize results in-editor** — Allow designers to see cover points, level points, and their relationships directly in the Unreal Editor viewport.
4. **Support batch workflows** — Provide keyboard shortcuts, console commands, and a DDC warmup tool for working with many maps efficiently.

---

## 3. Architecture

### 3.1 Module Entry Point

The plugin registers itself as an **Editor module** that loads at the `PreLoadingScreen` phase. On startup it:

- Registers three global editor keyboard shortcuts (Ctrl+1/2/3).
- Registers a console command `Editor.StartDDCWarmup` for batch asset loading.

### 3.2 Class Hierarchy

```
AActor
  └── AEditorTickableAIActor          (base class, ticks in editor viewport)
        ├── AAIDataGenerator          (main data generation actor)
        ├── APoint2CoverDetector      (real-time debug visualization actor)
        ├── AValidNavMeshAnchor        (navigable point collector actor)
        └── AAIWallPoint               (simple wall-point marker actor)

UBlueprintFunctionLibrary
  └── UCMTDAIBPLibrary                (static utility functions, callable from Blueprint)

FTickableEditorObject
  └── FEditorMapDDCWarmup             (batch map/asset DDC warmup tool)

TCommands
  └── FCMTDAICommands                 (editor shortcut definitions)

IModuleInterface
  └── FCMTDAIModule                   (plugin startup/shutdown)
```

### 3.3 Key Design Decisions

| Decision | Reason |
|---|---|
| Editor-only module (`Type: "Editor"`) | The data generation runs only during development, not in shipped games. |
| `ShouldTickIfViewportsOnly() = true` | Allows actors to keep ticking even when the game is not running, so debug visualization works in the editor. |
| Parallel processing (`ParallelFor`) | The point-to-cover mapping loop is computationally expensive. Parallelism speeds it up significantly. |
| Spatial grid indexing (3000-unit cells) | Avoids O(N*M) brute-force checks between level points and cover points. |
| 100-unit grid alignment | All level points snap to a 100-unit grid for consistent spacing and data deduplication. |

---

## 4. Core Systems

### 4.1 Level Point Collection (`AValidNavMeshAnchor`)

**Purpose:** Discover all walkable positions on the map using a flood-fill algorithm.

**How it works:**

1. The anchor actor is placed in the scene. Every 3 seconds it runs `UpdateAllNavigablePoints()`.
2. Starting from its own location (snapped to a 100-unit grid), it casts a ray downward to find the ground.
3. From the ground hit location, it uses a **flood-fill** approach:
   - For each discovered point, it tries to expand in all 8 horizontal neighbor directions (100 units apart).
   - For each neighbor, it does a **capsule trace** horizontally. If the trace does NOT hit any obstacle, that neighbor is walkable.
   - Walkable neighbors are added to the frontier for further expansion.
4. All discovered points are stored in `AIDataGenerator.LevelPoints` (a `TSet<FVector>`), and their neighbor connections are stored in `AIDataGenerator.LevelPointsMap`.
5. A safety limit of 20,000 points prevents the system from running forever on large maps.

**Grid alignment:** All coordinates are rounded to the nearest multiple of 100 using `FMath::RoundToInt(value / 100) * 100`.

### 4.2 Cover Point Initialization (`AAIDataGenerator::Init_CoverPoints`)

**Purpose:** Collect cover positions from the CoverGenerator plugin.

**How it works:**

1. Find the `ACoverGenerator` actor in the scene.
2. Call `CoverGenerator->GenerateCovers(true)` to make it detect cover positions.
3. Query cover points within a large bounding box (40,000 x 40,000 x 20,000 units).
4. **Filter** the results:
   - Keep only cover points that support standing cover (left or right side).
   - Keep only cover points whose location (after Z-offset checks of ±200 units) matches an existing level point.

### 4.3 Point-to-Cover Mapping (`FLevelPointToCoverPoints::MakeMap`)

**Purpose:** For each level point, find which cover points provide partial cover from that position.

**Algorithm:**

1. **Build a spatial grid index** — Divide all cover points into 3000x3000x3000-unit grid cells.
2. **For each level point (in parallel):**
   a. Determine which grid cell the level point belongs to.
   b. Collect all cover points from that cell and its 26 neighboring cells.
   c. For each nearby cover point:
      - Skip if distance > 9,000 units (maximum fight distance).
      - Get the cover point's **side fight points** (positions where an AI character would stand to shoot from cover).
      - Cast visibility rays from the level point to each fight point (both at +180 Z offset to simulate standing height).
      - If **some rays hit obstacles and some do not**, the cover is considered **partial cover** from this level point. Record this relationship.
3. Thread-safe writes use `FCriticalSection` since multiple threads write to the shared result map.

**Why partial cover matters:** A cover point is useful only if the AI can both hide behind it (some rays blocked) and shoot from it (some rays unblocked). Full obstruction means the position is useless; full visibility means there is no actual cover.

### 4.4 Navigation Point Generation (`AAIDataGenerator::GenerateNavPoints`)

**Purpose:** Create navigation training data for AI path-finding systems.

**How it works:**

1. Take all level points from the point-to-cover data.
2. Downsample to a 300-unit grid (keep only points where both X and Y are multiples of 300).
3. For each remaining point, cast a ray downward to get the exact ground position.
4. Also collect all `AAIWallPoint` actors in the scene (manually placed wall markers).
5. Export everything as a JSON array with fields: `id`, `location_x/y/z`, `angle`, `type`, `children`, and `2d_point` (0 for ground points, 1 for wall points).

### 4.5 JSON Data Pipeline

The full data generation pipeline has three steps, exposed as editor buttons:

| Step | Function | Description |
|---|---|---|
| 1 | `InitData()` | Initializes cover points from CoverGenerator or JSON file |
| 2 | `GenerateJson()` | Builds the JSON structure with cover points and point-to-cover mappings |
| 3 | `SaveJson()` | Writes JSON to `<Plugin>/Saved/Json/<LevelName>_<Tag>_<Timestamp>.json` |

There is also a **one-click pipeline** (`GeneratePoint2Covers()`) that runs all three steps in sequence.

#### JSON Output Format

**Level JSON** — contains two top-level arrays:

```json
{
  "cover_point": [
    {
      "id": 1,
      "location_x": 1200.0,
      "location_y": -500.0,
      "location_z": 100.0,
      "angle": 90.0,
      "children": [],
      "2d_point": 0,
      "bCrouchedCover": false,
      "bLeftCoverStanding": true,
      "bRightCoverStanding": true
    }
  ],
  "point2covers": [
    {
      "X": 1100.0,
      "Y": -400.0,
      "Z": 100.0,
      "covers": [1, 3, 7]
    }
  ]
}
```

- `cover_point` — All cover positions with their properties.
- `point2covers` — For each level point, the IDs of cover points that provide partial cover.

**Nav JSON** — contains one array:

```json
{
  "nav_points": [
    {
      "id": 1,
      "location_x": 300.0,
      "location_y": 600.0,
      "location_z": 193.0,
      "angle": 0,
      "type": 0,
      "children": [],
      "2d_point": 0
    }
  ]
}
```

### 4.6 Cover Point Override

The `CoverStrOverride` property allows designers to bypass the CoverGenerator and inject cover point data directly as a JSON string. When this field is not empty, the system parses it and uses those cover points instead. This is useful for testing or when cover data comes from an external source.

---

## 5. Navigation Mesh Utilities

The `UCMTDAIBPLibrary` class provides several utility functions that work with Unreal's Recast navigation mesh:

### 5.1 Random Navigable Point Generation

`GetRandomPointsInNavSys(int Num)` generates evenly-spaced random points on the nav mesh. It uses a minimum distance constraint (calculated from the nav mesh bounds and requested count) to prevent clustering.

### 5.2 Nav Mesh Edge Extraction

`GetNavMeshEdgeGroups()` extracts the boundary edges of the navigation mesh and groups them into connected chains. Each chain represents a continuous boundary segment of the walkable area.

### 5.3 Connected Component Analysis

`FindNavMeshConnectedComponents()` uses **BFS (Breadth-First Search)** to find connected regions in the nav mesh edges. For each region, it:

- Builds a bidirectional adjacency map.
- Identifies endpoints (vertices with odd degree).
- For **linear paths** (2 endpoints): traverses from one endpoint to the other.
- For **cycles** (0 endpoints): traverses around the loop.
- Returns an ordered list of vertices for each connected region.

### 5.4 Convex Hull and Prism Generation

`ShowStartPointClosestRegion()` performs the following:

1. Find all connected edge regions of the nav mesh.
2. Find which region is closest to each `PlayerStart` actor.
3. For each such region, compute a **2D convex hull** using the Graham Scan algorithm.
4. Expand the hull outward by 100 units using the `OffsetConvexHull()` function.
5. Create a 3D **prism** (extruded hull) from the lowest Z to the highest Z (with padding).
6. Draw the prism in the editor for visualization.

This helps designers see the playable area boundaries around spawn points.

---

## 6. Editor Integration

### 6.1 Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| Ctrl+1 | Spawn Actor | Spawns a static mesh actor at the mouse cursor position (via ray cast) |
| Ctrl+2 | Export Positions | Exports all spawned actor positions to a text file |
| Ctrl+3 | Clear Actors | Destroys all spawned actors |

These shortcuts are registered globally in the Level Editor.

### 6.2 Editor Buttons (Details Panel)

When an `AAIDataGenerator` actor is selected, the Details panel shows clickable buttons for:

- One-click pipeline (init + generate + save)
- Step-by-step pipeline (init, generate JSON, save separately)
- Load cover points from JSON
- Generate navigation points
- Clear all data
- Debug visualization
- Show JSON data
- Review cover points

### 6.3 Real-Time Debug Visualization

Two types of debug visualization are available:

**Static visualization** (via `AAIDataGenerator::Tick`):
- When `bDebugLevelPoints` is enabled: draws red vertical lines at each level point and green connection lines between neighboring points.
- When `bDebugCoverPoints` is enabled: draws green spheres at cover locations and green directional arrows showing which way the cover faces.
- Uses `ULineBatchComponent` for efficient batched rendering.

**Interactive visualization** (via `APoint2CoverDetector`):
- The detector actor draws visibility lines from its current position to all nearby cover fight points.
- Yellow lines indicate blocked (covered) sight lines; red lines indicate clear sight lines.
- Designers can move the detector around to test cover effectiveness at any location.

### 6.4 JSON Data Viewer

`ShowJsonData()` loads a JSON file (specified by `JsonPath`) and visualizes the point data as colored dots in the viewport. It also highlights the point closest to a reference actor in red, which helps verify data accuracy.

---

## 7. DDC Warmup Tool

`FEditorMapDDCWarmup` is a utility that pre-loads maps and assets to populate the Derived Data Cache (DDC). This speeds up future editor sessions by avoiding on-demand shader compilation and texture processing.

**Usage:** Run the console command `Editor.StartDDCWarmup <MapFolderPath> [WaitSeconds]`.

**How it works:**
1. Collects all `.umap` files in the specified folder.
2. Loads each map one by one, waiting a configurable number of seconds between loads.
3. After all maps are loaded, loads other common assets to trigger DDC generation.
4. Only processes when the editor is idle (shader compilation count is zero).

---

## 8. Dependencies

| Module | Purpose |
|---|---|
| Core, CoreUObject, Engine | Unreal Engine fundamentals |
| NavigationSystem, Navmesh | Navigation mesh access and queries |
| CoverGenerator (plugin) | Third-party cover detection system |
| Json, JsonUtilities | JSON serialization and deserialization |
| UnrealEd, LevelEditor | Editor integration (commands, viewport access) |
| EditorScriptingUtilities | Editor scripting helpers (`UEditorLevelLibrary`) |
| Slate, SlateCore, EditorStyle | UI framework (for future UI extension) |
| ToolMenus, InputCore | Editor menu and input handling |

---

## 9. File Structure

```
CMTDAI/
├── CMTDAI.uplugin                          Plugin descriptor
├── Source/CMTDAI/
│   ├── CMTDAI.Build.cs                     Build configuration
│   ├── Public/
│   │   ├── CMTDAI.h                        Module interface
│   │   ├── CMTDAICommands.h                Keyboard shortcut definitions
│   │   ├── CMTDAIBPLibrary.h               Blueprint function library + data structs
│   │   ├── AIDataGenerator.h               Main data generation actor
│   │   ├── EditorTickableAIActor.h         Base class for editor-ticking actors
│   │   ├── Point2CoverDetector.h           Interactive cover visualization
│   │   ├── ValidNavMeshAnchor.h            Flood-fill point collector
│   │   ├── AIWallPoint.h                   Wall point marker
│   │   └── EditorMapDDCWarmup.h            DDC warmup utility
│   └── Private/
│       ├── CMTDAI.cpp                      Module startup, shortcuts, actor spawning
│       ├── CMTDAICommands.cpp              Command registration
│       ├── CMTDAIBPLibrary.cpp             Nav mesh utilities, cover loading, algorithms
│       ├── AIDataGenerator.cpp             Data pipeline, JSON generation, debug rendering
│       ├── Point2CoverDetector.cpp         Real-time cover line visualization
│       ├── ValidNavMeshAnchor.cpp          Flood-fill navigable point discovery
│       └── EditorTickableAIActor.cpp       Base class implementation
└── Saved/Json/                             Generated JSON output files
```

---

## 10. Data Flow Summary

```
                    ┌─────────────────┐
                    │  CoverGenerator  │
                    │   (3rd-party)    │
                    └────────┬────────┘
                             │ cover positions
                             ▼
┌──────────────┐    ┌────────────────┐    ┌───────────────┐
│ValidNavMesh  │───▶│ AIDataGenerator │◀───│  JSON File    │
│   Anchor     │    │                │    │  (optional)   │
│(flood-fill)  │    │  - CoverPoints │    └───────────────┘
└──────────────┘    │  - LevelPoints │
  level points      │  - Mappings    │
                    └───────┬────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌───────────┐
        │Level JSON│  │ Nav JSON │  │  Debug    │
        │(covers + │  │(training │  │Rendering  │
        │mappings) │  │ points)  │  │(viewport) │
        └──────────┘  └──────────┘  └───────────┘
```

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **Level Point** | A walkable position on the map, snapped to a 100-unit grid |
| **Cover Point** | A position next to a wall or obstacle where an AI can hide |
| **Fight Point** | A position offset to the side of a cover point, where an AI leans out to shoot |
| **Point-to-Cover Mapping** | A record of which cover points provide partial cover from a given level point |
| **Partial Cover** | A situation where some sight lines from a position to a cover's fight points are blocked and some are clear |
| **Convex Hull** | The smallest convex shape that encloses a set of 2D points |
| **Prism** | A 3D shape formed by extruding a 2D convex hull along the Z axis |
| **DDC (Derived Data Cache)** | Unreal Engine's cache for processed assets like compiled shaders and cooked textures |
| **Nav Mesh** | Unreal Engine's navigation mesh — a polygon mesh that defines walkable areas |
| **Flood Fill** | An algorithm that starts from a seed point and expands outward to discover connected regions |
