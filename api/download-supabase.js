import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://kamgocrdbdwjryvcavuo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não configurada');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_CONFIG = {
  BUCKET_NAME: 'feperj-documents'
};

export default async function handler(req, res) {
  console.log("📥 Download Supabase API chamada - Método:", req.method);
  
  if (req.method !== "GET") {
    console.log("❌ Método não permitido:", req.method);
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  const { filePath } = req.query;

  if (!filePath) {
    console.log("❌ filePath não fornecido");
    return res.status(400).json({ error: "filePath é obrigatório" });
  }

  try {
    console.log("📥 Iniciando download:", filePath);

    // Download do arquivo do Supabase
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .download(filePath);

    if (error) {
      console.error("❌ Erro no download:", error);
      return res.status(500).json({ 
        error: `Erro no download: ${error.message}` 
      });
    }

    // Obter informações do arquivo
    const { data: fileInfo } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .list('', {
        search: filePath
      });

    const fileName = filePath.split('/').pop() || 'download';

    console.log("✅ Download concluído:", fileName);

    // Configurar headers da resposta
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', data.size);

    // Enviar arquivo
    res.send(Buffer.from(await data.arrayBuffer()));

  } catch (error) {
    console.error("❌ Erro no download:", error);
    return res.status(500).json({ 
      error: `Erro no download: ${error.message}` 
    });
  }
}
