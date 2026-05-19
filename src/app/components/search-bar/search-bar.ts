import { Component, input, output, signal, effect } from '@angular/core';

export interface SearchParams {
  symbol: string;
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y';
}

const TF_KEY = 'preferred_timeframe';
const VALID_TFS = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y'] as const;

function savedTimeframe(): SearchParams['timeframe'] {
  const saved = localStorage.getItem(TF_KEY);
  return (VALID_TFS as readonly string[]).includes(saved ?? '')
    ? (saved as SearchParams['timeframe'])
    : '3M';
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss'
})
export class SearchBarComponent {
  readonly initialSymbol = input<string>('');
  readonly search = output<SearchParams>();

  symbol = signal('');
  timeframe = signal<SearchParams['timeframe']>(savedTimeframe());

  constructor() {
    effect(() => {
      const s = this.initialSymbol();
      if (s) this.symbol.set(s);
    });
  }

  readonly timeframes: SearchParams['timeframe'][] = [...VALID_TFS];

  selectTimeframe(tf: SearchParams['timeframe']) {
    this.timeframe.set(tf);
    localStorage.setItem(TF_KEY, tf);
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
