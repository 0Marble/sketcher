import { renderPerfectShape } from './renderers';
import { buildTargetCurves } from '../geometry/targetCurves';
import type {
  ExerciseType,
  ExerciseParams,
  ScoringFlags,
  CircleParams,
  EllipseParams,
  ParallelLinesParams,
  ConvergingLinesParams,
  CurvedLinesParams,
  CircleOnPlaneParams,
  CubeParams,
  Point,
} from '../types';
import type { SampledCurve } from '../geometry/types';

const STROKE_PALETTE = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6'];

export function renderCellBorder(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  color = '#e2e8f0'
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, cellSize, cellSize);
  ctx.restore();
}

export function renderTraceGuide(
  ctx: CanvasRenderingContext2D,
  type: ExerciseType,
  params: ExerciseParams,
  flags: ScoringFlags,
  cellSize: number
): void {
  renderCellBorder(ctx, cellSize);

  // If no restrictions, keep the simple gray dashed outline.
  if (flags.ignoreStrokeCount && flags.ignoreStrokeOrder && flags.ignoreDirection) {
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    renderPerfectShape(ctx, type, params, cellSize);
    ctx.restore();

    // Overlay guide hints for the 3D exercises.
    if (type === 'circleOnPlane') {
      renderCircleOnPlaneGuide(ctx, params as CircleOnPlaneParams);
    } else if (type === 'cube') {
      renderCubeGuide(ctx, params as CubeParams);
    }
    return;
  }

  // Draw exercise-specific background rails/limit lines first.
  if (type === 'parallelLines') {
    renderParallelLineRails(ctx, params as ParallelLinesParams, '#1e293b');
  }

  // For circle-on-plane, show the plane outline, circle-sized cross and normal.
  if (type === 'circleOnPlane') {
    renderCircleOnPlaneGuide(ctx, params as CircleOnPlaneParams);
  }

  const curves = buildTargetCurves(type, params);
  for (let i = 0; i < curves.length; i++) {
    const color = STROKE_PALETTE[i % STROKE_PALETTE.length];
    renderColoredCurve(ctx, curves[i], color, i + 1, flags);
  }
}

