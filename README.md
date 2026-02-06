# IKFast Online Generator

🤖 在线生成 IKFast 逆运动学求解器的 Web 平台

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
- **API**: GitHub REST API v3

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
├── jobs/                        # 任务文件存储
│   └── current/                 # 当前任务
│       └── robot.urdf           # 用户上传的 URDF 文件
├── outputs/                     # 输出文件存储
│   ├── ikfast_solver.cpp        # 生成的求解器代码
│   └── build.log                # 构建日志
├── examples/                    # 示例 URDF 文件
├── test/                        # 测试文件
├── .github/
│   └── workflows/
│       └── ikfast.yml           # GitHub Actions 工作流
├── package.json                 # 项目依赖
├── vitest.config.js             # 测试配置
└── README.md                    # 项目说明
```

## 🚀 快速开始

### 前置要求

- GitHub 账号
- GitHub Personal Access Token（需要 `repo` 和 `workflow` 权限）

### 部署步骤

#### 1. Fork 或克隆仓库

```bash
git clone https://github.com/your-username/ikfast-online-generator.git
cd ikfast-online-generator
```

#### 2. 配置仓库信息

编辑 `docs/config.js`，修改以下配置：

```javascript
const CONFIG = {
  REPO_OWNER: 'your-username',           // 替换为您的 GitHub 用户名
  REPO_NAME: 'ikfast-online-generator',  // 替换为您的仓库名称
  // ... 其他配置保持不变
};
```

#### 3. 启用 GitHub Pages

1. 进入仓库的 **Settings** → **Pages**
2. 在 **Source** 下选择：
   - Branch: `main`
   - Folder: **`/docs`** ⚠️ 必须选择 `/docs`（GitHub Pages 只支持 / 或 /docs）
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
https://your-username.github.io/ikfast-online-generator/
```

## 📘 使用指南

### 步骤 1: 认证

1. 在页面顶部输入您的 GitHub Personal Access Token
2. 点击 **验证** 按钮
3. 验证成功后，Token 将保存在当前会话中

### 步骤 2: 上传 URDF 文件

1. 点击 **选择文件** 按钮
2. 选择您的机器人 URDF 文件（必须是 `.urdf` 扩展名，≤10MB）
3. 点击 **上传** 按钮
4. 系统将自动验证文件并上传到 GitHub 仓库

### 步骤 3: 查看链接信息

1. 上传成功后，系统自动触发链接信息提取
2. 等待几秒钟，链接信息表格将显示：
   - **Index**: 链接索引
   - **Name**: 链接名称
   - **Parent**: 父链接
3. 根链接（无父节点）和叶链接（无子节点）会被高亮显示
4. 点击表格行可自动填充链接索引

### 步骤 4: 配置参数

1. **Base Link Index**: 输入运动链的基座链接索引
2. **End Effector Link Index**: 输入末端执行器链接索引
3. **IK Type**: 选择求解器类型（默认为 `transform6d`）
   - `transform6d`: 完整的 6D 位置和姿态
   - `translation3d`: 仅 3D 位置
   - 其他类型请参考工具提示

### 步骤 5: 生成求解器

1. 点击 **生成 IKFast 求解器** 按钮
2. 系统将触发 GitHub Actions 工作流
3. 实时查看执行状态和日志输出
4. 生成过程通常需要 5-15 分钟

### 步骤 6: 下载结果

1. 工作流完成后，下载按钮将变为可用
2. 下载 **ikfast_solver.cpp** - 生成的求解器代码
3. 下载 **build.log** - 完整的构建日志
4. 将求解器代码集成到您的 MoveIt 配置中

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
- 检查 Token 是否正确复制
- 确认 Token 具有 `repo` 和 `workflow` 权限
- 重新生成新的 Token

#### ❌ 上传失败：403 Forbidden

**原因**: 权限不足或 API 速率限制

**解决方案**:
- 确认 Token 具有仓库写入权限
- 等待几分钟后重试（可能是速率限制）
- 检查仓库配置是否正确

#### ❌ 链接信息提取失败

**原因**: URDF 文件格式错误或缺少 mesh 文件

**解决方案**:
- 验证 URDF 文件语法是否正确
- 确保所有引用的 mesh 文件路径正确
- 查看日志中的详细错误信息

#### ❌ IKFast 生成失败

**原因**: 运动链不满足 IKFast 要求

**解决方案**:
- 检查选择的链接索引是否正确
- 确认运动链是串联结构（IKFast 不支持并联机构）
- 尝试不同的 `iktype` 选项
- 查看构建日志中的详细错误

#### ❌ 工作流超时

**原因**: 生成过程超过 30 分钟

**解决方案**:
- 简化机器人模型
- 检查 URDF 文件是否过于复杂
- 联系维护者报告问题

#### ❌ 下载失败：Artifact 未找到

**原因**: 工作流未成功完成或 Artifact 已过期

**解决方案**:
- 检查工作流状态是否为 "completed"
- Artifact 保留期为 7 天，过期后需重新生成
- 查看工作流日志确认是否有错误

### 调试技巧

1. **查看详细日志**: 日志查看器显示完整的执行过程
2. **检查 GitHub Actions**: 访问仓库的 Actions 标签查看工作流运行详情
3. **验证 URDF**: 使用 `check_urdf` 工具本地验证 URDF 文件
4. **测试示例文件**: 使用 `examples/` 目录中的示例 URDF 测试系统

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
# 启动本地服务器（需要安装 http-server 或类似工具）
npx http-server docs -p 8080

# 访问 http://localhost:8080
```

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

### 代码规范

- 使用 ES6+ 语法
- 遵循现有代码风格
- 添加适当的注释
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

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [OpenRAVE](http://openrave.org/) - 机器人自动化虚拟环境
- [IKFast](http://openrave.org/docs/latest_stable/openravepy/ikfast/) - 快速逆运动学求解器生成器
- [MoveIt](https://moveit.ros.org/) - ROS 运动规划框架
- [fishros2/openrave](https://hub.docker.com/r/fishros2/openrave) - OpenRAVE Docker 镜像

## 📞 支持

如有问题或需要帮助：
- 📧 提交 [Issue](https://github.com/your-username/ikfast-online-generator/issues)
- 💬 参与 [Discussions](https://github.com/your-username/ikfast-online-generator/discussions)
- 📖 查看 [Wiki](https://github.com/your-username/ikfast-online-generator/wiki)

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！
