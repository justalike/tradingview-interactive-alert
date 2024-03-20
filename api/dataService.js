
/**
 * Fetches historical candle data for a given symbol and timeframe.
 * @param {string} symbol - The symbol to fetch data for.
 * @param {string} timeframe - The timeframe for the data.
 * @returns {Promise<Array>} - The fetched candle data.
 */
async function fetchCandleData(symbol, timeframe) {
    const apiUrl = `https://test-api-one-phi.vercel.app/api/rdata?symbol=${symbol}&timeframe=${timeframe}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch recent candles! HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map(candle => ({
        time: candle.timestamp / 1000, // Convert to seconds
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume), // Assuming volume data is also needed
      }));
    } catch (error) {
      console.error('Fetch error:', error);
      throw error; // Re-throw to allow calling function to handle
    }
  }
  
  /**
   * Fetches all line data (e.g., extremum, wave, trends) for a given symbol and timeframe.
   * @param {string} symbol - The symbol to fetch data for.
   * @param {string} timeframe - The timeframe for the data.
   * @returns {Promise<Object>} - The fetched line data categorized by type.
   */
  async function fetchAllLineData(symbol, timeframe) {
    const apiUrl = `https://test-api-one-phi.vercel.app/api/lines?symbol=${symbol}&timeframe=${timeframe}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data; // Return the raw data; transformation or further processing can be handled by the caller
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
  
  /**
   * Preloads historical candle data.
   * @param {string} symbol - The symbol to preload data for.
   * @param {string} timeframe - The timeframe for the data.
   * @returns {Promise<Array>} - The preloaded historical candle data.
   */

  async function preLoadHistoryCandles(symbol, timeframe) {
    console.log(`Trying to load history candles for ${symbol} with timeframe ${timeframe}`);
    const apiUrl = `https://test-api-one-phi.vercel.app/api/load_history?symbol=${symbol}&timeframe=${timeframe}&startDate=2024-02-01&endDate=2024-03-12`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to load history candles! \nHTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  
  }
  async function getHistoryCandles(symbol, timeframe) {
    console.log(`Trying to load history candles for ${symbol} with timeframe ${timeframe}`);
    const apiUrl = `https://test-api-one-phi.vercel.app/api/get_history_candles?symbol=${symbol}&timeframe=${timeframe}&startDate=2024-02-01&endDate=2024-03-12`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to load history candles! HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map(candle => ({
        time: candle.timestamp / 1000, // Convert to seconds
        open:  parseFloat(candle.open),
        high:  parseFloat(candle.high),
        low:   parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume:parseFloat(candle.volume)
      }));
    } catch (error) {
      console.error(`Failed to preload history candles: ${error.message}`);
      throw error;
    }
  }
  
  export { fetchCandleData, fetchAllLineData, preLoadHistoryCandles, getHistoryCandles };
  