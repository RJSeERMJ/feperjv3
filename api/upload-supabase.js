import { createClient } from '@supabase/supabase-js';
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configuração do Supabase
const supabaseUrl = 'https://kamgocrdbdwjryvcavuo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não configurada');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_CONFIG = {
  BUCKET_NAME: 'feperj-documents',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
};

export default async function handler(req, res) {
  console.log("🚀 Upload Supabase API chamada - Método:", req.method);
  
  if (req.method !== "POST") {
    console.log("❌ Método não permitido:", req.method);
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    console.log("📁 Processando upload...");
    
    const form = formidable({
      maxFileSize: STORAGE_CONFIG.MAX_FILE_SIZE,
      keepExtensions: true
    });
    
    const [fields, files] = await form.parse(req);
    
    console.log("📋 Campos recebidos:", Object.keys(fields));
    console.log("📁 Arquivos recebidos:", Object.keys(files));

    if (!files.file || !files.file[0]) {
      console.log("❌ Nenhum arquivo encontrado");
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const file = files.file[0];
    const { atletaId, atletaNome, fileType } = fields;

    console.log("📄 Arquivo:", {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      path: file.filepath,
      atletaId: atletaId?.[0],
      atletaNome: atletaNome?.[0],
      fileType: fileType?.[0]
    });

    // Validar arquivo
    if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${STORAGE_CONFIG.ALLOWED_TYPES.join(', ')}` 
      });
    }

    if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: `Arquivo muito grande. Tamanho máximo: ${STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB` 
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = file.originalFilename.split('.').pop();
    const sanitizedName = (atletaNome?.[0] || 'atleta').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedName}_${atletaId?.[0] || 'unknown'}_${timestamp}.${extension}`;
    
    // Criar caminho baseado no tipo
    const folder = getFolderPath(fileType?.[0]);
    const filePath = `${folder}/${fileName}`;

    console.log("📁 Caminho do arquivo:", filePath);

    // Ler arquivo
    const fileBuffer = fs.readFileSync(file.filepath);

    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("❌ Erro no upload:", error);
      return res.status(500).json({ 
        error: `Erro no upload: ${error.message}` 
      });
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log("✅ Upload concluído:", data.path);

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(file.filepath);
    } catch (cleanupError) {
      console.warn("⚠️ Erro ao limpar arquivo temporário:", cleanupError);
    }

    return res.status(200).json({
      success: true,
      file: {
        id: data.path,
        name: file.originalFilename,
        path: data.path,
        url: urlData.publicUrl,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Erro no upload:", error);
    
    return res.status(500).json({ 
      error: `Erro no upload: ${error.message}` 
    });
  }
}

function getFolderPath(fileType) {
  switch (fileType) {
    case 'comprovanteResidencia':
      return 'comprovantes-residencia';
    case 'foto3x4':
      return 'fotos-3x4';
    case 'identidade':
      return 'identidades';
    case 'certificadoAdel':
      return 'certificados-adel';
    default:
      return 'outros';
  }
}
