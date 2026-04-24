import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PriceTarget } from './finnhub';

const BASE = 'https://financialmodelingprep.com/stable';

@Injectable({ providedIn: 'root' })
export class FmpService {
  private http = inject(HttpClient);

  getPriceTarget(symbol: string, apiKey: string): Observable<PriceTarget | null> {
    return this.http.get<any>(`${BASE}/price-target-consensus`, {
      params: { symbol, apikey: apiKey }
    }).pipe(
      map(r => {
        console.log(`[FMP ${symbol}]`, r);
        const d = Array.isArray(r) ? r[0] : r;
        if (!d) return null;
        const mean = d.targetConsensus ?? d.targetMean ?? d.priceTarget ?? null;
        if (!mean) return null;
        return {
          targetHigh: d.targetHigh,
          targetLow: d.targetLow,
          targetMean: mean,
          targetMedian: d.targetMedian ?? mean,
          lastUpdated: d.lastUpdated ?? '',
        } as PriceTarget;
      }),
      catchError(err => {
        console.error(`[FMP ${symbol} FAILED]`, err.status);
        return of(null);
      })
    );
  }
}
