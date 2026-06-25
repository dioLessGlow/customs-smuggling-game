# 缉私十二时辰 · 项目架构文档

> 反走私创意大赛教育游戏 — 36海关 × 6导师 × 周期系统

---

## 一、项目概览

| 项目 | 值 |
|------|-----|
| **定位** | 反走私教育游戏（问答×扫描缉私） |
| **屏幕尺寸** | 390 × 844 (iPhone 14) |
| **缩放策略** | 移动端 `window.innerWidth/390`，桌面端 `Math.min(1, w/390, h/844)` 居中模拟 |
| **渲染层** | Phaser 3 (游戏场景) + amCharts 5 (地图) + Canvas 2D (潮汐背景) |
| **存档** | localStorage (key: `anti_smuggling_save_v4`) + `_memoryStore` 兜底 |
| **CDN依赖** | amCharts 5 + Phaser 3.70 |

---

## 二、文件结构

```
docs/                          ← 设计文档与架构说明
├── mdv3_architecture.md       ★ 本文件
├── 商店系统设计方案_v3.2.md
├── 36个知识点设计方案_v3.3.md
├── 法律风险分析_十日终焉_修改建议.md
├── 角色设计方案_原创缉私英雄.md
├── 走私手法大全_反制手段对照表.md
└── ...

src/                           ← 全部源码
├── config/                    ★ 数据层（无逻辑）
│   ├── constants.js           SAVE_KEY + _memoryStore
│   ├── levels.js              36关卡定义（LEVELS数组）
│   ├── echoes.js              6直觉定义（ECHO_POOL）
│   ├── fragments.js           36知识卡片 + 36剧情碎片
│   └── shop.js                商店商品数据 + 108题库 + 导师名映射
│
├── managers/                  ★ 逻辑层
│   ├── SaveManager.js         存档读写/迁移/每日登录
│   ├── CycleManager.js        周期管理（10关周期）
│   ├── EchoManager.js         直觉管理（已被商店直觉取代，保留接口）
│   └── SoundManager.js        Web Audio API 音效合成
│
├── scenes/                    ★ Phaser 场景层
│   ├── GenericLevelScene.js   核心关卡场景（1206行）
│   ├── RatScene.js            子场景（透影×X光）
│   ├── TigerScene.js          子场景（护珍×放大镜）
│   ├── SnakeScene.js          子场景（毒品扫描）
│   ├── PopupText.js           浮动文字组件
│   └── EchoIndicator.js       直觉指示器
│
├── renderers/                 ★ 渲染层
│   ├── tides.js               24h潮汐海洋背景（272行）
│   └── character-icons.js     （已废弃，未加载）
│
└── ui/                        ★ DOM UI层
    ├── UI.js                  屏幕管理器 + fitApp()
    ├── init.js                启动入口 + 潮汐启动 + 事件绑定
    ├── menu.js                主菜单
    ├── level-select.js        amCharts 5 地球/地图双模式
    ├── result.js              关卡结算 + 知识卡片 + 剧情碎片
    ├── cycle-summary.js       周期结算
    ├── shop.js                商店4标签购买 + 确认弹窗 + 私教课测验
    ├── archive.js             图鉴
    ├── settings.js            设置 + 重置
    └── character-select.js    角色/直觉选择

index.html                     入口（CSS ~300行 + 14屏幕DOM + 31 script标签）
map_fantasy_36.html            备用独立地图
tides_24h_fixed.html           潮汐参考源
server.js                      本地 dev server
```

### 脚本加载顺序 (index.html)

```html
config/*.js       →   数据层先加载
renderers/tides.js →  背景渲染
managers/*.js     →  逻辑层
scenes/*.js       →  Phaser场景
ui/*.js           →  DOM UI（最后加载 init.js）
```

---

## 三、核心数据结构

### 3.1 存档格式 (SaveManager.getDefault)

