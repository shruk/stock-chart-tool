import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'stock_chart_settings';

interface AppSettings {
  apiKey: string;
  finnhubKey: string;
  fmpKey: string;
}

const DEFAULTS: AppSettings = { apiKey: '', finnhubKey: '', fmpKey: '' };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings: AppSettings;

  readonly apiKey = signal('');
  readonly finnhubKey = signal('');
  readonly fmpKey = signal('');

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.settings = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      this.settings = { ...DEFAULTS };
    }
    this.apiKey.set(this.settings.apiKey);
    this.finnhubKey.set(this.settings.finnhubKey);
    this.fmpKey.set(this.settings.fmpKey);
  }

  saveApiKey(key: string) {
    this.settings.apiKey = key;
    this.apiKey.set(key);
    this.persist();
  }

  saveFinnhubKey(key: string) {
    this.settings.finnhubKey = key;
    this.finnhubKey.set(key);
    this.persist();
  }

  saveFmpKey(key: string) {
    this.settings.fmpKey = key;
    this.fmpKey.set(key);
    this.persist();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }
}
