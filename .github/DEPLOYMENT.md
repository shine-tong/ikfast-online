# GitHub Pages 部署指南

本文档提供详细的 GitHub Pages 配置步骤，确保 IKFast Online Generator 正确部署。

## 📋 前置要求

- GitHub 账号
- 已 Fork 或创建本仓库
- 仓库为 Public（GitHub Pages 免费版仅支持公开仓库）

## 🚀 部署步骤

### 步骤 1: 配置仓库信息

在部署前，必须先修改配置文件：

1. 打开 `web/config.js`
2. 修改以下配置：

```javascript
export const CONFIG = {
  REPO_OWNER: 'your-username',           // 改为您的 GitHub 用户名
  REPO_NAME: 'ikfast-online-generator',  // 改为您的仓库名称
  WORKFLOW_FILE: 'ikfast.yml',           // 保持不变
  POLLING_INTERVAL: 5000,                // 保持不变
  MAX_FILE_SIZE: 10 * 1024 * 1024,      // 保持不变
  WORKFLOW_TIMEOUT: 30 * 60 * 1000      // 保持不变
};
```

3. 提交并推送更改：

```bash
git add web/config.js
git commit -m "Configure repository settings"
git push origin main
```

### 步骤 2: 启用 GitHub Pages

#### 方法 A: 通过 Web 界面配置（推荐）

1. 访问您的仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source**: 选择 `Deploy from a branch`
   - **Branch**: 选择 `main`
   - **Folder**: 选择 `/web` 或 `/ (root)`
5. 点击 **Save** 按钮
6. 等待几分钟，页面顶部会显示部署地址

#### 方法 B: 使用 GitHub Actions 部署（高级）

如果您希望使用 GitHub Actions 自动部署，可以创建部署工作流：

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

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './web'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

2. 在 **Settings** → **Pages** 中：
   - **Source**: 选择 `GitHub Actions`

### 步骤 3: 验证部署

1. 部署完成后，访问您的 GitHub Pages 地址：
   ```
   https://your-username.github.io/ikfast-online-generator/
   ```

2. 检查页面是否正常加载：
   - ✅ 页面标题显示 "IKFast Online Generator"
   - ✅ 所有样式正确加载
   - ✅ 没有 404 错误
   - ✅ 控制台没有 JavaScript 错误

3. 测试基本功能：
   - ✅ Token 输入框可用
   - ✅ 文件上传按钮可用
   - ✅ 页面布局正常

### 步骤 4: 配置自定义域名（可选）

如果您有自定义域名：

1. 在 **Settings** → **Pages** → **Custom domain** 中输入域名
2. 在您的 DNS 提供商处添加 CNAME 记录：
   ```
   CNAME: your-domain.com → your-username.github.io
   ```
3. 等待 DNS 传播（可能需要几小时）
4. 启用 **Enforce HTTPS**

## 🔧 故障排除

### 问题 1: 404 错误 - 页面未找到

**可能原因**:
- GitHub Pages 未正确启用
- 分支或文件夹选择错误
- 部署尚未完成

**解决方案**:
1. 检查 **Settings** → **Pages** 配置
2. 确认选择了正确的分支（`main`）和文件夹（`/web` 或 `/`）
3. 等待 5-10 分钟让部署完成
4. 检查 **Actions** 标签是否有部署工作流运行

### 问题 2: 样式或脚本未加载

**可能原因**:
- 文件路径错误
- CORS 问题
- 缓存问题

**解决方案**:
1. 检查浏览器控制台的错误信息
2. 确认 `index.html` 中的资源路径正确
3. 清除浏览器缓存并刷新
4. 确保 `.nojekyll` 文件存在于根目录

### 问题 3: JavaScript 模块加载失败

**可能原因**:
- ES6 模块不支持
- MIME 类型错误

**解决方案**:
1. 确保 `.nojekyll` 文件存在（禁用 Jekyll 处理）
2. 检查 `<script type="module">` 标签是否正确
3. 验证所有 `.js` 文件的 `export` 语法

### 问题 4: API 请求失败

**可能原因**:
- `config.js` 配置错误
- Token 权限不足

**解决方案**:
1. 检查 `web/config.js` 中的 `REPO_OWNER` 和 `REPO_NAME`
2. 确认 Token 具有 `repo` 和 `workflow` 权限
3. 检查浏览器控制台的网络请求

## 📊 部署验证清单

部署完成后，请验证以下项目：

- [ ] GitHub Pages 已启用
- [ ] 部署地址可访问
- [ ] 页面正常显示，无 404 错误
- [ ] 所有 CSS 样式正确加载
- [ ] 所有 JavaScript 文件正确加载
- [ ] 控制台无错误信息
- [ ] Token 输入功能正常
- [ ] 文件上传界面显示正常
- [ ] `config.js` 配置正确
- [ ] `.nojekyll` 文件存在

## 🔄 更新部署

当您更新代码后，GitHub Pages 会自动重新部署：

1. 提交并推送更改到 `main` 分支
2. GitHub 自动触发部署
3. 等待几分钟
4. 刷新页面查看更新

如果更改未生效：
- 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
- 检查 **Actions** 标签确认部署完成
- 等待 CDN 缓存更新（可能需要几分钟）

## 📞 获取帮助

如果遇到部署问题：
1. 查看 [GitHub Pages 文档](https://docs.github.com/en/pages)
2. 检查仓库的 **Actions** 标签查看部署日志
3. 提交 [Issue](https://github.com/your-username/ikfast-online-generator/issues)

---

✅ 部署完成后，您就可以开始使用 IKFast Online Generator 了！
