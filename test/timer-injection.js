// this snippet works only in headless chrome

if (navigator.webdriver) {
  let DEFAULTTIME = 8000;

  // timer definition
  const timerGetter = function() {
    return DEFAULTTIME;
  };

  // time calculated as Date.now()
  window.Date.now = timerGetter;

  // time calculated as performance.now()
  window.performance.now = timerGetter;

  // time calculated as ( new Date() ).getTime()
  window.Date.prototype.getTime = timerGetter;

  // more complex injection
  const rAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(f) {
    // time calculated in THREE.clock()
    if (typeof THREE != 'undefined') {
      console.log('THREE here')
    } else {
      console.log('THREE undefined');
    }

    // time calculated in requstAnimationFrame() calaback
    if (f.name == 'animate' || f.name == 'compute' || f.name == 'render') {
      rAF(function() { f(timerGetter()); });
    } else {
      rAF(f);
    }
  }
}