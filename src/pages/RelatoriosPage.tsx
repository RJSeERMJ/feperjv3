import React from 'react';
import { Card, Alert } from 'react-bootstrap';

const RelatoriosPage: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">📊 Relatórios</h2>
      <Card>
        <Card.Body>
          <Alert variant="info">
            <h4>Funcionalidade em Desenvolvimento</h4>
            <p>
              Os relatórios serão implementados em breve, incluindo:
            </p>
            <ul>
              <li>Relatórios de atletas por equipe</li>
              <li>Estatísticas de competições</li>
              <li>Rankings e classificações</li>
              <li>Relatórios financeiros</li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RelatoriosPage;
