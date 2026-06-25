// ============================================
// 缉私终焉 · 十日轮回 v2.0 (修复版)
// Phaser 3 + 原生 JavaScript
// 修复：file:// 协议兼容、音频初始化、关卡配置
// ============================================

const SAVE_KEY = 'anti_smuggling_save_v2';
let _memoryStore = null;

// ========== 关卡配置 ==========
const LEVEL_CONFIG = {
  human: [
    { id:'human_rat', name:'鼠窃', desc:'水客夹带', icon:'🐭', time:60, items:5, required:4, scene:'RatScene', mechanic:'basic',
      hiddenRule:'走私者会故意在前2件放合法物品，\n第3件往往是真的走私品' },
    { id:'human_ox', name:'牛冻', desc:'冻品走私', icon:'🐂', time:55, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'冻品通常藏在大批量同类货物的最底层' },
    { id:'human_tiger', name:'虎牙', desc:'象牙制品', icon:'🐯', time:60, items:5, required:4, scene:'TigerScene', mechanic:'magnifier',
      hiddenRule:'放大镜次数有限，VIP行李会浪费你的使用次数' },
    { id:'human_rabbit', name:'兔穴', desc:'异宠走私', icon:'🐰', time:50, items:5, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'异宠常藏在空心玩偶或改装容器中' },
    { id:'human_dragon', name:'龙火', desc:'枪支弹药', icon:'🐲', time:45, items:4, required:3, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'枪支零件可拆散，但金属密度检测会暴露' },
    { id:'human_snake', name:'蛇毒', desc:'毒品走私', icon:'🐍', time:60, items:5, required:4, scene:'SnakeScene', mechanic:'risk',
      hiddenRule:'连续正确3次触发缉私直觉，\n下次错误不扣分' },
    { id:'human_horse', name:'马道', desc:'伪报瞒报', icon:'🐴', time:55, items:5, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'伪报品名通常价值差额巨大' },
    { id:'human_goat', name:'羊裘', desc:'高档消费品', icon:'🐑', time:50, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'奢侈品造假常忽略防伪标细节' },
    { id:'human_monkey', name:'猴机', desc:'电子产品', icon:'🐵', time:60, items:5, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'拆机检查主板编号可发现翻新机伪装' },
    { id:'human_rooster', name:'鸡笼', desc:'禁运物品', icon:'🐔', time:45, items:4, required:3, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'文物走私常以仿制品名义报关' },
    { id:'human_dog', name:'犬嗅', desc:'涉海走私', icon:'🐶', time:55, items:5, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'海上走私多利用夜色掩护，X光仍是关键' },
    { id:'human_pig', name:'猪宴', desc:'洋垃圾', icon:'🐷', time:50, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'洋垃圾常夹带医疗废物，危险性极高' }
  ],
  earth: [
    { id:'earth_rat', name:'地鼠', desc:'水客团伙', icon:'🐭', time:50, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'X光+重量双重核对可识破夹层' },
    { id:'earth_ox', name:'地牛', desc:'冻品链条', icon:'🐂', time:45, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'冷链物流单据日期与批次需对应' },
    { id:'earth_tiger', name:'地虎', desc:'象牙网络', icon:'🐯', time:50, items:6, required:4, scene:'TigerScene', mechanic:'magnifier',
      hiddenRule:'象牙交易常以工艺品展览为掩护' },
    { id:'earth_rabbit', name:'地兔', desc:'异宠黑市', icon:'🐰', time:45, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'爬宠爱好者论坛实为交易暗网' },
    { id:'earth_dragon', name:'地龙', desc:'军火走私', icon:'🐲', time:40, items:5, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'枪支常拆解后分多批次运输' },
    { id:'earth_snake', name:'地蛇', desc:'毒品网络', icon:'🐍', time:50, items:6, required:4, scene:'SnakeScene', mechanic:'risk',
      hiddenRule:'人体藏毒者体态异常可识别' },
    { id:'earth_horse', name:'地马', desc:'伪报团伙', icon:'🐴', time:45, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'同一发货人多批次小额申报是典型手法' },
    { id:'earth_goat', name:'地羊', desc:'奢侈品洗钱', icon:'🐑', time:45, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'洗钱流水常通过拍卖行循环' },
    { id:'earth_monkey', name:'地猴', desc:'电子黑市', icon:'🐵', time:50, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'二手平台链接是销赃主要渠道' },
    { id:'earth_rooster', name:'地鸡', desc:'文物通道', icon:'🐔', time:40, items:5, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'出土文物带有特定土壤残留可检测' },
    { id:'earth_dog', name:'地狗', desc:'海上缉私', icon:'🐶', time:45, items:6, required:4, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'AIS信号异常关闭是走私船只特征' },
    { id:'earth_pig', name:'地猪', desc:'洋垃圾链', icon:'🐷', time:45, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'废塑料分类编码可追踪来源国' }
  ],
  heaven: [
    { id:'heaven_rat', name:'天鼠', desc:'国际水客集团', icon:'🐭', time:40, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'跨国水客利用外交豁免权夹带' },
    { id:'heaven_ox', name:'天牛', desc:'跨国冻品帝国', icon:'🐂', time:35, items:8, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'伪造卫生证书与原产地证是常见手法' },
    { id:'heaven_tiger', name:'天虎', desc:'象牙王', icon:'🐯', time:40, items:7, required:5, scene:'TigerScene', mechanic:'magnifier',
      hiddenRule:'拍卖行预展是象牙洗白关键环节' },
    { id:'heaven_rabbit', name:'天兔', desc:'异宠王国', icon:'🐰', time:40, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'濒危物种贸易受CITES公约管制' },
    { id:'heaven_dragon', name:'天龙', desc:'终极军火商', icon:'🐲', time:35, items:6, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'3D打印枪支零件无金属信号更难检测' },
    { id:'heaven_snake', name:'天蛇', desc:'毒品帝国', icon:'🐍', time:40, items:7, required:5, scene:'SnakeScene', mechanic:'risk',
      hiddenRule:'新型毒品常伪装成化妆品和食品' },
    { id:'heaven_horse', name:'天马', desc:'洗钱网络', icon:'🐴', time:40, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'加密货币支付已替代传统现金交易' },
    { id:'heaven_goat', name:'天羊', desc:'奢侈品帝国', icon:'🐑', time:35, items:8, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'限量版释出渠道是鉴定关键' },
    { id:'heaven_monkey', name:'天猴', desc:'电子黑市王', icon:'🐵', time:40, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'翻新芯片的专业检测需X射线' },
    { id:'heaven_rooster', name:'天鸡', desc:'文物大盗', icon:'🐔', time:35, items:6, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'碳14测年可辨别文物真伪' },
    { id:'heaven_dog', name:'天狗', desc:'海上之王', icon:'🐶', time:35, items:7, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'卫星遥感可监测公海船舶非法转运' },
    { id:'heaven_pig', name:'天猪', desc:'洋垃圾皇帝', icon:'🐷', time:35, items:8, required:5, scene:'GenericLevelScene', mechanic:'basic',
      hiddenRule:'危险废物越境转移受巴塞尔公约限制' }
  ]
};

// ========== 回响池 ==========
const ECHO_POOL = [
  { id:'lingwen', name:'灵闻', desc:'提前显示物品类别', icon:'👂', effect:'reveal', color:'#00e5ff' },
  { id:'tizui', name:'替罪', desc:'本次错误不扣分', icon:'🛡️', effect:'nullify', color:'#76ff03' },
  { id:'zhaozai', name:'招灾', desc:'扣分减半', icon:'🌪️', effect:'half', color:'#ff9100' },
  { id:'tianxing', name:'天行健', desc:'时间暂停5秒', icon:'⏸️', effect:'pause', color:'#ea80fc' },
  { id:'busheng', name:'生生不息', desc:'答错不中断连击', icon:'♾️', effect:'combo', color:'#ff4081' },
  { id:'qiangyun', name:'强运', desc:'额外一次重试', icon:'🍀', effect:'retry', color:'#69f0ae' }
];

