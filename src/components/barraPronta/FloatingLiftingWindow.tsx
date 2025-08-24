import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { setDay, setPlatform, setFlight, setLift, setAttemptOneIndexed, setSelectedEntryId, setSelectedAttempt, setAttemptActive, selectAthleteAndAttempt } from '../../reducers/liftingReducer';
import { markAttempt } from '../../actions/barraProntaActions';
import { Lift } from '../../types/barraProntaTypes';
import LiftingTable from './LiftingTable';
import './FloatingLiftingWindow.css';

interface FloatingLiftingWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interface para tela múltipla
interface Screen {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  width: number;
  height: number;
  colorDepth: number;
  pixelDepth: number;
  orientation?: ScreenOrientation;
}

const FloatingLiftingWindow: React.FC<FloatingLiftingWindowProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);
  const meet = useSelector((state: RootState) => state.meet);

  // Estados para controle da janela
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMultiScreen, setIsMultiScreen] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [position, setPosition] = useState(() => {
    // Carregar posição salva ou usar posição padrão
    const savedPosition = localStorage.getItem('floatingWindowPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        // Verificar se a posição está dentro dos limites da tela atual
        if (parsed.x >= 0 && parsed.y >= 0 && 
            parsed.x < window.screen.availWidth - 400 && 
            parsed.y < window.screen.availHeight - 300) {
          return parsed;
        }
      } catch (e) {
        console.warn('Erro ao carregar posição da janela:', e);
      }
    }
    return { x: 100, y: 100 };
  });
  const [size, setSize] = useState(() => {
    // Carregar tamanho salvo ou usar tamanho padrão
    const savedSize = localStorage.getItem('floatingWindowSize');
    if (savedSize) {
      try {
        return JSON.parse(savedSize);
      } catch (e) {
        console.warn('Erro ao carregar tamanho da janela:', e);
      }
    }
    return { width: 1200, height: 800 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Referência para a janela popup
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Refs para elementos DOM
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Detectar telas múltiplas
  useEffect(() => {
    const detectMultiScreen = () => {
      // Verificar se há múltiplas telas
      if (window.screen && window.screen.availWidth > window.innerWidth) {
        setIsMultiScreen(true);
        console.log('🎯 Múltiplas telas detectadas!');
        console.log('📱 Tela principal:', {
          width: window.screen.availWidth,
          height: window.screen.availHeight
        });
        console.log('🖥️ Janela do navegador:', {
          width: window.innerWidth,
          height: window.innerHeight
        });
      } else {
        setIsMultiScreen(false);
        console.log('📱 Apenas uma tela detectada');
      }
    };

    detectMultiScreen();
    window.addEventListener('resize', detectMultiScreen);
    
    return () => {
      window.removeEventListener('resize', detectMultiScreen);
    };
  }, []);

  // Filtrar atletas pelo dia, plataforma e grupo atual
  const entriesInFlight = entries.filter((entry: any) => 
    entry.day === day && 
    entry.platform === platform && 
    entry.flight === flight
  );

  // Salvar posição e tamanho da janela
  const saveWindowState = (newPosition: typeof position, newSize: typeof size) => {
    try {
      localStorage.setItem('floatingWindowPosition', JSON.stringify(newPosition));
      localStorage.setItem('floatingWindowSize', JSON.stringify(newSize));
      localStorage.setItem('floatingWindowDetached', JSON.stringify(isDetached));
    } catch (e) {
      console.warn('Erro ao salvar estado da janela:', e);
    }
  };

  // Função para abrir a janela como popup real (window.open)
  const openAsPopup = () => {
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
        setPopupWindow(newWindow);
        setIsDetached(true);
        console.log('🔄 Janela popup aberta com sucesso!');
        
        // Salvar estado
        localStorage.setItem('floatingWindowDetached', 'true');
        localStorage.setItem('popupWindowOpen', 'true');
        
        // Fechar a janela flutuante atual
        onClose();
        
        // Focar na nova janela
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

  // Função para abrir a janela em tela cheia em outro monitor
  const openInFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        // Tentar abrir em tela cheia
        await document.documentElement.requestFullscreen();
        
        // Se estiver em tela cheia, maximizar a janela
        if (document.fullscreenElement) {
          setIsMaximized(true);
          setSize({ 
            width: window.screen.availWidth - 40, 
            height: window.screen.availHeight - 40 
          });
          setPosition({ x: 20, y: 20 });
        }
      }
    } catch (error) {
      console.warn('Erro ao alternar tela cheia:', error);
      // Fallback: maximizar normalmente
      handleMaximize();
    }
  };

  // Função para mover a janela para outro monitor
  const moveToOtherScreen = () => {
    if (!isMultiScreen) {
      alert('Múltiplas telas não detectadas. Verifique se há um segundo monitor conectado.');
      return;
    }

    // Calcular posição para o segundo monitor
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    
    // Se a janela estiver na primeira metade da tela, mover para a segunda
    if (position.x < screenWidth / 2) {
      const newX = screenWidth - size.width - 50;
      setPosition({ x: newX, y: 50 });
      console.log('🔄 Movendo janela para o segundo monitor:', { x: newX, y: 50 });
    } else {
      // Mover de volta para o primeiro monitor
      setPosition({ x: 50, y: 50 });
      console.log('🔄 Movendo janela para o primeiro monitor:', { x: 50, y: 50 });
    }
  };

  // Handlers para os dropdowns
  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(event.target.value);
    console.log('🎯 FloatingWindow - handleDayChange chamado:', { newDay });
    dispatch(setDay(newDay));
  };

  const handlePlatformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = parseInt(event.target.value);
    console.log('🎯 FloatingWindow - handlePlatformChange chamado:', { newPlatform });
    dispatch(setPlatform(newPlatform));
  };

  const handleLiftChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLift = event.target.value as Lift;
    dispatch(setLift(newLift));
  };

  const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFlight = event.target.value;
    console.log('🎯 FloatingWindow - handleFlightChange chamado:', { newFlight });
    dispatch(setFlight(newFlight));
  };

  const handleAttemptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAttempt = parseInt(event.target.value);
    console.log('🎯 FloatingWindow - handleAttemptChange chamado:', { newAttempt, selectedEntryId });
    
    dispatch(setSelectedAttempt(newAttempt));
    
    if (selectedEntryId) {
      console.log('✅ Atualizando tentativa para atleta selecionado:', selectedEntryId, newAttempt);
      dispatch(selectAthleteAndAttempt({ entryId: selectedEntryId, attempt: newAttempt }));
    }
  };

  const handleAthleteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const entryId = parseInt(event.target.value);
    console.log('🎯 FloatingWindow - handleAthleteChange chamado:', { entryId, selectedAttempt });
    
    if (entryId > 0) {
      console.log('✅ Selecionando atleta:', entryId, 'tentativa:', selectedAttempt);
      dispatch(selectAthleteAndAttempt({ entryId, attempt: selectedAttempt }));
    } else {
      console.log('❌ Desmarcando seleção');
      dispatch(setSelectedEntryId(null));
      dispatch(setAttemptActive(false));
    }
  };

  // Handlers para as ações
  const handleGoodLift = () => {
    console.log('🎯 FloatingWindow - handleGoodLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      console.log('✅ Marcando Good Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 1, 0) as any);
      console.log(`Good Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
    } else {
      console.log('❌ Não é possível marcar Good Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  const handleNoLift = () => {
    console.log('🎯 FloatingWindow - handleNoLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      console.log('✅ Marcando No Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 2, 0) as any);
      console.log(`No Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
    } else {
      console.log('❌ Não é possível marcar No Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  // Handlers para controle da janela
  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setSize({ width: 1200, height: 800 });
      setPosition({ x: 100, y: 100 });
    } else {
      setIsMaximized(true);
      setSize({ width: window.screen.availWidth - 40, height: window.screen.availHeight - 40 });
      setPosition({ x: 20, y: 20 });
    }
  };

  // Handlers para arrastar com movimento mais livre e suporte a múltiplas telas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      e.preventDefault(); // Prevenir seleção de texto
    }
  };

  // Handlers para redimensionar
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Event listeners para mouse com suporte a múltiplas telas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Permitir movimento livre entre monitores
        // Usar screen.availWidth/Height para suportar múltiplas telas
        const maxX = window.screen.availWidth - Math.min(size.width, 400);
        const maxY = window.screen.availHeight - Math.min(size.height, 300);
        
        // Permitir que a janela saia da área visível do navegador
        const clampedX = Math.max(-size.width + 100, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        setPosition({ x: clampedX, y: clampedY });
      }
      
      if (isResizing && !isMaximized) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(800, Math.min(resizeStart.width + deltaX, window.screen.availWidth - 50));
        const newHeight = Math.max(600, Math.min(resizeStart.height + deltaY, window.screen.availHeight - 100));
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        // Salvar estado da janela quando parar de arrastar/redimensionar
        saveWindowState(position, size);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, isMaximized, position, size]);

  // Salvar estado quando a janela for fechada
  useEffect(() => {
    if (!isOpen) {
      saveWindowState(position, size);
    }
  }, [isOpen, position, size]);

  // Carregar estado de destacamento ao inicializar
  useEffect(() => {
    const savedDetached = localStorage.getItem('floatingWindowDetached');
    if (savedDetached === 'true') {
      setIsDetached(true);
    }
  }, []);

  // Gerar opções para os dropdowns
  const generateDayOptions = () => {
    const days = [];
    for (let i = 1; i <= (meet.lengthDays || 2); i++) {
      days.push(<option key={i} value={i}>Dia {i}</option>);
    }
    return days;
  };

  const generatePlatformOptions = () => {
    const platforms = [];
    const maxPlatforms = meet.platformsOnDays?.[day - 1] || 1;
    for (let i = 1; i <= maxPlatforms; i++) {
      platforms.push(<option key={i} value={i}>Plataforma {i}</option>);
    }
    return platforms;
  };

  const generateFlightOptions = () => {
    const flights = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return flights.map(flight => (
      <option key={flight} value={flight}>Grupo {flight}</option>
    ));
  };

  const generateAthleteOptions = () => {
    const options = [
      <option key="0" value="0">Selecione um atleta</option>
    ];
    
    entriesInFlight.forEach(entry => {
      options.push(
        <option key={entry.id} value={entry.id}>
          {entry.name} - {entry.weightClass}
        </option>
      );
    });
    
    return options;
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div 
        className="floating-window-minimized"
        style={{ 
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 1000
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="minimized-header">
          <span>🏋️ Levantamentos</span>
          <Button size="sm" variant="outline-secondary" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            ✕
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className={`floating-window ${isMaximized ? 'maximized' : ''} ${isMultiScreen ? 'multi-screen' : ''} ${isDetached ? 'detached' : ''}`}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex: isDetached ? 9999 : 1000
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Cabeçalho da janela */}
      <div ref={headerRef} className="floating-window-header">
        <div className="header-title">
          <span>🏋️ Tela Flutuante - Levantamentos</span>
          {isMultiScreen && <span className="multi-screen-indicator">🖥️</span>}
          {isDetached && <span className="detached-indicator">📌</span>}
        </div>
        <div className="header-controls">
          <Button size="sm" variant="outline-secondary" onClick={handleMinimize}>
            <span>−</span>
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={handleMaximize}>
            <span>{isMaximized ? '⧉' : '⧉'}</span>
          </Button>
          {isMultiScreen && (
            <Button size="sm" variant="outline-info" onClick={moveToOtherScreen} title="Mover para outro monitor">
              <span>🔄</span>
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline-success"
            onClick={openAsPopup}
            title="Abrir como janela independente (popup)"
          >
            <span>🪟</span>
          </Button>
          <Button size="sm" variant="outline-danger" onClick={onClose}>
            <span>✕</span>
          </Button>
        </div>
      </div>

      {/* Conteúdo da janela */}
      <div className="floating-window-content">
        {/* Controles superiores */}
        <div className="controls-section mb-3">
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-muted">Dia</Form.Label>
                <Form.Select
                  size="sm"
                  value={day}
                  onChange={handleDayChange}
                  className="custom-select"
                >
                  {generateDayOptions()}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-muted">Plataforma</Form.Label>
                <Form.Select
                  size="sm"
                  value={platform}
                  onChange={handlePlatformChange}
                  className="custom-select"
                >
                  {generatePlatformOptions()}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-muted">Movimento</Form.Label>
                <Form.Select
                  size="sm"
                  value={lift}
                  onChange={handleLiftChange}
                  className="custom-select"
                >
                  <option value="S">Agachamento</option>
                  <option value="B">Supino</option>
                  <option value="D">Levantamento Terra</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-muted">Grupo</Form.Label>
                <Form.Select
                  size="sm"
                  value={flight}
                  onChange={handleFlightChange}
                  className="custom-select"
                >
                  {generateFlightOptions()}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-muted">Tentativa</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedAttempt}
                  onChange={handleAttemptChange}
                  className="custom-select"
                >
                  <option value={1}>Tentativa 1</option>
                  <option value={2}>Tentativa 2</option>
                  <option value={3}>Tentativa 3</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small text-muted">Atleta</Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedEntryId || 0}
                  onChange={handleAthleteChange}
                  className="custom-select"
                >
                  {generateAthleteOptions()}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Botões de ação */}
        <div className="action-buttons mb-3">
          <Row>
            <Col md={6}>
              <div className="btn-group me-2" role="group">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => console.log('Alternar pesagens')}
                >
                  Alternar Pesagens
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={openInFullscreen}
                >
                  {document.fullscreenElement ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                </Button>
                {isMultiScreen && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={moveToOtherScreen}
                    title="Mover para outro monitor"
                  >
                    Mover Monitor
                  </Button>
                )}
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={openAsPopup}
                  title="Abrir como janela independente (popup)"
                >
                  Abrir Popup
                </Button>
              </div>
            </Col>
            <Col md={6} className="text-end">
              <Button
                variant="danger"
                size="sm"
                className="me-2"
                onClick={handleNoLift}
                disabled={!isAttemptActive || !selectedEntryId}
              >
                Inválido
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleGoodLift}
                disabled={!isAttemptActive || !selectedEntryId}
              >
                Válido
              </Button>
            </Col>
          </Row>
        </div>

        {/* Tabela de levantamentos */}
        <div className="table-section">
          {entriesInFlight.length === 0 ? (
            <div className="no-athletes-message">
              <div className="alert alert-warning text-center">
                <strong>⚠️ Nenhum atleta encontrado</strong><br />
                Verifique as configurações de Dia, Plataforma e Grupo
              </div>
            </div>
          ) : (
            <LiftingTable
              orderedEntries={entriesInFlight}
              currentEntryId={selectedEntryId}
              attemptOneIndexed={selectedAttempt}
            />
          )}
        </div>

        {/* Handle para redimensionar */}
        <div
          ref={resizeHandleRef}
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
        />
      </div>
    </div>
  );
};

export default FloatingLiftingWindow;
