# 第十三届中国教育创新年会官网预览版：前端交接文档

> 交接日期：2026-08-28
> 项目状态：所有改动均已提交并推送到 GitHub Pages，本地与线上版本一致（HEAD：`6d10e55`）
> 交接目标：在保留现有功能和交互的前提下，继续调整前端视觉与内容表述

## 1. 先看这里

- 项目目录：`/Users/lear/Projects/年会/官网预览`
- 页面入口：`index.html`
- 本地预览：`http://127.0.0.1:4174/`
- GitHub 仓库：`https://github.com/Leariceleto/eicc-2026-preview`（main 分支，已启用 GitHub Pages）
- 线上地址：`https://leariceleto.github.io/eicc-2026-preview/`
- 演示状态控制器：任意部署环境 URL 后加 `?demo=1` 即可打开，如 `http://127.0.0.1:4174/?demo=1`

本项目没有构建步骤，是单文件静态页面：CSS、HTML、JavaScript 全部内联在 `index.html` 中（约 1970 行）。不要主动更换框架、拆目录或引入依赖。

## 2. Git 状态

- 当前 HEAD：`6d10e55`，与 `origin/main` 一致，工作区干净
- 提交规范：改动经 Lear 确认后再 `git push`。**未经 Lear 确认，不要 push、发布、删除文件或清理工作区**
- 操作 git 前必须先 `cd /Users/lear/Projects/年会/官网预览`，shell 工作目录漂移会导致 `not a repository` 报错
- 以下临时文件不属于网站资产，不要提交：`.tmp-about-desktop.png`、`.tmp-about-mobile.png`、`.tmp-about-ppt-style.png`、`.tmp-ppt-audit.GfuPJt/`
- 仓库根目录的 `README.md` 是 2026-08-25 的旧交接，内容已过时，以本文档为准

## 3. 本地运行

如果 4174 端口已有服务，直接打开预览地址。如果需要重新启动：

```bash
cd /Users/lear/Projects/年会/官网预览
python3 -m http.server 4174
```

注意：本机 4173 端口曾用于另一个预报名页面目录，不要用 4173 判断这个项目。本地服务器有时会意外掉线，报「元素查不到」时先用 `eval location.href` 确认浏览器没有落在错误页。

## 4. 当前页面结构

单页锚点结构，板块按页面顺序：

1. 导航与 Hero
2. `#about`：大会概况（前言两段文字 + 右侧视频窗口 555×312 + 影响力数据 + 历届年会回顾图）
3. `#tickets`：四类参会方式与票种权益
4. `#agenda`：多日期议程 Tab
5. `#guests`：嘉宾（当前隐藏，见第 9 节）
6. `#deep`：深研课
7. `#expo`：方案展（位于深研课之后、学习地图之前，这是 Lear 指定的顺序）
8. `#map`：学习地图状态切换
9. `#passport`：学习护照
10. `#account`：个人中心（独立「页」，通过 hash 路由切换显示）
11. `.history`：历届回顾文字与 16:9 视频位
12. Footer

顶部导航锚点顺序与上述一致：大会概况、票种权益、大会议程、深研课、方案展、学习地图、学习护照 + 个人中心/立即报名按钮。手机端（≤760px）个人中心和立即报名按钮缩小保留，内容导航收进右侧下拉面板（汉堡按钮触发，宽 200px，不锁主页面滚动）。

导航锚点、板块顺序和已有交互方式默认不要改。当前任务是继续调整文字表述和视觉，不是重新设计信息架构。

## 5. 最近完成的重要改动（commit 倒序）

