export interface Tag {
  tagId?: string;
  tagName: string;
  initialDate: string | Date;
  isActive?: string;
  createdDate?: string;
  modifiedBy?: string | null;
  modifiedDate?: string | null;
  deletedBy?: string | null;
  deletedDate?: string | null;
}

export interface CreateTagRequest {
  tagName: string;
  initialDate: string;
}

export interface UpdateTagRequest {
  tagId: string;
  tagName: string;
  initialDate: string;
  modifiedBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}
