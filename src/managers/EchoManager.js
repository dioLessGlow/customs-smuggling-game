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
  },

  getCharacterEcho(save) {
    if (save.chosenCharacterId) {
      var echoId = TUTOR2ECHO[save.chosenCharacterId];
      if (echoId) {
        var echo = ECHO_POOL.find(function(e) { return e.id === echoId; });
        if (echo) {
          save.currentEcho = echo.id;
          return echo;
        }
      }
    }
    return this.pickRandomEcho(save);
  }
};