// ========== 剧情碎片 ==========
const FRAGMENTS = {
  human_rat: '你在一件行李中发现大量同一品牌的手机。\n这背后是一个跨国水客集团……',
  human_ox: '冷库中堆满来自疫区的冻肉。\n非洲猪瘟正通过这些渠道扩散。',
  human_tiger: '一根象牙雕刻上刻着一个古老的符号。\n它指向一个横跨三国的走私网络。',
  human_rabbit: '一只看似普通的宠物龟，\n体内竟藏有数十枚稀有蛇卵。',
  human_dragon: '拆解的枪支配件中有一张纸条：\n"下次交货在澳门十六铺。"',
  human_snake: '体检X光片显示异常阴影。\n体内藏毒者说出了一个名字："天龙"。',
  human_horse: '报关单上的金额与实际货物相差百倍。\n这家公司背后是同一个神秘账户。',
  human_goat: '一块名表内部刻着微缩编号。\n它来自一次未破的珠宝盗窃案。',
  human_monkey: '拆开手机，主板编号与官方记录不符。\n这是一个覆盖全国的翻新机帝国。',
  human_rooster: '一件青铜器底部有新的焊接痕迹。\n它刚从海底沉船中被盗捞上来。',
  human_dog: '渔船的GPS轨迹显示它在公海停留。\n那里是走私船的中转坐标。',
  human_pig: '废塑料包中发现医疗废物的标志。\n这违反了《巴塞尔公约》。'
};

// ========== 存档系统 ==========
const SaveManager = {
  load() {
    try {
      if (typeof localStorage !== 'undefined' && window.location.protocol !== 'file:') {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) { _memoryStore = JSON.parse(raw); return JSON.parse(JSON.stringify(_memoryStore)); }
      }
    } catch(e) {}
    if (_memoryStore) return JSON.parse(JSON.stringify(_memoryStore));
    return this.getDefault();
  },

  getDefault() {
    return {
      unlocked: ['human_rat'],
      completed: [],
      totalScore: 0,
      bestScores: {},
      currentCycle: 1,
      roundsInCycle: [],
      cycleDao: 0,
      permanentDao: 0,
      echoSkills: [],
      currentEcho: null,
      fragments: [],
      archive: [],
      settings: { sound: true, vibration: true },
      lastPlayed: Date.now()
    };
  },

  save(data) {
    _memoryStore = JSON.parse(JSON.stringify(data));
    try {
      if (typeof localStorage !== 'undefined' && window.location.protocol !== 'file:') {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      }
    } catch(e) {}
  },

  unlockNextLevel(levelId) {
    const save = this.load();
    const allLevels = Object.values(LEVEL_CONFIG).flat();
    const idx = allLevels.findIndex(l => l.id === levelId);
    if (idx >= 0 && idx < allLevels.length - 1) {
      const next = allLevels[idx + 1];
      if (!save.unlocked.includes(next.id)) {
        save.unlocked.push(next.id);
      }
    }
    const humanCompleted = LEVEL_CONFIG.human.filter(l => save.completed.includes(l.id)).length;
    if (humanCompleted >= 12) {
      LEVEL_CONFIG.earth.forEach(l => {
        if (!save.unlocked.includes(l.id)) save.unlocked.push(l.id);
      });
    }
    const earthCompleted = LEVEL_CONFIG.earth.filter(l => save.completed.includes(l.id)).length;
    if (earthCompleted >= 12) {
      LEVEL_CONFIG.heaven.forEach(l => {
        if (!save.unlocked.includes(l.id)) save.unlocked.push(l.id);
      });
    }
    this.save(save);
  }
};

// ========== 轮回管理器 ==========
const CycleManager = {
  CYCLE_SIZE: 10,

  addRound(save, levelId, passed) {
    if (passed && !save.roundsInCycle.includes(levelId)) {
      save.roundsInCycle.push(levelId);
    }
  },

  checkCycleEnd(save) {
    if (save.roundsInCycle.length >= this.CYCLE_SIZE) {
      return this.endCycle(save);
    }
    return null;
  },

  endCycle(save) {
    const passed = save.roundsInCycle.length;
    const threshold = Math.ceil(this.CYCLE_SIZE * 0.6);
    const success = passed >= threshold;

    if (success) {
      save.currentCycle++;
      const newEcho = this._unlockRandomEcho(save);
      save.roundsInCycle = [];
      save.cycleDao = 0;
      SaveManager.save(save);
      return { success, cycle: save.currentCycle - 1, passed, total: this.CYCLE_SIZE, newEcho };
    } else {
      const lostDao = save.cycleDao;
      save.roundsInCycle = [];
      save.cycleDao = 0;
      SaveManager.save(save);
      return { success, cycle: save.currentCycle, passed, total: this.CYCLE_SIZE, lostDao };
    }
  },

  _unlockRandomEcho(save) {
    const locked = ECHO_POOL.filter(e => !save.echoSkills.includes(e.id));
    if (locked.length === 0) return null;
    const pick = Phaser.Utils.Array.GetRandom(locked);
    save.echoSkills.push(pick.id);
    return pick;
  }
};

// ========== 回响管理器 ==========
const EchoManager = {
  getActiveEcho(save) {
    if (save.currentEcho && save.echoSkills.includes(save.currentEcho)) {
      return ECHO_POOL.find(e => e.id === save.currentEcho);
    }
    return null;
  },

  pickRandomEcho(save) {
    if (save.echoSkills.length === 0) return null;
    const pick = Phaser.Utils.Array.GetRandom(save.echoSkills);
    save.currentEcho = pick;
    return ECHO_POOL.find(e => e.id === pick);
  },

  clearEcho(save) {
    save.currentEcho = null;
  }
};

// ========== 音效 ==========
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._unlocked = false;
  }

  unlock() {
    if (this._unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this._unlocked = true;
    } catch(e) {}
  }

  play(type) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') { this.ctx.resume(); return; }
    switch(type) {
      case 'correct': this._tone(880, 1760, 0.3, 'sine', 0.2); break;
      case 'wrong': this._tone(150, 100, 0.5, 'sawtooth', 0.2); break;
      case 'alarm': this._siren(); break;
      case 'click': this._tone(600, 800, 0.1, 'sine', 0.1); break;
      case 'levelup': this._tone(523, 1047, 0.4, 'sine', 0.2); break;
      case 'scan': this._tone(1200, 1800, 0.2, 'square', 0.1); break;
      case 'echo': this._tone(660, 1320, 0.6, 'sine', 0.25); break;
      case 'cycle': this._playCycle(); break;
    }
  }

  _tone(sf, ef, dur, type, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(sf, this.ctx.currentTime);
    if (ef) osc.frequency.exponentialRampToValueAtTime(ef, this.ctx.currentTime + dur * 0.3);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  _siren() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  _playCycle() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.ctx) this._tone(freq, freq * 1.5, 0.2, 'sine', 0.15);
      }, i * 150);
    });
  }
}

const soundManager = new SoundManager();

