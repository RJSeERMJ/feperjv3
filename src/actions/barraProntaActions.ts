import { saveAs } from 'file-saver';
import { BARRA_PRONTA_CONSTANTS } from '../constants/barraPronta';
import type { GlobalState, Language } from '../types/barraProntaTypes';

// Action para sobrescrever todo o store
export const overwriteStore = (store: GlobalState) => {
  return {
    type: 'OVERWRITE_STORE' as const,
    store
  };
};

// Action para definir idioma
export const setLanguage = (language: Language) => {
  return {
    type: 'SET_LANGUAGE' as const,
    language
  };
};

// Action para atualizar dados da competição
export const updateMeet = (meet: Partial<GlobalState['meet']>) => {
  return {
    type: 'UPDATE_MEET' as const,
    meet
  };
};

// Action para adicionar entrada
export const addEntry = (entry: any) => {
  return {
    type: 'ADD_ENTRY' as const,
    entry
  };
};

// Action para atualizar entrada
export const updateEntry = (id: number, entry: Partial<any>) => {
  return {
    type: 'UPDATE_ENTRY' as const,
    id,
    entry
  };
};

// Action para deletar entrada
export const deleteEntry = (id: number) => {
  return {
    type: 'DELETE_ENTRY' as const,
    id
  };
};

// Action para definir estado de lifting
export const setLiftingState = (lifting: Partial<GlobalState['lifting']>) => {
  return {
    type: 'SET_LIFTING_STATE' as const,
    lifting
  };
};

// Action para criar nova competição
export const createNewMeet = () => {
  return (dispatch: any) => {
    // Resetar para estado inicial usando constantes
    const initialState: GlobalState = {
      versions: BARRA_PRONTA_CONSTANTS.VERSIONS,
      language: BARRA_PRONTA_CONSTANTS.LANGUAGE,
      meet: {
        ...BARRA_PRONTA_CONSTANTS.DEFAULT_MEET,
        plates: BARRA_PRONTA_CONSTANTS.DEFAULT_PLATES
      },
      registration: BARRA_PRONTA_CONSTANTS.DEFAULT_REGISTRATION,
      lifting: BARRA_PRONTA_CONSTANTS.DEFAULT_LIFTING
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
      const state = getState();
      
      // O estado já é o GlobalState diretamente, não precisa de .barraPronta
      const meetData = state;
      
      // Verificar se o estado é válido
      if (!meetData || !meetData.meet) {
        console.error('❌ Estado inválido:', meetData);
        throw new Error('Estado da competição não encontrado');
      }
      
      // Gerar nome do arquivo baseado no nome da competição
      let meetname = meetData.meet.name;
      if (meetname === "") {
        meetname = "competicao-sem-nome";
      }
      meetname = meetname.replace(/ /g, "-");
      
      // Converter estado para JSON e criar blob
      const stateJson = JSON.stringify(meetData, null, 2);
      
      const blob = new Blob([stateJson], { type: "application/json;charset=utf-8" });
      
      // Salvar arquivo usando file-saver
      saveAs(blob, `${meetname}.barrapronta`);
      
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
export const markAttempt = (entryId: number, lift: string, attempt: number, status: number, weight: number) => {
  return {
    type: 'MARK_ATTEMPT' as const,
    entryId,
    lift,
    attempt,
    status,
    weight
  };
};
