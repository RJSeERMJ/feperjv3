// Tipos base do sistema Barra Pronta (baseados no OpenLifter)

export type Language = 'en' | 'pt';

export type Formula = 'IPF GL Points' | 'IPF' | 'Wilks' | 'Dots' | 'Glossbrenner' | 'Schwartz' | 'NASA' | 'Reshel';

export type Lift = 'S' | 'B' | 'D'; // Squat, Bench, Deadlift
export type LiftStatus = 0 | 1 | 2 | 3; // 0: Pendente, 1: Good Lift, 2: No Lift, 3: DNS

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
  bodyweightKg?: number | null;
  lotNumber?: number | null;
  
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
  | 'SET_LIFTING_STATE';

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

export type Action = 
  | OverwriteStoreAction
  | SetLanguageAction
  | UpdateMeetAction
  | AddEntryAction
  | UpdateEntryAction
  | DeleteEntryAction
  | MarkAttemptAction
  | SetLiftingStateAction;
