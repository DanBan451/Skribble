class DrawCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.tool = "pen";
    this.color = "#1a2a33";
    this.size = 6;
    this.drawing = false;
    this.last = null;
    this.history = [];
    this.maxHistory = 30;
    this.enabled = false;
    this.onStroke = null;
    this._bound = false;

    this.resizeToDisplay();
    this.clear(false);
  }

  bindEvents() {
    if (this._bound) return;
    this._bound = true;
    const c = this.canvas;
    c.addEventListener("pointerdown", this.onPointerDown);
    c.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  onPointerDown = (e) => {
    if (!this.enabled) return;
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    const p = this.pos(e);
    if (this.tool === "fill") {
      this.snapshot();
      this.floodFill(Math.floor(p.x), Math.floor(p.y), this.color);
      this.emit({ type: "fill", x: Math.floor(p.x), y: Math.floor(p.y), color: this.color });
      return;
    }
    this.drawing = true;
    this.last = p;
    this.snapshot();
    this.drawDot(p.x, p.y, this.strokeStyle(), this.size);
    this.emit({
      type: "start",
      x: p.x,
      y: p.y,
      color: this.strokeStyle(),
      size: this.size,
      tool: this.tool
    });
  };

  onPointerMove = (e) => {
    if (!this.enabled || !this.drawing || !this.last) return;
    e.preventDefault();
    const p = this.pos(e);
    this.drawLine(this.last.x, this.last.y, p.x, p.y, this.strokeStyle(), this.size);
    this.emit({
      type: "move",
      x: p.x,
      y: p.y,
      color: this.strokeStyle(),
      size: this.size,
      tool: this.tool
    });
    this.last = p;
  };

  onPointerUp = () => {
    if (!this.drawing) return;
    this.drawing = false;
    this.last = null;
    this.emit({ type: "end" });
  };

  strokeStyle() {
    return this.tool === "eraser" ? "#ffffff" : this.color;
  }

  pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * this.canvas.height
    };
  }

  setTool(tool) {
    this.tool = tool;
  }

  setColor(color) {
    this.color = color;
  }

  setSize(size) {
    this.size = size;
  }

  setEnabled(on) {
    this.enabled = on;
    this.canvas.style.cursor = on ? "crosshair" : "default";
    if (on) this.bindEvents();
  }

  emit(stroke) {
    if (typeof this.onStroke === "function") this.onStroke(stroke);
  }

  applyStroke(stroke) {
    if (!stroke) return;
    if (stroke.type === "start") {
      this.snapshot();
      this._remoteLast = { x: stroke.x, y: stroke.y };
      this.drawDot(stroke.x, stroke.y, stroke.color, stroke.size);
    } else if (stroke.type === "move" && this._remoteLast) {
      this.drawLine(
        this._remoteLast.x,
        this._remoteLast.y,
        stroke.x,
        stroke.y,
        stroke.color,
        stroke.size
      );
      this._remoteLast = { x: stroke.x, y: stroke.y };
    } else if (stroke.type === "end") {
      this._remoteLast = null;
    } else if (stroke.type === "fill") {
      this.snapshot();
      this.floodFill(stroke.x, stroke.y, stroke.color);
    } else if (stroke.type === "clear") {
      this.snapshot();
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (stroke.type === "undo") {
      this.undo(false);
    }
  }

  drawDot(x, y, color, size) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLine(x1, y1, x2, y2, color, size) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  snapshot() {
    try {
      this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
      if (this.history.length > this.maxHistory) this.history.shift();
    } catch (_) {
      /* ignore */
    }
  }

  undo(emit = true) {
    if (!this.history.length) {
      this.clear(false);
      if (emit) this.emit({ type: "undo" });
      return;
    }
    const img = this.history.pop();
    this.ctx.putImageData(img, 0, 0);
    if (emit) this.emit({ type: "undo" });
  }

  clear(emit = true) {
    if (emit) this.snapshot();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (emit) this.emit({ type: "clear" });
  }

  resetRound() {
    this.history = [];
    this._remoteLast = null;
    this.drawing = false;
    this.last = null;
    this.clear(false);
  }

  resizeToDisplay() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(400, Math.floor(rect.width) || 800);
    const h = Math.max(280, Math.floor(rect.height) || 560);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      const prev = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, w, h);
      try {
        this.ctx.putImageData(prev, 0, 0);
      } catch (_) {
        /* ignore */
      }
    }
  }

  floodFill(sx, sy, fillColor) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;
    const target = this.colorAt(data, sx, sy, width);
    const fill = this.hexToRgba(fillColor);
    if (this.sameColor(target, fill)) return;

    const stack = [[sx, sy]];
    const visited = new Uint8Array(width * height);

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const i = y * width + x;
      if (visited[i]) continue;
      visited[i] = 1;
      if (!this.sameColor(this.colorAt(data, x, y, width), target)) continue;
      this.setColorAt(data, x, y, width, fill);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(img, 0, 0);
  }

  colorAt(data, x, y, width) {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  }

  setColorAt(data, x, y, width, rgba) {
    const i = (y * width + x) * 4;
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }

  sameColor(a, b) {
    return Math.abs(a[0] - b[0]) < 8 &&
      Math.abs(a[1] - b[1]) < 8 &&
      Math.abs(a[2] - b[2]) < 8 &&
      Math.abs(a[3] - b[3]) < 8;
  }

  hexToRgba(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
      255
    ];
  }
}

const PALETTE = [
  "#1a2a33", "#ffffff", "#ff6b5a", "#ffc857", "#2ec4a6",
  "#4ea8de", "#7bdff2", "#b388eb", "#90be6d", "#f9844a",
  "#c1121f", "#fb8500", "#023e8a", "#6d6875", "#adb5bd",
  "#ffe8d6", "#ffb703", "#40916c", "#9b2226", "#22223b"
];
