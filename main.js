
import * as cfg from './config/index.js';
import {createSeries, setChartSize} from './utils/utils.js';

import { initializeChartWithData } from './chart/chartUpdateService.js';
import { handleCandleDataUpload } from './local/localHandler.js';
import { preLoadHistoryCandles } from './api/dataService.js';
import { connectWebSocket } from './api/ws.js';

console.log(`_..--.._`.repeat(10))

const chartContainer = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(chartContainer, cfg.chartProperties);

// Applying global chart options
chart.applyOptions({
  localization: {
    priceFormatter: cfg.myPriceFormatter,
  },
});

// // Creating series
// const candleSeries = createSeries(chart, 'candlestick', cfg.candleSeriesConfig);
// const volumeSeries = createSeries(chart, 'histogram', cfg.volumeSeriesConfig);
// const lineSeries =   createSeries(chart, 'line', cfg.lineSeriesConfig);
// const waveSeries =   createSeries(chart, 'line', cfg.waveSeriesConfig);
// const trendSeries =  createSeries(chart, 'line', cfg.trendLineSeriesConfig);
// const breakTrendSeries =  createSeries(chart, 'line', cfg.breakTrendLineSeriesConfig);
// const rangesSeries =  createSeries(chart, 'line', cfg.rangesSeriesConfig);

// const series = { candles_series: candleSeries, volume_series: volumeSeries, extrema_series: lineSeries, wave_series: waveSeries, trend_series: trendSeries, breaktrend_series: breakTrendSeries, ranges_series: rangesSeries};


const seriesTypesAndConfigs = [
    { key: 'candles_series', type: 'candlestick', config: cfg.candleSeriesConfig },
    { key: 'volume_series', type: 'histogram', config: cfg.volumeSeriesConfig },
    { key: 'extrema_series', type: 'line', config: cfg.lineSeriesConfig },
    { key: 'wave_series', type: 'line', config: cfg.waveSeriesConfig },
    { key: 'trend_series', type: 'line', config: cfg.trendLineSeriesConfig },
    { key: 'breaktrend_series', type: 'line', config: cfg.breakTrendLineSeriesConfig },
    { key: 'ranges_series', type: 'line', config: cfg.rangesSeriesConfig },
];

const series = seriesTypesAndConfigs.reduce((acc, { key, type, config }) => {
    acc[key] = createSeries(chart, type, config);
    return acc;
}, {});


window.addEventListener('resize', setChartSize(chart));

document.addEventListener('DOMContentLoaded', initializeChartWithData(chart, series));
document.addEventListener('DOMContentLoaded',  connectWebSocket(candleSeries));
document.addEventListener('DOMContentLoaded', preLoadHistoryCandles(symbol, timeframe))

document.getElementById('dataFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) handleCandleDataUpload(file, series.candles_series);
  });

 