import { Component, inject, output, signal } from '@angular/core';
import { SettingsService } from '../../services/settings';

export interface SearchParams {
  symbol: string;
  apiKey: string;
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y';
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss'
})
export class SearchBarComponent {
  private settingsSvc = inject(SettingsService);
  readonly search = output<SearchParams>();

  symbol = signal('AAPL');
  timeframe = signal<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y'>('3M');

  readonly timeframes: ('1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y')[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y'];

  get hasApiKey() {
    return !!this.settingsSvc.apiKey();
  }

  selectTimeframe(tf: SearchParams['timeframe']) {
    this.timeframe.set(tf);
    this.emit();
  }

  onSymbolEnter() {
    this.emit();
  }

  private emit() {
    const apiKey = this.settingsSvc.apiKey();
    if (!this.symbol() || !apiKey) return;
    this.search.emit({
      symbol: this.symbol().toUpperCase(),
      apiKey,
      timeframe: this.timeframe(),
    });
  }
}