- `6d10e55` 大会概况：删除供应商段落（微软、苹果等），剩余文字放大重排，视频窗口加大
- `a670ef7` 报名弹窗第一步顶部空白修复（弹窗内 `<section>` 继承全局 96px padding 所致，已加 `.signup-body section{padding:0}` 覆写）
- `f298ade` 报名弹窗第一步新增「报名须知」卡片：现场参会 6 条、线上参会 5 条，随所选场次切换（`data-signup-notes`）
- `c729cbc` 报名弹窗「返回/上一步」按钮文字隐形修复（`.btn-ghost` 米白文字复用到浅色弹窗导致，已覆写为白底深色字）
- `0d7f7d3` 方案展板块移至深研课之后、学习地图之前，导航与手机菜单同步
- `2f3b1e2` + `d87a986` 学习护照手机样机比例改为 iPhone 17 Pro Max（`aspect-ratio:1320/2868`），屏内演示内容等比缩小且完整呈现
- `cdbe4e9` 删除深研课 RULE 01-03 规则卡片区（PC/手机端）
- `5e47087` + `5fea024` 手机端深度适配：右侧窄面板下拉菜单、删除「下一站·第十三届」金色条和议程底部提示条、导航 logo 改用金色字图片 `assets/brand-title-gold.png`

## 6. 四类票种与文字口径

顺序必须保持：

1. 主论坛：¥2800/人
2. 主论坛＋深研课：¥2900/人
3. 线上参会：¥1560/人
4. 独立方案展：¥300/人

标题中不要加「票」字。

线上参会权益当前口径：

1. `1 个学习账号，进入蒲公英教育智库一体化平台可同步观看会议内容`
2. `第十三届中国教育创新年会主论坛直播及回看、各分论坛及场外深研课分享内容录播及回看；回看截止至 2027 年 12 月 4 日`
3. `团队报名：满 10 人赠 1 人，满 20 人享 8 折，满 50 人享 7 折`

票种卡片的 `data-ticket-card`、报名入口的 `data-open-registration`、JavaScript 中的 `sessions` 和演示状态的 `identity` 必须保持一一对应：`main`、`combo`、`online`、`expo`。

## 7. 「立即报名」弹窗

- HTML：`.signup-layer`
- CSS：`.signup-*` 系列
- JavaScript：`// Registration flow adapted from the reference annual-meeting journey.` 附近

四步演示流程：选择场次 → 填写参会人信息 → 支付方式与发票 → 报名成功。

已包含：四种场次、第一步「报名须知」卡片（随场次切换现场/线上两版）、必填项校验、电子发票字段、支付方式选择、成功页、返回/上一步/关闭/Esc 关闭。

这是演示交互，没有后端、支付、登录或真实订单。可以改视觉和文字，但不要随意改动 `data-signup-*` 属性；JavaScript 依赖这些选择器。

## 8. 演示状态控制器

正常地址**看不到**控制器，这是设计行为，不是部署丢失。只有 URL 带 `?demo=1` 才启用（入口代码：`if(params.get('demo') !== '1') return;`，从 `// Demo state controller` 注释开始）。正式部署后同事验收演示系统，直接在正式域名后加 `?demo=1` 即可。

控制器模拟的是整页状态，不是一个独立内容区：

- 年会周期：报名期、会前准备、会议进行、会后
- 用户身份：未登录、已登录未报名、主论坛、主论坛＋深研课、独立方案展、线上参会
- 用户状态：已选深研课、已完成自评、已签到

完整状态会写回 URL，例如：

```text
http://127.0.0.1:4174/?demo=1&phase=prep&identity=combo&course=1&assessment=1
```

调整页面文案和按钮时，要同时检查普通模式和 `?demo=1` 模式。约 30 个 `data-state-*` 钩子由控制器驱动，不可随意删改。

## 9. 当前隐藏/占位内容

- **嘉宾板块 `#guests`**：已通过 `style="display:none"` + `data-force-hidden` 隐藏（hash 路由切换时会批量重设 `[data-page]` 的 inline style，`data-force-hidden` 让它豁免。删除这个属性会导致嘉宾板块「复活」）。待后续恢复上线
- **历届回顾视频位 `.history`**：16:9 窗口已预留，当前无视频源，显示「视频素材待接入」。接入 MP4 时填 `data-video-src` 属性即可，不要改窗口宽高比实现方式（必须保持 16:9 随宽度缩放）
- **大会概况右侧视频窗口**：同样待接真实视频源

## 10. 已删除且不要擅自恢复的内容

- 顶部「预览版」黑色提示条（手机端本轮已删）
- 「下一站·第十三届」金色延续条（`.annual-next`）
- 议程区底部提示条（`.agenda-hint`）
- 深研课 RULE 01-03 规则卡片区
- 票种区域下方「门禁对照」条
- 把 13 个状态标签直接做成页面内容区的方案（13 个标签只属于 `?demo=1` 演示控制器）
- 大会概况中的供应商段落（微软、苹果等合作伙伴文字）

