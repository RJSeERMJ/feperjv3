import { 
  GlobalState, 
  Language, 
  MeetState, 
  Entry, 
  LiftingState,
  Lift,
  LiftStatus,
  MarkAttemptAction,
  OverwriteStoreAction,
  SetLanguageAction,
  UpdateMeetAction,
  AddEntryAction,
  UpdateEntryAction,
  DeleteEntryAction,
  SetLiftingStateAction
} from '../types/barraProntaTypes';
import { saveAs } from 'file-saver';

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
        allowedMovements: [], // Removido: movimentos predefinidos
        ageCoefficients: {
          men: [],
          women: []
        },
        divisions: ['Open'],
        weightClassesKgMen: [59, 66, 74, 83, 93, 105, 120, 120],
        weightClassesKgWomen: [47, 52, 57, 63, 69, 76, 84, 84],
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
        showAlternateUnits: false,
        recognizeRecords: true
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
        attemptOneIndexed: 1,
        overrideAttempt: null,
        overrideEntryId: null,
        selectedEntryId: null,
        selectedAttempt: 1,
        isAttemptActive: false,
        attemptTimers: new Map()
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
    // O estado já é o GlobalState diretamente, não precisa de .barraPronta
    const meetData = state;
    
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

// Action para salvar dados da competição para arquivo
export const saveMeetToFile = () => {
  return (dispatch: any, getState: any) => {
    try {
      console.log('🔍 Iniciando saveMeetToFile...');
      
      const state = getState();
      console.log('📊 Estado completo:', state);
      
      // O estado já é o GlobalState diretamente, não precisa de .barraPronta
      const meetData = state;
      
      // Verificar se o estado é válido
      if (!meetData || !meetData.meet) {
        console.error('❌ Estado inválido:', meetData);
        throw new Error('Estado da competição não encontrado');
      }
      
      console.log('✅ Estado válido encontrado:', meetData.meet);
      
      // Gerar nome do arquivo baseado no nome da competição
      let meetname = meetData.meet.name;
      if (meetname === "") {
        meetname = "competicao-sem-nome";
      }
      meetname = meetname.replace(/ /g, "-");
      
      console.log('📁 Nome do arquivo:', meetname);
      
      // Converter estado para JSON e criar blob
      const stateJson = JSON.stringify(meetData, null, 2);
      console.log('📝 JSON gerado com sucesso, tamanho:', stateJson.length);
      
      const blob = new Blob([stateJson], { type: "application/json;charset=utf-8" });
      console.log('💾 Blob criado com sucesso, tamanho:', blob.size);
      
      // Salvar arquivo usando file-saver
      console.log('🚀 Chamando saveAs...');
      saveAs(blob, `${meetname}.barrapronta`);
      
      console.log('✅ Arquivo salvo com sucesso!');
      return meetData;
    } catch (error) {
      console.error('❌ Erro ao salvar para arquivo:', error);
      throw error; // Re-throw para que o componente possa tratar
    }
  };
};

// Action para carregar dados da competição de arquivo
export const loadMeetFromFile = (file: File) => {
  return (dispatch: any) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event: any) {
        try {
          const obj = JSON.parse(event.target.result);
          
          // Validação básica do arquivo
          if (
            obj.meet === undefined ||
            obj.registration === undefined ||
            obj.lifting === undefined
          ) {
            reject(new Error('Arquivo inválido: formato não reconhecido'));
            return;
          }
          
          // Sobrescrever o store com os dados carregados
          dispatch(overwriteStore(obj));
          resolve(obj);
        } catch (err) {
          reject(new Error('Erro ao processar arquivo: formato inválido'));
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsText(file);
    });
  };
};

// Action para marcar tentativa (Good Lift, No Lift, DNS)
export const markAttempt = (entryId: number, lift: Lift, attempt: number, status: LiftStatus, weight: number): MarkAttemptAction => {
  return {
    type: 'MARK_ATTEMPT',
    entryId,
    lift,
    attempt,
    status,
    weight
  };
};
