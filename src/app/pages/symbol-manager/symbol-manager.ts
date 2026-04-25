import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FunctionsService, SymbolStat } from '../../services/functions.service';

@Component({
  selector: 'app-symbol-manager',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './symbol-manager.html',
  styleUrl: './symbol-manager.scss'
})
export class SymbolManagerComponent implements OnInit {
  private router = inject(Router);
  private functionsSvc = inject(FunctionsService);

  stats = signal<SymbolStat[]>([]);
  loading = signal(true);
  newSymbol = signal('');
  adding = signal(false);
  messages = signal<{ symbol: string; text: string; ok: boolean }[]>([]);

  ngOnInit() { this.loadStats(); }

  loadStats() {
    this.loading.set(true);
    this.functionsSvc.getSymbolStats().subscribe({
      next: data => { this.stats.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  addSymbol() {
    const sym = this.newSymbol().trim().toUpperCase();
    if (!sym || this.adding()) return;
    this.adding.set(true);
    this.functionsSvc.backfillSymbol(sym).subscribe({
      next: res => {
        this.messages.update(m => [{ symbol: sym, text: `${res.barsAdded} bars loaded`, ok: true }, ...m]);
        this.newSymbol.set('');
        this.adding.set(false);
        this.loadStats();
      },
      error: () => {
        this.messages.update(m => [{ symbol: sym, text: 'Failed — check function logs', ok: false }, ...m]);
        this.adding.set(false);
      }
    });
  }

  refresh(symbol: string) {
    this.functionsSvc.backfillSymbol(symbol).subscribe({
      next: res => {
        this.messages.update(m => [{ symbol, text: `+${res.barsAdded} bars appended`, ok: true }, ...m]);
        this.loadStats();
      },
      error: () => this.messages.update(m => [{ symbol, text: 'Failed', ok: false }, ...m])
    });
  }

  goBack() { this.router.navigate(['/']); }
}
