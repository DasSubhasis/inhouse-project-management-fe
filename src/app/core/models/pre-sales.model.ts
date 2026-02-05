export interface ScopeVersion {
  version: number;
  scope: string;
  modifiedBy: string;
  modifiedDate: Date;
}

export interface StageHistory {
  stage: string;
  changedBy: string;
  changedDate: Date;
  remarks?: string;
}

export interface AdvancePayment {
  amount: number;
  date: Date;
  tallyEntryNumber: string;
  receivedBy: string;
  receivedDate: Date;
}

export interface SerialNumber {
  serialNumber: string;
  version?: string;
  recordedBy: string;
  recordedDate: Date;
}

export interface StatusUpdate {
  statusName: string;
  latestFileUrl?: string | null;
}

export interface AttachmentHistory {
  attachmentUrls: string[];
  uploadedById: string;
  uploadedByName: string;
  uploadedDate: string;
}

export type ProjectStage = 'Pre-Sales' | 'Quotation' | 'Confirmed' | 'Development' | 'Completed';

export const PROJECT_STAGES: ProjectStage[] = ['Pre-Sales', 'Quotation', 'Confirmed'];

export interface PreSales {
  projectNo: string;
  partyName: string;
  projectName: string;
  contactPerson: string;
  mobileNumber: string;
  emailId: string;
  agentName: string;
  projectValue: number;
  scopeOfDevelopment: string;
  currentStage: ProjectStage;
  assignedTo?: string;
  scopeHistory?: ScopeVersion[];
  stageHistory?: StageHistory[];
  statusUpdates?: StatusUpdate[];
  advancePayments?: AdvancePayment[];
  serialNumbers?: SerialNumber[];
  attachments?: File[];
  attachmentUrls?: string[];
  attachmentHistory?: AttachmentHistory[];
}
