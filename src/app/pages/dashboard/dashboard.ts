import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Bar } from '../../services/polygon';
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
  sparkline: number[];
  loading: boolean;
  error: string;
  analyst: AnalystData | null;
  analystLoading: boolean;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SparklineComponent, DecimalPipe],
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

  ngOnInit() { this.loadSymbols(); }

  toggleTestMode() {
    const next = !this.testMode();
    this.testMode.set(next);
    if (next) this.loadMockData();
    else this.loadSymbols();
  }

  loadSymbols() {
    this.loadingSymbols.set(true);
    this.functionsSvc.getSymbolStats().subscribe({
      next: stats => {
        const symbols = stats.map(s => s.symbol);
        this.stocks.set(symbols.map(symbol => ({
          symbol, name: symbol,
          price: null, change: null, changePct: null, sparkline: [],
          loading: true, error: '', analyst: null, analystLoading: true
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
      return { ...s, ...summary, loading: false, analyst: this.mockDataSvc.generateAnalyst(summary.price ?? 150), analystLoading: false };
    }));
  }

  consensus(card: StockCard): { text: string; cls: string } | null {
    const r = card.analyst?.recommendation;
    if (!r) return null;
    const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
    if (total === 0) return null;
    const bullish = ((r.strongBuy + r.buy) / total) * 100;
    const bearish = ((r.strongSell + r.sell) / total) * 100;
    if (bullish >= 60) return { text: 'Strong Buy', cls: 'strong-buy' };
    if (bullish >= 40) return { text: 'Buy', cls: 'buy' };
    if (bearish >= 40) return { text: 'Sell', cls: 'sell' };
    if (bearish >= 60) return { text: 'Strong Sell', cls: 'strong-sell' };
    return { text: 'Hold', cls: 'hold' };
  }

  donutSegments(card: StockCard) {
    const pct = this.ratingPct(card);
    if (!pct) return null;
    const r = 36, C = 2 * Math.PI * r;
    const items = [
      { pct: pct.strongBuy,  color: '#4ade80' },
      { pct: pct.buy,        color: '#22c55e' },
      { pct: pct.hold,       color: '#eab308' },
      { pct: pct.sell,       color: '#f87171' },
      { pct: pct.strongSell, color: '#ef4444' },
    ];
    let cum = 0;
    return items.filter(s => s.pct > 0).map(s => {
      const len = (s.pct / 100) * C;
      const result = { color: s.color, dasharray: `${len.toFixed(2)} ${(C - len).toFixed(2)}`, dashoffset: (-(cum / 100) * C).toFixed(2) };
      cum += s.pct;
      return result;
    });
  }

  totalRatings(card: StockCard): number {
    const r = card.analyst?.recommendation;
    if (!r) return 0;
    return r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  }

  ratingPct(card: StockCard) {
    const r = card.analyst?.recommendation;
    if (!r) return null;
    const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
    if (total === 0) return null;
    return {
      strongBuy:  (r.strongBuy  / total) * 100,
      buy:        (r.buy        / total) * 100,
      hold:       (r.hold       / total) * 100,
      sell:       (r.sell       / total) * 100,
      strongSell: (r.strongSell / total) * 100,
    };
  }

  targetPosition(card: StockCard): number | null {
    const t = card.analyst?.priceTarget;
    const price = card.price;
    if (!t?.targetHigh || !t?.targetLow || !price) return null;
    const range = t.targetHigh - t.targetLow;
    if (range <= 0) return null;
    return Math.max(0, Math.min(100, ((price - t.targetLow) / range) * 100));
  }

  targetMeanPosition(card: StockCard): number | null {
    const t = card.analyst?.priceTarget;
    if (!t?.targetHigh || !t?.targetLow || !t?.targetMean) return null;
    const range = t.targetHigh - t.targetLow;
    if (range <= 0) return null;
    return Math.max(0, Math.min(100, ((t.targetMean - t.targetLow) / range) * 100));
  }

  week52Position(card: StockCard): number | null {
    const m = card.analyst?.metrics;
    const price = card.price;
    if (!m?.week52High || !m?.week52Low || !price) return null;
    const range = m.week52High - m.week52Low;
    if (range <= 0) return null;
    return Math.max(0, Math.min(100, ((price - m.week52Low) / range) * 100));
  }

  formatMarketCap(val: number | null | undefined): string {
    if (!val) return '—';
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}T`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}B`;
    return `$${val.toFixed(0)}M`;
  }

  private fromDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  private summarize(bars: Bar[]): Pick<StockCard, 'price' | 'change' | 'changePct' | 'sparkline'> {
    if (bars.length < 2) return { price: null, change: null, changePct: null, sparkline: [] };
    const last = bars[bars.length - 1];
    const prev = bars[bars.length - 2];
    const change = last.close - prev.close;
    const sparkline = bars.slice(-30).map(b => b.close);
    return { price: last.close, change, changePct: (change / prev.close) * 100, sparkline };
  }

  openStock(symbol: string) { this.router.navigate(['/stock', symbol]); }
  openAdmin() { this.router.navigate(['/admin']); }
  openLogin() { this.router.navigate(['/login']); }
}
