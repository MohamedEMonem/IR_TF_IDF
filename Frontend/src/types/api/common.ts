export type ApiError = {
  message: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  error: ApiError | null;
  meta: {
    path: string;
  };
};
