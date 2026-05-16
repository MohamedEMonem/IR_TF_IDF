import type { CorpusMetadata } from "./meta";

export type UploadedFileInfo = {
  name: string;
  stored_name: string;
  path: string;
  size: number;
};

export type UploadResponse = {
  saved_files: UploadedFileInfo[];
  corpus: CorpusMetadata;
};
