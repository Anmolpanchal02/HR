import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import type { FileStorageProvider, StoredFile } from "./storage.interface.js";

function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^\w.\-() ]+/g, "_");
  return base.slice(0, 200) || "document";
}

function resolveStoragePath(storageKey: string): string {
  const root = path.resolve(env.documentStoragePath);
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new AppError("Invalid storage path", 400);
  }
  return resolved;
}

export class LocalFileStorageProvider implements FileStorageProvider {
  async save(params: {
    organizationId: string;
    fileName: string;
    buffer: Buffer;
  }): Promise<StoredFile> {
    const safeName = sanitizeFileName(params.fileName);
    const hash = createHash("sha256").update(params.buffer).digest("hex").slice(0, 16);
    const storageKey = path.join(params.organizationId, `${Date.now()}-${hash}-${safeName}`);
    const absolutePath = resolveStoragePath(storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, params.buffer);

    return { storageKey, size: params.buffer.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(resolveStoragePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(resolveStoragePath(storageKey));
    } catch {
      // Ignore missing files during cleanup
    }
  }
}

export const fileStorage = new LocalFileStorageProvider();