## 11. 修改时容易踩坑的地方

1. **CSS 级联顺序**：手机端媒体查询块（`@media(max-width:760px)`）必须放在所有基础样式之后（目前在 `</style>` 前）。新增手机样式请追加到该块内，不要插到中间——同特异性下后定义者胜，插错位置会被基础样式覆盖。
2. **`:last-child` 陷阱**：给容器加新尾元素后，旧的 `:last-child` 负 margin 会错杀新元素。导航报名按钮的负 margin 已改用属性选择器 `.nav-cta[data-open-registration]`，新增导航元素时注意检查。
3. **语义色组件复用**：`.btn-ghost` 的米白文字是为深色 Hero 设计的，复用到浅色背景（如报名弹窗）时必须覆写 `color`，否则文字隐形。
4. **全局 `section{padding:96px 0}` 污染**：弹窗步骤等内嵌结构如果用 `<section>` 标签会意外继承 96px padding，已有 `.signup-body section{padding:0}` 覆写，新增类似结构注意同样处理。
5. **hash 路由清 inline style**：路由切换会对所有 `[data-page]` 执行 `style.display=''` 或 `none`，手动隐藏的元素必须加 `data-force-hidden` 豁免。
6. `.feature-item` 不只属于 About，个人中心仍在复用，不要因改 About 删除它。
7. `data-state-*`、`data-demo-*`、`data-signup-*`、`data-ticket-card`、`data-open-registration`、`data-nav-burger`、`data-mobile-menu` 都是 JavaScript 钩子，改类名可以，改这些属性前必须同步修改脚本。
8. 历届回顾历程图上覆盖 12 个透明热区（`.annual-year-link`，2014-2025），`--x`/`--hit-y`/`--hit-w`/`--hit-h` 是相对原图的坐标。换图、裁切或改留白后必须重新校准，且不要给图片加 `object-fit: cover`。用户明确要求热区不要显示悬停/点击的蓝色圆圈。
9. 学习护照样机内容以 `scrollHeight ≤ clientHeight` 为准验证是否溢出屏内，不要靠目测。
10. 页面全部内联，改动前先搜索全文件，避免误删共享样式。
11. **浏览器验证注意**：hash 跳转不会重新请求 HTML，浏览器可能返回缓存的旧 DOM——验证时给 URL 加时间戳参数（如 `?nc=20260828`）强刷。模拟视口里 `window.scrollTo/scrollY` 不可靠（恒为 0）。
12. 这是公开 GitHub 仓库，不要提交内部未官宣信息、账号、密钥或敏感价格策略。
13. 未经 Lear 确认，不要 `git push`、发布、删除文件或清理工作区。

## 12. 最小验收清单

完成修改后至少检查：

- 普通首页和 `?demo=1` 都能正常打开
- 桌面端（≥1280px）和手机端（390px、320px）都无横向溢出
- 手机端：汉堡按钮 → 右侧下拉面板展开/收起正常，主页面滚动不受面板影响
- 桌面端导航间距与改前一致（报名按钮负 margin 修正生效，`regRight` 约 1243）
- 导航锚点仍可用，板块顺序：深研课 → 方案展 → 学习地图
- About 会场背景图和历程图都加载成功
- 12 个年会图标、地点和年份均跳转到各自链接，热区无蓝色圆圈
- 四类票种顺序、价格和线上权益文字正确
- 从四张票卡进入报名弹窗时，默认选中对应场次；报名须知卡片随场次切换
- 报名四步流程、返回/上一步按钮文字可见、校验和成功页正常
- 议程 Tab、学习地图切换正常
- 学习护照样机内容完整呈现于屏内（无溢出裁切）
- 视频框保持 16:9
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

请先在本地完成修改并提供预览地址或截图，让 Lear 确认。**确认后才可提交和推送到 GitHub Pages。**

交付时说明：

- 改了哪些区域
- 改动了哪些文件
- 哪些交互已经实际测试
- 哪些内容仍是占位或演示数据
- 是否存在需要 Lear 决策的视觉取舍
