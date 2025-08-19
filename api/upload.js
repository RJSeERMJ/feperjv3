import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // ❗ necessário pro formidable
  },
};

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const file = files.file[0]; // input "file" vindo do form
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

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

    return res.status(200).json({
      success: true,
      file: response.data,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({ error: error.message });
  }
}
