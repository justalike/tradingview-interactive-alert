
import * as cfg from './config/index.js';
import {createSeries, updateSeriesData,  setChartSize, getQueryParams, getCurrentYYMMDD} from './utils/utils.js';

import { initializeChartWithData } from './chart/chartUpdateService.js';
import { handleCandleDataUpload } from './local/localHandler.js';
import { fetchCandleData, getHistoryCandles, preLoadHistoryCandles } from './api/dataService.js';
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

const seriesTypesAndConfigs = [
    { key: 'candles_series', type: 'candlestick', config: cfg.candleSeriesConfig },
    { key: 'volume_series', type: 'histogram', config: cfg.volumeSeriesConfig },
    { key: 'extrema_series', type: 'line', config: cfg.lineSeriesConfig },
    { key: 'wave_series', type: 'line', config: cfg.waveSeriesConfig },
    { key: 'trend_series', type: 'line', config: cfg.trendLineSeriesConfig },
    { key: 'breaktrend_series', type: 'line', config: cfg.breakTrendLineSeriesConfig },
    { key: 'ranges_series', type: 'line', config: cfg.rangesSeriesConfig },
    { key: 'historycandles_series', type: 'candlestick', config: cfg.candleSeriesConfig },
    { key: 'historyvolume_series', type: 'histogram', config: cfg.candleSeriesConfig },
];

const series = seriesTypesAndConfigs.reduce((acc, { key, type, config }) => {
    acc[key] = createSeries(chart, type, config);
    return acc;
}, {});

const { symbol, timeframe } = await getQueryParams();


window.addEventListener('resize', setChartSize(chart));

document.addEventListener('DOMContentLoaded', initializeChartWithData(chart, series));
//document.addEventListener('DOMContentLoaded',  connectWebSocket(series));
document.addEventListener('DOMContentLoaded', preLoadHistoryCandles(symbol, timeframe))









let debounceTimer;
function onVisibleLogicalRangeChangedDebounced(newVisibleLogicalRange) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onVisibleLogicalRangeChanged(newVisibleLogicalRange), 500); // 500 ms debounce period
}

async function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
  try{
  const barsInfo = series.candles_series.barsInLogicalRange(newVisibleLogicalRange);
  // If there are less than 50 bars to the left of the visible area, load more data
  if (barsInfo !== null && barsInfo.barsBefore < 50) {
      // Logic to determine the start date for the next data fetch
      const earliestVisibleTime = chart.timeScale().getVisibleRange().from;
      console.log(`EarliestVisibleTime${earliestVisibleTime}`)
      // Convert chart's internal time format to a usable date string if needed
      // This assumes you have a function to convert from chart time to Date or string
      const startDateForFetch = getCurrentYYMMDD(earliestVisibleTime*1000); // back to ms
      // Load historical data starting from startDateForFetch
      const candlePreloadResult = await preLoadHistoryCandles(symbol, timeframe, startDateForFetch)
      const existingCandles = await getHistoryCandles(symbol, timeframe);
      const fetchedCandles = await fetchCandleData(symbol, timeframe) || [];
    
      const mergedCandles = [...existingCandles
                                  .filter(candle => candle.time < fetchedCandles[0].time),
                            ...fetchedCandles];
                             //console.log(mergedCandles.length)
      const volumes = mergedCandles.map(({ time, volume }) => ({ time, value: volume }));
    
      updateSeriesData(series.candles_series, mergedCandles)
      updateSeriesData(series.volume_series, volumes )
      
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


chart.timeScale().subscribeVisibleLogicalRangeChange( onVisibleLogicalRangeChangedDebounced);




document.getElementById('loadDataButton').addEventListener('click', async () => {
  try{ 
    const candlePreloadResult = await preLoadHistoryCandles(symbol, timeframe)
    const existingCandles = await getHistoryCandles(symbol, timeframe);
    const fetchedCandles = await fetchCandleData(symbol, timeframe) || [];
  
    const mergedCandles = [...existingCandles
                                .filter(candle => candle.time < fetchedCandles[0].time),
                          ...fetchedCandles];
                           //console.log(mergedCandles.length)
    const volumes = mergedCandles.map(({ time, volume }) => ({ time, value: volume }));
  
    updateSeriesData(series.candles_series, mergedCandles)
    updateSeriesData(series.volume_series, volumes )
    
    series.volume_series.priceScale().applyOptions({
      scaleMargins: {
          top: 0.7,
          bottom: 0,
      },
  })
  // if (series.candles_series && series.volume_series) {
  //   removeSeries(chart, series.candles_series);
  //   removeSeries(chart, series.volume_series);
  // }
  
  // await loadHistoryToChart(series, symbol, timeframe)

  
  } 
  catch (error) {
    console.error(error);
  }

});

document.getElementById('dataFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) handleCandleDataUpload(file, series.candles_series);
  });

 