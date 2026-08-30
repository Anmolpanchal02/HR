export interface StoredFile {
  storageKey: string;
  size: number;
}

export interface FileStorageProvider {
  save(params: {
    organizationId: string;
    fileName: string;
    buffer: Buffer;
  }): Promise<StoredFile>;

  read(storageKey: string): Promise<Buffer>;

  delete(storageKey: string): Promise<void>;
}
