import React, { useState, useEffect } from 'react';
import { Badge, Alert } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import { useWindowMirror } from '../../hooks/useWindowMirror';
import LiftingTable from './LiftingTable';
import './LiftingTableMirror.css';

// Função para detectar se atleta está dobrando e obter todas as categorias (MESMA LÓGICA DO LEFTCARD)
const getAthleteCategories = (entry: any) => {
  const categories = [entry.division];
  
  // Verificar se tem dobraCategoria específica nas notas
  if (entry.notes) {
    const dobraMatch = entry.notes.match(/dobraCategoria[:\s]*([^,]+)/i);
    if (dobraMatch) {
      const dobraCategoria = dobraMatch[1].trim();
      // Só adicionar se não for "Dobra FEPERJ" e for diferente da categoria atual
      if (dobraCategoria.toLowerCase() !== 'dobra feperj' && 
          dobraCategoria !== entry.division &&
          dobraCategoria.trim() !== '') {
        categories.push(dobraCategoria);
      }
    }
  }
  
  return categories;
};

// Função para obter o tipo de competição (MESMA LÓGICA DO LEFTCARD)
const getCompetitionType = (entry: any): string => {
  if (!entry?.movements) return 'N/A';
  
  // Se há vírgula, pegar o primeiro tipo
  if (entry.movements.includes(',')) {
    return entry.movements.split(',')[0].trim();
  }
  
  return entry.movements.trim();
};

interface LiftingTableMirrorProps {
  orderedEntries: any[];
  currentEntryId: number | null;
  attemptOneIndexed: number;
  onOpenPopup?: () => void;
}

