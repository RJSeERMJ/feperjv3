import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/barraProntaStore';
import './FloatingLiftingWindow.css';

interface FloatingLiftingWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const FloatingLiftingWindow: React.FC<FloatingLiftingWindowProps> = ({ isOpen, onClose }) => {
  const { day, platform, flight, lift, selectedEntryId, selectedAttempt } = useSelector((state: RootState) => state.lifting);

  // Abrir popup automaticamente quando o componente é renderizado
  useEffect(() => {
    if (isOpen) {
      openPopup();
    }
  }, [isOpen]);

  const openPopup = () => {
    try {
      // Configurações simples do popup
      const popupWidth = 800;
      const popupHeight = 600;
      const popupX = (window.screen.availWidth - popupWidth) / 2;
      const popupY = (window.screen.availHeight - popupHeight) / 2;

      const popupFeatures = [
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        `left=${popupX}`,
        `top=${popupY}`,
        'resizable=yes',
        'scrollbars=no',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no'
      ].join(',');

      // Abrir popup
      const popup = window.open('', 'liftingPopup', popupFeatures);
      
      if (popup) {
        // Criar conteúdo HTML simples
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <title>Levantamentos</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f0f0f0;
                color: #333;
              }
              .container {
                max-width: 700px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              h1 {
                text-align: center;
                color: #2c3e50;
                margin-bottom: 30px;
                font-size: 2em;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }
              .info-item {
                background: #ecf0f1;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
              }
              .info-item h3 {
                margin: 0 0 10px 0;
                color: #7f8c8d;
                font-size: 1em;
              }
              .info-item p {
                margin: 0;
                font-size: 1.5em;
                font-weight: bold;
                color: #2c3e50;
              }
              .timestamp {
                text-align: center;
                color: #7f8c8d;
                font-style: italic;
                padding: 20px;
                background: #ecf0f1;
                border-radius: 8px;
              }
              .status {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #27ae60;
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 0.9em;
              }
            </style>
          </head>
          <body>
            <div class="status" id="status">🔄 Atualizando...</div>
            <div class="container">
              <h1>🏋️ Levantamentos</h1>
              <div class="info-grid">
                <div class="info-item">
                  <h3>Dia</h3>
                  <p id="day">-</p>
                </div>
                <div class="info-item">
                  <h3>Plataforma</h3>
                  <p id="platform">-</p>
                </div>
                <div class="info-item">
                  <h3>Grupo</h3>
                  <p id="flight">-</p>
                </div>
                <div class="info-item">
                  <h3>Movimento</h3>
                  <p id="lift">-</p>
                </div>
                <div class="info-item">
                  <h3>Tentativa</h3>
                  <p id="attempt">-</p>
                </div>
                <div class="info-item">
                  <h3>Atleta</h3>
                  <p id="athlete">-</p>
                </div>
              </div>
              <div class="timestamp">
                <strong>Última atualização:</strong> <span id="timestamp">-</span>
              </div>
            </div>
            
            <script>
              // Função para atualizar dados
              function updateData(data) {
                document.getElementById('day').textContent = data.day;
                document.getElementById('platform').textContent = data.platform;
                document.getElementById('flight').textContent = data.flight;
                document.getElementById('lift').textContent = data.lift;
                document.getElementById('attempt').textContent = data.attempt;
                document.getElementById('athlete').textContent = data.athlete;
                document.getElementById('timestamp').textContent = data.timestamp;
              }
              
              // Listener para mensagens
              window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'UPDATE_DATA') {
                  updateData(event.data.data);
                }
              });
              
              // Verificar conexão
              setInterval(() => {
                try {
                  if (window.opener && !window.opener.closed) {
                    document.getElementById('status').textContent = '✅ Conectado';
                    document.getElementById('status').style.background = '#27ae60';
                  } else {
                    document.getElementById('status').textContent = '❌ Desconectado';
                    document.getElementById('status').style.background = '#e74c3c';
                  }
                } catch (e) {
                  document.getElementById('status').textContent = '❌ Desconectado';
                  document.getElementById('status').style.background = '#e74c3c';
                }
              }, 1000);
            </script>
          </body>
          </html>
        `;
        
        popup.document.write(htmlContent);
        popup.document.close();
        
        // Focar no popup
        popup.focus();
        
        // Fechar a janela flutuante
        onClose();
        
        // Iniciar atualização automática
        startAutoUpdate(popup);
      } else {
        alert('Popup bloqueado pelo navegador. Permita popups para este site.');
      }
    } catch (error) {
      console.error('Erro ao abrir popup:', error);
      alert('Erro ao abrir popup.');
    }
  };

  const startAutoUpdate = (popup: Window) => {
    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          return;
        }

        // Preparar dados
        const liftLabels = {
          'S': 'Agachamento',
          'B': 'Supino',
          'D': 'Levantamento Terra'
        };

        const data = {
          day: `Dia ${day}`,
          platform: `Plataforma ${platform}`,
          flight: `Grupo ${flight}`,
          lift: liftLabels[lift] || lift,
          attempt: `Tentativa ${selectedAttempt}`,
          athlete: selectedEntryId ? `ID: ${selectedEntryId}` : 'Nenhum',
          timestamp: new Date().toLocaleTimeString('pt-BR')
        };

        // Enviar dados para o popup
        popup.postMessage({
          type: 'UPDATE_DATA',
          data: data
        }, '*');

      } catch (error) {
        console.warn('Erro na atualização:', error);
      }
    }, 500); // Atualizar a cada 500ms
  };

  // Não renderizar nada - apenas abrir popup
  return null;
};

export default FloatingLiftingWindow;
