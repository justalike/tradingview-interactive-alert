
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
    debounceTimer = setTimeout(() => onVisibleLogicalRangeChanged(newVisibleLogicalRange), 250); // 500 ms debounce period
}

let lastCallTime;
const throttleInterval = 1000; // Throttle interval in milliseconds


function throttle(func, interval) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

function asyncThrottle(func, interval) {
  let lastCall = 0;
  let pendingPromise = null;

  return async function(...args) {
    const now = Date.now();
    if (now - lastCall < interval) {
      return pendingPromise; // Return the pending promise if within the interval
    }
    lastCall = now;
    pendingPromise = func.apply(this, args);
    try {
      const result = await pendingPromise;
      return result;
    } catch (error) {
      throw error;
    } finally {
      pendingPromise = null; // Reset after completion
    }
  };
}

const throttledGetHistoryCandles = asyncThrottle(getHistoryCandles, 1000);


// function onVisibleLogicalRangeChangedThrottled(newVisibleLogicalRange) {
//     const now = new Date().getTime();
//     if (!lastCallTime || now - lastCallTime >= throttleInterval) {
//         lastCallTime = now;
//         onVisibleLogicalRangeChanged(newVisibleLogicalRange);
//     }
// }
const onVisibleLogicalRangeChangedThrottled = throttle(onVisibleLogicalRangeChanged, 1000);


async function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
  try{
  const barsInfo = series.candles_series.barsInLogicalRange(newVisibleLogicalRange);
  // If there are less than 50 bars to the left of the visible area, load more data
  if (barsInfo !== null && barsInfo.barsBefore < 20) {
      // Logic to determine the start date for the next data fetch
      const earliestVisibleTime = chart.timeScale().getVisibleRange().from;
      console.log(`EarliestVisibleTime${earliestVisibleTime}`)
      // Convert chart's internal time format to a usable date string if needed
      // This assumes you have a function to convert from chart time to Date or string
      const existingCandles = await getHistoryCandles(symbol, timeframe);
      const fetchedCandles = await fetchCandleData(symbol, timeframe) || [];

      const startDateForFetch = getCurrentYYMMDD(earliestVisibleTime*1000); // back to ms
      // Load historical data starting from startDateForFetch
      const candlePreloadResult = await preLoadHistoryCandles(symbol, timeframe, startDateForFetch)
      
    
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


chart.timeScale().subscribeVisibleLogicalRangeChange( onVisibleLogicalRangeChangedThrottled);




document.getElementById('loadDataButton').addEventListener('click', async () => {
  try{ 
    const candlePreloadResult = await preLoadHistoryCandles(symbol, timeframe)
    const existingCandles = await throttledGetHistoryCandles(symbol, timeframe);
    //const existingCandles = await getHistoryCandles(symbol, timeframe);
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

 