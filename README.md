# 流焰 · Emberflow

可实时调节、可复制嵌入的粒子动效实验室。使用原生 HTML、CSS 和 Canvas 构建，无需安装前端框架或执行构建步骤。

[在线体验](https://fluxcode666.github.io/emberflow/) · [GitHub 仓库](https://github.com/FluxCode666/emberflow)

## 效果与功能

- 色块向左流动，各行焰尾独立生长、回缩，最长和最短的位置随时间更换。
- 实时调整颜色、密度、速度、颗粒尺寸、画布高度、焰长差距与焰块空缺率。
- 默认焰块空缺率为 **0%**，指针排斥默认关闭；可自行启用排斥并调整力度。
- 提供 Midnight、Milk、Signal 三种预设，以及 Tab 卡片、GPT-5.6-SOL Ultra 和 GPT-6-ASTRA Ultra 效果示例。
- “查看代码”支持 JavaScript、HTML、TypeScript、React 和 Vue 3，代码随当前配置更新。
- 支持导出当前配置为 JSON，以及减少粒子采样的低性能模式。

## 本地运行

```bash
git clone https://github.com/FluxCode666/emberflow.git
cd emberflow
python3 -m http.server 4173
```

打开 <http://127.0.0.1:4173/>。页面运行本身没有 npm 依赖。

## 调整与复制

1. 在实验室中调整参数，或选择一个预设。
2. 点击配置面板下方的 **查看代码**，选择需要的实现语言并复制。
3. 需要保存参数时，点击同一行的 **导出当前配置**。

面板中的主要范围：画布高度 **50–1000px**，呼吸速度 **0–200%**，颗粒尺寸 **1–4px**，焰长差距 **3–20 格**。默认高度为 320px，焰长差距为 8 格。

呼吸速度控制色块纹理流动，不改变焰长差距。焰长差距表示当前最长和最短焰尾之间相差的网格数；焰块空缺率用于隐藏部分色块。低性能模式会额外减少采样，因此需要完整连续的点阵时，应关闭低性能模式。

## 在其他项目中使用

### HTML / 原生 JavaScript

可直接复制弹窗里的完整 HTML，也可以将本仓库的 `driftfield.js` 放到项目中，用普通脚本加载：

```html
<canvas id="particle-canvas"></canvas>
<script src="./driftfield.js"></script>
<script>
  const effect = mountDriftfield(document.querySelector('#particle-canvas'), {
    color: '#f5f0e8',
    background: '#131516',
    density: 0.68,
    speed: 1,
    size: 1,
    height: 320,
    tailVariance: 8,
    gapRate: 0,
    pointer: false,
    pointerStrength: 30
  });

  // 按需更新外观。
  effect.update({ color: '#e69e4e', height: 500 });

  // 移除画布或卸载组件时调用。
  // effect.destroy();
</script>
```

独立引擎返回 `update(options)`、`destroy()` 和 `stats`，可用于更新配置、释放动画与事件监听、读取画布尺寸及采样数量。

### React / Vue / TypeScript

配置弹窗提供 React 与 Vue 3 组件模板，组件卸载时会调用 `destroy()`。它们使用 ES Module 导入引擎：将 `driftfield.js` 放入对应源码目录，并在文件末尾添加以下导出，再使用弹窗中的组件代码。

```js
export { mountDriftfield };
```

TypeScript 选项提供包含 `DriftfieldOptions` 类型的实现模板，可根据项目的类型检查设置补充参数类型。

### 独立引擎参数

下表对应 `mountDriftfield(canvas, options)`。直接使用弹窗生成的配置即可自动完成面板值换算。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `color` | `'#f5f0e8'` | 粒子颜色，六位十六进制色值 |
| `background` | `'#131516'` | 画布背景色 |
| `seed` | `23` | 随机种子，相同参数及时间可复现效果 |
| `density` | `0.68` | 对应面板密度除以 100 |
| `speed` | `1` | 对应面板呼吸速度除以 42；0 仍保留基础流动 |
| `size` | `1` | 尺寸倍率，对应面板颗粒尺寸除以 3 |
| `height` | `320` | 画布高度，单位 px；面板范围 50–1000 |
| `tailVariance` | `8` | 最长和最短焰尾差距，范围 3–20 格 |
| `gapRate` | `0` | 焰块空缺率，0–1 对应面板 0–100% |
| `glow` | `24` | 背景光晕强度；面板范围 0–70 |
| `pointer` | `false` | 是否启用指针排斥 |
| `pointerStrength` | `30` | 指针排斥力度，0–100 |
| `lowPerf` | `false` | 是否通过减少采样降低绘制开销 |
| `gap` | `9` | 网格间距，单位 px |

“导出当前配置”保存的是面板数值。手动传入独立引擎时，需将 `density`、`gapRate` 除以 100，`speed` 除以 42，`size` 除以 3；预设导出的 `bg` 应映射为 `background`。也可以直接使用“查看代码”中已换算的配置。

## GitHub Pages

线上地址：<https://fluxcode666.github.io/emberflow/>

推送到 `main` 分支后，[部署工作流](.github/workflows/deploy-pages.yml) 会检查 JavaScript 语法并自动发布。也可以在 GitHub Actions 中手动运行 **Deploy GitHub Pages**。

仓库设置中的 **Settings → Pages → Source** 应选择 **GitHub Actions**。部署内容为 `index.html`、`styles.css`、`app.js` 和 `driftfield.js`；文档与测试文件不会发布到站点。

## 项目结构

```text
index.html                         展示页面、配置面板与代码弹窗
styles.css                         页面样式与响应式布局
app.js                             展示页动画、交互及代码生成
driftfield.js                      可独立使用的 Canvas 粒子引擎
.github/workflows/deploy-pages.yml  GitHub Pages 自动部署
tests/flame-contour.cjs             浏览器中的焰尾轮廓回归检查
```

## 浏览器回归检查

先启动本地 HTTP 服务，再安装用于检查的 Playwright Core：

```bash
npm install --prefix /tmp/driftfield-browser-tools --no-save playwright-core
NODE_PATH=/tmp/driftfield-browser-tools/node_modules node tests/flame-contour.cjs
```

默认使用 macOS 上的 Google Chrome。其他环境可通过 `CHROME_PATH` 指定 Chrome / Chromium 可执行文件；`FLAME_TEST_URL` 和 `FLAME_TEST_OUTPUT` 分别设置服务地址与结果目录。

检查覆盖最长／最短行换位、0% 空缺时的连续性、50／320／500px 高度、3／8／20 格焰长差距、速度与长度解耦，以及复制代码与独立引擎的绘制一致性。默认截图与报告保存在 `/tmp/driftfield-contour`。

## 视觉参考

项目最初参考 oh-my-tab 的粒子点阵与 Tab 卡片背景效果，在此基础上加入动态焰尾轮廓、实时配置、模型效果示例和代码导出功能。
