# 第十三届中国教育创新年会官网预览版：Kimi 前端交接

> 交接日期：2026-08-27  
> 项目状态：本地预览可用，当前修改尚未提交或发布  
> 交接目标：在保留现有功能和交互的前提下，继续调整前端视觉与内容

## 1. 先看这里

- 项目目录：`/Users/lear/Projects/年会/官网预览`
- 页面入口：`index.html`
- 本地预览：`http://127.0.0.1:4174/`
- 关于我们：`http://127.0.0.1:4174/#about`
- 演示状态控制器：`http://127.0.0.1:4174/?demo=1`
- GitHub 仓库：`https://github.com/Leariceleto/eicc-2026-preview`
- GitHub Pages：`https://leariceleto.github.io/eicc-2026-preview/`

当前正确版本以本地文件为准。GitHub Pages 尚未包含这轮未提交修改，不要从线上版本反向覆盖本地文件。

本项目没有构建步骤，是单文件静态页面：CSS、HTML、JavaScript 都在 `index.html` 中。不要主动更换框架、拆目录或引入依赖。

## 2. 当前文件状态

当前 Git HEAD：`a979039 添加交接文档（README）`。

此提交之后的页面改动都还在工作区中：

- `index.html`：当前页面全部样式、结构和交互
- `assets/annual-history.jpg`：2014-2025 年历届年会历程图
- `assets/about-preface-bg.jpg`：招商 PPT 第 2 页提取的会场全景图

以下是本轮检查产生的临时文件，不属于网站资产，不要提交：

- `.tmp-about-desktop.png`
- `.tmp-about-mobile.png`
- `.tmp-about-ppt-style.png`
- `.tmp-ppt-audit.GfuPJt/`

仓库里的 `README.md` 是 2026-08-25 的旧交接，包含三种票、旧 About 结构和旧端口等过期信息。继续开发请以本文档和当前 `index.html` 为准。

## 3. 本地运行

如果 4174 端口已有服务，直接打开预览地址。如果需要重新启动：

```bash
cd /Users/lear/Projects/年会/官网预览
python3 -m http.server 4174 --bind 127.0.0.1
```

不要使用 4173 端口判断这个项目。当前机器上的 4173 曾用于另一个预报名页面目录。

## 4. 当前页面结构

页面是单页锚点结构，主要板块按顺序为：

1. 顶部预览提示、导航与 Hero
2. `#about`：PPT 风格前言、影响力数据、历届年会回顾图
3. `#tickets`：四类参会方式与票种权益
4. `#agenda`：多日期议程 Tab
5. `#guests`：嘉宾
6. `#deep`：深研课
7. `#map`：学习地图状态切换
8. `#passport`：学习护照
9. `#expo`：方案展
10. `#account`：个人中心与参会服务
11. `.history`：历届回顾文字与 16:9 视频位
12. Footer

导航锚点、板块顺序和已有交互方式默认不要改。用户当前要的是视觉继续调整，不是重新设计信息架构。

## 5. 最新完成的 About 区域

位置：

- CSS：`index.html` 中 `/* ===== About ===== */`，约第 129 行开始
- HTML：`<section id="about">`，约第 801 行开始

视觉和内容依据：`/Users/lear/年会/招商/2026中国教育创新年会招商方案.pptx` 第 2 页。

当前结构：

- 会场全景图作背景
- 深蓝黑遮罩
- 左侧“前言”线框
- 右侧三段 PPT 原文
- 底部三项金色数据：`12届`、`5,000+`、`200万+`
- 下方继续保留“历届年会回顾”流程图

桌面端和 390px 手机端都已检查，没有横向溢出。`#about` 设置了 `scroll-margin-top:96px`，用于避免锚点进入时被顶部导航遮挡。

### 历届年会图交互

历程图上覆盖了 12 个透明链接，对应 2014-2025 年的微信回顾文章：

- 点击图标可跳转
- 点击图标下方的地点和年份也可跳转
- 新窗口打开
- 用户明确要求不要显示鼠标悬停或点击后的蓝色圆圈

相关类名：`.annual-year-link`。

每个链接的 `--x`、`--hit-y`、`--hit-w`、`--hit-h` 是相对于原图的热区坐标。如果更换图片、裁切图片或改变图片内部留白，必须重新校准这些值。不要给图片加 `object-fit: cover`。

`#about` 末尾的 `.state-surface` 是演示控制器使用的状态内容，正常模式隐藏，`?demo=1` 时显示。调整 About 时不要删除。

## 6. 四类票种与文字口径

顺序必须保持：

1. 主论坛：¥2800/人
2. 主论坛＋深研课：¥2900/人
3. 线上参会：¥1560/人
4. 独立方案展：¥300/人

标题中不要加“票”字。

线上参会权益当前口径：

