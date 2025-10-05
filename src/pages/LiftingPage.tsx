import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/barraProntaStore';
import { getLiftingOrder } from '../logic/liftingOrder';

import LeftCardMirror from '../components/barraPronta/LeftCardMirror';
import LiftingTableMirror from '../components/barraPronta/LiftingTableMirror';
import LiftingFooter from '../components/barraPronta/LiftingFooter';
import FloatingLiftingWindow from '../components/barraPronta/FloatingLiftingWindow';
import './LiftingPage.css';

const LiftingPage: React.FC = () => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);
  
  // Debug: mostrar estado atual
  console.log('🔍 LiftingPage - Estado atual:', { 
    day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt
  });
  console.log('🔍 LiftingPage - Total de atletas:', entries.length);
  
  // Estado para controlar a janela flutuante
  const [isFloatingWindowOpen, setIsFloatingWindowOpen] = useState(false);

  // Filtrar atletas pelo dia, plataforma e grupo atual
  const entriesInFlight = entries.filter((entry: any) => 
    entry.day === day && 
    entry.platform === platform && 
    entry.flight === flight
  );

  console.log('🔍 LiftingPage - Atletas filtrados:', entriesInFlight.length, { day, platform, flight });

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingPage - Estado mudou, atualizando...', {
      day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt,
      totalEntries: entries.length,
      filteredEntries: entriesInFlight.length
    });
  }, [day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, entries, entriesInFlight]);

  // Obter a ordem de levantamentos
  const liftingOrder = getLiftingOrder(entriesInFlight, {
    day,
    platform,
    flight,
    lift,
    attemptOneIndexed,
    overrideEntryId: null,
    overrideAttempt: null,
    selectedEntryId: selectedEntryId,
    selectedAttempt: selectedAttempt,
    isAttemptActive: false
  } as any);

  // CORREÇÃO: Sincronizar currentEntryId com attemptOneIndexed quando necessário
  useEffect(() => {
    console.log('🔄 LiftingPage - Sincronizando liftingOrder:', {
      currentEntryId: liftingOrder.currentEntryId,
      nextEntryId: liftingOrder.nextEntryId,
      attemptOneIndexed: liftingOrder.attemptOneIndexed,
      selectedEntryId: selectedEntryId,
      selectedAttempt: selectedAttempt
    });
    
    // DEBUG: Verificar se o próximo atleta está sendo calculado corretamente
    console.log('🔍 LiftingPage - Próximo atleta:', {
      nextEntryId: liftingOrder.nextEntryId,
      selectedEntryId: selectedEntryId,
      currentEntryId: liftingOrder.currentEntryId
    });
    
    if (liftingOrder.currentEntryId !== null) {
      // Atualizar attemptOneIndexed se necessário
      if (liftingOrder.attemptOneIndexed !== attemptOneIndexed) {
        dispatch({ type: 'lifting/setAttemptOneIndexed', payload: liftingOrder.attemptOneIndexed });
      }
    }
  }, [liftingOrder.currentEntryId, liftingOrder.nextEntryId, liftingOrder.attemptOneIndexed, selectedEntryId, selectedAttempt, attemptOneIndexed, dispatch]);

  // Verificar se há tentativas pendentes
  const hasPendingAttempts = entriesInFlight.some((entry: any) => {
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [];
    return statusArray.some((status: any) => status === 0);
  });

  // Função para abrir diretamente o popup
  const openPopupDirectly = () => {
    try {
      // Calcular posição para o popup
      const popupWidth = 1200;
      const popupHeight = 800;
      const popupX = (window.screen.availWidth - popupWidth) / 2;
      const popupY = (window.screen.availHeight - popupHeight) / 2;

      // Configurações da janela popup
      const popupFeatures = [
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        `left=${popupX}`,
        `top=${popupY}`,
        'resizable=yes',
        'scrollbars=yes',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no',
        'directories=no'
      ].join(',');

      // Abrir a janela popup
      const newWindow = window.open(
        '/lifting-popup', // URL da página popup
        'liftingWindow',
        popupFeatures
      );

      if (newWindow) {
        console.log('🔄 Janela popup aberta com sucesso!');
        newWindow.focus();
      } else {
        console.error('❌ Falha ao abrir janela popup - bloqueado pelo navegador');
        alert('O popup foi bloqueado pelo navegador. Permita popups para este site.');
      }
    } catch (error) {
      console.error('❌ Erro ao abrir janela popup:', error);
      alert('Erro ao abrir janela popup. Verifique as configurações do navegador.');
    }
  };

  return (
    <div className="lifting-page">
      <div className="lifting-container">


        <div className="lifting-content">
          {/* Mensagem se não há atletas para a combinação selecionada */}
          {entriesInFlight.length === 0 ? (
            <div className="no-athletes-message">
              <div className="alert alert-warning text-center">
                <h4>Nenhum atleta encontrado</h4>
                <p>
                  Não há atletas cadastrados para: <strong>Dia {day}, Plataforma {platform}, Grupo {flight}</strong>
                </p>
                <p className="mb-0">
                  Verifique se os atletas foram cadastrados com essas configurações ou selecione outra combinação.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Card da esquerda com informações do atleta atual */}
              <div className="left-panel">
                <LeftCardMirror
                  currentEntryId={selectedEntryId || liftingOrder.currentEntryId}
                  nextEntryId={liftingOrder.nextEntryId}
                  lift={lift}
                  attemptOneIndexed={selectedAttempt || attemptOneIndexed}
                  entries={entriesInFlight}
                />
              </div>

              {/* Tabela principal de levantamentos */}
              <div className="right-panel">
                <LiftingTableMirror
                  orderedEntries={liftingOrder.orderedEntries}
                  currentEntryId={selectedEntryId || liftingOrder.currentEntryId}
                  attemptOneIndexed={selectedAttempt || attemptOneIndexed}
                  onOpenPopup={openPopupDirectly}
                />
              </div>
            </>
          )}
        </div>



      </div>
      
      {/* Footer com controles de levantamento */}
      <LiftingFooter />
      
      {/* Janela flutuante de levantamentos */}
      <FloatingLiftingWindow
        isOpen={isFloatingWindowOpen}
        onClose={() => setIsFloatingWindowOpen(false)}
      />
    </div>
  );
};

export default LiftingPage;
