import { updateSeriesData, processTimeFrames, getQueryParams, processKeyBars, findMatchingCandle, findRangeCandles, calculateVMA} from '../utils/utils.js'; 
import {isValidExtremaData, isValidWaveData } from '../utils/validation.js';
import {fetchCandleData, fetchAllLineData, getHistoryCandles} from '../api/dataService.js';

var trendSeries = [];

var lastCandle;
var fetchedCandles;
export const initializeChartWithData = async (chart, series,  sym = 'BTC/USDT', tf = '1h')  => {
   try{

    const { symbol, timeframe } = await getQueryParams();
  
    const qsymbol = symbol || sym;
    const qtimeframe = timeframe || tf;

    if (!qsymbol || !qtimeframe) {
        console.error('None symbol or timeframe set in query. \n Initializing BTCUSDT/1h chart');
    }

    //Get data required to fill the chart
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
        fetchedCandles = data
        lastCandle = data[data.length - 1];
        const volData = data.map(({ time, volume }) => ({ time: time, value:volume }));
         // calculate Volume moving average with length 200
      const VMA200 = calculateVMA(volData, 200);
      // calculate Volume moving average with length 5
      
      const VMA5 =  calculateVMA(volData, 5);
  
        series.volume_series.priceScale().applyOptions({
            scaleMargins: {
                top: 0.7,
                bottom: 0,
            },
        })

        updateSeriesData(series.candles_series, data)
        updateSeriesData(series.volume_series, volData )
        updateSeriesData(series.vma_200, VMA200)
        updateSeriesData(series.vma_5, VMA5)
           //updateCandleSeries(data);
       } else if (name === 'extrema') {
       
           updateChartWithExtremaData(chart, series.extrema_series,  data);
       } else if (name === 'waves') {
      
         updateChartWithWaveData(chart, series.wave_series, series.candles_series, dataSources.candles, data);
       } else if (name === 'trends') {
       
           updateChartWithTrendData(chart, fetchedCandles, data);
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
   
    
  } catch (error) {
    console.error('Error initializing chart with data:', error);
  }
}
   
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

export function updateChartWithWaveData(chart, waveseries, candleSeries, candleSeriesData, data) {
    // if (!data.every(item => isValidWaveData(item))) {
    //     console.log('Invalid wave data');
    //     return;
    // }

   

    const validData = data.filter(item => isValidWaveData(item));

    const processedData = processTimeFrames(validData).flatMap(wave => ({
        time: wave.start / 1000,
        value: wave.startValue,
        color: wave.startValue < wave.endValue ? 'green' : 'red',
    }));

    processKeyBars(chart, waveseries, candleSeries, candleSeriesData, validData)
 
    updateSeriesData(waveseries, processedData)
    
}
  
/**
 * Updates the chart with trend data, including drawing trend lines and ranges.
 * @param {Object} chart - The chart instance to update.
 * @param {Array} data - The trend data to use for updating the chart.
 */

