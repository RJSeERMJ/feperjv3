import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  ProgressBar,
  ListGroup,
  Badge,
  Row,
  Col,
  Card
} from 'react-bootstrap';
import { FaUpload, FaDownload, FaTrash, FaEye, FaFilePdf, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { FileUploadService, UploadedFile, FileUploadProgress } from '../services/fileUploadService';
import { Atleta } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface DocumentUploadModalProps {
  show: boolean;
  onHide: () => void;
  atleta: Atleta | null;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  show,
  onHide,
  atleta
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [files, setFiles] = useState<{
    comprovanteResidencia?: UploadedFile[];
    foto3x4?: UploadedFile[];
  }>({});
  const [loading, setLoading] = useState(false);
  
  const comprovanteRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show && atleta) {
      loadFiles();
    }
  }, [show, atleta]);

  const loadFiles = async () => {
    if (!atleta?.id) return;
    
    try {
      setLoading(true);
      const atletaFiles = await FileUploadService.listAtletaFiles(atleta.id);
      setFiles(atletaFiles);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    fileType: 'comprovanteResidencia' | 'foto3x4'
  ) => {
    if (!atleta?.id) return;

    try {
      setUploading(true);
      
      await FileUploadService.uploadFile(
        file,
        atleta.id,
        fileType,
        (progress) => {
          setUploadProgress(progress);
          if (progress.status === 'error') {
            toast.error(progress.error || 'Erro no upload');
          }
        }
      );

      toast.success('Arquivo enviado com sucesso!');
      await loadFiles(); // Recarregar lista de arquivos
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro no upload');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleComprovanteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'comprovanteResidencia');
    }
    // Limpar input
    if (comprovanteRef.current) {
      comprovanteRef.current.value = '';
    }
  };

  const handleFotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'foto3x4');
    }
    // Limpar input
    if (fotoRef.current) {
      fotoRef.current.value = '';
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      await FileUploadService.downloadFile(file.url, file.name);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download');
    }
  };

  const handleDelete = async (file: UploadedFile, fileType: 'comprovanteResidencia' | 'foto3x4') => {
    if (!atleta?.id) return;

    if (!window.confirm(`Tem certeza que deseja excluir o arquivo "${file.name}"?`)) {
      return;
    }

    try {
      // Extrair caminho do arquivo da URL
      const filePath = `atletas/${atleta.id}/${fileType}/${file.name}`;
      await FileUploadService.deleteFile(filePath);
      
      toast.success('Arquivo excluído com sucesso!');
      await loadFiles(); // Recarregar lista
      
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const renderFileList = (files: UploadedFile[], fileType: 'comprovanteResidencia' | 'foto3x4') => {
    if (files.length === 0) {
      return (
        <Alert variant="info" className="text-center">
          Nenhum {fileType === 'comprovanteResidencia' ? 'comprovante de residência' : 'foto 3x4'} anexado.
        </Alert>
      );
    }

    return (
      <ListGroup>
        {files.map((file, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {FileUploadService.isPDF(file.type) ? (
                <FaFilePdf className="text-danger me-2" />
              ) : (
                <FaImage className="text-primary me-2" />
              )}
              <div>
                <div className="fw-bold">{file.name}</div>
                                 <small className="text-muted">
                   {file.size > 0 ? FileUploadService.formatFileSize(file.size) : 'Tamanho não disponível'} • 
                   {file.uploadedAt.toLocaleDateString('pt-BR')}
                 </small>
              </div>
            </div>
            <div>
              {user?.tipo === 'admin' && (
                <>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleDownload(file)}
                  >
                    <FaDownload />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(file, fileType)}
                  >
                    <FaTrash />
                  </Button>
                </>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                className="ms-2"
                onClick={() => window.open(file.url, '_blank')}
              >
                <FaEye />
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  if (!atleta) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          📎 Documentos do Atleta: {atleta.nome}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Upload de Comprovante de Residência */}
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">
                  <FaFilePdf className="text-danger me-2" />
                  Comprovante de Residência (PDF)
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Selecionar arquivo PDF</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      ref={comprovanteRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleComprovanteUpload}
                      disabled={uploading}
                    />
                    <Button
                      variant="primary"
                      onClick={() => comprovanteRef.current?.click()}
                      disabled={uploading}
                    >
                      <FaUpload />
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Apenas arquivos PDF são aceitos. Tamanho máximo: 10MB
                  </Form.Text>
                </Form.Group>

                {uploadProgress && uploadProgress.fileName && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>{uploadProgress.fileName}</small>
                      <small>{uploadProgress.progress}%</small>
                    </div>
                    <ProgressBar 
                      now={uploadProgress.progress} 
                      variant={uploadProgress.status === 'error' ? 'danger' : 'success'}
                    />
                  </div>
                )}

                {renderFileList(files.comprovanteResidencia || [], 'comprovanteResidencia')}
              </Card.Body>
            </Card>

            {/* Upload de Foto 3x4 */}
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  <FaImage className="text-primary me-2" />
                  Foto 3x4 (JPG/PNG)
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Selecionar imagem</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      ref={fotoRef}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFotoUpload}
                      disabled={uploading}
                    />
                    <Button
                      variant="primary"
                      onClick={() => fotoRef.current?.click()}
                      disabled={uploading}
                    >
                      <FaUpload />
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Apenas arquivos JPG, JPEG ou PNG são aceitos. Tamanho máximo: 10MB
                  </Form.Text>
                </Form.Group>

                {renderFileList(files.foto3x4 || [], 'foto3x4')}
              </Card.Body>
            </Card>

            {/* Informações de Permissão */}
            {user?.tipo !== 'admin' && (
              <Alert variant="info" className="mt-3">
                <strong>ℹ️ Informação:</strong> Você pode fazer upload de documentos. 
                Apenas administradores podem fazer download e exclusão dos arquivos.
              </Alert>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentUploadModal;
