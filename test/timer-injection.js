// this snippet works only in headless chrome
if (navigator.webdriver) {

  // timer definition
  let TIMESTART = 5000;
  let TIMECOUNT = 0;
  const TIMEGETTER = function() {
    TIMECOUNT++;
    return TIMESTART + TIMECOUNT*16;
  };

  // time calculated as Date.now()
  window.Date.now = TIMEGETTER;

  // time calculated as performance.now()
  window.performance.now = TIMEGETTER;

  // time calculated as ( new Date() ).getTime()
  window.Date.prototype.getTime = TIMEGETTER;

  // time calculated in requstAnimationFrame() callback
  const RAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(f) {
    RAF(function() { if (TIMECOUNT < 3000) f(TIMEGETTER()); });
  }
  
}