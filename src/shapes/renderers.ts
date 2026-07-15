import type {
  ExerciseType,
  ExerciseParams,
  CircleParams,
  EllipseParams,
  ParallelLinesParams,
  ConvergingLinesParams,
  CurvedLinesParams,
  CircleOnPlaneParams,
  CubeParams,
} from '../types';

export function renderPerfectShape(
  ctx: CanvasRenderingContext2D,
  type: ExerciseType,
  params: ExerciseParams,
  cellSize: number
): void {
  switch (type) {
    case 'circle':
      renderCircle(ctx, params as CircleParams);
      break;
    case 'ellipse':
      renderEllipse(ctx, params as EllipseParams);
      break;
    case 'parallelLines':
      renderParallelLines(ctx, params as ParallelLinesParams, cellSize);
      break;
    case 'convergingLines':
      renderConvergingLines(ctx, params as ConvergingLinesParams);
      break;
    case 'curvedLines':
      renderCurvedLine(ctx, params as CurvedLinesParams);
      break;
    case 'circleOnPlane':
      renderCircleOnPlane(ctx, params as CircleOnPlaneParams);
      break;
    case 'cube':
      renderCube(ctx, params as CubeParams);
      break;
  }
}

function renderCircle(ctx: CanvasRenderingContext2D, p: CircleParams): void {
  ctx.beginPath();
  ctx.arc(p.center.x, p.center.y, p.radius, 0, Math.PI * 2);
  ctx.stroke();
}

function renderEllipse(ctx: CanvasRenderingContext2D, p: EllipseParams): void {
  ctx.save();
  ctx.translate(p.center.x, p.center.y);
  ctx.rotate(p.rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function renderParallelLines(
  ctx: CanvasRenderingContext2D,
  p: ParallelLinesParams,
  _cellSize: number
): void {
  for (let i = 0; i < p.count; i++) {
    const t = p.count === 1 ? 0 : i / (p.count - 1);
    const start = {
      x: p.guideLine.start.x + (p.topLine.start.x - p.guideLine.start.x) * t,
      y: p.guideLine.start.y + (p.topLine.start.y - p.guideLine.start.y) * t,
    };
    const end = {
      x: p.guideLine.end.x + (p.topLine.end.x - p.guideLine.end.x) * t,
      y: p.guideLine.end.y + (p.topLine.end.y - p.guideLine.end.y) * t,
    };
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

function renderConvergingLines(
  ctx: CanvasRenderingContext2D,
  p: ConvergingLinesParams
): void {
  for (const base of p.basePoints) {
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(p.vanishingPoint.x, p.vanishingPoint.y);
    ctx.stroke();
  }
}

function renderCurvedLine(
  ctx: CanvasRenderingContext2D,
  p: CurvedLinesParams
): void {
  ctx.beginPath();
  ctx.moveTo(p.start.x, p.start.y);
  if (p.control.length === 1) {
    const c = p.control[0];
    ctx.quadraticCurveTo(c.x, c.y, p.end.x, p.end.y);
  } else {
    const [c1, c2] = p.control;
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p.end.x, p.end.y);
  }
  ctx.stroke();
}

function renderCircleOnPlane(ctx: CanvasRenderingContext2D, p: CircleOnPlaneParams): void {
  ctx.beginPath();
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = p.center.x + p.u.x * cos + p.v.x * sin;
    const y = p.center.y + p.u.y * cos + p.v.y * sin;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function renderCube(ctx: CanvasRenderingContext2D, p: CubeParams): void {
  for (const edge of p.edges) {
    ctx.beginPath();
    ctx.moveTo(edge.start.x, edge.start.y);
    ctx.lineTo(edge.end.x, edge.end.y);
    ctx.stroke();
  }
}
