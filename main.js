
import * as cfg from './config/index.js';
import { createSeries, updateSeriesData, setChartSize, getQueryParams, getCurrentYYMMDD, calculateVMA, updateSeriesOptions } from './utils/utils.js';


import { initializeChartWithData, updateChartWithExtremaData, updateChartWithTrendData, updateChartWithWaveData } from './chart/chartUpdateService.js';
import { handleCandleDataUpload } from './local/localHandler.js';
import { fetchCandleData, getHistoryCandles, preLoadHistoryCandles, getHistoryLines, preLoadHistoryLines } from './api/dataService.js';
import { connectWebSocket } from './api/ws.js';
import { throttle, asyncThrottle } from './utils/throttle.js';

console.log(`_..--.._`.repeat(10))

const chartContainer = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(chartContainer, cfg.chartProperties);


const throttleInterval = 1000; // Throttle interval in milliseconds

const throttledGetHistoryCandles = asyncThrottle(getHistoryCandles, throttleInterval);
const throttledPreLoadHistoryCandles = asyncThrottle(preLoadHistoryCandles, throttleInterval);
const throttledGetHistoryLines = asyncThrottle(getHistoryLines, throttleInterval);
const throttledPreLoadHistoryLines = asyncThrottle(preLoadHistoryLines, throttleInterval);

const onVisibleLogicalRangeChangedThrottled = throttle(onVisibleLogicalRangeChanged, throttleInterval);

// Applying global chart options
chart.applyOptions({
  localization: {
    priceFormatter: cfg.myPriceFormatter,
  },
});

const seriesTypesAndConfigs = [
  { key: 'candles_series', type: LightweightCharts.CandlestickSeries, config: cfg.candleSeriesConfig },
  { key: 'volume_series', type: LightweightCharts.HistogramSeries, config: cfg.volumeSeriesConfig },
  { key: 'extrema_series', type: LightweightCharts.LineSeries, config: cfg.lineSeriesConfig },
  { key: 'wave_series', type: LightweightCharts.LineSeries, config: cfg.waveSeriesConfig },
  { key: 'trend_series', type: LightweightCharts.LineSeries, config: cfg.trendLineSeriesConfig },
  { key: 'breaktrend_series', type: LightweightCharts.LineSeries, config: cfg.breakTrendLineSeriesConfig },
  { key: 'ranges_series', type: LightweightCharts.LineSeries, config: cfg.rangesSeriesConfig },
  { key: 'historycandles_series', type: LightweightCharts.CandlestickSeries, config: cfg.candleSeriesConfig },
  { key: 'historyvolume_series', type: LightweightCharts.HistogramSeries, config: cfg.candleSeriesConfig },
  { key: 'vma_200', type: LightweightCharts.LineSeries, config: cfg.vmaSeriesConfig },
  { key: 'vma_5', type: LightweightCharts.LineSeries, config: cfg.vmaSeriesConfig },
];

const series = seriesTypesAndConfigs.reduce((acc, { key, type, config }) => {
  acc[key] = createSeries(chart, type, config);
  return acc;
}, {});

const { symbol, timeframe } = await getQueryParams();


window.addEventListener('resize', setChartSize(chart));
document.addEventListener('DOMContentLoaded', initializeChartWithData(chart, series));
document.addEventListener('DOMContentLoaded', connectWebSocket(series));

//Caching historical data for quick retrieval
document.addEventListener('DOMContentLoaded', throttledPreLoadHistoryCandles(symbol, timeframe))
document.addEventListener('DOMContentLoaded', throttledPreLoadHistoryLines(symbol, timeframe))

