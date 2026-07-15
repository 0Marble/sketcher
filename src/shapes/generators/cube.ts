import type { Rect, CubeParams, Point } from '../../types';
import { randomRange } from '../../utils';

interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

const CUBE_VERTICES: Vertex3D[] = [
  { x: -1, y: -1, z: -1 },
  { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 },
  { x: -1, y: 1, z: 1 },
];

const CUBE_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

const FACES: { indices: number[]; normal: Vertex3D }[] = [
  { indices: [0, 1, 2, 3], normal: { x: 0, y: 0, z: -1 } },
  { indices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 } },
  { indices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 } },
  { indices: [2, 3, 7, 6], normal: { x: 0, y: 1, z: 0 } },
  { indices: [0, 3, 7, 4], normal: { x: -1, y: 0, z: 0 } },
  { indices: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 } },
];

function rotateX(v: Vertex3D, angle: number): Vertex3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}

function rotateY(v: Vertex3D, angle: number): Vertex3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}

function rotateZ(v: Vertex3D, angle: number): Vertex3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos, z: v.z };
}

function rotateNormal(n: Vertex3D, rx: number, ry: number, rz: number): Vertex3D {
  return rotateZ(rotateY(rotateX(n, rx), ry), rz);
}

function project(v: Vertex3D): Point {
  return { x: v.x, y: v.y };
}

function normalize(p: Point): Point {
  const len = Math.hypot(p.x, p.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: p.x / len, y: p.y / len };
}

function scale(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

export function generateCube(cellBounds: Rect): CubeParams {
  const margin = Math.min(cellBounds.width, cellBounds.height) * 0.15;

  const rx = randomRange(-Math.PI / 3, Math.PI / 3);
  const ry = randomRange(-Math.PI / 4, Math.PI / 4);
  const rz = randomRange(-Math.PI / 3, Math.PI / 3);

  const rotated = CUBE_VERTICES.map((v) => rotateZ(rotateY(rotateX(v, rx), ry), rz));
  const projected = rotated.map(project);

  // Find front face (normal with largest positive Z after rotation).
  let frontFace = FACES[0];
  let bestZ = -Infinity;
  for (const face of FACES) {
    const n = rotateNormal(face.normal, rx, ry, rz);
    if (n.z > bestZ) {
      bestZ = n.z;
      frontFace = face;
    }
  }

  const frontIndices = frontFace.indices;
  const frontCenter = frontIndices.reduce(
    (acc, i) => ({ x: acc.x + projected[i].x, y: acc.y + projected[i].y }),
    { x: 0, y: 0 }
  );
  frontCenter.x /= frontIndices.length;
  frontCenter.y /= frontIndices.length;

  // Determine front-face edge directions and pick the one pointing most upward on screen.
  const edgeVecs: Point[] = [];
  for (let i = 0; i < frontIndices.length; i++) {
    const a = projected[frontIndices[i]];
    const b = projected[frontIndices[(i + 1) % frontIndices.length]];
    edgeVecs.push({ x: b.x - a.x, y: b.y - a.y });
  }
  const upVector = edgeVecs
    .map(normalize)
    .reduce((best, v) => (v.y < best.y ? v : best));

  // Normal guide vector: perpendicular-ish to up, representing the normal coming out of the face.
  const normalVector = normalize({
    x: upVector.y * Math.cos(Math.PI / 4) + upVector.x * Math.sin(Math.PI / 4),
    y: -upVector.x * Math.cos(Math.PI / 4) + upVector.y * Math.sin(Math.PI / 4),
  });

  // Scale and translate the projection to fit the cell.
  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const availW = cellBounds.width - 2 * margin;
  const availH = cellBounds.height - 2 * margin;
  const scaleFactor = Math.min(
    availW / (maxX - minX || 1),
    availH / (maxY - minY || 1)
  ) * 0.9;

  const cellCx = cellBounds.x + cellBounds.width / 2;
  const cellCy = cellBounds.y + cellBounds.height / 2;
  const projCx = (minX + maxX) / 2;
  const projCy = (minY + maxY) / 2;

  function transform(p: Point): Point {
    return {
      x: cellCx + (p.x - projCx) * scaleFactor,
      y: cellCy + (p.y - projCy) * scaleFactor,
    };
  }

  const edges = CUBE_EDGES.map(([a, b]) => ({
    start: transform(projected[a]),
    end: transform(projected[b]),
  }));

  const guideLength = Math.min(cellBounds.width, cellBounds.height) * 0.18;

  return {
    edges,
    frontFaceCenter: transform(frontCenter),
    upVector: scale(upVector, guideLength),
    normalVector: scale(normalVector, guideLength * 0.8),
  };
}
