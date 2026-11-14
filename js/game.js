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
      customOnly: false,
      themeId: "classic",
      themeTitle: "Classic Sketch"
    };
    this.phase = PHASE.LOBBY;
    this.round = 1;
    this.drawerOrder = [];
    this.drawerIndex = 0;
    this.currentConcept = null;
    this.currentWord = null; // display form for blanks/hints
    this.wordChoices = [];
    this.revealedHints = [];
    this.guessedIds = new Set();
    this.usedWords = new Set();
    this.wordPool = CONCEPTS.slice();
    this.endsAt = 0;
    this.timerId = null;
    this.hintTimers = [];
    this.turnScores = new Map();
  }

  addPlayer(player) {
    const id = player.id;
    // Drop ghost seats from the same browser / same live peer
    for (const [pid, p] of [...this.players.entries()]) {
      if (pid === id) continue;
      if (player.peerId && p.peerId && p.peerId === player.peerId) {
        this.players.delete(pid);
      }
    }
    const prev = this.players.get(id);
    this.players.set(id, {
      id,
      name: player.name,
      avatar: player.avatar,
      score: player.score != null ? player.score : prev?.score || 0,
      peerId: player.peerId || null,
      isHost: !!player.isHost
    });
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  /** Only remove if this peer is still the one attached to that seat (ignore stale closes after rejoin). */
  removeByPeer(peerId) {
    const player = this.findByPeer(peerId);
    if (!player) return null;
    if (player.peerId !== peerId) return null;
    this.players.delete(player.id);
    return player;
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

  choicePayload(concept) {
    return {
      id: concept.id,
      label: drawerLabel(concept),
      preview: displayWord(concept)
    };
  }

  secretPayload() {
    if (!this.currentConcept) return null;
    return {
      id: this.currentConcept.id,
      label: drawerLabel(this.currentConcept),
      display: this.currentWord,
      answers: conceptAnswers(this.currentConcept)
    };
  }

  publicState() {
    const drawer = this.getDrawer();
    const showSecret = this.iAmDrawer() || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS;
    return {
      type: "state",
      phase: this.phase,
      round: this.round,
      settings: this.settings,
      players: this.getPlayers(),
      drawerId: drawer?.id || null,
      blanks: this.currentWord ? wordBlank(this.currentWord, this.revealedHints) : "",
      secret: showSecret ? this.secretPayload() : null,
      // legacy string field for older UI bits
      secretWord: showSecret ? drawerLabel(this.currentConcept) : null,
      wordChoices: this.iAmDrawer() && this.phase === PHASE.CHOOSING
        ? this.wordChoices.map((c) => this.choicePayload(c))
        : null,
      guessedIds: Array.from(this.guessedIds),
      endsAt: this.endsAt,
      roomCode: this.net.roomCode,
      turnKey: this.turnKey || `${this.round}-${this.drawerIndex}`
    };
  }

  broadcastState() {
    if (!this.net.isHost) return;
    const base = this.publicState();
    this.net.broadcast({ ...base, secret: null, secretWord: null, wordChoices: null });

    this.net.connections.forEach((conn) => {
      const player = this.findByPeer(conn.peer);
      if (!player) return;
      const isDrawer = player.id === base.drawerId;
      const showSecret = isDrawer || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS;
      this.net.sendTo(conn, {
        ...base,
        secret: showSecret ? this.secretPayload() : null,
        secretWord: showSecret ? drawerLabel(this.currentConcept) : null,
        wordChoices: isDrawer && this.phase === PHASE.CHOOSING
          ? this.wordChoices.map((c) => this.choicePayload(c))
          : null
      });
    });

    this.ui.applyState({
      ...base,
      secret: this.iAmDrawer() || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS
        ? this.secretPayload()
        : null,
      secretWord: this.iAmDrawer() || this.phase === PHASE.REVEAL || this.phase === PHASE.RESULTS
        ? drawerLabel(this.currentConcept)
        : null,
      wordChoices: this.iAmDrawer() && this.phase === PHASE.CHOOSING
        ? this.wordChoices.map((c) => this.choicePayload(c))
        : null
    });
  }

  findByPeer(peerId) {
    return this.getPlayers().find((p) => p.peerId === peerId) || null;
  }

  hostStart() {
    if (!this.net.isHost) return;
    if (this.players.size < 1) {
      this.ui.toast("No players in the room.");
      return;
    }
    if (this.players.size === 1) {
      this.ui.toast("Solo test mode — draw practice (invite friends for real guessing).");
    }
    try {
      this.wordPool = buildWordPool(this.settings);
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
    this.currentConcept = null;
    this.currentWord = null;
    this.wordChoices = pickConcepts(this.wordPool, this.settings.wordCount, this.usedWords);
    this.revealedHints = [];
    this.guessedIds = new Set();
    this.turnScores = new Map();
    this.phase = PHASE.CHOOSING;
    this.endsAt = Date.now() + 15000;
    this.turnKey = `${this.round}:${this.drawerIndex}:${Date.now()}`;
    this.ui.resetCanvas();
    this.net.broadcast({ type: "canvas-reset", turnKey: this.turnKey });
    this.broadcastState();
    this.ui.systemChat(`${this.getDrawer()?.name || "Someone"} is choosing a word…`);

    this.timerId = setTimeout(() => {
      if (this.phase === PHASE.CHOOSING && this.wordChoices[0]) {
        this.chooseWord(this.wordChoices[0].id);
      }
    }, 15000);
  }

  chooseWord(conceptId) {
    if (!this.net.isHost || this.phase !== PHASE.CHOOSING) return;
    const concept = this.wordChoices.find((c) => c.id === conceptId) ||
      this.wordPool.find((c) => c.id === conceptId);
    if (!concept) return;

    this.currentConcept = concept;
    this.currentWord = displayWord(concept);
    this.usedWords.add(concept.id);
    this.phase = PHASE.DRAWING;
    this.endsAt = Date.now() + this.settings.drawTime * 1000;
    this.clearTimers();
    // Fresh page for everyone when drawing starts
    this.ui.resetCanvas();
    this.net.broadcast({ type: "canvas-reset", turnKey: this.turnKey });
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

    if (matchesConcept(guess, this.currentConcept)) {
      this.guessedIds.add(playerId);
      const remaining = Math.max(0, this.endsAt - Date.now());
      const pts = Math.round(50 + (remaining / (this.settings.drawTime * 1000)) * 250);
      player.score += pts;
      this.turnScores.set(playerId, pts);

      const drawer = this.getDrawer();
      let drawerPts = 0;
      if (drawer && drawer.id !== playerId) {
        drawerPts = Math.round(pts * 0.35);
        drawer.score += drawerPts;
        this.turnScores.set(drawer.id, (this.turnScores.get(drawer.id) || 0) + drawerPts);
      }

      const msg = drawerPts
        ? `${player.name} got it! +${pts}  ·  drawer +${drawerPts}`
        : `${player.name} got it! +${pts}`;
      this.ui.systemChat(msg);
      this.net.broadcast({ type: "chat", kind: "correct", text: msg });
      this.broadcastState();

      const guessers = this.getPlayers().filter((p) => p.id !== drawer?.id);
      if (this.guessedIds.size >= guessers.length) {
        this.endTurn("all");
      }
      return;
    }

    if (isCloseGuess(guess, this.currentConcept)) {
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
    const label = drawerLabel(this.currentConcept) || this.currentWord;
    const msg = reason === "all"
      ? `Everyone got it! The word was “${label}”.`
      : `Time's up! The word was “${label}”.`;
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
      this.drawerOrder = this.getPlayers().map((p) => p.id).sort(() => Math.random() - 0.5);
    }

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