// ========== UI 组件 ==========
class PopupText extends Phaser.GameObjects.Text {
  constructor(scene, x, y, text, color, size) {
    color = color || '#ffffff';
    size = size || 28;
    super(scene, x, y, text, {
      fontSize: size + 'px',
      fontFamily: 'Arial Black, "PingFang SC", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    scene.add.existing(this);
    this.setOrigin(0.5);
    scene.tweens.add({
      targets: this, y: y - 60, scale: 1.3, alpha: 0, duration: 800, ease: 'Power2',
      onComplete: () => this.destroy()
    });
  }
}

class EchoIndicator {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.bg = scene.add.rectangle(0, 0, 180, 36, 0x000000, 0.7).setStrokeStyle(1, 0xffd700);
    this.icon = scene.add.text(-75, 0, '', { fontSize: '18px' }).setOrigin(0.5);
    this.name = scene.add.text(-45, 0, '', { fontSize: '13px', color: '#ffd700', fontFamily:'Arial Black, sans-serif' }).setOrigin(0, 0.5);
    this.container.add([this.bg, this.icon, this.name]);
    this.container.setAlpha(0);
  }

  show(echo) {
    if (!echo) return;
    this.icon.setText(echo.icon);
    this.name.setText(echo.name);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 200 });
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({ targets: this.container, alpha: 0, duration: 300 });
    });
  }

  hide() {
    this.container.setAlpha(0);
  }
}

// ========== 场景：启动加载 ==========
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this._createTextures();
  }

  _createTextures() {
    const { width, height } = this.scale;

    // 行李
    const l = this.make.graphics({ add: false });
    l.fillStyle(0x8B6914); l.fillRoundedRect(0,0,120,100,10);
    l.fillStyle(0x6B4E0A); l.fillRoundedRect(10,10,100,80,5);
    l.fillStyle(0x4A3506); l.fillRect(45,0,30,20);
    l.generateTexture('luggage', 120, 100);

    // 扫描框
    const s = this.make.graphics({ add: false });
    s.lineStyle(3, 0x00e676); s.strokeRect(0,0,160,140);
    s.lineStyle(2, 0x00e676, 0.5); s.strokeRect(10,10,140,120);
    s.generateTexture('scanFrame', 160, 140);

    // 扫描线
    const sl = this.make.graphics({ add: false });
    sl.fillStyle(0x00e676, 0.6); sl.fillRect(0,0,160,3);
    sl.generateTexture('scanLine', 160, 3);

    // 粒子光点
    const f = this.make.graphics({ add: false });
    f.fillStyle(0xffffff); f.fillCircle(8,8,8);
    f.generateTexture('flare', 16, 16);

    // 印章
    const st = this.make.graphics({ add: false });
    st.lineStyle(4, 0xff0000); st.strokeCircle(40,40,35);
    st.lineStyle(2, 0xff0000); st.strokeCircle(40,40,28);
    st.generateTexture('stamp', 80, 80);

    // 背景星
    const bg = this.make.graphics({ add: false });
    for (let i=0; i<50; i++) {
      bg.fillStyle(0x4ecca3, Phaser.Math.FloatBetween(0.03,0.08));
      bg.fillCircle(Phaser.Math.Between(0,width), Phaser.Math.Between(0,height), Phaser.Math.Between(1,3));
    }
    bg.generateTexture('bgStars', width, height);

    // 放大镜
    const mg = this.make.graphics({ add: false });
    mg.lineStyle(4, 0xffffff); mg.strokeCircle(30, 30, 25);
    mg.lineStyle(6, 0xffffff); mg.beginPath();
    mg.moveTo(48, 48); mg.lineTo(70, 70); mg.strokePath();
    mg.generateTexture('magnifier', 75, 75);

    // 回响光环
    const echo = this.make.graphics({ add: false });
    echo.lineStyle(3, 0xffd700); echo.strokeCircle(20,20,18);
    echo.lineStyle(2, 0xffd700, 0.5); echo.strokeCircle(20,20,14);
    echo.fillStyle(0xffd700, 0.1); echo.fillCircle(20,20,18);
    echo.generateTexture('echoRing', 40, 40);
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);
    const loadText = this.add.text(width/2, height/2, '缉私终焉\n加载中...', {
      fontSize:'24px', color:'#4ecca3', fontFamily:'Arial Black, sans-serif',
      align:'center'
    }).setOrigin(0.5);
    this.tweens.add({ targets: loadText, alpha: 0.3, duration: 600, yoyo: true, repeat: 1 });
    this.time.delayedCall(1200, () => this.scene.start('MenuScene'));
  }
}

// ========== 场景：主菜单 ==========
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const { width, height } = this.scale;
    const save = SaveManager.load();

    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);
    this.add.image(width/2, height/2, 'bgStars').setAlpha(0.5);

    // 首次点击解锁音频（浏览器策略要求用户交互）
    this.input.once('pointerdown', () => soundManager.unlock());

    // 标题
    this.add.text(width/2, 50, '缉私终焉', {
      fontSize:'40px', fontFamily:'Arial Black, "PingFang SC", sans-serif',
      color:'#ffd700', stroke:'#b8860b', strokeThickness:4
    }).setOrigin(0.5);

    this.add.text(width/2, 95, '— 岐青乡望 · 反走私创意大赛 —', {
      fontSize:'11px', color:'#94a3b8'
    }).setOrigin(0.5);

    // 周期 & 道 信息
    this.add.text(width/2, 125, '第 ' + save.currentCycle + ' 周期  |  道：' + save.permanentDao, {
      fontSize:'13px', color:'#4ecca3', fontFamily:'monospace'
    }).setOrigin(0.5);

    // 回响显示
    if (save.echoSkills.length > 0) {
      const echoNames = save.echoSkills.map(id => {
        const e = ECHO_POOL.find(x => x.id === id);
        return e ? e.icon + e.name : '';
      }).join('  ');
      this.add.text(width/2, 148, '回响觉醒：' + echoNames, {
        fontSize:'11px', color:'#ffd700'
      }).setOrigin(0.5);
    }

    // 三级选择
    const tiers = [
      { key:'human', name:'人级', desc:'初入缉私 · 12关', color:0x4ecca3, y:210 },
      { key:'earth', name:'地级', desc:'深入调查 · 12关', color:0xf59e0b, y:300 },
      { key:'heaven', name:'天级', desc:'终局之战 · 12关', color:0xe94560, y:390 }
    ];

    tiers.forEach((tier) => {
      const levels = LEVEL_CONFIG[tier.key];
      const unlockedCount = levels.filter(l => save.unlocked.includes(l.id)).length;
      const completedCount = levels.filter(l => save.completed.includes(l.id)).length;
      const isUnlocked = unlockedCount > 0;
      const isAllDone = completedCount >= levels.length;

      const c = this.add.container(width/2, tier.y);

      const bgColor = isAllDone ? 0x1a3a2a : isUnlocked ? tier.color : 0x334155;
      const bg = this.add.rectangle(0, 0, 300, 75, bgColor)
        .setInteractive({ useHandCursor: isUnlocked })
        .setAlpha(isUnlocked ? 1 : 0.4)
        .setStrokeStyle(2, isAllDone ? 0xffd700 : isUnlocked ? 0xffffff : 0x475569);

      const nameText = this.add.text(0, -12, (isAllDone ? '✦ ' : '') + tier.name, {
        fontSize:'26px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);

      const descText = this.add.text(0, 16,
        isAllDone ? '已通关 ' + completedCount + '/' + levels.length + '  ✅' :
        isUnlocked ? tier.desc + '  (' + completedCount + '/' + levels.length + ')' :
        '🔒 暂未解锁', {
        fontSize:'13px', color: isUnlocked ? '#ffffff' : '#64748b'
      }).setOrigin(0.5);

      c.add([bg, nameText, descText]);

      if (isUnlocked) {
        bg.on('pointerdown', () => {
          soundManager.play('click');
          this.scene.start('LevelSelectScene', { tier: tier.key });
        });
        bg.on('pointerover', () => {
          this.tweens.add({ targets: c, scale: 1.05, duration: 100 });
          bg.setFillStyle(0xffffff, 0.1);
        });
        bg.on('pointerout', () => {
          this.tweens.add({ targets: c, scale: 1, duration: 100 });
          bg.setFillStyle(bgColor);
        });
      }
    });

    // 底部按钮
    const bottomY = height - 50;
    const archiveBtn = this.add.text(width/2 - 80, bottomY, '📖 图鉴', {
      fontSize:'14px', color:'#94a3b8'
    }).setInteractive({ useHandCursor: true });
    archiveBtn.on('pointerdown', () => {
      soundManager.play('click');
      this.scene.start('ArchiveScene');
    });

    const settingsBtn = this.add.text(width/2 + 80, bottomY, '⚙️ 设置', {
      fontSize:'14px', color:'#94a3b8'
    }).setInteractive({ useHandCursor: true });
    settingsBtn.on('pointerdown', () => {
      soundManager.play('click');
      this.scene.start('SettingsScene');
    });

    this.add.text(width/2, bottomY, '积分: ' + save.totalScore, {
      fontSize:'12px', color:'#64748b'
    }).setOrigin(0.5);
  }
}

