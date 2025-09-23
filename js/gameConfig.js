// js/gameConfig.js
// 这是一个全局配置文件，策划可以直接修改这里的所有数值

const GameConfig = {
    // 画面设置 - 动态适应屏幕尺寸
    width: window.innerWidth,
    height: window.innerHeight,

    // 地图设置
    map: {
        // 对应 assets/map 文件夹下的文件名
        asset: 'background.gif'
    },

    // 玩家设置
    player: {
        health: 100,
        speed: 200, // 移动速度 (像素/秒)
        dash: {
            speedMultiplier: 2.5, // 冲刺时速度是正常速度的2.5倍
            duration: 225,        // 冲刺持续时间 (毫秒) - 1.5倍距离
            cooldown: 800,        // 冲刺冷却时间 (毫秒)
        },
        // 资源文件的前缀，程序会自动寻找 "player_idle.png", "player_move.png" 等
        assetPrefix: 'player',
        // 玩家无敌时间（受到伤害后）
        invulnerabilityDuration: 1000, // 毫秒
        
        // 序列帧动画设置
        spriteSheet: {
            // 手动指定序列帧数量（如果自动检测不准确）
            frameCounts: {
                'idle': 8,      // 待机动画帧数
                'move': 8,      // 移动动画帧数
                'attack1': 8,   // 攻击动画1帧数
                'attack2': 8,   // 攻击动画2帧数
                'hit': 4,       // 受伤动画帧数
                'death': 7,     // 死亡动画帧数
                'dash': 7       // 冲刺动画帧数
            },
            // 每帧的尺寸设置
            frameSize: {
                width: 64,      // 每帧宽度（像素）
                height: 64      // 每帧高度（像素）
            },
            // 是否启用自动检测帧数
            autoDetectFrames: true,
            // 攻击动画交替设置
            attackVariants: ['attack1', 'attack2'], // 可用的攻击动画变体
            attackAlternate: true // 是否启用攻击动画交替
        }
    },

    // 武器库 (我可以添加任意多的武器)
    weapons: {
        'sword': { // 近战武器
            type: 'melee',
            damage: 20,
            cooldown: 500, // 攻击间隔 (毫秒)
            range: 80,     // 攻击距离 (像素)
            // 近战攻击判定持续时间
            attackDuration: 200, // 毫秒
        },
        'pistol': { // 远程武器
            type: 'ranged',
            damage: 12,
            cooldown: 400,
            bullet: {
                speed: 600,       // 子弹速度 (像素/秒)
                maxDistance: 500, // 子弹最大飞行距离
                // 对应 assets/weapons 文件夹下的文件名
                asset: 'bullet.png'
            }
        }
    },

    // 怪物库 (我可以添加任意多的怪物)
    enemies: {
        'moose1': {
            health: 50,
            speed: 60,
            damage: 15,
            attackRange: 60,    // 攻击范围
            visionRange: 350,   // 发现玩家的范围
            attackCooldown: 3000, // 攻击冷却时间 (毫秒) - 3秒
            // 资源文件的前缀，如 "moose1_idle.png", "moose1_move.png"
            assetPrefix: 'moose1',
            // 序列帧配置
            spriteSheet: {
                // 每帧的尺寸设置
                frameSize: {
                    width: Math.floor(347/6),  // 347像素宽度，除以6帧
                    height: 192    // 192像素高度
                },
                // 手动指定序列帧数量
                frameCounts: {
                    'idle': 8,     // 待机动画帧数
                    'move': 8,     // 移动动画帧数
                    'attack1': 30,  // 攻击动画帧数
                    'hit': 6,      // 受伤动画帧数
                    'death': 15     // 死亡动画帧数
                }
            }
        }
    },

    // 动画状态命名约定
    // 这是我们约定好的动画状态名称，程序会根据这个名字和 assetPrefix 去找图片
    // 例如，玩家的站立动画会去找 `player_idle.png`
    animationStates: ['idle', 'move', 'attack1', 'hit', 'death', 'dash'],
    
    // 四向动画支持
    // 支持的方向：up, down, left, right
    directions: ['up', 'down', 'left', 'right'],
    
    // 四向动画状态组合
    // 格式：{状态}_{方向}，例如：player_idle_down.png, player_move_up.png
    directionalStates: ['idle', 'move', 'attack1', 'hit', 'death', 'dash'],

    // 游戏物理设置
    physics: {
        // 重力设置（俯视角游戏通常不需要重力）
        gravity: { x: 0, y: 0 },
        // 碰撞检测设置
        collisionCategories: {
            PLAYER: 1,
            ENEMY: 2,
            BULLET: 4,
            WALL: 8
        }
    },

    // UI设置
    ui: {
        // 生命值条设置
        healthBar: {
            width: 200,
            height: 20,
            x: 20,
            y: 20,
            backgroundColor: '#333',
            healthColor: '#ff0000'
        },
        // 武器显示设置
        weaponDisplay: {
            x: 20,
            y: 50
        }
    }
};

// 将配置暴露到全局作用域
window.GameConfig = GameConfig;
