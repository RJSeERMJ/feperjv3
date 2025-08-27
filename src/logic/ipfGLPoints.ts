// gl-points.ts
// Sistema de pontuação IPF GL Points
// Adaptado do modelo oficial (IPF/GL) e compatível com OpenLifter/CBLB

// ----------------------
// Tipos exportados
// ----------------------
export type Sex = 'M' | 'F' | 'Mx';
export type Equipment = 'Sleeves' | 'Single-ply' | 'Bare' | 'Wraps' | 'Multi-ply' | 'Unlimited' | 'Raw';
export type Event = 'SBD' | 'S' | 'B' | 'D';

// Tipos internos (simplificados)
type NormalizedSex = 'M' | 'F';
type NormalizedEquip = 'Classico' | 'Equipado';
type NormalizedEvent = 'SBD' | 'B';

// ----------------------
// Parâmetros oficiais IPF GL
// ----------------------
interface GLParams { a: number; b: number; c: number; }

const PARAMETERS: Record<NormalizedSex, Record<NormalizedEquip, Record<NormalizedEvent, GLParams>>> = {
  M: {
    Classico: {
      SBD: { a: 1199.72839, b: 1025.18162, c: 0.009210 },
      B:   { a: 320.98041,  b: 281.40258,  c: 0.01008 },
    },
    Equipado: {
      SBD: { a: 1236.25115, b: 1449.21864, c: 0.01644 },
      B:   { a: 381.22073,  b: 733.79378,  c: 0.02398 },
    },
  },
  F: {
    Classico: {
      SBD: { a: 610.32796, b: 1045.59282, c: 0.03048 },
      B:   { a: 142.40398, b: 442.52671,  c: 0.04724 },
    },
    Equipado: {
      SBD: { a: 758.63878, b: 949.31382,  c: 0.02435 },
      B:   { a: 221.82209, b: 357.00377,  c: 0.02937 },
    },
  },
};

// ----------------------
// Normalizações
// ----------------------
function normalizeSex(sex: Sex): NormalizedSex | null {
  if (sex === 'M' || sex === 'Mx') return 'M';
  if (sex === 'F') return 'F';
  return null;
}

function normalizeEquipment(equipment: Equipment): NormalizedEquip | null {
  if (['Bare', 'Wraps', 'Sleeves', 'Raw'].includes(equipment)) return 'Classico';
  if (['Single-ply', 'Multi-ply', 'Unlimited'].includes(equipment)) return 'Equipado';
  return null;
}

function normalizeEvent(event: Event): NormalizedEvent | null {
  if (event === 'B') return 'B';   // Supino Only
  if (event === 'SBD') return 'SBD'; // Total
  return null; // Não existe fórmula GL separada para S ou D isolados
}

// ----------------------
// Cálculo base
// ----------------------
function calculateGLPoints(
  totalKg: number,
  bodyweightKg: number,
  sex: NormalizedSex,
  equip: NormalizedEquip,
  event: NormalizedEvent
): number {
  if (!isFinite(totalKg) || !isFinite(bodyweightKg) || bodyweightKg < 35) return 0;

  const { a, b, c } = PARAMETERS[sex][equip][event];
  const denom = a - b * Math.exp(-c * bodyweightKg);
  if (denom === 0) return 0;

  return Math.round(((totalKg * 100) / denom) * 100) / 100; // 2 casas
}

// ----------------------
// API Pública
// ----------------------
export function calculateIPFGLPoints(
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment,
  event: Event = 'SBD'
): number {
  const normSex = normalizeSex(sex);
  const normEquip = normalizeEquipment(equipment);
  const normEvent = normalizeEvent(event);

  if (!normSex || !normEquip || !normEvent) return 0;
  return calculateGLPoints(totalKg, bodyweightKg, normSex, normEquip, normEvent);
}

// Helpers específicos
export const calculateIPFGLPointsTotal = (
  squatKg: number,
  benchKg: number,
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number =>
  calculateIPFGLPoints(squatKg + benchKg + deadliftKg, bodyweightKg, sex, equipment, 'SBD');

export const calculateIPFGLPointsBench = (
  benchKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number =>
  calculateIPFGLPoints(benchKg, bodyweightKg, sex, equipment, 'B');

export const calculateIPFGLPointsSquat = (
  squatKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number =>
  calculateIPFGLPoints(squatKg, bodyweightKg, sex, equipment, 'S');

export const calculateIPFGLPointsDeadlift = (
  deadliftKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): number =>
  calculateIPFGLPoints(deadliftKg, bodyweightKg, sex, equipment, 'D');

// ----------------------
// Validação
// ----------------------
export function validateParameters(
  totalKg: number,
  bodyweightKg: number,
  sex: Sex,
  equipment: Equipment
): boolean {
  return (
    totalKg > 0 &&
    bodyweightKg >= 35 &&
    normalizeSex(sex) !== null &&
    normalizeEquipment(equipment) !== null
  );
}
