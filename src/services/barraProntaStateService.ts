import { store, persistor } from '../store/barraProntaStore';
import { RootState } from '../store/barraProntaStore';

/**
 * Serviço para gerenciar a persistência do estado do Barra Pronta
 */
export const barraProntaStateService = {
  /**
   * Força o salvamento do estado atual no localStorage
   */
  forceSaveState: () => {
    try {
      const state = store.getState();
      const stateToSave = {
        meet: state.meet,
        registration: state.registration,
        lifting: state.lifting,
        lastSaved: new Date().toISOString()
      };
      
      // Salvar no localStorage diretamente
      localStorage.setItem('barra-pronta-state', JSON.stringify(stateToSave));
      
      // Forçar o Redux Persist a salvar
      persistor.flush();
      
      console.log('💾 [BARRA PRONTA] Estado salvo com sucesso:', {
        meetName: state.meet.name,
        entriesCount: state.registration.entries.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [BARRA PRONTA] Erro ao salvar estado:', error);
    }
  },

  /**
   * Força a restauração do estado do localStorage
   */
  forceRestoreState: () => {
    try {
      const savedState = localStorage.getItem('barra-pronta-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('🔄 [BARRA PRONTA] Estado restaurado:', {
          meetName: parsedState.meet?.name,
          entriesCount: parsedState.registration?.entries?.length,
          lastSaved: parsedState.lastSaved
        });
        return parsedState;
      }
    } catch (error) {
      console.error('❌ [BARRA PRONTA] Erro ao restaurar estado:', error);
    }
    return null;
  },

  /**
   * Verifica se há uma competição ativa
   */
  hasActiveMeet: (): boolean => {
    try {
      const state = store.getState();
      return !!(state.meet.name && state.meet.name.trim() !== '');
    } catch (error) {
      console.error('❌ [BARRA PRONTA] Erro ao verificar competição ativa:', error);
      return false;
    }
  },

  /**
   * Obtém informações da competição ativa
   */
  getActiveMeetInfo: () => {
    try {
      const state = store.getState();
      if (state.meet.name && state.meet.name.trim() !== '') {
        return {
          name: state.meet.name,
          date: state.meet.date,
          city: state.meet.city,
          state: state.meet.state,
          totalEntries: state.registration.entries.length,
          lastSaved: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('❌ [BARRA PRONTA] Erro ao obter informações da competição:', error);
      return null;
    }
  },

  /**
   * Salva o estado antes de sair da página
   */
  saveBeforeUnload: () => {
    // Adicionar listener para salvar antes de sair da página
    const handleBeforeUnload = () => {
      if (barraProntaStateService.hasActiveMeet()) {
        barraProntaStateService.forceSaveState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Retornar função para remover o listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  },

  /**
   * Configura o salvamento automático do estado
   */
  setupAutoSave: (intervalMs: number = 30000) => { // 30 segundos por padrão
    const interval = setInterval(() => {
      if (barraProntaStateService.hasActiveMeet()) {
        barraProntaStateService.forceSaveState();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
};
