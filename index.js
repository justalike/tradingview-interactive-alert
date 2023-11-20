const chartProperties = {
  width: 1920,
  height: 1080,
  layout: {
    background: { color: "#222" },
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
  }
}

// Declare these variables globally

let extremaData = [];
let lineSeries = [];
let waveSeries = [];
let trendLineSeries = [];


const domElement = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(domElement, chartProperties);
const candleSeries = chart.addCandlestickSeries()
//const fetchedData = fetchCandleData("BTC/USDT", "1m");
// Initialize the line series and assign it to the global variable
lineSeries = chart.addLineSeries();
waveSeries = chart.addLineSeries();


document.addEventListener('DOMContentLoaded', () => {
  // Set default values for symbol and timeframe
  const defaultSymbol = 'BTC/USDT';
  const defaultTimeframe = '1m';
  
  // Fetch candle data when the page is fully loaded
  fetchCandleData(defaultSymbol, defaultTimeframe);
  fetchAllLineData(defaultSymbol, defaultTimeframe);
});

document.getElementById('dataFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawData = JSON.parse(e.target.result);
        const formattedData = rawData.map(entry => ({
          time: entry.timestamp / 1000,
          open: parseFloat(entry.open),
          high: parseFloat(entry.high),
          low: parseFloat(entry.low),
          close: parseFloat(entry.close),
        }));
        console.log(formattedData);
        candleSeries.setData(formattedData);
      } catch (error) {
        console.log('Parsing error:', error);
      }
    };
    reader.onerror = (error) => console.log('File reading error:', error);
    reader.readAsText(file);
  }
});

document.getElementById('extremaFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawData = JSON.parse(e.target.result);
        // Update the global extremaData variable
        extremaData = rawData;
        // Now update the line series and markers with the new data
        updateChartWithData(rawData);
      } catch (error) {
        console.log('Parsing error:', error);
      }
    };
    reader.onerror = (error) => console.log('File reading error:', error);
    reader.readAsText(file);
  }
});


document.getElementById('waveFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const rawData = JSON.parse(e.target.result);
              updateWaveSeries(rawData);
          } catch (error) {
              console.log('Parsing error:', error);
          }
      };
      reader.onerror = (error) => console.log('File reading error:', error);
      reader.readAsText(file);
  }
});



document.getElementById('trendFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const rawData = JSON.parse(e.target.result);
              updateChartWithTrendData(rawData);
          } catch (error) {
              console.log('Parsing error:', error);
          }
      };
      reader.onerror = (error) => console.log('File reading error:', error);
      reader.readAsText(file);
  }
});


function updateChartWithTrendData(data) {
  data.forEach(trend => {

    if (!trend.startTrend || !trend.endTrend || !trend.startTrend.timestamp || !trend.endTrend.timestamp || !("value" in trend.startTrend) || !("value" in trend.endTrend)) {
      console.log('Missing or invalid data for trend:', trend);
      return;  }
      // Create a new line series for each trend
       trendLineSeries = chart.addLineSeries({
          color: trend.direction === 'up' ? 'green' : 'red', // Set color based on direction
          lineWidth: 2,
      });
      
      // Set the data for the trend line series
      trendLineSeries.setData([
          { time: trend.startTrend.timestamp / 1000, value: trend.startTrend.value },
          { time: trend.endTrend.timestamp / 1000, value: trend.endTrend.value },
      ]);
      
      // Set the markers on the trend line series
      trendLineSeries.setMarkers([
          { time: trend.startTrend.timestamp / 1000, position: 'aboveBar', color: 'yellow', shape: 'circle' },
      ])
      
  });
}

function updateChartWithData(data) {
  // Prepare the data for the line series
  const lineData = data.map(item => ({
    time: item.timestamp / 1000,
    value: item.value,
  }));
  // Set the data for the line series
  lineSeries.setData(lineData);

  // Prepare the data for the markers
  const markersData = data.map(item => ({
    time: item.timestamp / 1000,
    position: item.type === 'maximum' ? 'aboveBar' : 'belowBar',
    color: item.type === 'maximum' ? 'red' : 'blue',
    shape: 'circle',
  }));

  // Set the markers on the line series
  lineSeries.setMarkers(markersData);
}
function updateWaveSeries(data) {
  // Create an empty array to hold the formatted data
  const seriesData = [];


  function processTimeFrames(data) {
    // Step 1: Sort the data
    data.sort((a, b) => a.start - b.start);
  
    let processedData = [];
    
    for (let i = 0; i < data.length; i++) {
      let current = data[i];
      let next = data[i + 1];
      
      // If next doesn't exist, just push current and break
      if (!next) {
        //processedData.push(current);
        console.log(`Found null next! ${i}`);
        console.log(data[i]);
        break;
      }
      
      // Step 2: Handle overlapping time frames
      if (current.end > next.start) {
        console.log(`Found overlap! ${i}`);
        console.log(data[i])
        // Option: merge overlapping objects (simple merge shown here, adjust as needed)
        let merged = {
          start: current.start,
          end: Math.max(current.end, next.end),
          // ... merge other fields as necessary
        };
        processedData.push(merged);
        i++;  // Skip next object since it's merged
      } 
      // Step 3: Handle missing time frames
      else if (current.end < next.start) {
        console.log(`Found gap! ${i}`);
        console.log(data[i])
        processedData.push(current);  // Push current object
        // Fill the gap with a new object
        processedData.push({
          start: current.end,
          end: next.start,
          // ... fill other fields as necessary
        });
      } 
      else {
        processedData.push(current);  // No overlap or gap, just push current object
      }
    }
  
    return processedData;
  }
  
  // Usage:
  
   data = processTimeFrames(data);
  // Loop through each wave in the data
  for (let i = 0; i < data.length; i++) {
      const wave = data[i];
     
      // Skip this wave if it has no end or any value is null
      if (wave.end == null || wave.endValue == null || wave.start == null || wave.startValue == null) {
        console.log(`Found null wave! ${i}`);
        console.log(data[i])
        
          continue;  // Skip to the next iteration
      }
      
      // Determine the color based on the start and end values
       const color = wave.startValue < wave.endValue ? 'green' : 'red';
      
      // Create two points for this wave and add them to the seriesData array
      seriesData.push(
          { time: wave.start / 1000, value: wave.startValue, color },
          { time: wave.end / 1000, value: wave.endValue, color }
      );
  }

  // Update the wave series with the formatted data
  waveSeries.setData(seriesData);
}

function fetchCandleData(symbol, timeframe) {
  const apiUrl = `https://test-api-one-phi.vercel.app/api/data?symbol=${symbol}&timeframe=${timeframe}`; // Replace with your API endpoint

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Assuming 'data' is an array of candle objects
      const formattedData = data.map(candle => ({
        time: candle.timestamp / 1000, // Adjust if your API uses a different timestamp format
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }));

      // Update the candle series on the chart
      candleSeries.setData(formattedData);
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}
function fetchAllLineData(symbol, timeframe) {
  const apiUrl = `https://test-api-one-phi.vercel.app/api/lines?symbol=${symbol}&timeframe=${timeframe}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.extremum) {
        extremaData = data.extremum; 
        updateChartWithData(data.extremum);
      }

      if (data.wave) {
        updateWaveSeries(data.wave);
      }

      if (data.trends) {
        updateChartWithTrendData(data.trends);
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}
