---
layout: article
title: "Platform Services and SDK Integration"
description: "How 20+ engine modules expose platform features — patching, AR, push notifications, and more"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 15
prev:
  title: "Sound and Audio Architecture"
  url: "14-sound-audio.html"
---

A game engine is not just a renderer and a physics simulator. A shipped game needs to patch itself, send push notifications, access the camera, report crashes, profile performance, and integrate with platform SDKs. In this engine, over twenty M-prefix modules handle these "invisible" features that players rarely think about but cannot play without.

## Patching and Resources

`MPatch` manages game updates. `StartFetcher()` begins a download session, `FetchFile(url, path)` downloads individual files, and `PauseFetch()` / `ResumeFetch()` handle interruptions. `MResource` controls asset loading — `AddHoldingResource()` pins assets in memory, `RefreshRepository()` reloads asset indexes, and `Query(path)` resolves a file path to a GUID.

> **Word Notes**
> - *hot patch* — 热更新，不需要重新安装就能更新游戏内容。"Hot patching lets you fix bugs without pushing a full app update."
> - *GUID* /ɡuːɪd/ — 全局唯一标识符。"Every asset has a GUID so the engine can track it across renames."

## Platform and Device

`MPlatform` and `MSystem` expose hardware information: `GetBatteryLevel()`, `IsBatteryCharging()`, `GetNetworkStatus()`, `GetDPI()`, `GetCountryCode()`. These let the game adapt — lowering quality on low battery, showing offline warnings, or adjusting UI scale for different screen densities.

`MConfig` provides build-time flags: `IsFinal`, `IsDebug`, `IsBit64`, `Platform`, `Architecture`. Scripts use these to enable or disable features per platform — for instance, disabling AR on desktop or enabling console-specific optimizations.

> **Word Notes**
> - *screen density* — 屏幕密度，每英寸的像素数。"High screen density requires larger UI elements to remain readable."
> - *build flag* — 构建标志，编译时确定的配置开关。"Build flags separate debug logging from release builds."

## Diagnostics and Profiling

`MDump` reports crashes: `PostScriptError()` sends traceback data, `GetDeviceInfo()` collects hardware details. `MProfile` captures performance data: `Start()`, `Pause()`, `DumpScriptStats()`. `MStatistics` provides real-time metrics: `GetCurrentFps()`, `GetAverageFps()`, `GetCurrentDrawcall()`. `MConsole` redirects Python's stdout and stderr to the engine's console window.

## Everything Else

The breadth is remarkable. `MAR` provides augmented reality — hit-testing, anchor tracking, camera matrices. `MPush` schedules local push notifications with alarm APIs. `MPhoto` opens the device camera and photo gallery. `MLive` streams live video. `MChat` wraps a voice chat SDK. `MGameSDK` provides a generic JSON-based bridge to third-party performance SDKs. Even `MOrbis` handles PlayStation-specific dialogs and parental controls.

## Key Takeaways

- Twenty-plus modules cover patching, device info, diagnostics, AR, push, voice, video, and more
- Each module wraps platform-specific C++ APIs behind a clean Python interface
- Build flags and device queries let scripts adapt behavior per platform

*The glamorous parts of a game are rendering and physics. The parts that ship it are patching, crash reports, and push notifications.*
