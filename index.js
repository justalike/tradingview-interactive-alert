
import { connectWebSocket } from "./ws.js";
import { chartProperties, volumeSeriesConfig, lineSeriesConfig } from './config/chartConfig.js';
import { createSeries } from './utils/utils.js';



const myPriceFormatter = p => p.toFixed(5);
const chartContainer = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(chartContainer, chartProperties);
setChartSize();

let globalCandleData = [];
let lineSeries = [];
let waveSeries = [];
let volumeBarsSeries = [];
let trendLineSeries = [];
let volumeSeries = [];
let breakTrendLineSeries = [];
let rangesSeries = [];
var lastCandle = null;


// Series configuration
volumeSeries = chart.addSeries(HistogramSeries, {
  color: '#26a69a',
  priceFormat: {
    type: 'volume',
  },
  priceScaleId: '',
  scaleMargins: {
    top: 0.7, // highest point 70% away from the top
    bottom: 0,
  },

});
volumeSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.7,
    bottom: 0,
  },
});

lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
  lineWidth: 0.5,
  lineStyle: 2 // or LineStyle.Dashed
});
waveSeries = chart.addSeries(LightweightCharts.LineSeries, {
  lineWidth: 2,
  lineStyle: 2
});
volumeBarsSeries = chart.addSeries(LightweightCharts.LineSeries, {
  lineWidth: 2,
  lineStyle: 2
})



const candleSeries = chart.addSeries(CandlestickSeries, {})

candleSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.2, // highest point of the series will be 10% away from the top
    bottom: 0.3, // lowest point will be 40% away from the bottom
  },
  format: {
    type: "price",
    precision: 4,
    minMove: 0.001,
  },
});


chart.applyOptions({
  localization: {
    priceFormatter: myPriceFormatter,
  },
});
window.addEventListener('resize', setChartSize);
document.addEventListener('DOMContentLoaded', initializeChartWithData);

