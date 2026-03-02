---
layout: article
title: "Hooks自动化"
description: "自动化触发器，让Claude自动遵守规矩"
level: advanced
tags: ["高级", "7-10分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 7
prev:
  title: "Subagents分身术"
  url: "/articles/claude-code/06-subagents.html"
next:
  title: "Slash Commands"
  url: "/articles/claude-code/08-slash-commands.html"
---

## 开场

你有没有这种烦恼：

- Claude写完代码，你还得手动跑一次Prettier
- 它有时候会执行危险命令，你得盯着
- 每次改完文件，你还得手动跑测试

如果这些都能**自动化**呢？

这就是**Hooks**——Claude Code的自动化触发器。

## Hooks是什么？

简单说：**在特定时机，自动执行你定义的脚本**。

就像Git的pre-commit hook，但覆盖Claude的整个工作流程。

## Hook事件类型

| 事件 | 触发时机 | 典型用途 |
| --- | --- | --- |
| PreToolUse | 执行工具前 | 拦截、验证、阻止危险操作 |
| PostToolUse | 执行工具后 | 格式化、测试、日志 |
| UserPromptSubmit | 提交prompt时 | 注入上下文 |
| Stop | Claude完成响应时 | 验证结果、自动提交 |
| SessionStart | 会话开始时 | 加载项目上下文 |

最常用的是 `PreToolUse`（事前拦截）和 `PostToolUse`（事后处理）。

## 实战例子1：自动格式化代码

每次Claude编辑文件后，自动运行Prettier：

```
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write ."
          }
        ]
      }
    ]
  }
}
```

效果：Claude改完文件 → 自动格式化 → 代码风格永远一致。

## 实战例子2：阻止危险命令

在执行bash命令前，检查是否危险：

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/validate-command.sh"
          }
        ]
      }
    ]
  }
}
```

`validate-command.sh`：

```
#!/bin/bash
cmd=$(jq -r '.tool_input.command')

# 检查危险命令
if [[ "$cmd" == *"rm -rf /"* ]]; then
  echo "危险操作已阻止！" >&2
  exit 2  # 退出码2 = 阻止执行
fi

exit 0  # 退出码0 = 允许执行
```

效果：Claude要删根目录？**直接拦截**，并告诉它为什么不行。

## 实战例子3：自动运行测试

每次改代码后，自动跑测试：

```
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --reporter=dot"
          }
        ]
      }
    ]
  }
}
```

效果：Claude改完代码 → 自动跑测试 → 立刻知道有没有搞坏东西。

## 实战例子4：PR前必须通过测试

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__create_pull_request",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/pre-pr-check.sh"
          }
        ]
      }
    ]
  }
}
```

效果：测试没过？**不让创建PR**。

## 退出码的含义

这是Hooks最重要的概念：

| 退出码 | 含义 |
| --- | --- |
| 0 | 允许继续 |
| 1 | 出错，但继续 |
| 2 | 阻止操作 |

**退出码2是最有用的**——它不仅阻止操作，还把你的错误消息发送给Claude。Claude会看到你的消息，然后尝试修正。这是一个**自动的反馈循环**。

## 配置方式

### 方式1：交互式（推荐新手）

```
/hooks
```

跟着界面操作就行。

### 方式2：手动编辑

- 全局配置：`~/.claude/settings.json`
- 项目配置：`.claude/settings.json`

## 完整配置示例

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/validate-command.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write ."
          },
          {
            "type": "command",
            "command": "npm run lint"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npm test"
          }
        ]
      }
    ]
  }
}
```

## 注意事项

1. **别太频繁**：每个Hook都会执行，太多会拖慢速度
2. **精确匹配**：用matcher精确指定触发条件
3. **测试脚本**：先手动测试你的脚本再配置

## 小结

Hooks让Claude变得**可控、可预测**：

- 危险操作 → 自动拦截
- 写完代码 → 自动格式化
- 每次改动 → 自动测试

再也不用人工盯着了。

下一集，我们聊**Slash Commands**和**工作流整合**——把所有这些功能组合成高效的开发流程。