```js
{
  unlocked: ['k01','k07','k13','k19','k25','k31'],   // 初始解锁6关
  completed: [],                                       // 已通关ID列表
  totalScore: 0,                                       // 累计总分
  bestScores: {},                                      // { levelId: bestScore }
  currentCycle: 1,                                     // 当前周期号
  roundsInCycle: [],                                   // 本周期已通关关卡
  cycleDao: 0,                                         // 周期内功勋
  permanentDao: 3,                                     // 永久功勋（可消费）
  echoSkills: [],                                      // 已获取直觉ID列表
  currentEcho: null,                                   // 当前使用直觉ID
  chosenCharacterId: null,                             // 已选角色ID
  fragments: [],                                       // 已收集剧情碎片ID
  archive: [],                                         // 图鉴条目
  seenItems: [],                                       // 已见物品记录
  settings: { sound: true, vibration: true },
  lastPlayed: Date.now(),
  // 商店 v3.2 字段
  shopItems: [],          // 已购装备/技能/直觉ID
  shopKnowledge: [],      // 已购知识ID
  quizResults: {},        // { k01: 5 } 测验奖励
  firstWinBonuses: [],    // 首胜奖励领取记录
  hasShared: false,
  lastLoginDate: '',      // 每日登录
  loginStreak: 0
}
```

**迁移**: `_migrate()` 处理两种旧格式:
1. 旧 `human_rat` 格式（带下划线 `_`）→ 重置为默认，保留功勋/碎片/设置
2. 过渡 v4 格式（无下划线但缺新字段）→ 自动补齐 `shopItems`/`shopKnowledge`/`quizResults` 等

### 3.2 36关卡 (LEVELS)

```js
// 结构
{ id:'k01', name:'审名', tutor:'linrui', desc:'伪报品名识别',
  icon:'📋', time:60, items:5, required:4,
  scene:'GenericLevelScene', mechanic:'basic', cost:1,
  hiddenRule:'将高税率商品伪报为低税率品名...' }

// 导师分组（每人6关, 每关消耗1-3功勋）
linrui (鼠)  → k01~k06  通关走私识别  |  6关全部 basic
chenfeng (蛇)  → k07~k12  毒品走私识别 |  含SnakeScene
zhaohai (狗) → k13~k18  海上绕关走私  |  含科技缉私
baiwei (牛)  → k19~k24  冻品防疫走私  |
laozhou (马) → k25~k30  加工贸易走私  |
xiaohui (虎) → k31~k36  综合与纪念    |  含TigerScene(magnifier)

// 关卡类型
- GenericLevelScene: 标准扫描关卡
- RatScene: X光透影场景
- SnakeScene: 毒品人体扫描场景
- TigerScene: 放大镜场景（隐藏图标，手动检查）
```

### 3.3 商店系统 (SHOP)

| 类别 | 数量 | 总价 | 效果 |
|------|------|------|------|
| 🔧 **装备** | 4件链式 | 175 | 放大镜+1、+2 → X光显品类 → 光谱标风险 |
| 💪 **技能** | 5件(3堆叠) | 120 | 初始警觉+5/+10/+20、扫描速度-20%、切换-1s |
| 🧠 **直觉** | 6件独立 | 175 | 20%免扣分/风声预警/逆境+5/30%暂停5s/30%续连击/+10%功勋 |
| 📚 **知识** | 36件 | ~625 | 按导师生效：警觉/时间/惩罚/放大镜/连击加成 |

**知识效果**: `k36` 全局+2警觉，其余按 `item.effect.tutor` 匹配当前关卡导师生效:
- `tutorAlarm` → `this.score += value`
- `tutorTime` → `this.timeLimit += value`
- `tutorPenalty` → `this.penaltyMod += value`
- `tutorMagnifier` → `this.magnifierUses += value`
- `tutorCombo` → `this.comboBonus += value`

### 3.4 直觉系统 (ECHO_POOL)

```js
{ id:'crisis_exempt',    icon:'🛡️', desc:'错误时20%概率不扣分',   chance: 0.2 }
{ id:'wind_warning',     icon:'🌪️', desc:'最后5秒高亮走私品',        value: true }
{ id:'adversity_rebound',icon:'🔥',  desc:'连续错2后下次正确+5',    value: 5 }
{ id:'time_mastery',     icon:'⏳', desc:'时间耗尽30%暂停5秒',       chance: 0.3 }
{ id:'combo_keep',       icon:'💫', desc:'连击中断30%保留',          chance: 0.3 }
{ id:'lucky_bonus',      icon:'🍀', desc:'周期结算额外+10%功勋',  value: 0.1 }
```

