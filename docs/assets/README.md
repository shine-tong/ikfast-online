# 资源目录

本目录包含 IKFast Online Generator 集成 Graphite Creative Studio 模板的静态资源文件。

## 目录结构

```
assets/
├── images/          # 图片文件（Logo、图标、插图）
├── fonts/           # 自定义字体文件（如需要）
└── README.md        # 本文件
```

## 图片

将图片资源放置在 `images/` 目录中：
- Logo 文件
- 图标
- 背景图片
- 插图
- 其他视觉资源

推荐格式：
- SVG 用于 Logo 和图标（可缩放，文件小）
- PNG 用于需要透明度的图片
- JPG 用于照片
- WebP 用于现代浏览器（需提供降级方案）

## 字体

如果需要使用系统字体之外的自定义字体，请将它们放在 `fonts/` 目录中：
- WOFF2 格式（首选，压缩率最好）
- WOFF 格式（降级方案）
- TTF 格式（旧版浏览器支持）

当前主题默认使用系统字体：
- 主字体：'Poppins'（从 Google Fonts 或系统加载）
- 等宽字体：'Fira Code', 'Courier New', 'Consolas'

## 使用方法

在 HTML 文件中使用相对路径引用资源：

```html
<!-- 图片 -->
<img src="assets/images/logo.svg" alt="Logo">

<!-- CSS 背景图片 -->
background-image: url('../assets/images/background.jpg');

<!-- CSS 中的字体 -->
@font-face {
  font-family: 'CustomFont';
  src: url('../assets/fonts/custom-font.woff2') format('woff2');
}
```

## 优化建议

- 添加图片前先进行压缩
- 使用合适的图片尺寸
- 考虑对首屏以下的图片使用懒加载
- 对多个小图标使用 CSS 精灵图
- 使用 SVGO 优化 SVG 文件
