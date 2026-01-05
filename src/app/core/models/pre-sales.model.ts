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
}

export interface AdvancePayment {
  amount: number;
  date: Date;
  tallyEntryNumber: string;
  receivedBy: string;
  receivedDate: Date;
}

export type ProjectStage = 'Pre-Sales' | 'Quotation' | 'Confirmed' | 'Development' | 'Completed';

export const PROJECT_STAGES: ProjectStage[] = ['Pre-Sales', 'Quotation', 'Completed'];

export interface PreSales {
  projectNo: number;
  partyName: string;
  projectName: string;
  contactPerson: string;
  mobileNumber: string;
  emailId: string;
  agentName: string;
  projectValue: number;
  scopeOfDevelopment: string;
  currentStage: ProjectStage;
  scopeHistory?: ScopeVersion[];
  stageHistory?: StageHistory[];
  attachments?: File[];
  attachmentUrls?: string[];
}