1. `1 个学习账号，进入蒲公英教育智库一体化平台可同步观看会议内容`
2. `第十三届中国教育创新年会主论坛直播及回看、各分论坛及场外深研课分享内容录播及回看；回看截止至 2027 年 12 月 4 日`
3. `团队报名：满 10 人赠 1人，满 20 人享 8 折，满 50 人享 7 折`

票种卡片的 `data-ticket-card`、报名入口的 `data-open-registration`、JavaScript 中的 `sessions` 和演示状态的 `identity` 必须保持一一对应：`main`、`combo`、`online`、`expo`。

## 7. “立即报名”弹窗

位置：

- HTML：`.signup-layer`，约第 630 行开始
- CSS：`.signup-*`，约第 400 行开始
- JavaScript：`// Registration flow adapted from the reference annual-meeting journey.`，约第 1648 行开始

目前是四步演示流程：

1. 选择场次
2. 填写参会人信息
3. 支付方式与发票
4. 报名成功

已包含：

- 四种场次
- 必填项校验
- 电子发票字段
- 支付方式选择
- 成功页
- 返回、上一步、关闭、Esc 关闭

第一步左下按钮已经按用户要求改成“返回”。

这是演示交互，没有后端、支付、登录或真实订单。可以改视觉，但不要随意改动 `data-signup-*` 属性；JavaScript 依赖这些选择器。

## 8. 演示状态控制器

正常地址不显示控制器。只有 URL 带 `?demo=1` 才启用。

控制器模拟的是整页状态，不是一个独立内容区：

- 年会周期：报名期、会前准备、会议进行、会后
- 用户身份：未登录、已登录未报名、主论坛、主论坛＋深研课、独立方案展、线上参会
- 用户状态：已选深研课、已完成自评、已签到

完整状态会写回 URL，例如：

```text
http://127.0.0.1:4174/?demo=1&phase=prep&identity=combo&course=1&assessment=1
```

调整页面文案和按钮时，要同时检查普通模式和 `?demo=1` 模式。相关 JavaScript 从 `// Demo state controller` 开始。

## 9. 历届回顾视频位

页面底部 `.history` 板块右侧已经预设 16:9 视频窗口。当前没有视频源，显示“历届年会回顾视频 / 视频素材待接入”。

接入 MP4 时，只需要填写：

```html
<video
  class="history-video-player"
  controls
  preload="metadata"
  playsinline
  data-video-src="这里替换为 MP4 地址"
></video>
```

不要只改宽度。视频窗口必须继续保持 16:9，高度随宽度同步变化。

## 10. 已删除且不要擅自恢复的内容

- 顶部蓝色横向滚动栏
- 票种区域下方“门禁对照”条
- 把 13 个状态标签直接做成页面内容区的方案

13 个标签只属于 `?demo=1` 的演示控制器，用于切换整页用户状态。

## 11. 修改时容易踩坑的地方

1. `.feature-item` 不只属于 About，个人中心仍在复用。不要因修改 About 删除它。
2. `data-state-*`、`data-demo-*`、`data-signup-*` 都是 JavaScript 钩子，改类名可以，改这些属性前必须同步修改脚本。
3. 历届回顾的透明热区与图片坐标绑定，调整图片显示方式后必须逐项测试。
4. 页面使用内联 CSS 和内联 JavaScript。改动前先搜索全文件，避免误删共享样式。
5. 这是公开 GitHub 仓库，不要提交内部未官宣信息、账号、密钥或敏感价格策略。
6. 未经 Lear 确认，不要 `git push`、发布、删除文件或清理工作区。

## 12. 最小验收清单

完成修改后至少检查：

- 普通首页和 `?demo=1` 都能正常打开
- 导航锚点仍可用
- About 会场背景图和历程图都加载成功
- 12 个年会图标、地点和年份均跳转到各自链接
- 历程图热区没有蓝色圆圈
- 四类票种顺序、价格和线上权益文字正确
- 从四张票卡进入报名弹窗时，默认选中对应场次
- 报名四步流程、返回、上一步、校验和成功页正常
- 议程 Tab、学习地图切换正常
- 视频框保持 16:9
- 1440px 桌面端和 390px 手机端无横向溢出
- 浏览器控制台没有 JavaScript 错误

基础检查命令：

```bash
cd /Users/lear/Projects/年会/官网预览
git diff --check
node -e "const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const js=html.match(/<script>([\\s\\S]*?)<\\/script>/);new Function(js[1]);console.log('inline JavaScript: OK')"
curl -I http://127.0.0.1:4174/assets/about-preface-bg.jpg
curl -I http://127.0.0.1:4174/assets/annual-history.jpg
```

## 13. 交付方式

请先在本地完成修改并提供预览地址或截图，让 Lear 确认。确认后再决定是否提交和推送到 GitHub Pages。

交付时说明：

- 改了哪些区域
- 改动了哪些文件
- 哪些交互已经实际测试
- 哪些内容仍是占位或演示数据
- 是否存在需要 Lear 决策的视觉取舍
