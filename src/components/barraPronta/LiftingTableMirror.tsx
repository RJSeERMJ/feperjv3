import React, { useState, useEffect } from 'react';
import { Button, Badge, Alert } from 'react-bootstrap';
import { FaExternalLinkAlt, FaTimes, FaSync } from 'react-icons/fa';
import { useWindowMirror } from '../../hooks/useWindowMirror';
import LiftingTable from './LiftingTable';
import './LiftingTableMirror.css';

interface LiftingTableMirrorProps {
  orderedEntries: any[];
  currentEntryId: number | null;
  attemptOneIndexed: number;
  onOpenPopup?: () => void;
}

const LiftingTableMirror: React.FC<LiftingTableMirrorProps> = (props) => {
  const [mirrorState, setMirrorState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isMirrorWindow,
    isMainWindow,
    isConnected,
    openMirrorWindow,
    closeMirrorWindow,
    sendToMirror
  } = useWindowMirror({
    channelName: 'lifting-mirror-channel',
    windowName: 'lifting-mirror',
    onMessage: (data) => {
      console.log('🔄 LiftingTableMirror - Dados recebidos:', data);
      setMirrorState(data);
    },
    onConnectionChange: (connected) => {
      console.log('🔗 LiftingTableMirror - Conexão mudou:', connected);
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
      console.log('🔄 Aplicando estado espelhado:', mirrorState);
    }
  }, [isMirrorWindow, mirrorState]);

  // Função para abrir janela espelhada
  const handleOpenMirror = () => {
    setIsLoading(true);
    const currentUrl = window.location.href;
    openMirrorWindow(currentUrl, 'lifting-mirror');
    
    // Simular loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Função para fechar janela espelhada
  const handleCloseMirror = () => {
    closeMirrorWindow();
  };

  // Renderizar botão de controle apenas na janela principal
  if (isMainWindow) {
    return (
      <div className="lifting-mirror-container">
        <div className="mirror-controls">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              🏋️ Tabela de Levantamentos
              {isConnected && (
                <Badge bg="success" className="ms-2">
                  <FaSync className="me-1" />
                  Espelhado
                </Badge>
              )}
            </h5>
            <div className="mirror-actions">
              {!isConnected ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleOpenMirror}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Abrindo...
                    </>
                  ) : (
                    <>
                      <FaExternalLinkAlt className="me-1" />
                      Abrir em Janela Separada
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleCloseMirror}
                >
                  <FaTimes className="me-1" />
                  Fechar Janela Espelhada
                </Button>
              )}
            </div>
          </div>
          
          {isConnected && (
            <Alert variant="info" className="mb-3">
              <FaSync className="me-2" />
              <strong>Janela espelhada ativa!</strong> As mudanças nesta tela aparecerão automaticamente na janela separada.
            </Alert>
          )}
        </div>
        
        <LiftingTable {...props} />
      </div>
    );
  }

  // Renderizar apenas o conteúdo na janela espelhada
  if (isMirrorWindow) {
    return (
      <div className="lifting-mirror-container mirror-window">
        <div className="mirror-header">
          <div className="text-center mb-3">
            <h4 className="mb-0 text-primary">
              🏋️ Tabela de Levantamentos - Monitor Externo
              <Badge bg="info" className="ms-2">
                Espelhado
              </Badge>
            </h4>
          </div>
          
        </div>
        
        {mirrorState ? (
          <LiftingTable {...mirrorState.props} />
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
  return <LiftingTable {...props} />;
};

export default LiftingTableMirror;
