var SaveManager = {
  load() {
    try {
      if (typeof localStorage !== 'undefined' && window.location.protocol !== 'file:') {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) { _memoryStore = this._migrate(JSON.parse(raw)); return JSON.parse(JSON.stringify(_memoryStore)); }
      }
    } catch(e) {}
    if (_memoryStore) return JSON.parse(JSON.stringify(_memoryStore));
    return this.getDefault();
  },

  getDefault() {
    return {
      unlocked: ['k01','k07','k13','k19','k25','k31'],
      completed: [],
      totalScore: 0,
      bestScores: {},
      currentCycle: 1,
      roundsInCycle: [],
      cycleDao: 0,
      permanentDao: 3,
      echoSkills: [],
      currentEcho: null,
      chosenCharacterId: null,
      fragments: [],
      archive: [],
      seenItems: [],
      settings: { sound: true, vibration: true },
      lastPlayed: Date.now(),
      // shop system v3.2
      shopItems: [],
      shopKnowledge: [],
      quizResults: {},
      firstWinBonuses: [],
      hasShared: false,
      lastLoginDate: '',
      loginStreak: 0,
      // tutor affinity v3.3
      tutorAffinity: { linrui:0, chenfeng:0, zhaohai:0, baiwei:0, laozhou:0, xiaohui:0 }
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

  _migrate(old) {
    if (!old || !old.unlocked) return this.getDefault();
    var def = this.getDefault();
    if (old.unlocked.length > 0 && old.unlocked[0].indexOf('_') > 0) {
      if (old.permanentDao) def.permanentDao = old.permanentDao;
      if (old.totalScore) def.totalScore = old.totalScore;
      if (old.echoSkills) def.echoSkills = old.echoSkills;
      if (old.chosenCharacterId) def.chosenCharacterId = old.chosenCharacterId;
      if (old.fragments) def.fragments = old.fragments;
      if (old.seenItems) def.seenItems = old.seenItems;
      if (old.settings) def.settings = old.settings;
      return def;
    }
    if (!old.shopItems) old.shopItems = def.shopItems;
    if (!old.shopKnowledge) old.shopKnowledge = def.shopKnowledge;
    if (!old.quizResults) old.quizResults = def.quizResults;
    if (!old.firstWinBonuses) old.firstWinBonuses = def.firstWinBonuses;
    if (!old.hasShared) old.hasShared = def.hasShared;
    if (!old.lastLoginDate) old.lastLoginDate = def.lastLoginDate;
    if (!old.loginStreak) old.loginStreak = def.loginStreak;
    if (!old.tutorAffinity) old.tutorAffinity = def.tutorAffinity;
    return old;
  },

  unlockNextLevel(levelId) {
    var save = this.load();
    var idx = LEVELS.findIndex(function(l) { return l.id === levelId; });
    if (idx >= 0 && idx < LEVELS.length - 1) {
      var next = LEVELS[idx + 1];
      if (LEVELS[idx].tutor === next.tutor) {
        if (!save.unlocked.includes(next.id)) save.unlocked.push(next.id);
      }
    }
    this.save(save);
  },

  addAffinity(tutorId, amount) {
    if (!tutorId) return;
    var save = this.load();
    save.tutorAffinity[tutorId] = Math.min(100, (save.tutorAffinity[tutorId] || 0) + amount);
    this.save(save);
  },

  checkDailyLogin() {
    var save = this.load();
    var today = new Date().toDateString();
    if (save.lastLoginDate === today) return save;
    if (save.lastLoginDate) {
      var yesterday = new Date(Date.now() - 86400000).toDateString();
      if (save.lastLoginDate === yesterday) {
        save.loginStreak = (save.loginStreak || 0) + 1;
      } else {
        save.loginStreak = 1;
      }
      if (save.loginStreak % 7 === 0) {
        save.permanentDao += 10;
      }
    } else {
      save.loginStreak = 1;
    }
    save.lastLoginDate = today;
    this.save(save);
    return save;
  }
};
