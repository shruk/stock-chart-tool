import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

type Tab = 'functions' | 'ui';

@Component({
  selector: 'app-docs',
  standalone: true,
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
})
export class DocsComponent {
  private router = inject(Router);
  tab = signal<Tab>('functions');
  navigate(path: string) { this.router.navigate([path]); }
}
