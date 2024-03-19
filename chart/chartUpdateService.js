import { calculateNextTrendEndTime, updateSeriesData, processTimeFrames, getQueryParams} from '../utils/utils.js'; 
import { isValidTrendData, isValidExtremaData, isValidWaveData } from '../utils/validation.js';
import { trendLineSeriesConfig, breakTrendLineSeriesConfig, rangesSeriesConfig } from '../config/seriesConfig.js';
import {fetchCandleData,    fetchAllLineData} from '../api/dataService.js';


var lastCandle;

export const initializeChartWithData = async (chart, series,  sym = 'BTC/USDT', tf = '1h')  => {

    
   try{

    const { symbol, timeframe } = await getQueryParams();
  
    const qsymbol = symbol || sym;
    const qtimeframe = timeframe || tf;

    if (!qsymbol || !qtimeframe) {
        console.error('None symbol or timeframe set in query. \n Initializing BTCUSDT/1h chart');
    }
    const candles = await fetchCandleData(qsymbol, qtimeframe);
    const {extremum, wave, trends} = await fetchAllLineData(qsymbol, qtimeframe);
  
   const dataSources = {
            candles: candles,
            extrema: extremum, 
            waves:   wave,
            trends:  trends,
  };
  

   for (const [name, data] of Object.entries(dataSources)) {
       if (!data) {
           console.error('Failed to fetch data from source ' + name);
          // return;
       }

       if (name === 'candles') {
        console.log('candlesSeries')
        console.log(series.candles_series)
        lastCandle = data[data.length - 1];
        updateSeriesData(series.candles_series, data)
           //updateCandleSeries(data);
       } else if (name === 'extrema') {
        console.log('extremaSeries')
        console.log(series.extrema_series)
           updateChartWithExtremaData(chart, series.extrema_series, data);
       } else if (name === 'waves') {
        console.log('wavesSeries')
        console.log(series.wave_series)
       //   updateChartWithWaveData(chart, series.wave_series, data);
       } else if (name === 'trends') {
        console.log('trendsSeries')
        console.log(series.trend_series)
           updateChartWithTrendData(chart, series.trend_series, series.ranges_series, series.breaktrend_series, data);
       }
   }
  
  chart.applyOptions({
      watermark: {
          visible: true,
          fontSize: 52,
          horzAlign: 'center',
          vertAlign: 'top',
          color: 'rgba(255, 255, 255, 0.7)',
          text: `${qsymbol}:${qtimeframe}`,
      },
  });
    //  console.log(symbol, timeframe)
    
  } catch (error) {
    console.error('Error initializing chart with data:', error);
  }
}
    // Transform and set data for series
    // updateSeriesData(candleSeries, transformCandleData(data));


export function updateChartWithExtremaData(chart, series, data) {
    if (!data.every(item => isValidExtremaData(item))) {
        console.log('Invalid extrema data');
        return;
    }

    data.sort((a, b) => a.timestamp - b.timestamp);

    const lineData = data.map(item => ({
        time: item.timestamp / 1000,
        value: item.value,
    }));

    const uniqueLineData = lineData.reduce((acc, cur) => {
        if (!acc.some(item => item.time === cur.time)) {
            acc.push(cur);
        }
        return acc;
    }, []);

    updateSeriesData(series, uniqueLineData);
  

    const markersData = data.map(item => ({
        time: item.timestamp / 1000,
        position: item.type === 'maximum' ? 'aboveBar' : 'belowBar',
        color: item.type === 'maximum' ? 'red' : 'blue',
        shape: 'circle',
    }));

    series.setMarkers(markersData);
}

export function updateChartWithWaveData(chart, waveseries, data) {
    if (!data.every(item => isValidWaveData(item))) {
        console.log('Invalid wave data');
        return;
    }

    const processedData = processTimeFrames(data).flatMap(wave => ({
        time: wave.start / 1000,
        value: wave.startValue,
        color: wave.startValue < wave.endValue ? 'green' : 'red',
    }));
    updateSeriesData(waveseries, processedData)
    
}
  
/**
 * Updates the chart with trend data, including drawing trend lines and ranges.
 * @param {Object} chart - The chart instance to update.
 * @param {Array} data - The trend data to use for updating the chart.
 */
export function updateChartWithTrendData(chart, trends, ranges, breaks, data) {

    
        const trendData = [];
        const breakData = [];
        const rangeData = [];
      
        console.log(data)

        data.forEach((trend, index) => {
            console.log(trend, index)
          if (!isValidTrendData(trend)) {
            console.log('Missing or invalid data for trend:', trend);
            return;
          }
          
          trends.applyOptions({
            ...trendLineSeriesConfig,
            color: trend.direction === "U" ? 'white' : 'yellow',
        });
        
        breaks.applyOptions({
            ...breakTrendLineSeriesConfig,
            color: trend.direction === "U" ? 'white' : 'yellow',
        });

        ranges.applyOptions({
            ...rangesSeriesConfig,
            color: trend.direction === "U" ? 'lime' : 'red',
        });

          trendData.push(
            { time: trend.startTrend.timestamp / 1000, value: trend.startTrend.value },
            { time: trend.endTrend?.timestamp / 1000, value: trend.endTrend?.value }
          );
      
          const nextTrendEndTime = calculateNextTrendEndTime(trend, index, data, lastCandle);
        if (nextTrendEndTime == null) {
            console.error('Next trend end time calculation failed');
            return; // Skip this iteration due to calculation failure
        }
        if (nextTrendEndTime && trend.breakTrend  && trend.breakTrend.value != null) {
          breakData.push(
            { time: trend.breakTrend.timestamp / 1000, value: trend.breakTrend.value },
            { time: nextTrendEndTime, value: trend.breakTrend.value }
          );
        }
        if (trend.maxVolumeZone && trend.maxVolumeZone.startPrice != null && trend.maxVolumeZone.endPrice != null) {
          rangeData.push(
            
            { time: trend.maxVolumeZone.start / 1000, value: trend.maxVolumeZone.startPrice },
            { time: trend.maxVolumeZone.start  / 1000, value: trend.maxVolumeZone.endPrice },
            { time: trend.maxVolumeZone.end / 1000, value: trend.maxVolumeZone.endPrice },
            { time: trend.maxVolumeZone.end / 1000, value: trend.maxVolumeZone.startPrice },
            { time: trend.maxVolumeZone.start / 1000, value: trend.maxVolumeZone.startPrice },
            { time: trend.maxVolumeZone.end /1000 } //whitespace
          );
        }
      
    
      })
      if (trendData.length > 0) trends.setData(trendData);
    //  if (breakData.length > 0) breaks.setData(breakData);
      if (rangeData.length > 0) ranges.setData(rangeData);
    }

      


