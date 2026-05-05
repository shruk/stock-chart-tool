import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SymbolStat {
  symbol: string;
  barCount: number;
  fromDate: string;
  toDate: string;
  hasAnalyst: boolean;
  type: string;
  analystCachedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FunctionsService {
  private http = inject(HttpClient);
  private base = environment.functionsUrl;

  getSymbolStats(): Observable<SymbolStat[]> {
    return this.http.get<SymbolStat[]>(`${this.base}/symbols`);
  }

  backfillSymbol(symbol: string): Observable<{ symbol: string; barsAdded: number; status: string }> {
    return this.http.post<any>(`${this.base}/symbols`, { symbol });
  }

  updateAnalyst(symbol: string): Observable<{ symbol: string; status: string }> {
    return this.http.post<any>(`${this.base}/symbols/${symbol}/analyst`, {});
  }

  deleteData(symbol: string): Observable<{ symbol: string; status: string }> {
    return this.http.delete<any>(`${this.base}/symbols/${symbol}/data`);
  }

  deleteSymbol(symbol: string): Observable<{ symbol: string; status: string }> {
    return this.http.delete<any>(`${this.base}/symbols/${symbol}`);
  }

  getJobStatus(): Observable<JobStatus> {
    return this.http.get<JobStatus>(`${this.base}/jobs/status`);
  }

  runJob(job: string): Observable<{ status: string; message: string }> {
    return this.http.post<any>(`${this.base}/jobs/run/${job}`, {});
  }

  getSymbolRisk(symbol: string): Observable<RiskData | null> {
    return this.http.get<RiskData>(`${this.base}/risk/${symbol}`);
  }

  updateSymbolType(symbol: string, type: string): Observable<{ symbol: string; type: string }> {
    return this.http.patch<any>(`${this.base}/symbols/${symbol}/type`, { type });
  }
}

export interface RiskHorizon {
  lossProbability: number;
  var95: number;
}

export interface RiskData {
  twoWeek: RiskHorizon;
  oneMonth: RiskHorizon;
  threeMonth: RiskHorizon;
  sixMonth: RiskHorizon;
  calculatedAt: string;
}

export interface ScheduleInfo {
  cron: string;
  label: string;
  active: boolean;
  note?: string | null;
}

export interface JobStatus {
  fetchStockData: string | null;
  marketSummary: string | null;
  calculateRisks: string | null;
  fetchStockDataRunning: boolean;
  fetchStockDataStartedAt: string | null;
  schedules?: {
    fetchStockData: ScheduleInfo;
    marketSummary: ScheduleInfo;
    calculateRisks: ScheduleInfo;
  };
}
