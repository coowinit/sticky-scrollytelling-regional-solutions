# Regional Solutions — Sticky Scrollytelling

一个面向企业官网场景设计的 **Sticky Scrollytelling（粘性滚动叙事）** 前端实验。

项目以「区域解决方案」为示例，在桌面端实现：

> **左侧内容自然滚动 + 右侧视觉区 Sticky 固定 + 图片交叉切换 + ScrollSpy 导航同步 + 点击导航平滑定位**

移动端则自动切换为更适合触屏阅读的纵向卡片布局，不强行保留桌面端 Sticky 交互。

当前版本：**v1.0.2**

---

## 项目特点

### Desktop

- 左侧多组内容保持正常文档流；
- 右侧图片区使用原生 `position: sticky` 固定；
- 当前章节变化时，对应图片 Crossfade 切换；
- 最右侧纵向导航自动同步高亮；
- 点击导航可平滑滚动到对应章节；
- Sticky 受当前模块边界限制，不会进入下一章节；
- 3D 按钮 Hover / Focus 时显示二维码；
- GSAP ScrollTrigger 负责当前项判断和轻量文字动画。

### Mobile

- 取消桌面端 Sticky 视觉区；
- 隐藏右侧 ScrollSpy 导航；
- 每组内容恢复为独立的「图片 + 文案」卡片；
- 保留 3D 按钮；
- 隐藏 Hover 二维码，避免触屏设备依赖悬停交互。

---

## 技术栈

| 技术 | 主要职责 |
|---|---|
| HTML5 | 内容结构与可维护数据 |
| CSS Grid | 桌面端左右双栏布局 |
| `position: sticky` | 固定右侧视觉区 |
| GSAP | 轻量滚动动画 |
| ScrollTrigger | 当前章节判断、`scrub` 文字动画 |
| IntersectionObserver | GSAP 不可用时的状态同步回退 |
| CSS Transition | 图片 Crossfade 与按钮微交互 |
| Responsive CSS | 桌面 / 移动端交互模式切换 |

项目没有引入 Swiper、Fancybox、Parallax 或复杂动画时间线，重点是保持代码简单、稳定和容易维护。

---

## 核心架构

```text
HTML
├─ Region 文案
├─ Region 图片
├─ View Solution 链接
├─ 3D 链接
└─ QR Code

CSS
├─ Grid 双栏
├─ Sticky
├─ Crossfade
└─ Responsive

JavaScript
├─ activeIndex
├─ ScrollTrigger
├─ 图片同步
├─ 自动生成导航
└─ 点击定位
```

这个项目的原则是：

> **内容尽量留在 HTML，CSS / JavaScript 长期保持稳定。**

---

## 为什么使用 CSS Sticky，而不是 GSAP Pin？

右侧视觉区最终由浏览器原生 Sticky 负责：

```css
.scrolly__pin {
  position: sticky;
  top: var(--pin-top);
}
```

主要原因：

1. **边界更自然**：Sticky 天然受 `.scrolly__aside` 父容器限制，最后一张图不会进入下一章节；
2. **导航点击更稳定**：跳转到第 1 项或最后一项时，右侧图片区不会因为 Pin 起止点发生上下跳动；
3. **职责更清楚**：CSS 负责布局与固定，GSAP 只负责动画与状态。

这种方案更适合真实企业网站长期维护。

---

## 目录结构

```text
sticky-scrollytelling-regional-solutions/
├─ index.html
├─ README.md
├─ css/
│  └─ style.css
├─ js/
│  └─ app.js
└─ images/
   ├─ region-north-america.svg
   ├─ region-europe.svg
   ├─ region-middle-east.svg
   ├─ region-southeast-asia.svg
   ├─ qr-fluted-wall-panel-veneer.png
   └─ vr720.png
```

### 文件职责

- `index.html`：维护 Region 文案、图片、链接和二维码；
- `css/style.css`：维护布局、Sticky、响应式和视觉样式；
- `js/app.js`：维护当前项、滚动同步和导航逻辑；
- `images/`：统一存放场景图、二维码和 3D 图标。

---

## 快速使用

这是一个纯静态前端项目，不需要 npm、构建工具或后端环境。

直接打开：

```text
index.html
```

即可预览。

也可以部署到 GitHub Pages、Netlify、Cloudflare Pages、普通虚拟主机，或整合到 WordPress 自定义模板中。

---

## 桌面端工作原理

### 1. 左侧内容正常滚动

每个章节都是独立的：

