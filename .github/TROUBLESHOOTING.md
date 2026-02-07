# 404 错误快速修复指南

## 🚨 如果您看到 404 错误

这是最常见的部署问题，通常是因为 GitHub Pages 配置指向了错误的文件夹。

## ✅ 立即修复步骤

### 1. 检查并修改 GitHub Pages 设置

1. 打开您的仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 查看 **Build and deployment** 部分：

```
Source: Deploy from a branch
Branch: master
Folder: /docs  ← 必须是 /docs（GitHub Pages 只支持 / 或 /docs）
```

5. 如果 Folder 不是 `/docs`，点击下拉菜单选择 `/docs`
6. 点击 **Save** 按钮
7. 等待 3-5 分钟

### 2. 验证修复

访问以下 URL（替换为您的实际信息）：

```
https://your-username.github.io/your-reponame/
```

如果仍然 404，尝试直接访问：

```
https://your-username.github.io/your-reponame/index.html
```

### 3. 清除缓存

如果页面仍然显示 404：

- **Chrome/Edge**: 按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
- **Firefox**: 按 `Ctrl + F5` (Windows) 或 `Cmd + Shift + R` (Mac)
- 或者使用隐私/无痕模式打开

## 🔍 为什么会出现 404？

您的项目结构是这样的：

```
your-repo/
├── docs/             ← index.html 在这里
│   ├── index.html
│   ├── style.css
│   └── *.js
├── examples/
├── test/
└── README.md
```

GitHub Pages 只支持从以下位置部署：
- `/ (root)` - 根目录
- `/docs` - docs 文件夹

如果 GitHub Pages 配置为从 `/ (root)` 部署，它会在根目录查找 `index.html`，但文件实际在 `docs/` 文件夹中，所以会返回 404。

**正确配置**: 设置 Folder 为 `/docs`，GitHub Pages 就会从 `docs/` 文件夹部署。

## 📊 配置验证清单

完成以下检查：

- [ ] Settings → Pages 已打开
- [ ] Source 设置为 "Deploy from a branch"
- [ ] Branch 设置为 "master"
- [ ] **Folder 设置为 "/docs"**（最重要！）
- [ ] 点击了 Save 按钮
- [ ] 等待了 5 分钟
- [ ] 清除了浏览器缓存
- [ ] 页面可以正常访问

## 🔄 如果问题仍然存在

### 检查部署状态

1. 进入仓库的 **Actions** 标签
2. 查看最近的 "pages build and deployment" 工作流
3. 确认状态为绿色 ✓（成功）
4. 如果是红色 ✗（失败），点击查看错误日志

### 检查文件是否存在

确认 `docs/index.html` 文件存在于您的仓库中：

1. 在仓库主页点击 `docs` 文件夹
2. 确认能看到 `index.html` 文件
3. 点击文件确认内容正确

### 使用 GitHub Actions 部署（备选方案）

如果从分支部署仍然有问题，可以使用 GitHub Actions：

1. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './docs'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. 提交并推送此文件
3. 在 **Settings** → **Pages** 中：
   - 将 **Source** 改为 `GitHub Actions`
4. 等待工作流运行完成

## 💡 快速测试

在浏览器控制台（F12）运行：

```javascript
fetch('https://your-username.github.io/your-reponame/index.html')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e));
```

- 如果返回 `Status: 200`，说明文件存在，可能是缓存问题
- 如果返回 `Status: 404`，说明配置错误

## 📞 仍需帮助？

如果以上步骤都无法解决问题：

1. 检查仓库是否为 Public（GitHub Pages 免费版仅支持公开仓库）
2. 确认您有仓库的管理员权限
3. 查看 [GitHub Status](https://www.githubstatus.com/) 确认服务正常
4. 在仓库中提交 Issue 并附上：
   - 您的仓库 URL
   - Settings → Pages 的截图
   - 浏览器控制台的错误信息

---

**记住**: 最常见的原因就是 Folder 设置错误。确保设置为 `/docs`！
