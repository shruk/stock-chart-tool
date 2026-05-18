import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Bar } from '../../services/polygon';
import { AnalystData } from '../../services/finnhub';
import { SupabaseService } from '../../services/supabase';
import { FunctionsService } from '../../services/functions.service';
import { MockDataService } from '../../services/mock-data';
import { AuthService } from '../../services/auth.service';

interface StockCard {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  loading: boolean;
  error: string;
  analyst: AnalystData | null;
  analystLoading: boolean;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private supabaseSvc = inject(SupabaseService);
  private functionsSvc = inject(FunctionsService);
  private mockDataSvc = inject(MockDataService);
  auth = inject(AuthService);

  testMode = signal(false);
  stocks = signal<StockCard[]>([]);
  loadingSymbols = signal(true);

  constructor() {
    effect(() => {
      this.auth.role();
      this.loadSymbols();
    });
  }

  ngOnInit() {}

  toggleTestMode() {
    const next = !this.testMode();
    this.testMode.set(next);
    if (next) this.loadMockData();
    else this.loadSymbols();
  }

  private readonly GUEST_SYMBOLS = ['QQQ', 'AAPL', 'MSFT'];

  loadSymbols() {
    this.loadingSymbols.set(true);
    this.functionsSvc.getSymbolStats().subscribe({
      next: stats => {
        const all = stats.map(s => s.symbol);
        const symbols = this.auth.isMember() ? all : all.filter(s => this.GUEST_SYMBOLS.includes(s));
        this.stocks.set(symbols.map(symbol => ({
          symbol, name: symbol,
          price: null, change: null, changePct: null,
          loading: true, error: '', analyst: null, analystLoading: true,
        })));
        this.loadingSymbols.set(false);
        symbols.forEach(symbol => this.loadStock(symbol));
      },
      error: () => this.loadingSymbols.set(false)
    });
  }

  private loadStock(symbol: string) {
    this.supabaseSvc.getPriceBars(symbol, this.fromDate(90)).then(bars => {
      if (bars?.length) {
        this.stocks.update(list => list.map(s =>
          s.symbol === symbol ? { ...s, ...this.summarize(bars), loading: false } : s
        ));
      } else {
        this.stocks.update(list => list.map(s =>
          s.symbol === symbol ? { ...s, loading: false, error: 'No data' } : s
        ));
      }
    });

    this.supabaseSvc.getAnalystData(symbol).then(data => {
      this.stocks.update(list => list.map(s =>
        s.symbol === symbol ? {
          ...s,
          analyst: data,
          analystLoading: false,
          name: data?.profile?.name || s.symbol
        } : s
      ));
    });
  }

  private loadMockData() {
    this.stocks.update(list => list.map(s => {
      const bars = this.mockDataSvc.generate('3M');
      const summary = this.summarize(bars);
      return {
        ...s, ...summary, loading: false,
        analyst: this.mockDataSvc.generateAnalyst(summary.price ?? 150), analystLoading: false,
      };
    }));
  }

  private fromDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  private summarize(bars: Bar[]): Pick<StockCard, 'price' | 'change' | 'changePct'> {
    if (bars.length < 2) return { price: null, change: null, changePct: null };
    const last = bars[bars.length - 1];
    const prev = bars[bars.length - 2];
    const change = last.close - prev.close;
    return { price: last.close, change, changePct: (change / prev.close) * 100 };
  }

  openStock(symbol: string) { this.router.navigate(['/stock', symbol]); }
  openAdmin() { this.router.navigate(['/admin']); }
  openJobs()  { this.router.navigate(['/jobs']); }
  openDocs()  { this.router.navigate(['/docs']); }
  openLogs()  { this.router.navigate(['/logs']); }
  openLogin() { this.router.navigate(['/login']); }
}
