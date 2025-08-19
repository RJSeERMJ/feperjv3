import { google } from "googleapis";

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_KEY);

  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive"]
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "fileId é obrigatório" });
  }

  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileId}"`);

    response.data
      .on("end", () => {
        console.log("Download concluído");
      })
      .on("error", (err) => {
        console.error("Erro no download:", err);
        res.status(500).end("Erro no download");
      })
      .pipe(res);
  } catch (error) {
    console.error("Erro download:", error);
    return res.status(500).json({ error: error.message });
  }
}
