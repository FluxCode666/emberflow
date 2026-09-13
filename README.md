# Driftfield · 浮游粒子实验室

从 [oh-my-tab](https://github.com/trynewthin/oh-my-tab) 的粒子点阵视觉抽离出的独立效果展示页。整个页面是零构建依赖的原生 HTML / CSS / Canvas，可以直接部署到静态托管，也可以把粒子画布嵌入其他项目。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173>。

## 可复用方式

页面里的「复制完整实现」会生成一个 `mountDriftfield(canvas, options)` 示例，直接复制到项目中即可使用：

```html
<canvas id="particle-canvas" style="width:100%;height:320px"></canvas>
<script>
  mountDriftfield(document.querySelector('#particle-canvas'), {
    color: '#f5f0e8',
    density: 0.68,
    speed: 0.42,
    size: 3
  })
</script>
```

可调参数：`color`、`density`、`speed`、`size`、`gap`。展示页还提供 Midnight、Milk、Signal 三组预设、指针排斥、低性能模式和 JSON 配置导出。

## 文件

- `index.html`：展示页结构、实时 playground、预设卡片与代码区
- `styles.css`：编辑部式排版、暗色粒子画布、响应式布局与动效
- `app.js`：确定性随机点阵、呼吸动画、指针交互、代码生成与配置导出
