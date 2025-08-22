// Tipos base do sistema Barra Pronta (baseados no OpenLifter)

export type Language = 'en' | 'pt';

export type Formula = 'IPF' | 'Wilks' | 'Dots' | 'Glossbrenner' | 'Schwartz' | 'NASA' | 'Reshel';

export type Lift = 'S' | 'B' | 'D';

export type Flight = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export type Plate = {
  readonly weightKg: number;
  readonly color: string;
  readonly diameterMm: number;
};

export type AgeCoefficients = {
  readonly men: ReadonlyArray<{ readonly age: number; readonly coefficient: number }>;
  readonly women: ReadonlyArray<{ readonly age: number; readonly coefficient: number }>;
};

export type Entry = {
  readonly id: number;
  readonly name: string;
  readonly sex: 'M' | 'F';
  readonly age: number;
  readonly division: string;
  readonly weightClassKg: number;
  readonly equipment: string;
  readonly squat1: number | null;
  readonly squat2: number | null;
  readonly squat3: number | null;
  readonly squat4: number | null;
  readonly bench1: number | null;
  readonly bench2: number | null;
  readonly bench3: number | null;
  readonly bench4: number | null;
  readonly deadlift1: number | null;
  readonly deadlift2: number | null;
  readonly deadlift3: number | null;
  readonly deadlift4: number | null;
  readonly bodyweightKg: number | null;
  readonly lotNumber: number | null;
  readonly platform: number | null;
  readonly flight: Flight | null;
  readonly day: number | null;
  readonly sessionNumber: number | null;
  readonly team: string;
  readonly country: string;
  readonly state: string;
  readonly tested: boolean;
  readonly notes: string;
};

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

export type LiftingState = {
  readonly day: number;
  readonly platform: number;
  readonly flight: Flight;
  readonly lift: Lift;
  readonly overrideAttempt: number | null;
  readonly overrideEntryId: number | null;
  readonly columnDivisionWidthPx: number;
};

export type GlobalState = {
  readonly versions: VersionsState;
  readonly language: Language;
  readonly meet: MeetState;
  readonly registration: RegistrationState;
  readonly lifting: LiftingState;
  _persist?: {
    version: number;
    rehydrated: boolean;
  };
};

// Tipos de ações
export type ActionTypes = 
  | 'OVERWRITE_STORE'
  | 'SET_LANGUAGE'
  | 'UPDATE_MEET'
  | 'ADD_ENTRY'
  | 'UPDATE_ENTRY'
  | 'DELETE_ENTRY'
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

export type Action = 
  | OverwriteStoreAction
  | SetLanguageAction
  | UpdateMeetAction
  | AddEntryAction
  | UpdateEntryAction
  | DeleteEntryAction
  | SetLiftingStateAction;
