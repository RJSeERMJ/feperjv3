import React, { useState, useEffect } from 'react';
import { Badge, Alert } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useWindowMirror } from '../../hooks/useWindowMirror';
import { RootState } from '../../store/barraProntaStore';
import Results from './Results';
import './ResultsMirror.css';

interface ResultsMirrorProps {
  // Props que serão passadas para o componente Results
  [key: string]: any;
}

// Componente que simula o Redux para a janela espelhada
const ResultsWithMirrorState: React.FC<{ mirrorState: any; [key: string]: any }> = ({ mirrorState, ...props }) => {
  // Passar os dados do Redux como props para o componente Results
  return (
    <Results 
      {...props}
      meet={mirrorState.reduxState?.meet}
      registration={mirrorState.reduxState?.registration}
    />
  );
};

const ResultsMirror: React.FC<ResultsMirrorProps> = (props) => {
  const [mirrorState, setMirrorState] = useState<any>(null);

  // Obter dados do Redux para sincronização
  const { meet, registration } = useSelector((state: RootState) => state);

  const {
    isMirrorWindow,
    isMainWindow,
    isConnected,
    sendToMirror
  } = useWindowMirror({
    channelName: 'results-mirror-channel',
    windowName: 'results-mirror',
    onMessage: (data) => {
      console.log('🔄 ResultsMirror - Dados recebidos:', data);
      setMirrorState(data);
    },
    onConnectionChange: (connected) => {
      console.log('🔗 ResultsMirror - Conexão mudou:', connected);
    }
  });

  // Sincronizar estado quando props ou dados do Redux mudarem (apenas na janela principal)
  useEffect(() => {
    if (isMainWindow && isConnected) {
      // Debounce para evitar muitas mensagens em sequência
      const timeoutId = setTimeout(() => {
        const syncData = {
          props,
          reduxState: { meet, registration },
          timestamp: Date.now()
        };
        console.log('📤 Enviando estado para espelho (Results):', syncData);
        sendToMirror(syncData);
      }, 100); // 100ms de debounce

      return () => clearTimeout(timeoutId);
    }
  }, [props, meet, registration, isMainWindow, isConnected, sendToMirror]);

  // Sincronizar estado recebido (apenas na janela espelhada)
  useEffect(() => {
    if (isMirrorWindow && mirrorState) {
      console.log('🔄 Aplicando estado espelhado:', mirrorState);
    }
  }, [isMirrorWindow, mirrorState]);

  // Funções de controle de espelhamento removidas - agora controladas pelo MirrorControls central

  // Renderizar apenas o conteúdo na janela principal (sem botões de controle)
  if (isMainWindow) {
    return (
      <div className="results-mirror-container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            📊 Resultados da Competição
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
            <strong>Janela espelhada ativa!</strong> As mudanças nesta tela aparecerão automaticamente na janela separada.
          </Alert>
        )}
        
        <Results {...props} />
      </div>
    );
  }

  // Renderizar apenas o conteúdo na janela espelhada
  if (isMirrorWindow) {
    return (
      <div className="results-mirror-container mirror-window">
        
        {mirrorState ? (
          <ResultsWithMirrorState 
            mirrorState={mirrorState} 
            {...mirrorState.props} 
          />
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
  return <Results {...props} />;
};

export default ResultsMirror;
