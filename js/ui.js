const EYE_NAMES = ["dots", "happy", "boxes", "wink"];
const MOUTH_NAMES = ["smile", "line", "open", "smirk"];
const HAT_NAMES = ["none", "cap", "crown", "beanie", "party", "flower"];

const UI = {
  avatarEyes: 0,
  avatarMouth: 0,
  avatarHat: 0,
  avatarColor: 0,
  themeId: "classic",
  themeTitle: "Classic Sketch",
  draw: null,
  tickId: null,
  lastState: null,

  init() {
    this.draw = new DrawCanvas(document.getElementById("draw-canvas"));
    this.buildPalette();
    this.buildAvatarColors();
    this.buildThemeRail();
    this.refreshAvatar();
    this.bindHome();
    this.bindLobby();
    this.bindGame();
    this.bindResults();
    applyTheme(this.themeId);
    this.updateFairNote();
    window.addEventListener("resize", () => this.draw.resizeToDisplay());
  },

  buildPalette() {
    const el = document.getElementById("color-palette");
    el.innerHTML = "";
    PALETTE.forEach((color, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch" + (i === 0 ? " active" : "");
      btn.style.background = color;
      btn.title = color;
      btn.addEventListener("click", () => {
        el.querySelectorAll(".color-swatch").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.draw.setColor(color);
        if (this.draw.tool === "eraser") this.setTool("pen");
      });
      el.appendChild(btn);
    });
  },

  buildAvatarColors() {
    const row = document.getElementById("avatar-colors");
    row.innerHTML = "";
    AVATAR_COLORS.forEach((color, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "av-swatch" + (i === 0 ? " active" : "");
      btn.style.background = color;
      btn.addEventListener("click", () => {
        this.avatarColor = i;
        row.querySelectorAll(".av-swatch").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.refreshAvatar();
      });
      row.appendChild(btn);
    });
  },

  buildThemeRail() {
    const rail = document.getElementById("theme-rail");
    rail.innerHTML = "";
    THEMES.forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-card" + (theme.id === this.themeId ? " active" : "");
      btn.dataset.themeId = theme.id;
      btn.innerHTML = `<span class="t-emoji">${theme.emoji}</span><span class="t-name">${theme.name}</span>`;
      btn.addEventListener("click", () => this.selectTheme(theme.id, null, true));
      rail.appendChild(btn);
    });
  },

  selectTheme(id, titleOverride, sync = false) {
    this.themeId = id;
    const theme = applyTheme(id);
    this.themeTitle = titleOverride || theme.name;
    document.getElementById("theme-emoji").textContent = theme.emoji;
    document.getElementById("theme-name").textContent = this.themeTitle;
    document.getElementById("theme-blurb").textContent = theme.blurb;
    document.querySelectorAll(".theme-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.themeId === id);
    });
    if (sync) this.syncSettings();
  },

  rollTheme() {
    const id = randomThemeId(this.themeId);
    const invented = inventThemeTitle();
    this.selectTheme(id, invented, true);
    const theme = getTheme(id);
    this.toast(`${theme.emoji} ${invented}`);
  },

  bindHome() {
    const cycle = (key, max, dir) => {
      this[key] = (this[key] + dir + max) % max;
      this.refreshAvatar();
    };
    document.getElementById("eyes-prev").onclick = () => cycle("avatarEyes", EYE_NAMES.length, -1);
    document.getElementById("eyes-next").onclick = () => cycle("avatarEyes", EYE_NAMES.length, 1);
    document.getElementById("mouth-prev").onclick = () => cycle("avatarMouth", MOUTH_NAMES.length, -1);
    document.getElementById("mouth-next").onclick = () => cycle("avatarMouth", MOUTH_NAMES.length, 1);
    document.getElementById("hat-prev").onclick = () => cycle("avatarHat", HAT_NAMES.length, -1);
    document.getElementById("hat-next").onclick = () => cycle("avatarHat", HAT_NAMES.length, 1);
    document.getElementById("avatar-random").onclick = () => {
      this.avatarEyes = Math.floor(Math.random() * EYE_NAMES.length);
      this.avatarMouth = Math.floor(Math.random() * MOUTH_NAMES.length);
      this.avatarHat = Math.floor(Math.random() * HAT_NAMES.length);
      this.avatarColor = Math.floor(Math.random() * AVATAR_COLORS.length);
      document.querySelectorAll("#avatar-colors .av-swatch").forEach((b, i) => {
        b.classList.toggle("active", i === this.avatarColor);
      });
      this.refreshAvatar();
    };
  },

  bindLobby() {
    const sync = () => this.syncSettings();
    ["set-rounds", "set-drawtime", "set-wordcount", "set-hints", "set-custom-words", "set-custom-only", "set-language"]
      .forEach((id) => {
        const el = document.getElementById(id);
        el.addEventListener("change", sync);
        if (el.tagName === "TEXTAREA") el.addEventListener("blur", sync);
      });
    document.getElementById("set-language").addEventListener("change", () => this.updateFairNote());
    document.getElementById("btn-roll-theme").onclick = () => this.rollTheme();
  },

  syncSettings() {
    if (!App.game || !App.net.isHost) return;
    App.game.settings = this.readSettings();
    App.game.broadcastState();
  },

  updateFairNote() {
    const lang = document.getElementById("set-language").value;
    const note = document.getElementById("fair-note");
    if (lang === "fair") {
      note.textContent = "Fair mode: drawer sees EN · RU · UK, and any of those guesses count. Best for mixed-language friends.";
    } else if (lang === "ru") {
      note.textContent = "Blanks/hints use Russian. In-theme words still accept EN/UK translations too, so nobody is stuck.";
    } else if (lang === "uk") {
      note.textContent = "Blanks/hints use Ukrainian. Matching EN/RU translations still count.";
    } else {
      note.textContent = "Blanks/hints use English. Matching RU/UK translations still count so it's less unfair.";
    }
  },

  bindGame() {
    document.querySelectorAll(".tool[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => this.setTool(btn.dataset.tool));
    });
    document.getElementById("pen-size").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      document.getElementById("pen-size-label").textContent = String(v);
      this.draw.setSize(v);
    });
    document.getElementById("btn-undo").onclick = () => {
      if (!this.draw.enabled) return;
      this.draw.undo(true);
    };
    document.getElementById("btn-clear").onclick = () => {
      if (!this.draw.enabled) return;
      this.draw.clear(true);
    };
    this.draw.onStroke = (stroke) => App.sendStroke(stroke);

    document.getElementById("chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      App.sendGuess(text);
    });
  },

  bindResults() {
    document.getElementById("btn-play-again").onclick = () => App.backToLobby();
    document.getElementById("btn-home").onclick = () => App.goHome();
  },

  refreshAvatar() {
    const el = document.getElementById("avatar-preview");
    el.dataset.eyes = String(this.avatarEyes);
    el.dataset.mouth = String(this.avatarMouth);
    el.dataset.hat = String(this.avatarHat);
    el.style.background = AVATAR_COLORS[this.avatarColor];
    document.getElementById("eyes-label").textContent = EYE_NAMES[this.avatarEyes];
    document.getElementById("mouth-label").textContent = MOUTH_NAMES[this.avatarMouth];
    document.getElementById("hat-label").textContent = HAT_NAMES[this.avatarHat];
  },

  getAvatar() {
    return {
      eyes: this.avatarEyes,
      mouth: this.avatarMouth,
      hat: this.avatarHat,
      color: this.avatarColor,
      // legacy keys so old sessions don't explode
      shape: this.avatarEyes
    };
  },

  getName() {
    const name = document.getElementById("player-name").value.trim();
    return name || "Player" + Math.floor(Math.random() * 90 + 10);
  },

  readSettings() {
    return {
      rounds: Number(document.getElementById("set-rounds").value),
      drawTime: Number(document.getElementById("set-drawtime").value),
      wordCount: Number(document.getElementById("set-wordcount").value),
      hints: Number(document.getElementById("set-hints").value),
      customWords: document.getElementById("set-custom-words").value,
      customOnly: document.getElementById("set-custom-only").checked,
      language: document.getElementById("set-language").value,
      themeId: this.themeId,
      themeTitle: this.themeTitle
    };
  },

  writeSettings(s) {
    document.getElementById("set-rounds").value = String(s.rounds);
    document.getElementById("set-drawtime").value = String(s.drawTime);
    document.getElementById("set-wordcount").value = String(s.wordCount);
    document.getElementById("set-hints").value = String(s.hints);
    document.getElementById("set-custom-words").value = s.customWords || "";
    document.getElementById("set-custom-only").checked = !!s.customOnly;
    document.getElementById("set-language").value = s.language || "fair";
    if (s.themeId) this.selectTheme(s.themeId, s.themeTitle);
    this.updateFairNote();
  },

  showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    if (id === "screen-game") {
      requestAnimationFrame(() => this.draw.resizeToDisplay());
    }
  },

  setConnecting(on) {
    document.getElementById("connecting").classList.toggle("hidden", !on);
  },

  toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.add("hidden"), 2600);
  },

  setTool(tool) {
    this.draw.setTool(tool);
    document.querySelectorAll(".tool[data-tool]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === tool);
    });
  },

  renderAvatarNode(avatar) {
    const div = document.createElement("div");
    div.className = "avatar";
    const eyes = avatar.eyes ?? avatar.shape ?? 0;
    const mouth = avatar.mouth ?? 0;
    const hat = avatar.hat ?? 0;
    const color = avatar.color ?? 0;
    div.dataset.eyes = String(eyes);
    div.dataset.mouth = String(mouth);
    div.dataset.hat = String(hat);
    div.style.background = AVATAR_COLORS[color % AVATAR_COLORS.length];
    div.innerHTML = `
      <span class="av-hat"></span>
      <span class="av-face">
        <span class="av-eye left"></span>
        <span class="av-eye right"></span>
        <span class="av-mouth"></span>
      </span>
    `;
    return div;
  },

  renderLobby(players, isHost) {
    const list = document.getElementById("lobby-players");
    list.innerHTML = "";
    players.forEach((p) => {
      const li = document.createElement("li");
      li.appendChild(this.renderAvatarNode(p.avatar));
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `<strong>${escapeHtml(p.name)}</strong><span>${p.id === App.me.id ? "You" : "Joined"}</span>`;
      li.appendChild(meta);
      if (p.isHost) {
        const badge = document.createElement("span");
        badge.className = "badge-host";
        badge.textContent = "HOST";
        li.appendChild(badge);
      }
      list.appendChild(li);
    });
    document.getElementById("player-count").textContent = `(${players.length})`;
    document.getElementById("lobby-wait").textContent = players.length < 2
      ? "Waiting for friends… share the invite link!"
      : isHost ? "Ready when you are — hit Start!" : "Waiting for host to start…";

    const panel = document.getElementById("settings-panel");
    panel.classList.toggle("is-guest", !isHost);
    document.getElementById("btn-start").disabled = !isHost || players.length < 2;
    document.getElementById("host-note").textContent = isHost
      ? "You are the host. Pick a vibe, then start when ready."
      : "Only the host can change settings and start.";
  },

  applyState(state) {
    this.lastState = state;
    if (state.settings?.themeId) {
      applyTheme(state.settings.themeId);
      this.themeId = state.settings.themeId;
      this.themeTitle = state.settings.themeTitle || getTheme(state.settings.themeId).name;
    }

    if (state.phase === PHASE.LOBBY) {
      this.showScreen("screen-lobby");
      this.writeSettings(state.settings);
      this.renderLobby(state.players, App.net.isHost);
      document.getElementById("room-code-display").textContent = state.roomCode;
      return;
    }

    if (state.phase === PHASE.RESULTS) {
      this.showScreen("screen-results");
      this.renderResults(state.players);
      return;
    }

    this.showScreen("screen-game");
    document.getElementById("game-room-code").textContent = state.roomCode;
    const theme = getTheme(state.settings.themeId || "classic");
    document.getElementById("game-theme-chip").textContent =
      `${theme.emoji} ${state.settings.themeTitle || theme.name}`;
    document.getElementById("round-label").textContent =
      `Round ${state.round} / ${state.settings.rounds}`;

    const drawerId = state.drawerId;
    const amDrawer = drawerId === App.me.id;
    const alreadyGuessed = (state.guessedIds || []).includes(App.me.id);

    const wordEl = document.getElementById("word-display");
    if (amDrawer && state.secretWord) {
      wordEl.textContent = state.secretWord;
      wordEl.classList.add("drawer-word");
    } else if (state.phase === PHASE.REVEAL && state.secretWord) {
      wordEl.textContent = state.secretWord;
      wordEl.classList.remove("drawer-word");
    } else {
      wordEl.textContent = state.blanks || "…";
      wordEl.classList.remove("drawer-word");
    }

    const choose = document.getElementById("choose-overlay");
    const reveal = document.getElementById("reveal-overlay");
    const waiting = document.getElementById("waiting-overlay");
    choose.classList.add("hidden");
    reveal.classList.add("hidden");
    waiting.classList.add("hidden");

    if (state.phase === PHASE.CHOOSING) {
      if (amDrawer && state.wordChoices) {
        choose.classList.remove("hidden");
        const box = document.getElementById("word-choices");
        box.innerHTML = "";
        state.wordChoices.forEach((w) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = w.label || w.preview || w;
          b.onclick = () => App.chooseWord(w.id || w);
          box.appendChild(b);
        });
      } else {
        waiting.classList.remove("hidden");
        const drawer = state.players.find((p) => p.id === drawerId);
        document.getElementById("waiting-text").textContent =
          `${drawer?.name || "Drawer"} is choosing a word…`;
      }
    } else if (state.phase === PHASE.REVEAL) {
      reveal.classList.remove("hidden");
      document.getElementById("reveal-text").textContent =
        `The word was “${state.secretWord || "???"}”`;
    }

    const canDraw = amDrawer && state.phase === PHASE.DRAWING;
    document.getElementById("toolbar").classList.toggle("hidden", !canDraw);
    this.draw.setEnabled(canDraw);

    const chatInput = document.getElementById("chat-input");
    if (amDrawer) {
      chatInput.disabled = true;
      chatInput.placeholder = "You're drawing — no guessing!";
    } else if (alreadyGuessed) {
      chatInput.disabled = true;
      chatInput.placeholder = "Nice! Waiting for others…";
    } else if (state.phase !== PHASE.DRAWING) {
      chatInput.disabled = true;
      chatInput.placeholder = "Waiting…";
    } else {
      chatInput.disabled = false;
      const lang = state.settings.language;
      chatInput.placeholder = lang === "fair"
        ? "Guess in EN / RU / UK…"
        : lang === "ru" ? "Ваш ответ…"
          : lang === "uk" ? "Ваша відповідь…"
            : "Type your guess…";
    }

    this.renderScores(state.players, drawerId, state.guessedIds || []);
    this.startTicker(state.endsAt);
  },

  renderScores(players, drawerId, guessedIds) {
    const list = document.getElementById("score-list");
    list.innerHTML = "";
    const sorted = players.slice().sort((a, b) => b.score - a.score);
    sorted.forEach((p) => {
      const li = document.createElement("li");
      if (p.id === drawerId) li.classList.add("drawing-now");
      if (guessedIds.includes(p.id)) li.classList.add("guessed");
      li.appendChild(this.renderAvatarNode(p.avatar));
      const meta = document.createElement("div");
      meta.className = "meta";
      const role = p.id === drawerId ? "Drawing" : guessedIds.includes(p.id) ? "Guessed!" : "";
      meta.innerHTML = `<strong>${escapeHtml(p.name)}</strong><span>${role}</span>`;
      li.appendChild(meta);
      const score = document.createElement("span");
      score.textContent = String(p.score);
      score.style.marginLeft = "auto";
      score.style.fontWeight = "800";
      li.appendChild(score);
      list.appendChild(li);
    });
  },

  renderResults(players) {
    const sorted = players.slice().sort((a, b) => b.score - a.score);
    const podium = document.getElementById("podium");
    podium.innerHTML = "";
    const places = [
      { idx: 1, cls: "second", label: "2nd" },
      { idx: 0, cls: "first", label: "1st" },
      { idx: 2, cls: "third", label: "3rd" }
    ];
    places.forEach(({ idx, cls, label }) => {
      const p = sorted[idx];
      if (!p) return;
      const div = document.createElement("div");
      div.className = `podium-place ${cls}`;
      div.innerHTML = `
        <div class="place">${label}</div>
        <div>${escapeHtml(p.name)}</div>
        <div>${p.score} pts</div>
      `;
      podium.appendChild(div);
    });

    const list = document.getElementById("final-scores");
    list.innerHTML = "";
    sorted.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>#${i + 1} ${escapeHtml(p.name)}</span><span>${p.score}</span>`;
      list.appendChild(li);
    });
  },

  startTicker(endsAt) {
    clearInterval(this.tickId);
    const timer = document.getElementById("timer");
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      timer.textContent = String(left);
      timer.classList.toggle("urgent", left <= 10 && left > 0);
    };
    tick();
    this.tickId = setInterval(tick, 200);
  },

  resetCanvas() {
    this.draw.resetRound();
  },

  addChat({ kind, text }) {
    const log = document.getElementById("chat-log");
    const line = document.createElement("div");
    line.className = "chat-line " + (kind || "");
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  systemChat(text) {
    this.addChat({ kind: "system", text });
  },

  clearChat() {
    document.getElementById("chat-log").innerHTML = "";
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
