const App = {
  net: null,
  game: null,
  me: null,
  room: PUBLIC_ROOM,
  rejoining: false,

  init() {
    UI.init();
    this.net = new NetRoom();
    this.bindActions();
    this.restoreName();
    // Old ?room=CODE links → strip; everyone uses the shared room
    if (location.search) {
      history.replaceState(null, "", location.pathname.replace(/\/?$/, "/"));
    }
    // Refresh / return visit: jump straight back into the shared room
    try {
      const raw = sessionStorage.getItem("skribble-session");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.avatar) {
          UI.avatarEyes = saved.avatar.eyes ?? 0;
          UI.avatarMouth = saved.avatar.mouth ?? 0;
          UI.avatarHat = saved.avatar.hat ?? 0;
          UI.avatarColor = saved.avatar.color ?? 0;
          UI.refreshAvatar();
          document.querySelectorAll("#avatar-colors .av-swatch").forEach((b, i) => {
            b.classList.toggle("active", i === UI.avatarColor);
          });
        }
        if (saved?.name) {
          document.getElementById("player-name").value = saved.name;
        }
        setTimeout(() => this.play(), 50);
      }
    } catch (_) {
      /* ignore */
    }
  },

  bindActions() {
    document.getElementById("btn-play").onclick = () => this.play();
    document.getElementById("player-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.play();
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

  restoreName() {
    try {
      const saved = localStorage.getItem("skribble-name") || "";
      if (saved) document.getElementById("player-name").value = saved;
    } catch (_) {
      /* ignore */
    }
  },

  saveSession() {
    try {
      sessionStorage.setItem(
        "skribble-session",
        JSON.stringify({
          room: this.room,
          name: this.me?.name,
          avatar: this.me?.avatar,
          playerId: this.me?.id
        })
      );
    } catch (_) {
      /* ignore */
    }
  },

  clearSession() {
    try {
      sessionStorage.removeItem("skribble-session");
    } catch (_) {
      /* ignore */
    }
  },

  makeMe(isHost, preferId) {
    const name = UI.getName();
    try {
      localStorage.setItem("skribble-name", name);
    } catch (_) {
      /* ignore */
    }
    this.me = {
      id: preferId || this.net.playerId,
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
    this.net.onDisconnected = () => this.handleDisconnect();
    this.net.onError = () => {
      /* enter/play handlers show toasts */
    };
  },

  async play() {
    UI.setConnecting(true);
    document.getElementById("connecting").querySelector("p").textContent =
      "Entering the game…";
    this.wireNet();
    this.room = PUBLIC_ROOM;

    try {
      const { role } = await this.net.enter(PUBLIC_ROOM);
      if (role === "host") {
        this.setupHost();
      } else {
        this.setupGuest();
      }
      history.replaceState(null, "", location.pathname.replace(/\/?$/, "/"));
      this.saveSession();
      UI.toast(role === "host" ? "You're in — friends can open the same link to join." : "Joined!");
    } catch (err) {
      UI.toast(err?.message || "Could not enter. Tap Play again.");
      this.goHome(false);
    } finally {
      UI.setConnecting(false);
    }
  },

  setupHost() {
    this.makeMe(true);
    this.me.peerId = this.net.peer?.id || null;
    this.me.isHost = true;
    this.game = new SkribbleGame({ net: this.net, me: this.me, ui: UI });
    this.game.addPlayer(this.me);
    this.game.settings = UI.readSettings();
    UI.clearChat();
    UI.showScreen("screen-lobby");
    document.getElementById("room-code-display").textContent = "OPEN";
    this.game.broadcastState();
  },

  setupGuest() {
    let preferId = null;
    try {
      const raw = sessionStorage.getItem("skribble-session");
      if (raw) preferId = JSON.parse(raw).playerId || null;
    } catch (_) {
      /* ignore */
    }
    this.makeMe(false, preferId);
    this.me.isHost = false;
    this.game = new SkribbleGame({ net: this.net, me: this.me, ui: UI });
    UI.clearChat();
    this.net.send({
      type: "hello",
      player: {
        id: this.me.id,
        name: this.me.name,
        avatar: this.me.avatar
      }
    });
  },

  async handleDisconnect() {
    if (this.rejoining || !this.me) return;
    this.rejoining = true;
    UI.toast("Connection dropped — rejoining…");
    UI.setConnecting(true);
    try {
      if (this.game) this.game.clearTimers();
      this.net.destroy();
      this.net = new NetRoom();
      this.wireNet();
      const { role } = await this.net.enter(PUBLIC_ROOM);
      if (role === "host") {
        this.setupHost();
      } else {
        this.setupGuest();
      }
      this.saveSession();
      UI.toast("Back in!");
    } catch (err) {
      UI.toast(err?.message || "Could not rejoin. Tap Play.");
      this.goHome(false);
    } finally {
      UI.setConnecting(false);
      this.rejoining = false;
    }
  },

  onMessage(data, conn) {
    if (!data || !data.type) return;

    if (this.net.isHost) {
      if (data.type === "hello") {
        // Rejoin with same id keeps score if still in map; otherwise fresh
        const existing = this.game.players.get(data.player.id);
        const player = {
          ...data.player,
          peerId: conn.peer,
          isHost: false,
          score: existing ? existing.score : 0
        };
        this.game.addPlayer(player);
        const state = this.game.publicState();
        const isDrawer = player.id === state.drawerId;
        const showSecret =
          isDrawer || this.game.phase === PHASE.REVEAL || this.game.phase === PHASE.RESULTS;
        this.net.sendTo(conn, {
          type: "welcome",
          yourId: player.id,
          state: {
            ...state,
            secret: showSecret ? this.game.secretPayload() : null,
            secretWord: showSecret ? drawerLabel(this.game.currentConcept) : null,
            wordChoices:
              isDrawer && this.game.phase === PHASE.CHOOSING
                ? this.game.wordChoices.map((c) => this.game.choicePayload(c))
                : null
          }
        });
        UI.systemChat(`${player.name} joined!`);
        this.net.broadcast(
          { type: "chat", kind: "system", text: `${player.name} joined!` },
          conn.peer
        );
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
      return;
    }

    if (data.type === "welcome") {
      this.me.id = data.yourId;
      this.game.me = this.me;
      this.game.applyRemoteState(data.state);
      this.saveSession();
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

    if (this.game.phase === PHASE.LOBBY || this.game.phase === PHASE.RESULTS) {
      this.game.broadcastState();
      return;
    }

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
    const url = inviteUrlForRoom();
    navigator.clipboard.writeText(url).then(
      () => UI.toast("Link copied — anyone who opens it can Play and join you."),
      () => UI.toast(url)
    );
  },

  backToLobby() {
    if (!this.game) return;
    if (this.net.isHost) {
      this.game.clearTimers();
      this.game.phase = PHASE.LOBBY;
      this.game.getPlayers().forEach((p) => {
        p.score = 0;
      });
      this.game.broadcastState();
      UI.clearChat();
      UI.systemChat("Back in the lobby. Host can start another game.");
    } else {
      UI.toast("Waiting for host to return to lobby…");
    }
  },

  goHome(updateUrl = true) {
    if (this.game) this.game.clearTimers();
    this.clearSession();
    this.net.destroy();
    this.net = new NetRoom();
    this.game = null;
    this.me = null;
    this.rejoining = false;
    UI.clearChat();
    UI.showScreen("screen-home");
    if (updateUrl) {
      history.replaceState(null, "", location.pathname.replace(/\/?$/, "/"));
    }
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
