---
layout: article
title: "Vehicle Physics Simulation"
description: "How the engine models engines, gears, tires, and suspension through Python config objects"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 7
prev:
  title: "The Camera System: A Tree of Placers"
  url: "06-camera-system.html"
next:
  title: "Physics World: Collision and Rigid Bodies"
  url: "08-physics-world.html"
---

Driving a car in a game feels simple — press the gas, turn the wheel, watch the tires spin. But under the hood, the physics simulation models real mechanical systems: engine torque curves, gear ratios, tire friction, suspension springs, and differential torque split. In this engine, all of this is configured through Python objects.

## Config vs. Runtime

The vehicle system splits cleanly into two layers. `VehicleConfig` is a pure data container — you set properties on it, but it does nothing by itself. `VehicleComponent` is the live physics actor attached to an entity in the world. You build a config, then call `ConfigVehicle(config)` to apply it. This separation means you can prepare multiple vehicle presets and swap them at runtime.

> **Word Notes**
> - *torque curve* — 扭矩曲线，描述发动机在不同转速下的输出扭矩。"The torque curve defines how much power the engine produces at each RPM."
> - *preset* /ˈpriːset/ — 预设配置。"The config includes presets for jeeps, motorbikes, and all-terrain vehicles."

## The Drivetrain Tree

`VehicleConfig` owns a `VehicleDrive` object, which aggregates the entire powertrain. `VehicleEngine` defines peak torque, max RPM, and throttle damping. `VehicleGear` holds gear ratios and shift time. `VehicleAutoBox` controls automatic shifting thresholds. `VehicleClutch` sets engagement strength. `VehicleDifferential` configures how torque splits between wheels — front-wheel, rear-wheel, or all-wheel drive.

Steering uses `VehicleAckermannGeometry`, modeling the real-world principle that inner and outer wheels must turn at different angles. `VehicleSteerRatio` maps vehicle speed to steering sensitivity — fast cars steer less aggressively at high speed.

> **Word Notes**
> - *differential* /ˌdɪfəˈrenʃəl/ — 差速器，将扭矩分配到不同车轮。"The differential splits torque between left and right wheels during a turn."
> - *Ackermann geometry* — 阿克曼转向几何，确保转弯时内外轮转角不同。"Ackermann geometry prevents tire scrubbing in sharp turns."

## Wheels, Tires, and Suspension

Each wheel has its own `VehicleWheel` (radius, mass, brake torque), `VehicleSuspension` (spring strength, damper rate, compression limits), and `VehicleTire` (lateral stiffness, friction-vs-slip curves). The motorbike variant adds `MotorBikeBalanceParams` for active roll stabilization — a spring-damper system that keeps the bike upright.

## Key Takeaways

- Vehicle physics separates config objects (data) from runtime components (simulation)
- The drivetrain is a composition tree: engine, gears, clutch, differential, and steering
- Each wheel has independent suspension, tire friction, and braking parameters

*Every time you drift around a corner, a dozen config objects are arguing about physics behind the scenes.*
