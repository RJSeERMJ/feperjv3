import { 
  GlobalState, 
  Language, 
  MeetState, 
  Entry, 
  LiftingState,
  OverwriteStoreAction,
  SetLanguageAction,
  UpdateMeetAction,
  AddEntryAction,
  UpdateEntryAction,
  DeleteEntryAction,
  SetLiftingStateAction
} from '../types/barraProntaTypes';

// Action para sobrescrever todo o store
export const overwriteStore = (store: GlobalState): OverwriteStoreAction => {
  return {
    type: 'OVERWRITE_STORE',
    store: store,
  };
};

// Action para definir idioma
export const setLanguage = (language: Language): SetLanguageAction => {
  return {
    type: 'SET_LANGUAGE',
    language: language,
  };
};

// Action para atualizar configuração da competição
export const updateMeet = (meet: Partial<MeetState>): UpdateMeetAction => {
  return {
    type: 'UPDATE_MEET',
    meet: meet,
  };
};

// Action para adicionar inscrição
export const addEntry = (entry: Entry): AddEntryAction => {
  return {
    type: 'ADD_ENTRY',
    entry: entry,
  };
};

// Action para atualizar inscrição
export const updateEntry = (id: number, entry: Partial<Entry>): UpdateEntryAction => {
  return {
    type: 'UPDATE_ENTRY',
    id: id,
    entry: entry,
  };
};

// Action para deletar inscrição
export const deleteEntry = (id: number): DeleteEntryAction => {
  return {
    type: 'DELETE_ENTRY',
    id: id,
  };
};

// Action para definir estado de levantamento
export const setLiftingState = (lifting: Partial<LiftingState>): SetLiftingStateAction => {
  return {
    type: 'SET_LIFTING_STATE',
    lifting: lifting,
  };
};

// Action creators para operações complexas
export const createNewMeet = () => {
  return (dispatch: any) => {
    // Resetar para estado inicial
    const initialState = {
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
        formula: 'IPF' as const,
        combineSleevesAndWraps: false,
        combineSingleAndMulti: false,
        allow4thAttempts: false,
        roundTotalsDown: false,
        inKg: true,
        squatBarAndCollarsWeightKg: 20,
        benchBarAndCollarsWeightKg: 20,
        deadliftBarAndCollarsWeightKg: 20,
        plates: [
          { weightKg: 25, color: '#000000', diameterMm: 450 },
          { weightKg: 20, color: '#008000', diameterMm: 450 },
          { weightKg: 15, color: '#FFFF00', diameterMm: 450 },
          { weightKg: 10, color: '#FFFFFF', diameterMm: 450 },
          { weightKg: 5, color: '#FF0000', diameterMm: 450 },
          { weightKg: 2.5, color: '#0000FF', diameterMm: 450 },
          { weightKg: 1.25, color: '#FFFFFF', diameterMm: 450 },
          { weightKg: 0.5, color: '#FFD700', diameterMm: 450 }
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
        flight: 'A' as const,
        lift: 'S' as const,
        overrideAttempt: null,
        overrideEntryId: null,
        columnDivisionWidthPx: 200
      }
    };
    
    dispatch(overwriteStore(initialState));
  };
};

// Action para carregar dados de uma competição existente
export const loadMeetData = (meetData: GlobalState) => {
  return (dispatch: any) => {
    dispatch(overwriteStore(meetData));
  };
};

// Action para salvar dados da competição
export const saveMeetData = () => {
  return (dispatch: any, getState: any) => {
    const state = getState();
    const meetData = state.barraPronta;
    
    // Aqui você pode implementar a lógica para salvar no localStorage ou backend
    localStorage.setItem('barra_pronta_meet_data', JSON.stringify(meetData));
    
    return meetData;
  };
};

// Action para carregar dados salvos
export const loadSavedMeetData = () => {
  return (dispatch: any) => {
    const savedData = localStorage.getItem('barra_pronta_meet_data');
    if (savedData) {
      try {
        const meetData = JSON.parse(savedData);
        dispatch(overwriteStore(meetData));
        return meetData;
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
        return null;
      }
    }
    return null;
  };
};