async function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
  try {
    const barsInfo = series.candles_series.barsInLogicalRange(newVisibleLogicalRange);
    // If there are less than 150 bars to the left of the visible area, load more data
    if (barsInfo !== null && barsInfo.barsBefore < 100) {

      const earliestVisibleTime = chart.timeScale().getVisibleRange().from;
      const startDateForFetch = getCurrentYYMMDD(earliestVisibleTime * 1000); // back to ms

      const candlePreloadResult = await throttledPreLoadHistoryCandles(symbol, timeframe, startDateForFetch)
      const linesPreloadResult = await throttledPreLoadHistoryLines(symbol, timeframe)

      const historicalCandles = await throttledGetHistoryCandles(symbol, timeframe);
      const fetchedCandles = await fetchCandleData(symbol, timeframe)

      const { extremum, wave, trends } = await throttledGetHistoryLines(symbol, timeframe);

      const mergedCandles = fetchedCandles ? [...historicalCandles
        .filter(candle => candle.time < fetchedCandles[0].time),
      ...fetchedCandles] : historicalCandles;

      const volumes = mergedCandles.map(({ time, volume }) => ({ time, value: volume }));
      // calculate Volume moving average with length 200
      const VMA200 = calculateVMA(volumes, 200);
      console.log('VMA200', VMA200)
      // calculate Volume moving average with length 5

      const VMA5 = calculateVMA(volumes, 5);
      console.log('VMA200', VMA200)

      if (historicalCandles && fetchedCandles) {
        updateSeriesData(series.candles_series, mergedCandles)
      } else { console.log('Existing or fetched candles are nullish') }

      if (volumes) {
        updateSeriesData(series.volume_series, volumes)
        updateSeriesData(series.vma_200, VMA200)
        updateSeriesData(series.vma_5, VMA5)
        updateSeriesOptions(series.vma_200, { color: '#2D1FF0' })
        updateSeriesOptions(series.vma_5, { color: '#F49212' })
      } else { console.log('Volumes are nullish') }

      if (extremum && wave && trends) {
        updateChartWithExtremaData(chart, series.extrema_series, extremum)
        updateChartWithWaveData(chart, series.wave_series, series.candles_series, mergedCandles, wave);
        updateChartWithTrendData(chart, mergedCandles, trends)
      } else { console.log('Extrema or wave or trends are nullish') }

      series.vma_200.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })


      series.vma_5.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })
      series.volume_series.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })

    }
  } catch (error) {
    console.error(`Error loading historical data for ${symbol} on ${timeframe}:`, error);
  }
}


chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChangedThrottled);


document.getElementById('loadDataButton').addEventListener('click', async () => {
  try {
    const candlePreloadResult = await throttledPreLoadHistoryCandles(symbol, timeframe)
    const linesPreloadResult = await throttledPreLoadHistoryLines(symbol, timeframe)

    const { extremum, wave, trends } = await throttledGetHistoryLines(symbol, timeframe);

    const historicalCandles = await throttledGetHistoryCandles(symbol, timeframe);
    const fetchedCandles = await fetchCandleData(symbol, timeframe)

    const mergedCandles = fetchedCandles ? [...historicalCandles
      .filter(candle => candle.time < fetchedCandles[0].time),
    ...fetchedCandles] : historicalCandles;

    const volumes = mergedCandles.map(({ time, volume }) => ({ time, value: volume }));
    // calculate Volume moving average with length 200
    const VMA200 = calculateVMA(volumes, 200);
    // calculate Volume moving average with length 5

    const VMA5 = calculateVMA(volumes, 5);

    if (historicalCandles && fetchedCandles) {
      updateSeriesData(series.candles_series, mergedCandles)
      updateSeriesData(series.volume_series, volumes)
      updateSeriesData(series.vma_200, VMA200)
      updateSeriesData(series.vma_5, VMA5)
      updateSeriesOptions(series.vma_200, { color: '#2D1FF0' })
      updateSeriesOptions(series.vma_5, { color: '#F49212' })


    }

    if (extremum && wave && trends) {
      updateChartWithExtremaData(chart, series.extrema_series, extremum)
      updateChartWithWaveData(chart, series.wave_series, series.candles_series, mergedCandles, wave);
      updateChartWithTrendData(chart, mergedCandles, trends)
    }

    series.vma_200.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })


    series.vma_5.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })


    series.volume_series.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })

  }
  catch (error) {
    console.error(error);
  }

});

// document.getElementById('dataFile').addEventListener('change', (event) => {
//     const file = event.target.files[0];
//     if (file) handleCandleDataUpload(file, series.candles_series);
//   });

