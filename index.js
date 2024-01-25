

const chartProperties = {
  width: window.innerWidth,
  height: window.innerHeight,
  layout: {
    background: { color: "#161a25" },
    textColor: "#C3BCDB",
  },
  grid: {
    vertLines: { color: "#444" },
    horzLines: { color: "#444" },
  },
  crosshair: {
    mode: LightweightCharts.CrosshairMode.Normal,
  },
  priceScale: {
    borderColor: '#485c7b',
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
    borderColor: '#485c7b',
  },
}
let globalPairData = null;
let candleData = [];
let extremaData = [];
let lineSeries = [];
let waveSeries = [];
let volumeBarsSeries = [];
let trendLineSeries = [];
let volumeSeries = [];
let breakTrendLineSeries = [];
let rangesSeries = [];

const myPriceFormatter = p => p.toFixed(5);
const chartContainer = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(chartContainer, chartProperties);
setChartSize();



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
      globalPairData = await fetchWaveData(symbol, timeframe);
  } catch (error) {
      console.error('Error fetching wave data:', error);
  }
}

initializeWaveData()

//Tooltips:
chart.subscribeCrosshairMove(async function(param) {


if (
  param.point === undefined ||
		!param.time ||
		param.point.x < 0 ||
		param.point.x > chartContainer.clientWidth ||
		param.point.y < 0 ||
		param.point.y > chartContainer.clientHeight ){
 
      document.getElementById('tooltip').style.display = 'none';
      return;
  }
  const timestamp = param.time ;
  
 // console.log(`timestamp is ${timestamp}`) // Get the timestamp from the crosshair position
  await updateTooltipContent(globalPairData, timestamp, param); // Function to update tooltip content
});

async function updateTooltipContent(waveData, timestamp, param) {
  
  const wave = waveData.find(w => w.start/1000 <= timestamp && w.end/1000>= timestamp);
  if (wave) {
      showTooltip(wave, param.point);
  }
}

function showTooltip(wave, point) {
  const tooltip = document.getElementById('tooltip');
  
  const toolTipWidth = 80;
  const toolTipHeight = 80;
  const toolTipMargin = 15;

  tooltip.innerHTML = `
  <div>Start: ${wave.startValue}</div>
  <div>End: ${wave.endValue}</div>
  <div>Velocity: ${wave.velocity}</div>
`;

  tooltip.style.display = 'block';

  const y = point.y;
  let left = point.x + toolTipMargin;
  if (left > chartContainer.clientWidth - toolTipWidth) {
    left = point.x - toolTipMargin - toolTipWidth;
  }

  let top = y + toolTipMargin;
  if (top > chartContainer.clientHeight - toolTipHeight) {
    top = y - toolTipHeight - toolTipMargin;
  }
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
 //console.log(top, left)

}



//End of tooltips

