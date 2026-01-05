export interface CallLog {
  id: number;
  name: string;
  phone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: string;
  timestamp: string;
  status: 'completed' | 'missed';
  notes: string;
}
