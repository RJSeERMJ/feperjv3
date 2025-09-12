import React from 'react';
import { Card, Alert, Button } from 'react-bootstrap';
import { FaInfoCircle, FaPlay } from 'react-icons/fa';

/**
 * Componente de exemplo para demonstrar como usar o sistema de carteirinhas
 * Este arquivo pode ser removido em produção
 */
const ExemploUso: React.FC = () => {
  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">
          <FaInfoCircle className="me-2" />
          Como Usar o Sistema de Carteirinhas
        </h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <strong>📋 Pré-requisitos:</strong>
          <ul className="mb-0">
            <li>PDF modelo deve estar em <code>public/modelos/carteirinha.pdf</code></li>
            <li>Atletas devem ter equipe associada</li>
            <li>Fotos 3x4 devem estar cadastradas no Supabase</li>
          </ul>
        </Alert>

        <h6>Passo a Passo:</h6>
        <ol>
          <li>
            <strong>Acesse a página de Atletas</strong>
            <br />
            <small className="text-muted">Menu principal → Atletas</small>
          </li>
          <li>
            <strong>Clique no botão "Carteirinhas"</strong>
            <br />
            <small className="text-muted">Ícone de carteirinha na barra superior</small>
          </li>
          <li>
            <strong>Escolha o modo de processamento:</strong>
            <ul>
              <li><strong>Individual:</strong> Gera uma carteirinha por vez</li>
              <li><strong>Em Lote:</strong> Gera múltiplas carteirinhas em ZIP</li>
            </ul>
          </li>
          <li>
            <strong>Selecione os atletas desejados</strong>
            <br />
            <small className="text-muted">No modo lote, marque os checkboxes</small>
          </li>
          <li>
            <strong>Clique em "Gerar" ou "Gerar Carteirinhas"</strong>
            <br />
            <small className="text-muted">O sistema processará automaticamente</small>
          </li>
        </ol>

        <Alert variant="warning">
          <strong>⚠️ Importante:</strong>
          <ul className="mb-0">
            <li>As posições dos campos podem precisar ser ajustadas conforme o modelo PDF</li>
            <li>Fotos muito grandes podem causar lentidão</li>
            <li>Textos longos serão truncados ou quebrados em múltiplas linhas</li>
          </ul>
        </Alert>

        <h6>Configuração de Posições:</h6>
        <p>
          Para ajustar as posições dos campos, edite o arquivo{' '}
          <code>src/config/carteirinhaConfig.ts</code>
        </p>
        <p>
          <strong>Coordenadas:</strong> Sistema de pontos (1 ponto = 1/72 polegada)
          <br />
          <strong>Origem:</strong> Canto inferior esquerdo do PDF
        </p>

        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => window.open('/modelos/carteirinha.pdf', '_blank')}
          >
            <FaPlay className="me-1" />
            Ver PDF Modelo
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ExemploUso;
