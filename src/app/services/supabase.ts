import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Bar } from './polygon';
import { AnalystData } from './finnhub';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  async getAnalystData(symbol: string): Promise<AnalystData | null> {
    const { data, error } = await this.client
      .from('analyst_cache')
      .select('data')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (error || !data) return null;
    return data.data as AnalystData;
  }

  async getPriceBars(symbol: string, fromDate: string): Promise<Bar[] | null> {
    const { data, error } = await this.client
      .from('price_bars')
      .select('ts, open, high, low, close, volume')
      .eq('symbol', symbol.toUpperCase())
      .gte('ts', fromDate)
      .order('ts', { ascending: true });

    if (error || !data?.length) return null;

    return data.map(r => ({
      time: Math.floor(new Date(r.ts + 'T00:00:00Z').getTime() / 1000),
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume
    }));
  }
}
