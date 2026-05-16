import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FunctionsService, JobStatus, ScheduleInfo } from '../../services/functions.service';

interface Job {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRunKey: 'fetchStockData' | 'marketSummary' | 'calculateRisks' | 'qaRefresh';
  note?: string;
}

const JOBS: Job[] = [
  {
    id: 'fetch-stock-data',
    name: 'Daily Price & Analyst Fetch',
    description: 'Backfills missing price bars and refreshes analyst data for all tracked symbols.',
    schedule: '9:30 PM UTC',
    lastRunKey: 'fetchStockData',
    note: 'Runs in background — returns immediately.',
  },
  {
    id: 'market-summary',
    name: 'Market Summary (AI)',
    description: 'Generates the bilingual EN/ZH market overview using Claude AI.',
    schedule: '10:00 PM UTC',
    lastRunKey: 'marketSummary',
  },
  {
    id: 'calculate-risks',
    name: 'Risk Calculation',
    description: 'Monte Carlo simulation (2W / 1M / 3M / 6M) for all tracked symbols.',
    schedule: '11:00 PM UTC',
    lastRunKey: 'calculateRisks',
  },
  {
    id: 'qa-refresh',
    name: 'AI Insights Refresh',
    description: 'Fetches FMP data and generates AI answers (overview, earnings, peers, management, sentiment) for all tracked symbols.',
    schedule: '8:00 AM UTC',
    lastRunKey: 'qaRefresh',
    note: 'Runs in background — returns immediately.',
  },
];

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss',
})
export class JobsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private functionsSvc = inject(FunctionsService);
  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly jobs = JOBS;
  status = signal<JobStatus | null>(null);
  running = signal<Set<string>>(new Set());
  messages = signal<{ id: string; text: string; ok: boolean }[]>([]);
  loading = signal(true);

  ngOnInit() { this.loadStatus(); }
  ngOnDestroy() { this.stopPoll(); }

  loadStatus() {
    this.loading.set(true);
    this.functionsSvc.getJobStatus().subscribe({
      next: s => {
        this.status.set(s);
        this.loading.set(false);
        if (s.fetchStockDataRunning && !this._pollTimer) {
          this._pollTimer = setInterval(() => this.loadStatus(), 5000);
        } else if (!s.fetchStockDataRunning && this._pollTimer) {
          this.stopPoll();
        }
      },
      error: () => { this.loading.set(false); this.stopPoll(); },
    });
  }

  private stopPoll() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  elapsedLabel(): string | null {
    const s = this.status();
    if (!s?.fetchStockDataRunning || !s.fetchStockDataStartedAt) return null;
    const secs = Math.floor((Date.now() - new Date(s.fetchStockDataStartedAt).getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const r = secs % 60;
    return `${m}m ${r}s`;
  }

  run(job: Job) {
    if (this.running().has(job.id)) return;
    this.running.update(s => new Set(s).add(job.id));
    this.functionsSvc.runJob(job.id).subscribe({
      next: res => {
        this.messages.update(m => [{ id: job.id, text: res.message, ok: true }, ...m]);
        this.running.update(s => { const n = new Set(s); n.delete(job.id); return n; });
        this.loadStatus();
      },
      error: () => {
        this.messages.update(m => [{ id: job.id, text: 'Failed — check function logs', ok: false }, ...m]);
        this.running.update(s => { const n = new Set(s); n.delete(job.id); return n; });
      },
    });
  }

  lastRun(job: Job): string | null {
    return this.status()?.[job.lastRunKey] ?? null;
  }

  scheduleInfo(job: Job): ScheduleInfo | null {
    const s = this.status()?.schedules;
    if (!s) return null;
    const map: Record<string, ScheduleInfo> = {
      'fetch-stock-data': s.fetchStockData,
      'market-summary':   s.marketSummary,
      'calculate-risks':  s.calculateRisks,
      'qa-refresh':       s.qaRefresh,
    };
    return map[job.id] ?? null;
  }

  localLabel(info: ScheduleInfo): string {
    // Parse "HH:MM PM UTC" from the label and convert to local time
    const match = info.label.match(/(\d+):(\d+)\s*(AM|PM)\s*UTC/i);
    if (!match) return info.label;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setUTCHours(h, m, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  navigate(path: string) { this.router.navigate([path]); }
}
