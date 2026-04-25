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
  deletingData = signal<Set<string>>(new Set());
  deletingSymbol = signal<Set<string>>(new Set());
  updatingAnalyst = signal<Set<string>>(new Set());
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

  updateAnalyst(symbol: string) {
    this.updatingAnalyst.update(s => new Set(s).add(symbol));
    this.functionsSvc.updateAnalyst(symbol).subscribe({
      next: () => {
        this.messages.update(m => [{ symbol, text: 'Analyst data updated', ok: true }, ...m]);
        this.updatingAnalyst.update(s => { const n = new Set(s); n.delete(symbol); return n; });
        this.loadStats();
      },
      error: () => {
        this.messages.update(m => [{ symbol, text: 'Analyst update failed', ok: false }, ...m]);
        this.updatingAnalyst.update(s => { const n = new Set(s); n.delete(symbol); return n; });
      }
    });
  }

  deleteData(symbol: string) {
    if (!confirm(`Delete all price + analyst data for ${symbol}? The symbol will remain tracked.`)) return;
    this.deletingData.update(s => new Set(s).add(symbol));
    this.functionsSvc.deleteData(symbol).subscribe({
      next: () => {
        this.messages.update(m => [{ symbol, text: 'Data deleted — symbol kept', ok: true }, ...m]);
        this.deletingData.update(s => { const n = new Set(s); n.delete(symbol); return n; });
        this.loadStats();
      },
      error: () => {
        this.messages.update(m => [{ symbol, text: 'Delete data failed', ok: false }, ...m]);
        this.deletingData.update(s => { const n = new Set(s); n.delete(symbol); return n; });
      }
    });
  }

  deleteSymbol(symbol: string) {
    if (!confirm(`Remove ${symbol} entirely? This deletes all data and the symbol itself.`)) return;
    this.deletingSymbol.update(s => new Set(s).add(symbol));
    this.functionsSvc.deleteSymbol(symbol).subscribe({
      next: () => {
        this.messages.update(m => [{ symbol, text: 'Symbol removed', ok: true }, ...m]);
        this.deletingSymbol.update(s => { const n = new Set(s); n.delete(symbol); return n; });
        this.loadStats();
      },
      error: () => {
        this.messages.update(m => [{ symbol, text: 'Delete symbol failed', ok: false }, ...m]);
        this.deletingSymbol.update(s => { const n = new Set(s); n.delete(symbol); return n; });
      }
    });
  }

  goBack() { this.router.navigate(['/']); }
}
