/** Shared logical board size — every player draws in this space. */
const LOGICAL_W = 960;
const LOGICAL_H = 672;

class DrawCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.tool = "pen";
    this.color = "#1a2a33";
    this.size = 8;
    this.drawing = false;
    this.last = null;
    this.history = [];
    this.maxHistory = 30;
    this.enabled = false;
    this.onStroke = null;
    this._bound = false;
    this._remoteLast = null;

    this.ensureLogicalSize(true);
  }

  ensureLogicalSize(forceClear = false) {
    if (this.canvas.width !== LOGICAL_W || this.canvas.height !== LOGICAL_H) {
      this.canvas.width = LOGICAL_W;
      this.canvas.height = LOGICAL_H;
      forceClear = true;
    }
    if (forceClear) {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
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
      this.floodFill(Math.round(p.x), Math.round(p.y), this.color);
      this.emit(this.packStroke({
        type: "fill",
        x: p.x,
        y: p.y,
        color: this.color
      }));
      return;
    }
    this.drawing = true;
    this.last = p;
    this.snapshot();
    this.drawDot(p.x, p.y, this.strokeStyle(), this.size);
    this.emit(this.packStroke({
      type: "start",
      x: p.x,
      y: p.y,
      color: this.strokeStyle(),
      size: this.size,
      tool: this.tool
    }));
  };

  onPointerMove = (e) => {
    if (!this.enabled || !this.drawing || !this.last) return;
    e.preventDefault();
    const p = this.pos(e);
    this.drawLine(this.last.x, this.last.y, p.x, p.y, this.strokeStyle(), this.size);
    this.emit(this.packStroke({
      type: "move",
      x: p.x,
      y: p.y,
      color: this.strokeStyle(),
      size: this.size,
      tool: this.tool
    }));
    this.last = p;
  };

  onPointerUp = (e) => {
    try {
      if (e?.pointerId != null) this.canvas.releasePointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
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
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    return {
      x: ((e.clientX - rect.left) / w) * LOGICAL_W,
      y: ((e.clientY - rect.top) / h) * LOGICAL_H
    };
  }

  /** Pack normalized coords so any screen size can replay the stroke. */
  packStroke(stroke) {
    return {
      ...stroke,
      nx: stroke.x / LOGICAL_W,
      ny: stroke.y / LOGICAL_H,
      sizeN: stroke.size != null ? stroke.size / LOGICAL_W : undefined,
      boardW: LOGICAL_W,
      boardH: LOGICAL_H
    };
  }

  unpackStroke(stroke) {
    if (!stroke) return stroke;
    if (typeof stroke.nx === "number" && typeof stroke.ny === "number") {
      return {
        ...stroke,
        x: stroke.nx * LOGICAL_W,
        y: stroke.ny * LOGICAL_H,
        size: typeof stroke.sizeN === "number" ? stroke.sizeN * LOGICAL_W : stroke.size
      };
    }
    // Legacy absolute coords from an older client — scale if board differed
    const srcW = stroke.boardW || LOGICAL_W;
    const srcH = stroke.boardH || LOGICAL_H;
    return {
      ...stroke,
      x: (stroke.x / srcW) * LOGICAL_W,
      y: (stroke.y / srcH) * LOGICAL_H,
      size: stroke.size * (LOGICAL_W / srcW)
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
    this.drawing = false;
    this.last = null;
    this._remoteLast = null;
    this.canvas.style.cursor = on ? "crosshair" : "default";
    if (on) this.bindEvents();
  }

  emit(stroke) {
    if (typeof this.onStroke === "function") this.onStroke(stroke);
  }

  applyStroke(raw) {
    if (!raw) return;
    const stroke = this.unpackStroke(raw);
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
      this.floodFill(Math.round(stroke.x), Math.round(stroke.y), stroke.color);
    } else if (stroke.type === "clear") {
      this.snapshot();
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    } else if (stroke.type === "undo") {
      this.undo(false);
    }
  }

  drawDot(x, y, color, size) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, size / 2), 0, Math.PI * 2);
    ctx.fill();
  }

  drawLine(x1, y1, x2, y2, color, size) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  snapshot() {
    try {
      this.history.push(this.ctx.getImageData(0, 0, LOGICAL_W, LOGICAL_H));
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
    this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (emit) this.emit({ type: "clear" });
  }

  resetRound() {
    this.history = [];
    this._remoteLast = null;
    this.drawing = false;
    this.last = null;
    this.ensureLogicalSize(true);
  }

  /** Keep internal board fixed; CSS handles screen fit. */
  resizeToDisplay() {
    this.ensureLogicalSize(false);
  }

  /**
   * Scanline flood fill with wider tolerance so anti-aliased stroke
   * edges don't leave weird leftover outlines.
   */
  floodFill(sx, sy, fillColor) {
    const ctx = this.ctx;
    const width = LOGICAL_W;
    const height = LOGICAL_H;
    sx = Math.max(0, Math.min(width - 1, sx | 0));
    sy = Math.max(0, Math.min(height - 1, sy | 0));

    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;
    const target = this.colorAt(data, sx, sy, width);
    const fill = this.hexToRgba(fillColor);
    if (this.sameColor(target, fill, 4)) return;

    const match = (x, y) => this.sameColor(this.colorAt(data, x, y, width), target, 48);
    const stack = [sy * width + sx];
    const seen = new Uint8Array(width * height);

    while (stack.length) {
      const id = stack.pop();
      const x0 = id % width;
      let y = (id / width) | 0;
      let x = x0;

      // move left
      while (x >= 0 && !seen[y * width + x] && match(x, y)) x--;
      x++;

      let spanUp = false;
      let spanDown = false;
      while (x < width && !seen[y * width + x] && match(x, y)) {
        const i = y * width + x;
        seen[i] = 1;
        this.setColorAt(data, x, y, width, fill);

        if (y > 0) {
          const up = (y - 1) * width + x;
          if (!seen[up] && match(x, y - 1)) {
            if (!spanUp) {
              stack.push(up);
              spanUp = true;
            }
          } else spanUp = false;
        }
        if (y < height - 1) {
          const down = (y + 1) * width + x;
          if (!seen[down] && match(x, y + 1)) {
            if (!spanDown) {
              stack.push(down);
              spanDown = true;
            }
          } else spanDown = false;
        }
        x++;
      }
    }

    // Second pass: clean thin anti-aliased fringes next to filled pixels
    this.cleanFillFringes(data, width, height, fill, target);
    ctx.putImageData(img, 0, 0);
  }

  cleanFillFringes(data, width, height, fill, target) {
    const fringe = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const c = this.colorAt(data, x, y, width);
        if (this.sameColor(c, fill, 4)) continue;
        // Near the original region color (anti-aliased edge) and touching fill
        if (!this.sameColor(c, target, 90)) continue;
        let touchesFill = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (this.sameColor(this.colorAt(data, x + dx, y + dy, width), fill, 4)) {
            touchesFill = true;
            break;
          }
        }
        if (touchesFill) fringe.push([x, y]);
      }
    }
    fringe.forEach(([x, y]) => this.setColorAt(data, x, y, width, fill));
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

  sameColor(a, b, tol = 32) {
    return Math.abs(a[0] - b[0]) <= tol &&
      Math.abs(a[1] - b[1]) <= tol &&
      Math.abs(a[2] - b[2]) <= tol;
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
  // neutrals
  "#000000", "#1a2a33", "#4a5568", "#718096", "#a0aec0", "#e2e8f0", "#ffffff",
  // reds / pinks
  "#c1121f", "#e5383b", "#ff6b5a", "#ff85a1", "#f72585",
  // oranges / yellows
  "#fb8500", "#ff9f1c", "#ffc857", "#ffd60a", "#ffe566",
  // greens
  "#2d6a4f", "#40916c", "#2ec4a6", "#80ed99", "#b7e4c7",
  // blues
  "#023e8a", "#0077b6", "#4ea8de", "#48cae4", "#90e0ef",
  // purples / browns
  "#5a189a", "#7b2cbf", "#b388eb", "#7f5539", "#b08968",
  // extras
  "#22223b", "#9b2226", "#f9844a", "#90be6d", "#577590"
];