**注意**: 直觉系统`echoes.js`与EchoManager已解耦。商店中的6直觉通过 `shopItems` 购买后写入 `this.ownedIntuitions`。`EchoManager` 主要用于旧字符角色绑定接口，目前不实际生效。

---

## 四、关卡流程 (GenericLevelScene)

```
init()
  ├─ _findConfig()           ← 从LEVELS按levelId找关卡配置
  ├─ _resetState()           ← 重置游戏状态 + _applyShopEffects()
  │   └─ _applyShopEffects() ← 装备/技能/知识全部生效
  ├─ _buildItemPool()        ← 按场景类型选物品池(12生肖池)
  └─ save = SaveManager.load()

create()
  ├─ _showDayIntro()         ← "第N天"动画
  ├─ _createHUD()            ← 标题/时间/进度/连击/分数
  ├─ _createScanArea()       ← 行李/扫描框/扫描线/检测报告/深度检查
  ├─ _createButtons()        ← 放行/检查/扣押 三按钮
  ├─ _createEchoIndicator()  ← 直觉指示器
  └─ _showItem()             ← 延迟1.5s后开始

循环: _showItem() → X光扫描动画(1s) → _showDetectionReport() → 玩家判定

判定后:
  → 正确: +10分, +1功勋+连击加成, comboTrack
       ├─ 3连击: comboProtected=true (缉私直觉)
       ├─ adversity_rebound: 连续错2后正确+5
       └─ 粒子特效

  → 错误: -5分(-50扣留品), commbo重置
       ├─ crisis_exempt: 20%免罚
       ├─ combo_keep: 30%保留连击
       ├─ comboProtected: 直觉抵挡
       └─ 红色闪光

  → 深度检查: _secondaryCheck() (2s, -3时间)

_onTick(): 每秒-1
  ├─ wind_warning: 最后5s高亮
  ├─ time_mastery: 超时30%暂停5s
  └─ 超时 → _endLevel()

_endLevel(): 判定通过/失败
  ├─ lucky_bonus: +10%功勋
  ├─ CycleManager.addRound()
  └─ 解锁下一关（同导师内线性）
```

### 物品判定规则

| 玩家操作 | 走私品 | 合法物品 |
|----------|--------|----------|
| 放行 (pass) | ❌ 扣分 | ✅ 加分 |
| 深度检查 (inspect) | 支持 (只能一次) | 支持 |
| 扣押 (seize) | ✅ 加分 | ❌ 扣分 |

**物品属性**: `dw`申报重量, `aw`实测重量, `type`(legal/illegal), `cat`(品类), `risk`(毒品标记), 偏差>30% = 异常标记。

### 物品池

| 池 | 对应关卡 | 特色 |
|----|----------|------|
| RAT_POOL  | k01~k06 | 食品/化妆品/普通走私品 |
| SNAKE_POOL | k07~k12 | 毒品(crisis=true) |
| DOG_POOL | k13~k18 | 海上用品/濒危物种 |
| OX_POOL | k19~k24 | 冻品/食品 |
| HORSE/GOAT/MONKEY/ROOSTER/PIG | k25~k36 | 各有专精物品 |
| TIGER_POOL | k31 | 濒危物种/象牙 |

---

## 五、地图系统 (level-select.js)

| 特性 | 实现 |
|------|------|
| 框架 | amCharts 5 MapChart |
| 投影 | geoOrthographic (地球模式) / geoMercator (地图模式) |
| 切换 | switch按钮，动画过渡1.5s |
| 旋转 | 自动2分钟旋转一圈，拖拽停止，松手恢复 |
| 坐标 | 36个世界坐标点（全球分布，非真实海关位置） |
| 极标签 | `chart.convert({latitude, longitude})` 实时计算N/S方向 |
| 状态 | 🔒未开放/🌟已开放/✨已通关 |
| 图例 | 左下角三点 |
| 标题 | "三十六海关" |

---

## 六、潮汐背景 (tides.js)

`TidesBg` 自运行引擎，272行代码，从 `tides_24h_fixed.html` 移植。

| 元素 | 数量 | 说明 |
|------|------|------|
| 调色板 | 9帧 | 从子夜→正午→日落→子夜，24h色温循环 |
| 太阳 | 1 | `lerp` 计算位置/颜色，水平升降 |
| 星星 | 140 | 透明度随 `star` 参数变化 |
| 云层 | 5层 | 不同透明度和速度 |
| 海鸥 | 4只 | 正弦飞行 |
| 波浪 | 26层 | 不同频率/振幅/速度的 `sin` 渲染 |
| 闪光 | 220个 | 随机闪烁的波光粼粼 |

