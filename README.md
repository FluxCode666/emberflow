# Driftfield · 浮游粒子实验室

从 [oh-my-tab](https://github.com/trynewthin/oh-my-tab) 的粒子点阵视觉抽离出的独立效果展示页。整个页面是零构建依赖的原生 HTML / CSS / Canvas，可以直接部署到静态托管，也可以把粒子画布嵌入其他项目。粒子采样算法按参考项目的 `particle-texture.ts` 迁移，保留确定性随机、边缘密度、独立呼吸周期和强度计算。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173>。

## 可复用方式

配置面板里的「查看代码」会打开代码弹窗，支持 JavaScript、HTML、TypeScript、React 和 Vue 3 五种接入方式；所有版本都会读取当前配置的颜色、密度、速度、尺寸和高度。 「复制完整实现」仍会复制原生 JavaScript 版本，适合直接嵌入项目：

React 和 Vue 3 版本默认从同目录的 `driftfield.js` 引入共享引擎；它返回 `destroy()` 清理句柄，组件卸载时会停止动画并移除监听器。

```html
<canvas id="particle-canvas" style="width:100%;height:320px"></canvas>
<script>
  mountDriftfield(document.querySelector('#particle-canvas'), {
    color: '#f5f0e8',
    density: 0.68,
    speed: 0.42,
    size: 3,
    height: 320,
    pointerStrength: 30,
    pointer: false,
    gapRate: 0
  })
</script>
```

可调参数：`color`、`density`、`speed`、`size`、`height`（50–500px）、`pointerStrength`（0–100%）、`tailVariance`（3–20 格）、`gapRate`（焰块空缺率，0–1，对应 0–100%）和 `gap`（粒子网格间距）。焰长差距表示当前画面中最长与最短焰尾之间相差的网格数，默认 8 格。各行独立生长、回缩，最长和最短的位置会随时间更换；呼吸速度只控制色块向左流动，不改变焰长差距。窄画布会自动收拢尾部，避免尾尖被左边界裁齐。空缺率只会随机隐藏火焰及焰尾色块，不改变火焰轮廓或流动方向。展示页还提供 Midnight、Milk、Signal 三组预设、指针排斥、低性能模式和 JSON 配置导出。

默认焰块空缺率为 0%，指针排斥关闭，可通过配置面板启用。

## 文件

- `index.html`：展示页结构、实时 playground、预设卡片与代码区
- `styles.css`：编辑部式排版、暗色粒子画布、响应式布局与动效
- `app.js`：确定性随机点阵、呼吸动画、指针交互、代码生成与配置导出
- `driftfield.js`：可被其他项目直接引入的共享 Canvas 粒子引擎

## 浏览器回归检查

启动本地预览后，使用独立安装的 Playwright Core 和本机 Chrome：

```bash
npm install --prefix /tmp/driftfield-browser-tools --no-save playwright-core
NODE_PATH=/tmp/driftfield-browser-tools/node_modules node tests/flame-contour.cjs
```

检查会在真实浏览器中采集 Canvas 绘制结果，验证最长／最短行换位、零空缺连续性、50／320／500px 高度、3／8／20 格焰长差距、速度与长度解耦，以及复制代码与独立引擎的一致性。截图和报告保存在 `/tmp/driftfield-contour`；可通过 `CHROME_PATH`、`FLAME_TEST_URL`、`FLAME_TEST_OUTPUT` 指定浏览器、服务地址和输出目录。
