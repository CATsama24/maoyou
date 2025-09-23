# 2D俯视角战斗游戏 Demo 框架

这是一个基于 **JavaScript** 和 **Phaser.js 3** 的2D俯视角战斗游戏Demo框架，采用**配置驱动**的设计理念。

## 🎮 游戏特性

- **配置驱动**: 通过修改 `js/gameConfig.js` 文件即可调整游戏数值
- **8方向移动**: 使用WASD或方向键控制玩家移动
- **冲刺系统**: 空格键冲刺，冲刺期间无敌
- **武器系统**: 支持近战和远程武器
- **敌人AI**: 简单的视野和攻击范围AI
- **碰撞检测**: 完整的物理碰撞系统

## 🎯 控制方式

- **WASD** 或 **方向键**: 移动
- **空格键**: 冲刺
- **鼠标右键**: 攻击

## 📁 项目结构

```
├── index.html              # 游戏主页面
├── js/
│   ├── gameConfig.js       # 游戏配置文件（重要！）
│   └── main.js            # 游戏核心逻辑
└── assets/                # 美术资源文件夹
    ├── map/               # 地图资源
    │   └── background.gif
    ├── player/            # 玩家资源
    │   ├── player_idle.png
    │   ├── player_move.png
    │   ├── player_attack.png
    │   └── player_dash.png
    ├── enemies/           # 敌人资源
    │   ├── slime_idle.png
    │   └── slime_move.png
    └── weapons/           # 武器资源
        └── bullet.png
```

## ⚙️ 配置说明

### 修改游戏数值

打开 `js/gameConfig.js` 文件，你可以调整：

- **画面设置**: 游戏窗口大小
- **玩家属性**: 生命值、移动速度、冲刺参数
- **武器数据**: 伤害、冷却时间、攻击范围
- **敌人属性**: 生命值、速度、攻击力、视野范围
- **动画状态**: 支持的动画状态名称

### 添加新武器

在 `gameConfig.js` 的 `weapons` 对象中添加新武器：

```javascript
weapons: {
    'newWeapon': {
        type: 'melee', // 或 'ranged'
        damage: 25,
        cooldown: 300,
        range: 100,
        // 远程武器需要添加 bullet 配置
        bullet: {
            speed: 800,
            maxDistance: 600,
            asset: 'newBullet.png'
        }
    }
}
```

### 添加新敌人

在 `gameConfig.js` 的 `enemies` 对象中添加新敌人：

```javascript
enemies: {
    'newEnemy': {
        health: 50,
        speed: 100,
        damage: 15,
        attackRange: 60,
        visionRange: 400,
        attackCooldown: 1200,
        assetPrefix: 'newEnemy'
    }
}
```

## 🎨 替换美术资源

1. **玩家动画**: 替换 `assets/player/` 文件夹中的图片
   - **四向动画格式**: `player_[状态]_[方向].png`
     - 方向: up, down, left, right
     - 状态: idle, move, attack, hit, death, dash
     - 例如: `player_idle_down.png`, `player_move_up.png`, `player_attack_left.png`
   - **兼容旧格式**: `player_[状态].png` (无方向)
   - 如果四向动画不存在，系统会自动回退到无方向动画

2. **敌人动画**: 替换 `assets/enemies/` 文件夹中的图片
   - 命名格式: `[敌人类型]_[状态].png`
   - 例如: `slime_idle.png`, `slime_move.png`

3. **武器资源**: 替换 `assets/weapons/` 文件夹中的图片
   - 子弹图片: `bullet.png`

4. **地图背景**: 替换 `assets/map/background.gif`

## 🚀 运行游戏

1. 确保所有文件都在正确位置
2. 用浏览器打开 `index.html`
3. 开始游戏！

## 🔧 技术特性

- **四向动画支持**: 玩家支持上下左右四个方向的动画
- **自动资源加载**: 根据配置自动加载对应的图片资源
- **容错处理**: 缺少资源文件时不会报错，只是没有对应动画
- **向后兼容**: 支持旧版本无方向动画格式
- **模块化设计**: 配置与逻辑分离，便于维护
- **物理引擎**: 使用Phaser.js的Arcade物理系统
- **碰撞检测**: 支持玩家、敌人、子弹之间的碰撞

## 📝 开发说明

- 所有游戏逻辑都在 `js/main.js` 中
- 配置修改后需要刷新页面才能生效
- 建议使用现代浏览器（Chrome、Firefox、Edge等）
- 支持移动端触摸控制（需要额外配置）

---

**注意**: 当前使用的是占位符图片，请替换为实际的美术资源以获得最佳游戏体验。