初始化: `TidesBg.init(390, 844, dpr)` → 创建 ×dpr 画布 → `ctx.setTransform(dpr)` 缩放。

---

## 七、商店UI流程 (shop.js)

```
UI.show('shop')
  └─ 渲染 4 tabs (equipment/skills/intuitions/knowledge)
     ├─ 遍历 SHOP[tab] → 生成每个商品的DOM
     │  ├─ 已拥有 → "✓已拥有"
     │  ├─ 前置未满足 → "🔒需前置"
     │  ├─ 功勋不足 → "🔒功勋不足"
     │  └─ 可购买 → clickable → 弹出确认框
     └─ 确认 → _buyItem()
        ├─ 扣功勋 → push到 save.shopItems/shopKnowledge
        ├─ 保存 → 刷新显示
        └─ 知识类 → _openKnowledgeLesson()
           ├─ 显示知识卡片(KNOWLEDGE_CARDS[item.id])
           ├─ 加载测验(SHOP_QUIZ[item.id])
           │  └─ 3道题 → 每道3选1
           └─ _checkQuizDone()
              ├─ 3/3 → +5功勋
              ├─ 2/3 → +2功勋
              └─ 保存 quizResults[item.id]
```

**确认弹窗**: 覆盖层 #shop-confirm, 显示icon/名称/描述/价格。

**知识课界面**: #knowledge-lesson, 导师名(`TUTOR_NAMES`)、知识卡片、测验按钮。

---

## 八、周期系统 (CycleManager)

| 概念 | 值 |
|------|-----|
| 周期长度 | 10关 (CYCLE_SIZE) |
| 存活条件 | 通关 ≥ 6关 (60%) |
| 通过奖励 | 周期+1, 随机解锁新直觉 |
| 失败惩罚 | 周期内功勋清零 (`lostDao`) |

流程: 每关通过后 `CycleManager.addRound()` → 检查是否10关 → `endCycle()` → 弹出 cycle-summary。

---

## 九、音效系统 (SoundManager)

纯 Web Audio API 合成，无音频文件：

| 音效 | 波形 | 频率 |
|------|------|------|
| correct | sine 880→1760 | 0.2s |
| wrong | sawtooth 150→100 | 0.5s |
| alarm | square siren 440↔880 | 0.6s |
| click | sine 600→800 | 0.1s |
| levelup | sine 523→1047 | 0.4s |
| scan | square 1200→1800 | 0.2s |
| echo | sine 660→1320 | 0.6s |
| cycle | 4音符序列 (C5 E5 G5 C6) | 0.6s |

---

## 十、每日登录 (SaveManager.checkDailyLogin)

- 每次 `init.js` 启动时调用
- 比较 `lastLoginDate` vs 今日日期
- 连续: `loginStreak++`, 中断: 重置为1
- 每7天 → `permanentDao += 10`

---

## 十一、图鉴 (archive.js)

- 统计已见物品、已通关卡、已收集碎片
- 按关卡分组展示物品图标
- 显示已激活直觉列表

---

## 十二、关键约定

1. **坐标统一**: 所有Phaser和CSS坐标基于 390×844，不硬编码DPR
2. **DPR处理**: Canvas ×dpr + `ctx.setTransform(dpr)`, Phaser `resolution: dpr`
3. **命名规则**:
   - `k01`~`k36`: 关卡ID
   - `tutor` 字段: `linrui`/`chenfeng`/`zhaohai`/`baiwei`/`laozhou`/`xiaohui`
   - 商店效果type: `tutorAlarm`/`tutorTime`/`tutorPenalty`/`tutorMagnifier`/`tutorCombo`/`globalAlarm`
4. **加载顺序**: config → managers → scenes → ui (init.js最后)
5. **商店数据源**: `src/config/shop.js` 是单一数据源，`src/ui/shop.js` 只消费不修改
6. **去生肖化**: 所有用户可见文字无"生肖"概念，代码内部保留 `zodiac` 字段仅为物品池选择
7. **36海关名**: 虚构2字符名称，避免真实海关法律敏感
