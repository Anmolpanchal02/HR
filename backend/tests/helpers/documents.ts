import type { InjectOptions } from "light-my-request";

import type { buildApp } from "../../src/app.js";

type App = Awaited<ReturnType<typeof buildApp>>;

export function buildMultipartPayload(
  fileName: string,
  content: Buffer | string,
  mimeType: string,
): { payload: string; headers: InjectOptions["headers"] } {
  const boundary = "----cursorformboundary";
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  const payload = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
    `Content-Type: ${mimeType}`,
    "",
    body.toString("binary"),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return {
    payload,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
  };
}

export async function uploadDocumentViaApi(
  app: App,
  token: string,
  fileName: string,
  content: Buffer | string,
  mimeType: string,
) {
  const multipart = buildMultipartPayload(fileName, content, mimeType);
  return app.inject({
    method: "POST",
    url: "/api/v1/documents",
    headers: {
      authorization: `Bearer ${token}`,
      ...multipart.headers,
    },
    payload: multipart.payload,
  });
}
