const App = {
  net: null,
  game: null,
  me: null,

  init() {
    UI.init();
    this.net = new NetRoom();
    this.bindActions();
    this.maybeJoinFromUrl();
  },

  bindActions() {
    document.getElementById("btn-create").onclick = () => this.createRoom();
    document.getElementById("btn-join").onclick = () => {
      const code = document.getElementById("join-code").value.trim();
      this.joinRoom(code);
    };
    document.getElementById("btn-join-invite").onclick = () => {
      const code = (this.pendingInvite || document.getElementById("join-code").value).trim();
      this.joinRoom(code);
    };
    document.getElementById("player-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.pendingInvite) {
        this.joinRoom(this.pendingInvite);
      }
    });
    document.getElementById("join-code").addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("btn-join").click();
    });
    document.getElementById("btn-copy-invite").onclick = () => this.copyInvite();
    document.getElementById("btn-start").onclick = () => {
      if (this.game) {
        this.game.settings = UI.readSettings();
        this.game.hostStart();
      }
    };
    document.getElementById("btn-leave-lobby").onclick = () => this.goHome();
  },

  maybeJoinFromUrl() {
    const params = new URLSearchParams(location.search);
    const room = (params.get("room") || "").trim().toUpperCase();
    if (!room) return;
    this.pendingInvite = room;
    document.getElementById("join-code").value = room;
    document.getElementById("invite-banner").classList.remove("hidden");
    document.getElementById("home-host-actions")?.classList.add("hidden");
    const saved = localStorage.getItem("skribble-name") || "";
    if (saved) document.getElementById("player-name").value = saved;
    UI.toast("You're invited — pick a face, then Join");
    document.getElementById("player-name").focus();
  },

  makeMe(isHost) {
    const name = UI.getName();
    try { localStorage.setItem("skribble-name", name); } catch (_) { /* ignore */ }
    this.me = {
      id: this.net.playerId,
      name,
      avatar: UI.getAvatar(),
      isHost,
      score: 0,
      peerId: null
    };
  },

  wireNet() {
    this.net.onMessage = (data, conn) => this.onMessage(data, conn);
    this.net.onPeerLeave = (peerId) => this.onPeerLeave(peerId);
    this.net.onError = (err) => {
      UI.setConnecting(false);
      UI.toast(err?.message || "Connection error");
    };
  },

  async createRoom() {
    UI.setConnecting(true);
    this.wireNet();
    const code = makeRoomCode();
    try {
      await this.net.create(code);
      this.makeMe(true);
      this.me.peerId = this.net.peer.id;
      this.game = new SkribbleGame({ net: this.net, me: this.me, ui: UI });
      this.game.addPlayer(this.me);
      this.game.settings = UI.readSettings();
      history.replaceState(null, "", `?room=${code}`);
      UI.clearChat();
      UI.showScreen("screen-lobby");
      document.getElementById("room-code-display").textContent = code;
      this.game.broadcastState();
      UI.toast("Room created! Share the invite link.");
    } catch (err) {
      UI.toast(err?.message || "Could not create room");
    } finally {
      UI.setConnecting(false);
    }
  },

  async joinRoom(code) {
    code = String(code || "").trim().toUpperCase();
    if (code.length < 4) {
      UI.toast("Enter a valid room code");
      return;
    }
    UI.setConnecting(true);
    this.wireNet();
    try {
      await this.net.join(code);
      this.makeMe(false);
      this.game = new SkribbleGame({ net: this.net, me: this.me, ui: UI });
      history.replaceState(null, "", `?room=${code}`);
      UI.clearChat();
      this.net.send({
        type: "hello",
        player: {
          id: this.me.id,
          name: this.me.name,
          avatar: this.me.avatar
        }
      });
      UI.toast("Joined room!");
    } catch (err) {
      UI.toast(err?.message || "Could not join room");
      this.goHome(false);
    } finally {
      UI.setConnecting(false);
    }
  },

  onMessage(data, conn) {
    if (!data || !data.type) return;

    // HOST receives client messages
    if (this.net.isHost) {
      if (data.type === "hello") {
        const player = {
          ...data.player,
          peerId: conn.peer,
          isHost: false,
          score: 0
        };
        this.game.addPlayer(player);
        const state = this.game.publicState();
        const isDrawer = player.id === state.drawerId;
        const showSecret = isDrawer || this.game.phase === PHASE.REVEAL || this.game.phase === PHASE.RESULTS;
        this.net.sendTo(conn, {
          type: "welcome",
          yourId: player.id,
          state: {
            ...state,
            secret: showSecret ? this.game.secretPayload() : null,
            secretWord: showSecret ? drawerLabel(this.game.currentConcept) : null,
            wordChoices: isDrawer && this.game.phase === PHASE.CHOOSING
              ? this.game.wordChoices.map((c) => this.game.choicePayload(c))
              : null
          }
        });
        UI.systemChat(`${player.name} joined!`);
        this.net.broadcast({ type: "chat", kind: "system", text: `${player.name} joined!` }, conn.peer);
        this.game.broadcastState();
        return;
      }

      if (data.type === "choose-word") {
        const player = this.game.findByPeer(conn.peer);
        if (player && player.id === this.game.getDrawer()?.id) {
          this.game.chooseWord(data.wordId || data.word);
        }
        return;
      }

      if (data.type === "guess") {
        const byPeer = this.game.findByPeer(conn.peer);
        // Only credit the player tied to this connection (never fall back to host)
        if (!byPeer) return;
        if (data.playerId && data.playerId !== byPeer.id) return;
        this.game.handleGuess(byPeer.id, data.text);
        return;
      }

      if (data.type === "stroke") {
        const drawer = this.game.getDrawer();
        const player = this.game.findByPeer(conn.peer);
        if (player && drawer && player.id === drawer.id) {
          UI.draw.applyStroke(data.stroke);
          this.net.broadcast({ type: "stroke", stroke: data.stroke }, conn.peer);
        }
        return;
      }

      if (data.type === "settings" && this.game.phase === PHASE.LOBBY) {
        // ignore guest settings
        return;
      }
      return;
    }

    // CLIENT receives host messages
    if (data.type === "welcome") {
      this.me.id = data.yourId;
      this.game.me = this.me;
      this.game.applyRemoteState(data.state);
      return;
    }

    if (data.type === "state") {
      this.game.applyRemoteState(data);
      return;
    }

    if (data.type === "canvas-reset") {
      UI.resetCanvas(data.turnKey);
      return;
    }

    if (data.type === "stroke") {
      UI.draw.applyStroke(data.stroke);
      return;
    }

    if (data.type === "chat") {
      UI.addChat({ kind: data.kind, text: data.text });
    }
  },

  onPeerLeave(peerId) {
    if (!this.net.isHost || !this.game) return;
    const player = this.game.findByPeer(peerId);
    if (!player) return;
    this.game.removePlayer(player.id);
    UI.systemChat(`${player.name} left.`);
    this.net.broadcast({ type: "chat", kind: "system", text: `${player.name} left.` });

    if (this.game.phase === PHASE.LOBBY) {
      this.game.broadcastState();
      return;
    }

    if (this.game.phase === PHASE.RESULTS) {
      this.game.broadcastState();
      return;
    }

    // If drawer left mid-turn, end turn
    if (this.game.getDrawer()?.id === player.id) {
      this.game.endTurn("time");
    } else {
      this.game.broadcastState();
      if (this.game.phase === PHASE.DRAWING) {
        const drawer = this.game.getDrawer();
        const guessers = this.game.getPlayers().filter((p) => p.id !== drawer?.id);
        if (guessers.length && this.game.guessedIds.size >= guessers.length) {
          this.game.endTurn("all");
        }
      }
    }
  },

  chooseWord(wordId) {
    if (this.net.isHost) {
      this.game.chooseWord(wordId);
    } else {
      this.net.send({ type: "choose-word", wordId });
    }
  },

  sendGuess(text) {
    if (this.net.isHost) {
      this.game.handleGuess(this.me.id, text);
    } else {
      this.net.send({ type: "guess", text, playerId: this.me.id });
    }
  },

  sendStroke(stroke) {
    if (this.net.isHost) {
      this.net.broadcast({ type: "stroke", stroke });
    } else {
      this.net.send({ type: "stroke", stroke });
    }
  },

  copyInvite() {
    const code = this.net?.roomCode;
    if (!code) return;
    const url = inviteUrlForRoom(code);
    navigator.clipboard.writeText(url).then(
      () => UI.toast("Invite link copied! Host must keep this tab open."),
      () => UI.toast(`Share code: ${code}`)
    );
  },

  backToLobby() {
    if (!this.game) return;
    if (this.net.isHost) {
      this.game.clearTimers();
      this.game.phase = PHASE.LOBBY;
      this.game.getPlayers().forEach((p) => { p.score = 0; });
      this.game.broadcastState();
      UI.clearChat();
      UI.systemChat("Back in the lobby. Host can start another game.");
    } else {
      UI.toast("Waiting for host to return to lobby…");
    }
  },

  goHome(updateUrl = true) {
    if (this.game) this.game.clearTimers();
    this.net.destroy();
    this.net = new NetRoom();
    this.game = null;
    this.me = null;
    UI.clearChat();
    UI.showScreen("screen-home");
    this.pendingInvite = null;
    document.getElementById("invite-banner").classList.add("hidden");
    document.getElementById("home-host-actions")?.classList.remove("hidden");
    if (updateUrl) {
      history.replaceState(null, "", location.pathname.replace(/\/?$/, "/"));
    }
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
