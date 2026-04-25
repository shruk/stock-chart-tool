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
}
