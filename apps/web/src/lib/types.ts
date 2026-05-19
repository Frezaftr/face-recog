// Re-export everything from the shared-types package.
// Local components should import from here, not directly from @facesearch/shared-types,
// so we can extend or override types per-app if needed.
export type {
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  JwtPayload,
} from '@facesearch/shared-types';

export type {
  ImageStatus,
  ImageRecord,
  UploadImageResponse,
  PaginatedImages,
  PaginationParams,
} from '@facesearch/shared-types';

export type {
  BoundingBox,
  FaceRecord,
  FaceEmbedding,
} from '@facesearch/shared-types';

export type {
  SearchResultItem,
  SearchResponse,
  SearchQueryParams,
} from '@facesearch/shared-types';

export type { ApiError, ApiSuccessResponse, ApiResponse } from '@facesearch/shared-types';
