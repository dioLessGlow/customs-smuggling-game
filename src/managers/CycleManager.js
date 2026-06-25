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
      const convertedDao = save.cycleDao || 0;
      save.permanentDao += convertedDao;
      save.currentCycle++;
      const newEcho = this._unlockRandomEcho(save);
      save.roundsInCycle = [];
      save.cycleDao = 0;
      SaveManager.save(save);
      return { success, cycle: save.currentCycle - 1, passed, total: this.CYCLE_SIZE, newEcho, convertedDao };
    } else {
      const lostDao = save.cycleDao || 0;
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
