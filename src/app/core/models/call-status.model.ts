export interface CallStatus {
  statusId?: string;
  statusName: string;
  description?: string;
  isActive?: string;
  createdDate?: string;
  modifiedBy?: string | null;
  modifiedDate?: string | null;
  deletedBy?: string | null;
  deletedDate?: string | null;
}

export interface CreateCallStatusRequest {
  statusName: string;
  description?: string;
}

export interface UpdateCallStatusRequest {
  statusId: string;
  statusName: string;
  description?: string;
  modifiedBy: string;
}
