import { Injectable } from '@angular/core';
import { CallLog } from '../models/call-log.model';
import callLogsData from '../../data/call-logs.json';

@Injectable({
  providedIn: 'root'
})
export class CallLogService {
  private callLogs: CallLog[] = callLogsData as CallLog[];

  getCallLogs(): CallLog[] {
    return this.callLogs;
  }

  getCallLogById(id: number): CallLog | undefined {
    return this.callLogs.find(log => log.id === id);
  }

  getCallLogsByType(type: 'incoming' | 'outgoing' | 'missed'): CallLog[] {
    return this.callLogs.filter(log => log.type === type);
  }

  searchCallLogs(searchTerm: string): CallLog[] {
    const term = searchTerm.toLowerCase();
    return this.callLogs.filter(log =>
      log.name.toLowerCase().includes(term) ||
      log.phone.includes(term) ||
      log.notes.toLowerCase().includes(term)
    );
  }
}
