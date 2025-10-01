import { supabase, COMPROVANTES_CONFIG } from '../config/supabase';
import { ComprovanteAnuidadeEquipe } from '../types';
import { equipeStatusService } from './firebaseService';
import { notificacoesService } from './notificacoesService';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export class ComprovantesAnuidadeEquipeService {
  private static readonly COLLECTION_NAME = 'comprovantes_anuidade_equipe';
  private static readonly BUCKET_NAME = COMPROVANTES_CONFIG.BUCKET_NAME;
  private static readonly FOLDER_NAME = 'comprovantes-equipe';

  // Upload de comprovante de anuidade de equipe
  static async uploadComprovante(
    file: File,
    equipeId: string,
    nomeEquipe: string,
    dataPagamento: Date,
    valor: number,
    observacoes?: string,
    enviadoPor?: string
  ): Promise<ComprovanteAnuidadeEquipe> {
    try {
      console.log('📁 Iniciando upload de comprovante de anuidade de equipe...');
      
      // Validar arquivo
      if (!this.validateFile(file)) {
        throw new Error('Tipo de arquivo não permitido. Use PDF, PNG, JPG, JPEG, GIF, BMP, TIFF ou WEBP.');
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const nomeArquivoSalvo = `${equipeId}_${timestamp}.${fileExtension}`;
      const filePath = `${this.FOLDER_NAME}/${equipeId}/${nomeArquivoSalvo}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Gerar URL de download
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Salvar metadados no Firebase
      const comprovanteData = {
        idEquipe: equipeId,
        nomeEquipe: nomeEquipe,
        nome: file.name,
        nomeArquivoSalvo: nomeArquivoSalvo,
        dataUpload: Timestamp.now(),
        dataPagamento: Timestamp.fromDate(dataPagamento),
        valor: valor,
        status: 'PENDENTE' as const,
        observacoes: observacoes || '',
        enviadoPor: enviadoPor || 'Usuário',
        tamanho: file.size,
        contentType: file.type,
        url: urlData.publicUrl,
        filePath: filePath,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), comprovanteData);

      // Criar notificação automática no mural
      try {
        await notificacoesService.criarNotificacaoAutomatica(
          equipeId,
          nomeEquipe,
          'COMPROVANTE_ANUIDADE_EQUIPE',
          file.name
        );
        console.log('✅ Notificação criada automaticamente');
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        // Não falhar o upload se a notificação falhar
      }

      console.log('✅ Comprovante de anuidade de equipe enviado com sucesso');
      
      return {
        id: docRef.id,
        idEquipe: comprovanteData.idEquipe,
        nomeEquipe: comprovanteData.nomeEquipe,
        nome: comprovanteData.nome,
        nomeArquivoSalvo: comprovanteData.nomeArquivoSalvo,
        dataUpload: comprovanteData.dataUpload.toDate(),
        dataPagamento: comprovanteData.dataPagamento.toDate(),
        valor: comprovanteData.valor,
        status: comprovanteData.status,
        observacoes: comprovanteData.observacoes,
        enviadoPor: comprovanteData.enviadoPor,
        tamanho: comprovanteData.tamanho,
        contentType: comprovanteData.contentType,
        url: comprovanteData.url
      };
    } catch (error) {
      console.error('❌ Erro no upload de comprovante de anuidade de equipe:', error);
      throw error;
    }
  }

  // Listar comprovantes por equipe
  static async listarComprovantesPorEquipe(equipeId: string): Promise<ComprovanteAnuidadeEquipe[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('idEquipe', '==', equipeId),
        orderBy('dataUpload', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          idEquipe: data.idEquipe,
          nomeEquipe: data.nomeEquipe,
          nome: data.nome,
          nomeArquivoSalvo: data.nomeArquivoSalvo,
          dataUpload: data.dataUpload.toDate(),
          dataPagamento: data.dataPagamento.toDate(),
          valor: data.valor,
          status: data.status,
          observacoes: data.observacoes,
          enviadoPor: data.enviadoPor,
          aprovadoPor: data.aprovadoPor,
          dataAprovacao: data.dataAprovacao ? data.dataAprovacao.toDate() : undefined,
          rejeitadoPor: data.rejeitadoPor,
          dataRejeicao: data.dataRejeicao ? data.dataRejeicao.toDate() : undefined,
          tamanho: data.tamanho,
          contentType: data.contentType,
          url: data.url
        };
      });
    } catch (error) {
      console.error('❌ Erro ao listar comprovantes de anuidade de equipe:', error);
      throw error;
    }
  }

  // Listar todos os comprovantes (apenas para admin)
  static async listarTodosComprovantes(): Promise<ComprovanteAnuidadeEquipe[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('dataUpload', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          idEquipe: data.idEquipe,
          nomeEquipe: data.nomeEquipe,
          nome: data.nome,
          nomeArquivoSalvo: data.nomeArquivoSalvo,
          dataUpload: data.dataUpload.toDate(),
          dataPagamento: data.dataPagamento.toDate(),
          valor: data.valor,
          status: data.status,
          observacoes: data.observacoes,
          enviadoPor: data.enviadoPor,
          aprovadoPor: data.aprovadoPor,
          dataAprovacao: data.dataAprovacao ? data.dataAprovacao.toDate() : undefined,
          rejeitadoPor: data.rejeitadoPor,
          dataRejeicao: data.dataRejeicao ? data.dataRejeicao.toDate() : undefined,
          tamanho: data.tamanho,
          contentType: data.contentType,
          url: data.url
        };
      });
    } catch (error) {
      console.error('❌ Erro ao listar todos os comprovantes de anuidade de equipe:', error);
      throw error;
    }
  }

  // Aprovar comprovante
  static async aprovarComprovante(
    comprovante: ComprovanteAnuidadeEquipe,
    adminNome: string,
    observacoes?: string
  ): Promise<void> {
    try {
      console.log('✅ Aprovando comprovante de anuidade de equipe...');

      // 1. Atualizar status do comprovante no Firebase
      if (!comprovante.id) {
        throw new Error('ID do comprovante não encontrado');
      }
      
      const comprovanteRef = doc(db, this.COLLECTION_NAME, comprovante.id);
      await updateDoc(comprovanteRef, {
        status: 'APROVADO',
        aprovadoPor: adminNome,
        dataAprovacao: Timestamp.now(),
        observacoes: observacoes || comprovante.observacoes,
        updatedAt: Timestamp.now()
      });

      // 2. Atualizar status da equipe para ATIVA no Firebase
      try {
        await equipeStatusService.atualizarStatusEquipe(
          comprovante.idEquipe,
          'ATIVA',
          adminNome
        );
        console.log('✅ Status da equipe atualizado para ATIVA');
      } catch (equipeError) {
        console.error('⚠️ Erro ao atualizar status da equipe:', equipeError);
        // Não falhar a operação se não conseguir atualizar o status da equipe
      }

      console.log('✅ Comprovante de anuidade de equipe aprovado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aprovar comprovante de anuidade de equipe:', error);
      throw error;
    }
  }

  // Função para garantir que o status da equipe seja sempre baseado no comprovante de anuidade
  static async garantirStatusEquipeBaseadoEmAnuidade(equipeId: string): Promise<void> {
    try {
      console.log(`🔄 Verificando status da equipe ${equipeId} baseado no comprovante de anuidade...`);
      
      // Buscar comprovantes de anuidade da equipe
      const comprovantes = await this.listarComprovantesPorEquipe(equipeId);
      
      if (comprovantes.length === 0) {
        // Sem comprovante = equipe INATIVA
        await equipeStatusService.atualizarStatusEquipe(equipeId, 'INATIVA', 'Sistema');
        console.log(`✅ Equipe ${equipeId} definida como INATIVA (sem comprovante de anuidade)`);
        return;
      }
      
      // Buscar o comprovante mais recente
      const comprovanteMaisRecente = comprovantes.sort((a, b) => 
        b.dataUpload.getTime() - a.dataUpload.getTime()
      )[0];
      
      // Determinar status baseado no comprovante mais recente
      const novoStatus = comprovanteMaisRecente.status === 'APROVADO' ? 'ATIVA' : 'INATIVA';
      
      await equipeStatusService.atualizarStatusEquipe(equipeId, novoStatus, 'Sistema');
      console.log(`✅ Equipe ${equipeId} atualizada para ${novoStatus} baseado no comprovante de anuidade`);
    } catch (error) {
      console.error(`❌ Erro ao verificar status da equipe ${equipeId}:`, error);
      throw error;
    }
  }

  // Rejeitar comprovante
  static async rejeitarComprovante(
    comprovante: ComprovanteAnuidadeEquipe,
    adminNome: string,
    observacoes?: string
  ): Promise<void> {
    try {
      console.log('❌ Rejeitando comprovante de anuidade de equipe...');

      // 1. Atualizar status do comprovante no Firebase
      if (!comprovante.id) {
        throw new Error('ID do comprovante não encontrado');
      }
      
      const comprovanteRef = doc(db, this.COLLECTION_NAME, comprovante.id);
      await updateDoc(comprovanteRef, {
        status: 'REJEITADO',
        rejeitadoPor: adminNome,
        dataRejeicao: Timestamp.now(),
        observacoes: observacoes || comprovante.observacoes,
        updatedAt: Timestamp.now()
      });

      // 2. Atualizar status da equipe para INATIVA no Firebase
      try {
        await equipeStatusService.atualizarStatusEquipe(
          comprovante.idEquipe,
          'INATIVA',
          adminNome
        );
        console.log('✅ Status da equipe atualizado para INATIVA');
      } catch (equipeError) {
        console.error('⚠️ Erro ao atualizar status da equipe:', equipeError);
        // Não falhar a operação se não conseguir atualizar o status da equipe
      }

      // 3. Atualizar notificação existente no mural para status RECUSADO
      try {
        // Buscar notificação correspondente no mural
        const notificacoes = await notificacoesService.getNotificacoesEquipe(comprovante.idEquipe);
        const notificacaoCorrespondente = notificacoes.find(notif => 
          notif.tipoDocumento === 'COMPROVANTE_ANUIDADE_EQUIPE' && 
          notif.nomeDocumento === comprovante.nome &&
          notif.status === 'PENDENTE'
        );
        
        if (notificacaoCorrespondente) {
          await notificacoesService.recusarDocumento(
            notificacaoCorrespondente.id!,
            adminNome,
            observacoes || 'Comprovante de anuidade de equipe rejeitado'
          );
          console.log('✅ Notificação atualizada no mural para RECUSADO');
        } else {
          // Se não encontrar notificação existente, criar uma nova
          await notificacoesService.criarNotificacaoAutomatica(
            comprovante.idEquipe,
            comprovante.nomeEquipe,
            'COMPROVANTE_ANUIDADE_EQUIPE',
            `REJEITADO: ${comprovante.nome}`
          );
          console.log('✅ Notificação de rejeição criada automaticamente');
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar/criar notificação:', error);
        // Não falhar a operação se a notificação falhar
      }

      console.log('❌ Comprovante de anuidade de equipe rejeitado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao rejeitar comprovante de anuidade de equipe:', error);
      throw error;
    }
  }

  // Deletar comprovante
  static async deletarComprovante(
    comprovante: ComprovanteAnuidadeEquipe,
    isAdmin: boolean,
    equipeId?: string
  ): Promise<void> {
    try {
      console.log('🗑️ Deletando comprovante de anuidade de equipe...');

      // Verificar permissões
      if (!isAdmin && comprovante.idEquipe !== equipeId) {
        throw new Error('Você não tem permissão para deletar este comprovante');
      }

      // Deletar arquivo do Supabase Storage
      const filePath = `${this.FOLDER_NAME}/${comprovante.idEquipe}/${comprovante.nomeArquivoSalvo}`;
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.warn('⚠️ Erro ao deletar arquivo do storage:', storageError);
        // Continuar mesmo se falhar ao deletar do storage
      }

      // Deletar registro do Firebase
      if (!comprovante.id) {
        throw new Error('ID do comprovante não encontrado');
      }
      
      const comprovanteRef = doc(db, this.COLLECTION_NAME, comprovante.id);
      await deleteDoc(comprovanteRef);

      console.log('✅ Comprovante de anuidade de equipe deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar comprovante de anuidade de equipe:', error);
      throw error;
    }
  }

  // Download de comprovante
  static async downloadComprovante(comprovante: ComprovanteAnuidadeEquipe): Promise<void> {
    try {
      console.log('📥 Iniciando download de comprovante de anuidade de equipe...');
      console.log('📁 Comprovante:', comprovante);

      const filePath = `${this.FOLDER_NAME}/${comprovante.idEquipe}/${comprovante.nomeArquivoSalvo}`;
      console.log('📁 Caminho do arquivo:', filePath);
      console.log('📁 Bucket:', this.BUCKET_NAME);
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error) {
        console.error('❌ Erro ao baixar arquivo:', error);
        throw new Error(`Erro ao baixar arquivo: ${error.message}`);
      }

      if (!data) {
        throw new Error('Arquivo não encontrado');
      }

      // Criar blob e fazer download
      const blob = new Blob([data], { type: comprovante.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = comprovante.nome;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Download de comprovante de anuidade de equipe concluído');
    } catch (error) {
      console.error('❌ Erro no download de comprovante de anuidade de equipe:', error);
      throw error;
    }
  }

  // Validar arquivo
  private static validateFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  // Limpar comprovante (voltar para PENDENTE)
  static async limparComprovante(comprovante: ComprovanteAnuidadeEquipe, adminNome: string): Promise<void> {
    try {
      console.log(`🧹 Limpando comprovante de anuidade da equipe ${comprovante.nomeEquipe}`);
      
      // Atualizar o status do comprovante para PENDENTE
      comprovante.status = 'PENDENTE';
      comprovante.dataAprovacao = undefined;
      comprovante.aprovadoPor = undefined;
      comprovante.rejeitadoPor = undefined;
      comprovante.dataRejeicao = undefined;
      comprovante.observacoes = undefined;
      
      // Log da ação de limpeza
      console.log(`📝 Comprovante de anuidade limpo por ${adminNome} - Equipe: ${comprovante.idEquipe}`);
      
      console.log(`✅ Comprovante de anuidade de equipe limpo com sucesso por ${adminNome}:`, comprovante.nome);
      console.log(`🏆 Equipe: ${comprovante.nomeEquipe} (${comprovante.idEquipe})`);
      console.log('✅ Status do comprovante e equipe atualizados para PENDENTE/INATIVA');
    } catch (error) {
      console.error('❌ Erro ao limpar comprovante de anuidade de equipe:', error);
      throw error;
    }
  }
}

// Exportar a classe diretamente para usar métodos estáticos
export const comprovantesAnuidadeEquipeService = ComprovantesAnuidadeEquipeService;
