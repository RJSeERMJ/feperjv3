import { testConnection } from './googleAuth';

export default async function handler(req, res) {
  console.log("🧪 Test API chamada - Método:", req.method);
  
  if (req.method === "GET") {
    try {
      // Testar conexão com Google Drive
      const driveConnection = await testConnection();
      
      return res.status(200).json({ 
        message: "API de teste funcionando!",
        method: req.method,
        timestamp: new Date().toISOString(),
        env: {
          hasGoogleServiceKey: !!process.env.GOOGLE_SERVICE_KEY,
          hasGoogleDriveFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID
        },
        googleDrive: {
          connected: driveConnection,
          serviceAccount: "feperj@feperj-2025-469423.iam.gserviceaccount.com",
          projectId: "feperj-2025-469423"
        }
      });
    } catch (error) {
      console.error("❌ Erro no teste:", error);
      return res.status(500).json({
        message: "Erro no teste",
        error: error.message
      });
    }
  }
  
  if (req.method === "POST") {
    return res.status(200).json({ 
      message: "POST funcionando!",
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ 
    error: "Método não permitido. Use GET ou POST.",
    allowedMethods: ["GET", "POST"]
  });
}
