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
  }

  destroy() {
    try {
      this.connections.forEach((c) => c.close());
      this.connections.clear();
      if (this.conn) this.conn.close();
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
    this.roomCode = roomCode.toUpperCase();
    const peer = new Peer(this.peerIdForRoom(this.roomCode), { ...PEER_OPTIONS });
    this.peer = peer;

    return new Promise((resolve, reject) => {
      const fail = (err) => {
        this.onError?.(err);
        reject(err instanceof Error ? err : new Error(String(err?.message || err || "Host error")));
      };

      peer.on("open", () => {
        peer.on("connection", (conn) => this._handleIncoming(conn));
        this.onReady?.(this.roomCode);
        resolve(this.roomCode);
      });

      peer.on("error", (err) => {
        if (err?.type === "unavailable-id") {
          fail(new Error("Room code already in use. Create a new room."));
        } else if (err?.type === "peer-unavailable") {
          // ignore on host
        } else {
          fail(err);
        }
      });
    });
  }

  async join(roomCode, { attempts = 3 } = {}) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this._joinOnce(roomCode);
      } catch (err) {
        lastErr = err;
        this.destroy();
        await new Promise((r) => setTimeout(r, 700 * (i + 1)));
      }
    }
    throw lastErr || new Error("Could not join room.");
  }

  _joinOnce(roomCode) {
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
        fail(new Error("Could not reach that room. Keep the host's tab open and try again."));
      }, 15000);

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
          fail(new Error("Room not found. Ask the host to keep their tab open, then retry."));
        } else {
          fail(err);
        }
      });
    });
  }

  _handleIncoming(conn) {
    // Accept immediately so multiple guests can join
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
      this.onPeerLeave?.(conn.peer);
    });
    conn.on("error", () => {
      /* keep room alive; leave handler covers drops */
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
          /* ignore broken pipe */
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

function inviteUrlForRoom(code) {
  const base = `${location.origin}${location.pathname.replace(/\/?$/, "/")}`;
  return `${base}?room=${encodeURIComponent(String(code).toUpperCase())}`;
}