export function updateChartWithTrendData(chart, candlesData, data) {

  trendSeries.forEach(series => chart.removeSeries(series));
  trendSeries.forEach(series => series.setMarkers([]));
  trendSeries = []
// We have to create new series for each trend lines we are pushing. otherwise it wont work
// because it tries to connect dots {}'s between each trend line / range / breaktrend
    data.forEach((trend, index) => {
     //console.log(trend)
      if (!trend.startTrend || !trend.endTrend ||
        !trend.startTrend.timestamp || !trend.endTrend.timestamp ||
        !trend.breakTrend.timestamp || !trend.breakTrend.value ||
        !trend.maxVolumeZone.start || !trend.maxVolumeZone.startPrice ||
        typeof trend.startTrend.value !== 'number' || typeof trend.endTrend.value !== 'number' || typeof trend.breakTrend.value !== 'number') {
      console.log('Missing or invalid data for trend:', trend);
      return;
    }
    
    trend.direction = trend.direction || trend.trendDirection; 

         let trendLineSeries = chart.addLineSeries({
            color: trend.direction == "U" ? 'white' : 'yellow', // Set color based on direction
            lineWidth: 2,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        trendSeries.push(trendLineSeries);
  
         let breakTrendLineSeries = chart.addLineSeries({
            color: trend.direction == "U" ? 'white' : 'yellow',
            lineWidth: 2,
            lineStyle: 2,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            overlay: true
          })

          trendSeries.push(breakTrendLineSeries);
  
          let rangesSeries = chart.addLineSeries({
            color: trend.direction === "U" ? 'lime' : 'red',
            lineWidth: 2,
            lineStyle: 1,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            overlay: true
          })

          trendSeries.push(rangesSeries);
  
          let { firstRangeCandle, lastRangeCandle } = findRangeCandles(trend.maxVolumeZone, candlesData) || {firstRangeCandle: null, lastRangeCandle: null}

          //console.log(firstRangeCandle, lastRangeCandle)
          if (!firstRangeCandle || !lastRangeCandle) {
            firstRangeCandle = { time: trend.startTrend.timestamp/1000}
            lastRangeCandle = { time :trend.endTrend.timestamp/1000}
          }

        //    rangesSeries.setData([
        //     { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
        //     { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.endPrice},
        //     { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.endPrice},
        //     { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice},
        //     { time: trend.startTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice},
        // ]);

        rangesSeries.setData([
          { time: firstRangeCandle.time, value: trend.maxVolumeZone.startPrice },
          { time: firstRangeCandle.time, value: trend.maxVolumeZone.endPrice},
          { time: lastRangeCandle.time, value: trend.maxVolumeZone.endPrice},
          { time: lastRangeCandle.time , value: trend.maxVolumeZone.startPrice},
          { time: firstRangeCandle.time, value: trend.maxVolumeZone.startPrice},
      ]);
  
        // Set the data for the trend line series
        trendLineSeries.setData([
            { time: trend.startTrend.timestamp / 1000, value: trend.startTrend.value },
            { time: trend.endTrend?.timestamp / 1000, value: trend.endTrend?.value },
        ]);
  
        const lastCandle = candlesData[candlesData.length - 1];
          let nextTrendEndTime;
  
          if (index === data.length - 1) {
              // If it's the last trend, use the last candle timestamp
            //  console.log('lastCandle', lastCandle)
              nextTrendEndTime = lastCandle.time || Date.now() / 1000
             // console.log(nextTrendEndTime, 'nextTrendEndTime')
          }
          else if (trend.breakTrend.timestamp > trend.endTrend.timestamp){

            const breakTrendEndCandle = findMatchingCandle(trend, candlesData);
            if (!breakTrendEndCandle) console.log(`breakTrendEndCandle is:` , breakTrendEndCandle)
              // if breaktrend is further than the endTrend extremum
            //  console.log(`trend ${trend} has breakTrend timestamp > endTrend timestamp`)
              nextTrendEndTime = breakTrendEndCandle?.time || lastCandle.time || Date.now() / 1000
            //nextTrendEndTime = data[index+1].endTrend.timestamp / 1000
          }
          
          else {


        const breakTrendEndCandle = findMatchingCandle(trend, candlesData);
              // Otherwise, use the end time of the next trend
             // nextTrendEndTime =  trend.endTrend.timestamp / 1000;
              if (!breakTrendEndCandle) console.log(`breakTrendEndCandle is:` , breakTrendEndCandle)
              nextTrendEndTime = breakTrendEndCandle?.time || lastCandle.time || Date.now() / 1000
        //    console.log(nextTrendEndTime, 'nextTrendEndTime')
          }
          
  
  
          breakTrendLineSeries.setData([
          { time: trend.breakTrend.timestamp / 1000, value: trend.breakTrend.value },
          { time: nextTrendEndTime, value: trend.breakTrend.value },
        ])
  
          let endTrendMarkerPos = trend.direction == "D" ? 'belowBar' : 'aboveBar';
          let startTrendMarkerPos = trend.direction == "D"  ? 'aboveBar' : 'belowBar';
        // Set the markers on the trend line series
        trendLineSeries.setMarkers([
            { time: trend.startTrend.timestamp / 1000, position: endTrendMarkerPos, color: 'yellow', shape: 'square', text: trend.startTrend.value},
            { time: trend.endTrend?.timestamp / 1000, position: startTrendMarkerPos, color: 'yellow', shape: 'square', text: trend.endTrend?.value},
          ])
    });
  }      


  export async function loadHistoryToChart(series, symbol, timeframe) {
    const existingCandles = await getHistoryCandles(symbol, timeframe);
    const fetchedCandles = await fetchCandleData(symbol, timeframe) || [];
  
    const mergedCandles = [...existingCandles
                                .filter(candle => candle.time < fetchedCandles[0].time),
                          ...fetchedCandles];
                           //console.log(mergedCandles.length)
    const volumes = mergedCandles.map(({ time, volume }) => ({ time, value: volume }));
  
    updateSeriesData(series.historycandles_series, mergedCandles)
    updateSeriesData(series.historyvolume_series, volumes )
    
  }
  