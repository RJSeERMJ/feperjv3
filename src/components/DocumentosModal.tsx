import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Form,
  Table,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import { 
  FaUpload, 
  FaDownload, 
  FaTrash, 
  FaFileAlt, 
  FaImage, 
  FaCertificate,
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { documentService, Documento } from '../services/documentService';
import { Atleta } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { testSupabaseConnection } from '../config/supabase';

interface DocumentosModalProps {
  show: boolean;
  onHide: () => void;
  atleta: Atleta | null;
}

const DocumentosModal: React.FC<DocumentosModalProps> = ({ show, onHide, atleta }) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<Documento['tipo']>('comprovante-residencia');
  const { user } = useAuth();

  useEffect(() => {
    if (show && atleta) {
      loadDocumentos();
    }
  }, [show, atleta]);

  const loadDocumentos = async () => {
    if (!atleta?.id) return;
    
    try {
      setLoading(true);
      const docs = await documentService.listDocuments(atleta.id);
      setDocumentos(docs);
    } catch (error) {
      toast.error('Erro ao carregar documentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !atleta?.id) return;

    try {
      setUploading(true);
      await documentService.uploadDocument(atleta.id, selectedFile, selectedDocumentType);
      toast.success('Documento enviado com sucesso!');
      setSelectedFile(null);
      setSelectedDocumentType('comprovante-residencia');
      loadDocumentos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documento: Documento) => {
    try {
      // Usar o novo sistema de URLs temporárias
      await documentService.downloadWithTemporaryUrl(documento);
      toast.success('Download iniciado com sucesso!');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleDelete = async (documento: Documento) => {
    if (!window.confirm(`Tem certeza que deseja excluir o documento "${documento.nomeArquivo}"?`)) {
      return;
    }

    try {
      const savedFileName = documento.nomeArquivoSalvo || documento.nomeArquivo;
      const filePath = `${atleta?.id}/${documento.tipo}/${savedFileName}`;
      await documentService.deleteDocument(filePath);
      toast.success('Documento excluído com sucesso!');
      loadDocumentos();
    } catch (error) {
      toast.error('Erro ao excluir documento');
    }
  };

  const handleTestConnection = async () => {
    try {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        toast.success('✅ Conectividade com Supabase OK!');
      } else {
        toast.error('❌ Problema na conectividade com Supabase');
      }
    } catch (error) {
      toast.error('❌ Erro ao testar conectividade');
    }
  };

  const getDocumentTypeIcon = (tipo: Documento['tipo']) => {
    switch (tipo) {
      case 'comprovante-residencia':
        return <FaFileAlt className="text-primary" />;
      case 'foto-3x4':
        return <FaImage className="text-success" />;
      case 'certificado-adel':
        return <FaCertificate className="text-warning" />;
      default:
        return <FaFileAlt />;
    }
  };

  const getDocumentTypeLabel = (tipo: Documento['tipo']) => {
    switch (tipo) {
      case 'comprovante-residencia':
        return 'Comprovante de Residência';
      case 'foto-3x4':
        return 'Foto 3x4';
      case 'certificado-adel':
        return 'Certificado ADEL';
      default:
        return tipo;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (!atleta) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          📁 Documentos do Atleta: {atleta.nome}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Seção de Upload */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <FaUpload className="me-2" />
              Anexar Novo Documento
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Documento *</Form.Label>
                  <Form.Select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value as Documento['tipo'])}
                  >
                    <option value="comprovante-residencia">Comprovante de Residência</option>
                    <option value="foto-3x4">Foto 3x4</option>
                    <option value="certificado-adel">Certificado ADEL</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Arquivo *</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileSelect}
                    accept={selectedDocumentType === 'foto-3x4' ? 'image/*' : 
                           selectedDocumentType === 'comprovante-residencia' ? '.pdf,.png,.jpg,.jpeg,.gif,.bmp' :
                           '.pdf,.png,.jpg,.jpeg'}
                  />
                  <Form.Text className="text-muted">
                    Tamanho máximo: 20MB
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                {selectedFile && (
                  <Badge bg="info" className="me-2">
                    <FaCheck className="me-1" />
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </Badge>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FaUpload className="me-2" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Lista de Documentos */}
        <Card>
          <Card.Header>
            <h6 className="mb-0">
              <FaFileAlt className="me-2" />
              Documentos Anexados ({documentos.length})
            </h6>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </Spinner>
              </div>
            ) : documentos.length === 0 ? (
              <Alert variant="info" className="text-center">
                Nenhum documento anexado ainda.
              </Alert>
            ) : (
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Nome do Arquivo</th>
                    <th>Tamanho</th>
                    <th>Data Upload</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((documento, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg="light" text="dark">
                          {getDocumentTypeIcon(documento.tipo)}
                          <span className="ms-2">{getDocumentTypeLabel(documento.tipo)}</span>
                        </Badge>
                      </td>
                      <td>{documento.nomeArquivo}</td>
                      <td>{formatFileSize(documento.tamanho)}</td>
                      <td>{formatDate(documento.dataUpload)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleDownload(documento)}
                            title="Baixar"
                          >
                            <FaDownload />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(documento)}
                            title="Excluir"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentosModal;
