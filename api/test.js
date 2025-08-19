export default async function handler(req, res) {
  console.log("🧪 Test API chamada - Método:", req.method);
  
  if (req.method === "GET") {
    return res.status(200).json({ 
      message: "API de teste funcionando!",
      method: req.method,
      timestamp: new Date().toISOString(),
      env: {
        hasGoogleServiceKey: !!process.env.GOOGLE_SERVICE_KEY,
        hasGoogleDriveFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID
      }
    });
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
