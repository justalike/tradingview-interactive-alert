import { createSeries, updateSeriesData, processTimeFrames } from '../utils/utils'; 
import { isValidTrendData, isValidExtremaData, isValidWaveData } from '../validation';
import { trendLineSeriesConfig, breakTrendLineSeriesConfig, rangesSeriesConfig } from '../config/seriesConfig';
import {fetchCandleData, fetchExtremaData, fetchTrendData, fetchWaveData} from '../api/dataService';

export const initializeChartWithData = async (chart, sym = 'BTCUSDT', tf = '1h')  => {

   try{
    const { qsymbol, qtimeframe } = await getQueryParams();
    const symbol = qsymbol || sym;
    const timeframe = qtimeframe || tf;

    if (!qsymbol || !qtimeframe) {
        console.error('None symbol or timeframe set in query. \n Initializing BTCUSDT/1h chart');
    }


   const series = {candles_series, extrema_series, waves_series, trends_series, ranges_series, breaktrend_series}
   const dataSources = {
            candles: (await fetchCandleData(symbol, timeframe)),
            extrema: (await fetchExtremaData(symbol, timeframe)),
            waves:   (await fetchWaveData(symbol, timeframe)),
            trends:  (await fetchTrendData(symbol, timeframe))
  };
  

   for (const [name, data] of Object.entries(dataSources)) {
       if (!data) {
           console.error('Failed to fetch data from source ' + name);
          // return;
       }

       if (name === 'candles') {
        updateSeriesData(series.candles_series, data)
           //updateCandleSeries(data);
       } else if (name === 'extrema') {
           updateChartWithExtremaData(chart, extrema_series, data);
       } else if (name === 'waves') {
           updateChartWithWaveData(chart, waves_series, data);
       } else if (name === 'trends') {
           updateChartWithTrendData(chart, trends_series, ranges_series, breaktrend_series, data);
       }
   }

  chart.applyOptions({
      watermark: {
          visible: true,
          fontSize: 52,
          horzAlign: 'center',
          vertAlign: 'top',
          color: 'rgba(255, 255, 255, 0.7)',
          text: `${symbol}:${timeframe}`,
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

    chart.series.setMarkers(markersData);
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
    data.forEach((trend, index) => {
        if (!isValidTrendData(trend)) {
            console.log('Missing or invalid data for trend:', trend);
            return;
        }
        const trendSeries = chart.addLineSeries({
            ...trendLineSeriesConfig,
            color: trend.direction === "U" ? 'white' : 'yellow',
        });
        trendSeries.setData([
            { time: trend.startTrend.timestamp / 1000, value: trend.startTrend.value },
            { time: trend.endTrend?.timestamp / 1000, value: trend.endTrend?.value },
        ]);

        let nextTrendEndTime = calculateNextTrendEndTime(trend, index, data);

        const breakSeries = chart.addLineSeries({
            ...breakTrendLineSeriesConfig,
            color: trend.direction === "U" ? 'white' : 'yellow',
        });
        breakSeries.setData([
            { time: trend.breakTrend.timestamp / 1000, value: trend.breakTrend.value },
            { time: nextTrendEndTime, value: trend.breakTrend.value },
        ]);

        const rangeSeries = chart.addLineSeries({
            ...rangesSeriesConfig,
            color: trend.direction === "U" ? 'lime' : 'red',
        });
        rangeSeries.setData([
            { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
            { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.endPrice },
            { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.endPrice },
            { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
            { time: trend.startTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
        ]);
    });
}
