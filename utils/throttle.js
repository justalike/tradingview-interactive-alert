function throttle(func, interval) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= interval) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }
  
  function asyncThrottle(func, interval) {
    let lastCall = 0;
    let pendingPromise = null;
  
    return async function(...args) {
      const now = Date.now();
      if (now - lastCall < interval) {
        return pendingPromise; // Return the pending promise if within the interval
      }
      lastCall = now;
      pendingPromise = func.apply(this, args);
      try {
        const result = await pendingPromise;
        return result;
      } catch (error) {
        throw error;
      } finally {
        pendingPromise = null; // Reset after completion
      }
    };
  }

  

// let debounceTimer;
// function onVisibleLogicalRangeChangedDebounced(newVisibleLogicalRange) {
//     clearTimeout(debounceTimer);
//     debounceTimer = setTimeout(() => onVisibleLogicalRangeChanged(newVisibleLogicalRange), 250); // 500 ms debounce period
// }
  export { throttle, asyncThrottle }