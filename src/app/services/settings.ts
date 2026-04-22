import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'stock_chart_settings';

interface AppSettings {
  apiKey: string;
}

const DEFAULTS: AppSettings = {
  apiKey: '',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings: AppSettings;

  readonly apiKey = signal('');

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.settings = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      this.settings = { ...DEFAULTS };
    }
    this.apiKey.set(this.settings.apiKey);
  }

  saveApiKey(key: string) {
    this.settings.apiKey = key;
    this.apiKey.set(key);
    this.persist();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }
}
