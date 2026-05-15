export type DocumentResponse = {
  doc_id: number;
  name: string;
  path: string;
  text: string;
};

export type DocumentApiResponse = DocumentResponse | Blob;