```html
<article class="story-item" data-story-item>
  ...
</article>
```

左侧不是轮播，也不使用固定定位，因此页面滚动保持浏览器原生行为。

### 2. 右侧图片保持 Sticky

```css
.scrolly__pin {
  position: sticky;
  top: var(--pin-top);
}
```

图片到达视觉固定位置后保持不动，直到 `.scrolly__aside` 到达底部边界。

### 3. 图片提前存在，不动态替换 `src`

JavaScript 初始化时会把每个 `.story-item` 中的媒体内容克隆到右侧视觉舞台。

切换时只改变：

```text
opacity
visibility
transform
```

这样可以避免重新加载图片和布局跳动。

### 4. 单一 `activeIndex`

当前章节统一由：

```js
activeIndex
```

管理。

`setActive(index)` 会同步更新：

```text
当前文字
+
当前图片
+
当前导航
```

不需要分别维护多套状态。

### 5. ScrollSpy 导航自动生成

右侧 indicator 不需要手工逐个编写。

JavaScript 会根据 `.story-item` 数量自动生成对应导航，并建立滚动与点击同步。

因此后期从 4 项增加到 5 项、6 项时，通常不需要修改导航 JavaScript。

---

## 首屏对齐与末屏边界

桌面端会动态读取第一组文字高度、右侧视觉区高度和当前 viewport 高度，并计算：

```text
--aside-offset
--pin-top
```

这样可以让第一组文字与第一张图片在主要阅读区域中获得更自然的视觉中心对齐。

同时，右侧 Sticky 始终受父容器边界限制：

```text
最后一组内容仍可见
        ↓
第 4 张图片保持完整
        ↓
Regional Solutions 模块结束
        ↓
图片区自然离开
        ↓
Next Section
```

不会覆盖下面的页面区块。

---

## 文字滚动动画

桌面端使用 ScrollTrigger + `scrub` 做轻量渐变，只处理：

```text
opacity
translateY
```

没有加入旋转、弹跳或大幅位移，避免破坏企业网站需要的稳定感。

章节滚动节奏主要由：

```css
--story-step: clamp(410px, 50vh, 500px);
```

控制。

如果后期觉得各章节之间过疏或过密，优先调整这个变量，而不是修改 JavaScript。

---

## 响应式策略

### Desktop：`> 900px`

```text
┌─────────────────────────────────────┐
│ 左侧内容           右侧 Sticky 图片 │
│                                ┃    │
│                                │    │
│                                │    │
└─────────────────────────────────────┘
```

保留完整 Scrollytelling 体验。

### Mobile：`≤ 900px`

```text
┌──────────────────┐
│      图片        │
│             3D   │
├──────────────────┤
│ 区域 / 编号      │
│ 标题             │
│ 描述             │
│ View Solution    │
└──────────────────┘
```

移动端不是简单压缩桌面双栏，而是重新组织为自然的纵向阅读结构。

---

## 内容维护

后期更新内容时，主要修改 `index.html`。

每个 Region 的完整数据集中在一个 `.story-item` 中，包括：

- 区域名称；
- 标题；
- 描述；
- `View Solution` 链接；
- 场景图；
- 3D Preview 链接；
- QR Code。

### 新增一个 Region

复制现有完整的：

```html
<article class="story-item" data-story-item>
  ...
</article>
```

替换内容即可。

例如新增 Australia 时，只需要增加新的文章块和图片素材。

JavaScript 会自动：

1. 读取全部 `.story-item`；
2. 自动生成 `01 / 02 / 03 ...`；
3. 克隆媒体内容到桌面视觉舞台；
4. 自动生成同数量的 indicator；
5. 建立图片、文字和导航之间的对应关系。

因此通常不需要修改：

```text
setActive()
ScrollTrigger 数量
indicator 数量
序号逻辑
```

---

## 图片维护

当前 4 张 SVG 场景图统一为：

```text
viewBox="0 0 900 600"
比例：3 : 2
```

正式项目替换真实图片时，建议继续保持统一的 **3:2** 比例。

可以使用：

```text
SVG
WebP
AVIF
JPG
PNG
```

只要图片比例保持一致，通常不需要修改布局 CSS。

---

## 3D 与二维码

当前 Demo 的 4 个 Region 共用：

```text
images/qr-fluted-wall-panel-veneer.png
```

正式项目建议每个 Region 对应自己的二维码和 3D URL：

```text
North America  → QR A → 3D URL A
Europe         → QR B → 3D URL B
Middle East    → QR C → 3D URL C
Southeast Asia → QR D → 3D URL D
```

