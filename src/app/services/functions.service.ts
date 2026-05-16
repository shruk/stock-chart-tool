import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Bar } from './polygon';

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

  getSymbolQa(symbol: string): Observable<SymbolQa> {
    return this.http.get<SymbolQa>(`${this.base}/qa/${symbol}`);
  }

  getIntradayBars(symbol: string): Observable<Bar[]> {
    return this.http.get<Bar[]>(`${this.base}/intraday/${symbol}`);
  }

  getLogs(type: LogType, hours = 48): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(`${this.base}/logs?type=${type}&hours=${hours}`);
  }
}

export type LogType = 'jobs' | 'admin' | 'ui';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  operation: string;
  category: string;
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

export interface EarningsQuarter {
  period: string;
  fiscalDate: string;
  revenue?: number;
  revenueGrowthYoy?: number;
  netIncome?: number;
  eps?: number;
  epsEstimate?: number;
  epsSurprise?: number;
}

export interface PeerCompany {
  peerSymbol: string;
  isSelf: boolean;
  companyName?: string;
  stockPrice?: number;
  priceChange52w?: number;
  marketCap?: number;
  peRatio?: number;
  psRatio?: number;
  pbRatio?: number;
  evEbitda?: number;
  dividendYield?: number;
}

export interface SentimentQa {
  sentimentScore: number;
  analystScore?: number;
  shortFloatPct?: number;
  daysToCover?: number;
  insiderBuys90d: number;
  insiderSells90d: number;
  insiderNetValue90d: number;
  institutionalOwnershipPct?: number;
  topInstitutionName?: string;
  commentary?: string;
}

export interface SymbolQa {
  symbol: string;
  companyOverview?: string;
  earnings?: {
    quarters: EarningsQuarter[];
    commentary?: string;
  };
  peers?: {
    companies: PeerCompany[];
    selectedMetrics: string[];
    commentary?: string;
  };
  management?: string;
  sentiment?: SentimentQa;
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
  qaRefresh: string | null;
  fetchStockDataRunning: boolean;
  fetchStockDataStartedAt: string | null;
  schedules?: {
    fetchStockData: ScheduleInfo;
    marketSummary: ScheduleInfo;
    calculateRisks: ScheduleInfo;
    qaRefresh: ScheduleInfo;
  };
}
