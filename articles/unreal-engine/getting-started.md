---
layout: article
title: "虚幻引擎开发入门指南"
description: "从零开始搭建UE开发环境，了解项目结构与基础概念"
level: beginner
tags: ["入门", "UE5"]
series: unreal-engine
series_title: "虚幻引擎"
title_suffix: "陈栢成"
order: 0
next:
  title: "UE编辑器中AI掩体数据的自动化生成"
  url: "ai-cover-data-generation.html"
---

这是一篇示例文章，展示文章页面的排版格式。你可以用这个模板来写自己的技术文章。

## 环境搭建

介绍如何搭建虚幻引擎开发环境...

### 安装 Epic Games Launcher

首先需要安装 Epic Games Launcher，然后通过它来下载和管理虚幻引擎版本。

**提示：**建议使用 SSD 硬盘来安装引擎和项目，可以显著提升编译和加载速度。

### 安装 Visual Studio

UE 开发需要 Visual Studio，安装时需要勾选以下组件：

- 使用 C++ 的游戏开发
- .NET 桌面开发
- Windows 10/11 SDK

## 项目结构

一个标准的 UE 项目目录结构如下：

```
MyProject/
├── Config/          # 配置文件
├── Content/         # 资源文件
├── Source/          # C++ 源代码
│   └── MyProject/
│       ├── MyProject.h
│       ├── MyProject.cpp
│       └── MyProject.Build.cs
├── MyProject.uproject
└── ...
```

## 第一个 Actor

创建一个简单的 Actor 类：

```
// MyActor.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MyActor.generated.h"

UCLASS()
class MYPROJECT_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    AMyActor();

protected:
    virtual void BeginPlay() override;
};
```

**注意：**UE 的反射系统要求类必须包含 `GENERATED_BODY()` 宏。

## 总结

这篇文章介绍了虚幻引擎开发的基础知识。后续文章会深入讲解 UI 系统、编辑器扩展等内容。
