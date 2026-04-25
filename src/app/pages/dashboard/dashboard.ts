import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Bar } from '../../services/polygon';
import { AnalystData } from '../../services/finnhub';
import { SupabaseService } from '../../services/supabase';
import { MockDataService } from '../../services/mock-data';
import { SettingsPanelComponent } from '../../components/settings-panel/settings-panel';
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

const WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SettingsPanelComponent, SparklineComponent, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private supabaseSvc = inject(SupabaseService);
  private mockDataSvc = inject(MockDataService);

  testMode = signal(false);
  stocks = signal<StockCard[]>(
    WATCHLIST.map(s => ({ ...s, price: null, change: null, changePct: null, sparkline: [], loading: true, error: '', analyst: null, analystLoading: true }))
  );

  ngOnInit() { this.loadAll(false); }

  toggleTestMode() {
    const next = !this.testMode();
    this.testMode.set(next);
    this.loadAll(next);
  }

  loadAll(test: boolean) {
    this.stocks.update(list => list.map(s => ({
      ...s, loading: true, error: '', analyst: null, analystLoading: !test
    })));

    if (test) {
      this.stocks.update(list => list.map(s => {
        const bars = this.mockDataSvc.generate('3M');
        const summary = this.summarize(bars);
        const analyst = this.mockDataSvc.generateAnalyst(summary.price ?? 150);
        return { ...s, ...summary, loading: false, analyst, analystLoading: false };
      }));
      return;
    }

    WATCHLIST.forEach(w => {
      // Load prices from Supabase
      this.supabaseSvc.getPriceBars(w.symbol, this.fromDate(90)).then(bars => {
        if (bars?.length) {
          this.stocks.update(list => list.map(s =>
            s.symbol === w.symbol ? { ...s, ...this.summarize(bars), loading: false } : s
          ));
        } else {
          this.stocks.update(list => list.map(s =>
            s.symbol === w.symbol ? { ...s, loading: false, error: 'No data available' } : s
          ));
        }
      });

      // Load analyst data from Supabase
      this.supabaseSvc.getAnalystData(w.symbol).then(data => {
        this.stocks.update(list => list.map(s =>
          s.symbol === w.symbol ? { ...s, analyst: data, analystLoading: false } : s
        ));
      });
    });
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
}
