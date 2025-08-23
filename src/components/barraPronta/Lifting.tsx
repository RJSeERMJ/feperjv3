import React from 'react';
import { Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaExternalLinkAlt } from 'react-icons/fa';
import './Lifting.css';

const Lifting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="lifting-redirect">
      <div className="text-center">
        <h2 className="mb-4">
          🏋️ Sistema de Levantamentos
        </h2>
        
        <Alert variant="info" className="mb-4">
          <strong>Novo Sistema de Levantamentos!</strong>
          <br />
          O sistema de levantamentos foi completamente reformulado com uma interface moderna e funcionalidades avançadas.
          <br />
          Clique no botão abaixo para acessar o novo sistema.
        </Alert>
        
        <Button 
          variant="success" 
          size="lg" 
          onClick={() => navigate('/lifting')}
          className="me-3"
        >
          <FaExternalLinkAlt className="me-2" />
          Acessar Sistema de Levantamentos
        </Button>
        
        <div className="mt-4">
          <small className="text-muted">
            O novo sistema inclui:
          </small>
          <ul className="text-muted text-start d-inline-block mt-2">
            <li>Interface moderna e responsiva</li>
            <li>Visualização das anilhas na barra</li>
            <li>Controle de tentativas (Good/No Lift)</li>
            <li>Navegação entre movimentos</li>
            <li>Estatísticas em tempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lifting;
