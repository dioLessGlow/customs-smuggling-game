class GenericLevelScene extends Phaser.Scene {
  constructor(config) { super(config || { key: 'GenericLevelScene' }); }

  preload() {
    if (!this.textures.exists('luggage')) this._createTextures();
  }

  _createTextures() {
    const { width, height } = this.scale;

    const l = this.make.graphics({ add: false });
    l.fillStyle(0x8B6914); l.fillRoundedRect(0, 0, 120, 100, 10);
    l.fillStyle(0x6B4E0A); l.fillRoundedRect(10, 10, 100, 80, 5);
    l.fillStyle(0x4A3506); l.fillRect(45, 0, 30, 20);
    l.generateTexture('luggage', 120, 100);

    const s = this.make.graphics({ add: false });
    s.lineStyle(3, 0x00e676); s.strokeRect(0, 0, 160, 140);
    s.lineStyle(2, 0x00e676, 0.5); s.strokeRect(10, 10, 140, 120);
    s.generateTexture('scanFrame', 160, 140);

    const sl = this.make.graphics({ add: false });
    sl.fillStyle(0x00e676, 0.6); sl.fillRect(0, 0, 160, 3);
    sl.generateTexture('scanLine', 160, 3);

    const f = this.make.graphics({ add: false });
    f.fillStyle(0xffffff); f.fillCircle(8, 8, 8);
    f.generateTexture('flare', 16, 16);

    const st = this.make.graphics({ add: false });
    st.lineStyle(4, 0xff0000); st.strokeCircle(40, 40, 35);
    st.lineStyle(2, 0xff0000); st.strokeCircle(40, 40, 28);
    st.generateTexture('stamp', 80, 80);

    const mg = this.make.graphics({ add: false });
    mg.lineStyle(4, 0xffffff); mg.strokeCircle(30, 30, 25);
    mg.lineStyle(6, 0xffffff); mg.beginPath();
    mg.moveTo(48, 48); mg.lineTo(70, 70); mg.strokePath();
    mg.generateTexture('magnifier', 75, 75);

    const echo = this.make.graphics({ add: false });
    echo.lineStyle(3, 0xffd700); echo.strokeCircle(20, 20, 18);
    echo.lineStyle(2, 0xffd700, 0.5); echo.strokeCircle(20, 20, 14);
    echo.fillStyle(0xffd700, 0.1); echo.fillCircle(20, 20, 18);
    echo.generateTexture('echoRing', 40, 40);
  }

  init(data) {
    this.levelId = data.levelId || 'k01';
    this._findConfig();
    this._resetState();
    this._buildItemPool();
  }

  _findConfig() {
    const found = LEVELS.find(l => l.id === this.levelId);
    this.config = found || LEVELS[0];
  }

  _resetState() {
    const cfg = this.config;
    this.timeLimit = cfg.time;
    this.itemsPerWave = cfg.items;
    this.requiredCorrect = cfg.required;
    this.currentItem = 0;
    this.score = 0;
    this.dao = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.combo = 0;
    this.gameState = 'waiting';
    this.revealedHiddenRule = false;
    this.isEnding = false;
    this._alarmActive = false;
    this._alarmTimer = null;
    this.retriesLeft = 0;
    this.paused = false;
    this.echoActive = null;
    this.magnifierUses = cfg.mechanic === 'magnifier' ? 3 : 0;
    this.comboProtected = false;
    this.consecutiveWrong = 0;
    this.scanSpeed = 1;
    this.penaltyMod = 0;
    this.comboBonus = 0;
    this.showCategory = false;
    this.showRisk = false;
    this.ownedIntuitions = [];
    this.save = SaveManager.load();
    this._applyShopEffects();
    this.maxTime = this.timeLimit;
  }

  _applyShopEffects() {
    var s = this.save;
    var tutor = this.config.tutor;
    if (s.shopItems.indexOf('eagle_1') >= 0) this.score += 5;
    if (s.shopItems.indexOf('eagle_2') >= 0) this.score += 10;
    if (s.shopItems.indexOf('eagle_3') >= 0) this.score += 20;
    if (s.shopItems.indexOf('intuition_boost') >= 0) this.scanSpeed = 0.8;
    if (s.shopItems.indexOf('magnifier_1') >= 0) this.magnifierUses += 1;
    if (s.shopItems.indexOf('magnifier_2') >= 0) this.magnifierUses += 2;
    this.showCategory = s.shopItems.indexOf('xray_1') >= 0;
    this.showRisk = s.shopItems.indexOf('spectrum_1') >= 0;
    if (tutor) {
      s.shopKnowledge.forEach(function(kid) {
        var cfg = SHOP.knowledge.find(function(sk) { return sk.id === kid; });
        if (!cfg || cfg.effect.tutor !== tutor) return;
        switch(cfg.effect.type) {
          case 'tutorAlarm': this.score += cfg.effect.value; break;
          case 'tutorTime': this.timeLimit += cfg.effect.value; break;
          case 'tutorPenalty': this.penaltyMod += cfg.effect.value; break;
          case 'tutorMagnifier': this.magnifierUses += cfg.effect.value; break;
          case 'tutorCombo': this.comboBonus += cfg.effect.value; break;
        }
      }, this);
    }
    if (s.shopKnowledge.indexOf('k36') >= 0) this.score += 2;
    this.ownedIntuitions = s.shopItems.filter(function(id) {
      return SHOP.intuitions.some(function(inst) { return inst.id === id; });
    });
  }

  _buildItemPool() {
    const RAT_POOL = [
      { name: '奶粉', icon: '🍼', type: 'legal', cat: '食品', dw: 400 },
      { name: '保健品', icon: '🧴', type: 'legal', cat: '保健品', dw: 300 },
      { name: '红酒', icon: '🍷', type: 'legal', cat: '食品', dw: 750 },
      { name: '化妆品', icon: '💄', type: 'legal', cat: '化妆品', dw: 200 },
      { name: '糖果', icon: '🍬', type: 'legal', cat: '食品', dw: 250 },
      { name: '巧克力', icon: '🍫', type: 'legal', cat: '食品', dw: 200 },
      { name: '茶叶', icon: '🍵', type: 'legal', cat: '食品', dw: 300 },
      { name: '蜂蜜', icon: '🍯', type: 'legal', cat: '食品', dw: 350 },
      { name: '坚果', icon: '🥜', type: 'legal', cat: '食品', dw: 250 },
      { name: '咖啡', icon: '☕', type: 'legal', cat: '食品', dw: 200 },
      { name: '走私手机', icon: '📱', type: 'illegal', cat: '电子产品', dw: 200 },
      { name: '假包', icon: '👛', type: 'illegal', cat: '假冒伪劣', dw: 250 },
      { name: '水客药品', icon: '💉', type: 'illegal', cat: '药品', dw: 150 },
      { name: '毒品', icon: '💊', type: 'illegal', cat: '毒品', risk: true, dw: 100 },
      { name: '走私名表', icon: '⌚', type: 'illegal', cat: '奢侈品', dw: 150 },
      { name: '走私香烟', icon: '🚬', type: 'illegal', cat: '烟草', dw: 300 },
      { name: '走私燕窝', icon: '🥣', type: 'illegal', cat: '食品', dw: 200 },
      { name: '假香水', icon: '🌸', type: 'illegal', cat: '假冒伪劣', dw: 150 },
      { name: '假化妆品', icon: '🧪', type: 'illegal', cat: '假冒伪劣', dw: 180 },
      { name: '走私药材', icon: '🌿', type: 'illegal', cat: '药品', dw: 250 }
    ];
    const OX_POOL = [
      { name: '冻鱼', icon: '🐟', type: 'legal', cat: '食品', dw: 500 },
      { name: '冰淇淋', icon: '🍦', type: 'legal', cat: '食品', dw: 300 },
      { name: '冻饺', icon: '🥟', type: 'legal', cat: '食品', dw: 400 },
      { name: '饮料', icon: '🧃', type: 'legal', cat: '食品', dw: 350 },
      { name: '零食', icon: '🍫', type: 'legal', cat: '食品', dw: 200 },
      { name: '冻虾', icon: '🦐', type: 'legal', cat: '食品', dw: 450 },
      { name: '鸡腿', icon: '🍗', type: 'legal', cat: '食品', dw: 350 },
      { name: '肉卷', icon: '🥓', type: 'legal', cat: '食品', dw: 300 },
      { name: '蔬菜', icon: '🥦', type: 'legal', cat: '食品', dw: 250 },
      { name: '水果', icon: '🍎', type: 'legal', cat: '食品', dw: 300 },
      { name: '走私冻肉', icon: '🥩', type: 'illegal', cat: '冻品', dw: 500 },
      { name: '走私海鲜', icon: '🦀', type: 'illegal', cat: '冻品', dw: 400 },
      { name: '走私燕窝', icon: '🥣', type: 'illegal', cat: '食品', dw: 200 },
      { name: '毒品', icon: '💊', type: 'illegal', cat: '毒品', risk: true, dw: 100 },
      { name: '走私鹅肝', icon: '🫘', type: 'illegal', cat: '冻品', dw: 300 },
      { name: '走私鱼翅', icon: '🦈', type: 'illegal', cat: '冻品', dw: 400 },
      { name: '走私鲍鱼', icon: '🪼', type: 'illegal', cat: '冻品', dw: 350 },
      { name: '走私海参', icon: '🪸', type: 'illegal', cat: '冻品', dw: 300 },
      { name: '走私和牛', icon: '🐄', type: 'illegal', cat: '冻品', dw: 600 },
      { name: '走私黄油', icon: '🧈', type: 'illegal', cat: '冻品', dw: 200 },
      { name: '疫区冻肉', icon: '⚠️', type: 'illegal', cat: '冻品', risk: true, dw: 500 }
    ];
    const TIGER_POOL = [
      { name: '木雕', icon: '🪵', type: 'legal', cat: '工艺品', dw: 600 },
      { name: '陶瓷', icon: '🏺', type: 'legal', cat: '工艺品', dw: 400 },
      { name: '玉器', icon: '💎', type: 'legal', cat: '珠宝', dw: 200 },
      { name: '工艺品', icon: '🎭', type: 'legal', cat: '工艺品', dw: 350 },
      { name: '书画', icon: '🖼️', type: 'legal', cat: '文化用品', dw: 300 },
      { name: '竹编', icon: '🧺', type: 'legal', cat: '工艺品', dw: 250 },
      { name: '漆器', icon: '🪞', type: 'legal', cat: '工艺品', dw: 400 },
      { name: '刺绣', icon: '🧵', type: 'legal', cat: '工艺品', dw: 300 },
      { name: '景泰蓝', icon: '🔮', type: 'legal', cat: '工艺品', dw: 500 },
      { name: '红木家具', icon: '🪑', type: 'legal', cat: '家具', dw: 1000 },
      { name: '象牙', icon: '🐘', type: 'illegal', cat: '濒危物种', dw: 500 },
      { name: '犀牛角', icon: '🦏', type: 'illegal', cat: '濒危物种', dw: 300 },
      { name: '虎骨', icon: '🐅', type: 'illegal', cat: '濒危物种', dw: 400 },
      { name: '珍稀皮草', icon: '🦊', type: 'illegal', cat: '濒危物种', dw: 250 },
      { name: '象牙手镯', icon: '📿', type: 'illegal', cat: '濒危物种', dw: 150 },
      { name: '象牙印章', icon: '🖊️', type: 'illegal', cat: '濒危物种', dw: 100 },
      { name: '穿山甲鳞片', icon: '🦔', type: 'illegal', cat: '濒危物种', dw: 200 },
      { name: '玳瑁', icon: '🐢', type: 'illegal', cat: '濒危物种', dw: 300 },
      { name: '熊胆', icon: '🧪', type: 'illegal', cat: '濒危物种', dw: 150 },
      { name: '麝香', icon: '🌸', type: 'illegal', cat: '濒危物种', dw: 200 },
      { name: '象牙手串(伪塑料)', icon: '📿', type: 'illegal', cat: '濒危物种', dw: 250 }
    ];
    const RABBIT_POOL = [
      { name: '宠物笼', icon: '🏠', type: 'legal', cat: '宠物用品', dw: 500 },
      { name: '宠物粮', icon: '🍖', type: 'legal', cat: '宠物食品', dw: 400 },
      { name: '鱼缸', icon: '🪸', type: 'legal', cat: '宠物用品', dw: 800 },
      { name: '宠物玩具', icon: '🧸', type: 'legal', cat: '宠物用品', dw: 200 },
      { name: '猫爬架', icon: '🪀', type: 'legal', cat: '宠物用品', dw: 600 },
      { name: '宠物床', icon: '🛏️', type: 'legal', cat: '宠物用品', dw: 400 },
      { name: '宠物水壶', icon: '💧', type: 'legal', cat: '宠物用品', dw: 150 },
      { name: '宠物浴液', icon: '🧴', type: 'legal', cat: '宠物用品', dw: 250 },
      { name: '宠物窝', icon: '🛋️', type: 'legal', cat: '宠物用品', dw: 500 },
      { name: '牵引绳', icon: '🪢', type: 'legal', cat: '宠物用品', dw: 150 },
      { name: '珍稀龟', icon: '🐢', type: 'illegal', cat: '异宠', dw: 300 },
      { name: '蛇卵', icon: '🥚', type: 'illegal', cat: '异宠', dw: 100 },
      { name: '毒蜘蛛', icon: '🕷️', type: 'illegal', cat: '异宠', dw: 50 },
      { name: '珍稀鸟类', icon: '🦜', type: 'illegal', cat: '异宠', dw: 200 },
      { name: '箭毒蛙', icon: '🐸', type: 'illegal', cat: '异宠', dw: 80 },
      { name: '食人鱼', icon: '🐟', type: 'illegal', cat: '异宠', dw: 150 },
      { name: '变色龙', icon: '🦎', type: 'illegal', cat: '异宠', dw: 200 },
      { name: '蝎子', icon: '🦂', type: 'illegal', cat: '异宠', dw: 60 },
      { name: '蟒蛇', icon: '🐍', type: 'illegal', cat: '异宠', dw: 250 },
      { name: '剧毒海螺', icon: '🐚', type: 'illegal', cat: '异宠', dw: 100 }
    ];
    const DRAGON_POOL = [
      { name: '健身器材', icon: '🏋️', type: 'legal', cat: '体育用品', dw: 1000 },
      { name: '五金工具', icon: '🔧', type: 'legal', cat: '工具', dw: 600 },
      { name: '金属零件', icon: '⚙️', type: 'legal', cat: '工业品', dw: 400 },
      { name: '工业配件', icon: '🔩', type: 'legal', cat: '工业品', dw: 350 },
      { name: '精密仪器', icon: '🔬', type: 'legal', cat: '仪器', dw: 800 },
      { name: '钢管', icon: '🥉', type: 'legal', cat: '工业品', dw: 500 },
      { name: '弹簧', icon: '🌀', type: 'legal', cat: '工业品', dw: 200 },
      { name: '电子元件', icon: '🔌', type: 'legal', cat: '电子产品', dw: 150 },
      { name: '3D打印机', icon: '🖨️', type: 'legal', cat: '工业品', dw: 900 },
      { name: '铝材', icon: '🪶', type: 'legal', cat: '工业品', dw: 600 },
      { name: '枪支零件', icon: '🔫', type: 'illegal', cat: '武器', dw: 300 },
      { name: '弹药', icon: '💣', type: 'illegal', cat: '武器', dw: 200 },
      { name: '武器配件', icon: '🎯', type: 'illegal', cat: '武器', dw: 150 },
      { name: '自制枪械', icon: '⚔️', type: 'illegal', cat: '武器', dw: 400 },
      { name: '消音器', icon: '🔇', type: 'illegal', cat: '武器', dw: 100 },
      { name: '枪管', icon: '🪠', type: 'illegal', cat: '武器', dw: 250 },
      { name: '瞄准镜', icon: '🔭', type: 'illegal', cat: '武器', dw: 200 },
      { name: '子弹模具', icon: '🔄', type: 'illegal', cat: '武器', dw: 300 },
      { name: '火药', icon: '🧨', type: 'illegal', cat: '武器', dw: 150 },
      { name: '防弹衣', icon: '🛡️', type: 'illegal', cat: '武器', dw: 500 }
    ];
    const SNAKE_POOL = [
      { name: '中药', icon: '🌿', type: 'legal', cat: '药品', dw: 200 },
      { name: '保健品', icon: '🧴', type: 'legal', cat: '保健品', dw: 300 },
      { name: '香料', icon: '🌸', type: 'legal', cat: '食品', dw: 150 },
      { name: '饼干', icon: '🍪', type: 'legal', cat: '食品', dw: 250 },
      { name: '化妆品', icon: '💄', type: 'legal', cat: '化妆品', dw: 200 },
      { name: '维生素', icon: '💊', type: 'legal', cat: '药品', dw: 100 },
      { name: '果汁', icon: '🍹', type: 'legal', cat: '食品', dw: 300 },
      { name: '糖果', icon: '🍬', type: 'legal', cat: '食品', dw: 250 },
      { name: '奶粉', icon: '🍼', type: 'legal', cat: '食品', dw: 400 },
      { name: '咖啡', icon: '☕', type: 'legal', cat: '食品', dw: 200 },
      { name: '海洛因', icon: '💉', type: 'illegal', cat: '毒品', risk: true, dw: 100 },
      { name: '冰毒', icon: '🧪', type: 'illegal', cat: '毒品', risk: true, dw: 80 },
      { name: '摇头丸', icon: '💊', type: 'illegal', cat: '毒品', risk: true, dw: 50 },
      { name: '制毒原料', icon: '⚗️', type: 'illegal', cat: '毒品', risk: true, dw: 200 },
      { name: '可卡因', icon: '❄️', type: 'illegal', cat: '毒品', risk: true, dw: 120 },
      { name: '大麻', icon: '🍃', type: 'illegal', cat: '毒品', risk: true, dw: 80 },
      { name: '吗啡', icon: '🩸', type: 'illegal', cat: '毒品', risk: true, dw: 60 },
      { name: '鸦片', icon: '☠️', type: 'illegal', cat: '毒品', risk: true, dw: 150 },
      { name: '迷幻剂', icon: '💧', type: 'illegal', cat: '毒品', risk: true, dw: 40 },
      { name: 'K粉', icon: '🧂', type: 'illegal', cat: '毒品', risk: true, dw: 70 },
      { name: '裙子藏毒', icon: '👗', type: 'illegal', cat: '毒品', risk: true, dw: 150 },
      { name: '轴承藏毒', icon: '🔩', type: 'illegal', cat: '毒品', risk: true, dw: 200 },
      { name: '净水器藏毒', icon: '🚰', type: 'illegal', cat: '毒品', risk: true, dw: 120 }
    ];
    const HORSE_POOL = [
      { name: '布料', icon: '👕', type: 'legal', cat: '纺织品', dw: 500 },
      { name: '机械零件', icon: '⚙️', type: 'legal', cat: '工业品', dw: 600 },
      { name: '日用品', icon: '🧴', type: 'legal', cat: '日用品', dw: 300 },
      { name: '家具', icon: '🪑', type: 'legal', cat: '家具', dw: 1000 },
      { name: '文具', icon: '📚', type: 'legal', cat: '文化用品', dw: 200 },
      { name: '灯具', icon: '💡', type: 'legal', cat: '日用品', dw: 250 },
      { name: '玩具', icon: '🧸', type: 'legal', cat: '玩具', dw: 300 },
      { name: '鞋类', icon: '👟', type: 'legal', cat: '服装', dw: 250 },
      { name: '陶瓷碗', icon: '🍜', type: 'legal', cat: '日用品', dw: 350 },
      { name: '毛巾', icon: '🧣', type: 'legal', cat: '纺织品', dw: 150 },
      { name: '伪报电子产品', icon: '💻', type: 'illegal', cat: '伪报', dw: 500 },
      { name: '瞒报文物', icon: '🏺', type: 'illegal', cat: '伪报', dw: 600 },
      { name: '瞒报奢侈品', icon: '👛', type: 'illegal', cat: '伪报', dw: 400 },
      { name: '瞒报冻肉', icon: '🥩', type: 'illegal', cat: '伪报', dw: 500 },
      { name: '伪报药材', icon: '🌿', type: 'illegal', cat: '伪报', dw: 300 },
      { name: '伪报化妆品', icon: '💄', type: 'illegal', cat: '伪报', dw: 250 },
      { name: '瞒报烟酒', icon: '🚬', type: 'illegal', cat: '伪报', dw: 400 },
      { name: '瞒报珠宝', icon: '💎', type: 'illegal', cat: '伪报', dw: 300 },
      { name: '瞒报现金', icon: '💰', type: 'illegal', cat: '伪报', dw: 200 },
      { name: '瞒报药品', icon: '💉', type: 'illegal', cat: '伪报', dw: 150 }
    ];
    const GOAT_POOL = [
      { name: '手袋', icon: '👜', type: 'legal', cat: '奢侈品', dw: 300 },
      { name: '名表', icon: '⌚', type: 'legal', cat: '奢侈品', dw: 200 },
      { name: '珠宝', icon: '💎', type: 'legal', cat: '珠宝', dw: 150 },
      { name: '香水', icon: '🌸', type: 'legal', cat: '化妆品', dw: 200 },
      { name: '时装', icon: '👗', type: 'legal', cat: '服装', dw: 350 },
      { name: '高跟鞋', icon: '👠', type: 'legal', cat: '服装', dw: 250 },
      { name: '丝巾', icon: '🧣', type: 'legal', cat: '服装', dw: 100 },
      { name: '太阳镜', icon: '🕶️', type: 'legal', cat: '服装', dw: 150 },
      { name: '真皮腰带', icon: '🩴', type: 'legal', cat: '服装', dw: 200 },
      { name: '礼服', icon: '🎩', type: 'legal', cat: '服装', dw: 400 },
      { name: '仿冒手袋', icon: '👛', type: 'illegal', cat: '假冒伪劣', dw: 250 },
      { name: '假名表', icon: '⏰', type: 'illegal', cat: '假冒伪劣', dw: 150 },
      { name: '假珠宝', icon: '📿', type: 'illegal', cat: '假冒伪劣', dw: 100 },
      { name: '洗钱油画', icon: '🎨', type: 'illegal', cat: '伪报', dw: 500 },
      { name: '仿冒香水', icon: '🧪', type: 'illegal', cat: '假冒伪劣', dw: 180 },
      { name: '仿冒包', icon: '🥊', type: 'illegal', cat: '假冒伪劣', dw: 200 },
      { name: '仿冒鞋', icon: '👞', type: 'illegal', cat: '假冒伪劣', dw: 180 },
      { name: '仿冒领带', icon: '👔', type: 'illegal', cat: '假冒伪劣', dw: 100 },
      { name: '仿冒眼镜', icon: '🔍', type: 'illegal', cat: '假冒伪劣', dw: 120 },
      { name: '仿冒礼服', icon: '👘', type: 'illegal', cat: '假冒伪劣', dw: 300 }
    ];
    const MONKEY_POOL = [
      { name: '手机', icon: '📱', type: 'legal', cat: '电子产品', dw: 200 },
      { name: '电脑', icon: '💻', type: 'legal', cat: '电子产品', dw: 800 },
      { name: '平板', icon: '📟', type: 'legal', cat: '电子产品', dw: 300 },
      { name: '耳机', icon: '🎧', type: 'legal', cat: '电子产品', dw: 150 },
      { name: '相机', icon: '📷', type: 'legal', cat: '电子产品', dw: 400 },
      { name: '智能手表', icon: '⌚', type: 'legal', cat: '电子产品', dw: 150 },
      { name: '蓝牙音箱', icon: '🔊', type: 'legal', cat: '电子产品', dw: 300 },
      { name: '充电宝', icon: '🔋', type: 'legal', cat: '电子产品', dw: 200 },
      { name: '数据线', icon: '🔌', type: 'legal', cat: '电子产品', dw: 80 },
      { name: '显示器', icon: '🖥️', type: 'legal', cat: '电子产品', dw: 600 },
      { name: '翻新手机', icon: '📲', type: 'illegal', cat: '假冒伪劣', dw: 180 },
      { name: '盗版芯片', icon: '🟫', type: 'illegal', cat: '电子产品', dw: 50 },
      { name: '走私硬盘', icon: '💿', type: 'illegal', cat: '电子产品', dw: 150 },
      { name: '走私显卡', icon: '🎮', type: 'illegal', cat: '电子产品', dw: 300 },
      { name: '山寨耳机', icon: '📻', type: 'illegal', cat: '假冒伪劣', dw: 80 },
      { name: '走私CPU', icon: '🔲', type: 'illegal', cat: '电子产品', dw: 250 },
      { name: '走私内存', icon: '🧩', type: 'illegal', cat: '电子产品', dw: 120 },
      { name: '走私主板', icon: '⚡', type: 'illegal', cat: '电子产品', dw: 200 },
      { name: '走私电池', icon: '🪫', type: 'illegal', cat: '电子产品', dw: 100 },
      { name: '走私屏幕', icon: '📺', type: 'illegal', cat: '电子产品', dw: 350 },
      { name: 'CD碟片藏毒', icon: '💿', type: 'illegal', cat: '毒品', risk: true, dw: 100 },
      { name: '肥皂藏毒', icon: '🧼', type: 'illegal', cat: '毒品', risk: true, dw: 80 }
    ];
    const ROOSTER_POOL = [
      { name: '仿古瓷', icon: '🏺', type: 'legal', cat: '工艺品', dw: 400 },
      { name: '现代画', icon: '🖼️', type: 'legal', cat: '文化用品', dw: 300 },
      { name: '古籍', icon: '📚', type: 'legal', cat: '文化用品', dw: 500 },
      { name: '仿古铜器', icon: '🔔', type: 'legal', cat: '工艺品', dw: 600 },
      { name: '书法', icon: '📜', type: 'legal', cat: '文化用品', dw: 200 },
      { name: '仿古玉器', icon: '💎', type: 'legal', cat: '工艺品', dw: 300 },
      { name: '仿古家具', icon: '🪑', type: 'legal', cat: '家具', dw: 800 },
      { name: '现代雕塑', icon: '🗿', type: 'legal', cat: '工艺品', dw: 500 },
      { name: '仿古剑', icon: '⚔️', type: 'legal', cat: '工艺品', dw: 400 },
      { name: '仿古钱币', icon: '🪙', type: 'legal', cat: '工艺品', dw: 100 },
      { name: '出土青铜器', icon: '🥉', type: 'illegal', cat: '文物', dw: 800 },
      { name: '古画', icon: '🎨', type: 'illegal', cat: '文物', dw: 400 },
      { name: '恐龙化石', icon: '🦴', type: 'illegal', cat: '文物', dw: 1000 },
      { name: '古佛像', icon: '🧘', type: 'illegal', cat: '文物', dw: 600 },
      { name: '古剑', icon: '🗡️', type: 'illegal', cat: '文物', dw: 500 },
      { name: '古钱币', icon: '👑', type: 'illegal', cat: '文物', dw: 200 },
      { name: '古玉器', icon: '💠', type: 'illegal', cat: '文物', dw: 350 },
      { name: '古瓷器', icon: '⚱️', type: 'illegal', cat: '文物', dw: 500 },
      { name: '古书籍', icon: '📜', type: 'illegal', cat: '文物', dw: 400 },
      { name: '古壁画', icon: '🧱', type: 'illegal', cat: '文物', dw: 700 },
      { name: '碳14测年伪造品', icon: '⏳', type: 'illegal', cat: '文物', dw: 500 }
    ];
    const DOG_POOL = [
      { name: '海产干货', icon: '🐟', type: 'legal', cat: '食品', dw: 400 },
      { name: '渔具', icon: '🎣', type: 'legal', cat: '渔具', dw: 600 },
      { name: '船用配件', icon: '⚓', type: 'legal', cat: '船用品', dw: 800 },
      { name: '航海仪器', icon: '🧭', type: 'legal', cat: '仪器', dw: 500 },
      { name: '水产饲料', icon: '🦐', type: 'legal', cat: '饲料', dw: 700 },
      { name: '救生衣', icon: '🦺', type: 'legal', cat: '船用品', dw: 300 },
      { name: '船用灯具', icon: '💡', type: 'legal', cat: '船用品', dw: 200 },
      { name: '航海图', icon: '🗺️', type: 'legal', cat: '船用品', dw: 150 },
      { name: '润滑油', icon: '💧', type: 'legal', cat: '船用品', dw: 400 },
      { name: '船用工具', icon: '🔧', type: 'legal', cat: '工具', dw: 500 },
      { name: '海上走私烟', icon: '🚬', type: 'illegal', cat: '烟草', dw: 300 },
      { name: '海上走私酒', icon: '🍷', type: 'illegal', cat: '食品', dw: 400 },
      { name: '走私石油', icon: '🛢️', type: 'illegal', cat: '能源', dw: 1000 },
      { name: '珍稀珊瑚', icon: '🪸', type: 'illegal', cat: '濒危物种', dw: 200 },
      { name: '走私濒危鱼类', icon: '🐠', type: 'illegal', cat: '濒危物种', dw: 300 },
      { name: '走私海龟', icon: '🐢', type: 'illegal', cat: '濒危物种', dw: 400 },
      { name: '走私玳瑁', icon: '🐚', type: 'illegal', cat: '濒危物种', dw: 200 },
      { name: '走私珍珠', icon: '📿', type: 'illegal', cat: '珠宝', dw: 150 },
      { name: '走私海马', icon: '🌿', type: 'illegal', cat: '药品', dw: 100 },
      { name: '走私鲸牙', icon: '🦷', type: 'illegal', cat: '濒危物种', dw: 250 },
      { name: '走私鱼鳔(加州黄花鱼)', icon: '🫧', type: 'illegal', cat: '濒危物种', dw: 300 }
    ];
    const PIG_POOL = [
      { name: '废纸', icon: '📄', type: 'legal', cat: '可回收物', dw: 800 },
      { name: '废塑料', icon: '♻️', type: 'legal', cat: '可回收物', dw: 600 },
      { name: '废金属', icon: '🔩', type: 'legal', cat: '可回收物', dw: 1000 },
      { name: '废纺织品', icon: '👕', type: 'legal', cat: '可回收物', dw: 400 },
      { name: '废橡胶', icon: '🛞', type: 'legal', cat: '可回收物', dw: 700 },
      { name: '碎玻璃', icon: '🪟', type: 'legal', cat: '可回收物', dw: 500 },
      { name: '旧电池', icon: '🔋', type: 'legal', cat: '可回收物', dw: 200 },
      { name: '旧家电', icon: '📺', type: 'legal', cat: '可回收物', dw: 800 },
      { name: '旧衣服', icon: '👗', type: 'legal', cat: '可回收物', dw: 300 },
      { name: '旧轮胎', icon: '⚙️', type: 'legal', cat: '可回收物', dw: 900 },
      { name: '医疗废物', icon: '☣️', type: 'illegal', cat: '危险废物', dw: 300 },
      { name: '电子垃圾', icon: '💻', type: 'illegal', cat: '危险废物', dw: 500 },
      { name: '有毒废料', icon: '🧪', type: 'illegal', cat: '危险废物', dw: 400 },
      { name: '核废料', icon: '☢️', type: 'illegal', cat: '放射性物质', dw: 600 },
      { name: '化工废料', icon: '⚗️', type: 'illegal', cat: '危险废物', dw: 350 },
      { name: '废机油', icon: '🛢️', type: 'illegal', cat: '危险废物', dw: 300 },
      { name: '废灯管', icon: '💡', type: 'illegal', cat: '危险废物', dw: 150 },
      { name: '废油漆', icon: '🎨', type: 'illegal', cat: '危险废物', dw: 250 },
      { name: '废溶剂', icon: '🧴', type: 'illegal', cat: '危险废物', dw: 200 },
      { name: '废酸液', icon: '💧', type: 'illegal', cat: '危险废物', dw: 300 },
      { name: '医疗废物(注射器)', icon: '💉', type: 'illegal', cat: '危险废物', risk: true, dw: 200 }
    ];
    const ZODIAC_POOLS = { rat: RAT_POOL, ox: OX_POOL, tiger: TIGER_POOL, rabbit: RABBIT_POOL, dragon: DRAGON_POOL, snake: SNAKE_POOL, horse: HORSE_POOL, goat: GOAT_POOL, monkey: MONKEY_POOL, rooster: ROOSTER_POOL, dog: DOG_POOL, pig: PIG_POOL };
    var TUTOR2POOL = { linrui:'rat', chenfeng:'snake', zhaohai:'dog', baiwei:'ox', laozhou:'horse', xiaohui:'tiger' };
    var poolKey = TUTOR2POOL[this.config.tutor] || 'rat';
    this.allItems = ZODIAC_POOLS[poolKey] || RAT_POOL;
    this.itemSequence = this._generateSequence();
  }

  _generateSequence() {
    const legal = this.allItems.filter(i => i.type === 'legal');
    const illegal = this.allItems.filter(i => i.type === 'illegal');
    const pool = legal.concat(illegal);
    const seq = [];
    const used = new Set();
    for (let i = 0; i < this.itemsPerWave; i++) {
      let item = Phaser.Utils.Array.GetRandom(pool);
      let tries = 0;
      while (used.has(item.name) && tries < 20) {
        item = Phaser.Utils.Array.GetRandom(pool);
        tries++;
      }
      if (i < 2) item = Phaser.Utils.Array.GetRandom(legal);
      used.add(item.name);
      const copy = Object.assign({}, item);
      if (copy.dw) {
        const mult = item.type === 'legal' ? 0.95 + Math.random() * 0.1 : 1.3 + Math.random() * 0.5;
        copy.aw = Math.round(copy.dw * mult);
      }
      if (item.type === 'illegal') {
        copy.conceal = Phaser.Utils.Array.GetRandom(['夹层','伪装','混装','拆解','仿冒','翻新']);
        copy.densityAbnormal = Math.random() < 0.85;
        copy.surfaceAbnormal = Math.random() < 0.8;
      } else {
        copy.conceal = '正常';
        copy.densityAbnormal = Math.random() < 0.12;
        copy.surfaceAbnormal = Math.random() < 0.08;
      }
      seq.push(copy);
    }
    if (this.config.hiddenRule && seq.length >= 3) {
      const hidden = Object.assign({}, Phaser.Utils.Array.GetRandom(illegal));
      if (hidden.dw) {
        hidden.aw = Math.round(hidden.dw * (1.3 + Math.random() * 0.5));
      }
      hidden.conceal = Phaser.Utils.Array.GetRandom(['夹层','伪装','混装','拆解','仿冒','翻新']);
      hidden.densityAbnormal = Math.random() < 0.85;
      hidden.surfaceAbnormal = Math.random() < 0.8;
      seq[2] = hidden;
    }
    return seq;
  }

  create() {
    const { width, height } = this.scale;
    window.__phaserScene = this;

    this._showDayIntro();
    this._createHUD();
    this._createScanArea();
    this._createButtons();
    this._createEchoIndicator();
    this._createHourglass();

    this.time.delayedCall(1500, () => {
      this._showItem();
      this._seekAnim(1);
      this.timeEvent = this.time.addEvent({
        delay: 1000, callback: this._onTick, callbackScope: this, loop: true
      });
      if (false) void 0;
    });
  }

  _showDayIntro() {
    const { width, height } = this.scale;
    const dayNum = Math.min(this.save.roundsInCycle.length + 1, 10);
    const intro = this.add.container(width / 2, height / 2 - 30);

    const bg = this.add.rectangle(0, 0, 300, 120, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffd700);
    const dayText = this.add.text(0, -20, '第 ' + dayNum + ' 天', {
      fontSize: '36px', color: '#ffd700', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const levelText = this.add.text(0, 25, this.config.icon + ' ' + this.config.name, {
      fontSize: '18px', color: '#e2e8f0'
    }).setOrigin(0.5);
    const descText = this.add.text(0, 50, this.config.desc, {
      fontSize: '13px', color: '#94a3b8'
    }).setOrigin(0.5);

    intro.add([bg, dayText, levelText, descText]);

    this.tweens.add({
      targets: intro, alpha: 1, duration: 400,
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: intro, alpha: 0, duration: 300,
            onComplete: () => intro.destroy()
          });
        });
      }
    });
  }

  _createHUD() {
    const { width } = this.scale;
    this.add.text(width / 2, 30, this.config.icon + ' ' + this.config.name, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    this.add.text(width / 2, 50, this.config.desc, {
      fontSize: '11px', color: '#e2e8f0'
    }).setOrigin(0.5);

    this.timeText = this.add.text(55, 72, String(this.timeLimit), {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold'
    });

    this.progressText = this.add.text(width - 20, 72, '📦 0/' + this.itemsPerWave, {
      fontSize: '14px', color: '#e2e8f0'
    }).setOrigin(1, 0);

    this.comboText = this.add.text(width / 2, 72, '', {
      fontSize: '13px', color: '#ffd700', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5, 0);

    this.protectText = this.add.text(780, 92, '', {
      fontSize: '11px', color: '#00e5ff', fontFamily: 'monospace'
    }).setOrigin(1, 0);

    this.scoreText = this.add.text(width / 2, 92, '', {
      fontSize: '13px', color: '#ffd700', fontFamily: 'monospace'
    }).setOrigin(0.5, 0);
    this._updateScoreDisplay();

    // Settings button (top-right corner)
    this.settingsBtn = this.add.text(8, 30, '⚙️', {
      fontSize: '18px'
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.settingsBtn.on('pointerdown', () => this._togglePause());
  }

  _togglePause() {
    if (this.isEnding) return;
    this.paused = !this.paused;
    var el = document.getElementById('game-pause');
    if (this.paused) {
      if (this.timeEvent) this.timeEvent.paused = true;
      this._updateHourglass(this.timeLimit / this.maxTime);
      // Init toggle state
      var save = SaveManager.load();
      var bg = document.querySelector('#pause-toggle-sound .toggle-bg');
      var knob = document.querySelector('#pause-toggle-sound .toggle-knob');
      if (bg && knob) {
        var isOn = save.settings.sound !== false;
        bg.style.background = isOn ? '#4ecca3' : '#475569';
        knob.style.left = isOn ? '18px' : '0px';
      }
      // Bind pause button events each time shown (avoids DOMContentLoaded timing issues)
      var self = this;
      var resumeFn = function() { self._togglePause(); };
      var quitFn = function() {
        if (self.isEnding) return;
        self.isEnding = true;
        document.getElementById('game-pause').style.display = 'none';
        if (self.timeEvent) self.timeEvent.remove();
        if (self._alarmTimer) self._alarmTimer.remove();
        document.getElementById('phaser-container').style.display = 'none';
        self.scene.stop();
        UI.show('level-select');
      };
      var soundToggleFn = function() {
        var s = SaveManager.load();
        s.settings.sound = s.settings.sound === false ? true : false;
        SaveManager.save(s);
        if (window.__soundManager) window.__soundManager.setMuted(!s.settings.sound);
        var bg2 = document.querySelector('#pause-toggle-sound .toggle-bg');
        var knob2 = document.querySelector('#pause-toggle-sound .toggle-knob');
        if (bg2 && knob2) {
          bg2.style.background = s.settings.sound ? '#4ecca3' : '#475569';
          knob2.style.left = s.settings.sound ? '18px' : '0px';
        }
      };
      // Remove old listeners to avoid duplicates, then add fresh ones
      var resumeBtn = document.getElementById('pause-resume');
      var quitBtn = document.getElementById('pause-quit');
      var toggleBtn = document.getElementById('pause-toggle-sound');
      if (resumeBtn) { resumeBtn.replaceWith(resumeBtn.cloneNode(true)); document.getElementById('pause-resume').addEventListener('click', resumeFn); }
      if (quitBtn) { quitBtn.replaceWith(quitBtn.cloneNode(true)); document.getElementById('pause-quit').addEventListener('click', quitFn); }
      if (toggleBtn) { toggleBtn.replaceWith(toggleBtn.cloneNode(true)); document.getElementById('pause-toggle-sound').addEventListener('click', soundToggleFn); }
      el.style.display = 'flex';
    } else {
      if (this.timeEvent) this.timeEvent.paused = false;
      this._updateHourglass(this.timeLimit / this.maxTime);
      el.style.display = 'none';
    }
  }

  _updateScoreDisplay() {
    const daoStr = '功勋 +' + this.dao + ' 分 ' + this.score;
    this.scoreText.setText(daoStr);
  }

  _createScanArea() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2 - 30;

    this.scanFrame = this.add.image(cx, cy, 'scanFrame');
    this.luggageSprite = this.add.image(cx, cy, 'luggage').setScale(0).setAlpha(0);
    this.itemIcon = this.add.text(cx, cy - 10, '', { fontSize: '56px' }).setOrigin(0.5).setAlpha(0);
    this.itemName = this.add.text(cx, cy + 45, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5).setAlpha(0);
    this.scanLine = this.add.image(cx, cy - 70, 'scanLine').setAlpha(0);
    this.stamp = this.add.image(cx, cy, 'stamp').setScale(2).setAlpha(0).setRotation(-0.3);
    this.detectionReport = this.add.text(cx, cy + 40, '', {
      fontSize: '9px', color: '#e2e8f0', fontFamily: 'monospace', lineSpacing: 1, align: 'center'
    }).setOrigin(0.5, 0).setAlpha(0);
    this.equipReport = this.add.text(cx, cy + 65, '', {
      fontSize: '10px', color: '#00e5ff', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5).setAlpha(0);

    if (false) {
      this.weightText = this.add.text(cx, cy + 110, '', {
        fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace'
      }).setOrigin(0.5);
    }

    if (this.config.mechanic === 'risk') {
      this.bodyScan = this.add.container(cx + 100, cy - 20);
      const body = this.add.rectangle(0, 10, 30, 80, 0x4ecca3, 0.15).setStrokeStyle(1, 0x4ecca3, 0.4);
      const head = this.add.circle(0, -35, 14, 0x4ecca3, 0.15).setStrokeStyle(1, 0x4ecca3, 0.4);
      this.bodyDot = this.add.circle(0, 10, 6, 0xff4444, 0).setStrokeStyle(0);
      this.bodyScan.add([body, head, this.bodyDot]);
      this.bodyScan.setAlpha(0);
    }

    if (this.config.mechanic === 'magnifier') {
      this.magBtn = this.add.image(cx + 85, cy, 'magnifier')
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.7)
        .setScale(0.8);
      this.magCountText = this.add.text(cx + 85, cy + 45, '🔍 ' + this.magnifierUses, {
        fontSize: '12px', color: '#00e5ff'
      }).setOrigin(0.5);
      this.magBtn.on('pointerdown', () => this._useMagnifier());
    }

    this.echoRing = this.add.image(cx, cy - 10, 'echoRing').setAlpha(0).setScale(0);
  }

  _createButtons() {
    const { width, height } = this.scale;
    const btnY = height - 100;

    this.passBtn = this._makeButton(width / 2 - 110, btnY, '✅ 放行', 0x00e676);
    this.inspectBtn = this._makeButton(width / 2, btnY, '🔍 深度检查', 0x2196f3);
    this.seizeBtn = this._makeButton(width / 2 + 110, btnY, '🚫 扣押', 0xff4444);

    this.passBtn.btn.on('pointerdown', () => this._judge('pass'));
    this.inspectBtn.btn.on('pointerdown', () => this._judge('inspect'));
    this.seizeBtn.btn.on('pointerdown', () => this._judge('seize'));

    this._setButtonsEnabled(false);
  }

  _makeButton(x, y, label, color) {
    const container = this.add.container(x, y);
    const btn = this.add.rectangle(0, 0, 130, 55, color)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, {
      fontSize: '17px', color: color === 0x00e676 ? '#000000' : '#ffffff',
      fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    container.add([btn, text]);

    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.05, duration: 100 }));
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 100 }));

    return { container, btn, text };
  }

  _createEchoIndicator() {
    const { width } = this.scale;
    this.echoIndicator = new EchoIndicator(this, width / 2, 115);
  }

  _createHourglass() {
    if (!document.getElementById('hg-style')) {
      var s = document.createElement('style');
      s.id = 'hg-style';
      s.textContent =
        '@keyframes hg-shrink{0%{transform:scale(1)}99%{transform:scale(0)}100%{transform:scale(0)}}' +
        '@keyframes hg-grow{0%{transform:scale(0)}99%{transform:scale(1)}100%{transform:scale(1)}}' +
        '@keyframes hg-line{0%{height:0}99%{height:20px}100%{height:20px}}' +
        '@keyframes hg-rotate{0%{transform:rotate(0deg)}99%{transform:rotate(0deg)}100%{transform:rotate(180deg)}}';
      document.head.appendChild(s);
    }
    var old = document.getElementById('hg-box');
    if (old) old.remove();
    this._hgCycle = 30;
    var wrap = document.createElement('div');
    wrap.id = 'hg-box';
    wrap.style.cssText = 'position:absolute;left:18px;top:59px;z-index:50;pointer-events:none;';
    var dur = '30s';
    var glassBg = 'rgba(196,168,130,0.18)';
    var sandColor = '#c4a882';
    var frameColor = '#8b5e3c';
    wrap.innerHTML =
      '<div id="hg-inner" style="position:relative;width:30px;height:40px;animation:hg-rotate 30s linear infinite">' +
        '<div style="position:absolute;top:0;left:0;width:30px;height:2px;border-radius:1px;background:' + frameColor + ';pointer-events:none"></div>' +
        '<div style="position:absolute;top:38px;left:0;width:30px;height:2px;border-radius:1px;background:' + frameColor + ';pointer-events:none"></div>' +
        '<div style="position:absolute;top:2px;left:0;width:1px;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:18px solid ' + glassBg + ';pointer-events:none"></div>' +
        '<div style="position:absolute;top:20px;left:0;width:1px;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-bottom:18px solid ' + glassBg + ';pointer-events:none"></div>' +
        '<div id="hg-top" style="position:absolute;top:2px;left:0;width:1px;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:18px solid ' + sandColor + ';transform-origin:50% 100%;animation:hg-shrink 30s linear infinite"></div>' +
        '<div id="hg-bot" style="position:absolute;top:20px;left:0;width:1px;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-bottom:18px solid ' + sandColor + ';transform-origin:50% 100%;animation:hg-grow 30s linear infinite"></div>' +
        '<div id="hg-line" style="position:absolute;top:20px;left:14px;width:0;height:0;border-left:1px dotted ' + sandColor + ';animation:hg-line 30s linear infinite"></div>' +
      '</div>';
    document.getElementById('phaser-container').appendChild(wrap);
    this._hgBox = wrap;
    this._hgInner = wrap.querySelector('#hg-inner');
    this._hgTop = wrap.querySelector('#hg-top');
    this._hgBot = wrap.querySelector('#hg-bot');
    this._hgLine = wrap.querySelector('#hg-line');
  }

  _updateHourglass(ratio) {
    if (!this._hgTop) return;
    if (this.timeLimit <= 3 && !this.paused) {
      this._hgInner.style.animation = 'none';
      this._hgInner.style.transform = 'rotate(0deg)';
    }
    var c = '#c4a882';
    this._hgTop.style.borderTopColor = c;
    this._hgBot.style.borderBottomColor = c;
    this._hgLine.style.borderLeftColor = c;
    [this._hgTop, this._hgBot, this._hgLine, this._hgInner].forEach(function(el) {
      el.getAnimations().forEach(function(a) {
        if (this.paused) a.pause();
        else if (a.playState === 'paused') a.play();
      }, this);
    }, this);
  }

  _seekAnim(ratio) {
    if (!this._hgTop) return;
    var elapsed = (1 - ratio) * this.maxTime * 1000;
    var cyclePos = elapsed % (this._hgCycle * 1000);
    [this._hgTop, this._hgBot, this._hgLine, this._hgInner].forEach(function(el) {
      el.getAnimations().forEach(function(a) { a.currentTime = Math.min(cyclePos, this._hgCycle * 1000); }, this);
    }, this);
  }

  _setButtonsEnabled(enabled) {
    this.passBtn.btn.input.enabled = enabled;
    this.inspectBtn.btn.input.enabled = enabled;
    this.seizeBtn.btn.input.enabled = enabled;
    this.passBtn.container.setAlpha(enabled ? 1 : 0.4);
    this.inspectBtn.container.setAlpha(enabled ? 1 : 0.4);
    this.seizeBtn.container.setAlpha(enabled ? 1 : 0.4);
  }

  _useMagnifier() {
    if (this.magnifierUses <= 0 || this.gameState !== 'scanning') return;
    this.magnifierUses--;
    this.magCountText.setText('🔍 ' + this.magnifierUses);
    soundManager.play('click');
    const item = this.itemSequence[this.currentItem];
    if (!item) return;
    const isBad = item.type === 'illegal';
    if (this.magnifierOverlay) this.magnifierOverlay.destroy();
    this.magnifierOverlay = this.add.container(this.scanFrame.x, this.scanFrame.y);
    const concealIcon = item.conceal && item.conceal !== '正常' ? '⚠' : '✓';
    const densityStr = item.densityAbnormal ? '密度异常' : '密度正常';
    const surfaceStr = item.surfaceAbnormal ? '表面异常' : '表面正常';
    const bg = this.add.rectangle(0, 0, 160, 150, 0x000000, 0.85);
    const detail = this.add.text(0, -30, isBad ? '╱╲╱╲╱\n交叉纹理' : '───\n均匀纹理', {
      fontSize: '13px', color: isBad ? '#ff4444' : '#00e676', align: 'center', fontFamily: 'monospace'
    }).setOrigin(0.5);
    const info = this.add.text(0, 10, concealIcon + ' ' + (item.conceal || '无') + '\n' + densityStr + '\n' + surfaceStr, {
      fontSize: '10px', color: '#e2e8f0', align: 'center', fontFamily: 'monospace', lineSpacing: 2
    }).setOrigin(0.5);
    const label = this.add.text(0, 55, isBad ? item.name + ' ⚠️' : item.name + ' ✅', {
      fontSize: '11px', color: isBad ? '#ff4444' : '#00e676'
    }).setOrigin(0.5);
    this.magnifierOverlay.add([bg, detail, info, label]);
    this.magnifierOverlay.setAlpha(0).setScale(0.5);
    this.tweens.add({ targets: this.magnifierOverlay, alpha: 1, scale: 1, duration: 200, ease: 'Back.out' });
    this.time.delayedCall(2500, () => {
      if (this.magnifierOverlay) {
        this.tweens.add({
          targets: this.magnifierOverlay, alpha: 0, duration: 200,
          onComplete: () => { if (this.magnifierOverlay) this.magnifierOverlay.destroy(); }
        });
      }
    });
  }

  _showItem() {
    if (this.isEnding || this.currentItem >= this.itemsPerWave) {
      if (!this.isEnding) this._endLevel();
      return;
    }

    const item = this.itemSequence[this.currentItem];
    this.gameState = 'scanning';
    this._inspected = false;
    this.progressText.setText('📦 ' + (this.currentItem + 1) + '/' + this.itemsPerWave);

    this.tweens.add({
      targets: [this.luggageSprite, this.itemIcon, this.itemName],
      alpha: 1, scale: 1, duration: 300, ease: 'Back.out'
    });

    this.luggageSprite.setScale(0);
    if (this.config.mechanic === 'magnifier') {
      this.itemIcon.setText('❓');
      this._realIcon = item.icon;
    } else {
      this.itemIcon.setText(item.icon);
    }
    this.itemName.setText('? ? ?');
    this.itemName.setColor('#ffffff');
    this.detectionReport.setAlpha(0);
    this._reportShown = false;

    if (this.bodyScan) {
      this.bodyScan.setAlpha(1);
      const riskY = item.risk ? Phaser.Math.Between(-15, 35) : -99;
      if (item.risk) {
        this.bodyDot.setFillStyle(0xff4444, 0.9);
        this.bodyDot.setScale(1.5);
        this.tweens.add({ targets: this.bodyDot, scale: 1, duration: 300 });
      } else {
        this.bodyDot.setAlpha(0);
      }
      this.bodyDot.setY(riskY);
    }

    if (this.weightText && item.dw) {
      const diff = item.aw - item.dw;
      const ratio = Math.abs(diff) / item.dw;
      const abnormal = ratio > 0.3;
      this.weightText.setText(
        '申报:' + item.dw + 'g | 实测:' + item.aw + 'g' +
        (abnormal ? ' ⚠️ 偏差' : ' ✓ 正常')
      );
      this.weightText.setColor(abnormal ? '#ff9100' : '#94a3b8');
    }

    this.scanLine.setAlpha(1);
    this.tweens.add({
      targets: this.scanLine, y: this.scanLine.y + 140,
      duration: 1000, ease: 'Linear', yoyo: true, repeat: 0,
      onComplete: () => {
        if (this.isEnding) return;
        this.scanLine.setAlpha(0);
        if (this.config.mechanic === 'magnifier' && this._realIcon) {
          this.itemIcon.setText(this._realIcon);
        }
        this._showDetectionReport(item);
        this._setButtonsEnabled(true);
        this.gameState = 'judging';
      }
    });

    soundManager.play('scan');
  }

  _showDetectionReport(item) {
    const dw = item.dw || 0;
    const aw = item.aw || 0;
    const dev = dw > 0 ? Math.round(Math.abs(aw - dw) / dw * 100) : 0;
    const devFlag = dev > 30 ? '⚠️' : '✓';
    const densityTxt = item.densityAbnormal ? '⚠️ 异常' : '✓ 正常';
    const surfaceTxt = item.surfaceAbnormal ? '⚠️ 可疑改装' : '✓ 正常';
    const concealTxt = item.conceal && item.conceal !== '正常' ? '⚠️ 有 (' + item.conceal + ')' : '— 无';
    const risk = (dev > 30 ? 2 : 0) + (item.densityAbnormal ? 2 : 0) + (item.surfaceAbnormal ? 2 : 0);
    const riskLv = risk >= 5 ? '高危  ████' : (risk >= 3 ? '中危  ██░░' : '低危  ░░░░');
    const report =
      '重 量  ' + dw + 'g → ' + aw + 'g ' + devFlag + ' +' + dev + '%\n' +
      '密 度  ' + densityTxt + '\n' +
      '表 面  ' + surfaceTxt + '\n' +
      '夹 层  ' + concealTxt + '\n' +
      '━━━━━━━━━━━━━━\n' +
      '风险  ' + riskLv;
    this.itemName.setAlpha(0);
    this.detectionReport.setText(report);
    this.detectionReport.setAlpha(1);
    this._reportShown = true;

    const save = SaveManager.load();
    if (!save.seenItems.find(s => s.name === item.name)) {
      save.seenItems.push({ name: item.name, icon: item.icon, type: item.type, zodiac: this.config.tutor });
      SaveManager.save(save);
    }

    var equipLabel = '';
    if (this.showCategory && item.cat) equipLabel += '📂 ' + item.cat + '  ';
    if (this.showRisk) equipLabel += item.type === 'illegal' ? '🚫 风险:高' : '✅ 风险:低';
    this.equipReport.setText(equipLabel);
    this.equipReport.setAlpha(equipLabel ? 1 : 0);
  }

  _secondaryCheck() {
    this._inspected = true;
    this._setButtonsEnabled(false);
    this.gameState = 'inspecting';
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const item = this.itemSequence[this.currentItem];
    soundManager.play('scan');

    const inspectText = this.add.text(cx, cy - 140, '🔬 深度检查中...', {
      fontSize: '14px', color: '#2196f3', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: inspectText, alpha: 1, duration: 300 });

    this.time.delayedCall(2000, () => {
      inspectText.destroy();
      this.timeLimit -= 3;
      if (this.timeLimit < 0) this.timeLimit = 0;
      this.timeText.setText(String(this.timeLimit));
      this._updateHourglass(this.timeLimit / this.maxTime);
      this._seekAnim(this.timeLimit / this.maxTime);
      if (this.timeLimit <= 10) this.timeText.setColor('#ff4444');

      const concealTips = {
        '夹层': '内部有夹层空间，结构密度偏高',
        '伪装': '表面涂层化学异常，疑似伪装层',
        '混装': '物品内部混有异质材料',
        '拆解': '零件编号不匹配，疑似拆解后重组',
        '仿冒': '品牌标识细节与正品不符',
        '翻新': '表层下有二次加工痕迹'
      };
      const tip = concealTips[item.conceal] || '未见明显异常';
      const deepInfo = item.densityAbnormal
        ? '深度扫描：' + (item.type === 'illegal' ? '确认夹层结构' : '密度异常由包装导致')
        : '深度扫描：内部结构均匀';

      const lines = this.detectionReport.getText().split('\n');
      const baseReport = lines.slice(0, 4).join('\n');
      const updatedReport = baseReport + '\n' +
        '━━━━━━━━━━━━━━\n' +
        deepInfo + '\n' +
        '分析  ' + tip;

      this.detectionReport.setText(updatedReport);
      this.inspectBtn.btn.input.enabled = false;
      this.inspectBtn.container.setAlpha(0.4);
      this._setButtonsEnabled(true);
      this.gameState = 'judging';
    });
  }

  _judge(choice) {
    if (this.gameState !== 'judging' || this.isEnding) return;
    if (choice === 'inspect') {
      if (this._inspected) return;
      this._secondaryCheck();
      return;
    }
    this._setButtonsEnabled(false);
    this.gameState = 'result';

    const item = this.itemSequence[this.currentItem];
    const isIllegal = item.type === 'illegal';
    const isCorrect = (choice === 'seize' && isIllegal) || (choice === 'pass' && !isIllegal);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - 30;

    if (isCorrect) {
      this.score += 10;
      this.dao += 1 + (this.comboBonus || 0);
      this.correctCount++;
      this.combo++;
      soundManager.play('correct');
      new PopupText(this, cx, cy - 40, '+' + (10 + (this.comboBonus || 0) * 5) + ' 👍', '#00e676');

      // adversity rebound: after 2 consecutive wrong, next correct gets +5
      if (this.consecutiveWrong >= 2 && this.ownedIntuitions.indexOf('adversity_rebound') >= 0) {
        this.score += 5;
        new PopupText(this, cx, cy - 70, '🔥 逆境反弹 +5', '#ff9100');
      }
      this.consecutiveWrong = 0;

      if (this.combo >= 3) {
        this.comboText.setText('🔥 ' + this.combo + '连击');
        if (this.combo === 3 && !this.comboProtected) {
          this.comboProtected = true;
          this.time.delayedCall(300, () => new PopupText(this, this.scale.width - 80, cy - 70, '🔮 缉私直觉', '#00e5ff', 16));
        }
        if (this.save.echoSkills.length > 0) {
          this.time.delayedCall(500, () => this._triggerEcho());
        }
      }

      const particles = this.add.particles(cx, cy, 'flare', {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        lifespan: 500,
        quantity: 10,
        tint: 0x00e676
      });
      this.time.delayedCall(500, () => particles.destroy());

      if (choice === 'seize') {
        this.tweens.add({
          targets: this.stamp, alpha: 1, scale: 1, rotation: -0.1,
          duration: 200, ease: 'Bounce.out',
          onComplete: () => {
            this.time.delayedCall(300, () => {
              this.tweens.add({ targets: this.stamp, alpha: 0, duration: 200 });
            });
          }
        });
        this.stamp.setScale(3);
      }

    } else {
      let basePenalty = 5;
      if (item.risk) basePenalty = 50;

      let actualPenalty = basePenalty + (this.penaltyMod || 0);
      let keepCombo = false;
      this.consecutiveWrong++;

      // crisis exempt: 20% chance not to lose score
      if (this.ownedIntuitions.indexOf('crisis_exempt') >= 0 && Math.random() < 0.2) {
        actualPenalty = 0;
        new PopupText(this, cx, cy - 40, '🛡️ 危机豁免', '#ffd700');
      }

      // combo keep: 30% chance to retain combo
      if (this.ownedIntuitions.indexOf('combo_keep') >= 0 && Math.random() < 0.3) {
        keepCombo = true;
        new PopupText(this, cx, cy - 40, '💫 连击延续', '#4ecca3');
      }

      if (this.comboProtected) {
        this.comboProtected = false;
        actualPenalty = 0;
        new PopupText(this, this.scale.width - 80, cy - 40, '🔮 直觉抵挡', '#00e5ff', 16);
      } else if (!keepCombo) {
        this.combo = 0;
      }

      this.score = Math.max(0, this.score - actualPenalty);
      this.wrongCount++;

      if (item.risk) {
        soundManager.play('alarm'); soundManager.vibrate(100);
        this.cameras.main.shake(300, 0.015);
        new PopupText(this, cx, cy - 40, '-' + actualPenalty + ' 🚨 毒品!', '#ff0000', 36);
      } else {
        soundManager.play('wrong'); soundManager.vibrate(50);
        new PopupText(this, cx, cy - 40, actualPenalty > 0 ? '-' + actualPenalty : '免罚', '#ff4444');
        this.cameras.main.shake(200, 0.01);
      }

      const flash = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000, 0.15)
        .setOrigin(0).setScrollFactor(0);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    }

    this.comboText.setText(this.combo >= 3 ? '🔥 ' + this.combo + '连击' : '');
    this.protectText.setText(this.comboProtected ? '🔮 直觉' : '');
    this._updateScoreDisplay();

    if (this.currentItem === 2 && isCorrect && choice === 'seize' && !this.revealedHiddenRule && this.config.hiddenRule) {
      this.revealedHiddenRule = true;
      this.time.delayedCall(1000, () => this._showHiddenRule());
    }

    this.tweens.add({
      targets: [this.luggageSprite, this.itemIcon, this.itemName, this.weightText, this.bodyScan].filter(Boolean),
      alpha: 0, scale: 0.8, duration: 200, delay: 600,
      onComplete: () => {
        if (this.isEnding) return;
        this.currentItem++;
        this.stamp.setAlpha(0).setRotation(-0.3);
        this.time.delayedCall(300, () => this._showItem());
      }
    });
  }

  _triggerEcho() {
    const chosen = EchoManager.getCharacterEcho(this.save);
    if (!chosen) return;
    this.activeEcho = EchoManager.getActiveEcho(this.save);
    soundManager.play('echo');

    const { width, height } = this.scale;
    this.echoRing.setAlpha(1).setScale(0);
    this.tweens.add({
      targets: this.echoRing, scale: 3, alpha: 0,
      duration: 600, ease: 'Cubic.out',
      onComplete: () => this.echoRing.setAlpha(0)
    });

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    const card = this.add.container(width / 2, height / 2 - 30);
    const cardBg = this.add.rectangle(0, 0, 280, 130, 0x1e293b).setStrokeStyle(2, 0xffd700);
    const title = this.add.text(0, -40, '✨ 直觉激活', {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const echoText = this.add.text(0, -5, chosen.icon + ' ' + chosen.name, {
      fontSize: '24px', color: chosen.color || '#ffffff', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const descText = this.add.text(0, 25, chosen.desc, {
      fontSize: '13px', color: '#e2e8f0'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 50, '点击继续', {
      fontSize: '11px', color: '#64748b'
    }).setOrigin(0.5);

    card.add([cardBg, title, echoText, descText, hint]);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.echoIndicator.show(chosen);

    this.input.once('pointerdown', () => {
      this.tweens.add({
        targets: [overlay, card], alpha: 0, duration: 200,
        onComplete: () => { overlay.destroy(); card.destroy(); }
      });
    });
  }

  _showHiddenRule() {
    const { width, height } = this.scale;
    soundManager.play('levelup');
    this.cameras.main.shake(400, 0.01);
    this.cameras.main.flash(500, 255, 215, 0);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    const card = this.add.container(width / 2, height / 2);
    const cardBg = this.add.rectangle(0, 0, 320, 200, 0x1e293b).setStrokeStyle(2, 0xffd700);
    const title = this.add.text(0, -70, '💡 隐藏规则发现', {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const content = this.add.text(0, -10, this.config.hiddenRule, {
      fontSize: '14px', color: '#e2e8f0', align: 'center', lineSpacing: 7, wordWrap: { width: 280 }
    }).setOrigin(0.5);
    const hint = this.add.text(0, 65, '点击继续', {
      fontSize: '11px', color: '#64748b'
    }).setOrigin(0.5);
    card.add([cardBg, title, content, hint]);
    card.setScale(0);
    this.tweens.add({ targets: card, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const p = this.add.particles(width / 2, height / 2, 'flare', {
      speed: { min: 60, max: 180 }, angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 }, lifespan: 800, quantity: 15, tint: 0xffd700
    });
    this.time.delayedCall(1000, () => p.destroy());

    this.input.once('pointerdown', () => {
      this.tweens.add({
        targets: [overlay, card], alpha: 0, duration: 200,
        onComplete: () => { overlay.destroy(); card.destroy(); }
      });
    });
  }

  _showRetryDialog() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    const card = this.add.container(width / 2, height / 2);
    const cardBg = this.add.rectangle(0, 0, 280, 160, 0x1e293b).setStrokeStyle(2, 0x00e5ff);
    const title = this.add.text(0, -40, '\ud83c\udf40 \u5f3a\u8fd0\u00b7\u91cd\u542f', {
      fontSize: '22px', color: '#00e5ff', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const desc = this.add.text(0, 5, '\u83b7\u5f97\u4e00\u6b21\u989d\u5916\u7684\u6311\u6218\u673a\u4f1a', {
      fontSize: '14px', color: '#e2e8f0'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 50, '\u70b9\u51fb\u91cd\u65b0\u6311\u6218', {
      fontSize: '12px', color: '#ffd700', fontFamily: 'Arial Black, sans-serif'
    }).setOrigin(0.5);
    card.add([cardBg, title, desc, hint]);
    card.setScale(0);
    this.tweens.add({ targets: card, scale: 1, duration: 300, ease: 'Back.out' });

    this.input.once('pointerdown', () => {
      overlay.destroy();
      card.destroy();
      this.scene.restart({ levelId: this.levelId });
    });
  }

  _scheduleFalseAlarm() {
    const delay = Phaser.Math.Between(8000, 15000);
    this._alarmTimer = this.time.delayedCall(delay, () => {
      if (this.isEnding || this._alarmActive) return;
      this._triggerFalseAlarm();
    });
  }

  _triggerFalseAlarm() {
    if (this.isEnding) return;
    this._alarmActive = true;
    soundManager.play('alarm'); soundManager.vibrate(80);
    this.cameras.main.shake(200, 0.008);
    this._setButtonsEnabled(false);

    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35);
    const alarmText = this.add.text(width / 2, height / 2 - 20, '🚨 假警报!\n点击忽略', {
      fontSize: '22px', color: '#ff4444', fontFamily: 'Arial Black, sans-serif', align: 'center'
    }).setOrigin(0.5);

    const flash = this.add.rectangle(0, 0, width, height, 0xff0000, 0.08).setOrigin(0);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 300, yoyo: true, repeat: 2,
      onComplete: () => flash.destroy()
    });

    this.input.once('pointerdown', () => {
      if (this.isEnding) return;
      this._alarmActive = false;
      overlay.destroy();
      alarmText.destroy();
      if (this.gameState === 'scanning' || this.gameState === 'judging') {
        this._setButtonsEnabled(true);
      }
      this._scheduleFalseAlarm();
    });
  }

  _onTick() {
    if (this.isEnding) return;
    if (this.paused) {
      this.timeText.setText('⏸️ 暂停');
      this.timeText.setColor('#00e5ff');
      this._updateHourglass(this.timeLimit / this.maxTime);
      return;
    }
    this.timeLimit--;
    this.timeText.setText(String(this.timeLimit));
    this._updateHourglass(this.timeLimit / this.maxTime);
    if (this.timeLimit <= 10) this.timeText.setColor('#ff4444');
    // wind warning: auto-highlight illegal items in last 5s
    if (this.timeLimit <= 5 && this.timeLimit > 0 && this.ownedIntuitions.indexOf('wind_warning') >= 0) {
      var cur = this.itemSequence[this.currentItem];
      if (cur && this.gameState === 'scanning') {
        var warn = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, cur.type === 'illegal' ? '⚠️ 可疑' : '✅ 正常', {
          fontSize: '12px', color: cur.type === 'illegal' ? '#ff4444' : '#4ecca3', fontFamily: 'Arial Black, sans-serif'
        }).setOrigin(0.5).setAlpha(0.8);
        this.time.delayedCall(800, function() { warn.destroy(); });
      }
    }
    if (this.timeLimit <= 0) {
      // time mastery: 30% chance to pause 5 seconds
      if (this.ownedIntuitions.indexOf('time_mastery') >= 0 && Math.random() < 0.3) {
        this.paused = true;
        this.timeText.setText('⏸️ 暂停 5秒');
        this.timeText.setColor('#00e5ff');
        this._updateHourglass(this.timeLimit / this.maxTime);
        new PopupText(this, this.scale.width / 2, this.scale.height / 2 - 40, '⏳ 时间掌控', '#ea80fc', 18);
        this.time.delayedCall(5000, () => { if (!this.isEnding) { this.paused = false; this.timeLimit++; this._onTick(); } });
      } else {
        this._endLevel();
      }
    }
  }

  _endLevel() {
    if (this.isEnding) return;
    this.isEnding = true;
    if (this.timeEvent) this.timeEvent.remove();
    if (this._alarmTimer) this._alarmTimer.remove();

    const passed = this.correctCount >= this.requiredCorrect;

    // tutor affinity: +5 on pass
    if (passed && this.config.tutor) SaveManager.addAffinity(this.config.tutor, 5);

    if (!passed && this.retriesLeft > 0) {
      this.retriesLeft = 0;
      EchoManager.clearEcho(this.save);
      SaveManager.save(this.save);
      this._showRetryDialog();
      return;
    }

    const save = SaveManager.load();
    save.totalScore += this.score;
    save.cycleDao += this.dao;
    save.permanentDao += this.dao;

    if (!save.bestScores[this.levelId] || save.bestScores[this.levelId].score < this.score) {
      save.bestScores[this.levelId] = { score: this.score, correct: this.correctCount, dao: this.dao };
    }
    if (passed && !save.completed.includes(this.levelId)) {
      save.completed.push(this.levelId);
      if (FRAGMENTS[this.levelId] && !save.fragments.includes(this.levelId)) {
        save.fragments.push(this.levelId);
      }
    }

    CycleManager.addRound(save, this.levelId, passed);
    // lucky bonus: +10% 功勋 at cycle end
    if (this.ownedIntuitions.indexOf('lucky_bonus') >= 0) {
      var bonusDao = Math.floor(this.dao * 0.1);
      if (bonusDao > 0) { this.dao += bonusDao; save.cycleDao += bonusDao; save.permanentDao += bonusDao; }
    }
    const nextId = this._nextLevelId();
    if (nextId && !save.unlocked.includes(nextId)) save.unlocked.push(nextId);

    const cycleResult = CycleManager.checkCycleEnd(save);
    if (!cycleResult) SaveManager.save(save);

    document.getElementById('phaser-container').style.display = 'none';
    this.scene.stop();

    if (cycleResult) {
      window.dispatchEvent(new CustomEvent('game:cycleEnd', {
        detail: {
          result: cycleResult,
          levelResult: {
            levelId: this.levelId, score: this.score, correct: this.correctCount,
            wrong: this.wrongCount, passed, hiddenRule: this.revealedHiddenRule, dao: this.dao,
            sceneKey: this.config.scene
          }
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('game:levelEnd', {
        detail: {
          levelId: this.levelId, sceneKey: this.config.scene,
          score: this.score, correct: this.correctCount,
          wrong: this.wrongCount, passed, hiddenRule: this.revealedHiddenRule,
          dao: this.dao, combo: this.combo, required: this.requiredCorrect
        }
      }));
    }
  }

  _nextLevelId() {
    const idx = LEVELS.findIndex(l => l.id === this.levelId);
    if (idx >= 0 && idx < LEVELS.length - 1 && LEVELS[idx].tutor === LEVELS[idx + 1].tutor) {
      return LEVELS[idx + 1].id;
    }
    return null;
  }
}


