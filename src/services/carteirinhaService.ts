import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Atleta, Equipe } from '../types';
import { CONFIGURACAO_CARTEIRINHA } from '../config/carteirinhaConfig';
import { formatarData, gerarMatricula, limparNomeParaArquivo } from '../utils/textUtils';
import { supabase, MODELO_CARTEIRINHA_CONFIG } from '../config/supabase';

export interface CarteirinhaData {
  atleta: Atleta;
  equipe: Equipe;
  foto3x4?: string; // URL da foto 3x4
}

// Usar configuração do arquivo de configuração
const CONFIGURACAO_PADRAO = CONFIGURACAO_CARTEIRINHA;

// Função para testar conectividade com Supabase
export const testarConectividadeSupabase = async () => {
  try {
    console.log('🧪 Testando conectividade com Supabase...');
    
    // Testar listagem de buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return {
        success: false,
        error: `Erro ao listar buckets: ${bucketsError.message}`,
        buckets: []
      };
    }
    
    console.log('✅ Buckets encontrados:', buckets?.map(b => b.name));
    
    // Verificar se o bucket de modelos existe
    const bucketExiste = buckets?.some(bucket => bucket.name === MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME);
    
    if (!bucketExiste) {
      console.warn('⚠️ Bucket de modelos não encontrado:', MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME);
      return {
        success: false,
        error: `Bucket "${MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME}" não encontrado`,
        buckets: buckets?.map(b => b.name) || []
      };
    }
    
    console.log('✅ Bucket de modelos encontrado');
    
    // Testar listagem de arquivos no bucket
    const { data: files, error: filesError } = await supabase.storage
      .from(MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME)
      .list();
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
      return {
        success: false,
        error: `Erro ao listar arquivos: ${filesError.message}`,
        buckets: buckets?.map(b => b.name) || []
      };
    }
    
    console.log('✅ Arquivos encontrados:', files?.map(f => f.name));
    
    return {
      success: true,
      error: null,
      buckets: buckets?.map(b => b.name) || [],
      files: files?.map(f => f.name) || []
    };
  } catch (error) {
    console.error('❌ Erro geral na conectividade:', error);
    return {
      success: false,
      error: `Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      buckets: []
    };
  }
};

// Função para carregar modelo do Supabase
const carregarModelo = async (): Promise<Uint8Array> => {
  try {
    console.log('📄 Carregando modelo de carteirinha do Supabase...');
    
    // Listar arquivos no bucket
    const { data: files, error: listError } = await supabase.storage
      .from(MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME)
      .list();

    if (listError) {
      console.error('Erro ao listar arquivos do bucket:', listError);
      console.error('Detalhes do erro:', {
        message: listError.message
      });
      console.log('Tentando carregar modelo local como fallback...');
      return await carregarModeloLocal();
    }

    if (!files || files.length === 0) {
      console.log('Bucket está vazio, tentando modelo local...');
      return await carregarModeloLocal();
    }
    
    // Procurar pelo arquivo de modelo mais recente
    const modeloFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      console.log('Verificando arquivo:', file.name, 'Tipo:', file.metadata?.mimetype);
      return fileName.includes('carteirinha') && fileName.endsWith('.pdf');
    });

    // Ordenar por data de modificação (mais recente primeiro)
    modeloFiles.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const modeloFile = modeloFiles[0];
    
    if (!modeloFile) {
      console.log('Arquivos disponíveis:');
      files.forEach(file => {
        console.log(`- ${file.name} (${file.metadata?.mimetype || 'tipo desconhecido'})`);
      });
      console.log('Nenhum arquivo de modelo encontrado, tentando modelo local...');
      return await carregarModeloLocal();
    }

    console.log('📄 Modelo encontrado:', modeloFile.name);
    
    // Baixar o arquivo
    const { data, error: downloadError } = await supabase.storage
      .from(MODELO_CARTEIRINHA_CONFIG.BUCKET_NAME)
      .download(modeloFile.name);

    if (downloadError) {
      console.error('Erro ao baixar modelo:', downloadError);
      console.log('Tentando modelo local como fallback...');
      return await carregarModeloLocal();
    }

    if (!data) {
      console.error('Dados do modelo não encontrados');
      console.log('Tentando modelo local como fallback...');
      return await carregarModeloLocal();
    }

    // Converter para Uint8Array
    const arrayBuffer = await data.arrayBuffer();
    const modeloBytes = new Uint8Array(arrayBuffer);
    
    console.log('✅ Modelo carregado com sucesso do Supabase');
    return modeloBytes;
  } catch (error) {
    console.error('Erro ao carregar modelo do Supabase:', error);
    console.log('Tentando modelo local como fallback...');
    return await carregarModeloLocal();
  }
};

// Função para carregar modelo local como fallback
const carregarModeloLocal = async (): Promise<Uint8Array> => {
  try {
    console.log('📄 Carregando modelo local...');
    const response = await fetch('/modelos/carteirinha.pdf');
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar modelo local: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const modeloBytes = new Uint8Array(arrayBuffer);
    
    console.log('✅ Modelo local carregado com sucesso');
    return modeloBytes;
  } catch (error) {
    console.error('Erro ao carregar modelo local:', error);
    throw new Error('Não foi possível carregar o modelo de carteirinha');
  }
};

// Função para carregar imagem da foto 3x4
const carregarFoto3x4 = async (url: string): Promise<Uint8Array> => {
  try {
    console.log('📸 Carregando foto 3x4:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar foto: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const fotoBytes = new Uint8Array(arrayBuffer);
    
    console.log('✅ Foto 3x4 carregada com sucesso');
    return fotoBytes;
  } catch (error) {
    console.error('Erro ao carregar foto 3x4:', error);
    throw new Error('Não foi possível carregar a foto 3x4');
  }
};

// Função principal para gerar carteirinha
const gerarCarteirinha = async (data: CarteirinhaData): Promise<Uint8Array> => {
  try {
    console.log('🎯 Gerando carteirinha para:', data.atleta.nome);
    
    // Carregar modelo PDF
    const modeloBytes = await carregarModelo();
    const pdfDoc = await PDFDocument.load(modeloBytes);
    
    // Obter a primeira página do modelo
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      throw new Error('Modelo PDF não contém páginas');
    }
    
    const page = pages[0];
    const { width, height } = page.getSize();
    
    console.log('📄 Dimensões da página:', { width, height });
    
    // Carregar fonte padrão
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Configurações dos campos
    const campos = CONFIGURACAO_PADRAO.campos;
    
    // Preencher dados do atleta
    const nome = data.atleta.nome || '';
    const dataNascimento = data.atleta.dataNascimento ? formatarData(data.atleta.dataNascimento) : '';
    const equipe = data.equipe?.nomeEquipe || '';
    const validade = new Date().getFullYear().toString();
    const cidade = data.equipe?.cidade || '';
    const matricula = data.atleta.matricula || gerarMatricula(data.atleta.cpf);
    
    console.log('📝 Dados a serem preenchidos:', {
      nome,
      dataNascimento,
      equipe,
      validade,
      cidade,
      matricula
    });
    
    // Preencher campos de texto com cor branca
    console.log('🎨 Desenhando nome:', nome, 'em', campos.nome.x, campos.nome.y);
    page.drawText(nome, {
      x: campos.nome.x,
      y: campos.nome.y, // pdf-lib usa Y=0 no topo
      size: campos.nome.fontSize,
      font: boldFont,
      color: rgb(1, 1, 1) // Branco
    });
    
    console.log('🎨 Desenhando data:', dataNascimento, 'em', campos.dataNascimento.x, campos.dataNascimento.y);
    page.drawText(dataNascimento, {
      x: campos.dataNascimento.x,
      y: campos.dataNascimento.y,
      size: campos.dataNascimento.fontSize,
      font: font,
      color: rgb(1, 1, 1) // Branco
    });
    
    console.log('🎨 Desenhando equipe:', equipe, 'em', campos.equipe.x, campos.equipe.y);
    page.drawText(equipe, {
      x: campos.equipe.x,
      y: campos.equipe.y,
      size: campos.equipe.fontSize,
      font: font,
      color: rgb(1, 1, 1) // Branco
    });
    
    console.log('🎨 Desenhando validade:', validade, 'em', campos.validade.x, campos.validade.y);
    page.drawText(validade, {
      x: campos.validade.x,
      y: campos.validade.y,
      size: campos.validade.fontSize,
      font: font,
      color: rgb(1, 1, 1) // Branco
    });
    
    console.log('🎨 Desenhando cidade:', cidade, 'em', campos.cidade.x, campos.cidade.y);
    page.drawText(cidade, {
      x: campos.cidade.x,
      y: campos.cidade.y,
      size: campos.cidade.fontSize,
      font: font,
      color: rgb(1, 1, 1) // Branco
    });
    
    console.log('🎨 Desenhando matrícula:', matricula, 'em', campos.matricula.x, campos.matricula.y);
    page.drawText(matricula, {
      x: campos.matricula.x,
      y: campos.matricula.y,
      size: campos.matricula.fontSize,
      font: font,
      color: rgb(1, 1, 1) // Branco
    });
    
    // Inserir foto 3x4 se disponível
    if (data.foto3x4) {
      try {
        console.log('📸 Inserindo foto 3x4...');
        console.log('📸 URL da foto:', data.foto3x4);
        const fotoBytes = await carregarFoto3x4(data.foto3x4);
        console.log('📸 Bytes da foto carregados:', fotoBytes.length);
        
        // Determinar tipo de imagem
        let imageType: 'png' | 'jpg' = 'jpg';
        if (data.foto3x4.toLowerCase().includes('.png')) {
          imageType = 'png';
        }
        console.log('📸 Tipo de imagem detectado:', imageType);
        
        const image = imageType === 'png' 
          ? await pdfDoc.embedPng(fotoBytes)
          : await pdfDoc.embedJpg(fotoBytes);
        console.log('📸 Imagem embedada no PDF');
        
        // Calcular dimensões da foto (3x4 proporção)
        const fotoWidth = campos.foto.width;
        const fotoHeight = campos.foto.height;
        console.log('📸 Dimensões da foto:', { width: fotoWidth, height: fotoHeight });
        console.log('📸 Posição da foto:', { x: campos.foto.x, y: campos.foto.y });
        
        page.drawImage(image, {
          x: campos.foto.x,
          y: campos.foto.y, // pdf-lib usa Y=0 no topo
          width: fotoWidth,
          height: fotoHeight
        });
        
        console.log('✅ Foto 3x4 inserida com sucesso na posição:', campos.foto.x, campos.foto.y);
      } catch (error) {
        console.error('❌ Erro ao inserir foto 3x4:', error);
        // Continuar sem a foto se houver erro
      }
    } else {
      console.log('⚠️ Nenhuma foto 3x4 disponível para inserir');
    }
    
    // Salvar PDF
    const pdfBytes = await pdfDoc.save();
    console.log('✅ Carteirinha gerada com sucesso');
    
    return pdfBytes;
  } catch (error) {
    console.error('Erro ao gerar carteirinha:', error);
    throw new Error(`Erro ao gerar carteirinha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Função para gerar carteirinha em lote
const gerarCarteirinhasEmLote = async (dados: CarteirinhaData[]): Promise<Uint8Array[]> => {
  console.log(`🎯 Gerando ${dados.length} carteirinhas em lote...`);
  
  const carteirinhas: Uint8Array[] = [];
  
  for (let i = 0; i < dados.length; i++) {
    try {
      console.log(`📄 Gerando carteirinha ${i + 1}/${dados.length}: ${dados[i].atleta.nome}`);
      const carteirinha = await gerarCarteirinha(dados[i]);
      carteirinhas.push(carteirinha);
    } catch (error) {
      console.error(`Erro ao gerar carteirinha ${i + 1}:`, error);
      // Continuar com as outras carteirinhas
    }
  }
  
  console.log(`✅ ${carteirinhas.length} carteirinhas geradas com sucesso`);
  return carteirinhas;
};

// Função para baixar carteirinha individual
const baixarCarteirinha = (pdfBytes: Uint8Array, nomeAtleta: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `carteirinha-${limparNomeParaArquivo(nomeAtleta)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Função para baixar carteirinhas em lote
const baixarCarteirinhasEmLote = async (dados: CarteirinhaData[]) => {
  try {
    console.log('📦 Gerando carteirinhas em lote...');
    const carteirinhas = await gerarCarteirinhasEmLote(dados);
    
    // Baixar cada carteirinha individualmente
    carteirinhas.forEach((carteirinha, index) => {
      const atleta = dados[index];
      if (atleta) {
        baixarCarteirinha(carteirinha, atleta.atleta.nome);
      }
    });
    
    console.log('✅ Download em lote concluído');
  } catch (error) {
    console.error('Erro no download em lote:', error);
    throw error;
  }
};

// Exportar serviço
export const carteirinhaService = {
  carregarModelo,
  carregarModeloLocal,
  gerarCarteirinha,
  gerarCarteirinhasEmLote,
  baixarCarteirinha,
  baixarCarteirinhasEmLote,
  testarConectividadeSupabase,
  gerarMatricula
};