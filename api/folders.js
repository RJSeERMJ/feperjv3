import { google } from 'googleapis';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔧 Gerenciando pastas com nova autenticação...');

    // Usar nova autenticação
    const auth = getAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const { action, folderName, parentId, folderId } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Ação não especificada' });
    }

    console.log('📋 Ação solicitada:', action);

    switch (action) {
      case 'create':
        if (!folderName || !parentId) {
          return res.status(400).json({ error: 'Nome da pasta e ID do pai são obrigatórios' });
        }

        console.log('📁 Criando pasta:', folderName, 'em:', parentId);

        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId]
        };

        const createdFolder = await drive.files.create({
          resource: folderMetadata,
          fields: 'id,name'
        });

        console.log('✅ Pasta criada:', createdFolder.data.id);
        res.status(200).json({
          success: true,
          folder: createdFolder.data
        });
        break;

      case 'find':
        if (!folderName || !parentId) {
          return res.status(400).json({ error: 'Nome da pasta e ID do pai são obrigatórios' });
        }

        console.log('🔍 Buscando pasta:', folderName, 'em:', parentId);

        const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder'`;
        const foundFolders = await drive.files.list({
          q: query,
          fields: 'files(id,name)'
        });

        console.log('📁 Pastas encontradas:', foundFolders.data.files.length);

        res.status(200).json({
          success: true,
          folders: foundFolders.data.files || []
        });
        break;

      case 'list':
        if (!folderId) {
          return res.status(400).json({ error: 'ID da pasta é obrigatório' });
        }

        console.log('📋 Listando arquivos da pasta:', folderId);

        const files = await drive.files.list({
          q: `'${folderId}' in parents`,
          fields: 'files(id,name,mimeType,size,createdTime,webViewLink,webContentLink)'
        });

        console.log('📄 Arquivos encontrados:', files.data.files.length);

        res.status(200).json({
          success: true,
          files: files.data.files || []
        });
        break;

      default:
        res.status(400).json({ error: 'Ação não reconhecida' });
    }

  } catch (error) {
    console.error('❌ Erro ao gerenciar pastas:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
}
