import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaDumbbell, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    login: '',
    senha: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, clearAuthData, user } = useAuth();
  const navigate = useNavigate();

  // Limpar dados de autenticação apenas uma vez ao montar o componente
  useEffect(() => {
    // Só limpar se não houver usuário logado
    const savedUser = localStorage.getItem('feperj_user');
    if (!savedUser) {
      clearAuthData();
    }
  }, [clearAuthData]);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      console.log('🔄 Usuário já logado, redirecionando para dashboard...');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 Tentando login com:', credentials.login);

    try {
      const success = await login(credentials);
      console.log('✅ Resultado do login:', success);
      
      if (!success) {
        setError('Login ou senha incorretos!');
      } else {
        console.log('🎉 Login realizado com sucesso!');
        // Redirecionar para o dashboard após login bem-sucedido
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-container">
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Card className="login-card">
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <FaDumbbell className="login-icon" />
              <h2 className="mt-3 mb-2">🏋️ FEPERJ</h2>
              <p className="text-muted">Sistema de Gestão de Atletas</p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Login:</Form.Label>
                <Form.Control
                  type="text"
                  name="login"
                  value={credentials.login}
                  onChange={handleChange}
                  placeholder="Digite seu login"
                  required
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Senha:</Form.Label>
                <Form.Control
                  type="password"
                  name="senha"
                  value={credentials.senha}
                  onChange={handleChange}
                  placeholder="Digite sua senha"
                  required
                />
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Entrando...
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="me-2" />
                    Entrar
                  </>
                )}
              </Button>
            </Form>

            <div className="text-center mt-4">
             
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Login;
