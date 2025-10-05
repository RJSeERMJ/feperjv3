import React, { useState, useEffect } from 'react';
import { Badge, Alert } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import { useWindowMirror } from '../../hooks/useWindowMirror';
import { Lift } from '../../types/barraProntaTypes';
import LeftCard from './LeftCard';
import './LeftCardMirror.css';

interface LeftCardMirrorProps {
  currentEntryId: number | null;
  nextEntryId: number | null;
  lift: Lift;
  attemptOneIndexed: number;
  entries: any[];
}

const LeftCardMirror: React.FC<LeftCardMirrorProps> = (props) => {
  const [mirrorState, setMirrorState] = useState<any>(null);

  const {
    isMirrorWindow,
    isMainWindow,
    isConnected,
    sendToMirror
  } = useWindowMirror({
    channelName: 'leftcard-mirror-channel',
    windowName: 'leftcard-mirror',
    onMessage: (data) => {
      console.log('🔄 LeftCardMirror - Dados recebidos:', data);
      setMirrorState(data);
    },
    onConnectionChange: (connected) => {
      console.log('🔗 LeftCardMirror - Conexão mudou:', connected);
    }
  });

  // Sincronizar estado quando props mudarem (apenas na janela principal)
  useEffect(() => {
    if (isMainWindow && isConnected) {
      const syncData = {
        props,
        timestamp: Date.now()
      };
      sendToMirror(syncData);
    }
  }, [props, isMainWindow, isConnected, sendToMirror]);

  // Sincronizar estado recebido (apenas na janela espelhada)
  useEffect(() => {
    if (isMirrorWindow && mirrorState) {
      console.log('🔄 Aplicando estado espelhado do LeftCard:', mirrorState);
    }
  }, [isMirrorWindow, mirrorState]);

  // Funções de controle de espelhamento removidas - agora controladas pelo MirrorControls central

  // Renderizar apenas o conteúdo na janela principal (sem botões de controle)
  if (isMainWindow) {
    return (
      <div className="leftcard-mirror-container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            👤 Painel do Atleta
            {isConnected && (
              <Badge bg="success" className="ms-2">
                <FaSync className="me-1" />
                Espelhado
              </Badge>
            )}
          </h5>
        </div>
        
        {isConnected && (
          <Alert variant="info" className="mb-3">
            <FaSync className="me-2" />
            <strong>Painel espelhado ativo!</strong> As mudanças no atleta atual aparecerão automaticamente na janela separada.
          </Alert>
        )}
        
        <LeftCard {...props} />
      </div>
    );
  }

  // Renderizar apenas o conteúdo na janela espelhada
  if (isMirrorWindow) {
    return (
      <div className="leftcard-mirror-container mirror-window">
        {mirrorState ? (
          <LeftCard {...mirrorState.props} />
        ) : (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3 text-muted">Aguardando dados da tela principal...</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback - renderizar normalmente se não conseguir determinar o tipo de janela
  return <LeftCard {...props} />;
};

export default LeftCardMirror;
