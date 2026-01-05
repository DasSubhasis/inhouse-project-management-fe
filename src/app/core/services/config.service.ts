import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any = {};
  
  constructor(private http: HttpClient) {
    console.log('[ConfigService] Constructor called');
  }

  loadConfig(): Promise<void> {
    console.log('[ConfigService] Starting to load config...');
    return firstValueFrom(this.http.get<any>('settings.json')).then(
      config => {
        console.log('[ConfigService] Config loaded successfully:', config);
        this.config = config;
        console.log('[ConfigService] apiBaseUrl set to:', this.config?.apiBaseUrl);
      },
      error => {
        console.error('[ConfigService] Failed to load config:', error);
        throw error;
      }
    );
  }

  get apiBaseUrl(): string {
    console.log('[ConfigService] Getting apiBaseUrl. Config object:', this.config);
    const url = this.config?.apiBaseUrl || '';
    console.log('[ConfigService] Returning apiBaseUrl:', url);
    if (!url) {
      console.warn('[ConfigService] WARNING: apiBaseUrl is empty! Config may not be loaded yet.');
    }
    return url;
  }
}
