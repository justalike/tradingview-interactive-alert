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

export async function updateTooltipContent(waveData, timestamp, param) {
  
  if (!waveData) return
  const wave = waveData.find(w => w.start/1000 <= timestamp && w.end/1000>= timestamp);
  if (!wave) return
      showTooltip(wave, param.point);

}

function showTooltip(wave, point) {

  if (!wave) return
  const tooltip = document.getElementById('tooltip');
  
  const toolTipWidth = 80;
  const toolTipHeight = 80;
  const toolTipMargin = 15;

  tooltip.innerHTML = `
  <div>Start: ${wave.startValue}</div>
  <div>End: ${wave.endValue}</div>
  <div>Velocity: ${wave.velocity.toFixed(4)}</div>
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