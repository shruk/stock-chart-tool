import { Component, OnDestroy, AfterViewInit, input, effect, ElementRef, viewChild, inject } from '@angular/core';
import { createChart, IChartApi, CandlestickSeries, LineSeries, HistogramSeries, LineStyle, UTCTimestamp } from 'lightweight-charts';
import type { ISeriesApi, SeriesType } from 'lightweight-charts';
import { PolygonService, Bar } from '../../services/polygon';

const CHART_THEME = {
  autoSize: true,
  layout: { background: { color: '#0f172a' }, textColor: '#94a3b8', fontSize: 12 },
  grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
  crosshair: { mode: 1 },
  rightPriceScale: { borderColor: '#334155' },
  timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
  handleScroll: { mouseWheel: true, pressedMouseMove: true },
  handleScale: { mouseWheel: true, pinch: true },
};

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [],
  templateUrl: './stock-chart.html',
  styleUrl: './stock-chart.scss'
})
export class StockChartComponent implements AfterViewInit, OnDestroy {
  readonly bars = input<Bar[]>([]);
  readonly showSMA20 = input(true);
  readonly showSMA50 = input(true);
  readonly showSMA100 = input(false);
  readonly showBB = input(false);
  readonly showVolume = input(true);
  readonly showRSI = input(false);
  readonly showMACD = input(false);

  private mainChartRef = viewChild<ElementRef>('mainChart');
  private rsiChartRef = viewChild<ElementRef>('rsiChart');
  private macdChartRef = viewChild<ElementRef>('macdChart');
  private polygonSvc = inject(PolygonService);

  private main: IChartApi | null = null;
  private rsi: IChartApi | null = null;
  private macd: IChartApi | null = null;
  private mainSeries: ISeriesApi<SeriesType>[] = [];
  private rsiSeries: ISeriesApi<SeriesType>[] = [];
  private macdSeries: ISeriesApi<SeriesType>[] = [];

  constructor() {
    effect(() => {
      const bars = this.bars();
      void this.showSMA20(); void this.showSMA50(); void this.showSMA100();
      void this.showBB(); void this.showVolume();
      void this.showRSI(); void this.showMACD();
      if (bars.length > 0) this.renderAll(bars);
    });
  }

  ngAfterViewInit() {
    const mainEl = this.mainChartRef()?.nativeElement;
    const rsiEl = this.rsiChartRef()?.nativeElement;
    const macdEl = this.macdChartRef()?.nativeElement;
    if (!mainEl || !rsiEl || !macdEl) return;

    this.main = createChart(mainEl, CHART_THEME);
    this.rsi = createChart(rsiEl, { ...CHART_THEME, timeScale: { ...CHART_THEME.timeScale, visible: false } });
    this.macd = createChart(macdEl, { ...CHART_THEME, timeScale: { ...CHART_THEME.timeScale, visible: false } });

    if (this.bars().length > 0) this.renderAll(this.bars());
  }

  private clearMain() {
    this.mainSeries.forEach(s => { try { this.main!.removeSeries(s); } catch {} });
    this.mainSeries = [];
  }

  private renderAll(bars: Bar[]) {
    if (!this.main || !this.rsi || !this.macd) return;
    this.renderMain(bars);
    this.renderRSI(bars);
    this.renderMACD(bars);
    requestAnimationFrame(() => {
      this.main?.timeScale().fitContent();
      this.rsi?.timeScale().fitContent();
      this.macd?.timeScale().fitContent();
    });
  }

  private renderMain(bars: Bar[]) {
    this.clearMain();
    const t = (time: number) => time as UTCTimestamp;

    const cs = this.main!.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });
    cs.setData(bars.map(b => ({ time: t(b.time), open: b.open, high: b.high, low: b.low, close: b.close })));
    this.mainSeries.push(cs);

    if (this.showVolume()) {
      const vs = this.main!.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      vs.setData(bars.map(b => ({ time: t(b.time), value: b.volume, color: b.close >= b.open ? '#22c55e22' : '#ef444422' })));
      this.mainSeries.push(vs);
    }

    if (this.showSMA20()) {
      const s = this.main!.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      s.setData(this.polygonSvc.computeSMA(bars, 20).map(d => ({ time: t(d.time), value: d.value })));
      this.mainSeries.push(s);
    }

    if (this.showSMA50()) {
      const s = this.main!.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      s.setData(this.polygonSvc.computeSMA(bars, 50).map(d => ({ time: t(d.time), value: d.value })));
      this.mainSeries.push(s);
    }

    if (this.showSMA100()) {
      const s = this.main!.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      s.setData(this.polygonSvc.computeSMA(bars, 100).map(d => ({ time: t(d.time), value: d.value })));
      this.mainSeries.push(s);
    }

    if (this.showBB()) {
      const bb = this.polygonSvc.computeBollingerBands(bars);
      const base = { lineWidth: 1 as const, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false, lineStyle: LineStyle.Dashed };
      const upper = this.main!.addSeries(LineSeries, { ...base, color: '#a855f7' });
      upper.setData(bb.map(d => ({ time: t(d.time), value: d.upper })));
      const mid = this.main!.addSeries(LineSeries, { ...base, color: '#a855f766', lineStyle: LineStyle.Solid });
      mid.setData(bb.map(d => ({ time: t(d.time), value: d.middle })));
      const lower = this.main!.addSeries(LineSeries, { ...base, color: '#a855f7' });
      lower.setData(bb.map(d => ({ time: t(d.time), value: d.lower })));
      this.mainSeries.push(upper, mid, lower);
    }
  }

  private renderRSI(bars: Bar[]) {
    this.rsiSeries.forEach(s => { try { this.rsi!.removeSeries(s); } catch {} });
    this.rsiSeries = [];

    if (!this.showRSI()) return;
    const t = (time: number) => time as UTCTimestamp;
    const line = this.rsi!.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, lastValueVisible: true, priceLineVisible: false });
    line.setData(this.polygonSvc.computeRSI(bars).map(d => ({ time: t(d.time), value: d.value })));
    line.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OB' });
    line.createPriceLine({ price: 30, color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OS' });
    this.rsiSeries.push(line);
  }

  private renderMACD(bars: Bar[]) {
    this.macdSeries.forEach(s => { try { this.macd!.removeSeries(s); } catch {} });
    this.macdSeries = [];

    if (!this.showMACD()) return;
    const t = (time: number) => time as UTCTimestamp;
    const { macd, signal, histogram } = this.polygonSvc.computeMACD(bars);

    const hist = this.macd!.addSeries(HistogramSeries, { lastValueVisible: false, priceLineVisible: false });
    hist.setData(histogram.map(d => ({ time: t(d.time), value: d.value, color: d.color })));

    const macdLine = this.macd!.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
    macdLine.setData(macd.map(d => ({ time: t(d.time), value: d.value })));

    const sigLine = this.macd!.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
    sigLine.setData(signal.map(d => ({ time: t(d.time), value: d.value })));

    this.macdSeries.push(hist, macdLine, sigLine);
  }

  ngOnDestroy() {
    this.main?.remove();
    this.rsi?.remove();
    this.macd?.remove();
  }
}
