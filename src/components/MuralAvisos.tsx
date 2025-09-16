import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaBell, FaCheck, FaTimes, FaEye, FaClock, FaTrash } from 'react-icons/fa';
import { notificacoesService } from '../services/notificacoesService';
import { NotificacaoDocumento } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface MuralAvisosProps {
  idEquipe?: string; // Se fornecido, mostra apenas notificações da equipe
}

const MuralAvisos: React.FC<MuralAvisosProps> = ({ idEquipe }) => {
  const [notificacoes, setNotificacoes] = useState<NotificacaoDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotificacao, setSelectedNotificacao] = useState<NotificacaoDocumento | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.tipo === 'admin';

  useEffect(() => {
    loadNotificacoes();
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadNotificacoes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [idEquipe]);

  const loadNotificacoes = async () => {
    try {
      setLoading(true);
      const data = idEquipe 
        ? await notificacoesService.getNotificacoesEquipe(idEquipe)
        : await notificacoesService.getUltimasNotificacoes();
      setNotificacoes(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const labels = {
      'COMPROVANTE_INSCRICAO': 'Comprovante de Inscrição',
      'COMPROVANTE_ANUIDADE': 'Comprovante de Anuidade',
      'COMPROVANTE_ANUIDADE_EQUIPE': 'Comprovante de Anuidade de Equipe',
      'COMPROVANTE_RESIDENCIA': 'Comprovante de Residência',
      'FOTO_3X4': 'Foto 3x4',
      'CERTIFICADO_ADEL': 'Certificado ADEL'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge bg="warning"><FaClock /> Pendente</Badge>;
      case 'APROVADO':
        return <Badge bg="success"><FaCheck /> Aprovado</Badge>;
      case 'RECUSADO':
        return <Badge bg="danger"><FaTimes /> Recusado</Badge>;
      case 'EXCLUIDO':
        return <Badge bg="secondary"><FaTrash /> Excluído</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleAprovar = async () => {
    if (!selectedNotificacao || !user) return;
    
    try {
      setProcessing(true);
      await notificacoesService.aprovarDocumento(
        selectedNotificacao.id!,
        user.nome,
        observacoes
      );
      toast.success('Documento aprovado com sucesso!');
      setShowModal(false);
      loadNotificacoes();
    } catch (error) {
      console.error('Erro ao aprovar documento:', error);
      toast.error('Erro ao aprovar documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleRecusar = async () => {
    if (!selectedNotificacao || !user || !observacoes.trim()) {
      toast.error('Observações são obrigatórias para recusar');
      return;
    }
    
    try {
      setProcessing(true);
      await notificacoesService.recusarDocumento(
        selectedNotificacao.id!,
        user.nome,
        observacoes
      );
      toast.success('Documento recusado');
      setShowModal(false);
      loadNotificacoes();
    } catch (error) {
      console.error('Erro ao recusar documento:', error);
      toast.error('Erro ao recusar documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleExcluir = async (notificacao: NotificacaoDocumento) => {
    if (!user) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        setProcessing(true);
        await notificacoesService.excluirNotificacao(notificacao.id!);
        toast.success('Notificação excluída');
        loadNotificacoes();
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        toast.error('Erro ao excluir notificação');
      } finally {
        setProcessing(false);
      }
    }
  };

  const openModal = (notificacao: NotificacaoDocumento) => {
    setSelectedNotificacao(notificacao);
    setObservacoes(notificacao.observacoes || '');
    setShowModal(true);
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <FaBell className="me-2" />
            {isAdmin ? 'Mural de Avisos - Admin' : 'Minhas Notificações'}
          </h5>
        </Card.Header>
        <Card.Body className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Carregando notificações...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <FaBell className="me-2" />
            {isAdmin ? 'Mural de Avisos - Admin' : 'Minhas Notificações'}
          </h5>
        </Card.Header>
        <Card.Body>
          {notificacoes.length === 0 ? (
            <Alert variant="info">
              {isAdmin ? 'Nenhuma notificação pendente.' : 'Nenhuma notificação encontrada.'}
            </Alert>
          ) : (
            <ListGroup variant="flush">
              {notificacoes
                .filter(notificacao => notificacao.status !== 'EXCLUIDO') // Filtrar notificações excluídas
                .map((notificacao) => (
                <ListGroup.Item 
                  key={notificacao.id} 
                  className="d-flex justify-content-between align-items-start"
                  style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                  onClick={() => isAdmin && notificacao.status !== 'EXCLUIDO' && openModal(notificacao)}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">
                      {isAdmin ? notificacao.nomeEquipe : getTipoDocumentoLabel(notificacao.tipoDocumento)}
                    </div>
                    <div className="text-muted">
                      {isAdmin 
                        ? `${getTipoDocumentoLabel(notificacao.tipoDocumento)} - ${notificacao.nomeDocumento}`
                        : notificacao.nomeDocumento
                      }
                    </div>
                    <small className="text-muted">
                      {formatDate(notificacao.dataEnvio)}
                    </small>
                    {notificacao.observacoes && (
                      <div className="mt-1">
                        <small className="text-info">
                          <strong>Observação:</strong> {notificacao.observacoes}
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="d-flex align-items-center">
                    {getStatusBadge(notificacao.status)}
                    {isAdmin && notificacao.status === 'PENDENTE' && (
                      <FaEye className="ms-2 text-primary" />
                    )}
                    {isAdmin && notificacao.status !== 'EXCLUIDO' && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="ms-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcluir(notificacao);
                        }}
                        disabled={processing}
                        title="Excluir notificação"
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Modal para Admin aprovar/recusar */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Avaliar Documento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotificacao && (
            <div>
              <p><strong>Equipe:</strong> {selectedNotificacao.nomeEquipe}</p>
              <p><strong>Documento:</strong> {getTipoDocumentoLabel(selectedNotificacao.tipoDocumento)}</p>
              <p><strong>Nome do arquivo:</strong> {selectedNotificacao.nomeDocumento}</p>
              <p><strong>Data de envio:</strong> {formatDate(selectedNotificacao.dataEnvio)}</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Observações:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Digite suas observações..."
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRecusar} 
            disabled={processing || !observacoes.trim()}
          >
            {processing ? <Spinner size="sm" /> : <FaTimes />} Recusar
          </Button>
          <Button 
            variant="success" 
            onClick={handleAprovar} 
            disabled={processing}
          >
            {processing ? <Spinner size="sm" /> : <FaCheck />} Aprovar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MuralAvisos;
