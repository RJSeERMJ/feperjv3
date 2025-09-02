// Constantes do sistema Barra Pronta
export const BARRA_PRONTA_CONSTANTS = {
  // Configurações padrão da competição
  DEFAULT_MEET: {
    name: '',
    country: 'Brasil',
    state: 'RJ',
    city: '',
    federation: 'FEPERJ',
    date: '',
    lengthDays: 1,
    platformsOnDays: [1],
    allowedMovements: [],
    ageCoefficients: {
      men: [],
      women: []
    },
    divisions: ['Open'],
    weightClassesKgMen: [59, 66, 74, 83, 93, 105, 120, 999],
    weightClassesKgWomen: [47, 52, 57, 63, 69, 76, 84, 999],
    weightClassesKgMx: [],
    formula: 'IPF GL Points' as const,
    combineSleevesAndWraps: false,
    combineSingleAndMulti: false,
    allow4thAttempts: false,
    roundTotalsDown: false,
    inKg: true,
    squatBarAndCollarsWeightKg: 20,
    benchBarAndCollarsWeightKg: 20,
    deadliftBarAndCollarsWeightKg: 20,
    showAlternateUnits: false
  },

  // Configurações padrão das anilhas
  DEFAULT_PLATES: [
    { weightKg: 25, pairCount: 10, color: '#FF0000' },
    { weightKg: 20, pairCount: 10, color: '#0000FF' },
    { weightKg: 15, pairCount: 10, color: '#FFFF00' },
    { weightKg: 10, pairCount: 10, color: '#00FF00' },
    { weightKg: 5, pairCount: 10, color: '#FF8000' },
    { weightKg: 2.5, pairCount: 10, color: '#800080' },
    { weightKg: 1.25, pairCount: 10, color: '#FFC0CB' },
    { weightKg: 1, pairCount: 10, color: '#FFFFFF' },
    { weightKg: 0.5, pairCount: 10, color: '#808080' },
    { weightKg: 0.25, pairCount: 10, color: '#000000' }
  ],

  // Estados padrão do lifting
  DEFAULT_LIFTING: {
    day: 1,
    platform: 1,
    flight: 'A' as const,
    lift: 'S' as const,
    attemptOneIndexed: 1,
    overrideAttempt: null,
    overrideEntryId: null,
    selectedEntryId: null,
    selectedAttempt: 1,
    isAttemptActive: false,
    attemptTimers: new Map()
  },

  // Estados padrão do registro
  DEFAULT_REGISTRATION: {
    nextEntryId: 1,
    entries: [],
    lookup: {}
  },

  // Versões do sistema
  VERSIONS: {
    stateVersion: '1.0',
    releaseVersion: '1.0'
  },

  // Configurações de idioma
  LANGUAGE: 'pt' as const,

  // Valores para representar "acima de"
  WEIGHT_CLASS_ABOVE: 999,

  // Nomes dos movimentos
  MOVEMENTS: {
    SQUAT: 'S',
    BENCH: 'B',
    DEADLIFT: 'D',
    ALL: 'AST'
  } as const,

  // Status das tentativas
  ATTEMPT_STATUS: {
    PENDING: 0,
    GOOD_LIFT: 1,
    NO_LIFT: 2,
    NO_ATTEMPT: 3
  } as const,

  // Configurações de timer
  TIMER: {
    DEFAULT_DURATION: 60000, // 60 segundos em ms
    WARNING_THRESHOLD: 10000 // 10 segundos antes do fim
  }
} as const;

// Tipos derivados das constantes
export type MovementType = typeof BARRA_PRONTA_CONSTANTS.MOVEMENTS[keyof typeof BARRA_PRONTA_CONSTANTS.MOVEMENTS];
export type AttemptStatus = typeof BARRA_PRONTA_CONSTANTS.ATTEMPT_STATUS[keyof typeof BARRA_PRONTA_CONSTANTS.ATTEMPT_STATUS];
