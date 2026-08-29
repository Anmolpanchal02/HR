export async function extractTxtText(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8");
}
