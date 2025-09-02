// Tipos base do sistema Barra Pronta (baseados no OpenLifter)

export type Language = 'en' | 'pt';

export type Formula = 'IPF GL Points' | 'IPF' | 'Wilks' | 'Dots' | 'Glossbrenner' | 'Schwartz' | 'NASA' | 'Reshel';

export type Lift = 'S' | 'B' | 'D'; // Squat, Bench, Deadlift
export type LiftStatus = 0 | 1 | 2 | 3; // 0: Pendente, 1: Good Lift, 2: No Lift, 3: No Attempt

export type Flight = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export interface Plate {
  weightKg: number;
  pairCount: number;
  color: string; // Código hexadecimal da cor
}

export interface LoadedPlate {
  weightAny: number;
  isAlreadyLoaded: boolean;
  color: string;
}

export interface LiftingState {
  day: number;
  platform: number;
  flight: string;
  lift: Lift;
  attemptOneIndexed: number;
  overrideEntryId: number | null;
  overrideAttempt: number | null;
  selectedEntryId: number | null; // ID do atleta selecionado
  selectedAttempt: number; // Tentativa selecionada (1, 2 ou 3)
  isAttemptActive: boolean; // Se a tentativa está ativa para marcação
  attemptTimers: Map<string, { startTime: number; isActive: boolean }>; // Timer para controle de tempo
}

export interface LiftingOrder {
  attemptOneIndexed: number;
  orderedEntries: Entry[];
  currentEntryId: number | null;
  nextEntryId: number | null;
  nextAttemptOneIndexed: number | null;
}

export type AgeCoefficients = {
  readonly men: ReadonlyArray<{ readonly age: number; readonly coefficient: number }>;
  readonly women: ReadonlyArray<{ readonly age: number; readonly coefficient: number }>;
};

export interface Entry {
  id: number;
  name: string;
  sex: 'M' | 'F';
  birthDate: string;
  age: number;
  weightClass: string;
  weightClassKg?: number;
  team: string;
  day: number;
  platform: number;
  flight: string;
  movements: string;
  
  // Campos adicionais para competição
  division?: string;
  equipment?: string;
  country?: string;
  state?: string;
  notes?: string;
  tipoAtleta?: 'NORMAL' | 'CONVIDADO';
  bodyweightKg?: number | null;
  lotNumber?: number | null;
  cpf?: string; // CPF do atleta para unificação
  
  // Alturas dos racks
  squatHeight: string | null;
  benchHeight: string | null;
  
  // Tentativas
  squat1: number | null;
  squat2: number | null;
  squat3: number | null;
  bench1: number | null;
  bench2: number | null;
  bench3: number | null;
  deadlift1: number | null;
  deadlift2: number | null;
  deadlift3: number | null;
  
  // Status das tentativas
  squatStatus: LiftStatus[];
  benchStatus: LiftStatus[];
  deadliftStatus: LiftStatus[];
  
  tested: boolean;
  sessionNumber: number | null;
}

// Estados do Redux
export type VersionsState = {
  readonly stateVersion: string;
  readonly releaseVersion: string;
};

export type MeetState = {
  readonly name: string;
  readonly country: string;
  readonly state: string;
  readonly city: string;
  readonly federation: string;
  readonly date: string;
  readonly lengthDays: number;
  readonly platformsOnDays: ReadonlyArray<number>;
  readonly allowedMovements: ReadonlyArray<string>; // ['A', 'S', 'T', 'AS', 'AT', 'ST', 'AST']
  readonly ageCoefficients: AgeCoefficients;
  readonly divisions: ReadonlyArray<string>;
  readonly weightClassesKgMen: ReadonlyArray<number>;
  readonly weightClassesKgWomen: ReadonlyArray<number>;
  readonly weightClassesKgMx: ReadonlyArray<number>;
  readonly formula: Formula;
  readonly combineSleevesAndWraps: boolean;
  readonly combineSingleAndMulti: boolean;
  readonly allow4thAttempts: boolean;
  readonly roundTotalsDown: boolean;
  readonly inKg: boolean;
  readonly squatBarAndCollarsWeightKg: number;
  readonly benchBarAndCollarsWeightKg: number;
  readonly deadliftBarAndCollarsWeightKg: number;
  readonly plates: ReadonlyArray<Readonly<Plate>>;
  readonly showAlternateUnits: boolean;
};

export type RegistrationState = {
  readonly nextEntryId: number;
  readonly entries: ReadonlyArray<Readonly<Entry>>;
  readonly lookup: {
    readonly [id: number]: number;
  };
};

