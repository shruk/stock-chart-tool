import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
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

  async getPriceBars(symbol: string, timeframe: string): Promise<any[] | null> {
    const { data, error } = await this.client
      .from('price_cache')
      .select('bars')
      .eq('symbol', symbol.toUpperCase())
      .eq('timeframe', timeframe)
      .single();

    if (error || !data) return null;
    return data.bars;
  }
}
