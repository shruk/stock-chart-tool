import { Component, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EarningsQuarter, PeerCompany, SentimentQa, SymbolQa } from '../../services/functions.service';

@Component({
  selector: 'app-qa-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './qa-panel.html',
  styleUrl: './qa-panel.scss'
})
export class QaPanelComponent {
  readonly data    = input<SymbolQa | null>(null);
  readonly loading = input(false);

  // ── Q2 Earnings helpers ──────────────────────────────────────────────
  readonly maxRevenue = computed(() => {
    const qs = this.data()?.earnings?.quarters ?? [];
    return Math.max(...qs.map(q => q.revenue ?? 0), 1);
  });

  readonly maxAbsNetIncome = computed(() => {
    const qs = this.data()?.earnings?.quarters ?? [];
    return Math.max(...qs.map(q => Math.abs(q.netIncome ?? 0)), 1);
  });

  revenueBarHeight(q: EarningsQuarter): number {
    const max = this.maxRevenue();
    return max > 0 ? Math.max(4, ((q.revenue ?? 0) / max) * 100) : 4;
  }

  netIncomeBarHeight(q: EarningsQuarter): number {
    const max = this.maxAbsNetIncome();
    return max > 0 ? Math.max(4, (Math.abs(q.netIncome ?? 0) / max) * 100) : 4;
  }

  // ── Q3 Peer helpers ──────────────────────────────────────────────────
  metricLabel(key: string): string {
    const map: Record<string, string> = {
      pe_ratio:     'P/E',
      ps_ratio:     'P/S',
      pb_ratio:     'P/B',
      ev_ebitda:    'EV/EBITDA',
      dividend_yield: 'Div Yield',
    };
    return map[key] ?? key;
  }

  metricValue(peer: PeerCompany, key: string): string {
    const v = (peer as any)[this.toCamel(key)];
    if (v == null) return '—';
    if (key === 'dividend_yield') return (v * 100).toFixed(2) + '%';
    return v.toFixed(1) + 'x';
  }

  private toCamel(s: string): string {
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  formatMktCap(val?: number | null): string {
    if (!val) return '—';
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9)  return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6)  return '$' + (val / 1e6).toFixed(1) + 'M';
    return '$' + val.toFixed(0);
  }

  formatRevenue(val?: number | null): string {
    if (!val) return '—';
    const abs = Math.abs(val);
    if (abs >= 1e9)  return (val < 0 ? '-' : '') + '$' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6)  return (val < 0 ? '-' : '') + '$' + (abs / 1e6).toFixed(1) + 'M';
    return '$' + val.toFixed(0);
  }

  formatNetIncome(val?: number | null): string {
    if (val == null) return '—';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1) + 'M';
    return sign + '$' + abs.toFixed(0);
  }

  // ── Q5 Sentiment helpers ─────────────────────────────────────────────
  gaugeColor(score: number): string {
    if (score >= 65) return '#22c55e';
    if (score >= 36) return '#eab308';
    return '#ef4444';
  }

  gaugeFillLen(score: number): number {
    // Semicircle arc length: π * r = π * 80 ≈ 251.33
    return (score / 100) * 251.33;
  }

  gaugeLabel(score: number): string {
    if (score >= 65) return 'Bullish';
    if (score >= 36) return 'Neutral';
    return 'Bearish';
  }

  formatInsiderNet(val: number): string {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '+';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(0) + 'K';
    return sign + '$' + abs;
  }

  signalStatus(s: SentimentQa): { analyst: string; short: string; insider: string; inst: string } {
    const analystRaw = s.analystScore ?? 0;
    return {
      analyst: analystRaw >= 4.0 ? 'bullish' : analystRaw >= 3.0 ? 'neutral' : 'bearish',
      short:   (s.shortFloatPct ?? 1) < 0.05 ? 'bullish' : (s.shortFloatPct ?? 1) < 0.15 ? 'neutral' : 'bearish',
      insider: s.insiderBuys90d > s.insiderSells90d ? 'bullish' : s.insiderBuys90d === s.insiderSells90d ? 'neutral' : 'bearish',
      inst:    (s.institutionalOwnershipPct ?? 0) > 0.75 ? 'bullish' : (s.institutionalOwnershipPct ?? 0) > 0.50 ? 'neutral' : 'bearish',
    };
  }
}
