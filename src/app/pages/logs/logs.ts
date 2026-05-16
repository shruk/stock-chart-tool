import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FunctionsService, LogEntry, LogType } from '../../services/functions.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './logs.html',
  styleUrl: './logs.scss',
})
export class LogsComponent implements OnInit {
  private router = inject(Router);
  private functionsSvc = inject(FunctionsService);

  tab = signal<LogType>('jobs');
  hours = signal(48);
  loading = signal(false);
  error = signal<string | null>(null);
  entries = signal<LogEntry[]>([]);

  ngOnInit() { this.load(); }

  switchTab(t: LogType) {
    this.tab.set(t);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.functionsSvc.getLogs(this.tab(), this.hours()).subscribe({
      next: rows => { this.entries.set(rows); this.loading.set(false); },
      error: e  => { this.error.set(e?.error?.error ?? 'Failed to load logs'); this.loading.set(false); },
    });
  }

  setHours(h: number) {
    this.hours.set(h);
    this.load();
  }

  levelLabel(level: string): string {
    return ({ '0': 'Verbose', '1': 'Info', '2': 'Warning', '3': 'Error', '4': 'Critical' })[level] ?? level;
  }

  levelClass(level: string): string {
    return ({ '3': 'err', '4': 'crit', '2': 'warn', '0': 'verbose' })[level] ?? 'info';
  }

  navigate(path: string) { this.router.navigate([path]); }
}
