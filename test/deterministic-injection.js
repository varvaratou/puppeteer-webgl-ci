// this snippet works only in puppeteer
if (navigator.webdriver) {

  // deterministic timer
  let TIMECOUNT = 0;
  const TIMEGETTER = function() {
    return 0;
    //return TIMECOUNT*16; this is not deterministic for some reason
  };

  // time calculated as Date.now()
  window.Date.now = TIMEGETTER;

  // time calculated as ( new Date() ).getTime()
  window.Date.prototype.getTime = TIMEGETTER;

  // time calculated as performance.now()
  window.performance.now = TIMEGETTER;

  // time calculated in requstAnimationFrame() callback
  const RAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(f) {
    RAF(function() { TIMECOUNT++; if (TIMECOUNT < 50) f(TIMEGETTER()); });
  }

  // deterministic random
  let RANDOMSEED = Math.PI / 4;
  window.Math.random = function() {
    const x = Math.sin(RANDOMSEED++) * 10000;
    return x - Math.floor(x);
  };
  
}