// ========== 场景：关卡选择 ==========
class LevelSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelSelectScene' }); }

  init(data) {
    this.tier = data.tier || 'human';
  }

  create() {
    const { width, height } = this.scale;
    const save = SaveManager.load();
    const levels = LEVEL_CONFIG[this.tier];
    if (!levels) { this.scene.start('MenuScene'); return; }

    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);

    // 返回
    const backBtn = this.add.text(20, 20, '← 返回', {
      fontSize:'16px', color:'#94a3b8'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      soundManager.play('click');
      this.scene.start('MenuScene');
    });

    // 标题
    const tierNames = { human:'人级 · 初入缉私', earth:'地级 · 深入调查', heaven:'天级 · 终局之战' };
    this.add.text(width/2, 60, tierNames[this.tier], {
      fontSize:'24px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);

    // 周期进度
    const cycleText = '周期 ' + save.currentCycle + '  |  本轮 ' + save.roundsInCycle.length + '/' + CycleManager.CYCLE_SIZE;
    this.add.text(width/2, 88, cycleText, {
      fontSize:'11px', color:'#4ecca3', fontFamily:'monospace'
    }).setOrigin(0.5);

    const startY = 115;
    const gap = 47;

    levels.forEach((level, index) => {
      const y = startY + index * gap;
      if (y > height + 20) return;

      const unlocked = save.unlocked.includes(level.id);
      const completed = save.completed.includes(level.id);
      const inThisCycle = save.roundsInCycle.includes(level.id);

      const c = this.add.container(width/2, y);

      const bgColor = completed ? 0x0a2e1a : inThisCycle ? 0x1e3a5f : unlocked ? 0x1e293b : 0x0f172a;
      const borderColor = completed ? 0xffd700 : inThisCycle ? 0x4ecca3 : unlocked ? 0x4ecca3 : 0x334155;

      const bg = this.add.rectangle(0, 0, 340, 42, bgColor)
        .setStrokeStyle(2, borderColor)
        .setInteractive({ useHandCursor: unlocked });

      const icon = this.add.text(-150, 0, level.icon, { fontSize:'22px' }).setOrigin(0.5);
      const name = this.add.text(-120, -7, level.name, {
        fontSize:'15px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0, 0.5);
      const desc = this.add.text(-120, 10, level.desc, {
        fontSize:'10px', color:'#94a3b8'
      }).setOrigin(0, 0.5);

      let status;
      if (completed) {
        status = this.add.text(135, 0, '✅', { fontSize:'16px' }).setOrigin(0.5);
      } else if (inThisCycle) {
        status = this.add.text(135, 0, '🔄', { fontSize:'14px' }).setOrigin(0.5);
      } else if (unlocked) {
        status = this.add.text(135, 0, '▶', { fontSize:'18px', color:'#ffd700' }).setOrigin(0.5);
      } else {
        status = this.add.text(135, 0, '🔒', { fontSize:'14px' }).setOrigin(0.5);
      }

      c.add([bg, icon, name, desc, status]);

      if (unlocked && !completed) {
        bg.on('pointerdown', () => {
          soundManager.play('click');
          this.scene.start(level.scene, { levelId: level.id, tier: this.tier });
        });
        bg.on('pointerover', () => {
          bg.setStrokeStyle(3, 0xffffff);
          this.tweens.add({ targets: c, x: width/2 + 5, duration: 100 });
        });
        bg.on('pointerout', () => {
          bg.setStrokeStyle(2, borderColor);
          this.tweens.add({ targets: c, x: width/2, duration: 100 });
        });
      }
    });
  }
}

// ========== 通用关卡场景 ==========
class GenericLevelScene extends Phaser.Scene {
  constructor(config) { super(config || { key: 'GenericLevelScene' }); }

  init(data) {
    this.levelId = data.levelId || 'human_rat';
    this.tier = data.tier || 'human';
    this._findConfig();
    this._resetState();
    this._buildItemPool();
  }

  _findConfig() {
    const tiers = ['human','earth','heaven'];
    for (const t of tiers) {
      const found = LEVEL_CONFIG[t].find(l => l.id === this.levelId);
      if (found) { this.config = found; this.tier = t; return; }
    }
    this.config = LEVEL_CONFIG.human[0];
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
    this.echoActive = null;
    this.magnifierUses = cfg.mechanic === 'magnifier' ? 3 : 0;
    this.comboProtected = false;
    this.save = SaveManager.load();

    this.activeEcho = EchoManager.getActiveEcho(this.save);
    if (this.activeEcho && this.activeEcho.effect === 'retry') {
      this.retriesLeft = 1;
    }
  }

  _buildItemPool() {
    this.allItems = [
      { name:'普通手机', icon:'📱', type:'legal', cat:'电子产品', dw:200, aw:205 },
      { name:'普通书籍', icon:'📚', type:'legal', cat:'文化用品', dw:500, aw:510 },
      { name:'普通衣物', icon:'👕', type:'legal', cat:'纺织品', dw:300, aw:290 },
      { name:'普通零食', icon:'🍫', type:'legal', cat:'食品', dw:150, aw:155 },
      { name:'普通饮料', icon:'🧃', type:'legal', cat:'食品', dw:350, aw:340 },
      { name:'普通玩具', icon:'🧸', type:'legal', cat:'玩具', dw:250, aw:260 },
      { name:'走私香烟', icon:'🚬', type:'illegal', cat:'烟草', dw:200, aw:380 },
      { name:'走私冻肉', icon:'🥩', type:'illegal', cat:'冻品', dw:500, aw:820 },
      { name:'象牙制品', icon:'🐘', type:'illegal', cat:'濒危物种', dw:300, aw:550 },
      { name:'毒品', icon:'💊', type:'illegal', cat:'毒品', risk: true, dw:100, aw:250 },
      { name:'走私枪支', icon:'🔫', type:'illegal', cat:'武器', dw:200, aw:450 },
      { name:'异宠', icon:'🦎', type:'illegal', cat:'异宠', dw:150, aw:300 },
      { name:'走私文物', icon:'🏺', type:'illegal', cat:'文物', dw:500, aw:800 },
      { name:'洋垃圾', icon:'🗑️', type:'illegal', cat:'洋垃圾', dw:600, aw:900 },
      { name:'假奢侈品', icon:'👛', type:'illegal', cat:'假冒伪劣', dw:250, aw:380 },
      { name:'走私电子产品', icon:'💻', type:'illegal', cat:'电子产品', dw:500, aw:750 }
    ];
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
      seq.push(Object.assign({}, item));
    }
    // 确保第3件是走私（如有隐藏规则）
    if (this.config.hiddenRule && seq.length >= 3) {
      seq[2] = Object.assign({}, Phaser.Utils.Array.GetRandom(illegal));
    }
    return seq;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);
    this.add.image(width/2, height/2, 'bgStars').setAlpha(0.3);

    this._showDayIntro();
    this._createHUD();
    this._createScanArea();
    this._createButtons();
    this._createEchoIndicator();

    this.time.delayedCall(1500, () => {
      this._showItem();
      this.timeEvent = this.time.addEvent({
        delay: 1000, callback: this._onTick, callbackScope: this, loop: true
      });
      if (this.tier === 'heaven') this._scheduleFalseAlarm();
    });
  }

  _showDayIntro() {
    const { width, height } = this.scale;
    const dayNum = Math.min(this.save.roundsInCycle.length + 1, 10);
    const intro = this.add.container(width/2, height/2 - 30);

    const bg = this.add.rectangle(0, 0, 300, 120, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffd700);
    const dayText = this.add.text(0, -20, '第 ' + dayNum + ' 天', {
      fontSize:'36px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const levelText = this.add.text(0, 25, this.config.icon + ' ' + this.config.name, {
      fontSize:'18px', color:'#e2e8f0'
    }).setOrigin(0.5);
    const descText = this.add.text(0, 50, this.config.desc, {
      fontSize:'13px', color:'#94a3b8'
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
    this.add.text(width/2, 30, this.config.icon + ' ' + this.config.name, {
      fontSize:'18px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    this.add.text(width/2, 50, this.config.desc, {
      fontSize:'11px', color:'#94a3b8'
    }).setOrigin(0.5);

    this.timeText = this.add.text(20, 72, '⏱ ' + this.timeLimit, {
      fontSize:'16px', color:'#ffffff', fontFamily:'monospace'
    });

    this.progressText = this.add.text(width - 20, 72, '📦 0/' + this.itemsPerWave, {
      fontSize:'14px', color:'#94a3b8'
    }).setOrigin(1, 0);

    this.comboText = this.add.text(width/2, 72, '', {
      fontSize:'13px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5, 0);

    this.protectText = this.add.text(20, 92, '', {
      fontSize:'11px', color:'#00e5ff', fontFamily:'monospace'
    });

    this.scoreText = this.add.text(width/2, 92, '', {
      fontSize:'13px', color:'#ffd700', fontFamily:'monospace'
    }).setOrigin(0.5, 0);
    this._updateScoreDisplay();
  }

  _updateScoreDisplay() {
    const daoStr = '道 +' + this.dao + ' 分 ' + this.score;
    this.scoreText.setText(daoStr);
  }

  _createScanArea() {
    const { width, height } = this.scale;
    const cx = width/2;
    const cy = height/2 - 30;

    this.scanFrame = this.add.image(cx, cy, 'scanFrame');
    this.luggageSprite = this.add.image(cx, cy, 'luggage').setScale(0).setAlpha(0);
    this.itemIcon = this.add.text(cx, cy - 10, '', { fontSize:'56px' }).setOrigin(0.5).setAlpha(0);
    this.itemName = this.add.text(cx, cy + 45, '', {
      fontSize:'16px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5).setAlpha(0);
    this.scanLine = this.add.image(cx, cy - 70, 'scanLine').setAlpha(0);
    this.stamp = this.add.image(cx, cy, 'stamp').setScale(2).setAlpha(0).setRotation(-0.3);

    // 重量显示（地级/天级）
    if (this.tier === 'earth' || this.tier === 'heaven') {
      this.weightText = this.add.text(cx, cy + 75, '', {
        fontSize:'11px', color:'#94a3b8', fontFamily:'monospace'
      }).setOrigin(0.5);
    }

    // 人体扫描（蛇关卡）
    if (this.config.mechanic === 'risk') {
      this.bodyScan = this.add.container(cx + 100, cy - 20);
      const body = this.add.rectangle(0, 10, 30, 80, 0x4ecca3, 0.15).setStrokeStyle(1, 0x4ecca3, 0.4);
      const head = this.add.circle(0, -35, 14, 0x4ecca3, 0.15).setStrokeStyle(1, 0x4ecca3, 0.4);
      this.bodyDot = this.add.circle(0, 10, 6, 0xff4444, 0).setStrokeStyle(0);
      this.bodyScan.add([body, head, this.bodyDot]);
      this.bodyScan.setAlpha(0);
    }

    // 放大镜按钮（虎牙关）
    if (this.config.mechanic === 'magnifier') {
      this.magBtn = this.add.image(cx + 85, cy, 'magnifier')
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.7)
        .setScale(0.8);
      this.magCountText = this.add.text(cx + 85, cy + 45, '🔍 ' + this.magnifierUses, {
        fontSize:'12px', color:'#00e5ff'
      }).setOrigin(0.5);
      this.magBtn.on('pointerdown', () => this._useMagnifier());
    }

    this.echoRing = this.add.image(cx, cy - 10, 'echoRing').setAlpha(0).setScale(0);
  }

  _createButtons() {
    const { width, height } = this.scale;
    const btnY = height - 100;

    this.passBtn = this._makeButton(width/2 - 90, btnY, '✅ 放行', 0x00e676);
    this.seizeBtn = this._makeButton(width/2 + 90, btnY, '🚫 扣押', 0xff4444);

    this.passBtn.btn.on('pointerdown', () => this._judge('pass'));
    this.seizeBtn.btn.on('pointerdown', () => this._judge('seize'));

    this._setButtonsEnabled(false);
  }

  _makeButton(x, y, label, color) {
    const container = this.add.container(x, y);
    const btn = this.add.rectangle(0, 0, 130, 55, color)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, {
      fontSize:'17px', color: color === 0x00e676 ? '#000000' : '#ffffff',
      fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    container.add([btn, text]);

    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.05, duration: 100 }));
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 100 }));

    return { container, btn, text };
  }

  _createEchoIndicator() {
    const { width } = this.scale;
    this.echoIndicator = new EchoIndicator(this, width/2, 115);
  }

  _setButtonsEnabled(enabled) {
    this.passBtn.btn.input.enabled = enabled;
    this.seizeBtn.btn.input.enabled = enabled;
    this.passBtn.container.setAlpha(enabled ? 1 : 0.4);
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
    const bg = this.add.rectangle(0, 0, 150, 130, 0x000000, 0.85);
    const detail = this.add.text(0, -20, isBad ? '╱╲╱╲╱\n交叉纹理' : '───\n均匀纹理', {
      fontSize:'13px', color: isBad ? '#ff4444' : '#00e676', align:'center', fontFamily:'monospace'
    }).setOrigin(0.5);
    const label = this.add.text(0, 30, isBad ? item.name + ' ⚠️可疑' : item.name + ' ✅正常', {
      fontSize:'12px', color: isBad ? '#ff4444' : '#00e676'
    }).setOrigin(0.5);
    this.magnifierOverlay.add([bg, detail, label]);
    this.magnifierOverlay.setAlpha(0).setScale(0.5);
    this.tweens.add({ targets: this.magnifierOverlay, alpha: 1, scale: 1, duration: 200, ease: 'Back.out' });
    this.time.delayedCall(2500, () => {
      if (this.magnifierOverlay) {
        this.tweens.add({ targets: this.magnifierOverlay, alpha: 0, duration: 200,
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

    // 人体扫描（蛇关卡）
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

    // 重量显示（地级/天级）
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

    // 灵闻回响：提前显示类别
    if (this.activeEcho && this.activeEcho.effect === 'reveal') {
      this.time.delayedCall(100, () => {
        if (!this.isEnding) {
          this.itemName.setText(item.type === 'illegal' ? '⚠️ 可疑物品' : '✅ 正常物品');
          this.itemName.setColor(item.type === 'illegal' ? '#ff9100' : '#00e676');
        }
      });
    }

    this.scanLine.setAlpha(1);
    this.tweens.add({
      targets: this.scanLine, y: this.scanLine.y + 140,
      duration: 1000, ease: 'Linear', yoyo: true, repeat: 0,
      onComplete: () => {
        if (this.isEnding) return;
        this.scanLine.setAlpha(0);
        this.itemName.setText(item.name);
        if (this.config.mechanic === 'magnifier' && this._realIcon) {
          this.itemIcon.setText(this._realIcon);
        }
        this._setButtonsEnabled(true);
        this.gameState = 'judging';
      }
    });

    soundManager.play('scan');
  }

  _judge(choice) {
    if (this.gameState !== 'judging' || this.isEnding) return;
    this._setButtonsEnabled(false);
    this.gameState = 'result';

    const item = this.itemSequence[this.currentItem];
    const isIllegal = item.type === 'illegal';
    const isCorrect = (choice === 'seize' && isIllegal) || (choice === 'pass' && !isIllegal);

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - 30;

    if (isCorrect) {
      this.score += 10;
      this.dao += 1;
      this.correctCount++;
      this.combo++;
      soundManager.play('correct');
      new PopupText(this, cx, cy - 40, '+10 👍', '#00e676');

      if (this.combo >= 3) {
        this.comboText.setText('🔥 ' + this.combo + '连击');
        if (this.combo === 3 && !this.comboProtected) {
          this.comboProtected = true;
          this.time.delayedCall(300, () => new PopupText(this, cx, cy - 70, '🔮 缉私直觉', '#00e5ff', 16));
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

      let actualPenalty = basePenalty;
      if (this.activeEcho && this.activeEcho.effect === 'nullify') {
        actualPenalty = 0;
        EchoManager.clearEcho(this.save);
        new PopupText(this, cx, cy - 40, '🛡️ 替罪发动', '#76ff03');
      } else if (this.activeEcho && this.activeEcho.effect === 'half') {
        actualPenalty = Math.ceil(basePenalty / 2);
        new PopupText(this, cx, cy - 40, '🌪️ 扣分减半', '#ff9100');
      }

      if (this.comboProtected) {
        this.comboProtected = false;
        actualPenalty = 0;
        new PopupText(this, cx, cy - 40, '🔮 直觉抵挡', '#00e5ff', 16);
      } else {
        this.combo = 0;
      }

      this.score = Math.max(0, this.score - actualPenalty);
      this.wrongCount++;

      if (item.risk) {
        soundManager.play('alarm');
        this.cameras.main.shake(300, 0.015);
        new PopupText(this, cx, cy - 40, '-' + actualPenalty + ' 🚨 毒品!', '#ff0000', 36);
      } else {
        soundManager.play('wrong');
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
    const chosen = EchoManager.pickRandomEcho(this.save);
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

    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.5);
    const card = this.add.container(width/2, height/2 - 30);
    const cardBg = this.add.rectangle(0, 0, 280, 130, 0x1e293b).setStrokeStyle(2, 0xffd700);
    const title = this.add.text(0, -40, '✨ 回响觉醒', {
      fontSize:'20px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const echoText = this.add.text(0, -5, chosen.icon + ' ' + chosen.name, {
      fontSize:'24px', color: chosen.color || '#ffffff', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const descText = this.add.text(0, 25, chosen.desc, {
      fontSize:'13px', color:'#e2e8f0'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 50, '点击继续', {
      fontSize:'11px', color:'#64748b'
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

    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    const card = this.add.container(width/2, height/2);
    const cardBg = this.add.rectangle(0, 0, 320, 200, 0x1e293b).setStrokeStyle(2, 0xffd700);
    const title = this.add.text(0, -70, '💡 隐藏规则发现', {
      fontSize:'20px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    const content = this.add.text(0, -10, this.config.hiddenRule, {
      fontSize:'14px', color:'#e2e8f0', align:'center', lineSpacing:7, wordWrap: { width: 280 }
    }).setOrigin(0.5);
    const hint = this.add.text(0, 65, '点击继续', {
      fontSize:'11px', color:'#64748b'
    }).setOrigin(0.5);
    card.add([cardBg, title, content, hint]);
    card.setScale(0);
    this.tweens.add({ targets: card, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const p = this.add.particles(width/2, height/2, 'flare', {
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
    soundManager.play('alarm');
    this.cameras.main.shake(200, 0.008);
    this._setButtonsEnabled(false);

    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.35);
    const alarmText = this.add.text(width/2, height/2 - 20, '🚨 假警报!\n点击忽略', {
      fontSize:'22px', color:'#ff4444', fontFamily:'Arial Black, sans-serif', align:'center'
    }).setOrigin(0.5);

    const flash = this.add.rectangle(0, 0, width, height, 0xff0000, 0.08).setOrigin(0);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, yoyo: true, repeat: 2,
      onComplete: () => flash.destroy() });

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
    this.timeLimit--;
    this.timeText.setText('⏱ ' + this.timeLimit);
    if (this.timeLimit <= 10) this.timeText.setColor('#ff4444');
    if (this.timeLimit <= 0) this._endLevel();
  }

  _endLevel() {
    if (this.isEnding) return;
    this.isEnding = true;
    if (this.timeEvent) this.timeEvent.remove();
    if (this._alarmTimer) this._alarmTimer.remove();

    const passed = this.correctCount >= this.requiredCorrect;

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
    const nextId = this._nextLevelId();
    if (nextId && !save.unlocked.includes(nextId)) save.unlocked.push(nextId);
    const humanDone = LEVEL_CONFIG.human.filter(l => save.completed.includes(l.id)).length >= 12;
    const earthDone = LEVEL_CONFIG.earth.filter(l => save.completed.includes(l.id)).length >= 12;
    if (humanDone) LEVEL_CONFIG.earth.forEach(l => { if (!save.unlocked.includes(l.id)) save.unlocked.push(l.id); });
    if (earthDone) LEVEL_CONFIG.heaven.forEach(l => { if (!save.unlocked.includes(l.id)) save.unlocked.push(l.id); });

    const cycleResult = CycleManager.checkCycleEnd(save);
    if (!cycleResult) SaveManager.save(save);

    if (cycleResult) {
      this.scene.start('CycleSummaryScene', {
        result: cycleResult,
        levelResult: {
          levelId: this.levelId, score: this.score, correct: this.correctCount,
          wrong: this.wrongCount, passed, hiddenRule: this.revealedHiddenRule, dao: this.dao
        }
      });
    } else {
      this.scene.start('ResultScene', {
        levelId: this.levelId, sceneKey: this.config.scene,
        score: this.score, correct: this.correctCount,
        wrong: this.wrongCount, passed, hiddenRule: this.revealedHiddenRule,
        dao: this.dao, combo: this.combo, required: this.requiredCorrect
      });
    }
  }

  _nextLevelId() {
    const all = Object.values(LEVEL_CONFIG).flat();
    const idx = all.findIndex(l => l.id === this.levelId);
    if (idx >= 0 && idx < all.length - 1) return all[idx + 1].id;
    return null;
  }
}

// ========== 子类关卡 ==========
class RatScene extends GenericLevelScene {
  constructor() { super({ key: 'RatScene' }); }
}
class TigerScene extends GenericLevelScene {
  constructor() { super({ key: 'TigerScene' }); }
}
class SnakeScene extends GenericLevelScene {
  constructor() { super({ key: 'SnakeScene' }); }
}

// ========== 场景：结算 ==========
class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  init(data) {
    this.r = data;
  }

  create() {
    const { width, height } = this.scale;
    const score = this.r.score || 0;
    const correct = this.r.correct || 0;
    const wrong = this.r.wrong || 0;
    const passed = this.r.passed;
    const hiddenRule = this.r.hiddenRule;
    const dao = this.r.dao || 0;
    const combo = this.r.combo || 0;
    const save = SaveManager.load();

    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);

    const titleColor = passed ? '#00e676' : '#ff4444';
    const titleText = passed ? '关卡通过' : '关卡失败';
    this.add.text(width/2, 80, titleText, {
      fontSize:'36px', color: titleColor, fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);

    const req = this.r.required || 4;
    let stars = 0;
    if (passed) {
      if (correct >= req + 1) stars = 3;
      else if (correct >= req) stars = 2;
      else stars = 1;
    }

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    this.add.text(width/2, 130, starStr, { fontSize:'28px' }).setOrigin(0.5);

    const stats = [
      { label:'得分', value:score },
      { label:'获取道', value:dao, color:'#ffd700' },
      { label:'正确', value:correct, color:'#00e676' },
      { label:'错误', value:wrong, color:'#ff4444' },
      { label:'最高连击', value:combo, color:'#ea80fc' }
    ];
    stats.forEach((s, i) => {
      const y = 180 + i * 38;
      this.add.text(width/2 - 80, y, s.label, { fontSize:'15px', color:'#94a3b8' }).setOrigin(0, 0.5);
      this.add.text(width/2 + 80, y, String(s.value), {
        fontSize:'18px', color: s.color || '#ffffff', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(1, 0.5);
    });

    if (save.echoSkills.length > 0) {
      const echos = save.echoSkills.map(id => {
        const e = ECHO_POOL.find(x => x.id === id);
        return e ? e.icon : '';
      }).join(' ');
      this.add.text(width/2, 390, '已觉醒回响：' + echos, {
        fontSize:'12px', color:'#ffd700'
      }).setOrigin(0.5);
    }

    // 碎片
    const fragId = this.r.levelId;
    if (FRAGMENTS[fragId] && passed) {
      const fragOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.6);
      const fragCard = this.add.container(width/2, height/2 - 20);
      const fragBg = this.add.rectangle(0, 0, 340, 200, 0x1e293b).setStrokeStyle(2, 0xffd700);
      const fragTitle = this.add.text(0, -70, '📜 剧情碎片', {
        fontSize:'18px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);
      const fragContent = this.add.text(0, 0, FRAGMENTS[fragId], {
        fontSize:'13px', color:'#e2e8f0', align:'center', lineSpacing:6, wordWrap:{ width: 300 }
      }).setOrigin(0.5);
      const fragHint = this.add.text(0, 70, '点击继续', {
        fontSize:'11px', color:'#64748b'
      }).setOrigin(0.5);
      fragCard.add([fragBg, fragTitle, fragContent, fragHint]);
      this.input.once('pointerdown', () => {
        this.tweens.add({ targets: [fragOverlay, fragCard], alpha: 0, duration: 200,
          onComplete: () => { fragOverlay.destroy(); fragCard.destroy(); }
        });
      });
    }

    // 按钮
    const btnY = height - 80;
    const sceneKey = this.r.sceneKey || 'GenericLevelScene';

    const retryBtn = this._makeResultBtn(width/2 - 90, btnY, '↻ 再来', 0x3b82f6, () => {
      this.scene.start(sceneKey, { levelId: this.r.levelId });
    });
    const menuBtn = this._makeResultBtn(width/2 + 90, btnY, '← 菜单', 0x334155, () => {
      this.scene.start('MenuScene');
    });

    // 通关特效
    if (passed) {
      soundManager.play('levelup');
      const particles = this.add.particles(width/2, height/2, 'flare', {
        speed: { min: 80, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.4, end: 0 },
        lifespan: 1000,
        quantity: 30,
        tint: [0x00e676, 0xffd700, 0x4ecca3]
      });
      this.time.delayedCall(1000, () => particles.destroy());
    }
  }

  _makeResultBtn(x, y, label, color, cb) {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 130, 50, color)
      .setInteractive({ useHandCursor: true });
    const t = this.add.text(0, 0, label, {
      fontSize:'16px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    c.add([bg, t]);
    bg.on('pointerdown', () => { soundManager.play('click'); cb(); });
    bg.on('pointerover', () => this.tweens.add({ targets: bg, scale: 1.05, duration: 100 }));
    bg.on('pointerout', () => this.tweens.add({ targets: bg, scale: 1, duration: 100 }));
    return c;
  }
}

// ========== 场景：周期结算 ==========
class CycleSummaryScene extends Phaser.Scene {
  constructor() { super({ key: 'CycleSummaryScene' }); }

  init(data) {
    this.result = data.result;
    this.level = data.levelResult;
  }

  create() {
    const { width, height } = this.scale;
    const r = this.result;

    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);
    this.add.image(width/2, height/2, 'bgStars').setAlpha(0.3);

    const isPassed = r.success;
    const cycleNum = r.cycle;
    const dayNum = r.passed;

    if (isPassed) {
      soundManager.play('cycle');
      this.add.text(width/2, 50, '✨ 第 ' + cycleNum + ' 周期 · 通关 ✨', {
        fontSize:'28px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);
    } else {
      this.add.text(width/2, 50, '💀 终焉·湮灭 💀', {
        fontSize:'28px', color:'#e94560', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);
    }

    this.add.text(width/2, 110, '通关 ' + dayNum + '/' + r.total + ' 关', {
      fontSize:'20px', color: isPassed ? '#00e676' : '#ff4444',
      fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);

    if (isPassed) {
      this.add.text(width/2, 150, '存活条件：≥ 6 关 ✅', {
        fontSize:'14px', color:'#4ecca3'
      }).setOrigin(0.5);
      if (r.newEcho) {
        this.add.text(width/2, 190, '新回响觉醒：' + r.newEcho.icon + ' ' + r.newEcho.name, {
          fontSize:'16px', color:'#ea80fc', fontFamily:'Arial Black, sans-serif'
        }).setOrigin(0.5);
      }
    } else {
      this.add.text(width/2, 150, '存活条件：≥ 6 关 ❌', {
        fontSize:'14px', color:'#ff4444'
      }).setOrigin(0.5);
      if (r.lostDao > 0) {
        this.add.text(width/2, 190, '湮灭损失：' + r.lostDao + ' 道', {
          fontSize:'14px', color:'#ff9100'
        }).setOrigin(0.5);
      }
    }

    const save = SaveManager.load();
    let retained = '保留：';
    if (save.echoSkills.length > 0) retained += ' 回响';
    if (save.fragments.length > 0) retained += ' 剧情碎片';
    if (save.archive.length > 0) retained += ' 图鉴';
    if (retained === '保留：') retained = '所有记忆已湮灭...';
    this.add.text(width/2, 250, retained, {
      fontSize:'13px', color:'#94a3b8'
    }).setOrigin(0.5);

    this.add.text(width/2, 280, '永久道：' + save.permanentDao, {
      fontSize:'14px', color:'#ffd700', fontFamily:'monospace'
    }).setOrigin(0.5);

    // 按钮
    const btnY = height - 100;
    const continueBtn = this.add.container(width/2, btnY);
    const btnBg = this.add.rectangle(0, 0, 200, 55, isPassed ? 0x4ecca3 : 0xe94560)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(0, 0, isPassed ? '继续下一周期 ▶' : '重新开始 ↻', {
      fontSize:'18px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    continueBtn.add([btnBg, btnText]);

    btnBg.on('pointerdown', () => {
      soundManager.play('click');
      this.scene.start('MenuScene');
    });
    btnBg.on('pointerover', () => this.tweens.add({ targets: continueBtn, scale: 1.05, duration: 100 }));
    btnBg.on('pointerout', () => this.tweens.add({ targets: continueBtn, scale: 1, duration: 100 }));

    if (isPassed) {
      const p = this.add.particles(width/2, height/2, 'flare', {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        lifespan: 2000,
        quantity: 5,
        frequency: 200,
        tint: [0xffd700, 0x4ecca3, 0xea80fc]
      });
      this.time.delayedCall(4000, () => p.destroy());
    }
  }
}

// ========== 场景：图鉴 ==========
class ArchiveScene extends Phaser.Scene {
  constructor() { super({ key: 'ArchiveScene' }); }

  create() {
    const { width, height } = this.scale;
    const save = SaveManager.load();

    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);

    // 返回
    const backBtn = this.add.text(20, 20, '← 返回', {
      fontSize:'16px', color:'#94a3b8'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      soundManager.play('click');
      this.scene.start('MenuScene');
    });

    this.add.text(width/2, 50, '📖 图鉴 · 剧情碎片', {
      fontSize:'22px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);

    const totalFrags = Object.keys(FRAGMENTS).length;
    const collected = save.fragments.length;
    this.add.text(width/2, 78, '已收集 ' + collected + '/' + totalFrags, {
      fontSize:'13px', color:'#94a3b8'
    }).setOrigin(0.5);

    // 回响展示
    if (save.echoSkills.length > 0) {
      this.add.text(width/2, 105, '已觉醒回响：', {
        fontSize:'13px', color:'#ea80fc'
      }).setOrigin(0.5);

      save.echoSkills.forEach((id, idx) => {
        const e = ECHO_POOL.find(x => x.id === id);
        if (!e) return;
        const x = width/2 - 120 + idx * 60;
        this.add.text(x, 130, e.icon, { fontSize:'24px' }).setOrigin(0.5);
        this.add.text(x, 152, e.name, { fontSize:'10px', color:e.color||'#ffffff' }).setOrigin(0.5);
      });
    }

    // 碎片列表
    const startY = save.echoSkills.length > 0 ? 180 : 120;
    let idx = 0;
    Object.entries(FRAGMENTS).forEach(([id, text]) => {
      const y = startY + idx * 34;
      if (y > height - 20) return;
      const unlocked = save.fragments.includes(id);
      const levelCfg = LEVEL_CONFIG.human.find(l => l.id === id) ||
                       LEVEL_CONFIG.earth.find(l => l.id === id) ||
                       LEVEL_CONFIG.heaven.find(l => l.id === id);
      const icon = levelCfg ? levelCfg.icon : '❓';
      const name = levelCfg ? levelCfg.name : id;

      if (unlocked) {
        this.add.text(20, y, icon + ' ' + name, {
          fontSize:'13px', color:'#e2e8f0'
        });
        this.add.text(width - 20, y, '📜', {
          fontSize:'12px', color:'#ffd700'
        }).setOrigin(1, 0);
      } else {
        this.add.text(20, y, '❓ ???', {
          fontSize:'13px', color:'#475569'
        });
        this.add.text(width - 20, y, '🔒', {
          fontSize:'12px', color:'#475569'
        }).setOrigin(1, 0);
      }
      idx++;
    });
  }
}

// ========== 场景：设置 ==========
class SettingsScene extends Phaser.Scene {
  constructor() { super({ key: 'SettingsScene' }); }

  create() {
    const { width, height } = this.scale;
    const save = SaveManager.load();

    this.add.rectangle(width/2, height/2, width, height, 0x0f172a);

    // 返回
    const backBtn = this.add.text(20, 20, '← 返回', {
      fontSize:'16px', color:'#94a3b8'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      soundManager.play('click');
      this.scene.start('MenuScene');
    });

    this.add.text(width/2, 50, '⚙️ 设置', {
      fontSize:'24px', color:'#ffd700', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);

    // 音效开关
    this._createToggle(width/2, 140, '音效', save.settings.sound, (val) => {
      save.settings.sound = val;
      soundManager.enabled = val;
      SaveManager.save(save);
    });

    // 震动开关
    this._createToggle(width/2, 200, '震动', save.settings.vibration, (val) => {
      save.settings.vibration = val;
      SaveManager.save(save);
    });

    // 重置存档
    const resetY = 300;
    this.add.text(width/2, resetY, '危险操作', {
      fontSize:'13px', color:'#e94560', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);

    const resetBtn = this.add.container(width/2, resetY + 40);
    const resetBg = this.add.rectangle(0, 0, 200, 45, 0xe94560)
      .setInteractive({ useHandCursor: true });
    const resetText = this.add.text(0, 0, '🗑️ 重置全部存档', {
      fontSize:'15px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
    }).setOrigin(0.5);
    resetBtn.add([resetBg, resetText]);

    resetBg.on('pointerdown', () => {
      const confirmOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
      const confirmCard = this.add.container(width/2, height/2);
      const cardBg = this.add.rectangle(0, 0, 300, 140, 0x1e293b).setStrokeStyle(2, 0xff4444);
      const confirmTitle = this.add.text(0, -40, '确认重置？', {
        fontSize:'20px', color:'#ff4444', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);
      const confirmDesc = this.add.text(0, -5, '所有进度、回响、碎片将永久丢失', {
        fontSize:'12px', color:'#94a3b8'
      }).setOrigin(0.5);

      const yesBtn = this.add.container(-80, 40);
      const yesBg = this.add.rectangle(0, 0, 100, 40, 0xff4444)
        .setInteractive({ useHandCursor: true });
      const yesText = this.add.text(0, 0, '确认', {
        fontSize:'15px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);
      yesBtn.add([yesBg, yesText]);

      const noBtn = this.add.container(80, 40);
      const noBg = this.add.rectangle(0, 0, 100, 40, 0x334155)
        .setInteractive({ useHandCursor: true });
      const noText = this.add.text(0, 0, '取消', {
        fontSize:'15px', color:'#ffffff', fontFamily:'Arial Black, sans-serif'
      }).setOrigin(0.5);
      noBtn.add([noBg, noText]);

      confirmCard.add([cardBg, confirmTitle, confirmDesc, yesBtn, noBtn]);

      yesBg.on('pointerdown', () => {
        try {
          if (typeof localStorage !== 'undefined' && window.location.protocol !== 'file:') {
            localStorage.removeItem(SAVE_KEY);
          }
        } catch(e) {}
        _memoryStore = null;
        this.scene.start('MenuScene');
      });
      noBg.on('pointerdown', () => {
        confirmOverlay.destroy();
        confirmCard.destroy();
      });
    });
  }

  _createToggle(x, y, label, initialValue, onChange) {
    let isOn = initialValue;
    this.add.text(x - 80, y, label, {
      fontSize:'16px', color:'#e2e8f0'
    }).setOrigin(0, 0.5);

    const toggle = this.add.container(x + 80, y);
    const bg = this.add.rectangle(0, 0, 50, 26, isOn ? 0x4ecca3 : 0x475569)
      .setInteractive({ useHandCursor: true });
    const knob = this.add.circle(isOn ? 12 : -12, 0, 10, 0xffffff);

    toggle.add([bg, knob]);
    toggle.setSize(50, 26);

    bg.on('pointerdown', () => {
      isOn = !isOn;
      const knobX = isOn ? 12 : -12;
      this.tweens.add({ targets: knob, x: knobX, duration: 150 });
      bg.setFillStyle(isOn ? 0x4ecca3 : 0x475569);
      onChange(isOn);
      soundManager.play('click');
    });
  }
}

// ============================================
// Phaser 配置
// ============================================
const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  parent: 'game-container',
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 480 },
    max: { width: 430, height: 932 }
  },
  scene: [
    BootScene, MenuScene, LevelSelectScene,
    GenericLevelScene, RatScene, TigerScene, SnakeScene,
    ResultScene, CycleSummaryScene, ArchiveScene, SettingsScene
  ]
};

const game = new Phaser.Game(config);
