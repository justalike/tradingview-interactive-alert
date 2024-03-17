
import {createSeries, setChartSize, getQueryParams} from './utils/utils.js';
import {waveSeriesConfig, candleSeriesConfig, lineSeriesConfig, volumeSeriesConfig} from './config/seriesConfig.js';
import { chartProperties, myPriceFormatter} from './config/chartConfig.js';
import { initializeChartWithData } from './chart/chartUpdateService.js';
import { handleCandleDataUpload } from './local/localHandler.js';

console.log(`__..--`.repeat(10))

const chartContainer = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(chartContainer, chartProperties);

// Applying global chart options
chart.applyOptions({
  localization: {
    priceFormatter: myPriceFormatter,
  },
});

// Creating series
const volumeSeries = createSeries(chart, 'histogram', volumeSeriesConfig);
const lineSeries =   createSeries(chart, 'line', lineSeriesConfig);
const waveSeries =   createSeries(chart, 'line', waveSeriesConfig);
const candleSeries = createSeries(chart, 'candlestick', candleSeriesConfig);


window.addEventListener('resize', setChartSize(chart));
document.addEventListener('DOMContentLoaded', initializeChartWithData(chart));


document.getElementById('dataFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) handleCandleDataUpload(file, candleSeries);
  });