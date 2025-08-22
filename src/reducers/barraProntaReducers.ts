import { GlobalState, Action, VersionsState, MeetState, RegistrationState, LiftingState, Language } from '../types/barraProntaTypes';

// Estado inicial
const initialState: GlobalState = {
  versions: {
    stateVersion: '1.0',
    releaseVersion: '1.0'
  },
  language: 'pt' as Language,
  meet: {
    name: '',
    country: 'Brasil',
    state: 'RJ',
    city: '',
    federation: 'FEPERJ',
    date: '',
    lengthDays: 1,
    platformsOnDays: [1],
    ageCoefficients: {
      men: [],
      women: []
    },
    divisions: ['Open'],
    weightClassesKgMen: [59, 66, 74, 83, 93, 105, 120, 120],
    weightClassesKgWomen: [47, 52, 57, 63, 69, 76, 84, 84],
    weightClassesKgMx: [],
    formula: 'IPF',
    combineSleevesAndWraps: false,
    combineSingleAndMulti: false,
    allow4thAttempts: false,
    roundTotalsDown: false,
    inKg: true,
    squatBarAndCollarsWeightKg: 20,
    benchBarAndCollarsWeightKg: 20,
    deadliftBarAndCollarsWeightKg: 20,
    plates: [
      { weightKg: 25, color: '#FF0000', diameterMm: 450, quantity: 1 },
      { weightKg: 20, color: '#0000FF', diameterMm: 450, quantity: 1 },
      { weightKg: 15, color: '#FFFF00', diameterMm: 450, quantity: 1 },
      { weightKg: 10, color: '#008000', diameterMm: 450, quantity: 1 },
      { weightKg: 5, color: '#000000', diameterMm: 450, quantity: 1 },
      { weightKg: 2.5, color: '#000000', diameterMm: 450, quantity: 1 },
      { weightKg: 1.25, color: '#000000', diameterMm: 450, quantity: 1 },
      { weightKg: 0.5, color: '#000000', diameterMm: 450, quantity: 1 },
      { weightKg: 0.25, color: '#000000', diameterMm: 450, quantity: 1 }
    ],
    showAlternateUnits: false
  },
  registration: {
    nextEntryId: 1,
    entries: [],
    lookup: {}
  },
  lifting: {
    day: 1,
    platform: 1,
    flight: 'A',
    lift: 'S',
    overrideAttempt: null,
    overrideEntryId: null,
    columnDivisionWidthPx: 200
  }
};

// Reducer para versões
const versionsReducer = (state: VersionsState = initialState.versions, action: Action): VersionsState => {
  switch (action.type) {
    case 'OVERWRITE_STORE':
      return action.store.versions;
    default:
      return state;
  }
};

// Reducer para idioma
const languageReducer = (state: Language = initialState.language, action: Action): Language => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return action.language;
    case 'OVERWRITE_STORE':
      return action.store.language;
    default:
      return state;
  }
};

// Reducer para configuração da competição
const meetReducer = (state: MeetState = initialState.meet, action: Action): MeetState => {
  switch (action.type) {
    case 'UPDATE_MEET':
      return { ...state, ...action.meet };
    case 'OVERWRITE_STORE':
      return action.store.meet;
    default:
      return state;
  }
};

// Reducer para inscrições
const registrationReducer = (state: RegistrationState = initialState.registration, action: Action): RegistrationState => {
  switch (action.type) {
    case 'ADD_ENTRY': {
      const newEntries = [...state.entries, action.entry];
      const newLookup = { ...state.lookup };
      newLookup[action.entry.id] = newEntries.length - 1;
      
      return {
        ...state,
        nextEntryId: state.nextEntryId + 1,
        entries: newEntries,
        lookup: newLookup
      };
    }
    
    case 'UPDATE_ENTRY': {
      const entryIndex = state.lookup[action.id];
      if (entryIndex === undefined) return state;
      
      const newEntries = [...state.entries];
      newEntries[entryIndex] = { ...newEntries[entryIndex], ...action.entry };
      
      return {
        ...state,
        entries: newEntries
      };
    }
    
    case 'DELETE_ENTRY': {
      const entryIndex = state.lookup[action.id];
      if (entryIndex === undefined) return state;
      
      const newEntries = state.entries.filter((_, index) => index !== entryIndex);
      const newLookup: { [id: number]: number } = {};
      
      newEntries.forEach((entry, index) => {
        newLookup[entry.id] = index;
      });
      
      return {
        ...state,
        entries: newEntries,
        lookup: newLookup
      };
    }
    
    case 'OVERWRITE_STORE':
      return action.store.registration;
      
    default:
      return state;
  }
};

// Reducer para estado de levantamento
const liftingReducer = (state: LiftingState = initialState.lifting, action: Action): LiftingState => {
  switch (action.type) {
    case 'SET_LIFTING_STATE':
      return { ...state, ...action.lifting };
    case 'OVERWRITE_STORE':
      return action.store.lifting;
    default:
      return state;
  }
};

// Reducer principal
const barraProntaReducer = (state: GlobalState = initialState, action: Action): GlobalState => {
  return {
    versions: versionsReducer(state.versions, action),
    language: languageReducer(state.language, action),
    meet: meetReducer(state.meet, action),
    registration: registrationReducer(state.registration, action),
    lifting: liftingReducer(state.lifting, action)
  };
};

export default barraProntaReducer;
export { initialState };
