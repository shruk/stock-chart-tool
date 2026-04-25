import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchBarComponent, SearchParams } from '../../components/search-bar/search-bar';
import { StockChartComponent } from '../../components/stock-chart/stock-chart';
import { SettingsPanelComponent } from '../../components/settings-panel/settings-panel';
import { AnalystPanelComponent } from '../../components/analyst-panel/analyst-panel';
import { Bar } from '../../services/polygon';
import { AnalystData } from '../../services/finnhub';
import { SupabaseService } from '../../services/supabase';
import { MockDataService } from '../../services/mock-data';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [SearchBarComponent, StockChartComponent, SettingsPanelComponent, AnalystPanelComponent],
  templateUrl: './stock-detail.html',
  styleUrl: './stock-detail.scss'
})
export class StockDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseSvc = inject(SupabaseService);
  private mockDataSvc = inject(MockDataService);

  bars = signal<Bar[]>([]);
  symbol = signal('');
  loading = signal(false);
  error = signal('');
  testMode = signal(false);

  analystData = signal<AnalystData | null>(null);
  analystLoading = signal(false);

  showSMA20 = signal(true);
  showSMA50 = signal(true);
  showSMA100 = signal(false);
  showBB = signal(false);
  showVolume = signal(true);
  showRSI = signal(false);
  showMACD = signal(false);

  readonly currentPrice = computed(() => {
    const b = this.bars();
    return b.length > 0 ? b[b.length - 1].close : null;
  });

  ngOnInit() {
    const sym = this.route.snapshot.paramMap.get('symbol') ?? '';
    this.symbol.set(sym.toUpperCase());
    if (sym) {
      this.loadPrices(sym.toUpperCase(), '3M');
      this.loadAnalyst(sym.toUpperCase());
    }
  }

  private async loadPrices(sym: string, timeframe: string) {
    if (this.testMode()) {
      this.bars.set(this.mockDataSvc.generate(timeframe as any));
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const bars = await this.supabaseSvc.getPriceBars(sym, this.getFromDate(timeframe));
    if (bars?.length) {
      this.bars.set(bars);
    } else {
      this.error.set('No data available');
    }
    this.loading.set(false);
  }

  private async loadAnalyst(sym: string) {
    this.analystLoading.set(true);
    this.analystData.set(null);

    const data = await this.supabaseSvc.getAnalystData(sym);
    this.analystData.set(data);
    this.analystLoading.set(false);
  }

  toggleTestMode() {
    const next = !this.testMode();
    this.testMode.set(next);
    if (next) {
      const bars = this.mockDataSvc.generate('3M');
      this.bars.set(bars);
      this.analystData.set(this.mockDataSvc.generateAnalyst(bars[bars.length - 1]?.close ?? 150));
      this.error.set('');
    } else {
      this.bars.set([]);
      this.analystData.set(null);
      this.loadPrices(this.symbol(), '3M');
      this.loadAnalyst(this.symbol());
    }
  }

  onSearch(params: SearchParams) {
    const sym = params.symbol;
    this.symbol.set(sym);

    if (this.testMode()) {
      const bars = this.mockDataSvc.generate(params.timeframe);
      this.bars.set(bars);
      this.analystData.set(this.mockDataSvc.generateAnalyst(bars[bars.length - 1]?.close ?? 150));
      return;
    }

    this.loadPrices(sym, params.timeframe);
    this.loadAnalyst(sym);
  }

  goBack() { this.router.navigate(['/']); }

  private getFromDate(timeframe: string): string {
    const d = new Date();
    const days: Record<string, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const years: Record<string, number> = { '2Y': 2, '5Y': 5, '10Y': 10 };
    if (years[timeframe]) d.setFullYear(d.getFullYear() - years[timeframe]);
    else d.setDate(d.getDate() - (days[timeframe] ?? 90));
    return d.toISOString().split('T')[0];
  }
}
