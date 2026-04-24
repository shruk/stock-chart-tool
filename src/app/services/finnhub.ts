import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface RecommendationTrend {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
}

export interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  lastUpdated: string;
}

export interface KeyMetrics {
  week52High: number;
  week52Low: number;
  week52HighDate: string;
  week52LowDate: string;
  peRatio: number;
  marketCap: number;
  beta: number;
  dividendYield: number;
  eps: number;
  revenueGrowthYoy: number;
  roeTTM: number;
  currentRatio: number;
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  exchange: string;
  industry: string;
  sector: string | null;
  marketCapitalization: number;
  shareOutstanding: number;
  logo: string;
  weburl: string;
  country: string;
  currency: string;
  ipo: string;
}

export interface AnalystData {
  recommendation: RecommendationTrend | null;
  priceTarget: PriceTarget | null;
  metrics: KeyMetrics | null;
  profile: CompanyProfile | null;
}

const BASE = 'https://finnhub.io/api/v1';

@Injectable({ providedIn: 'root' })
export class FinnhubService {
  private http = inject(HttpClient);

  getCardData(symbol: string, token: string): Observable<AnalystData> {
    const params = (extra: Record<string, string> = {}) => ({ symbol, token, ...extra });

    const rec$ = this.http.get<any[]>(`${BASE}/stock/recommendation`, { params: params() }).pipe(
      map(r => r?.[0] ?? null), catchError(() => of(null))
    );
    const target$ = this.http.get<any>(`${BASE}/stock/price-target`, { params: params() }).pipe(
      map(r => (r?.targetMean != null && r.targetMean !== 0) ? r as PriceTarget : null),
      catchError(() => of(null))
    );
    const metrics$ = this.http.get<any>(`${BASE}/stock/metric`, { params: params({ metric: 'all' }) }).pipe(
      map(r => {
        const m = r?.metric;
        if (!m) return null;
        return {
          week52High: m['52WeekHigh'], week52Low: m['52WeekLow'],
          week52HighDate: m['52WeekHighDate'], week52LowDate: m['52WeekLowDate'],
          peRatio: m['peBasicExclExtraTTM'] ?? m['peTTM'],
          marketCap: m['marketCapitalization'], beta: m['beta'],
          dividendYield: m['dividendYieldIndicatedAnnual'], eps: m['epsTTM'],
          revenueGrowthYoy: m['revenueGrowthTTMYoy'], roeTTM: m['roeTTM'],
          currentRatio: m['currentRatioQuarterly'],
        } as any;
      }),
      catchError(() => of(null))
    );

    return forkJoin({ recommendation: rec$, priceTarget: target$, metrics: metrics$, profile: of(null) });
  }

  getAnalystData(symbol: string, token: string): Observable<AnalystData> {
    const params = (extra: Record<string, string> = {}) => ({ symbol, token, ...extra });

    const rec$ = this.http.get<RecommendationTrend[]>(`${BASE}/stock/recommendation`, { params: params() }).pipe(
      map(r => r?.[0] ?? null),
      catchError(() => of(null))
    );

    const target$ = this.http.get<PriceTarget>(`${BASE}/stock/price-target`, { params: params() }).pipe(
      catchError(() => of(null))
    );

    const metrics$ = this.http.get<any>(`${BASE}/stock/metric`, { params: params({ metric: 'all' }) }).pipe(
      map(r => {
        const m = r?.metric;
        if (!m) return null;
        return {
          week52High: m['52WeekHigh'],
          week52Low: m['52WeekLow'],
          week52HighDate: m['52WeekHighDate'],
          week52LowDate: m['52WeekLowDate'],
          peRatio: m['peBasicExclExtraTTM'] ?? m['peTTM'],
          marketCap: m['marketCapitalization'],
          beta: m['beta'],
          dividendYield: m['dividendYieldIndicatedAnnual'],
          eps: m['epsTTM'],
          revenueGrowthYoy: m['revenueGrowthTTMYoy'],
          roeTTM: m['roeTTM'],
          currentRatio: m['currentRatioQuarterly'],
        } as KeyMetrics;
      }),
      catchError(() => of(null))
    );

    const profile$ = this.http.get<CompanyProfile>(`${BASE}/stock/profile2`, { params: params() }).pipe(
      catchError(() => of(null))
    );

    return forkJoin({ recommendation: rec$, priceTarget: target$, metrics: metrics$, profile: profile$ });
  }
}
