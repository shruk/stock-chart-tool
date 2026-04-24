import { Component, output, signal } from '@angular/core';

export interface SearchParams {
  symbol: string;
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y';
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss'
})
export class SearchBarComponent {
  readonly search = output<SearchParams>();

  symbol = signal('AAPL');
  timeframe = signal<SearchParams['timeframe']>('3M');

  readonly timeframes: SearchParams['timeframe'][] = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y'];

  selectTimeframe(tf: SearchParams['timeframe']) {
    this.timeframe.set(tf);
    this.emit();
  }

  onSymbolEnter() {
    this.emit();
  }

  private emit() {
    if (!this.symbol()) return;
    this.search.emit({ symbol: this.symbol().toUpperCase(), timeframe: this.timeframe() });
  }
}
