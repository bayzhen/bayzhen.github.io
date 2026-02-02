---
description: 提交并发布更改到 GitHub Pages
disable-model-invocation: true
---

请帮我提交并发布当前的更改。

## 步骤

1. **查看更改**：
   ```bash
   git status
   git diff
   ```

2. **确认内容**：
   - 列出将要提交的文件
   - 询问提交信息（如果我没有提供）

3. **提交并推送**：
   ```bash
   git add <files>
   git commit -m "提交信息"
   git push
   ```

4. **确认部署**：
   - GitHub Pages 会自动部署
   - 网站地址：https://bayzhen.github.io

## 注意

- 不要自动执行，等待我确认
- 检查是否有 `Docs/` 目录被误提交
- 推送前确认分支是 `Main`
