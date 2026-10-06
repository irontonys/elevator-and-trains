// Física del tren (pura): cómo cambia la velocidad según el conductor y los rieles propulsores.
import {
  ACCELERATION,
  BOOST_ACCELERATION,
  BOOST_MAX_SPEED,
  BRAKE,
  COAST_DRAG,
  INPUT_DEADZONE,
  MAX_REVERSE_SPEED,
  MAX_SPEED,
  NO_DRIVER_BRAKE,
} from "./config";

/** Riel bajo el tren: propulsor encendido, propulsor apagado o cualquier otro. */
export type RailEffect = "normal" | "boost" | "brake";

export interface Motion {
  /** Bloques por tick; negativo = reversa. */
  speed: number;
  /** Ya se detuvo sobre un propulsor apagado: puede salir sin que lo vuelva a frenar. */
  departing: boolean;
}

/**
 * Siguiente velocidad. `input` es el eje adelante/atrás del conductor (`undefined` = sin conductor) y
 * `rail` el efecto más fuerte bajo cualquier vagón (boost gana sobre brake, y brake sobre normal).
 */
export function nextMotion({ speed, departing }: Motion, input: number | undefined, rail: RailEffect): Motion {
  if (rail === "boost") {
    // Acelera solo en el sentido en que se mueve, o hacia el frente si está detenido. Ignora al conductor.
    const sign = speed < 0 ? -1 : 1;
    return { speed: sign * Math.min(BOOST_MAX_SPEED, Math.abs(speed) + BOOST_ACCELERATION), departing: false };
  }
  if (rail === "brake" && !departing) {
    const next = approach(speed, 0, BRAKE);
    return { speed: next, departing: next === 0 };
  }
  return { speed: driverSpeed(speed, input), departing: rail === "brake" && departing };
}

function driverSpeed(speed: number, input: number | undefined): number {
  if (input === undefined) return approach(speed, 0, NO_DRIVER_BRAKE);
  if (input > INPUT_DEADZONE) {
    if (speed < 0) return Math.min(0, speed + BRAKE);
    // Arriba del máximo del conductor (venía de propulsores): baja poco a poco aunque mantenga "adelante".
    return speed > MAX_SPEED ? Math.max(MAX_SPEED, speed - COAST_DRAG) : Math.min(MAX_SPEED, speed + ACCELERATION);
  }
  if (input < -INPUT_DEADZONE) {
    if (speed > 0) return Math.max(0, speed - BRAKE);
    return speed < -MAX_REVERSE_SPEED ? Math.min(-MAX_REVERSE_SPEED, speed + COAST_DRAG) : Math.max(-MAX_REVERSE_SPEED, speed - ACCELERATION);
  }
  return approach(speed, 0, COAST_DRAG);
}

function approach(value: number, target: number, delta: number): number {
  return value > target ? Math.max(target, value - delta) : Math.min(target, value + delta);
}
