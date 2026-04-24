import { Component, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AnalystData } from '../../services/finnhub';

@Component({
  selector: 'app-analyst-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './analyst-panel.html',
  styleUrl: './analyst-panel.scss'
})
export class AnalystPanelComponent {
  readonly data = input<AnalystData | null>(null);
  readonly loading = input(false);
  readonly currentPrice = input<number | null>(null);

  readonly rec     = computed(() => this.data()?.recommendation ?? null);
  readonly target  = computed(() => this.data()?.priceTarget ?? null);
  readonly metrics = computed(() => this.data()?.metrics ?? null);
  readonly profile = computed(() => this.data()?.profile ?? null);

  readonly totalRatings = computed(() => {
    const r = this.rec();
    if (!r) return 0;
    return r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  });

  readonly ratingPct = computed(() => {
    const r = this.rec();
    const total = this.totalRatings();
    if (!r || total === 0) return null;
    return {
      strongBuy:  (r.strongBuy  / total) * 100,
      buy:        (r.buy        / total) * 100,
      hold:       (r.hold       / total) * 100,
      sell:       (r.sell       / total) * 100,
      strongSell: (r.strongSell / total) * 100,
    };
  });

  readonly donutSegments = computed(() => {
    const pct = this.ratingPct();
    if (!pct) return [];
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
  });

  readonly consensusLabel = computed(() => {
    const r = this.rec();
    const total = this.totalRatings();
    if (!r || total === 0) return null;
    const bullish = ((r.strongBuy + r.buy) / total) * 100;
    const bearish = ((r.strongSell + r.sell) / total) * 100;
    if (bullish >= 60) return { text: 'Strong Buy', cls: 'strong-buy' };
    if (bullish >= 40) return { text: 'Buy', cls: 'buy' };
    if (bearish >= 40) return { text: 'Sell', cls: 'sell' };
    if (bearish >= 60) return { text: 'Strong Sell', cls: 'strong-sell' };
    return { text: 'Hold', cls: 'hold' };
  });

  readonly week52Position = computed(() => {
    const m = this.metrics();
    const price = this.currentPrice();
    if (!m?.week52High || !m?.week52Low || !price) return null;
    const range = m.week52High - m.week52Low;
    if (range <= 0) return null;
    return Math.max(0, Math.min(100, ((price - m.week52Low) / range) * 100));
  });

  readonly targetPricePosition = computed(() => {
    const t = this.target();
    const price = this.currentPrice();
    if (!t?.targetHigh || !t?.targetLow || !price) return null;
    const range = t.targetHigh - t.targetLow;
    if (range <= 0) return null;
    return Math.max(0, Math.min(100, ((price - t.targetLow) / range) * 100));
  });

  readonly targetMeanPosition = computed(() => {
    const t = this.target();
    if (!t?.targetHigh || !t?.targetLow || !t?.targetMean) return null;
    const range = t.targetHigh - t.targetLow;
    if (range <= 0) return null;
    return Math.max(0, Math.min(100, ((t.targetMean - t.targetLow) / range) * 100));
  });

  formatMarketCap(val: number | null | undefined): string {
    if (!val) return '—';
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}T`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}B`;
    return `$${val.toFixed(0)}M`;
  }
}
