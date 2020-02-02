let DEFAULTTIME = 5000;

// timer definition
const TIMEGETTER = function() { return DEFAULTTIME; };

// time calculated as Date.now()
Date.now = TIMEGETTER;

// time calculated as performance.now()
performance.now = TIMEGETTER;

// time calculated as ( new Date() ).getTime()
Date.prototype.getTime = TIMEGETTER;

// more complex injection
const RAF = requestAnimationFrame;
requestAnimationFrame = function(f) {
  // time calculated in THREE.Clock.getDelta()
  // ... replace Clock()?

  // time calculated in requstAnimationFrame() callback
  RAF(function() { f(DEFAULTTIME); });
}