function renderColoredCurve(
  ctx: CanvasRenderingContext2D,
  curve: SampledCurve,
  color: string,
  index: number,
  flags: ScoringFlags
): void {
  if (curve.points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(curve.points[0].x, curve.points[0].y);
  for (let i = 1; i < curve.points.length; i++) {
    ctx.lineTo(curve.points[i].x, curve.points[i].y);
  }
  ctx.stroke();

  if (!flags.ignoreDirection) {
    const p0 = curve.points[curve.points.length - 2];
    const p1 = curve.points[curve.points.length - 1];
    drawArrowhead(ctx, p0, p1, color);
  }

  if (!flags.ignoreStrokeOrder) {
    const start = curve.points[0];
    drawNumberBadge(ctx, start, index, color);
  }

  ctx.restore();
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  p0: Point,
  p1: Point,
  color: string,
  size = 10
): void {
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(
    p1.x - size * Math.cos(angle - Math.PI / 6),
    p1.y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    p1.x - size * Math.cos(angle + Math.PI / 6),
    p1.y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawNumberBadge(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  num: number,
  color: string
): void {
  const size = 16;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num.toString(), pos.x, pos.y + 1);
  ctx.restore();
}

export function renderPracticeGuide(
  ctx: CanvasRenderingContext2D,
  type: ExerciseType,
  params: ExerciseParams,
  cellSize: number
): void {
  renderCellBorder(ctx, cellSize);

  switch (type) {
    case 'circle':
      renderCircleGuide(ctx, params as CircleParams);
      break;
    case 'ellipse':
      renderEllipseGuide(ctx, params as EllipseParams);
      break;
    case 'parallelLines':
      renderParallelLinesGuide(ctx, params as ParallelLinesParams, cellSize);
      break;
    case 'convergingLines':
      renderConvergingLinesGuide(ctx, params as ConvergingLinesParams);
      break;
    case 'curvedLines':
      renderCurvedLineGuide(ctx, params as CurvedLinesParams);
      break;
    case 'circleOnPlane':
      renderCircleOnPlaneGuide(ctx, params as CircleOnPlaneParams);
      break;
    case 'cube':
      renderCubeGuide(ctx, params as CubeParams);
      break;
  }
}

function drawDot(ctx: CanvasRenderingContext2D, p: Point, radius = 4, color = '#94a3b8'): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCross(
  ctx: CanvasRenderingContext2D,
  center: Point,
  rx: number,
  ry: number,
  rotation = 0,
  color = '#cbd5e1'
): void {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-rx, 0);
  ctx.lineTo(rx, 0);
  ctx.moveTo(0, -ry);
  ctx.lineTo(0, ry);
  ctx.stroke();
  ctx.restore();
}

function renderCircleGuide(ctx: CanvasRenderingContext2D, p: CircleParams): void {
  drawCross(ctx, p.center, p.radius, p.radius, 0);
}

function renderEllipseGuide(ctx: CanvasRenderingContext2D, p: EllipseParams): void {
  drawCross(ctx, p.center, p.rx, p.ry, p.rotation);
}

function renderParallelLineRails(
  ctx: CanvasRenderingContext2D,
  p: ParallelLinesParams,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(p.guideLine.start.x, p.guideLine.start.y);
  ctx.lineTo(p.topLine.start.x, p.topLine.start.y);
  ctx.moveTo(p.guideLine.end.x, p.guideLine.end.y);
  ctx.lineTo(p.topLine.end.x, p.topLine.end.y);
  ctx.stroke();
  ctx.restore();
}

function renderParallelLinesGuide(
  ctx: CanvasRenderingContext2D,
  p: ParallelLinesParams,
  _cellSize: number
): void {
  // Solid black side rails.
  renderParallelLineRails(ctx, p, '#000000');

  const dir = {
    x: p.guideLine.end.x - p.guideLine.start.x,
    y: p.guideLine.end.y - p.guideLine.start.y,
  };
  const len = Math.hypot(dir.x, dir.y);
  if (len === 0) return;
  const unit = { x: dir.x / len, y: dir.y / len };
  const perp = { x: -unit.y, y: unit.x };
  const tick = len * 0.06;

  ctx.save();

  // Guide line: the first parallel line to draw.
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(p.guideLine.start.x, p.guideLine.start.y);
  ctx.lineTo(p.guideLine.end.x, p.guideLine.end.y);
  ctx.stroke();

  // Center reference positions for the ticks (midpoints of the two bases).
  const guideMid = {
    x: (p.guideLine.start.x + p.guideLine.end.x) / 2,
    y: (p.guideLine.start.y + p.guideLine.end.y) / 2,
  };
  const topMid = {
    x: (p.topLine.start.x + p.topLine.end.x) / 2,
    y: (p.topLine.start.y + p.topLine.end.y) / 2,
  };

  // Single perpendicular tick in the middle for each intermediate line.
  ctx.setLineDash([]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#94a3b8';
  for (let i = 1; i < p.count - 1; i++) {
    const t = i / (p.count - 1);
    const cx = guideMid.x + (topMid.x - guideMid.x) * t;
    const cy = guideMid.y + (topMid.y - guideMid.y) * t;
    ctx.beginPath();
    ctx.moveTo(cx - perp.x * tick, cy - perp.y * tick);
    ctx.lineTo(cx + perp.x * tick, cy + perp.y * tick);
    ctx.stroke();
  }

  ctx.restore();
}

function renderConvergingLinesGuide(
  ctx: CanvasRenderingContext2D,
  p: ConvergingLinesParams
): void {
  drawDot(ctx, p.vanishingPoint, 5, '#94a3b8');
  for (const base of p.basePoints) {
    drawDot(ctx, base, 5, '#94a3b8');
  }
}

function renderCurvedLineGuide(
  ctx: CanvasRenderingContext2D,
  p: CurvedLinesParams
): void {
  drawDot(ctx, p.start, 5, '#94a3b8');
  drawDot(ctx, p.end, 5, '#94a3b8');
  for (const c of p.control) {
    drawDot(ctx, c, 4, '#cbd5e1');
  }
}

function renderCircleOnPlaneGuide(
  ctx: CanvasRenderingContext2D,
  p: CircleOnPlaneParams
): void {
  const outlineScale = 1.4;
  const corners = [
    { x: p.center.x + p.u.x * outlineScale + p.v.x * outlineScale, y: p.center.y + p.u.y * outlineScale + p.v.y * outlineScale },
    { x: p.center.x - p.u.x * outlineScale + p.v.x * outlineScale, y: p.center.y - p.u.y * outlineScale + p.v.y * outlineScale },
    { x: p.center.x - p.u.x * outlineScale - p.v.x * outlineScale, y: p.center.y - p.u.y * outlineScale - p.v.y * outlineScale },
    { x: p.center.x + p.u.x * outlineScale - p.v.x * outlineScale, y: p.center.y + p.u.y * outlineScale - p.v.y * outlineScale },
  ];

  ctx.save();

  // Plane outline.
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  // Dashed cross aligned with the projected ellipse axes and sized to the circle.
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(p.center.x - p.u.x, p.center.y - p.u.y);
  ctx.lineTo(p.center.x + p.u.x, p.center.y + p.u.y);
  ctx.moveTo(p.center.x - p.v.x, p.center.y - p.v.y);
  ctx.lineTo(p.center.x + p.v.x, p.center.y + p.v.y);
  ctx.stroke();

  // Normal arrow.
  const normalLen = p.radius * 0.7;
  const n0 = p.center;
  const n1 = {
    x: p.center.x + Math.cos(p.normalAngle) * normalLen,
    y: p.center.y + Math.sin(p.normalAngle) * normalLen,
  };
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(n0.x, n0.y);
  ctx.lineTo(n1.x, n1.y);
  ctx.stroke();
  drawArrowhead(ctx, n0, n1, '#3b82f6');

  ctx.restore();
}

function renderCubeGuide(ctx: CanvasRenderingContext2D, p: CubeParams): void {
  ctx.save();

  // Front face center dot.
  drawDot(ctx, p.frontFaceCenter, 4, '#94a3b8');

  // Up vector.
  const upEnd = {
    x: p.frontFaceCenter.x + p.upVector.x,
    y: p.frontFaceCenter.y + p.upVector.y,
  };
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(p.frontFaceCenter.x, p.frontFaceCenter.y);
  ctx.lineTo(upEnd.x, upEnd.y);
  ctx.stroke();
  drawArrowhead(ctx, p.frontFaceCenter, upEnd, '#000000');

  // Normal vector.
  const normalEnd = {
    x: p.frontFaceCenter.x + p.normalVector.x,
    y: p.frontFaceCenter.y + p.normalVector.y,
  };
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(p.frontFaceCenter.x, p.frontFaceCenter.y);
  ctx.lineTo(normalEnd.x, normalEnd.y);
  ctx.stroke();
  drawArrowhead(ctx, p.frontFaceCenter, normalEnd, '#3b82f6');

  ctx.restore();
}
