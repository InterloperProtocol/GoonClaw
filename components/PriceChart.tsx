"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  IChartApi,
  UTCTimestamp,
  createChart,
} from "lightweight-charts";

import { ChartSnapshot } from "@/lib/types";
import { formatCompact, formatUsd } from "@/lib/utils";

type Props = {
  contractAddress: string;
  onSnapshotChange?: (snapshot: ChartSnapshot | null) => void;
};

export function PriceChart({ contractAddress, onSnapshotChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSnapshot(null);

    const fetchSnapshot = async () => {
      try {
        const response = await fetch(`/api/chart/${contractAddress}`);
        const payload = (await response.json()) as ChartSnapshot & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Chart lookup failed");
        }
        if (!cancelled) {
          setSnapshot(payload);
          setError(null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setSnapshot(null);
          setError(
            fetchError instanceof Error ? fetchError.message : "Chart lookup failed",
          );
        }
      }
    };

    void fetchSnapshot();
    const interval = window.setInterval(fetchSnapshot, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [contractAddress]);

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  useEffect(() => {
    if (!containerRef.current || !snapshot) return;

    chartRef.current?.remove();
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent", type: ColorType.Solid },
        textColor: "#fefce8",
      },
      grid: {
        vertLines: { color: "rgba(245, 158, 11, 0.08)" },
        horzLines: { color: "rgba(245, 158, 11, 0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(245, 158, 11, 0.22)",
      },
      timeScale: {
        borderColor: "rgba(245, 158, 11, 0.22)",
        timeVisible: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#facc15",
      downColor: "#ef4444",
      wickUpColor: "#facc15",
      wickDownColor: "#ef4444",
      borderVisible: false,
    });

    candleSeries.setData(
      snapshot.candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "",
      color: "rgba(56, 189, 248, 0.35)",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeries.setData(
      snapshot.candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color:
          candle.close >= candle.open
            ? "rgba(250, 204, 21, 0.28)"
            : "rgba(239, 68, 68, 0.28)",
      })),
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
    };
  }, [snapshot]);

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Chart Sync</p>
          <h2>
            {contractAddress.slice(0, 4)}...{contractAddress.slice(-4)}
          </h2>
        </div>
        {snapshot ? (
          <div className="source-pill">
            <span className="status-dot" />
            {snapshot.source}
          </div>
        ) : null}
      </div>
      {snapshot ? (
        <div className="chart-stats">
          <div>
            <span>Price</span>
            <strong>{formatUsd(snapshot.priceUsd)}</strong>
          </div>
          <div>
            <span>Market Cap</span>
            <strong>{formatCompact(snapshot.marketCapUsd)}</strong>
          </div>
          <div>
            <span>5m</span>
            <strong className={snapshot.change5mPct >= 0 ? "text-up" : "text-down"}>
              {snapshot.change5mPct.toFixed(2)}%
            </strong>
          </div>
          <div>
            <span>24h Volume</span>
            <strong>{formatCompact(snapshot.volume24hUsd)}</strong>
          </div>
        </div>
      ) : null}
      {error ? <p className="error-banner">{error}</p> : null}
      <div className="chart-surface" ref={containerRef} />
      {snapshot ? (
        <a
          className="chart-link"
          href={snapshot.pairUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open pair in DexScreener
        </a>
      ) : null}
    </section>
  );
}
