import { Injectable } from '@angular/core';
import { Bar } from './polygon';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  generate(timeframe: string): Bar[] {
    const barCount = this.barCount(timeframe);
    const intervalSeconds = this.intervalSeconds(timeframe);
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - barCount * intervalSeconds;

    const bars: Bar[] = [];
    let price = 150 + Math.random() * 100;
    const volatility = price * 0.015;

    for (let i = 0; i < barCount; i++) {
      const time = startTime + i * intervalSeconds;
      const open = price;
      const change = (Math.random() - 0.48) * volatility;
      const close = Math.max(1, open + change);
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.floor(500_000 + Math.random() * 2_000_000 + Math.abs(change) * 100_000);

      bars.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +Math.max(1, low).toFixed(2), close: +close.toFixed(2), volume });
      price = close;
    }
    return bars;
  }

  private barCount(timeframe: string): number {
    const map: Record<string, number> = {
      '1D': 78,   // ~6.5 hours of hourly bars
      '1W': 130,
      '1M': 22,
      '3M': 66,
      '6M': 130,
      '1Y': 252,
      '2Y': 104,  // weekly
      '5Y': 260,
      '10Y': 520,
    };
    return map[timeframe] ?? 90;
  }

  private intervalSeconds(timeframe: string): number {
    const hour = 3600;
    const day = 86400;
    const week = day * 7;
    const map: Record<string, number> = {
      '1D': hour, '1W': hour,
      '1M': day, '3M': day, '6M': day, '1Y': day,
      '2Y': week, '5Y': week, '10Y': week,
    };
    return map[timeframe] ?? day;
  }
}
