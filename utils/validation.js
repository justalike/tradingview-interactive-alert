import { validateObject } from './utils.js';
/**
 * Validates trend data using the generic validation utility.
 * @param {Object} trend - The trend data to validate.
 * @returns {boolean} - True if the trend data is valid, false otherwise.
 */
export function isValidTrendData(trend) {
    const conditions = [
      { property: 'startTrend', validator: value => value !== undefined && value.timestamp !== undefined },
      { property: 'endTrend', validator: value => value !== undefined && value.timestamp !== undefined },
      { property: 'direction', validator: value => typeof value === 'string' && (value === 'U' || value === 'D') },
   
      // Add more conditions as needed for your trend validation
    ];
  
    return validateObject(trend, conditions);
  }

  /**
 * Validates extrema data using the generic validation utility.
 * @param {Object} extrema - The extrema data to validate.
 * @returns {boolean} - True if the extrema data is valid, false otherwise.
 */
export function isValidExtremaData(extrema) {
    const conditions = [
      { property: 'timestamp', validator: value => typeof value === 'number' },
      { property: 'value', validator: value => typeof value === 'number' },
      // Include additional conditions specific to extrema data as needed
    ];
  
    return validateObject(extrema, conditions);
  }
  
  /**
   * Validates wave data using the generic validation utility.
   * @param {Object} wave - The wave data to validate.
   * @returns {boolean} - True if the wave data is valid, false otherwise.
   */
  export function isValidWaveData(wave) {
    const conditions = [
      { property: 'start', validator: value => typeof value === 'number' },
      { property: 'startValue', validator: value => typeof value === 'number' },
      { property: 'end', validator: value => typeof value === 'number' },
      { property: 'endValue', validator: value => typeof value === 'number' },
      // Conditions for optional properties like `maxVolCandle` could be added here
    ];
  
    return validateObject(wave, conditions);
  }
  