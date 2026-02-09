# GitHub Actions 工作流说明

本目录包含项目的 GitHub Actions 工作流配置文件。

## 📋 工作流列表

### 1. ikfast.yml - IKFast 求解器生成工作流

**触发方式**: 手动触发（workflow_dispatch）

**功能**: 
- 处理用户上传的 URDF 文件
- 生成 IKFast 逆运动学求解器
- 提供两种模式：
  - `info`: 提取机器人链接信息
  - `generate`: 生成 IKFast 求解器代码

**输入参数**:
- `mode`: 执行模式（info 或 generate）
- `base_link`: 基座链接索引（generate 模式必需）
- `ee_link`: 末端执行器链接索引（generate 模式必需）
- `iktype`: IKFast 求解器类型（默认: transform6d）

**输出产物**:
- `ikfast-result`: 包含生成的求解器代码和日志的 ZIP 文件
- 保留期: 7 天

---

### 2. update-config-on-merge.yml - 自动更新配置工作流

**触发方式**: 当 Pull Request 合并到 master 分支时自动触发

**功能**:
- 自动将 `docs/js/config.js` 中的 `REPO_BRANCH` 从 `'dev'` 更新为 `'master'`
- 确保 GitHub Pages 部署使用正确的分支配置

**工作原理**:

1. **触发条件**: 
   - PR 必须是合并到 `master` 分支
   - PR 状态必须是 `merged`（而不是 `closed`）

2. **执行步骤**:
   - 检出 master 分支的最新代码
   - 使用 `sed` 命令替换 config.js 中的 REPO_BRANCH 值
   - 检查是否有实际更改
   - 如果有更改，自动提交并推送到 master 分支

3. **提交信息**: `chore: Update REPO_BRANCH to 'master' after merge`

**使用场景**:

当你使用 Pull Request 将 dev 分支合并到 master 时：

```bash
# 1. 在 GitHub 上创建 PR: dev → master
# 2. 审查并合并 PR
# 3. 工作流自动运行，更新 config.js
# 4. 无需手动修改配置文件
```

**注意事项**:

- ✅ 工作流使用 `GITHUB_TOKEN`，无需额外配置
- ✅ 只在实际需要更改时才会提交
- ✅ 提交者显示为 `github-actions[bot]`
- ⚠️ 如果 config.js 已经是 `'master'`，工作流会跳过提交

---

## 🔧 工作流配置

### 权限要求

两个工作流都使用默认的 `GITHUB_TOKEN`，具有以下权限：
- `contents: write` - 读写仓库内容
- `actions: read` - 读取 Actions 信息

### 运行环境

- **操作系统**: Ubuntu 22.04 LTS
- **Docker 镜像**: fishros2/openrave:latest
- **超时限制**: 30 分钟（ikfast.yml）

---

## 📊 工作流状态查看

### 查看工作流运行历史

1. 访问仓库的 **Actions** 标签
2. 选择对应的工作流
3. 查看运行历史和日志

### 手动触发 IKFast 工作流

1. 进入 **Actions** → **IKFast Generator**
2. 点击 **Run workflow**
3. 选择分支并填写参数
4. 点击 **Run workflow** 按钮

---

## 🐛 故障排除

### update-config-on-merge.yml 未运行

**可能原因**:
1. PR 没有合并到 master 分支
2. PR 被关闭而不是合并
3. 工作流文件有语法错误

**解决方法**:
```bash
# 检查工作流文件语法
cat .github/workflows/update-config-on-merge.yml

# 查看 Actions 日志
# 访问 GitHub Actions 标签查看详细错误信息
```

### 工作流运行但没有提交更改

**可能原因**:
- config.js 中的 REPO_BRANCH 已经是 `'master'`
- 没有实际的更改需要提交

**验证方法**:
```bash
# 检查 config.js 当前的值
grep "REPO_BRANCH:" docs/js/config.js
```

### 权限错误

**错误信息**: `Permission denied` 或 `403 Forbidden`

**解决方法**:
1. 确保仓库的 Actions 权限已启用
2. 进入 **Settings** → **Actions** → **General**
3. 在 **Workflow permissions** 中选择 **Read and write permissions**
4. 保存设置

---

## 🔄 工作流更新

如需修改工作流配置：

1. 编辑对应的 `.yml` 文件
2. 提交并推送到仓库
3. 工作流会自动使用新配置

**测试工作流**:
```bash
# 使用 act 工具在本地测试（可选）
act pull_request -e .github/workflows/test-event.json
```

---

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [事件触发器](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)

---

## 💡 最佳实践

1. **定期检查工作流运行状态**
2. **保持工作流文件简洁明了**
3. **使用有意义的提交信息**
4. **在修改工作流前先在测试分支验证**
5. **及时清理过期的 Artifacts**

---

**最后更新**: 2024-12
