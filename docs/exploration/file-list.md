# 完整提交文件清单

共 61 个文件。路径相对于解压根目录；复制时保留目录层级。演示依赖 test/exploration/fixtures，请勿只复制 HTML。正式接入后移除演示的前提见接口及迁移说明。

## 1. 探索脚本

```text
assets/js/exploration/data/exploration.js
assets/js/exploration/data/items.js
assets/js/exploration/game/exploration-demo.js
assets/js/exploration/game/exploration-movement.js
assets/js/exploration/game/exploration-view.js
assets/js/exploration/game/exploration.js
assets/js/exploration/game/game-page.js
assets/js/exploration/game/host-reader.js
assets/js/exploration/game/hotspot-keyboard.js
assets/js/exploration/game/hotspot-view.js
assets/js/exploration/game/inventory-view.js
assets/js/exploration/game/inventory.js
assets/js/exploration/game/local-preview-hint.js
assets/js/exploration/game/view-utils.js
```

## 2. 成就脚本

```text
assets/js/achievements/data/achievements.js
assets/js/achievements/game/achievements-demo.js
assets/js/achievements/game/achievements-page.js
assets/js/achievements/game/achievements-view.js
assets/js/achievements/game/achievements.js
```

## 3. 外部样式

```text
assets/css/achievements/achievements.css
assets/css/exploration/exploration.css
assets/css/exploration/game.css
```

## 4. 物品素材

```text
assets/images/exploration/items/blue-glass-bead.svg
assets/images/exploration/items/burned-work-id.svg
assets/images/exploration/items/funeral-list.svg
assets/images/exploration/items/height-marks.svg
assets/images/exploration/items/key-a.svg
assets/images/exploration/items/map-fragment-1.svg
assets/images/exploration/items/map-fragment-2.svg
assets/images/exploration/items/map-fragment-3.svg
assets/images/exploration/items/old-photograph.svg
assets/images/exploration/items/restored-village-map.svg
assets/images/exploration/items/school-uniform.svg
```

## 5. 独立页面

```text
pages/achievements/achievements.html
pages/exploration/game.html
```

## 6. 接口和验收文档

```text
docs/achievements/interface.md
docs/exploration/acceptance.md
docs/exploration/engine-compatibility.md
docs/exploration/file-list.md
docs/exploration/github-upload.md
docs/exploration/interface.md
docs/exploration/migration.md
docs/exploration/source-record.md
docs/exploration/story-targets.md
```

## 7. 测试与演示夹具

```text
test/achievements/achievements.test.mjs
test/exploration/browser.cjs
test/exploration/contract.test.mjs
test/exploration/engine-integration.test.mjs
test/exploration/fixtures/demo-host.js
test/exploration/fixtures/engine-host.js
test/exploration/fixtures/engine-loader.js
test/exploration/fixtures/story-fixture.js
test/exploration/vendor/game-line/data/old-house.js
test/exploration/vendor/game-line/data/prologue.js
test/exploration/vendor/game-line/data/story-registry.js
test/exploration/vendor/game-line/data/village.js
test/exploration/vendor/game-line/game/story-engine.js
test/exploration/vendor/game-line/game/story-request.js
test/exploration/vendor/game-line/game/story-runtime.js
test/exploration/vendor/game-line/game/story-validator.js
test/exploration/vendor/source.json
```
