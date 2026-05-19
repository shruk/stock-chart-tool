import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AnalystData } from '../../services/finnhub';
import { SupabaseService } from '../../services/supabase';
import { FunctionsService } from '../../services/functions.service';
import { MockDataService } from '../../services/mock-data';
import { AuthService } from '../../services/auth.service';
import { SparklineComponent } from '../../components/sparkline/sparkline';

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
  intradayBars: number[];
  intradayLoading: boolean;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, SparklineComponent],
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
          intradayBars: [], intradayLoading: true,
        })));
        this.loadingSymbols.set(false);
        this.loadQuotes(symbols);
        symbols.forEach(symbol => {
          this.loadName(symbol);
          this.loadIntraday(symbol);
        });
      },
      error: () => this.loadingSymbols.set(false)
    });
  }

  private loadQuotes(symbols: string[]) {
    this.functionsSvc.getQuotes(symbols).subscribe({
      next: quotes => {
        quotes.forEach(q => {
          this.stocks.update(list => list.map(s =>
            s.symbol === q.symbol
              ? { ...s, price: q.price, change: q.change, changePct: q.changePct, loading: false }
              : s
          ));
        });
        // Mark any that got no quote as done loading
        this.stocks.update(list => list.map(s => s.loading ? { ...s, loading: false } : s));
      },
      error: () => this.stocks.update(list => list.map(s => ({ ...s, loading: false }))),
    });
  }

  private loadIntraday(symbol: string) {
    this.functionsSvc.getIntradayBars(symbol).subscribe({
      next: bars => {
        const closes = bars.map(b => b.close);
        this.stocks.update(list => list.map(s =>
          s.symbol === symbol ? { ...s, intradayBars: closes, intradayLoading: false } : s
        ));
      },
      error: () => this.stocks.update(list => list.map(s =>
        s.symbol === symbol ? { ...s, intradayLoading: false } : s
      )),
    });
  }

  private loadName(symbol: string) {
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
      const price = 100 + Math.random() * 200;
      const change = (Math.random() - 0.48) * 5;
      const mockBars = Array.from({ length: 78 }, (_, i) => price + Math.sin(i / 5) * 3 + (Math.random() - 0.5) * 2);
      return {
        ...s, price, change, changePct: (change / price) * 100, loading: false,
        analyst: this.mockDataSvc.generateAnalyst(price), analystLoading: false,
        intradayBars: mockBars, intradayLoading: false,
      };
    }));
  }

  openStock(symbol: string) { this.router.navigate(['/stock', symbol]); }
  openAdmin() { this.router.navigate(['/admin']); }
  openJobs()  { this.router.navigate(['/jobs']); }
  openDocs()  { this.router.navigate(['/docs']); }
  openLogs()  { this.router.navigate(['/logs']); }
  openLogin() { this.router.navigate(['/login']); }
}
