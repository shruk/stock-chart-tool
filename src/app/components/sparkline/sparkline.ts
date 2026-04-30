import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    <svg viewBox="0 0 120 40" width="120" height="40" preserveAspectRatio="none">
      @if (points()) {
        <polyline
          [attr.points]="points()"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      }
    </svg>
  `,
  styles: [':host { display: block; }']
})
export class SparklineComponent {
  readonly data = input<number[]>([]);

  readonly color = computed(() => {
    const d = this.data();
    if (d.length < 2) return '#94a3b8';
    return d[d.length - 1] >= d[0] ? '#22c55e' : '#ef4444';
  });

  readonly points = computed(() => {
    const d = this.data();
    if (d.length < 2) return '';
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    return d.map((v, i) => {
      const x = (i / (d.length - 1)) * 120;
      const y = 38 - ((v - min) / range) * 34;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });
}
