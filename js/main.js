// js/main.js
// 游戏主逻辑文件

// 等待GameConfig加载完成

// 游戏主类
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // 游戏对象引用
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.weaponGroup = null;
        
        // 输入控制
        this.cursors = null;
        this.mouse = null;
        
        // 游戏状态
        this.playerHealth = GameConfig.player.health;
        this.currentWeapon = 'sword';
        this.lastAttackTime = 0;
        this.lastDashTime = 0;
        this.isDashing = false;
        this.isPlayerInvulnerable = false;
        
        // 玩家方向状态
        this.playerDirection = 'down'; // 默认朝下
        this.lastMoveDirection = 'down';
        
        // 攻击动画交替状态
        this.currentAttackVariant = 0; // 当前攻击动画变体索引
        
        // 防止动画无限循环
        this.lastAnimationKey = null;
        this.currentPlayerState = 'idle';
        this.currentPlayerDirection = 'down';
        
        // UI元素
        this.healthText = null;
        this.weaponText = null;

        // 攻击范围指示器
        this.attackRangeIndicator = null;
    }

    // 预加载资源
    preload() {
        console.log('开始加载游戏资源...');
        
        // 添加加载事件监听
        this.load.on('complete', () => {
            console.log('所有资源加载完成');
        });
        
        this.load.on('loaderror', (file) => {
            console.error('资源加载失败:', file.key, file.url);
        });
        
        // 加载地图背景
        console.log('加载地图:', `assets/map/${GameConfig.map.asset}`);
        this.load.image('map', `assets/map/${GameConfig.map.asset}`);
        
        // 自动加载玩家动画资源
        this.loadPlayerAssets();
        
        // 自动加载敌人动画资源
        this.loadEnemyAssets();
        
        // 自动加载武器资源
        this.loadWeaponAssets();
        
        // 加载UI资源
        this.loadUI();
    }

    // 自动加载玩家资源
    loadPlayerAssets() {
        const prefix = GameConfig.player.assetPrefix;
        
        // 优先加载序列帧资源
        this.loadSpriteSheetAssets(prefix);
        
        // 然后加载单张图片作为备用
        this.loadSingleImageAssets(prefix);
    }

    // 加载单张图片资源（备用）
    loadSingleImageAssets(prefix) {
        // 加载四向动画资源
        GameConfig.directionalStates.forEach(state => {
            GameConfig.directions.forEach(direction => {
                const assetKey = `${prefix}_${state}_${direction}`;
                const assetPath = `assets/player/${prefix}_${state}_${direction}.png`;
                
                // 尝试加载资源
                this.load.image(assetKey, assetPath);
            });
        });
        
        // 兼容旧版本：加载无方向的动画资源
        GameConfig.animationStates.forEach(state => {
            const assetKey = `${prefix}_${state}`;
            const assetPath = `assets/player/${prefix}_${state}.png`;
            
            this.load.image(assetKey, assetPath);
        });
    }

    // 加载序列帧资源
    loadSpriteSheetAssets(prefix) {
        // 检查是否存在序列帧文件
        const spriteSheetStates = ['idle', 'move', 'attack1', 'attack2', 'hit', 'death', 'dash'];
        
        spriteSheetStates.forEach(state => {
            // 检查四向序列帧
            GameConfig.directions.forEach(direction => {
                const spriteSheetKey = `${prefix}_${state}_${direction}_sheet`;
                const spriteSheetPath = `assets/player/${prefix}_${state}_${direction}.png`;
                
                // 先加载图片，然后在create中动态计算帧尺寸
                this.load.image(spriteSheetKey, spriteSheetPath);
            });
            
            // 检查无方向序列帧
            const spriteSheetKey = `${prefix}_${state}_sheet`;
            const spriteSheetPath = `assets/player/${prefix}_${state}.png`;
            
            // 先加载图片，然后在create中动态计算帧尺寸
            this.load.image(spriteSheetKey, spriteSheetPath);
        });
    }

    // 获取状态对应的帧宽度
    getFrameWidthForState(state) {
        // 使用配置中的帧尺寸
        if (GameConfig.player.spriteSheet && GameConfig.player.spriteSheet.frameSize) {
            return GameConfig.player.spriteSheet.frameSize.width;
        }
        return 64; // 默认64像素
    }

    // 获取状态对应的帧高度
    getFrameHeightForState(state) {
        // 使用配置中的帧尺寸
        if (GameConfig.player.spriteSheet && GameConfig.player.spriteSheet.frameSize) {
            return GameConfig.player.spriteSheet.frameSize.height;
        }
        return 64; // 默认64像素
    }

    // 根据图片尺寸和帧数计算每帧尺寸
    calculateFrameSize(texture, frameCount) {
        const imageWidth = texture.source[0].width;
        const imageHeight = texture.source[0].height;
        
        // 假设是水平排列的8帧
        const frameWidth = imageWidth / frameCount;
        const frameHeight = imageHeight;
        
        console.log(`计算帧尺寸: 图片${imageWidth}x${imageHeight}, 帧数${frameCount}, 每帧${frameWidth}x${frameHeight}`);
        
        return { width: frameWidth, height: frameHeight };
    }

    // 自动加载敌人资源
    loadEnemyAssets() {
        Object.keys(GameConfig.enemies).forEach(enemyType => {
            const enemyConfig = GameConfig.enemies[enemyType];
            const prefix = enemyConfig.assetPrefix;

            // 检查是否是序列帧怪物
            if (enemyConfig.spriteSheet) {
                // 加载序列帧资源
                this.loadEnemySpriteSheetAssets(prefix, enemyType);
            } else {
                // 加载单张图片资源（兼容旧版）
                GameConfig.animationStates.forEach(state => {
                    const assetKey = `${enemyType}_${state}`;
                    const assetPath = `assets/enemies/${prefix}_${state}.png`;

                    // 只加载存在的资源
                    this.load.image(assetKey, assetPath);
                });
            }
        });
    }

    // 加载敌人序列帧资源
    loadEnemySpriteSheetAssets(prefix, enemyType) {
        const enemyConfig = GameConfig.enemies[enemyType];

        // 加载序列帧资源
        GameConfig.animationStates.forEach(state => {
            const spriteSheetKey = `${enemyType}_${state}_sheet`;
            const spriteSheetPath = `assets/enemies/${prefix}_${state}_347x192.png`;

            // 先加载图片，然后在create中动态计算帧尺寸
            this.load.image(spriteSheetKey, spriteSheetPath);
        });
    }

    // 自动加载武器资源
    loadWeaponAssets() {
        Object.keys(GameConfig.weapons).forEach(weaponType => {
            const weapon = GameConfig.weapons[weaponType];
            if (weapon.type === 'ranged' && weapon.bullet) {
                this.load.image('bullet', `assets/weapons/${weapon.bullet.asset}`);
            }
        });
    }

    // 加载UI资源
    loadUI() {
        // 不需要加载UI资源，直接使用Phaser的图形API创建
        console.log('UI资源加载完成（使用内置图形）');
    }

    // 创建游戏世界
    create() {
        console.log('创建游戏世界...');
        
        // 设置物理世界
        this.setupPhysics();
        console.log('物理世界设置完成');
        
        // 创建地图背景
        this.createMap();
        console.log('地图创建完成');
        
        // 创建玩家
        this.createPlayer();
        console.log('玩家创建完成');
        
        // 创建敌人
        this.createEnemies();
        console.log('敌人创建完成');
        
        // 创建武器组
        this.createWeaponGroups();
        console.log('武器组创建完成');
        
        // 设置输入控制
        this.setupInput();
        console.log('输入控制设置完成');
        
        // 创建UI
        this.createUI();
        console.log('UI创建完成');
        
        // 设置碰撞检测
        this.setupCollisions();
        console.log('碰撞检测设置完成');
        
        console.log('游戏世界创建完成！');
        
        // 添加窗口大小变化监听器
        this.setupResizeHandler();
    }

    // 设置物理世界
    setupPhysics() {
        // 启用Arcade物理系统
        this.physics.world.gravity.set(GameConfig.physics.gravity.x, GameConfig.physics.gravity.y);

        // 设置物理世界边界与屏幕匹配
        this.physics.world.setBounds(0, 0, GameConfig.width, GameConfig.height);
        console.log(`物理世界边界: 0,0 -> ${GameConfig.width}x${GameConfig.height}`);
    }

    // 创建地图
    createMap() {
        console.log('尝试创建地图背景...');
        
        // 检查地图资源是否存在
        if (!this.textures.exists('map')) {
            console.error('地图资源不存在！');
            // 创建一个简单的背景色
            this.add.rectangle(GameConfig.width / 2, GameConfig.height / 2, GameConfig.width, GameConfig.height, 0x2c3e50);
            return;
        }
        
        // 创建背景
        const map = this.add.image(GameConfig.width / 2, GameConfig.height / 2, 'map');
        
        // 计算缩放比例，确保地图铺满屏幕但不溢出
        const mapTexture = this.textures.get('map');
        const mapWidth = mapTexture.source[0].width;
        const mapHeight = mapTexture.source[0].height;
        
        // 计算缩放比例
        const scaleX = GameConfig.width / mapWidth;
        const scaleY = GameConfig.height / mapHeight;
        const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保铺满屏幕
        
        // 应用缩放
        map.setScale(scale);
        map.setDepth(-1000); // 确保背景在最底层
        
        console.log(`地图背景创建成功 - 原始尺寸: ${mapWidth}x${mapHeight}, 缩放比例: ${scale.toFixed(2)}`);
    }

    // 设置窗口大小变化处理
    setupResizeHandler() {
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            // 更新游戏配置
            GameConfig.width = window.innerWidth;
            GameConfig.height = window.innerHeight;

            // 重新调整游戏尺寸
            this.scale.resize(GameConfig.width, GameConfig.height);

            // 更新物理世界边界
            this.physics.world.setBounds(0, 0, GameConfig.width, GameConfig.height);

            // 重新调整地图
            this.resizeMap();

            console.log(`窗口大小变化 - 新尺寸: ${GameConfig.width}x${GameConfig.height}`);
        });
    }

    // 重新调整地图大小
    resizeMap() {
        // 查找地图对象
        const map = this.children.list.find(child => child.texture && child.texture.key === 'map');
        if (map) {
            // 重新计算缩放比例
            const mapTexture = this.textures.get('map');
            const mapWidth = mapTexture.source[0].width;
            const mapHeight = mapTexture.source[0].height;
            
            const scaleX = GameConfig.width / mapWidth;
            const scaleY = GameConfig.height / mapHeight;
            const scale = Math.max(scaleX, scaleY);
            
            // 更新地图位置和缩放
            map.setPosition(GameConfig.width / 2, GameConfig.height / 2);
            map.setScale(scale);
            
            console.log(`地图已重新调整 - 缩放比例: ${scale.toFixed(2)}`);
        }
    }

    // 创建玩家
    createPlayer() {
        console.log('尝试创建玩家...');
        
        // 优先使用序列帧纹理
        let playerTexture = 'player_idle_down_sheet';
        if (!this.textures.exists(playerTexture)) {
            // 尝试使用单张图片
            playerTexture = 'player_idle_down';
            if (!this.textures.exists(playerTexture)) {
                // 尝试无方向资源
                playerTexture = 'player_idle';
                if (!this.textures.exists(playerTexture)) {
                    console.error('玩家资源完全不存在！');
                    // 创建一个简单的矩形作为玩家
                    this.player = this.add.rectangle(GameConfig.width / 2, GameConfig.height / 2, 50, 50, 0xff0000);
                    return;
                }
            }
        }
        
        // 创建玩家精灵
        this.player = this.physics.add.sprite(GameConfig.width / 2, GameConfig.height / 2, playerTexture);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1.25); // 调整大小为2.5倍放大
        
        // 设置玩家物理属性
        this.player.setMaxVelocity(GameConfig.player.speed, GameConfig.player.speed);
        this.player.setDrag(800); // 添加阻力，让移动更自然

        // 设置碰撞范围与显示大小一致
        this.player.body.setSize(80, 80); // 80x80像素的碰撞范围

        // 调试信息：输出玩家大小和碰撞体设置
        console.log(`玩家显示大小: ${this.player.displayWidth}x${this.player.displayHeight}`);
        console.log(`碰撞体大小: ${this.player.body.width}x${this.player.body.height}`);
        console.log(`碰撞体偏移: (${this.player.body.offset.x}, ${this.player.body.offset.y})`);

        // 设置碰撞体偏移，确保碰撞体居中
        const offsetX = (this.player.displayWidth - 80) / 2;
        const offsetY = (this.player.displayHeight - 80) / 2;
        this.player.body.setOffset(offsetX, offsetY);
        console.log(`计算的偏移: (${offsetX}, ${offsetY})`);
        
        // 创建玩家动画
        this.createPlayerAnimations();
        
        // 设置玩家碰撞类别
        this.player.body.setCollisionCategory(GameConfig.physics.collisionCategories.PLAYER);
        
        console.log('玩家创建成功');
    }

    // 创建玩家动画
    createPlayerAnimations() {
        const prefix = GameConfig.player.assetPrefix;
        
        // 优先创建序列帧动画
        this.createSpriteSheetAnimations();
        
        // 然后创建单张图片动画作为备用
        this.createSingleImageAnimations(prefix);
        
        // 播放默认动画
        this.playPlayerAnimation('idle', 'down');
    }

    // 创建单张图片动画（备用）
    createSingleImageAnimations(prefix) {
        // 创建四向动画
        GameConfig.directionalStates.forEach(state => {
            GameConfig.directions.forEach(direction => {
                const assetKey = `${prefix}_${state}_${direction}`;
                const animKey = `${state}_${direction}`;
                
                // 检查资源是否存在且动画不存在
                if (this.textures.exists(assetKey) && !this.anims.exists(animKey)) {
                    // 创建动画
                    this.anims.create({
                        key: animKey,
                        frames: [{ key: assetKey }],
                        frameRate: 10,
                        repeat: state === 'idle' ? -1 : 0
                    });
                }
            });
        });
        
        // 兼容旧版本：创建无方向的动画
        GameConfig.animationStates.forEach(state => {
            const assetKey = `${prefix}_${state}`;
            
            if (this.textures.exists(assetKey) && !this.anims.exists(state)) {
                this.anims.create({
                    key: state,
                    frames: [{ key: assetKey }],
                    frameRate: 10,
                    repeat: state === 'idle' ? -1 : 0
                });
            }
        });
    }

    // 检测并创建序列帧动画
    createSpriteSheetAnimations() {
        const prefix = GameConfig.player.assetPrefix;
        
        // 检测序列帧并创建动画
        GameConfig.directionalStates.forEach(state => {
            GameConfig.directions.forEach(direction => {
                this.createDirectionalSpriteSheetAnimation(prefix, state, direction);
            });
        });
        
        // 检测无方向序列帧
        GameConfig.animationStates.forEach(state => {
            this.createSpriteSheetAnimation(prefix, state);
        });
        
        // 检测attack2动画（如果存在）
        this.createSpriteSheetAnimation(prefix, 'attack2');
        GameConfig.directions.forEach(direction => {
            this.createDirectionalSpriteSheetAnimation(prefix, 'attack2', direction);
        });
    }

    // 创建四向序列帧动画
    createDirectionalSpriteSheetAnimation(prefix, state, direction) {
        const spriteSheetKey = `${prefix}_${state}_${direction}_sheet`;
        const animKey = `${state}_${direction}`;
        
        // 检查动画是否已存在
        if (this.anims.exists(animKey)) {
            console.log(`动画已存在，跳过创建: ${animKey}`);
            return;
        }
        
        if (this.textures.exists(spriteSheetKey)) {
            const texture = this.textures.get(spriteSheetKey);
            const frameCount = this.detectFrameCount(texture, state);
            
            if (frameCount > 1) {
                console.log(`创建四向序列帧动画: ${animKey}, 帧数: ${frameCount}`);
                this.createAnimationFromSpriteSheet(spriteSheetKey, animKey, frameCount, state);
            }
        }
    }

    // 创建无方向序列帧动画
    createSpriteSheetAnimation(prefix, state) {
        const spriteSheetKey = `${prefix}_${state}_sheet`;
        
        // 检查动画是否已存在
        if (this.anims.exists(state)) {
            console.log(`动画已存在，跳过创建: ${state}`);
            return;
        }
        
        if (this.textures.exists(spriteSheetKey)) {
            const texture = this.textures.get(spriteSheetKey);
            const frameCount = this.detectFrameCount(texture, state);
            
            if (frameCount > 1) {
                console.log(`创建序列帧动画: ${state}, 帧数: ${frameCount}`);
                this.createAnimationFromSpriteSheet(spriteSheetKey, state, frameCount, state);
            }
        }
    }

    // 检测序列帧数量
    detectFrameCount(texture, state) {
        // 如果配置中指定了帧数，优先使用
        if (GameConfig.player.spriteSheet && GameConfig.player.spriteSheet.frameCounts[state]) {
            return GameConfig.player.spriteSheet.frameCounts[state];
        }
        
        // 如果禁用自动检测，返回1（单帧）
        if (GameConfig.player.spriteSheet && !GameConfig.player.spriteSheet.autoDetectFrames) {
            return 1;
        }
        
        // 根据状态和图片尺寸估算帧数
        const width = texture.source[0].width;
        const height = texture.source[0].height;
        
        // 假设每帧是正方形，根据宽度计算帧数
        let estimatedFrameCount = 1;
        
        // 根据状态估算帧数
        switch (state) {
            case 'idle':
                estimatedFrameCount = Math.max(1, Math.floor(width / height));
                break;
            case 'move':
                estimatedFrameCount = Math.max(2, Math.floor(width / height));
                break;
            case 'attack1':
            case 'attack2':
                estimatedFrameCount = Math.max(3, Math.floor(width / height));
                break;
            case 'hit':
                estimatedFrameCount = Math.max(2, Math.floor(width / height));
                break;
            case 'death':
                estimatedFrameCount = Math.max(4, Math.floor(width / height));
                break;
            case 'dash':
                estimatedFrameCount = Math.max(2, Math.floor(width / height));
                break;
            default:
                estimatedFrameCount = Math.max(1, Math.floor(width / height));
        }
        
        // 限制最大帧数
        return Math.min(estimatedFrameCount, 8);
    }

    // 从序列帧创建动画
    createAnimationFromSpriteSheet(spriteSheetKey, animKey, frameCount, state) {
        const texture = this.textures.get(spriteSheetKey);
        
        // 动态计算帧尺寸
        const frameSize = this.calculateFrameSize(texture, frameCount);
        
        console.log(`创建序列帧动画: ${animKey}, 帧数: ${frameCount}`);
        console.log(`图片尺寸: ${texture.source[0].width}x${texture.source[0].height}`);
        console.log(`计算帧尺寸: ${frameSize.width}x${frameSize.height}`);
        
        // 创建spritesheet纹理
        const spritesheetKey = `${spriteSheetKey}_spritesheet`;
        this.textures.addSpriteSheet(spritesheetKey, texture.source[0].image, {
            frameWidth: frameSize.width,
            frameHeight: frameSize.height
        });
        
        // 使用Phaser的内置序列帧功能
        this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(spritesheetKey, {
                start: 0,
                end: frameCount - 1
            }),
            frameRate: this.getFrameRateForState(state),
            repeat: this.getRepeatForState(state)
        });
    }

    // 根据状态获取帧率
    getFrameRateForState(state) {
        switch (state) {
            case 'idle':
                return 8;
            case 'move':
                return 12;
            case 'attack1':
            case 'attack2':
                return 15;
            case 'hit':
                return 10;
            case 'death':
                return 8;
            case 'dash':
                return 20;
            default:
                return 10;
        }
    }

    // 根据状态获取重复设置
    getRepeatForState(state) {
        switch (state) {
            case 'idle':
            case 'move':
                return -1; // 无限循环
            case 'attack1':
            case 'attack2':
            case 'hit':
            case 'dash':
                return 0; // 播放一次
            case 'death':
                return 0; // 播放一次
            default:
                return 0;
        }
    }

    // 播放玩家动画（支持四向和序列帧）
    playPlayerAnimation(state, direction) {
        const animKey = `${state}_${direction}`;
        
        // 防止无限循环
        if (this.lastAnimationKey === animKey) {
            return;
        }
        this.lastAnimationKey = animKey;
        
        // 优先尝试播放四向序列帧动画
        if (this.anims.exists(animKey)) {
            this.player.play(animKey);
            return;
        }
        
        // 尝试播放无方向序列帧动画
        if (this.anims.exists(state)) {
            this.player.play(state);
            return;
        }
        
        // 尝试播放四向单帧动画
        const singleFrameKey = `${state}_${direction}`;
        if (this.textures.exists(singleFrameKey)) {
            this.player.setTexture(singleFrameKey);
            return;
        }
        
        // 尝试播放无方向单帧动画
        if (this.textures.exists(state)) {
            this.player.setTexture(state);
            return;
        }
        
        // 如果attack2不存在，回退到attack1
        if (state === 'attack2') {
            this.playPlayerAnimation('attack1', direction);
            return;
        }
        
        console.warn(`玩家动画不存在: ${animKey} 或 ${state}`);
    }

    // 创建敌人
    createEnemies() {
        this.enemies = this.physics.add.group();

        // 创建几个moose1敌人
        for (let i = 0; i < 2; i++) {
            this.createEnemy('moose1', 200 + i * 250, 200 + i * 150);
        }
    }

    // 创建单个敌人
    createEnemy(enemyType, x, y) {
        const enemyConfig = GameConfig.enemies[enemyType];
        const enemy = this.physics.add.sprite(x, y, `${enemyType}_idle`);
        
        // 设置敌人属性
        // moose1需要适当的缩放比例
        if (enemyType === 'moose1') {
            enemy.setScale(1.2); // moose1放大4倍 (0.3 * 4)
        } else {
            enemy.setScale(0.5);
        }
        enemy.setCollideWorldBounds(true);
        enemy.setMaxVelocity(enemyConfig.speed, enemyConfig.speed);
        enemy.setDrag(400);

        // 设置碰撞范围
        if (enemyType === 'moose1') {
            // moose1的显示尺寸约为69x230像素，设置合适的碰撞范围
            enemy.body.setSize(50, 80); // 50x80像素的碰撞范围
        }

        // 设置敌人数据
        enemy.setData('type', enemyType);
        enemy.setData('health', enemyConfig.health);
        enemy.setData('maxHealth', enemyConfig.health);
        enemy.setData('damage', enemyConfig.damage);
        enemy.setData('attackRange', enemyConfig.attackRange);
        enemy.setData('visionRange', enemyConfig.visionRange);
        enemy.setData('lastAttackTime', 0);
        enemy.setData('isDead', false);
        
        // 设置碰撞类别
        enemy.body.setCollisionCategory(GameConfig.physics.collisionCategories.ENEMY);
        
        // 创建敌人动画
        this.createEnemyAnimations(enemy, enemyType);
        
        this.enemies.add(enemy);
    }

    // 创建敌人动画
    createEnemyAnimations(enemy, enemyType) {
        const enemyConfig = GameConfig.enemies[enemyType];
        const prefix = enemyConfig.assetPrefix;

        // 检查是否是序列帧怪物
        if (enemyConfig.spriteSheet) {
            // 创建序列帧动画
            this.createEnemySpriteSheetAnimations(enemy, enemyType);
        } else {
            // 创建单张图片动画（兼容旧版）
            GameConfig.animationStates.forEach(state => {
                const assetKey = `${enemyType}_${state}`;

                if (this.textures.exists(assetKey)) {
                    this.anims.create({
                        key: `${enemyType}_${state}`,
                        frames: [{ key: assetKey }],
                        frameRate: 8,
                        repeat: state === 'idle' ? -1 : 0
                    });
                }
            });
        }

        // 播放默认动画
        if (this.anims.exists(`${enemyType}_idle`)) {
            enemy.play(`${enemyType}_idle`);
        }
    }

    // 创建敌人序列帧动画
    createEnemySpriteSheetAnimations(enemy, enemyType) {
        const enemyConfig = GameConfig.enemies[enemyType];

        GameConfig.animationStates.forEach(state => {
            const spriteSheetKey = `${enemyType}_${state}_sheet`;

            if (this.textures.exists(spriteSheetKey)) {
                const texture = this.textures.get(spriteSheetKey);
                const frameCount = enemyConfig.spriteSheet.frameCounts[state] || 1;

                if (frameCount > 1) {
                    console.log(`创建敌人序列帧动画: ${enemyType}_${state}, 帧数: ${frameCount}`);
                    this.createAnimationFromSpriteSheet(spriteSheetKey, `${enemyType}_${state}`, frameCount, state);
                } else {
                    // 单帧动画
                    this.anims.create({
                        key: `${enemyType}_${state}`,
                        frames: [{ key: spriteSheetKey }],
                        frameRate: 8,
                        repeat: state === 'idle' ? -1 : 0
                    });
                }
            }
        });
    }

    // 创建武器组
    createWeaponGroups() {
        this.bullets = this.physics.add.group();
        this.weaponGroup = this.physics.add.group();
    }

    // 设置输入控制
    setupInput() {
        // 键盘输入
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // 鼠标输入
        this.mouse = this.input.mouse;
        
        // 鼠标左键攻击
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleAttack();
            }
        });
    }

    // 创建UI
    createUI() {
        // 生命值显示
        this.healthText = this.add.text(GameConfig.ui.healthBar.x, GameConfig.ui.healthBar.y,
            `生命值: ${this.playerHealth}`,
            { fontSize: '18px', fill: '#ffffff' });

        // 武器显示
        this.weaponText = this.add.text(GameConfig.ui.weaponDisplay.x, GameConfig.ui.weaponDisplay.y,
            `武器: ${this.getWeaponDisplayName()}`,
            { fontSize: '18px', fill: '#ffffff' });

        // 创建攻击范围指示器
        this.createAttackRangeIndicator();
    }

    // 创建攻击范围指示器
    createAttackRangeIndicator() {
        // 创建一个图形对象用于绘制攻击范围
        this.attackRangeIndicator = this.add.graphics();
        this.attackRangeIndicator.setDepth(100); // 确保在最上层显示

        // 初始时隐藏
        this.attackRangeIndicator.setVisible(false);
    }

    // 更新攻击范围指示器
    updateAttackRangeIndicator() {
        if (!this.attackRangeIndicator) return;

        this.attackRangeIndicator.clear();

        // 获取当前武器的攻击范围
        const weapon = GameConfig.weapons[this.currentWeapon];
        if (!weapon || !weapon.range) {
            this.attackRangeIndicator.setVisible(false);
            return;
        }

        const attackRange = weapon.range;

        // 设置样式：更明显的红色虚线
        this.attackRangeIndicator.lineStyle(4, 0xff0000, 1); // 更粗的线条

        // 绘制虚线圆圈
        this.drawDashedCircle(this.attackRangeIndicator, this.player.x, this.player.y, attackRange, 15, 8);

        // 添加半透明填充区域，让范围更明显
        this.attackRangeIndicator.fillStyle(0xff0000, 0.1); // 红色半透明填充
        this.attackRangeIndicator.fillCircle(this.player.x, this.player.y, attackRange);

        // 重新绘制边框，确保边框在填充之上
        this.attackRangeIndicator.lineStyle(4, 0xff0000, 1);
        this.drawDashedCircle(this.attackRangeIndicator, this.player.x, this.player.y, attackRange, 15, 8);

        this.attackRangeIndicator.setVisible(true);
    }

    // 绘制虚线圆圈
    drawDashedCircle(graphics, x, y, radius, dashLength, gapLength) {
        const circumference = 2 * Math.PI * radius;
        const totalSegments = Math.ceil(circumference / (dashLength + gapLength));
        const angleStep = (2 * Math.PI) / totalSegments;

        for (let i = 0; i < totalSegments; i++) {
            const startAngle = i * angleStep;
            const endAngle = startAngle + (dashLength / circumference) * 2 * Math.PI;

            const startX = x + Math.cos(startAngle) * radius;
            const startY = y + Math.sin(startAngle) * radius;
            const endX = x + Math.cos(endAngle) * radius;
            const endY = y + Math.sin(endAngle) * radius;

            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
        }
    }

    // 设置碰撞检测
    setupCollisions() {
        // 子弹与敌人碰撞
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        
        // 玩家与敌人碰撞
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
    }

    // 游戏主循环
    update(time, delta) {
        // 更新玩家控制
        this.updatePlayerControl(time, delta);

        // 更新敌人AI
        this.updateEnemyAI(time, delta);

        // 更新子弹
        this.updateBullets(time, delta);

        // 更新攻击范围指示器
        this.updateAttackRangeIndicator();

        // 更新UI
        this.updateUI();

        // 调试信息：输出玩家位置（减少频率）
        if (time % 1000 < 50) { // 每秒输出一次
            console.log(`玩家位置: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)})`);
        }
    }

    // 更新玩家控制
    updatePlayerControl(time, delta) {
        if (!this.player || this.playerHealth <= 0) return;
        
        // 处理冲刺
        this.handleDash(time);
        
        // 处理移动
        this.handleMovement(time, delta);
    }

    // 处理冲刺
    handleDash(time) {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isDashing) {
            const timeSinceLastDash = time - this.lastDashTime;
            if (timeSinceLastDash >= GameConfig.player.dash.cooldown) {
                this.startDash(time);
            }
        }
        
        // 更新冲刺状态
        if (this.isDashing) {
            const dashDuration = time - this.dashStartTime;
            if (dashDuration >= GameConfig.player.dash.duration) {
                this.endDash();
            }
        }
    }

    // 开始冲刺
    startDash(time) {
        this.isDashing = true;
        this.dashStartTime = time;
        this.lastDashTime = time;

        // 计算冲刺方向 - 如果没有方向输入，使用当前面向
        let dashDirection = this.getCurrentFacingDirection();
        console.log(`开始冲刺 - 当前动画: ${this.player.anims?.currentAnim?.key}, 获取的方向: ${dashDirection}`);

        // 检查是否有方向输入
        let hasInput = false;
        let moveX = 0;
        let moveY = 0;

        // WASD控制
        if (this.wasd.A.isDown) { moveX -= 1; hasInput = true; }
        if (this.wasd.D.isDown) { moveX += 1; hasInput = true; }
        if (this.wasd.W.isDown) { moveY -= 1; hasInput = true; }
        if (this.wasd.S.isDown) { moveY += 1; hasInput = true; }

        // 方向键控制
        if (this.cursors.left.isDown) { moveX -= 1; hasInput = true; }
        if (this.cursors.right.isDown) { moveX += 1; hasInput = true; }
        if (this.cursors.up.isDown) { moveY -= 1; hasInput = true; }
        if (this.cursors.down.isDown) { moveY += 1; hasInput = true; }

        // 如果有方向输入，根据输入确定冲刺方向
        if (hasInput) {
            if (Math.abs(moveY) > Math.abs(moveX)) {
                // 垂直移动优先
                if (moveY < 0) {
                    dashDirection = 'up';
                } else if (moveY > 0) {
                    dashDirection = 'down';
                }
            } else if (Math.abs(moveX) > 0) {
                // 水平移动
                if (moveX < 0) {
                    dashDirection = 'left';
                } else if (moveX > 0) {
                    dashDirection = 'right';
                }
            }
        }
        // 如果没有方向输入，dashDirection保持为this.playerDirection（当前面向）

        // 设置冲刺速度和方向
        const dashSpeed = GameConfig.player.speed * GameConfig.player.dash.speedMultiplier;
        this.player.setMaxVelocity(dashSpeed, dashSpeed);

        // 根据冲刺方向设置实际速度
        let velocityX = 0;
        let velocityY = 0;
        switch (dashDirection) {
            case 'up':
                velocityY = -dashSpeed;
                break;
            case 'down':
                velocityY = dashSpeed;
                break;
            case 'left':
                velocityX = -dashSpeed;
                break;
            case 'right':
                velocityX = dashSpeed;
                break;
        }
        this.player.setVelocity(velocityX, velocityY);

        // 播放冲刺动画
        this.playPlayerAnimation('dash', dashDirection);

        // 冲刺期间无敌
        this.isPlayerInvulnerable = true;

        console.log(`玩家开始冲刺，方向: ${dashDirection}`);
    }

    // 结束冲刺
    endDash() {
        this.isDashing = false;

        // 恢复正常速度
        this.player.setMaxVelocity(GameConfig.player.speed, GameConfig.player.speed);

        // 检查是否有移动输入
        const hasMovementInput = this.hasMovementInput();

        // 根据是否有移动输入决定播放移动还是idle动画
        const facingDirection = this.getCurrentFacingDirection();
        if (hasMovementInput) {
            this.playPlayerAnimation('move', facingDirection);
        } else {
            this.playPlayerAnimation('idle', facingDirection);
        }

        // 延迟结束无敌状态
        this.time.delayedCall(200, () => {
            this.isPlayerInvulnerable = false;
        });

        console.log('玩家结束冲刺');
    }

    // 检查是否有移动输入
    hasMovementInput() {
        // WASD控制
        if (this.wasd.A.isDown || this.wasd.D.isDown || this.wasd.W.isDown || this.wasd.S.isDown) {
            return true;
        }

        // 方向键控制
        if (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown) {
            return true;
        }

        return false;
    }

    // 获取玩家当前面向方向
    getCurrentFacingDirection() {
        // 尝试从当前动画中提取方向
        if (this.player.anims && this.player.anims.currentAnim) {
            const animKey = this.player.anims.currentAnim.key;
            console.log(`获取当前面向 - 动画key: ${animKey}`);
            // 动画key格式为 state_direction，比如 idle_down, move_left
            const parts = animKey.split('_');
            if (parts.length >= 2) {
                const direction = parts[parts.length - 1]; // 取最后一部分作为方向
                if (['up', 'down', 'left', 'right'].includes(direction)) {
                    console.log(`从动画提取方向: ${direction}`);
                    return direction;
                }
            }
        }

        // 如果无法从动画获取，使用最后移动方向
        console.log(`使用最后移动方向: ${this.lastMoveDirection}`);
        return this.lastMoveDirection;
    }

    // 处理移动
    handleMovement(time, delta) {
        const velocity = this.player.body.velocity;
        let isMoving = false;
        
        // 计算移动方向
        let moveX = 0;
        let moveY = 0;
        
        // WASD控制
        if (this.wasd.A.isDown) moveX -= 1;
        if (this.wasd.D.isDown) moveX += 1;
        if (this.wasd.W.isDown) moveY -= 1;
        if (this.wasd.S.isDown) moveY += 1;
        
        // 方向键控制
        if (this.cursors.left.isDown) moveX -= 1;
        if (this.cursors.right.isDown) moveX += 1;
        if (this.cursors.up.isDown) moveY -= 1;
        if (this.cursors.down.isDown) moveY += 1;
        
        // 标准化对角线移动
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707; // 1/√2
            moveY *= 0.707;
        }
        
        // 应用移动
        if (moveX !== 0 || moveY !== 0) {
            isMoving = true;
            this.player.setVelocity(moveX * this.player.body.maxVelocity.x, moveY * this.player.body.maxVelocity.y);
            
            // 更新玩家方向
            this.updatePlayerDirection(moveX, moveY);
        } else {
            this.player.setVelocity(0, 0);
        }
        
        // 更新动画
        this.updatePlayerAnimation(isMoving);
    }

    // 更新玩家方向
    updatePlayerDirection(moveX, moveY) {
        let newDirection = this.playerDirection;
        
        // 只有在有移动输入时才更新方向
        if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
            // 根据移动方向确定玩家朝向
            if (Math.abs(moveY) > Math.abs(moveX)) {
                // 垂直移动优先
                if (moveY < 0) {
                    newDirection = 'up';
                } else if (moveY > 0) {
                    newDirection = 'down';
                }
            } else if (Math.abs(moveX) > 0) {
                // 水平移动
                if (moveX < 0) {
                    newDirection = 'left';
                } else if (moveX > 0) {
                    newDirection = 'right';
                }
            }
            
            // 更新方向
            if (newDirection !== this.playerDirection) {
                this.playerDirection = newDirection;
                this.lastMoveDirection = newDirection;
            }
        }
    }

    // 更新玩家动画
    updatePlayerAnimation(isMoving) {
        if (this.isDashing) return; // 冲刺时保持冲刺动画
        
        const state = isMoving ? 'move' : 'idle';
        const direction = this.playerDirection;
        
        // 检查状态是否真的改变了
        if (this.currentPlayerState !== state || this.currentPlayerDirection !== direction) {
            this.currentPlayerState = state;
            this.currentPlayerDirection = direction;
            
            // 播放对应方向和状态的动画
            this.playPlayerAnimation(state, direction);
        }
    }

    // 处理攻击
    handleAttack() {
        const currentTime = this.time.now;
        const weapon = GameConfig.weapons[this.currentWeapon];
        
        // 检查攻击冷却
        if (currentTime - this.lastAttackTime < weapon.cooldown) {
            return;
        }
        
        this.lastAttackTime = currentTime;
        
        // 选择攻击动画变体
        this.selectAttackVariant();
        
        if (weapon.type === 'melee') {
            this.performMeleeAttack();
        } else if (weapon.type === 'ranged') {
            this.performRangedAttack();
        }
    }

    // 选择攻击动画变体
    selectAttackVariant() {
        if (GameConfig.player.spriteSheet && GameConfig.player.spriteSheet.attackAlternate) {
            const variants = GameConfig.player.spriteSheet.attackVariants;
            if (variants && variants.length > 1) {
                // 交替选择攻击动画
                this.currentAttackVariant = (this.currentAttackVariant + 1) % variants.length;
                console.log(`选择攻击动画变体: ${variants[this.currentAttackVariant]}`);
            }
        }
    }

    // 获取当前攻击动画状态
    getCurrentAttackState() {
        if (GameConfig.player.spriteSheet && GameConfig.player.spriteSheet.attackAlternate) {
            const variants = GameConfig.player.spriteSheet.attackVariants;
            if (variants && variants.length > 0) {
                return variants[this.currentAttackVariant];
            }
        }
        return 'attack1'; // 默认使用attack1
    }

    // 执行近战攻击
    performMeleeAttack() {
        const attackState = this.getCurrentAttackState();
        console.log(`执行近战攻击 - 使用动画: ${attackState}`);
        
        // 播放攻击动画
        this.playPlayerAnimation(attackState, this.playerDirection);
        
        // 创建攻击判定区域
        const weapon = GameConfig.weapons[this.currentWeapon];
        const attackRange = weapon.range;
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // 检查范围内的敌人
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.getData('isDead')) return;
            
            const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (distance <= attackRange) {
                this.damageEnemy(enemy, weapon.damage);
            }
        });
        
        // 攻击判定持续时间后，根据移动状态决定播放idle还是move动画
        this.time.delayedCall(weapon.attackDuration, () => {
            // 检查是否有移动输入
            const hasMovementInput = this.hasMovementInput();

            if (hasMovementInput) {
                // 如果有移动输入，播放移动动画
                this.playPlayerAnimation('move', this.playerDirection);
            } else {
                // 如果没有移动输入，播放待机动画
                this.playPlayerAnimation('idle', this.playerDirection);
            }
        });
    }

    // 执行远程攻击
    performRangedAttack() {
        const attackState = this.getCurrentAttackState();
        console.log(`执行远程攻击 - 使用动画: ${attackState}`);
        
        // 播放攻击动画
        this.playPlayerAnimation(attackState, this.playerDirection);
        
        // 创建子弹
        const weapon = GameConfig.weapons[this.currentWeapon];
        const bullet = this.physics.add.sprite(this.player.x, this.player.y, 'bullet');
        
        // 设置子弹属性
        bullet.setScale(0.3);
        bullet.setData('damage', weapon.damage);
        bullet.setData('maxDistance', weapon.bullet.maxDistance);
        bullet.setData('startX', this.player.x);
        bullet.setData('startY', this.player.y);
        
        // 计算子弹方向（朝向鼠标）
        const mouseX = this.input.mousePointer.x;
        const mouseY = this.input.mousePointer.y;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, mouseX, mouseY);
        
        // 设置子弹速度和方向
        const velocityX = Math.cos(angle) * weapon.bullet.speed;
        const velocityY = Math.sin(angle) * weapon.bullet.speed;
        bullet.setVelocity(velocityX, velocityY);
        bullet.setRotation(angle);
        
        // 设置碰撞类别
        bullet.body.setCollisionCategory(GameConfig.physics.collisionCategories.BULLET);
        
        this.bullets.add(bullet);
        
        // 攻击动画结束后，根据移动状态决定播放idle还是move动画
        this.time.delayedCall(200, () => {
            // 检查是否有移动输入
            const hasMovementInput = this.hasMovementInput();

            if (hasMovementInput) {
                // 如果有移动输入，播放移动动画
                this.playPlayerAnimation('move', this.playerDirection);
            } else {
                // 如果没有移动输入，播放待机动画
                this.playPlayerAnimation('idle', this.playerDirection);
            }
        });
    }

    // 更新敌人AI
    updateEnemyAI(time, delta) {
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.getData('isDead')) return;
            
            this.updateSingleEnemyAI(enemy, time, delta);
        });
    }

    // 更新单个敌人AI
    updateSingleEnemyAI(enemy, time, delta) {
        const playerX = this.player.x;
        const playerY = this.player.y;
        const enemyX = enemy.x;
        const enemyY = enemy.y;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(enemyX, enemyY, playerX, playerY);
        const visionRange = enemy.getData('visionRange');
        const attackRange = enemy.getData('attackRange');
        const enemyType = enemy.getData('type');

        // 检查是否在视野范围内
        if (distanceToPlayer <= visionRange) {
            // 朝玩家移动
            if (distanceToPlayer > attackRange) {
                this.moveEnemyTowardsPlayer(enemy, playerX, playerY);

                // 播放移动动画
                if (this.anims.exists(`${enemyType}_move`)) {
                    enemy.play(`${enemyType}_move`, true); // 允许重复播放同一动画
                }
            } else {
                // 在攻击范围内，停止移动
                enemy.setVelocity(0, 0);

                // 检查攻击冷却
                const lastAttackTime = enemy.getData('lastAttackTime');
                const attackCooldown = GameConfig.enemies[enemyType].attackCooldown;

                if (time - lastAttackTime >= attackCooldown) {
                    // 可以攻击，播放攻击动画
                    this.enemyAttackPlayer(enemy);
                    enemy.setData('lastAttackTime', time);
                } else {
                    // 在攻击冷却中，播放待机动画
                    if (this.anims.exists(`${enemyType}_idle`)) {
                        enemy.play(`${enemyType}_idle`, true); // 允许重复播放同一动画
                    }
                }
            }
        } else {
            // 不在视野范围内，停止移动
            enemy.setVelocity(0, 0);

            // 播放待机动画
            if (this.anims.exists(`${enemyType}_idle`)) {
                enemy.play(`${enemyType}_idle`, true); // 允许重复播放同一动画
            }
        }
    }

    // 移动敌人朝玩家方向
    moveEnemyTowardsPlayer(enemy, playerX, playerY) {
        const enemyX = enemy.x;
        const enemyY = enemy.y;
        
        // 计算方向
        const angle = Phaser.Math.Angle.Between(enemyX, enemyY, playerX, playerY);
        const speed = enemy.getData('speed') || 80;
        
        // 应用移动
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        enemy.setVelocity(velocityX, velocityY);
    }

    // 敌人攻击玩家
    enemyAttackPlayer(enemy) {
        if (this.isPlayerInvulnerable || this.isDashing) return;

        const enemyType = enemy.getData('type');

        // 播放攻击动画
        if (this.anims.exists(`${enemyType}_attack1`)) {
            enemy.play(`${enemyType}_attack1`);

            // 攻击动画播放完毕后恢复到移动或待机状态
            enemy.once('animationcomplete', (animation) => {
                if (animation.key === `${enemyType}_attack1`) {
                    const distanceToPlayer = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y, this.player.x, this.player.y
                    );
                    const attackRange = enemy.getData('attackRange');

                    if (distanceToPlayer > attackRange) {
                        enemy.play(`${enemyType}_move`);
                    } else {
                        enemy.play(`${enemyType}_idle`);
                    }
                }
            });
        }

        const damage = enemy.getData('damage');
        this.damagePlayer(damage);

        console.log(`敌人攻击玩家，造成 ${damage} 点伤害`);
    }

    // 更新子弹
    updateBullets(time, delta) {
        this.bullets.children.entries.forEach(bullet => {
            const startX = bullet.getData('startX');
            const startY = bullet.getData('startY');
            const maxDistance = bullet.getData('maxDistance');
            
            // 检查是否超出最大距离
            const distance = Phaser.Math.Distance.Between(startX, startY, bullet.x, bullet.y);
            if (distance >= maxDistance) {
                bullet.destroy();
            }
        });
    }

    // 子弹击中敌人
    bulletHitEnemy(bullet, enemy) {
        if (enemy.getData('isDead')) return;
        
        const damage = bullet.getData('damage');
        this.damageEnemy(enemy, damage);
        
        // 播放击中效果
        if (this.anims.exists('hit')) {
            enemy.play('hit');
        }
        
        bullet.destroy();
        console.log(`子弹击中敌人，造成 ${damage} 点伤害`);
    }

    // 玩家被敌人击中
    playerHitEnemy(player, enemy) {
        if (this.isPlayerInvulnerable || this.isDashing || enemy.getData('isDead')) return;
        
        const damage = enemy.getData('damage');
        this.damagePlayer(damage);
        
        console.log(`玩家被敌人击中，造成 ${damage} 点伤害`);
    }

    // 对敌人造成伤害
    damageEnemy(enemy, damage) {
        const currentHealth = enemy.getData('health');
        const newHealth = Math.max(0, currentHealth - damage);
        enemy.setData('health', newHealth);
        
        console.log(`敌人受到 ${damage} 点伤害，剩余生命值: ${newHealth}`);
        
        if (newHealth <= 0) {
            this.killEnemy(enemy);
        }
    }

    // 杀死敌人
    killEnemy(enemy) {
        enemy.setData('isDead', true);

        const enemyType = enemy.getData('type');

        // 播放死亡动画
        if (this.anims.exists(`${enemyType}_death`)) {
            enemy.play(`${enemyType}_death`);

            // 等待死亡动画播放完毕后销毁敌人
            enemy.once('animationcomplete', (animation) => {
                if (animation.key === `${enemyType}_death`) {
                    // 计算动画时长并延迟销毁
                    const frameRate = this.getFrameRateForState('death'); // 8帧每秒
                    const frameCount = GameConfig.enemies[enemyType]?.spriteSheet?.frameCounts?.death || 7;
                    const animationDuration = (frameCount / frameRate) * 1000; // 毫秒

                    this.time.delayedCall(animationDuration, () => {
                        enemy.destroy();
                    });
                }
            });
        } else {
            // 如果没有死亡动画，直接销毁
            enemy.destroy();
        }

        console.log('敌人死亡');
    }

    // 对玩家造成伤害
    damagePlayer(damage) {
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        
        // 设置无敌状态
        this.isPlayerInvulnerable = true;
        this.time.delayedCall(GameConfig.player.invulnerabilityDuration, () => {
            this.isPlayerInvulnerable = false;
        });
        
        // 播放受伤动画
        this.playPlayerAnimation('hit', this.playerDirection);
        
        // 玩家闪烁效果
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });
        
        console.log(`玩家受到 ${damage} 点伤害，剩余生命值: ${this.playerHealth}`);
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    // 游戏结束
    gameOver() {
        console.log('游戏结束');
        
        // 停止所有游戏对象
        this.physics.pause();
        
        // 显示游戏结束文本
        const gameOverText = this.add.text(GameConfig.width / 2, GameConfig.height / 2, 
            '游戏结束\n按R键重新开始', 
            { fontSize: '32px', fill: '#ff0000', align: 'center' });
        gameOverText.setOrigin(0.5);
        
        // 重新开始游戏
        this.input.keyboard.on('keydown-R', () => {
            this.scene.restart();
        });
    }

    // 更新UI
    updateUI() {
        if (this.healthText) {
            this.healthText.setText(`生命值: ${this.playerHealth}`);
        }
        
        if (this.weaponText) {
            this.weaponText.setText(`武器: ${this.getWeaponDisplayName()}`);
        }
    }

    // 获取武器显示名称
    getWeaponDisplayName() {
        const weaponNames = {
            'sword': '剑',
            'pistol': '手枪'
        };
        return weaponNames[this.currentWeapon] || this.currentWeapon;
    }
}

// 等待页面加载完成后再启动游戏
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始启动游戏...');
    
    // 检查GameConfig是否已加载
    if (typeof GameConfig === 'undefined') {
        console.error('GameConfig未加载，无法启动游戏');
        return;
    }
    
    console.log('GameConfig已加载，游戏尺寸：', GameConfig.width, 'x', GameConfig.height);
    
    // 游戏配置
    const config = {
        type: Phaser.AUTO,
        width: GameConfig.width,
        height: GameConfig.height,
        parent: 'game-container',
        backgroundColor: '#2c3e50',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%'
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: GameConfig.physics.gravity,
                debug: false
            }
        },
        scene: GameScene
    };
    
    // 启动游戏
    console.log('启动游戏...');
    try {
        const game = new Phaser.Game(config);
        window.game = game;
        console.log('游戏启动成功');
    } catch (error) {
        console.error('游戏启动失败:', error);
    }
});
