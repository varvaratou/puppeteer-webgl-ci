let DEFAULTTIME = 8000;
let FINISH = false;

// timer definition
const timerGetter = () => {
  if (!FINISH) {
    FINISH = true;
    console.log('timer invoked!')
  }
  return DEFAULTTIME;
};

// time calculated as Date.now()
window.Date.now = timerGetter;

// time calculated as performance.now()
window.performance.now = timerGetter;

// time calculated as ( new Date() ).getTime()
window.Date.prototype.getTime = timerGetter;

// time calculated in requstAnimationFrame() calaback
const rAF = window.requestAnimationFrame;
window.requestAnimationFrame = (f) => {
  if (f.name == 'animate' || f.name == 'compute' || f.name == 'render') {
    rAF(() => f(timerGetter()))
  } else {
    rAF(f);
  }
}