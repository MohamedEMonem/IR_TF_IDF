export type CorpusMetadata = {
  total_documents: number;
  unique_terms: number;
  document_frequency: Record<string, number>;
  idf: Record<string, number>;
};
