// Read plain text from an uploaded .txt or .docx file (e.g. Zoom / Google Meet
// transcript exports). .docx is a ZIP of XML; we locate and inflate document.xml.

export async function readUploadedText(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".docx")) {
    try {
      return await readDocx(file);
    } catch {
      return "";
    }
  }
  return await file.text();
}

async function readDocx(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const xml = await extractZipEntry(buf, "word/document.xml");
  if (!xml) return "";
  const paragraphs = xml
    .split(/<w:p[ >]/)
    .map((segment) =>
      [...segment.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
        .map((m) => decodeXmlEntities(m[1] ?? ""))
        .join(""),
    )
    .filter((p) => p.trim().length > 0);
  return paragraphs.join("\n");
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function extractZipEntry(buf: Uint8Array, entryName: string): Promise<string | null> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  // End Of Central Directory record (0x06054b50), scanning backwards.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const cdOffset = dv.getUint32(eocd + 16, true);
  const cdCount = dv.getUint16(eocd + 10, true);
  const decoder = new TextDecoder();

  let p = cdOffset;
  for (let n = 0; n < cdCount; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = decoder.decode(buf.subarray(p + 46, p + 46 + nameLen));

    if (name === entryName) {
      const lNameLen = dv.getUint16(localOffset + 26, true);
      const lExtraLen = dv.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return decoder.decode(data);
      if (method === 8) return await inflateRaw(data);
      return null;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

async function inflateRaw(data: Uint8Array): Promise<string> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return await new Response(stream).text();
}
