import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDData {
  macd: { time: number; value: number }[];
  signal: { time: number; value: number }[];
  histogram: { time: number; value: number; color: string }[];
}

@Injectable({ providedIn: 'root' })
export class PolygonService {
  private http = inject(HttpClient);

  getAggregates(symbol: string, from: string, to: string, apiKey: string, timespan = 'day'): Observable<Bar[]> {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/${timespan}/${from}/${to}`;
    return this.http.get<any>(url, {
      params: { adjusted: 'true', sort: 'asc', limit: '500', apiKey }
    }).pipe(
      map(r => (r.results ?? []).map((b: any) => ({
        time: Math.floor(b.t / 1000),
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
        volume: b.v
      })))
    );
  }

  computeSMA(bars: Bar[], period: number): { time: number; value: number }[] {
    const result: { time: number; value: number }[] = [];
    for (let i = period - 1; i < bars.length; i++) {
      const avg = bars.slice(i - period + 1, i + 1).reduce((s, b) => s + b.close, 0) / period;
      result.push({ time: bars[i].time, value: +avg.toFixed(4) });
    }
    return result;
  }

  computeBollingerBands(bars: Bar[], period = 20, mult = 2): { time: number; upper: number; middle: number; lower: number }[] {
    const result: { time: number; upper: number; middle: number; lower: number }[] = [];
    for (let i = period - 1; i < bars.length; i++) {
      const slice = bars.slice(i - period + 1, i + 1);
      const avg = slice.reduce((s, b) => s + b.close, 0) / period;
      const std = Math.sqrt(slice.reduce((s, b) => s + (b.close - avg) ** 2, 0) / period);
      result.push({
        time: bars[i].time,
        upper: +(avg + mult * std).toFixed(4),
        middle: +avg.toFixed(4),
        lower: +(avg - mult * std).toFixed(4)
      });
    }
    return result;
  }

  computeRSI(bars: Bar[], period = 14): { time: number; value: number }[] {
    if (bars.length < period + 1) return [];
    const result: { time: number; value: number }[] = [];
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      const diff = bars[i].close - bars[i - 1].close;
      if (diff > 0) avgGain += diff; else avgLoss += -diff;
    }
    avgGain /= period;
    avgLoss /= period;

    const pushRSI = (time: number) => {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push({ time, value: +(100 - 100 / (1 + rs)).toFixed(2) });
    };

    pushRSI(bars[period].time);
    for (let i = period + 1; i < bars.length; i++) {
      const diff = bars[i].close - bars[i - 1].close;
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
      pushRSI(bars[i].time);
    }
    return result;
  }

  computeMACD(bars: Bar[], fast = 12, slow = 26, signal = 9): MACDData {
    const calcEMA = (data: number[], period: number): number[] => {
      const k = 2 / (period + 1);
      const r = [data[0]];
      for (let i = 1; i < data.length; i++) r.push(data[i] * k + r[i - 1] * (1 - k));
      return r;
    };

    const closes = bars.map(b => b.close);
    const fastEMA = calcEMA(closes, fast);
    const slowEMA = calcEMA(closes, slow);
    const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
    const sigLine = calcEMA(macdLine.slice(slow - 1), signal);

    // Both macdLine.slice(slow-1) and sigLine have the same length; both start at bar index slow-1
    const macdData = macdLine.slice(slow - 1).map((v, i) => ({ time: bars[i + slow - 1].time, value: +v.toFixed(4) }));
    const signalData = sigLine.map((v, i) => ({ time: bars[i + slow - 1].time, value: +v.toFixed(4) }));
    const histData = signalData.map((s, i) => {
      const h = +(macdData[i].value - s.value).toFixed(4);
      return { time: s.time, value: h, color: h >= 0 ? '#26a69a' : '#ef5350' };
    });

    return { macd: macdData, signal: signalData, histogram: histData };
  }
}
