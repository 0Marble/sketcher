import type { Template, CellState, Stroke, Rect } from '../types';
import { renderTraceGuide, renderPracticeGuide } from '../shapes/guides';
import { renderPerfectShape } from '../shapes/renderers';
import { errorColor } from '../geometry/distance';

export interface WorksheetConfig {
  rows: number;
  cols: number;
  traceCount: number;
  canonicalSize: number;
  gap: number;
}

const DEFAULT_CONFIG: WorksheetConfig = {
  rows: 3,
  cols: 4,
  traceCount: 2,
  canonicalSize: 200,
  gap: 12,
};

export class Worksheet {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private dpr = window.devicePixelRatio || 1;
  private template: Template | null = null;
  private cells: CellState[] = [];
  private activeIndex = 0;
  private currentStroke: Stroke | null = null;
  private config: WorksheetConfig;
  private cellRects: Rect[] = [];
  private renderedCellSize = 0;
  private rafId = 0;
  private interactive = true;
  private reviewMode = false;
  onChange?: () => void;

  constructor(parent: HTMLElement, config: Partial<WorksheetConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'block w-full h-full';
    this.canvas.style.touchAction = 'none';
    parent.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.bindEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setTemplate(template: Template): void {
    this.template = template;
    this.cells = Array.from({ length: this.config.rows * this.config.cols }, (_, i) => ({
      index: i,
      kind: i < this.config.traceCount ? 'trace' : 'practice',
      strokes: [],
    }));
    this.activeIndex = this.config.traceCount;
    this.interactive = true;
    this.reviewMode = false;
    this.canvas.style.pointerEvents = 'auto';
    this.resize();
  }

  getTemplate(): Template | null {
    return this.template;
  }

  getCells(): CellState[] {
    return this.cells;
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  setInteractive(value: boolean): void {
    this.interactive = value;
    this.canvas.style.pointerEvents = value ? 'auto' : 'none';
    this.scheduleRender();
  }

  setReviewMode(value: boolean): void {
    this.reviewMode = value;
    this.scheduleRender();
  }

  nextCell(): void {
    if (!this.interactive) return;
    if (this.activeIndex < this.cells.length - 1) {
      this.activeIndex++;
      this.scheduleRender();
      this.onChange?.();
    }
  }

  previousCell(): void {
    if (!this.interactive) return;
    if (this.activeIndex > this.config.traceCount) {
      this.activeIndex--;
      this.scheduleRender();
      this.onChange?.();
    }
  }

  clearActiveCell(): void {
    if (!this.interactive) return;
    if (this.activeIndex < this.cells.length) {
      this.cells[this.activeIndex].strokes = [];
      this.scheduleRender();
      this.onChange?.();
    }
  }

  undoActiveCell(): void {
    if (!this.interactive) return;
    if (this.activeIndex < this.cells.length) {
      this.cells[this.activeIndex].strokes.pop();
      this.scheduleRender();
      this.onChange?.();
    }
  }

  setScores(scores: number[]): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].score = scores[i];
    }
    this.scheduleRender();
  }

  setPerPointErrors(index: number, errors: import('../geometry/types').PerPointError[][]): void {
    if (index < this.cells.length) {
      this.cells[index].perPointErrors = errors;
      this.scheduleRender();
    }
  }

  destroy(): void {
    window.removeEventListener('resize', () => this.resize());
    this.canvas.remove();
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    if (cssWidth === 0 || cssHeight === 0) return;

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);

    this.computeLayout(cssWidth, cssHeight);
    this.scheduleRender();
  }

  private computeLayout(cssWidth: number, cssHeight: number): void {
    const { rows, cols, gap } = this.config;
    const availableWidth = cssWidth - (cols - 1) * gap;
    const availableHeight = cssHeight - (rows - 1) * gap;
    const cellSize = Math.min(
      Math.floor(availableWidth / cols),
      Math.floor(availableHeight / rows)
    );
    this.renderedCellSize = cellSize;

    const totalWidth = cols * cellSize + (cols - 1) * gap;
    const totalHeight = rows * cellSize + (rows - 1) * gap;
    const offsetX = (cssWidth - totalWidth) / 2;
    const offsetY = (cssHeight - totalHeight) / 2;

    this.cellRects = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.cellRects.push({
          x: offsetX + c * (cellSize + gap),
          y: offsetY + r * (cellSize + gap),
          width: cellSize,
          height: cellSize,
        });
      }
    }
  }

  private scale(): number {
    return this.renderedCellSize / this.config.canonicalSize;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointerleave', (e) => this.handlePointerUp(e));
  }

  private getEventCell(
    e: PointerEvent
  ): { index: number; localCss: { x: number; y: number } } | null {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    for (let i = 0; i < this.cellRects.length; i++) {
      const r = this.cellRects[i];
      if (
        cssX >= r.x &&
        cssX <= r.x + r.width &&
        cssY >= r.y &&
        cssY <= r.y + r.height
      ) {
        return {
          index: i,
          localCss: { x: cssX - r.x, y: cssY - r.y },
        };
      }
    }
    return null;
  }

  private toCanonical(localCss: { x: number; y: number }): { x: number; y: number } {
    const s = this.scale();
    return { x: localCss.x / s, y: localCss.y / s };
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.template || !this.interactive) return;
    const hit = this.getEventCell(e);
    if (!hit) return;

    // Activate the tapped cell (trace or practice).
    if (this.activeIndex !== hit.index) {
      this.activeIndex = hit.index;
      this.onChange?.();
      this.scheduleRender();
    }

    this.canvas.setPointerCapture(e.pointerId);
    const p = this.toCanonical(hit.localCss);
    this.currentStroke = [
      { x: p.x, y: p.y, pressure: e.pressure || 0.5, time: Date.now() },
    ];
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.currentStroke) return;
    const hit = this.getEventCell(e);
    if (!hit || hit.index !== this.activeIndex) {
      // End the stroke if it leaves the active cell.
      this.finishStroke();
      return;
    }
    const p = this.toCanonical(hit.localCss);
    this.currentStroke.push({
      x: p.x,
      y: p.y,
      pressure: e.pressure || 0.5,
      time: Date.now(),
    });
    this.scheduleRender();
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.currentStroke) return;
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }
    this.finishStroke();
  }

  private finishStroke(): void {
    if (!this.currentStroke) return;
    if (this.currentStroke.length > 1) {
      this.cells[this.activeIndex].strokes.push(this.currentStroke);
      this.onChange?.();
    }
    this.currentStroke = null;
    this.scheduleRender();
  }

  private scheduleRender(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.render();
    });
  }

  render(): void {
    if (!this.template) return;
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);

    for (let i = 0; i < this.cellRects.length; i++) {
      this.renderCell(i);
    }

    this.ctx.restore();
  }

  private renderCell(index: number): void {
    const cell = this.cells[index];
    const rect = this.cellRects[index];
    const s = this.scale();
    const isActive = index === this.activeIndex;
    const template = this.template!;

    this.ctx.save();
    this.ctx.translate(rect.x, rect.y);

    // Active highlight.
    if (this.interactive && isActive) {
      this.ctx.strokeStyle = '#3b82f6';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-2, -2, rect.width + 4, rect.height + 4);
    }

    // Clip all cell content to the cell bounds so guides/strokes do not spill over.
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, rect.width, rect.height);
    this.ctx.clip();

    // Guides.
    this.ctx.save();
    this.ctx.scale(s, s);
    if (cell.kind === 'trace') {
      renderTraceGuide(this.ctx, template.type, template.params, template.flags, this.config.canonicalSize);
    } else {
      renderPracticeGuide(this.ctx, template.type, template.params, this.config.canonicalSize);
    }
    this.ctx.restore();

    // User strokes.
    this.ctx.save();
    this.ctx.scale(s, s);
    this.drawStrokes(cell.strokes, cell.perPointErrors);
    if (this.currentStroke && index === this.activeIndex) {
      this.drawStrokes([this.currentStroke]);
    }
    this.ctx.restore();

    // Perfect-shape overlay in review mode.
    if (this.reviewMode) {
      this.ctx.save();
      this.ctx.scale(s, s);
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      renderPerfectShape(this.ctx, template.type, template.params, this.config.canonicalSize);
      this.ctx.restore();
    }

    // Score overlay for completed practice cells.
    if (cell.score !== undefined && cell.kind === 'practice') {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.fillRect(4, 4, 40, 22);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`${Math.round(cell.score)}`, 8, 8);
      this.ctx.restore();
    }

    this.ctx.restore(); // end clip
    this.ctx.restore(); // end cell translate
  }

  private drawStrokes(strokes: Stroke[], errors?: import('../geometry/types').PerPointError[][]): void {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    for (let si = 0; si < strokes.length; si++) {
      const stroke = strokes[si];
      if (stroke.length < 2) continue;
      const strokeErrors = errors?.[si];
      for (let i = 1; i < stroke.length; i++) {
        const p0 = stroke[i - 1];
        const p1 = stroke[i];
        this.ctx.lineWidth = Math.max(1.5, p1.pressure * 3);
        if (strokeErrors && i - 1 < strokeErrors.length && i < strokeErrors.length) {
          const avg = (strokeErrors[i - 1].distance + strokeErrors[i].distance) / 2;
          this.ctx.strokeStyle = errorColor(avg);
          this.ctx.globalAlpha = 0.9;
        } else {
          // Pencil-like appearance: dark slate, slightly transparent.
          this.ctx.strokeStyle = '#334155';
          this.ctx.globalAlpha = 0.85;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(p0.x, p0.y);
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();
      }
    }
    this.ctx.globalAlpha = 1;
  }
}
