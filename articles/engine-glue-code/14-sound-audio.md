---
layout: article
title: "Sound and Audio Architecture"
description: "3D spatial audio, FMOD/Wwise events, recording, and ambient audio volumes"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 14
prev:
  title: "Navigation and Pathfinding"
  url: "13-navigation.html"
next:
  title: "Platform Services and SDK Integration"
  url: "15-platform-services.html"
---

Close your eyes in a game and you can still sense the world. Footsteps echo in a stone hallway. Rain patters on a tin roof. An explosion rumbles from the left. Sound is half of immersion, and this engine's audio system is built to handle everything from simple UI clicks to full 3D spatial soundscapes.

## Event-Based Playback

`SoundComponent` uses an event-based model inspired by middleware like FMOD. You call `PlayEvent(mediaPath, fevFile, eventName, volume)` to trigger a sound event by name. For 3D audio, `Play3DEvent()` takes a world position, and `Play3DEventFollowTarget()` attaches the sound to a moving entity. Each call returns an event handle ID that you use to control it later — `SetEventVolume()`, `SetEventPaused()`, `SetEventPosition()`, or `SetEventFadeout()`.

Parameters let you modify sounds dynamically. `SetEventParameter()` might control the RPM pitch of an engine sound. `SetGlobalParameter()` might adjust weather intensity across all ambient effects.

> **Word Notes**
> - *middleware* /ˈmɪdəlweər/ — 中间件，连接引擎和专业功能库的软件。"FMOD and Wwise are audio middleware used by most AAA games."
> - *spatial audio* — 空间音频，根据声源位置和环境模拟3D声音效果。"Spatial audio makes you feel where a sound is coming from."

## Wwise Integration

`SoundComponentExt` extends the base with Wwise-specific features: `SetState()` switches global audio states (like "combat" vs. "exploration"), `SetSwitch()` changes per-object sound variants (like "footstep_wood" vs. "footstep_stone"), and `PostTrigger()` fires one-shot sound triggers. It even supports setting 3D orientation with `SetEventPositionAndOrientation()` for directional sound sources.

> **Word Notes**
> - *state machine* — 状态机，根据当前状态决定行为的系统。"The audio state machine switches between exploration and combat music."
> - *one-shot* — 一次性触发。"A gunshot is a one-shot trigger — fire and forget."

## Ambient Volumes and Recording

`AudioComponent` defines spatial audio zones attached to entities. When the listener enters a volume, it triggers a sound event with configurable fade-in. The `EnterVolume` and `LeaveVolume` events let scripts react to zone transitions.

The sound system also supports recording. `StartRecording()` captures microphone input, and `EndRecording(path, callback)` saves it to a file. There is even AMR codec support for mobile voice messages — `ConvertWavToAmrAsync()` compresses audio for network transmission.

## Key Takeaways

- Sound playback is event-based — trigger by name, control by handle ID
- Wwise integration adds states, switches, and per-object sound variants
- Audio volumes create spatial zones; recording supports voice capture and compression

*A world without sound is just a picture. Sound makes it breathe.*
