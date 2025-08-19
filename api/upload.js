import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // ❗ necessário pro formidable
  },
};

function getAuth() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_KEY);

    return new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/drive"]
    );
  } catch (error) {
    console.error("❌ Erro ao configurar autenticação:", error);
    throw new Error("Erro na configuração de autenticação do Google Drive");
  }
}

export default async function handler(req, res) {
  console.log("🚀 Upload API chamada - Método:", req.method);
  
  if (req.method !== "POST") {
    console.log("❌ Método não permitido:", req.method);
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    console.log("📁 Processando upload...");
    
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
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
    console.log("📄 Arquivo:", {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      path: file.filepath
    });

    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    console.log("☁️ Fazendo upload para Google Drive...");

    const response = await drive.files.create({
      requestBody: {
        name: file.originalFilename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // pasta do Drive
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      },
      fields: "id, name, webViewLink, webContentLink",
    });

    console.log("✅ Upload concluído:", response.data.id);

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(file.filepath);
    } catch (cleanupError) {
      console.warn("⚠️ Erro ao limpar arquivo temporário:", cleanupError);
    }

    return res.status(200).json({
      success: true,
      file: response.data,
    });
  } catch (error) {
    console.error("❌ Erro no upload:", error);
    
    // Verificar se é erro de autenticação
    if (error.message.includes("authentication") || error.message.includes("credentials")) {
      return res.status(500).json({ 
        error: "Erro de autenticação com Google Drive. Verifique as credenciais." 
      });
    }
    
    // Verificar se é erro de pasta
    if (error.message.includes("folder") || error.message.includes("parent")) {
      return res.status(500).json({ 
        error: "Erro na pasta do Google Drive. Verifique o GOOGLE_DRIVE_FOLDER_ID." 
      });
    }
    
    return res.status(500).json({ 
      error: `Erro no upload: ${error.message}` 
    });
  }
}
