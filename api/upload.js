import { google } from "googleapis";
import stream from "stream";

// We disable body parsing so Vercel gives us the raw PDF stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Read the raw stream into a buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 2. Validate environment variables
    if (!process.env.GOOGLE_CREDENTIALS || !process.env.FOLDER_ID) {
      return res.status(500).json({ error: "Missing Google Drive credentials or Folder ID in Vercel." });
    }

    // 3. Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 4. Convert Buffer to Stream for Google Drive API
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    // 5. Upload the file
    const response = await drive.files.create({
      requestBody: {
        name: `Document-${Date.now()}.pdf`,
        mimeType: "application/pdf",
        parents: [process.env.FOLDER_ID],
      },
      media: {
        mimeType: "application/pdf",
        body: bufferStream,
      },
    });

    // 6. Return success response
    res.status(200).json({
      success: true,
      fileId: response.data.id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
}
