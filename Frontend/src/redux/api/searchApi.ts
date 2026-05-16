import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiEnvelope,
  CorpusMetadata,
  DocumentApiResponse,
  DocumentResponse,
  HealthResponse,
  RankRequest,
  RankResponse,
  UploadResponse,
} from "../../types/api";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const searchApi = createApi({
  reducerPath: "searchApi",

  baseQuery: fetchBaseQuery({ baseUrl }),

  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => "/health",
      transformResponse: (response: ApiEnvelope<HealthResponse>) =>
        response.data,
    }),

    getMeta: builder.query<CorpusMetadata, void>({
      query: () => "/meta",
      transformResponse: (response: ApiEnvelope<CorpusMetadata>) =>
        response.data,
    }),

    rankDocuments: builder.mutation<RankResponse, RankRequest>({
      query: ({ query, top_k = 10 }) => ({
        url: "/rank",
        method: "POST",
        body: {
          query,
          top_k,
        },
      }),
      transformResponse: (response: ApiEnvelope<RankResponse>) => response.data,
    }),
    uploadDocuments: builder.mutation<UploadResponse, FormData>({
      query: (body) => ({
        url: "/upload",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<UploadResponse>) =>
        response.data,
    }),
    getDocument: builder.query<DocumentApiResponse | Blob, number>({
      query: (docId) => ({
        url: `/document/${docId}`,
        responseHandler: async (response) => {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/pdf")) {
            return response.blob();
          }

          return response.json();
        },
      }),
      transformResponse: (response: ApiEnvelope<DocumentResponse> | Blob) =>
        response instanceof Blob ? response : response.data,
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetMetaQuery,
  useRankDocumentsMutation,
  useUploadDocumentsMutation,
  useGetDocumentQuery,
} = searchApi;
