/** Everyone who opens the site joins this shared room. No codes. */
const PUBLIC_ROOM = "PLAY";

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function makePlayerId() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const PEER_OPTIONS = {
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  debug: 0,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" }
    ]
  }
};

class NetRoom {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.connections = new Map();
    this.isHost = false;
    this.roomCode = null;
    this.playerId = makePlayerId();
    this.onMessage = null;
    this.onPeerJoin = null;
    this.onPeerLeave = null;
    this.onReady = null;
    this.onError = null;
    this.onDisconnected = null;
  }

  destroy() {
    try {
      this.connections.forEach((c) => c.close());
      this.connections.clear();
      if (this.conn) {
        this.conn.close();
      }
      if (this.peer) this.peer.destroy();
    } catch (_) {
      /* ignore */
    }
    this.peer = null;
    this.conn = null;
  }

  peerIdForRoom(code) {
    return "skribble-" + String(code).toUpperCase();
  }

  async create(roomCode) {
    this.destroy();
    this.isHost = true;
    this.roomCode = String(roomCode).toUpperCase();
    const peer = new Peer(this.peerIdForRoom(this.roomCode), { ...PEER_OPTIONS });
    this.peer = peer;

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => {
        if (settled) return;
        settled = true;
        const error = err instanceof Error ? err : new Error(String(err?.message || err || "Host error"));
        error.peerType = err?.type;
        this.onError?.(error);
        reject(error);
      };

      peer.on("open", () => {
        if (settled) return;
        settled = true;
        peer.on("connection", (conn) => this._handleIncoming(conn));
        this.onReady?.(this.roomCode);
        resolve(this.roomCode);
      });

      peer.on("error", (err) => {
        if (err?.type === "unavailable-id") {
          fail(Object.assign(new Error("Room host already exists"), { peerType: "unavailable-id" }));
        } else if (err?.type === "peer-unavailable") {
          // ignore on host
        } else {
          fail(err);
        }
      });
    });
  }

  async join(roomCode, { attempts = 2, timeoutMs = 8000 } = {}) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this._joinOnce(roomCode, timeoutMs);
      } catch (err) {
        lastErr = err;
        this.destroy();
        await sleep(400 * (i + 1));
      }
    }
    throw lastErr || new Error("Could not join room.");
  }

  /**
   * Enter the shared room: join if someone is hosting, otherwise become host.
   * Survives races when two people open/refresh at once.
   */
  async enter(roomCode = PUBLIC_ROOM) {
    const code = String(roomCode || PUBLIC_ROOM).toUpperCase();
    let lastErr = null;

    for (let round = 0; round < 10; round++) {
      // Prefer joining an existing host
      try {
        await this.join(code, { attempts: 1, timeoutMs: 5000 + round * 400 });
        return { role: "guest", room: code };
      } catch (err) {
        lastErr = err;
      }

      // Nobody hosting — claim host seat
      try {
        await this.create(code);
        return { role: "host", room: code };
      } catch (err) {
        lastErr = err;
        // Someone else grabbed host — loop and join them
        if (err?.peerType === "unavailable-id" || /already|unavailable/i.test(err?.message || "")) {
          await sleep(350 + round * 250);
          continue;
        }
        await sleep(400);
      }
    }

    throw lastErr || new Error("Could not enter the game. Tap Play again.");
  }

  _joinOnce(roomCode, timeoutMs = 8000) {
    this.destroy();
    this.isHost = false;
    this.roomCode = String(roomCode).trim().toUpperCase();
    const peer = new Peer({ ...PEER_OPTIONS });
    this.peer = peer;

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const error = err instanceof Error ? err : new Error(String(err?.message || err || "Join failed"));
        error.peerType = err?.type;
        this.onError?.(error);
        reject(error);
      };
      const ok = (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.onReady?.(code);
        resolve(code);
      };

      const timeout = setTimeout(() => {
        fail(new Error("Room not ready yet."));
      }, timeoutMs);

      peer.on("open", () => {
        const conn = peer.connect(this.peerIdForRoom(this.roomCode), {
          reliable: true
        });
        this.conn = conn;

        conn.on("open", () => {
          this._wireConn(conn);
          ok(this.roomCode);
        });

        conn.on("error", fail);
      });

      peer.on("error", (err) => {
        if (err?.type === "peer-unavailable") {
          fail(Object.assign(new Error("Room not ready yet."), { peerType: "peer-unavailable" }));
        } else {
          fail(err);
        }
      });
    });
  }

  _handleIncoming(conn) {
    this.connections.set(conn.peer, conn);
    this._wireConn(conn);

    if (conn.open) {
      this.onPeerJoin?.(conn.peer);
    } else {
      conn.on("open", () => {
        this.onPeerJoin?.(conn.peer);
      });
    }
  }

  _wireConn(conn) {
    conn.on("data", (data) => {
      this.onMessage?.(data, conn);
    });
    conn.on("close", () => {
      this.connections.delete(conn.peer);
      if (this.isHost) {
        this.onPeerLeave?.(conn.peer);
      } else if (conn === this.conn) {
        this.onDisconnected?.();
      }
    });
    conn.on("error", () => {
      /* leave/disconnect handlers cover drops */
    });
  }

  send(data) {
    if (this.isHost) {
      this.broadcast(data);
    } else if (this.conn?.open) {
      this.conn.send(data);
    }
  }

  broadcast(data, exceptPeer = null) {
    this.connections.forEach((conn, peerId) => {
      if (peerId === exceptPeer) return;
      if (conn.open) {
        try {
          conn.send(data);
        } catch (_) {
          /* ignore */
        }
      }
    });
  }

  sendTo(conn, data) {
    if (conn?.open) {
      try {
        conn.send(data);
      } catch (_) {
        /* ignore */
      }
    }
  }
}

function inviteUrlForRoom() {
  // Always the app itself — everyone hits Play and lands in the same room
  return `${location.origin}${location.pathname.replace(/\/?$/, "/")}`;
}
