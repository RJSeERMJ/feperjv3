import React from 'react';
import { Card, Alert } from 'react-bootstrap';

const CompeticoesPage: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">🏆 Gestão de Competições</h2>
      <Card>
        <Card.Body>
          <Alert variant="info">
            <h4>Funcionalidade em Desenvolvimento</h4>
            <p>
              A gestão de competições será implementada em breve, incluindo:
            </p>
            <ul>
              <li>Cadastro de competições</li>
              <li>Configuração de datas e valores</li>
              <li>Gestão de inscrições</li>
              <li>Resultados e rankings</li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CompeticoesPage;