async function fetchWaveData(symbol, timeframe) {
  const apiUrl = `https://test-api-one-phi.vercel.app/api/lines?symbol=${symbol}&timeframe=${timeframe}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.wave; // Assuming 'wave' is the key for the wave data
  } catch (error) {
    console.error('Fetch error:', error);
    return null; // Return null or an empty array as per your error handling strategy
  }
}

async function initializeWaveData() {
  try {
    const { symbol, timeframe } = await getQueryParams();
    await fetchCandleData(symbol, timeframe)

    const preloadHistoryStatus = await preLoadHistoryCandles(symbol, timeframe);
    console.log(preloadHistoryStatus)
    globalPairData = await fetchWaveData(symbol, timeframe);

  } catch (error) {
    console.error('Error fetching wave data:', error);
  }
}

initializeWaveData()





export function updateCandleSeries(data) {
  candleSeries.update(data);
}


// document.getElementById('dataFile').addEventListener('change', (event) => {
//   const file = event.target.files[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const rawData = JSON.parse(e.target.result);
//         const formattedData = rawData.map(entry => ({
//           time: entry.timestamp / 1000,
//           open: parseFloat(entry.open),
//           high: parseFloat(entry.high),
//           low: parseFloat(entry.low),
//           close: parseFloat(entry.close),
//         }));
//         console.log(formattedData);
//         candleSeries.setData(formattedData);
//       } catch (error) {
//         console.log('Parsing error:', error);
//       }
//     };
//     reader.onerror = (error) => console.log('File reading error:', error);
//     reader.readAsText(file);
//   }
// });

// document.getElementById('extremaFile').addEventListener('change', (event) => {
//   const file = event.target.files[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const rawData = JSON.parse(e.target.result);
//         // Update the global extremaData variable
//         extremaData = rawData;
//         // Now update the line series and markers with the new data
//         updateChartWithData(rawData);
//       } catch (error) {
//         console.log('Parsing error:', error);
//       }
//     };
//     reader.onerror = (error) => console.log('File reading error:', error);
//     reader.readAsText(file);
//   }
// });


// document.getElementById('waveFile').addEventListener('change', (event) => {
//   const file = event.target.files[0];
//   if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//           try {
//               const rawData = JSON.parse(e.target.result);
//               updateWaveSeries(rawData);
//           } catch (error) {
//               console.log('Parsing error:', error);
//           }
//       };
//       reader.onerror = (error) => console.log('File reading error:', error);
//       reader.readAsText(file);
//   }
// });



// document.getElementById('trendFile').addEventListener('change', (event) => {
//   const file = event.target.files[0];
//   if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//           try {
//               const rawData = JSON.parse(e.target.result);
//               updateChartWithTrendData(rawData);
//           } catch (error) {
//               console.log('Parsing error:', error);
//           }
//       };
//       reader.onerror = (error) => console.log('File reading error:', error);
//       reader.readAsText(file);
//   }
// });


function updateChartWithTrendData(data) {
  data.forEach((trend, index) => {
    // console.log(trend)
    if (!trend.startTrend || !trend.endTrend ||
      !trend.startTrend.timestamp || !trend.endTrend.timestamp ||
      !trend.breakTrend.timestamp || !trend.breakTrend.value ||
      typeof trend.startTrend.value !== 'number' || typeof trend.endTrend.value !== 'number' || typeof trend.breakTrend.value !== 'number') {
      console.log('Missing or invalid data for trend:', trend);
      return;
    }
    trendLineSeries = chart.addSeries(LightweightCharts.LineSeries, {
      color: trend.direction == "U" ? 'white' : 'yellow', // Set color based on direction
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    breakTrendLineSeries = chart.addSeries(LightweightCharts.LineSeries, {
      color: trend.direction == "U" ? 'white' : 'yellow',
      lineWidth: 2,
      lineStyle: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      overlay: true
    })

    rangesSeries = chart.addSeries(LightweightCharts.LineSeries, {
      color: trend.direction === "U" ? 'lime' : 'red',
      lineWidth: 2,
      lineStyle: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      overlay: true
    })

    rangesSeries.setData([
      { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
      { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.endPrice },
      { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.endPrice },
      { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
      { time: trend.startTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice },
    ]);

    // Set the data for the trend line series
    trendLineSeries.setData([
      { time: trend.startTrend.timestamp / 1000, value: trend.startTrend.value },
      { time: trend.endTrend?.timestamp / 1000, value: trend.endTrend?.value },
    ]);

    let nextTrendEndTime;

    if (index === data.length - 1) {
      // If it's the last trend, use the current timestamp

      //nextTrendEndTime = Math.floor(Date.now()) / 1000;
      nextTrendEndTime = lastCandle.time
    }
    else if (trend.breakTrend.timestamp > trend.endTrend.timestamp) {
      // if breaktrend is further than the endTrend extremum
      nextTrendEndTime = data[index + 1].endTrend.timestamp / 1000
    }

    else {
      // Otherwise, use the end time of the next trend

      nextTrendEndTime = trend.endTrend.timestamp / 1000;
    }



    breakTrendLineSeries.setData([
      { time: trend.breakTrend.timestamp / 1000, value: trend.breakTrend.value },
      { time: nextTrendEndTime, value: trend.breakTrend.value },
    ])

    let endTrendMarkerPos = trend.direction == "D" ? 'belowBar' : 'aboveBar';
    let startTrendMarkerPos = trend.direction == "D" ? 'aboveBar' : 'belowBar';
    // Set the markers on the trend line series
    LightweightCharts.createSeriesMarkers(trendLineSeries, [
      { time: trend.startTrend.timestamp / 1000, position: endTrendMarkerPos, color: 'yellow', shape: 'square', text: trend.startTrend.value },
      { time: trend.endTrend?.timestamp / 1000, position: startTrendMarkerPos, color: 'yellow', shape: 'square', text: trend.endTrend?.value },
    ])
  });
}

function updateChartWithData(data) {
  //console.log(data)

  data.sort((a, b) => a.timestamp - b.timestamp);

  const lineData = data.map((item, i) => {
    if (typeof item.timestamp !== 'number' || typeof item.value !== 'number') {
      // console.log('Invalid item data', item);

      if (item[i].timestamp == item[i - 1].timestamp) {
        //  console.log('Two extrema in one candle found.', item);
        item[i].timestamp + 1; // or return item[i-1] ?
        return item[i]
      }

      return null;
    }
    return {
      time: item.timestamp / 1000,
      value: item.value,
    };
  }).filter(item => item !== null);


  const uniqueLineData = lineData.reduce((acc, cur) => {
    if (!acc.some(item => item.time === cur.time)) {
      acc.push(cur);
    }
    return acc;
  }, []);
  lineSeries.setData(uniqueLineData);


  // Prepare the data for the markers
  const markersData = data.map(item => ({
    time: item.timestamp / 1000,
    position: item.type === 'maximum' ? 'aboveBar' : 'belowBar',
    color: item.type === 'maximum' ? 'red' : 'blue',
    shape: 'circle',
  }));

  console.log(markersData)

  // Set the markers on the line series
  LightweightCharts.createSeriesMarkers(lineSeries, markersData);
}
function updateWaveSeries(chart, data) {
  if (!data.every(item => isValidWaveData(item))) {
    console.log('Invalid wave data');
    return;
  }

  const processedData = processTimeFrames(data).flatMap(wave => {
    const color = wave.startValue < wave.endValue ? 'green' : 'red';
    return [
      { time: wave.start / 1000, value: wave.startValue, color },
      { time: wave.end / 1000, value: wave.endValue, color }
    ];
  });

  chart.waveSeries.setData(processedData);
}

function isValidWaveData(wave) {
  return typeof wave.start === 'number' && typeof wave.startValue === 'number' &&
    typeof wave.end === 'number' && typeof wave.endValue === 'number';
}

function processTimeFrames(data) {
  data.sort((a, b) => a.start - b.start);
  const processedData = [];
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    let merged = current;
    while (i < data.length - 1 && current.end > data[i + 1].start) {
      const next = data[i + 1];
      merged = {
        start: current.start,
        end: Math.max(merged.end, next.end),
        startValue: current.startValue,
        endValue: next.endValue ? Math.max(merged.endValue, next.endValue) : merged.endValue
      };
      i++;
    }
    processedData.push(merged);
  }
  return processedData;
}


function processTimeFrames(data) {
  data.sort((a, b) => a.start - b.start);
  const processedData = [];
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const next = data[i + 1];
    if (!next || current.end <= next.start) {
      processedData.push(current);
    } else {
      let merged = {
        start: current.start,
        end: Math.max(current.end, next.end),
        startValue: current.startValue,
        endValue: next.endValue ? Math.max(current.endValue, next.endValue) : current.endValue
      };
      i++; // Skip next as it's merged
      processedData.push(merged);
    }
  }
  return processedData;
}




// Function to parse query parameters


// Function to initialize the chart with data based on URL parameters
async function initializeChartWithData() {
  try {
    const { symbol, timeframe } = await getQueryParams();


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
    if (symbol && timeframe) {

      await fetchCandleData(symbol, timeframe);
      await fetchAllLineData(symbol, timeframe);
    } else {
      await fetchCandleData("BTC/USDT", "1h");
      await fetchAllLineData("BTC/USDT", "1h");
    }
  } catch (error) {
    console.error('Error initializing chart with data:', error);
  }
}

function setChartSize() {
  chartProperties.width = document.body.clientWidth,
    chartProperties.height = document.body.clientHeight
  chart.applyOptions(chartProperties);
}




document.getElementById('loadDataButton').addEventListener('click', async () => {
  // Fetching symbol and timeframe from URL query parameters
  const { symbol, timeframe } = await getQueryParams();
  const apiUrl = `https://test-api-one-phi.vercel.app/api/get_history_candles?symbol=${symbol}&timeframe=${timeframe}`;
  try {
    const response = await fetch(apiUrl);
    console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }


    const historyData = await response.json();

    const newCandleData = historyData.map(dataPoint => ({
      time: dataPoint.timestamp / 1000, // Convert ms to s for the chart
      open: dataPoint.open,
      high: dataPoint.high,
      low: dataPoint.low,
      close: dataPoint.close,
    }));
    const newVolumeData = historyData.map(dataPoint => ({
      time: dataPoint.timestamp / 1000, // Convert ms to s for the chart
      value: dataPoint.volume,
    }));

    candleSeries.setData(newCandleData);
    volumeSeries.setData(newVolumeData);
    // all lines data go there


  } catch (error) {
    console.error('Failed to load new data:', error);
  }
});


connectWebSocket()

// function createAndSetBreakTrendSeries(data) {
//   const lineSeries = chart.addSeries(LightweightCharts.LineSeries,{
//     color: 'green',
//     lineWidth: 2,
//     lineStyle: 2,
//     lastValueVisible: false,
//     priceLineVisible: false,
//     crosshairMarkerVisible: false,
//     overlay: true
//   });
//   breakTrendLineSeries.setData(data);

// }
