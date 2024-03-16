import { updateSeriesData } from '../utils/utils'; // Assuming this utility exists

// Utility function to read and parse file content
const readFile = (file, onSuccess, onError) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rawData = JSON.parse(e.target.result);
      onSuccess(rawData);
    } catch (error) {
      console.error('Parsing error:', error);
      if (onError) onError(error);
    }
  };
  reader.onerror = (error) => {
    console.error('File reading error:', error);
    if (onError) onError(error);
  };
  reader.readAsText(file);
};

// Handlers for different data types
export const handleCandleDataUpload = (file, candleSeries) => {
  readFile(file, (rawData) => {
    const formattedData = rawData.map(entry => ({
      time: entry.timestamp / 1000, // Assuming timestamp is in milliseconds
      open: parseFloat(entry.open),
      high: parseFloat(entry.high),
      low: parseFloat(entry.low),
      close: parseFloat(entry.close),
    }));
    updateSeriesData(candleSeries, formattedData);
  });
};

export const handleExtremaDataUpload = (file, updateChartWithData) => {
  readFile(file, (rawData) => {
    updateChartWithData(rawData); // Assumes updateChartWithData is defined to handle extrema data
  });
};

export const handleWaveDataUpload = (file, updateWaveSeries) => {
  readFile(file, (rawData) => {
    updateWaveSeries(rawData); // Assumes updateWaveSeries is defined to handle wave data
  });
};

export const handleTrendDataUpload = (file, updateChartWithTrendData) => {
  readFile(file, (rawData) => {
    updateChartWithTrendData(rawData); // Assumes updateChartWithTrendData is defined to handle trend data
  });
};
