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
    return "skribble-" + code.toUpperCase();
  }

  async create(roomCode) {
    this.destroy();
    this.isHost = true;
    this.roomCode = roomCode.toUpperCase();
    const peer = new Peer(this.peerIdForRoom(this.roomCode), {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      debug: 0
    });
    this.peer = peer;

    return new Promise((resolve, reject) => {
      const fail = (err) => {
        this.onError?.(err);
        reject(err);
      };

      peer.on("open", () => {
        peer.on("connection", (conn) => this._handleIncoming(conn));
        this.onReady?.(this.roomCode);
        resolve(this.roomCode);
      });

      peer.on("error", (err) => {
        if (err?.type === "unavailable-id") {
          fail(new Error("Room code already in use. Try again."));
        } else {
          fail(err);
        }
      });
    });
  }

  async join(roomCode) {
    this.destroy();
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase();
    const peer = new Peer({
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      debug: 0
    });
    this.peer = peer;

    return new Promise((resolve, reject) => {
      const fail = (err) => {
        this.onError?.(err);
        reject(err);
      };

      peer.on("open", () => {
        const conn = peer.connect(this.peerIdForRoom(this.roomCode), {
          reliable: true
        });
        this.conn = conn;

        const timeout = setTimeout(() => {
          fail(new Error("Could not reach that room. Check the code and try again."));
        }, 12000);

        conn.on("open", () => {
          clearTimeout(timeout);
          this._wireConn(conn);
          this.onReady?.(this.roomCode);
          resolve(this.roomCode);
        });

        conn.on("error", (err) => {
          clearTimeout(timeout);
          fail(err);
        });
      });

      peer.on("error", fail);
    });
  }

  _handleIncoming(conn) {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      this._wireConn(conn);
      this.onPeerJoin?.(conn.peer);
    });
  }

  _wireConn(conn) {
    conn.on("data", (data) => {
      this.onMessage?.(data, conn);
    });
    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.onPeerLeave?.(conn.peer);
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
      if (conn.open) conn.send(data);
    });
  }

  sendTo(conn, data) {
    if (conn?.open) conn.send(data);
  }
}
