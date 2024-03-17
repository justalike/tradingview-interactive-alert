// Utility functions for series creation

export function processTimeFrames(data) {
  data.sort((a, b) => a.start - b.start);

  const processedData = [];

  for (let i = 0; i < data.length; i++) {


    

    const current = data[i];
      // If it's the last wave and has end or endValue as null
      if (i === data.length - 1) {
        if (current.end == null) {
          current.end = Date.now(); // Assuming end should be the current timestamp
        }
        if (current.endValue == null) {
          current.endValue = current.startValue; // Set endValue to startValue when endValue is null
        }
      }
      let merged = { ...current };
  
      while (i < data.length - 1 && merged.end > data[i + 1].start) {
        const next = data[i + 1];
        merged = {
          start: merged.start,
          end: Math.max(merged.end, next.end),
          startValue: merged.startValue,
          endValue: next.endValue != null ? Math.max(merged.endValue, next.endValue) : merged.endValue,
        };
        i++; // Move to the next wave since it's been merged
      }
    processedData.push(merged);
  }
  return processedData;
}
export function setChartSize(chart) {
  chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });
}
export const createSeries = (chart, type, config) => {
    const seriesTypes = {
      candlestick: () => chart.addCandlestickSeries(config),
      line: () => chart.addLineSeries(config),
      histogram: () => chart.addHistogramSeries(config),
      // Add more as needed
    };
    if (!seriesTypes[type]) {
        throw new Error(`Unsupported series type: ${type}`);
      }
    
      return seriesTypes[type]();
    };

export const updateSeriesData = (series, data) => {
    series.setData(data);
  };
  
  export const updateSeriesOptions = (series, options) => {
    series.applyOptions(options);
  };
  
  // Example: toggling the visibility of a series
  export const toggleSeriesVisibility = (series, isVisible) => {
    series.applyOptions({ visible: isVisible });
  };

  export const getQueryParams = async function() {
    try{
   console.log(`Getting query parameters`)
    const queryParams = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlSearchParams.entries()) {
      queryParams[key] = value;
    }
   console.log(`Query parameters: ${JSON.stringify(queryParams)}`)
    return queryParams;
  } catch (error) {
    console.error('Error getting query parameters:', error);
   }
  }


  const logNullValues = (array, name) => {
    array.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (value === null) {
          console.log(`${name} item ${index}, key '${key}' is null`);
        }
      });
    });
  }

  /**
 * Checks if an object meets all specified conditions.
 * @param {Object} object - The object to validate.
 * @param {Array} conditions - An array of conditions, each an object specifying the property to check and a function to validate it.
 * @returns {boolean} - True if all conditions are met, false otherwise.
 */
export function validateObject(object, conditions) {
  return conditions.every(condition => {
    const { property, validator } = condition;
    const value = object[property];
    return validator(value);
  });
}


export function calculateNextTrendEndTime(trend, index, data) {
  let nextTrendEndTime;

  if (index === data.length - 1) {
      // If it's the last trend, there's no "next" trend. Use an alternative reference for end time.
      // For example, this could be the last known candle time or simply the end time of the current trend.
      nextTrendEndTime = trend.endTrend.timestamp / 1000;
  } else if (trend.breakTrend && trend.breakTrend.timestamp > trend.endTrend.timestamp) {
      // If the break trend timestamp is later than the end trend timestamp,
      // it suggests an extension beyond the simple end to end trend line.
      // Use the start timestamp of the next trend in the sequence, ensuring continuity.
      nextTrendEndTime = data[index + 1].startTrend.timestamp / 1000;
  } else {
      // Otherwise, use the end timestamp of the current trend for a continuous line to the next.
      nextTrendEndTime = trend.endTrend.timestamp / 1000;
  }

  return nextTrendEndTime;
}
