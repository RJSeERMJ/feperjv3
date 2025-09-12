import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Spinner, 
  ProgressBar,
  Table,
  Badge
} from 'react-bootstrap';
import { FaIdCard, FaDownload, FaFileArchive, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Atleta, Equipe } from '../types';
import { carteirinhaService, CarteirinhaData } from '../services/carteirinhaService';

interface CarteirinhaModalProps {
  show: boolean;
  onHide: () => void;
  atletas: Atleta[];
  equipes: Equipe[];
}

interface ProcessamentoStatus {
  atletaId: string;
  nome: string;
  status: 'pendente' | 'processando' | 'sucesso' | 'erro';
  erro?: string;
}

const CarteirinhaModal: React.FC<CarteirinhaModalProps> = ({
  show,
  onHide,
  atletas,
  equipes
}) => {
  const [atletasSelecionados, setAtletasSelecionados] = useState<Set<string>>(new Set());
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [statusProcessamento, setStatusProcessamento] = useState<ProcessamentoStatus[]>([]);
  const [modoProcessamento, setModoProcessamento] = useState<'individual' | 'lote'>('individual');

  // Resetar estado quando modal abrir
  useEffect(() => {
    if (show) {
      setAtletasSelecionados(new Set());
      setProcessando(false);
      setProgresso(0);
      setStatusProcessamento([]);
      setModoProcessamento('individual');
    }
  }, [show]);

  // Preparar dados para processamento
  const prepararDadosCarteirinha = (atleta: Atleta): CarteirinhaData | null => {
    const equipe = equipes.find(e => e.id === atleta.idEquipe);
    if (!equipe) {
      console.warn(`Equipe não encontrada para atleta ${atleta.nome}`);
      return null;
    }

    return {
      atleta,
      equipe
    };
  };

  // Gerar carteirinha individual
  const gerarCarteirinhaIndividual = async (atleta: Atleta) => {
    try {
      const dados = prepararDadosCarteirinha(atleta);
      if (!dados) {
        throw new Error('Dados incompletos para gerar carteirinha');
      }

      const pdfBytes = await carteirinhaService.gerarCarteirinha(dados);
      const nomeArquivo = `carteirinha_${atleta.nome.replace(/\s+/g, '_')}.pdf`;
      
      await carteirinhaService.baixarCarteirinha(pdfBytes, nomeArquivo);
      toast.success(`Carteirinha de ${atleta.nome} gerada com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar carteirinha individual:', error);
      toast.error(`Erro ao gerar carteirinha de ${atleta.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Gerar carteirinhas em lote
  const gerarCarteirinhasLote = async () => {
    if (atletasSelecionados.size === 0) {
      toast.error('Selecione pelo menos um atleta');
      return;
    }

    setProcessando(true);
    setProgresso(0);
    
    // Preparar status de processamento
    const atletasParaProcessar = atletas.filter(a => atletasSelecionados.has(a.id!));
    const statusInicial: ProcessamentoStatus[] = atletasParaProcessar.map(atleta => ({
      atletaId: atleta.id!,
      nome: atleta.nome,
      status: 'pendente'
    }));
    setStatusProcessamento(statusInicial);

    try {
      // Preparar dados
      const dadosCarteirinha: CarteirinhaData[] = [];
      const atletasValidos: Atleta[] = [];

      for (const atleta of atletasParaProcessar) {
        const dados = prepararDadosCarteirinha(atleta);
        if (dados) {
          dadosCarteirinha.push(dados);
          atletasValidos.push(atleta);
        } else {
          // Atualizar status para erro
          setStatusProcessamento(prev => 
            prev.map(s => 
              s.atletaId === atleta.id! 
                ? { ...s, status: 'erro' as const, erro: 'Equipe não encontrada' }
                : s
            )
          );
        }
      }

      if (dadosCarteirinha.length === 0) {
        throw new Error('Nenhum atleta válido para processar');
      }

      // Gerar carteirinhas
      const carteirinhas = await carteirinhaService.gerarCarteirinhasEmLote(dadosCarteirinha);
      
      // Atualizar status para sucesso
      setStatusProcessamento(prev => 
        prev.map(s => 
          atletasValidos.some(a => a.id === s.atletaId)
            ? { ...s, status: 'sucesso' as const }
            : s
        )
      );

      // Baixar individualmente
      await carteirinhaService.baixarCarteirinhasEmLote(dadosCarteirinha);
      
      toast.success(`${carteirinhas.length} carteirinhas geradas com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar carteirinhas em lote:', error);
      toast.error(`Erro ao gerar carteirinhas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessando(false);
      setProgresso(100);
    }
  };

  // Selecionar/deselecionar atleta
  const toggleAtleta = (atletaId: string) => {
    const novoSet = new Set(atletasSelecionados);
    if (novoSet.has(atletaId)) {
      novoSet.delete(atletaId);
    } else {
      novoSet.add(atletaId);
    }
    setAtletasSelecionados(novoSet);
  };

  // Selecionar todos
  const selecionarTodos = () => {
    const todosIds = atletas.map(a => a.id!).filter(Boolean);
    setAtletasSelecionados(new Set(todosIds));
  };

  // Deselecionar todos
  const deselecionarTodos = () => {
    setAtletasSelecionados(new Set());
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaIdCard className="me-2" />
          Geração de Carteirinhas
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          <strong>ℹ️ Informação:</strong> Selecione os atletas para gerar carteirinhas. 
          As fotos 3x4 serão inseridas automaticamente se estiverem cadastradas no sistema.
        </Alert>

        {/* Modo de processamento */}
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Modo de Processamento</Form.Label>
              <Form.Select
                value={modoProcessamento}
                onChange={(e) => setModoProcessamento(e.target.value as 'individual' | 'lote')}
                disabled={processando}
              >
                <option value="individual">Individual (baixar uma por vez)</option>
                <option value="lote">Em Lote (baixar todas individualmente)</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Controles de seleção */}
        {modoProcessamento === 'lote' && (
          <Row className="mb-3">
            <Col>
              <div className="d-flex gap-2 mb-2">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={selecionarTodos}
                  disabled={processando}
                >
                  Selecionar Todos
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={deselecionarTodos}
                  disabled={processando}
                >
                  Deselecionar Todos
                </Button>
                <Badge bg="info" className="ms-auto">
                  {atletasSelecionados.size} selecionados
                </Badge>
              </div>
            </Col>
          </Row>
        )}

        {/* Lista de atletas */}
        <Table responsive striped hover>
          <thead>
            <tr>
              {modoProcessamento === 'lote' && <th>Selecionar</th>}
              <th>Nome</th>
              <th>Equipe</th>
              <th>Matrícula</th>
              <th>Foto 3x4</th>
              {modoProcessamento === 'individual' && <th>Ação</th>}
            </tr>
          </thead>
          <tbody>
            {atletas.map((atleta) => {
              const equipe = equipes.find(e => e.id === atleta.idEquipe);
              const temFoto = atleta.foto3x4; // Assumindo que existe este campo
              
              return (
                <tr key={atleta.id}>
                  {modoProcessamento === 'lote' && (
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={atletasSelecionados.has(atleta.id!)}
                        onChange={() => toggleAtleta(atleta.id!)}
                        disabled={processando}
                      />
                    </td>
                  )}
                  <td>{atleta.nome}</td>
                  <td>{equipe?.nomeEquipe || '-'}</td>
                  <td>{atleta.matricula || carteirinhaService.gerarMatricula(atleta.cpf)}</td>
                  <td>
                    <Badge bg={temFoto ? 'success' : 'warning'}>
                      {temFoto ? 'Disponível' : 'Não cadastrada'}
                    </Badge>
                  </td>
                  {modoProcessamento === 'individual' && (
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => gerarCarteirinhaIndividual(atleta)}
                        disabled={processando}
                      >
                        <FaDownload className="me-1" />
                        Gerar
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>

        {/* Status de processamento */}
        {processando && (
          <div className="mt-3">
            <h6>Status do Processamento</h6>
            <ProgressBar 
              now={progresso} 
              label={`${progresso}%`} 
              className="mb-3"
            />
            
            {statusProcessamento.length > 0 && (
              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Status</th>
                    <th>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {statusProcessamento.map((status) => (
                    <tr key={status.atletaId}>
                      <td>{status.nome}</td>
                      <td>
                        {status.status === 'pendente' && (
                          <Badge bg="secondary">Pendente</Badge>
                        )}
                        {status.status === 'processando' && (
                          <Badge bg="primary">
                            <Spinner animation="border" size="sm" className="me-1" />
                            Processando
                          </Badge>
                        )}
                        {status.status === 'sucesso' && (
                          <Badge bg="success">
                            <FaCheck className="me-1" />
                            Sucesso
                          </Badge>
                        )}
                        {status.status === 'erro' && (
                          <Badge bg="danger">
                            <FaTimes className="me-1" />
                            Erro
                          </Badge>
                        )}
                      </td>
                      <td>{status.erro || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={processando}>
          Fechar
        </Button>
        {modoProcessamento === 'lote' && (
          <Button
            variant="primary"
            onClick={gerarCarteirinhasLote}
            disabled={processando || atletasSelecionados.size === 0}
          >
            {processando ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processando...
              </>
            ) : (
              <>
                <FaDownload className="me-2" />
                Gerar Carteirinhas ({atletasSelecionados.size})
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CarteirinhaModal;
