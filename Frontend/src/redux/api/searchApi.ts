import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiEnvelope,
  CorpusMetadata,
  DocumentApiResponse,
  DocumentResponse,
  HealthResponse,
  RankRequest,
  RankResponseWithPagination,
  UploadResponse,
} from "../../types/api";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const searchApi = createApi({
  reducerPath: "searchApi",

  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: [
    "Documents",
    "Status",
    "Meta",
    "Health",
    "Rank",
    "Upload",
    "Document",
  ],

  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/health",
      transformResponse: (response: ApiEnvelope<HealthResponse>) =>
        response?.data,
    }),

    getMeta: builder.query<CorpusMetadata, void>({
      query: () => "/meta",
      transformResponse: (response: ApiEnvelope<CorpusMetadata>) =>
        response?.data,
    }),

    rankDocuments: builder.mutation<RankResponseWithPagination, RankRequest>({
      query: ({ query, top_k = 10, page, page_size }) => ({
        url: "/rank",
        method: "POST",
        body: {
          query,
          top_k,
          page,
          page_size,
        },
      }),
      invalidatesTags: ["Rank"],
      transformResponse: (response: ApiEnvelope<RankResponseWithPagination>) =>
        response?.data,
    }),
    uploadDocuments: builder.mutation<UploadResponse, FormData>({
      query: (body) => ({
        url: "/upload",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Document", "Rank", "Meta"],
      transformResponse: (response: ApiEnvelope<UploadResponse>) =>
        response?.data,
    }),
    getDocument: builder.query<DocumentResponse, number>({
      query: (docId) => `/document/${docId}`,
      providesTags: (_result, _error, docId) => [
        { type: "Document", id: docId },
      ],
      transformResponse: (response: ApiEnvelope<DocumentResponse>) =>
        response?.data,
    }),

    getStatus: builder.query<{ is_indexing: boolean; status: string }, void>({
      query: () => "/status",
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetMetaQuery,
  useRankDocumentsMutation,
  useUploadDocumentsMutation,
  useGetDocumentQuery,
  useGetStatusQuery,
} = searchApi;
