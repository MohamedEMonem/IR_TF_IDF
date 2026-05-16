export type RankRequest = {
  query: string;
  top_k?: number;
  page?: number;
  page_size?: number;
};

export type QueryDetail = {
  term: string;
  count: number;
  tf: number;
  df: number;
  idf: number;
  tfidf: number;
};

export type QueryAnalysis = {
  query: string;
  tokens: string[];
  term_counts: Record<string, number>;
  tf: Record<string, number>;
  vector: Record<string, number>;
  norm: number;
  details: QueryDetail[];
};

export type MatchedTerm = {
  term: string;
  doc_tf: number;
  doc_idf: number;
  doc_tfidf: number;
  query_tf: number;
  query_idf: number;
  query_tfidf: number;
};

export type RankedDocument = {
  doc_id: number;
  path: string;
  name: string;
  score: number;
  doc_length: number;
  doc_norm: number;
  snippet: string;
  matched_terms: string[];
  matched_details: MatchedTerm[];
};

export type RankCorpusSummary = {
  total_documents: number;
  unique_terms: number;
  top_k: number;
};

export type RankResponse = {
  query: QueryAnalysis;
  corpus: RankCorpusSummary;
  results: RankedDocument[];
  rank_time_ms: number;
};

export type Pagination = {
  page: number;
  page_size: number;
  total_matches: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

// extend RankResponse with optional pagination
export type RankResponseWithPagination = RankResponse & {
  pagination?: Pagination;
};
