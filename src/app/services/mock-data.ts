import { Injectable } from '@angular/core';
import { Bar } from './polygon';
import { AnalystData } from './finnhub';

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

  generateAnalyst(currentPrice: number): AnalystData {
    const r = () => Math.floor(Math.random() * 15);
    const strongBuy = r() + 5;
    const buy = r() + 3;
    const hold = r();
    const sell = Math.floor(Math.random() * 5);
    const strongSell = Math.floor(Math.random() * 3);

    const targetMean = +(currentPrice * (1 + (Math.random() * 0.3 - 0.05))).toFixed(2);
    const targetLow  = +(targetMean * (1 - Math.random() * 0.15)).toFixed(2);
    const targetHigh = +(targetMean * (1 + Math.random() * 0.2)).toFixed(2);
    const targetMedian = +((targetMean + targetLow) / 2).toFixed(2);

    const week52High = +(currentPrice * (1 + Math.random() * 0.35)).toFixed(2);
    const week52Low  = +(currentPrice * (1 - Math.random() * 0.35)).toFixed(2);

    const peRatio = +(15 + Math.random() * 25).toFixed(1);
    const marketCap = +(currentPrice * (500 + Math.random() * 5000)).toFixed(0);
    const beta = +(0.7 + Math.random() * 1.3).toFixed(2);
    const dividendYield = Math.random() > 0.4 ? +(Math.random() * 3).toFixed(2) : 0;
    const eps = +(currentPrice / peRatio).toFixed(2);
    const revenueGrowthYoy = +((Math.random() * 30) - 5).toFixed(1);
    const roeTTM = +(10 + Math.random() * 40).toFixed(1);
    const currentRatio = +(0.8 + Math.random() * 2).toFixed(2);

    return {
      recommendation: { strongBuy, buy, hold, sell, strongSell, period: new Date().toISOString().slice(0, 7) + '-01' },
      priceTarget: { targetHigh, targetLow, targetMean, targetMedian, lastUpdated: new Date().toISOString().slice(0, 10) },
      metrics: { week52High, week52Low, week52HighDate: '', week52LowDate: '', peRatio, marketCap, beta, dividendYield, eps, revenueGrowthYoy, roeTTM, currentRatio },
      profile: null,
    };
  }

  private barCount(timeframe: string): number {
    const map: Record<string, number> = {
      '1D': 78, '1W': 130, '1M': 22, '3M': 66,
      '6M': 130, '1Y': 252, '2Y': 104, '5Y': 260, '10Y': 520,
    };
    return map[timeframe] ?? 90;
  }

  private intervalSeconds(timeframe: string): number {
    const hour = 3600, day = 86400, week = day * 7;
    const map: Record<string, number> = {
      '1D': hour, '1W': hour,
      '1M': day, '3M': day, '6M': day, '1Y': day,
      '2Y': week, '5Y': week, '10Y': week,
    };
    return map[timeframe] ?? day;
  }
}
