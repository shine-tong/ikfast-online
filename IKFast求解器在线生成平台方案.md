# IKFast 逆运动学求解器在线生成平台方案

> **定位声明**：本项目一个**可长期运行、可扩展、可真实投入使用的工程系统**。
>
> 目标是构建一个：
> - 面向真实用户
> - 通过 Web 页面完成 IKFast 求解器生成
> - 完整保留 OpenRAVE / IKFast 原生命令输出
> - 生成的 cpp 文件可直接用于 MoveIt 求解器插件生成的在线平台

---
# Kiro 生成需求文档必须遵守的事项
- 编写代码之前必须**仔细阅读**本项目所依赖的同级目录下的**Moveit配置IKfast运动学插件.md**文档
- 结合博客教程和下面的方案内容来实现本项目
- 如果下面方案中后前后端部分缺少相应的步骤，请严格参考博客教程完善项目的**需求文档**
- 代码所需的github空仓库地址：https://github.com/shine-tong/ikfast-online

## 1. 项目目标与工程约束

### 1.1 核心目标

- 用户通过网页上传 URDF 文件
- 后端自动生成 **IKFast C++ Solver**
- 用户可下载：
  - `ikfast_solver.cpp`
- 每一次生成过程 **可追溯、可复现、可调试**

### 1.2 工程约束

| 项目 | 约束 |
|----|----|
| 环境 | 不需要用户本地安装 ROS / OpenRAVE |
| 后端 | 不自建服务器 |
| 运行 | 使用提供的 [Docker 环境](https://hub.docker.com/r/fishros2/openrave) |
| 安全 | 不执行用户任意代码 |
| 成本 | 零服务器成本（GitHub 免费能力） |

---

## 2. 总体架构设计

```
┌────────────┐
│ Web Front  │  GitHub Pages
└─────┬──────┘
      │ REST API
┌─────▼──────┐
│ GitHub API │  文件上传 / Workflow Dispatch
└─────┬──────┘
      │
┌─────▼──────────────┐
│ GitHub Actions     │
│  - Job Scheduler   │
│  - Artifact Store  │
└─────┬──────────────┘
      │ Docker
┌─────▼────────────────────────┐
│ fishros2/openrave             │
│  - ROS1                       │
│  - OpenRAVE                   │
│  - IKFast                     │
└──────────────────────────────┘
```

**关键设计决策**：
- 前端仅负责交互与状态展示
- 后端计算完全交由 GitHub Actions
- 所有可执行逻辑在 Docker 内完成

---

## 3. GitHub 仓库结构

```
ikfast-online/
├── web/                     # 前端（GitHub Pages）
│   ├── index.html
│   ├── main.js
│   └── style.css
│
├── jobs/
│   └── current/
│       └── robot.urdf
│
├── outputs/
│   └── ikfast_solver.cpp
│
├── .github/
│   └── workflows/
│       └── ikfast.yml
│
└── README.md
```

---

## 4. Web 前端设计

### 4.1 功能模块划分

1. URDF 上传
2. 获取 DAE 链接信息并展示
3. IKFast 参数输入
4. 任务触发
5. 任务状态轮询
6. 日志展示
7. 结果下载

---

### 4.2 页面交互流程

```
用户上传 URDF
      ↓
网页提交至 GitHub
      ↓
触发 GitHub Actions
      ↓
Actions 运行 Docker
      ↓
获取 DAE 链接信息并展示
      ↓
生成 solver + log
      ↓
网页轮询状态
      ↓
展示日志 + 下载
```

---

### 4.3 前端接口定义（可能需要完善，请检查）

#### 4.3.1 上传 URDF

- GitHub API: `PUT /repos/{owner}/{repo}/contents/jobs/current/robot.urdf`
- Content-Type: `application/json`

```json
{
  "message": "upload urdf",
  "content": "BASE64_URDF"
}
```

---

#### 4.3.2 触发 IKFast 任务

- API: `POST /repos/{owner}/{repo}/actions/workflows/ikfast.yml/dispatches`

```json
{
  "ref": "main",
  "inputs": {
    "base_link": "0",
    "ee_link": "6",
    "iktype": "transform6d"
  }
}
```

---

#### 4.3.3 查询任务状态

- API: `GET /repos/{owner}/{repo}/actions/runs`
- 根据 `workflow_dispatch` 时间戳匹配

---

## 5. GitHub Actions 实现（可能需要完善，请检查）

### 5.1 Workflow 触发器

```yaml
on:
  workflow_dispatch:
    inputs:
      base_link:
        required: true
      ee_link:
        required: true
      iktype:
        required: true
```

---

### 5.2 IKFast 执行 Job

```yaml
jobs:
  ikfast:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Run IKFast in Docker
      run: |
        mkdir -p outputs
        sudo docker run --rm \
          -v ${GITHUB_WORKSPACE}:/ws \
          -w /ws \
          fishros2/openrave bash -c "
            set -e
            {
              echo 'STEP 1: URDF → Collada'
              rosrun collada_urdf urdf_to_collada jobs/current/robot.urdf robot.dae

              echo 'STEP 2: List Links Info'
              openrave-robot.py robot.dae --info links

              echo 'STEP 3: IKFast Generate'
              python `openrave-config --python-dir`/openravepy/_openravepy_/ikfast.py \
                --robot=robot.dae \
                --iktype=${{ inputs.iktype }} \
                --baselink=${{ inputs.base_link }} \
                --eelink=${{ inputs.ee_link }} \
                --savefile=outputs/ikfast_solver.cpp

              echo 'DONE'
            } 2>&1 | tee outputs/build.log
          "

    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ikfast-result
        path: outputs/
```

---

## 6. 日志系统设计

### 6.1 日志原则

- 日志 = 真正的终端输出
- 不裁剪、不伪造、不摘要
- 每一步有明确 STEP 标识

### 6.2 日志示例

```
STEP 1: URDF → Collada
[INFO] Parsing URDF...
STEP 2: Round Collada
STEP 3: IKFast Generate
IKFast version 61
Found 6 joints
Generating solver...
DONE
```

---

## 7. 前端日志展示建议

```html
<pre id="log" class="terminal"></pre>
```

```css
.terminal {
  background: #0d1117;
  color: #c9d1d9;
  padding: 12px;
  height: 300px;
  overflow-y: auto;
  font-family: monospace;
}
```

---

## 8. 结果交付规范

| 文件 | 用途 |
|----|----|
| ikfast_solver.cpp | MoveIt IK 插件核心 |

---

## 9. 失败处理策略

- URDF 解析失败 → 日志返回错误
- IKFast 无解 → 日志明确说明
- 超时 → Actions 自动终止

---

## 10. 安全与稳定性

- Docker 沙箱
- GitHub 执行权限控制
- 无 shell 注入入口
- 用户无法执行任意命令

---

## 11. 项目结论

本系统是一个：

- **工程可部署**
- **真实可用**
- **无需自建服务器**
- **面向工业机器人开发者**

的 IKFast 在线生成平台。