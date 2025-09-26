import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaClock } from 'react-icons/fa';
import './InactivityWarning.css';

interface InactivityWarningProps {
  show: boolean;
  remainingTime: number; // em segundos
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

const InactivityWarning: React.FC<InactivityWarningProps> = ({
  show,
  remainingTime,
  onStayLoggedIn,
  onLogout
}) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    setTimeLeft(remainingTime);
  }, [remainingTime]);

  useEffect(() => {
    if (!show || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => {
    onStayLoggedIn();
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Modal 
      show={show} 
      backdrop="static" 
      keyboard={false}
      centered
      className="inactivity-warning-modal"
    >
      <Modal.Header className="bg-warning text-dark">
        <Modal.Title className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          Sessão Expirada
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="warning" className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <FaClock className="me-2" />
            <strong>Sua sessão será encerrada em:</strong>
          </div>
          <div className="text-center">
            <h2 className="text-danger mb-0">
              {formatTime(timeLeft)}
            </h2>
          </div>
        </Alert>
        
        <p className="mb-0">
          Você ficou inativo por muito tempo. Para continuar usando o sistema, 
          clique em "Continuar Logado" ou sua sessão será encerrada automaticamente.
        </p>
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={handleLogout}
          className="me-2"
        >
          Fazer Logout
        </Button>
        <Button 
          variant="primary" 
          onClick={handleStayLoggedIn}
        >
          Continuar Logado
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InactivityWarning;
