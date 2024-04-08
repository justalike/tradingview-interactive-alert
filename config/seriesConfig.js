// Configuration for the line series used for trends
export const trendLineSeriesConfig = {
  //color: 'white', // Default color, can be overridden when creating the series
  lineWidth: 2,
  priceLineVisible: false,
  crosshairMarkerVisible: false,
};

// Configuration for the break trend line series
export const breakTrendLineSeriesConfig = {
  //color: 'white', // Default color, similar to trendLineSeriesConfig, can be overridden
  lineWidth: 2,
  lineStyle: 2, // Assuming this implies a dashed line
  lastValueVisible: false,
  priceLineVisible: false,
  crosshairMarkerVisible: false,
  overlay: true,
};

// Configuration for the ranges series (used for volume zones, etc.)
export const rangesSeriesConfig = {
  //color: 'lime', // Default color, to be overridden based on trend direction
  lineWidth: 2,
  lineStyle: 1, // Assuming this implies a solid line
  lastValueVisible: false,
  priceLineVisible: false,
  crosshairMarkerVisible: false,
  overlay: true,
};

export const volumeSeriesConfig = {
  color: '#26a69a',
  priceFormat: {
    type: 'volume',
  },
  priceScaleId: '',
  scaleMargins: {
    top: 0.7,
    bottom: 0,
  },
};

export const lineSeriesConfig = {
  lineWidth: 0.5,
  lineStyle: 2, // LightweightCharts.LineStyle.Dashed
};

export const waveSeriesConfig = {
  lineWidth: 2,
  lineStyle: 2,
};

export const volumeBarsSeriesConfig = {
  lineWidth: 2,
  lineStyle: 2,
};

export const candleSeriesConfig = {
  scaleMargins: {
    top: 0.2,
    bottom: 0.3,
  },
  format: {
    type: "price",
    precision: 4,
    minMove: 0.001,
  },
};

export const vmaSeriesConfig =  {
  color: '#EBA500',
  lineWidth: 2,
  lineType: 2,
  priceFormat: {
    type: 'volume',
  },
  priceScaleId: '',
  scaleMargins: {
    top: 0.7,
    bottom: 0,
  },

}
