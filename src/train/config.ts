// Constantes del vagón de metro. Velocidades en bloques por tick (20 ticks = 1 s).

export const METRO_CAR_ID = "eleytren:metro_car";
export const METRO_SPAWNER_COMPONENT = "eleytren:metro_spawner";
export const PITCH_PROPERTY = "eleytren:pitch";

/** 12 bloques/s hacia el frente con el conductor (el carrito vanilla va a ~8). */
export const MAX_SPEED = 0.6;
/** 20 bloques/s sobre propulsores encendidos. */
export const BOOST_MAX_SPEED = 1.0;
/** Aceleración de los propulsores encendidos. */
export const BOOST_ACCELERATION = 0.04;
/** 3 bloques/s en reversa. */
export const MAX_REVERSE_SPEED = 0.15;
/** Aceleración con "adelante" (o "atrás" ya detenido). */
export const ACCELERATION = 0.01;
/** Frenado con el control contrario al movimiento. */
export const BRAKE = 0.03;
/** Pérdida de velocidad al soltar los controles. */
export const COAST_DRAG = 0.004;
/** Frenado sin conductor. */
export const NO_DRIVER_BRAKE = 0.02;
/** Umbral del joystick para contar como "adelante" o "atrás". */
export const INPUT_DEADZONE = 0.3;
/** Cambio mínimo de inclinación (grados) para mandarlo al cliente. */
export const PITCH_EPSILON = 0.5;

/** Golpes del mismo jugador, en esta ventana de ticks, para quitar el vagón. */
export const HITS_TO_REMOVE = 3;
export const HIT_WINDOW_TICKS = 40;
/** Ticks entre dos usos del item por el mismo jugador (en touch se repite al mantener presionado). */
export const SPAWN_COOLDOWN_TICKS = 10;
