# Example URDF Files

本目录包含示例 URDF 文件，用于测试 IKFast Online Generator 平台。

## 📁 文件列表

### 1. simple_arm.urdf

**描述**: 简单的 3 自由度机械臂

**规格**:
- **自由度**: 3 DOF
- **关节类型**: 3 个旋转关节 (Revolute)
- **链接数量**: 5 个链接（包括基座和末端执行器）
- **总长度**: 约 0.75 米
- **适用场景**: 学习和测试基础 IKFast 功能

**链接结构**:
```
base_link (索引 0)
  └─ joint1 (revolute, Z轴)
     └─ link1 (索引 1)
        └─ joint2 (revolute, Y轴)
           └─ link2 (索引 2)
              └─ joint3 (revolute, Y轴)
                 └─ link3 (索引 3)
                    └─ ee_joint (fixed)
                       └─ ee_link (索引 4)
```

**推荐配置**:
- **Base Link Index**: 0 (base_link)
- **End Effector Link Index**: 4 (ee_link)
- **IK Type**: `translation3d` 或 `transform6d`

**关节限制**:
- joint1: -180° 到 +180° (Z轴旋转)
- joint2: -90° 到 +90° (Y轴旋转)
- joint3: -90° 到 +90° (Y轴旋转)

---

### 2. 6dof_arm.urdf

**描述**: 6 自由度工业机械臂（类似 UR5/UR10）

**规格**:
- **自由度**: 6 DOF
- **关节类型**: 6 个旋转关节 (Revolute)
- **链接数量**: 8 个链接（包括基座和末端执行器）
- **总长度**: 约 1.0 米
- **适用场景**: 完整的 6D 位姿求解器生成

**链接结构**:
```
base_link (索引 0)
  └─ shoulder_pan_joint (revolute, Z轴)
     └─ shoulder_link (索引 1)
        └─ shoulder_lift_joint (revolute, Y轴)
           └─ upper_arm_link (索引 2)
              └─ elbow_joint (revolute, Y轴)
                 └─ forearm_link (索引 3)
                    └─ wrist_1_joint (revolute, Y轴)
                       └─ wrist_1_link (索引 4)
                          └─ wrist_2_joint (revolute, Z轴)
                             └─ wrist_2_link (索引 5)
                                └─ wrist_3_joint (revolute, Z轴)
                                   └─ wrist_3_link (索引 6)
                                      └─ ee_joint (fixed)
                                         └─ ee_link (索引 7)
```

**推荐配置**:
- **Base Link Index**: 0 (base_link)
- **End Effector Link Index**: 7 (ee_link)
- **IK Type**: `transform6d` (推荐)

**关节限制**:
- shoulder_pan_joint: -180° 到 +180° (Z轴)
- shoulder_lift_joint: -90° 到 +90° (Y轴)
- elbow_joint: -135° 到 +135° (Y轴)
- wrist_1_joint: -180° 到 +180° (Y轴)
- wrist_2_joint: -180° 到 +180° (Z轴)
- wrist_3_joint: -180° 到 +180° (Z轴)

**特点**:
- 球形手腕配置（最后 3 个关节轴交于一点）
- 适合生成高效的解析解
- 典型的工业机器人结构

---

## 🚀 使用方法

### 方法 1: 直接上传

1. 访问 IKFast Online Generator 网页
2. 点击"选择文件"按钮
3. 选择本目录中的 URDF 文件
4. 按照提示完成配置和生成

### 方法 2: 从 GitHub 下载

如果您已经部署了平台，可以直接从仓库下载：

```bash
# 下载 simple_arm.urdf
curl -O https://raw.githubusercontent.com/your-username/ikfast-online-generator/main/examples/simple_arm.urdf

# 下载 6dof_arm.urdf
curl -O https://raw.githubusercontent.com/your-username/ikfast-online-generator/main/examples/6dof_arm.urdf
```

### 方法 3: 克隆仓库

```bash
git clone https://github.com/your-username/ikfast-online-generator.git
cd ikfast-online-generator/examples
```

---

## 📊 IKFast 类型选择指南

根据您的机器人配置选择合适的 IK 类型：

