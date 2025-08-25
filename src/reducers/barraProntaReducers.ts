import { GlobalState, Action, VersionsState, MeetState, RegistrationState, LiftingState, Language } from '../types/barraProntaTypes';

// Estado inicial
const initialState: GlobalState = {
  meet: {
    name: '',
    country: 'Brasil',
    state: 'RJ',
    city: '',
    federation: 'FEPERJ',
    date: '',
    lengthDays: 1,
    platformsOnDays: [1],
    allowedMovements: [], // Campo vazio para movimentos
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
    attemptOneIndexed: 1,
    overrideEntryId: null,
    overrideAttempt: null,
    selectedEntryId: null,
    selectedAttempt: 1,
    isAttemptActive: false,
    attemptTimers: new Map()
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
    
    case 'MARK_ATTEMPT': {
      const entryIndex = state.lookup[action.entryId];
      if (entryIndex === undefined) return state;
      
      const newEntries = [...state.entries];
      const entry = { ...newEntries[entryIndex] };
      
      // Determinar o campo de peso baseado no movimento
      const liftField = action.lift === 'S' ? 'squat' : action.lift === 'B' ? 'bench' : 'deadlift';
      const weightField = `${liftField}${action.attempt}` as keyof typeof entry;
      
      // Determinar o campo de status
      const statusField = `${liftField}Status` as keyof typeof entry;
      
      // Atualizar peso (negativo se for No Lift)
      const finalWeight = action.status === 2 ? -Math.abs(action.weight) : action.weight;
      (entry as any)[weightField] = finalWeight;
      
      // Atualizar status
      if (!(entry as any)[statusField]) {
        (entry as any)[statusField] = [];
      }
      const statusArray = [...((entry as any)[statusField] as number[])];
      statusArray[action.attempt - 1] = action.status;
      (entry as any)[statusField] = statusArray;
      
      newEntries[entryIndex] = entry;
      
      return {
        ...state,
        entries: newEntries
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
    case 'lifting/setDay':
      return { ...state, day: action.payload };
    case 'lifting/setPlatform':
      return { ...state, platform: action.payload };
    case 'lifting/setFlight':
      return { ...state, flight: action.payload };
    case 'lifting/setLift':
      return { ...state, lift: action.payload, attemptOneIndexed: 1 };
    case 'lifting/setAttemptOneIndexed':
      return { ...state, attemptOneIndexed: action.payload };
    case 'lifting/setOverrideEntryId':
      return { ...state, overrideEntryId: action.payload };
    case 'lifting/setOverrideAttempt':
      return { ...state, overrideAttempt: action.payload };
    case 'lifting/setSelectedEntryId':
      return { ...state, selectedEntryId: action.payload };
    case 'lifting/setSelectedAttempt':
      return { ...state, selectedAttempt: action.payload };
    case 'lifting/setAttemptActive':
      return { ...state, isAttemptActive: action.payload };
    case 'lifting/selectAthleteAndAttempt':
      return { 
        ...state, 
        selectedEntryId: action.payload.entryId, 
        selectedAttempt: action.payload.attempt, 
        isAttemptActive: true 
      };
    case 'lifting/resetLifting':
      return initialState.lifting;
    case 'lifting/nextLift':
      const nextLift = state.lift === 'S' ? 'B' : state.lift === 'B' ? 'D' : 'S';
      return { ...state, lift: nextLift, attemptOneIndexed: 1 };
    case 'lifting/previousLift':
      const prevLift = state.lift === 'S' ? 'D' : state.lift === 'B' ? 'S' : 'B';
      return { ...state, lift: prevLift, attemptOneIndexed: 1 };
    default:
      return state;
  }
};

// Reducer principal
const barraProntaReducer = (state: GlobalState = initialState, action: Action): GlobalState => {
  return {
    meet: meetReducer(state.meet, action),
    registration: registrationReducer(state.registration, action),
    lifting: liftingReducer(state.lifting, action)
  };
};

export default barraProntaReducer;
export { initialState };
