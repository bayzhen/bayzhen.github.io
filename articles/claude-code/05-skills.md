---
layout: article
title: "Skills技能系统"
description: "让Claude按需下载技能，像黑客帝国的Neo一样"
level: intermediate
tags: ["进阶", "5-7分钟"]
series: claude-code
series_title: "Claude Code教程"
title_suffix: "陈栢成"
order: 5
prev:
  title: "MCP插件系统"
  url: "/articles/claude-code/04-mcp.html"
next:
  title: "Subagents分身术"
  url: "/articles/claude-code/06-subagents.html"
---

## 开场

还记得《黑客帝国》里那个经典场景吗？

Neo躺在椅子上，数据灌入大脑，然后他睁开眼睛说：

> "I know Kung Fu."

Claude Code的Skills系统，就是这个概念的编程版。

## Skills是什么？

**按需加载的知识包**。

传统做法：把所有规范、最佳实践写在CLAUDE.md里，每次对话都加载。

问题：大部分时候用不到，白白浪费tokens。

Skills的做法：Claude根据你的任务，**自动判断**要不要加载某个skill。

用到才加载，不用不加载。

## Skills vs CLAUDE.md

| 特性 | CLAUDE.md | Skills |
| --- | --- | --- |
| 加载时机 | 每次都加载 | 按需加载 |
| 适合内容 | 项目基础信息 | 特定任务的专业知识 |
| Token消耗 | 固定消耗 | 用到才消耗 |

**经验法则**：

- 每个项目都要知道的 → CLAUDE.md
- 特定任务才需要的 → Skill

## 创建你的第一个Skill

### 目录结构

```
~/.claude/skills/
└── react-testing/
    └── SKILL.md
```

或项目级：

```
.claude/skills/
└── react-testing/
    └── SKILL.md
```

### SKILL.md示例

```
---
name: react-testing
description: 当用户需要编写React组件测试时使用此技能
---

# React测试最佳实践

## 核心原则
- 测试用户行为，不测实现细节
- 使用 @testing-library/react
- 避免测试组件内部状态

## 常用模式

### 基础测试
```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('按钮点击应触发回调', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>点我</Button>);

  await userEvent.click(screen.getByText('点我'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## 注意事项
- 用 userEvent 替代 fireEvent
- 用 waitFor 处理异步
- 用 screen.getByRole 优先于 getByTestId
```

### 使用效果

现在，当你说：

```
帮我给这个登录组件写个测试
```

Claude会：

1. 识别到这是"React测试"任务
2. 自动加载 `react-testing` skill
3. 按照你定义的最佳实践写测试

你不用每次都说"记得用testing-library"——它**自动知道了**。

## 官方Skills

Anthropic提供了一些官方skill：

```
/mnt/skills/public/
├── docx/SKILL.md     # Word文档
├── xlsx/SKILL.md     # Excel表格
├── pptx/SKILL.md     # PowerPoint
└── pdf/SKILL.md      # PDF文件
```

这就是为什么Claude能帮你做Excel、写PPT——它有专门的技能包。

## 实用Skill示例

### API开发规范

```
---
name: api-standards
description: 当用户开发REST API时使用
---

# API开发规范

## 命名
- 资源用复数：/users, /orders
- 用连字符：/user-profiles

## 状态码
- 200: 成功
- 201: 创建成功
- 400: 请求错误
- 401: 未认证
- 404: 未找到

## 响应格式
{
  "data": {},
  "error": null,
  "meta": { "page": 1, "total": 100 }
}
```

### Git提交规范

```
---
name: git-commits
description: 当用户进行Git提交时使用
---

# Git提交规范

## 格式
type(scope): subject

## 类型
- feat: 新功能
- fix: 修复bug
- docs: 文档
- refactor: 重构
- test: 测试

## 示例
feat(auth): 添加微信登录
fix(cart): 修复数量计算错误
```

## 小结

Skills让Claude变得更聪明、更省钱：

- **按需加载**：用到才消耗tokens
- **自动触发**：Claude自己判断要不要用
- **可复用**：写一次，到处用

下一集，我们聊**Subagents**——Claude的"分身术"，让它能同时处理多个任务而不乱套。
