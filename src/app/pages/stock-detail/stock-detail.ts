import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchBarComponent, SearchParams } from '../../components/search-bar/search-bar';
import { StockChartComponent } from '../../components/stock-chart/stock-chart';
import { SettingsPanelComponent } from '../../components/settings-panel/settings-panel';
import { AnalystPanelComponent } from '../../components/analyst-panel/analyst-panel';
import { QaPanelComponent } from '../../components/qa-panel/qa-panel';
import { Bar } from '../../services/polygon';
import { AnalystData } from '../../services/finnhub';
import { SupabaseService } from '../../services/supabase';
import { FunctionsService, SymbolQa, RiskData } from '../../services/functions.service';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [SearchBarComponent, StockChartComponent, SettingsPanelComponent, AnalystPanelComponent, QaPanelComponent],
  templateUrl: './stock-detail.html',
  styleUrl: './stock-detail.scss'
})
export class StockDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private supabaseSvc  = inject(SupabaseService);
  private functionsSvc = inject(FunctionsService);

  bars = signal<Bar[]>([]);
  symbol = signal('');
  loading = signal(false);
  error = signal('');

  analystData    = signal<AnalystData | null>(null);
  analystLoading = signal(false);

  qaData    = signal<SymbolQa | null>(null);
  qaLoading = signal(false);

  riskData    = signal<RiskData | null>(null);
  riskLoading = signal(false);

  showSMA20  = signal(true);
  showSMA50  = signal(true);
  showSMA100 = signal(false);
  showBB     = signal(false);
  showVolume = signal(true);
  showRSI    = signal(false);
  showMACD   = signal(false);

  readonly currentPrice = computed(() => {
    const b = this.bars();
    return b.length > 0 ? b[b.length - 1].close : null;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const sym = (params.get('symbol') ?? '').toUpperCase();
      this.symbol.set(sym);
      this.bars.set([]);
      this.error.set('');
      this.analystData.set(null);
      this.qaData.set(null);
      this.riskData.set(null);
      if (sym) {
        const tf = (localStorage.getItem('preferred_timeframe') ?? '3M') as any;
        this.loadPrices(sym, tf);
        this.loadAnalyst(sym);
        this.loadQa(sym);
        this.loadRisk(sym);
      }
    });
  }

  private async loadPrices(sym: string, timeframe: string) {
    this.loading.set(true);
    this.error.set('');

    if (timeframe === '1D') {
      this.functionsSvc.getIntradayBars(sym).subscribe({
        next: bars => {
          if (bars?.length) this.bars.set(bars);
          else this.error.set('No intraday data available');
          this.loading.set(false);
        },
        error: () => { this.error.set('Failed to load intraday data'); this.loading.set(false); }
      });
      return;
    }

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

  private loadQa(sym: string) {
    this.qaLoading.set(true);
    this.qaData.set(null);
    this.functionsSvc.getSymbolQa(sym).subscribe({
      next:  qa => { this.qaData.set(qa); this.qaLoading.set(false); },
      error: ()  => this.qaLoading.set(false),
    });
  }

  private loadRisk(sym: string) {
    this.riskLoading.set(true);
    this.riskData.set(null);
    this.functionsSvc.getSymbolRisk(sym).subscribe({
      next:  r  => { this.riskData.set(r); this.riskLoading.set(false); },
      error: () => this.riskLoading.set(false),
    });
  }

  onSearch(params: SearchParams) {
    this.symbol.set(params.symbol);
    this.bars.set([]);
    this.error.set('');
    this.loadPrices(params.symbol, params.timeframe);
    this.loadAnalyst(params.symbol);
    this.loadQa(params.symbol);
    this.loadRisk(params.symbol);
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
