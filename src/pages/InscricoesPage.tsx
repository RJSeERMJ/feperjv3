import React from 'react';
import { Card, Alert } from 'react-bootstrap';

const InscricoesPage: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">📝 Gestão de Inscrições</h2>
      <Card>
        <Card.Body>
          <Alert variant="info">
            <h4>Funcionalidade em Desenvolvimento</h4>
            <p>
              A gestão de inscrições será implementada em breve, incluindo:
            </p>
            <ul>
              <li>Inscrição de atletas em competições</li>
              <li>Seleção de categorias</li>
              <li>Controle de pagamentos</li>
              <li>Relatórios de inscrições</li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default InscricoesPage;
