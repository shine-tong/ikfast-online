# IKFast Online Generator

🤖 在线生成 IKFast 逆运动学求解器的 Web 平台，本项目所有代码使用 [Kiro](https://kiro.dev/) 生成。

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://shine-tong.github.io/ikfast-online/)
[![License: MIT](https://img.shields.io/badge/License-Apache-yellow.svg)](https://opensource.org/licenses/Apache)

## 📖 项目简介

IKFast Online Generator 是一个零服务器成本的 Web 应用，让机器人开发者能够通过浏览器轻松生成 IKFast 逆运动学求解器。无需本地安装 OpenRAVE 或配置复杂的依赖环境，只需上传 URDF 文件，即可自动生成可用于 MoveIt 的 C++ 求解器代码。

### ✨ 核心特性

- 🌐 **纯浏览器操作** - 无需本地环境配置
- 💰 **零服务器成本** - 完全基于 GitHub 免费服务
- 🔒 **安全隔离** - Docker 容器中处理所有用户文件
- 📊 **实时监控** - 查看生成过程的详细日志
- 🚀 **快速生成** - 自动化的完整工具链
- 📦 **即时下载** - 生成完成后立即获取求解器代码

### 🏗️ 技术架构

- **前端**: 原生 JavaScript (ES6+), HTML5, CSS3
- **托管**: GitHub Pages (静态站点)
- **后端**: GitHub Actions (工作流自动化)
- **执行环境**: Docker (fishros2/openrave 镜像)
- **API**: GitHub REST API v4

## 📁 项目结构

```
.
├── docs/                         # 前端静态文件（GitHub Pages 部署目录）
│   ├── index.html               # 主页面
│   ├── style.css                # 样式文件
│   ├── config.js                # 配置文件
│   ├── main.js                  # 主入口
│   ├── auth.js                  # 认证管理
│   ├── github-api.js            # GitHub API 客户端
│   ├── file-upload.js           # 文件上传组件
│   ├── link-info.js             # 链接信息组件
│   ├── parameter-config.js      # 参数配置组件
│   ├── workflow-trigger.js      # 工作流触发组件
│   ├── status-monitor.js        # 状态监控组件
│   ├── log-viewer.js            # 日志查看器
│   ├── download.js              # 下载组件
│   ├── error-handler.js         # 错误处理
│   ├── file-verification.js     # 文件验证
│   └── quota-warning.js         # 配额警告
├── .github/
│   ├── workflows/
│   │   └── ikfast.yml           # GitHub Actions 工作流
│   ├── DEPLOYMENT.md            # 部署指南
│   └── TROUBLESHOOTING.md       # 故障排除指南
├── jobs/                        # 任务文件存储（临时文件，不提交）
│   └── current/                 # 当前任务
│       └── robot.urdf           # 用户上传的 URDF 文件
├── outputs/                     # 输出文件存储（临时文件，不提交）
│   ├── ikfast_solver.cpp        # 生成的求解器代码
│   ├── build.log                # 构建日志
│   └── links.json               # 链接信息
├── examples/                    # 示例 URDF 文件
│   ├── sa2000h_urdf_0521.urdf   # 6自由度机械臂示例
│   └── README.md                # 示例说明
├── test/                        # 测试文件
│   ├── *.test.js                # 单元测试
│   ├── *.property.test.js       # 属性测试
│   └── setup.js                 # 测试配置
├── .gitignore                   # Git 忽略文件
├── .nojekyll                    # 禁用 Jekyll 处理
├── package.json                 # 项目依赖
├── vitest.config.js             # 测试配置
├── LICENCE                      # 证书
└── README.md                    # 项目说明
```

## 🚀 快速开始

### 前置要求

- GitHub 账号
- GitHub Personal Access Token（需要 `repo` 和 `workflow` 权限）

### 部署步骤

#### 1. Fork 或克隆仓库

```bash
git clone https://github.com/shine-tong/ikfast-online.git
cd ikfast-online
```

#### 2. 配置仓库信息

编辑 `docs/config.js`，修改以下配置：

```javascript
const CONFIG = {
  REPO_OWNER: 'your-username',    // 替换为您的 GitHub 用户名
  REPO_NAME: 'your-reponame',     // 替换为您的仓库名称
  // ... 其他配置保持不变
};
```

#### 3. 启用 GitHub Pages

1. 进入仓库的 **Settings** → **Pages**
2. 在 **Source** 下选择：
   - Branch: `master` (或 `main`)
   - Folder: **`/docs`** ⚠️ 必须选择 `/docs`
3. 点击 **Save**
4. 等待几分钟，GitHub Pages 将自动部署

> **⚠️ 重要**: GitHub Pages 只支持从 `/ (root)` 或 `/docs` 部署。本项目使用 `/docs` 文件夹。

#### 4. 获取 Personal Access Token

1. 访问 GitHub **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. 点击 **Generate new token (classic)**
3. 设置 Token 名称（如 "IKFast Generator"）
4. 选择权限：
   - ✅ `repo` (完整仓库访问)
   - ✅ `workflow` (工作流权限)
5. 点击 **Generate token**
6. **重要**: 复制并保存 Token（只显示一次）

#### 5. 访问应用

访问您的 GitHub Pages 地址：
```
https://your-username.github.io/your-reponame/
```

## 📘 使用指南

### 步骤 1: 认证

1. 在页面顶部输入您的 GitHub Personal Access Token
2. 点击 **验证** 按钮
3. 验证成功后，Token 将保存在当前会话中（浏览器本地存储）

### 步骤 2: 上传 URDF 文件

1. 点击 **选择文件** 按钮
2. 选择您的机器人 URDF 文件（必须是 `.urdf` 扩展名，max_size ≤ 10MB）
3. 点击 **上传文件** 按钮
4. 系统将自动验证 XML 格式并上传到 GitHub 仓库的 `jobs/current/robot.urdf`

### 步骤 3: 查看链接信息

1. 上传成功后，系统自动触发链接信息提取工作流（info 模式）
2. 等待约 **1-2** 分钟，链接信息表格将显示：
   - **Index**: 链接索引（用于配置参数）
   - **Name**: 链接名称
   - **Parent**: 父链接名称
3. 🔵 **根链接**（无父节点）- 适合作为 Base Link
4. 🟠 **叶链接**（无子节点）- 适合作为 End Effector Link
5. 点击表格行可自动填充对应的链接索引

### 步骤 4: 配置参数

1. **Base Link Index**: 输入运动链的基座链接索引（通常是根链接）
2. **End Effector Link Index**: 输入末端执行器链接索引（通常是叶链接）
3. **IKFast Solver Type**: 选择求解器类型（默认为 `transform6d`）
   - `transform6d`: 完整的 6D 位置和姿态（推荐用于 6 自由度机械臂）
   - `translation3d`: 仅 3D 位置，无姿态约束
   - `direction3d`: 方向向量
   - `ray4d`: 射线（原点+方向）
   - `lookat3d`: 注视点
   - `translationdirection5d`: 位置+方向
   - `translationxy5d`: XY 平面位置+姿态

### 步骤 5: 生成求解器

1. 点击 **生成 IKFast 求解器** 按钮
2. 系统将触发 GitHub Actions 工作流（generate 模式）
3. 实时查看执行状态和日志输出
4. 生成过程通常需要 5-15 分钟（取决于机器人复杂度）
5. 工作流超时限制为 30 分钟

### 步骤 6: 下载结果

1. 工作流完成后，下载按钮将变为可用
2. 下载 **ikfast_solver.cpp** - 生成的求解器代码
3. 下载 **build.log** - 完整的构建日志（用于调试）
4. 将求解器代码集成到您的 MoveIt 配置中，[参考教程](https://fishros.org.cn/forum/topic/680/)

## 🔧 故障排除

### 常见问题

#### ❌ 404 错误 - 页面未找到

**原因**: GitHub Pages 配置的文件夹不正确

**解决方案**:
1. 进入 **Settings** → **Pages**
2. 确认 **Folder** 设置为 `/docs`（不是 `/ (root)`）
3. 如果设置错误，修改后点击 **Save**
4. 等待 5 分钟后清除浏览器缓存（Ctrl+Shift+R）
5. 重新访问页面

> **说明**: GitHub Pages 只支持从 `/ (root)` 或 `/docs` 部署。本项目的 `index.html` 在 `docs/` 文件夹中，所以必须选择 `/docs`。

详细的 404 错误修复指南请查看 [TROUBLESHOOTING.md](.github/TROUBLESHOOTING.md)

#### ❌ 上传失败：401 Unauthorized

**原因**: Token 无效或已过期

**解决方案**:
- 检查 Token 是否正确复制（没有多余空格）
- 确认 Token 具有 `repo` 和 `workflow` 权限
- Token 可能已过期，重新生成新的 Token

#### ❌ 上传失败：403 Forbidden

**原因**: 权限不足或 API 速率限制

**解决方案**:
- 确认 Token 具有仓库写入权限
- 等待几分钟后重试（可能是速率限制，每小时 5000 次请求）
- 检查 `docs/config.js` 中的 `REPO_OWNER` 和 `REPO_NAME` 是否正确

#### ❌ 工作流触发失败：422 Validation failed

**原因**: 工作流输入参数类型不匹配

**解决方案**:
- 确保 Base Link 和 End Effector Link 输入的是数字
- 检查参数是否在有效范围内（0 到链接总数-1）
- 确保两个链接索引不相同

#### ❌ 链接信息提取失败

**原因**: URDF 文件格式错误或转换失败

**解决方案**:
- 验证 URDF 文件 XML 语法是否正确
- 确保所有引用的 mesh 文件路径正确（或使用简化的几何体）
- 使用 `check_urdf` 工具本地验证：`check_urdf robot.urdf`
- 查看工作流日志中的详细错误信息

#### ❌ IKFast 生成失败

**原因**: 运动链不满足 IKFast 要求

**解决方案**:
- 检查选择的链接索引是否正确
- 确认 Base Link 和 End Effector Link 之间形成连续的运动链
- 确认运动链是串联结构（IKFast 不支持并联机构）
- 检查自由度数量是否与 IKType 匹配
- 尝试不同的 `iktype` 选项
- 查看 `build.log` 中的详细错误信息

#### ❌ 工作流超时

**原因**: 生成过程超过 30 分钟

**解决方案**:
- 简化机器人模型（减少不必要的链接和关节）
- 检查 URDF 文件是否过于复杂
- 某些机器人结构可能无法生成解析解
- 查看日志确认是否卡在某个步骤

#### ❌ 下载失败：Artifact 未找到

**原因**: 工作流未成功完成或 Artifact 已过期

**解决方案**:
- 检查工作流状态是否为 "completed" 且 conclusion 为 "success"
- Artifact 保留期为 7 天，过期后需重新生成
- 查看工作流日志确认是否有错误
- 访问仓库的 Actions 标签手动下载 Artifact

#### ❌ Docker 错误：cannot execute binary file

**原因**: Docker 镜像架构不匹配

**解决方案**:
- 工作流已配置 `--platform linux/amd64`，应该不会出现此问题
- 如果仍然出现，检查 `.github/workflows/ikfast.yml` 中的 Docker 配置
- 考虑使用其他 OpenRAVE Docker 镜像

### 调试技巧

1. **查看详细日志**: 页面上的日志查看器显示完整的执行过程
2. **检查 GitHub Actions**: 访问仓库的 **Actions** 标签查看工作流运行详情
3. **下载完整日志**: 在 Actions 页面可以下载完整的工作流日志
4. **验证 URDF**: 使用 `check_urdf` 工具本地验证 URDF 文件
5. **测试示例文件**: 使用 `examples/` 目录中的示例 URDF 测试系统
6. **查看浏览器控制台**: 按 F12 打开开发者工具查看前端错误

## 🧪 开发和测试

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行属性测试
npm run test:property

# 查看测试覆盖率
npm run test:coverage
```

### 本地开发

```bash
# 启动本地服务器
npx http-server docs -p 8080

# 或使用 Python
python -m http.server 8080 --directory docs

# 访问 http://localhost:8080
```

### 代码结构

- **组件化设计**: 每个功能模块独立封装为类
- **事件驱动**: 使用 CustomEvent 进行组件间通信
- **错误处理**: 统一的错误处理机制
- **状态管理**: 集中的应用状态管理

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **开启 Pull Request**

### 贡献类型

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 修复问题
- ✨ 添加新功能
- 🧪 添加测试
- 🌐 翻译文档

### 代码规范

- 使用 ES6+ 语法
- 遵循现有代码风格
- 添加适当的 JSDoc 注释
- 为新功能编写测试
- 更新相关文档

### 提交 Bug 报告

请包含以下信息：
- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 浏览器和版本
- 相关日志或截图
- URDF 文件（如果相关）

## 📚 相关文档

- [部署指南](.github/DEPLOYMENT.md) - 详细的部署步骤
- [故障排除](.github/TROUBLESHOOTING.md) - 常见问题解决方案
- [示例文件](examples/README.md) - URDF 示例说明
- [测试文档](test/README.md) - 测试说明

## 🔒 安全性

- Token 仅存储在浏览器本地存储中，不会发送到第三方服务器
- 所有文件处理在 Docker 容器中隔离执行
- 使用 GitHub API 的官方认证机制
- 建议定期更换 Personal Access Token

## 📊 系统限制

- **文件大小**: URDF 文件最大 10MB
- **执行时间**: 单次工作流最长 30 分钟
- **Artifact 保留**: 生成的文件保留 7 天
- **API 速率**: GitHub API 每小时 5000 次请求（已认证）
- **并发限制**: 同一时间只能运行一个工作流

## 📄 许可证

本项目采用 Apache2.0 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Kiro](https://kiro.dev/) - 代码生成
- [OpenRAVE](http://openrave.org/) - 机器人自动化虚拟环境
- [IKFast](http://openrave.org/docs/latest_stable/openravepy/ikfast/) - 快速逆运动学求解器生成器
- [MoveIt](https://moveit.ros.org/) - ROS 运动规划框架
- [fishros2/openrave](https://hub.docker.com/r/fishros2/openrave) - OpenRAVE Docker 镜像
- [GitHub Actions](https://github.com/features/actions) - CI/CD 平台
- [GitHub Pages](https://pages.github.com/) - 静态网站托管

## 📞 支持

如有问题或需要帮助：
- 📧 提交 [Issue](https://github.com/shine-tong/ikfast-online/issues)
- 💬 参与 [Discussions](https://github.com/shine-tong/ikfast-online/discussions)
- 📖 查看文档和示例

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！

**在线体验**: [https://shine-tong.github.io/ikfast-online/](https://shine-tong.github.io/ikfast-online/)
