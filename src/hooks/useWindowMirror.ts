import { useState, useEffect, useRef, useCallback } from 'react';

export interface WindowMirrorState {
  isMirrorWindow: boolean;
  isMainWindow: boolean;
  mirrorWindow: Window | null;
  isConnected: boolean;
}

export interface WindowMirrorActions {
  openMirrorWindow: (url: string, windowName: string) => void;
  closeMirrorWindow: () => void;
  sendToMirror: (data: any) => void;
  sendToMain: (data: any) => void;
  broadcast: (data: any) => void;
}

export interface WindowMirrorConfig {
  channelName: string;
  windowName: string;
  onMessage?: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useWindowMirror = (config: WindowMirrorConfig): WindowMirrorState & WindowMirrorActions => {
  const [isMirrorWindow, setIsMirrorWindow] = useState(false);
  const [isMainWindow, setIsMainWindow] = useState(false);
  const [mirrorWindow, setMirrorWindow] = useState<Window | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const messageQueue = useRef<any[]>([]);
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Inicializar BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel.current = new BroadcastChannel(config.channelName);
      
      broadcastChannel.current.onmessage = (event) => {
        const { type, data, source } = event.data;
        
        // Ignorar mensagens próprias
        if (source === 'self') return;
        
        console.log('🔄 BroadcastChannel recebido:', { type, data, source });
        
        // Processar mensagens baseadas no tipo
        switch (type) {
          case 'SYNC_STATE':
            if (config.onMessage) {
              config.onMessage(data);
            }
            break;
          case 'CONNECTION_CHECK':
            // Responder ao check de conexão
            if (broadcastChannel.current) {
              broadcastChannel.current.postMessage({
                type: 'CONNECTION_RESPONSE',
                source: isMirrorWindow ? 'mirror' : 'main',
                timestamp: Date.now()
              });
            }
            break;
          case 'CONNECTION_RESPONSE':
            setIsConnected(true);
            if (config.onConnectionChange) {
              config.onConnectionChange(true);
            }
            break;
          case 'WINDOW_CLOSED':
            setIsConnected(false);
            if (config.onConnectionChange) {
              config.onConnectionChange(false);
            }
            break;
        }
      };
      
      // Verificar se é janela espelhada baseado na URL ou parâmetros
      const urlParams = new URLSearchParams(window.location.search);
      const isMirror = urlParams.get('mirror') === 'true' || 
                      window.name.includes('mirror') ||
                      window.opener !== null;
      
      setIsMirrorWindow(isMirror);
      setIsMainWindow(!isMirror);
      
      // Se for janela principal, iniciar verificação de conexão
      if (!isMirror) {
        startConnectionCheck();
      }
      
      return () => {
        if (broadcastChannel.current) {
          broadcastChannel.current.close();
        }
        if (connectionCheckInterval.current) {
          clearInterval(connectionCheckInterval.current);
        }
      };
    }
  }, [config.channelName, isMirrorWindow]);

  // Função para iniciar verificação de conexão
  const startConnectionCheck = useCallback(() => {
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current);
    }
    
    connectionCheckInterval.current = setInterval(() => {
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({
          type: 'CONNECTION_CHECK',
          source: 'main',
          timestamp: Date.now()
        });
      }
    }, 2000); // Verificar a cada 2 segundos
  }, []);

  // Função para abrir janela espelhada
  const openMirrorWindow = useCallback((url: string, windowName: string) => {
    if (mirrorWindow && !mirrorWindow.closed) {
      mirrorWindow.focus();
      return;
    }
    
    // Adicionar parâmetro de espelhamento à URL
    const separator = url.includes('?') ? '&' : '?';
    const mirrorUrl = `${url}${separator}mirror=true`;
    
    const newWindow = window.open(
      mirrorUrl,
      `${windowName}_mirror`,
      'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );
    
    if (newWindow) {
      setMirrorWindow(newWindow);
      setIsConnected(true);
      
      // Monitorar fechamento da janela
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setMirrorWindow(null);
          setIsConnected(false);
          clearInterval(checkClosed);
          
          // Notificar que a janela foi fechada
          if (broadcastChannel.current) {
            broadcastChannel.current.postMessage({
              type: 'WINDOW_CLOSED',
              source: 'main',
              timestamp: Date.now()
            });
          }
        }
      }, 1000);
      
      // Enviar fila de mensagens pendentes
      setTimeout(() => {
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();
          if (broadcastChannel.current) {
            broadcastChannel.current.postMessage(message);
          }
        }
      }, 1000);
    }
  }, [mirrorWindow]);

  // Função para fechar janela espelhada
  const closeMirrorWindow = useCallback(() => {
    if (mirrorWindow && !mirrorWindow.closed) {
      mirrorWindow.close();
    }
    setMirrorWindow(null);
    setIsConnected(false);
  }, [mirrorWindow]);

  // Função para serializar dados (remover funções e objetos não clonáveis)
  const serializeData = useCallback((data: any): any => {
    try {
      if (data === null || data === undefined) return data;
      
      if (typeof data === 'function') {
        return null; // Remover funções
      }
      
      // Verificar se é um objeto DOM ou outros objetos não serializáveis
      if (typeof data === 'object') {
        // Verificar se é um elemento DOM
        if (data instanceof Element || data instanceof Node) {
          return null;
        }
        
        // Verificar se é um objeto com propriedades não serializáveis
        if (data.constructor && data.constructor.name !== 'Object' && data.constructor.name !== 'Array') {
          // Para objetos customizados, tentar serializar apenas propriedades básicas
          const serialized: any = {};
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'function') {
              continue; // Pular funções
            }
            if (typeof value === 'object' && value !== null) {
              // Verificar se é serializável
              try {
                JSON.stringify(value);
                serialized[key] = serializeData(value);
              } catch {
                // Se não conseguir serializar, pular
                continue;
              }
            } else {
              serialized[key] = value;
            }
          }
          return serialized;
        }
        
        if (Array.isArray(data)) {
          return data.map(item => serializeData(item));
        }
        
        // Objeto simples
        const serialized: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'function') {
            continue; // Pular funções
          }
          serialized[key] = serializeData(value);
        }
        return serialized;
      }
      
      return data;
    } catch (error) {
      console.warn('Erro ao serializar dados:', error);
      return null;
    }
  }, []);

  // Função para enviar dados para janela espelhada
  const sendToMirror = useCallback((data: any) => {
    try {
      if (broadcastChannel.current) {
        const serializedData = serializeData(data);
        const message = {
          type: 'SYNC_STATE',
          data: serializedData,
          source: 'main',
          timestamp: Date.now()
        };
        
        broadcastChannel.current.postMessage(message);
        console.log('📤 Enviado para espelho:', message);
      } else {
        // Adicionar à fila se o canal não estiver pronto
        messageQueue.current.push({
          type: 'SYNC_STATE',
          data: serializeData(data),
          source: 'main',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Erro ao enviar dados para espelho:', error);
    }
  }, [serializeData]);

  // Função para enviar dados para janela principal
  const sendToMain = useCallback((data: any) => {
    try {
      if (broadcastChannel.current) {
        const serializedData = serializeData(data);
        const message = {
          type: 'SYNC_STATE',
          data: serializedData,
          source: 'mirror',
          timestamp: Date.now()
        };
        
        broadcastChannel.current.postMessage(message);
        console.log('📤 Enviado para principal:', message);
      }
    } catch (error) {
      console.error('Erro ao enviar dados para principal:', error);
    }
  }, [serializeData]);

  // Função para broadcast geral
  const broadcast = useCallback((data: any) => {
    try {
      if (broadcastChannel.current) {
        const serializedData = serializeData(data);
        const message = {
          type: 'SYNC_STATE',
          data: serializedData,
          source: isMirrorWindow ? 'mirror' : 'main',
          timestamp: Date.now()
        };
        
        broadcastChannel.current.postMessage(message);
        console.log('📡 Broadcast:', message);
      }
    } catch (error) {
      console.error('Erro ao fazer broadcast:', error);
    }
  }, [isMirrorWindow, serializeData]);

  // Notificar fechamento da janela
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({
          type: 'WINDOW_CLOSED',
          source: isMirrorWindow ? 'mirror' : 'main',
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isMirrorWindow]);

  return {
    // Estado
    isMirrorWindow,
    isMainWindow,
    mirrorWindow,
    isConnected,
    
    // Ações
    openMirrorWindow,
    closeMirrorWindow,
    sendToMirror,
    sendToMain,
    broadcast
  };
};

export default useWindowMirror;