| IK Type | 描述 | 适用场景 | 示例机器人 |
|---------|------|----------|------------|
| `transform6d` | 完整 6D 位姿 (位置+姿态) | 6 DOF 机械臂 | 6dof_arm |
| `translation3d` | 仅 3D 位置 | 3 DOF 机械臂，无姿态要求 | simple_arm |
| `direction3d` | 方向向量 | 需要指向特定方向 | 相机云台 |
| `ray4d` | 射线 (原点+方向) | 激光指向、视线跟踪 | - |
| `lookat3d` | 注视点 | 相机、传感器对准 | - |
| `translationdirection5d` | 位置+方向 | 5 DOF 机械臂 | - |
| `translationxy5d` | XY平面位置+姿态 | 平面移动机器人 | - |

---

## ⚠️ 注意事项

### URDF 文件要求

1. **文件大小**: ≤ 10MB
2. **格式**: 有效的 XML 格式
3. **扩展名**: 必须是 `.urdf`
4. **链接结构**: 必须是串联结构（树形，无闭环）
5. **关节类型**: IKFast 主要支持 revolute 和 prismatic 关节

### 常见问题

#### ❌ "运动链不满足 IKFast 要求"

**原因**: 
- 选择的链接不构成有效的串联运动链
- 运动链包含固定关节或不支持的关节类型
- 自由度不足或过多

**解决方案**:
- 确认 base_link 和 ee_link 之间是连续的父子关系
- 检查运动链中的关节类型
- 尝试选择不同的链接组合

#### ❌ "Collada 转换失败"

**原因**:
- URDF 文件格式错误
- 缺少必需的元素
- mesh 文件路径错误

**解决方案**:
- 使用 `check_urdf` 工具验证 URDF 文件
- 确保所有 mesh 引用使用相对路径或内嵌几何体
- 简化 URDF 文件，移除复杂的 mesh 引用

---

## 🔧 自定义 URDF 文件

如果您想创建自己的 URDF 文件，请遵循以下最佳实践：

### 1. 基本结构

```xml
<?xml version="1.0"?>
<robot name="my_robot">
  <!-- 定义链接 -->
  <link name="base_link">
    <visual>...</visual>
    <collision>...</collision>
    <inertial>...</inertial>
  </link>
  
  <!-- 定义关节 -->
  <joint name="joint1" type="revolute">
    <parent link="base_link"/>
    <child link="link1"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14" upper="3.14" effort="10" velocity="1"/>
  </joint>
  
  <!-- 更多链接和关节... -->
</robot>
```

### 2. 必需元素

- ✅ 每个 link 必须有唯一的 name
- ✅ 每个 joint 必须指定 parent 和 child
- ✅ revolute 和 prismatic 关节必须有 limit
- ✅ 关节必须指定 axis
- ✅ inertial 属性（质量和惯性矩阵）

### 3. 推荐做法

- 使用简单的几何体（box, cylinder, sphere）而非复杂 mesh
- 保持链接名称清晰易懂
- 为末端执行器添加固定关节连接的 ee_link
- 设置合理的关节限制
- 添加适当的 material 和 color 以便可视化

### 4. 避免的问题

- ❌ 闭环结构（并联机构）
- ❌ 过多的固定关节
- ❌ 缺少 inertial 属性
- ❌ 无效的 XML 语法
- ❌ 过大的文件（>10MB）

---

## 📚 参考资源

- [URDF 官方文档](http://wiki.ros.org/urdf)
- [URDF 教程](http://wiki.ros.org/urdf/Tutorials)
- [IKFast 文档](http://openrave.org/docs/latest_stable/openravepy/ikfast/)
- [MoveIt IKFast 教程](https://ros-planning.github.io/moveit_tutorials/doc/ikfast/ikfast_tutorial.html)

---

## 🤝 贡献示例

如果您有好的示例 URDF 文件，欢迎贡献！

1. Fork 仓库
2. 添加您的 URDF 文件到 `examples/` 目录
3. 更新本 README 文件，添加文件说明
4. 提交 Pull Request

**示例文件要求**:
- 文件大小 < 1MB
- 包含完整的链接和关节定义
- 经过测试，能够成功生成 IKFast 求解器
- 提供清晰的文档说明

---

✨ 祝您使用愉快！如有问题，请提交 [Issue](https://github.com/your-username/ikfast-online-generator/issues)。
