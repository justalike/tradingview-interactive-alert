// Chart main configuration
export const chartProperties = {
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
      rightOffset: 5,
      barSpacing: 5,
      visible: true,
      timeVisible: true,
      secondsVisible: false,
      borderColor: '#485c7b',
    },
  };
  
  // Price formatter function
  export const myPriceFormatter = p => p.toFixed(5);
  
  // Series configurations
