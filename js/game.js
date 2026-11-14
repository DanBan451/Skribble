const PHASE = {
  LOBBY: "lobby",
  CHOOSING: "choosing",
  DRAWING: "drawing",
  REVEAL: "reveal",
  RESULTS: "results"
};

class SkribbleGame {
  constructor({ net, me, ui }) {
    this.net = net;
    this.me = me;
    this.ui = ui;
    this.players = new Map();
    this.settings = {
      rounds: 3,
      drawTime: 80,
      wordCount: 3,
      hints: 2,
      customWords: "",
      customOnly: false
    };
    this.phase = PHASE.LOBBY;
    this.round = 1;
    this.drawerOrder = [];
    this.drawerIndex = 0;
    this.currentWord = null;
    this.wordChoices = [];
    this.revealedHints = [];
    this.guessedIds = new Set();
    this.usedWords = new Set();
    this.wordPool = DEFAULT_WORDS.slice();
    this.endsAt = 0;
    this.timerId = null;
    this.hintTimers = [];
    this.turnScores = new Map();
  }

  addPlayer(player) {
    this.players.set(player.id, {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      score: player.score || 0,
      peerId: player.peerId || null,
      isHost: !!player.isHost
    });
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getDrawer() {
    const id = this.drawerOrder[this.drawerIndex];
    return this.players.get(id) || null;
  }

  iAmDrawer() {
    const d = this.getDrawer();
    return d && d.id === this.me.id;
  }

  publicState() {
    const drawer = this.getDrawer();
    return {
      type: "state",
      phase: this.phase,
      round: this.round,
      settings: this.settings,
      players: this.getPlayers(),
      drawerId: drawer?.id || null,
      blanks: this.currentWord ? wordBlank(this.currentWord, this.revealedHints) : "",
      secretWord: this.iAmDrawer() || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS
        ? this.currentWord
        : null,
      wordChoices: this.iAmDrawer() && this.phase === PHASE.CHOOSING ? this.wordChoices : null,
      guessedIds: Array.from(this.guessedIds),
      endsAt: this.endsAt,
      roomCode: this.net.roomCode
    };
  }

  broadcastState() {
    if (!this.net.isHost) return;
    const base = this.publicState();
    this.net.broadcast({ ...base, secretWord: null, wordChoices: null });

    // Send private payloads to drawer
    this.net.connections.forEach((conn) => {
      const player = this.findByPeer(conn.peer);
      if (!player) return;
      const isDrawer = player.id === base.drawerId;
      this.net.sendTo(conn, {
        ...base,
        secretWord: isDrawer || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS
          ? this.currentWord
          : null,
        wordChoices: isDrawer && this.phase === PHASE.CHOOSING ? this.wordChoices : null
      });
    });

    // Host updates own UI
    this.ui.applyState({
      ...base,
      secretWord: this.iAmDrawer() || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS
        ? this.currentWord
        : null,
      wordChoices: this.iAmDrawer() && this.phase === PHASE.CHOOSING ? this.wordChoices : null
    });
  }

  findByPeer(peerId) {
    return this.getPlayers().find((p) => p.peerId === peerId) || null;
  }

  hostStart() {
    if (!this.net.isHost) return;
    if (this.players.size < 2) {
      this.ui.toast("Need at least 2 players to start.");
      return;
    }
    try {
      this.wordPool = buildWordPool(this.settings.customWords, this.settings.customOnly);
    } catch (err) {
      this.ui.toast(err.message);
      return;
    }

    this.round = 1;
    this.drawerOrder = this.getPlayers().map((p) => p.id).sort(() => Math.random() - 0.5);
    this.drawerIndex = 0;
    this.usedWords = new Set();
    this.getPlayers().forEach((p) => { p.score = 0; });
    this.beginTurn();
  }

  beginTurn() {
    this.clearTimers();
    this.currentWord = null;
    this.wordChoices = pickWords(this.wordPool, this.settings.wordCount, this.usedWords);
    this.revealedHints = [];
    this.guessedIds = new Set();
    this.turnScores = new Map();
    this.phase = PHASE.CHOOSING;
    this.endsAt = Date.now() + 15000;
    this.broadcastState();
    this.ui.resetCanvas();
    this.ui.systemChat(`${this.getDrawer()?.name || "Someone"} is choosing a word…`);

    this.timerId = setTimeout(() => {
      if (this.phase === PHASE.CHOOSING) {
        this.chooseWord(this.wordChoices[0]);
      }
    }, 15000);
  }

  chooseWord(word) {
    if (!this.net.isHost || this.phase !== PHASE.CHOOSING) return;
    this.currentWord = word;
    this.usedWords.add(word.toLowerCase());
    this.phase = PHASE.DRAWING;
    this.endsAt = Date.now() + this.settings.drawTime * 1000;
    this.clearTimers();
    this.broadcastState();
    this.ui.systemChat(`${this.getDrawer()?.name} is drawing!`);
    this.scheduleHints();
    this.timerId = setTimeout(() => this.endTurn("time"), this.settings.drawTime * 1000);
  }

  scheduleHints() {
    this.hintTimers = [];
    const total = this.settings.hints;
    if (!total || !this.currentWord) return;
    const duration = this.settings.drawTime * 1000;
    for (let i = 1; i <= total; i++) {
      const at = (duration * i) / (total + 1);
      const t = setTimeout(() => {
        if (this.phase !== PHASE.DRAWING) return;
        const next = hintIndices(this.currentWord, 1, this.revealedHints);
        this.revealedHints.push(...next);
        this.broadcastState();
      }, at);
      this.hintTimers.push(t);
    }
  }

  handleGuess(playerId, text) {
    if (!this.net.isHost || this.phase !== PHASE.DRAWING) return;
    const player = this.players.get(playerId);
    if (!player || playerId === this.getDrawer()?.id) return;
    if (this.guessedIds.has(playerId)) return;

    const guess = String(text || "").trim();
    if (!guess) return;

    if (guess.toLowerCase() === this.currentWord.toLowerCase()) {
      this.guessedIds.add(playerId);
      const remaining = Math.max(0, this.endsAt - Date.now());
      const pts = Math.round(50 + (remaining / (this.settings.drawTime * 1000)) * 250);
      player.score += pts;
      this.turnScores.set(playerId, pts);

      const drawer = this.getDrawer();
      if (drawer) {
        const drawerPts = Math.round(pts * 0.4);
        drawer.score += drawerPts;
        this.turnScores.set(drawer.id, (this.turnScores.get(drawer.id) || 0) + drawerPts);
      }

      this.ui.systemChat(`${player.name} guessed the word! (+${pts})`);
      this.net.broadcast({ type: "chat", kind: "correct", text: `${player.name} guessed the word!` });
      this.broadcastState();

      const guessers = this.getPlayers().filter((p) => p.id !== drawer?.id);
      if (this.guessedIds.size >= guessers.length) {
        this.endTurn("all");
      }
      return;
    }

    if (isCloseGuess(guess, this.currentWord)) {
      this.net.broadcast({
        type: "chat",
        kind: "close",
        text: `${player.name}: ${guess}  (close!)`,
        fromId: playerId
      });
      this.ui.addChat({ kind: "close", text: `${player.name}: ${guess}  (close!)` });
      return;
    }

    this.net.broadcast({
      type: "chat",
      kind: "guess",
      text: `${player.name}: ${guess}`,
      fromId: playerId
    });
    this.ui.addChat({ kind: "guess", text: `${player.name}: ${guess}` });
  }

  endTurn(reason) {
    if (!this.net.isHost) return;
    if (this.phase !== PHASE.DRAWING && this.phase !== PHASE.CHOOSING) return;
    this.clearTimers();
    this.phase = PHASE.REVEAL;
    this.endsAt = Date.now() + 4000;
    this.broadcastState();
    const msg = reason === "all"
      ? `Everyone got it! The word was “${this.currentWord}”.`
      : `Time's up! The word was “${this.currentWord}”.`;
    this.ui.systemChat(msg);
    this.net.broadcast({ type: "chat", kind: "system", text: msg });

    this.timerId = setTimeout(() => this.nextTurn(), 4000);
  }

  nextTurn() {
    if (!this.net.isHost) return;
    this.drawerIndex += 1;
    if (this.drawerIndex >= this.drawerOrder.length) {
      this.drawerIndex = 0;
      this.round += 1;
      if (this.round > this.settings.rounds) {
        this.finishGame();
        return;
      }
      // refresh order each round
      this.drawerOrder = this.getPlayers().map((p) => p.id).sort(() => Math.random() - 0.5);
    }

    // skip missing players
    let guards = 0;
    while (!this.players.has(this.drawerOrder[this.drawerIndex]) && guards < this.drawerOrder.length) {
      this.drawerIndex = (this.drawerIndex + 1) % this.drawerOrder.length;
      guards += 1;
    }
    if (!this.getDrawer()) {
      this.finishGame();
      return;
    }
    this.beginTurn();
  }

  finishGame() {
    this.clearTimers();
    this.phase = PHASE.RESULTS;
    this.broadcastState();
  }

  clearTimers() {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.hintTimers.forEach(clearTimeout);
    this.hintTimers = [];
  }

  applyRemoteState(state) {
    this.phase = state.phase;
    this.round = state.round;
    this.settings = state.settings;
    this.endsAt = state.endsAt;
    this.guessedIds = new Set(state.guessedIds || []);
    this.players = new Map((state.players || []).map((p) => [p.id, p]));
    this.ui.applyState(state);
  }
}