volumeSeries = chart.addHistogramSeries({
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

lineSeries = chart.addLineSeries({
  lineWidth: 0.5,
  lineStyle: 2 // or LineStyle.Dashed
});
waveSeries = chart.addLineSeries({
  lineWidth: 2,
  lineStyle: 2
});
volumeBarsSeries = chart.addLineSeries({
  lineWidth: 2,
  lineStyle: 2
})


const candleSeries = chart.addCandlestickSeries()
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
       trendLineSeries = chart.addLineSeries({
          color: trend.direction == "U" ? 'white' : 'yellow', // Set color based on direction
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
      });

        breakTrendLineSeries = chart.addLineSeries({
          color: 'orange',
          lineWidth: 2,
          lineStyle: 2,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          overlay: true
        })

        rangesSeries = chart.addLineSeries({
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
          { time: trend.startTrend.timestamp / 1000, value: trend.maxVolumeZone.endPrice},
          { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.endPrice},
          { time: trend.endTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice},
          { time: trend.startTrend?.timestamp / 1000, value: trend.maxVolumeZone.startPrice},
      ]);

      // Set the data for the trend line series
      trendLineSeries.setData([
          { time: trend.startTrend.timestamp / 1000, value: trend.startTrend.value },
          { time: trend.endTrend?.timestamp / 1000, value: trend.endTrend?.value },
      ]);

        let nextTrendEndTime;

        if (index === data.length - 1) {
            // If it's the last trend, use the current timestamp
            nextTrendEndTime = Math.floor(Date.now()- 10000) / 1000;
        }
        
        else {
            // Otherwise, use the end time of the next trend
            
            nextTrendEndTime =  trend.endTrend.timestamp / 1000;
        }
        
        breakTrendLineSeries.setData([
        { time: trend.breakTrend.timestamp / 1000, value: trend.breakTrend.value },
        { time:nextTrendEndTime, value: trend.breakTrend.value },
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

function updateChartWithData(data) {
  //console.log(data)

  data.sort((a, b) => a.timestamp - b.timestamp);

  const lineData = data.map( (item, i) => {
    if (typeof item.timestamp !== 'number' || typeof item.value !== 'number') {
     // console.log('Invalid item data', item);

      if (item[i].timestamp == item[i-1].timestamp) {
      //  console.log('Two extrema in one candle found.', item);
        item[i].timestamp+1; // or return item[i-1] ?
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
  lineSeries.setMarkers(markersData);
}
function updateWaveSeries(data) {
  //console.log(`Waves: ${data.length}`)
  //console.log(data)
  // Create an empty array to hold the formatted data
  const seriesData = [];
  function processTimeFrames(data) {
    data.sort((a, b) => a.start - b.start);
    let processedData = [];

    for (let i = 0; i < data.length; i++) {
      let current = data[i];
      let next = data[i + 1];
      if (!next) {
        processedData.push(current);
       // console.log(`Reached the last timeframe at index: ${i}`);
        break;
      }
      // Detect overlap when the current end is greater than the next start
      if (current.end > next.start) {
       // console.log(`Overlap detected at index: ${i}`);
        // Merge overlapping timeframes by extending the end to the latest end time
        let merged = {
          start: current.start,
          end: Math.max(current.end, next.end),
          // Consider merging other relevant fields if necessary
        };
        processedData.push(merged);
        // Skip the next timeframe since it's merged into the current one
        i++;
      } else if (current.end < next.start) { // Detect a gap between the current and next timeframe
        //console.log(`Gap detected at index: ${i}`);
        // Push the current timeframe
        processedData.push(current);
        // Create a placeholder to fill the gap with null or some default values
        processedData.push({
          start: current.end,
          end: next.start,
          // Set other fields to null or defaults to indicate placeholder data
          placeholder: true, // An indicator that this is a placeholder object
        });
      } else {
        // No overlap or gap, push the current timeframe as is
        processedData.push(current);
      }
    }
    return processedData;
  }

   data = processTimeFrames(data);
  // Loop through each wave in the data
  for (let i = 0; i < data.length; i++) {
      const wave = data[i];
      const keyBar = wave?.maxVolCandle
      if (wave.start == null || wave.startValue == null) {
      //  console.log(`Found wave with null start at index ${i}:`, wave);
        continue; // Skip this wave as it has incomplete start data
      }
      // Skip this wave if it has no end or any value is null
      if (wave.end == null || wave.endValue == null) {
      //  console.log(`Found last ongoing wave at index ${i}:`, wave);
        seriesData.push(
          { time: wave.start / 1000, value: wave.startValue, color: 'blue' }, // Use a special color to indicate ongoing wave
          { time: Date.now() / 1000, value: wave.startValue, color: 'blue' }
          );

          continue;  // Skip to the next iteration
      }
      // Determine the color based on the start and end values
       const color = wave.startValue < wave.endValue ? 'green' : 'red';
       if (keyBar.maxVolumeBarMiddle == null || keyBar.volume == null) {
        console.log(`Found wave with null maxVolumeBarMiddle or maxVolume at index ${i}:`, wave);
        continue;
      }
       if (keyBar){
        const { timestamp, high, low, open, close, maxVolumeBarMiddle, volume } = keyBar;
        //console.log(`timestamp: ${timestamp}, maxVolumeBarMiddle: ${maxVolumeBarMiddle}, maxVolume: ${volume}`)
        const newCandles = []
        for (let candle of candleData) {
          if (candle.time === timestamp / 1000) {
            candle.color = 'orange';
            candle.wickColor = 'orange';
            candle.borderColor = 'orange';
            newCandles.push(candle);
          } else {
            newCandles.push(candle);
          }
        }
            candleSeries.setData(newCandles);

         function createAndSetLineSeries(data) {
           const lineSeries = chart.addLineSeries({
             color: 'white',
             lineWidth: 2,
             lineStyle: 2,
             lastValueVisible: false,
             priceLineVisible: false,
             crosshairMarkerVisible: false,
             overlay: true
           });
           lineSeries.setData(data);
         }

        const lineData = [
          { time: timestamp / 1000, value:maxVolumeBarMiddle, color: 'white' },
          { time: wave.end / 1000, value: maxVolumeBarMiddle, color: 'white' }
        ];
        createAndSetLineSeries(lineData);
        // volumeBarsData.push(
      }
      // Create two points for this wave and add them to the seriesData array
      seriesData.push(
          { time: wave.start / 1000, value: wave.startValue, color },
          { time: wave.end / 1000, value: wave.endValue, color }
      );
  }
  // Update the wave series with the formatted data
  waveSeries.setData(seriesData);
  //volumeBarsSeries.setData(volumeBarsData);
}

async function fetchCandleData(symbol, timeframe) {
  try{
  const apiUrl = `https://test-api-one-phi.vercel.app/api/data?symbol=${symbol}&timeframe=${timeframe}`; // Replace with your API endpoint

  const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
     const data = await response.json();
      const formattedData = data.map(candle => ({
        time: candle.timestamp / 1000,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }));
      const volumeData = data.map( candle => ({
        time: candle.timestamp / 1000,
        value: parseFloat(candle.volume)
      }));

      candleSeries.setData(formattedData);
      volumeSeries.setData(volumeData)
      candleData = formattedData;
    } catch(error) {
      console.error('Fetch error:', error);
    }
}
async function fetchAllLineData(symbol, timeframe) {
  const apiUrl = `https://test-api-one-phi.vercel.app/api/lines?symbol=${symbol}&timeframe=${timeframe}`;
    try{
  const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.extremum) {  
       
        updateChartWithData(data.extremum);
      }

      if (data.wave) {
        console.log(data.wave)
        updateWaveSeries(data.wave);
      }

      if (data.trends) {
        console.log(data.trends)
        updateChartWithTrendData(data.trends);
      }
    } catch(error) {
      console.error('Fetch error:', error);
    };
}

// Function to parse query parameters
async function getQueryParams() {
  try{
 // console.log(`Getting query parameters`)
  const queryParams = {};
  const urlSearchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlSearchParams.entries()) {
    queryParams[key] = value;
  }
 // console.log(`Query parameters: ${JSON.stringify(queryParams)}`)
  return queryParams;
} catch (error) {
  console.error('Error getting query parameters:', error);
 }
}

// Function to initialize the chart with data based on URL parameters
async function initializeChartWithData() {
  try{
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

// function createAndSetBreakTrendSeries(data) {
//   const lineSeries = chart.addLineSeries({
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
