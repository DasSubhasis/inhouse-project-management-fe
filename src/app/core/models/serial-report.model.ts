export interface SerialReport {
  userId: string;
  tagId: string;
  assignedBy: string;
  serialNo: string;
  flavor: string;
  skuName: string;
  versionName: string;
  dotnetId: string;
  tssDate: string | Date;
  contactName: string;
  email: string;
  mobile: string;
  alternateMobile: string;
  partyName: string;
  address1: string;
  address2?: string;
  address3?: string;
  address4?: string;
  pin: string;
  city: string;
  location: string;
  state: string;
  agentType: string;
  agentName: string;
}

export interface SerialReportSubmission {
  reports: SerialReport[];
  userId: string;
  tagId: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SerialReportResponse {
  fileDataId: string;
  serialNo: string;
  flavor: string;
  skuName: string;
  versionName: string;
  dotnetId: string;
  tssDate: string;
  contactName: string;
  email: string;
  mobile: string;
  alternateMobile: string;
  partyName: string;
  address1: string;
  address2?: string;
  address3?: string;
  address4?: string;
  pin: string;
  city: string;
  location: string;
  state: string;
  agentType: string;
  agentName: string;
  userId: string;
  tagId: string;
  assignedBy: string;
  tagName?: string;
  assignedByName?: string;
  createdAt: string;
  updatedAt: string;
}