桌面端：Hover / Focus 3D 按钮显示二维码。

移动端：隐藏二维码浮层，直接点击 3D 按钮打开页面。

> 当前 Demo 中 `View Solution` 和 3D 链接仍使用 `#` 占位，正式使用时请替换为真实 URL。

---

## GSAP CDN 与降级方案

`index.html` 当前通过 jsDelivr 加载：

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
```

正常联网时使用：

```text
CSS Sticky
+
GSAP
+
ScrollTrigger
```

如果 GSAP / ScrollTrigger 没有成功加载，`app.js` 会自动退回：

```text
CSS Sticky
+
IntersectionObserver
```

核心内容仍可浏览，图片和导航仍可跟随当前章节切换；缺少的主要是 ScrollTrigger 驱动的连续文字渐变。

正式生产环境也可以把 GSAP 文件保存到本地，例如：

```text
js/
├─ vendor/
│  ├─ gsap.min.js
│  └─ ScrollTrigger.min.js
└─ app.js
```

再改为本地引用，减少外部 CDN 依赖。

---

## 可访问性与交互细节

项目已考虑以下基础细节：

- 右侧导航使用原生 `<button>`；
- indicator 提供 `aria-label`；
- 当前项使用 `aria-current`；
- 场景图片提供 `alt`；
- 3D 新窗口链接使用 `rel="noopener"`；
- 二维码支持 Hover 和 Focus；
- 支持 `prefers-reduced-motion`；
- 移动端不依赖 Hover 才能访问核心链接。

---

## 适用场景

这个模式比较适合 **3～6 个强关联章节**，例如：

- Regional Solutions；
- 产品解决方案；
- 服务流程；
- 企业核心优势；
- 技术能力；
- 产品应用场景；
- 品牌故事；
- 项目实施步骤。

如果增加到 6～8 项以上，应重新检查页面总滚动距离和信息架构，不建议为了保留滚动效果而无限增加章节。

---

## 与 Sticky Stacked Cards 的区别

### Sticky Stacked Cards

```text
Card 01 sticky
      ↓
Card 02 覆盖 Card 01
      ↓
Card 03 继续堆叠
```

重点是 **卡片之间的覆盖、堆叠和层次感**。

### Sticky Scrollytelling

```text
左侧章节正常滚动
        +
右侧视觉保持固定
        +
图片 / 导航同步当前章节
```

重点是 **内容叙事、图文对应和连续阅读**。

两个项目可以使用相同内容素材，但解决的是不同的交互问题。

---

## 学习重点

这个 Demo 适合研究：

- CSS `position: sticky` 与父容器边界；
- CSS Grid 双栏布局；
- GSAP ScrollTrigger 的 `start` / `end`；
- `scrub` 滚动动画；
- ScrollSpy 状态同步；
- 单一 `activeIndex` 状态管理；
- DOM 克隆与动态导航生成；
- 图片 Crossfade；
- IntersectionObserver 降级方案；
- `prefers-reduced-motion`；
- 桌面 / 移动端不同交互模型；
- CSS Sticky 与 GSAP Pin 的职责取舍。

---

## 设计原则

本项目有意保持克制，没有继续加入：

```text
Swiper
Fancybox
Parallax
复杂 clip-path 动画
背景颜色联动
大幅图片位移
多层 GSAP Timeline
```

第一阶段只解决：

```text
自然滚动
+
稳定 Sticky
+
章节识别
+
图片同步
+
导航同步
+
响应式降级
```

目标是让这个效果以后可以直接复用到真实企业网站，而不是只做一个动画展示 Demo。

---

## v1.0.2 更新

- 缩短标题区与第一组内容之间的空白；
- 优化左侧章节之间的滚动距离；
- 右侧固定机制最终改为原生 CSS Sticky；
- 解决最后一张图片进入下一章节的问题；
- 修复点击右侧导航时图片发生上下位移的问题；
- 优化第一组文字与右侧图片的视觉中心对齐；
- 保持移动端原有卡片结构。

---

## 后续扩展方向

- 每个 Region 使用独立二维码和 3D URL；
- 将 SVG 占位图替换为真实项目图片；
- GSAP / ScrollTrigger 本地化；
- 扩展为更多企业官网内容类型；
- 封装为 WordPress / Elementor 可复用模块；
- 继续完善键盘导航和可访问性测试。

建议优先保持当前结构稳定，不为了增加动画数量而继续复杂化 JavaScript。
