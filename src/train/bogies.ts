// Los dos bogies del vagón sobre la vía: posición, yaw, pitch y avance limitado por el fin de la vía.
import { advance, pointAt, type Cursor, type RailAt, type Vec3 } from "./track";

/** Distancia del centro del vagón a cada bogie, medida sobre la vía. */
export const BOGIE_OFFSET = 2;

export interface Pose {
  /** Punto medio entre los dos bogies. */
  position: Vec3;
  /** Yaw de Minecraft en grados (0 = sur, 90 = oeste, 180 = norte, −90 = este), hacia el frente. */
  yaw: number;
  /** Grados; positivo = el frente más alto que la parte de atrás. */
  pitch: number;
}

/** Si caben los dos bogies sobre la vía alrededor de ese centro. */
export function fits(railAt: RailAt, center: Cursor): boolean {
  return (
    Math.abs(advance(railAt, center, BOGIE_OFFSET).moved - BOGIE_OFFSET) < 1e-9 &&
    Math.abs(advance(railAt, center, -BOGIE_OFFSET).moved + BOGIE_OFFSET) < 1e-9
  );
}

/** Pose del vagón: el frente es el sentido de avance del cursor. */
export function poseOf(railAt: RailAt, center: Cursor): Pose {
  const front = pointAt(advance(railAt, center, BOGIE_OFFSET).cursor);
  const rear = pointAt(advance(railAt, center, -BOGIE_OFFSET).cursor);
  const dx = front.x - rear.x;
  const dy = front.y - rear.y;
  const dz = front.z - rear.z;
  return {
    position: { x: (front.x + rear.x) / 2, y: (front.y + rear.y) / 2, z: (front.z + rear.z) / 2 },
    yaw: (Math.atan2(-dx, dz) * 180) / Math.PI,
    pitch: (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI,
  };
}

/**
 * Mueve el centro `distance` sobre la vía (negativo = reversa) sin que se salga lo que va delante: el
 * bogie delantero (a `ahead` del centro) o, en reversa, el trasero (a `behind`). Un tren de varios
 * vagones pasa como `behind` la distancia hasta el último bogie de la cola.
 * `blocked` indica que no pudo avanzar todo porque la vía se acabó.
 */
export function moveAlong(
  railAt: RailAt,
  center: Cursor,
  distance: number,
  ahead = BOGIE_OFFSET,
  behind = BOGIE_OFFSET,
): { center: Cursor; moved: number; blocked: boolean } {
  if (distance === 0) return { center, moved: 0, blocked: false };
  const sign = Math.sign(distance);
  const wanted = Math.abs(distance);
  const margin = sign > 0 ? ahead : behind;
  const lead = advance(railAt, center, sign * (wanted + margin));
  const allowed = Math.max(0, Math.abs(lead.moved) - margin);
  const result = advance(railAt, center, sign * allowed);
  return { center: result.cursor, moved: result.moved, blocked: allowed < wanted - 1e-9 };
}
