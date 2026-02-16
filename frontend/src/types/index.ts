export interface Model3D {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  originalFileUrl: string | null;
  originalFormat: string | null;
  glbFileUrl: string | null;
  thumbnailUrl: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  processingError: string | null;
  vertexCount: number | null;
  faceCount: number | null;
  fileSize: number | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
}

export interface UserSummary {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  modelId: string;
  userId: string;
  text: string;
  parentId: string | null;
  createdAt: string;
  user: UserSummary;
  replies?: Comment[];
}

export interface SharedLink {
  id: string;
  modelId: string;
  token: string;
  permission: "VIEW" | "COMMENT" | "DOWNLOAD";
  expiresAt: string | null;
  createdAt: string;
}

export interface ExportJob {
  id: string;
  modelId: string;
  targetFormat: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  resultUrl: string | null;
  error: string | null;
}

export interface UploadResponse {
  model_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface UploadStatus {
  task_id: string;
  status: string;
  model_id: string | null;
  error: string | null;
}
