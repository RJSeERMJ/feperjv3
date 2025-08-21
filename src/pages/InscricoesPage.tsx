import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Alert, Spinner } from 'react-bootstrap';
import { FaTrophy, FaArrowRight } from 'react-icons/fa';

const InscricoesPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para a página de competições após 3 segundos
    const timer = setTimeout(() => {
      navigate('/competicoes');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <FaTrophy className="me-2" />
                Inscrições em Competições
              </h4>
            </Card.Header>
            <Card.Body className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Redirecionando para a página de Competições...</h5>
              <p className="text-muted">
                As inscrições são gerenciadas na página de Competições.
              </p>
              <Alert variant="info">
                <FaArrowRight className="me-2" />
                Você será redirecionado automaticamente em alguns segundos.
                <br />
                <small>
                  Se não for redirecionado, 
                  <a href="/competicoes" className="ms-1">clique aqui</a>.
                </small>
              </Alert>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InscricoesPage;
