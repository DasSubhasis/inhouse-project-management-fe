export interface ScopeVersion {
  version: number;
  scope: string;
  modifiedBy: string;
  modifiedDate: Date;
}

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
  scopeHistory?: ScopeVersion[];
  attachments?: File[];
  attachmentUrls?: string[];
}