export interface GlobalState {
  versions: {
    stateVersion: string;
    releaseVersion: string;
  };
  language: Language;
  meet: MeetState;
  registration: RegistrationState;
  lifting: LiftingState;
}

// Tipos de ações
export type ActionTypes = 
  | 'OVERWRITE_STORE'
  | 'SET_LANGUAGE'
  | 'UPDATE_MEET'
  | 'ADD_ENTRY'
  | 'UPDATE_ENTRY'
  | 'DELETE_ENTRY'
  | 'MARK_ATTEMPT'
  | 'SET_LIFTING_STATE'
  | 'lifting/setDay'
  | 'lifting/setPlatform'
  | 'lifting/setFlight'
  | 'lifting/setLift'
  | 'lifting/setAttemptOneIndexed'
  | 'lifting/setOverrideEntryId'
  | 'lifting/setOverrideAttempt'
  | 'lifting/setSelectedEntryId'
  | 'lifting/setSelectedAttempt'
  | 'lifting/setAttemptActive'
  | 'lifting/selectAthleteAndAttempt'
  | 'lifting/resetLifting'
  | 'lifting/nextLift'
  | 'lifting/previousLift';

export type OverwriteStoreAction = {
  type: 'OVERWRITE_STORE';
  store: GlobalState;
};

export type SetLanguageAction = {
  type: 'SET_LANGUAGE';
  language: Language;
};

export type UpdateMeetAction = {
  type: 'UPDATE_MEET';
  meet: Partial<MeetState>;
};

export type AddEntryAction = {
  type: 'ADD_ENTRY';
  entry: Entry;
};

export type UpdateEntryAction = {
  type: 'UPDATE_ENTRY';
  id: number;
  entry: Partial<Entry>;
};

export type DeleteEntryAction = {
  type: 'DELETE_ENTRY';
  id: number;
};

export type SetLiftingStateAction = {
  type: 'SET_LIFTING_STATE';
  lifting: Partial<LiftingState>;
};

export type MarkAttemptAction = {
  type: 'MARK_ATTEMPT';
  entryId: number;
  lift: Lift;
  attempt: number;
  status: LiftStatus;
  weight: number;
};

// Ações do liftingReducer
export type SetDayAction = {
  type: 'lifting/setDay';
  payload: number;
};

export type SetPlatformAction = {
  type: 'lifting/setPlatform';
  payload: number;
};

export type SetFlightAction = {
  type: 'lifting/setFlight';
  payload: string;
};

export type SetLiftAction = {
  type: 'lifting/setLift';
  payload: Lift;
};

export type SetAttemptOneIndexedAction = {
  type: 'lifting/setAttemptOneIndexed';
  payload: number;
};

export type SetOverrideEntryIdAction = {
  type: 'lifting/setOverrideEntryId';
  payload: number | null;
};

export type SetOverrideAttemptAction = {
  type: 'lifting/setOverrideAttempt';
  payload: number | null;
};

export type SetSelectedEntryIdAction = {
  type: 'lifting/setSelectedEntryId';
  payload: number | null;
};

export type SetSelectedAttemptAction = {
  type: 'lifting/setSelectedAttempt';
  payload: number;
};

export type SetAttemptActiveAction = {
  type: 'lifting/setAttemptActive';
  payload: boolean;
};

export type SelectAthleteAndAttemptAction = {
  type: 'lifting/selectAthleteAndAttempt';
  payload: { entryId: number; attempt: number };
};

export type ResetLiftingAction = {
  type: 'lifting/resetLifting';
};

export type NextLiftAction = {
  type: 'lifting/nextLift';
};

export type PreviousLiftAction = {
  type: 'lifting/previousLift';
};

export type Action = 
  | OverwriteStoreAction
  | SetLanguageAction
  | UpdateMeetAction
  | AddEntryAction
  | UpdateEntryAction
  | DeleteEntryAction
  | MarkAttemptAction
  | SetLiftingStateAction
  | SetDayAction
  | SetPlatformAction
  | SetFlightAction
  | SetLiftAction
  | SetAttemptOneIndexedAction
  | SetOverrideEntryIdAction
  | SetOverrideAttemptAction
  | SetSelectedEntryIdAction
  | SetSelectedAttemptAction
  | SetAttemptActiveAction
  | SelectAthleteAndAttemptAction
  | ResetLiftingAction
  | NextLiftAction
  | PreviousLiftAction;
