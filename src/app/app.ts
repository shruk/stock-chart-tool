import { Component, signal, inject } from '@angular/core';
import { SearchBarComponent, SearchParams } from './components/search-bar/search-bar';
import { StockChartComponent } from './components/stock-chart/stock-chart';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel';
import { PolygonService, Bar } from './services/polygon';
import { MockDataService } from './services/mock-data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SearchBarComponent, StockChartComponent, SettingsPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private polygonSvc = inject(PolygonService);
  private mockDataSvc = inject(MockDataService);

  bars = signal<Bar[]>([]);
  symbol = signal('');
  loading = signal(false);
  error = signal('');
  testMode = signal(false);

  showSMA20 = signal(true);
  showSMA50 = signal(true);
  showSMA100 = signal(false);
  showBB = signal(false);
  showVolume = signal(true);
  showRSI = signal(false);
  showMACD = signal(false);

  toggleTestMode() {
    const next = !this.testMode();
    this.testMode.set(next);
    if (next) {
      this.symbol.set('TEST');
      this.bars.set(this.mockDataSvc.generate('3M'));
      this.error.set('');
    } else {
      this.bars.set([]);
      this.symbol.set('');
    }
  }

  onSearch(params: SearchParams) {
    if (this.testMode()) {
      this.symbol.set(params.symbol || 'TEST');
      this.bars.set(this.mockDataSvc.generate(params.timeframe));
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.symbol.set(params.symbol);

    const to = new Date().toISOString().split('T')[0];
    const from = this.getFromDate(params.timeframe);
    const timespan = ['2Y', '5Y', '10Y'].includes(params.timeframe) ? 'week'
      : ['1D', '1W'].includes(params.timeframe) ? 'hour'
      : 'day';

    this.polygonSvc.getAggregates(params.symbol, from, to, params.apiKey, timespan).subscribe({
      next: bars => {
        this.bars.set(bars);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to fetch data. Check your API key and symbol.');
        this.loading.set(false);
      }
    });
  }

  private getFromDate(timeframe: string): string {
    const d = new Date();
    const days: Record<string, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const years: Record<string, number> = { '2Y': 2, '5Y': 5, '10Y': 10 };
    if (years[timeframe]) {
      d.setFullYear(d.getFullYear() - years[timeframe]);
    } else {
      d.setDate(d.getDate() - (days[timeframe] ?? 90));
    }
    return d.toISOString().split('T')[0];
  }
}
