import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    <svg viewBox="0 0 120 40" width="120" height="40" preserveAspectRatio="none">
      @if (points()) {
        <line
          x1="0" [attr.y1]="baselineY()"
          x2="120" [attr.y2]="baselineY()"
          stroke="#94a3b8"
          stroke-width="0.8"
          stroke-dasharray="3 2"
        />
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
  readonly data        = input<number[]>([]);
  readonly prevClose   = input<number | null>(null);

  private readonly scale = computed(() => {
    const d = this.data();
    if (d.length < 2) return null;
    const ref = this.prevClose();
    const vals = ref != null ? [...d, ref] : d;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    return { min, max, range };
  });

  // Use prevClose as the reference for color so it matches the displayed change%
  readonly color = computed(() => {
    const d = this.data();
    if (d.length < 2) return '#94a3b8';
    const ref = this.prevClose() ?? d[0];
    return d[d.length - 1] >= ref ? '#22c55e' : '#ef4444';
  });

  // Dotted baseline at prevClose (or first bar if not provided)
  readonly baselineY = computed(() => {
    const s = this.scale();
    const d = this.data();
    if (!s || d.length < 2) return 38;
    const ref = this.prevClose() ?? d[0];
    const clamped = Math.max(s.min, Math.min(s.max, ref));
    return +(38 - ((clamped - s.min) / s.range) * 34).toFixed(1);
  });

  readonly points = computed(() => {
    const d = this.data();
    const s = this.scale();
    if (!s || d.length < 2) return '';
    return d.map((v, i) => {
      const x = (i / (d.length - 1)) * 120;
      const y = 38 - ((v - s.min) / s.range) * 34;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });
}
