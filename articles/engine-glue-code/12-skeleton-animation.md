---
layout: article
title: "Skeleton and Animation"
description: "The SkeletonComponent — animation playback, bone queries, effects, and collision volumes"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 12
prev:
  title: "Rendering: Models, Particles, and Lights"
  url: "11-rendering.html"
next:
  title: "Navigation and Pathfinding"
  url: "13-navigation.html"
---

If entities are the nouns of a game, animations are the verbs. A character walks, attacks, falls, and dies — all driven by a skeleton made of bones. Here, `SkeletonComponent` is the largest single component in the entire stub library, and for good reason. It does everything.

## Loading and Playback

A skeleton starts with `LoadSkeleton(file)` or its deferred variant for async loading. Once loaded, `PlayAction(action, singlePlay, removeMotion, speed)` starts an animation. `StopAction()` halts it. `ResetTPos()` snaps the skeleton back to its T-pose — the default bind pose where all bones are in their neutral position.

You can query whether an animation exists with `HasAnimation()`, check footstep timing with `GetFootstepInfo()`, and detect foot skating — a common artifact where feet slide on the ground — with `FootskateDetected()`.

> **Word Notes**
> - *bind pose* — 绑定姿态，骨骼的默认位置，蒙皮网格以此为基准。"The T-pose is the standard bind pose for humanoid skeletons."
> - *foot skating* — 滑步，角色脚部在地面滑动的动画瑕疵。"Foot skating breaks immersion — IK or root motion can fix it."

## Bone Queries

Every bone can be queried by name. `GetBoneTransform(name)` returns the local-space matrix. `GetBoneWorldTransform(name)` returns the world-space matrix. `GetBoneTransformInKeyFrames()` returns an entire animation's bone transforms at a given framerate — useful for offline analysis or baking.

`GetPoseBones()` lists all bones in the current pose. `HasBone()` and `HasSkinnedBone()` check existence. This API lets gameplay code attach effects to specific bones, aim weapons at bone positions, or compute hit detection against individual body parts.

> **Word Notes**
> - *matrix* /ˈmeɪtrɪks/ — 矩阵，用于表示位置、旋转和缩放的数学结构。"A 4x3 matrix encodes translation, rotation, and scale in one object."
> - *bake* /beɪk/ — 烘焙，将动态计算的结果预先计算并存储。"Baking bone transforms avoids recomputing them at runtime."

## Effects and Sound

The skeleton is also an effect host. `PlayEffect(effectString, maxLife)` spawns a particle effect attached to a bone, returning an ID for later control. `ClearEffect()`, `PauseEffect()`, and `SetEffectVisible()` manage the effect lifecycle. Sound follows a similar pattern — `SetEnableSoundPlay()` and `SetSoundVolume()` control audio tied to animation events.

Collision volumes can be attached to bones too. `AddSphereCollisionBone()` and `AddCylinderCollisionBone()` create per-bone hit volumes for precise combat detection.

## Key Takeaways

- `SkeletonComponent` handles animation loading, playback, and bone queries
- Bone transforms can be queried in local or world space, with keyframe export support
- Effects, sounds, and collision volumes attach directly to bones for precise gameplay integration

*A skeleton is more than bones — it is the puppet master that brings a character to life.*
