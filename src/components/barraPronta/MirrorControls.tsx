import React, { useState } from 'react';
import { Button, ButtonGroup, Badge, Dropdown } from 'react-bootstrap';
import { FaExternalLinkAlt, FaTimes, FaSync, FaDesktop } from 'react-icons/fa';

interface MirrorControlsProps {
  className?: string;
}

const MirrorControls: React.FC<MirrorControlsProps> = ({ className = '' }) => {
  const [activeMirrors, setActiveMirrors] = useState<Set<string>>(new Set());

  // Função para abrir janela espelhada
  const handleOpenMirror = (type: string) => {
    const currentUrl = window.location.href;
    const windowName = `${type}-mirror`;
    
    // Abrir janela
    const mirrorWindow = window.open(
      currentUrl,
      windowName,
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (mirrorWindow) {
      // Adicionar ao conjunto de espelhos ativos
      setActiveMirrors(prev => {
        const newSet = new Set(prev);
        newSet.add(type);
        return newSet;
      });
      
      // Enviar mensagem para a janela espelhada indicando o tipo
      setTimeout(() => {
        mirrorWindow.postMessage({ type: 'mirror-type', mirrorType: type }, '*');
      }, 1000);

      // Monitorar se a janela foi fechada
      const checkClosed = setInterval(() => {
        if (mirrorWindow.closed) {
          setActiveMirrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
          });
          clearInterval(checkClosed);
        }
      }, 1000);
    }
  };

  // Função para fechar janela espelhada
  const handleCloseMirror = (type: string) => {
    const windowName = `${type}-mirror`;
    const mirrorWindow = window.open('', windowName);
    if (mirrorWindow) {
      mirrorWindow.close();
    }
    setActiveMirrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
  };

  // Função para abrir todos os espelhos
  const handleOpenAllMirrors = () => {
    const mirrorTypes = ['results', 'lifting-table', 'left-card'];
    mirrorTypes.forEach(type => {
      if (!activeMirrors.has(type)) {
        handleOpenMirror(type);
      }
    });
  };

  // Função para fechar todos os espelhos
  const handleCloseAllMirrors = () => {
    const mirrorTypes = ['results', 'lifting-table', 'left-card'];
    mirrorTypes.forEach(type => {
      if (activeMirrors.has(type)) {
        handleCloseMirror(type);
      }
    });
  };

  const mirrorTypes = [
    { key: 'results', label: 'Resultados', icon: '📊' },
    { key: 'lifting-table', label: 'Tabela de Levantamentos', icon: '🏋️' },
    { key: 'left-card', label: 'Painel do Atleta', icon: '👤' }
  ];

  return (
    <div className={`mirror-controls ${className}`}>
      <div className="d-flex align-items-center gap-2">
        <FaDesktop className="text-primary" />
        <span className="fw-bold text-primary">Espelhamento:</span>
        
        <ButtonGroup size="sm">
          {mirrorTypes.map(({ key, label, icon }) => (
            <Button
              key={key}
              variant={activeMirrors.has(key) ? "success" : "outline-primary"}
              onClick={() => 
                activeMirrors.has(key) 
                  ? handleCloseMirror(key) 
                  : handleOpenMirror(key)
              }
              className="d-flex align-items-center gap-1"
            >
              {activeMirrors.has(key) ? (
                <>
                  <FaTimes className="me-1" />
                  <span className="d-none d-md-inline">{label}</span>
                </>
              ) : (
                <>
                  <FaExternalLinkAlt className="me-1" />
                  <span className="d-none d-md-inline">{label}</span>
                </>
              )}
              <span className="d-md-none">{icon}</span>
            </Button>
          ))}
        </ButtonGroup>

        {/* Botões de controle geral */}
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            <FaSync className="me-1" />
            Controle Geral
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleOpenAllMirrors}>
              <FaExternalLinkAlt className="me-2" />
              Abrir Todos
            </Dropdown.Item>
            <Dropdown.Item onClick={handleCloseAllMirrors}>
              <FaTimes className="me-2" />
              Fechar Todos
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Indicador de status */}
        {activeMirrors.size > 0 && (
          <Badge bg="success" className="d-flex align-items-center gap-1">
            <FaSync className="me-1" />
            {activeMirrors.size} Ativo{activeMirrors.size > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default MirrorControls;