const LiftingTableMirror: React.FC<LiftingTableMirrorProps> = (props) => {
  const [mirrorState, setMirrorState] = useState<any>(null);
  const [titleKey, setTitleKey] = useState(0); // Para forçar re-render do título

  // Debug: mostrar quando o componente é re-renderizado
  console.log('🔄 LiftingTableMirror - Componente re-renderizado:', {
    currentEntryId: props.currentEntryId,
    titleKey,
    timestamp: new Date().toLocaleTimeString(),
    source: 'LiftingTableMirror - Sincronizado com LeftCard'
  });

  // Função para gerar título com informações do atleta atual
  const getAthleteTitle = () => {
    const { orderedEntries, currentEntryId } = props;
    const currentEntry = currentEntryId ? orderedEntries.find((e: any) => e.id === currentEntryId) : null;
    
    // Debug: verificar mudanças do atleta (MESMA LÓGICA DO LEFTCARD)
    console.log('🔄 LiftingTableMirror - Atualizando título (SINCRONIZADO COM LEFTCARD):', {
      currentEntryId,
      currentEntry: currentEntry ? {
        name: currentEntry.name,
        weightClass: currentEntry.weightClass,
        division: currentEntry.division,
        team: currentEntry.team,
        notes: currentEntry.notes,
        isMarked: true // ← ATLETA MARCADO/SELECIONADO (MESMO DO LEFTCARD)
      } : null,
      syncStatus: '✅ SINCRONIZADO COM LEFTCARD'
    });
    
    if (!currentEntry) {
      return "🏋️ Tabela de Levantamentos";
    }

    // Usar MESMA LÓGICA DO LEFTCARD para detectar categorias
    const categories = getAthleteCategories(currentEntry);
    const categoriesText = categories.join(' + ');
    const competitionType = getCompetitionType(currentEntry);
    const sex = currentEntry.sex === 'M' ? 'M' : 'F';
    
    // Debug: mostrar categorias detectadas (MESMA LÓGICA DO LEFTCARD)
    console.log('🔍 LiftingTableMirror - Categorias detectadas (LÓGICA LEFTCARD):', {
      categories,
      categoriesText,
      competitionType,
      sex
    });
    
    // Remover casas decimais e "kg" da categoria de peso
    const weightClass = currentEntry.weightClass ? 
      currentEntry.weightClass.replace(/\.0+$/, '').replace(/kg/gi, '').trim() : 
      'N/A';
    
    // Adicionar indicação de que é o atleta MARCADO/SELECIONADO
    const markedIndicator = ""; // Indicador visual de atleta marcado
    const title = `${markedIndicator}${currentEntry.name}, ${weightClass} - ${sex} - ${categoriesText} - ${currentEntry.team || 'Força Pura'} - ${competitionType}`;
    
    console.log('🏋️ LiftingTableMirror - Título gerado (ATLETA MARCADO):', {
      title,
      timestamp: new Date().toLocaleTimeString(),
      titleKey
    });
    
    return title;
  };

  const {
    isMirrorWindow,
    isMainWindow,
    isConnected,
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

  // Forçar re-render quando currentEntryId mudar (ATLETA MARCADO MUDOU)
  useEffect(() => {
    console.log('🎯 LiftingTableMirror - ATLETA MARCADO mudou:', {
      newEntryId: props.currentEntryId,
      isMarked: props.currentEntryId !== null,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Encontrar o atleta para debug
    const currentEntry = props.currentEntryId ? props.orderedEntries.find((e: any) => e.id === props.currentEntryId) : null;
    if (currentEntry) {
      console.log('🎯 LiftingTableMirror - Novo atleta marcado:', {
        id: currentEntry.id,
        name: currentEntry.name,
        weightClass: currentEntry.weightClass,
        division: currentEntry.division
      });
    }
    
    setTitleKey(prev => prev + 1); // Forçar re-render do título
  }, [props.currentEntryId, props.orderedEntries]);

  // Funções de controle de espelhamento removidas - agora controladas pelo MirrorControls central

  // Renderizar apenas o conteúdo na janela principal (sem botões de controle)
  if (isMainWindow) {
    return (
      <div className="lifting-mirror-container mirror-window">
        <div className="mirror-header">
          <div className="text-center mb-3">
            <h5 className="mb-0 text-white fw-bold" key={titleKey}>
              {getAthleteTitle()}
              {isConnected && (
                <Badge bg="success" className="ms-2">
                  <FaSync className="me-1" />
                  Espelhado
                </Badge>
              )}
            </h5>
          </div>
        </div>
        
        {isConnected && (
          <Alert variant="info" className="mb-3">
            <FaSync className="me-2" />
            <strong>Janela espelhada ativa!</strong> As mudanças nesta tela aparecerão automaticamente na janela separada.
          </Alert>
        )}
        
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
            <h4 className="mb-0 text-white fw-bold" key={titleKey}>
              {mirrorState ? 
                (() => {
                  const currentEntry = mirrorState.props.currentEntryId ? 
                    mirrorState.props.orderedEntries.find((e: any) => e.id === mirrorState.props.currentEntryId) : null;
                  
                  if (!currentEntry) {
                    return "🏋️ Tabela de Levantamentos - Monitor Externo";
                  }

                  const categories = getAthleteCategories(currentEntry);
                  const categoriesText = categories.join(' + ');
                  const competitionType = getCompetitionType(currentEntry);
                  const sex = currentEntry.sex === 'M' ? 'M' : 'F';
                  
                  // Remover casas decimais e "kg" da categoria de peso
                  const weightClass = currentEntry.weightClass ? 
                    currentEntry.weightClass.replace(/\.0+$/, '').replace(/kg/gi, '').trim() : 
                    'N/A';
                  
                  // Adicionar indicação de que é o atleta MARCADO/SELECIONADO
                  const markedIndicator = ""; // Indicador visual de atleta marcado
                  return `${markedIndicator}${currentEntry.name}, ${weightClass} - ${sex} - ${categoriesText} - ${currentEntry.team || 'Força Pura'} - ${competitionType}`;
                })() :
                "🏋️ Tabela de Levantamentos - Monitor Externo"
              }
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
