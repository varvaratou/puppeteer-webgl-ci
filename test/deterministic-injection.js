(function() {

  // deterministic random
  let seed = Math.PI / 4;
  window.Math.random = function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // deterministic timer
  let frameId = 0;
  const now = function() { return frameId * 16; };
  window.Date.now = now;
  window.Date.prototype.getTime = now;
  window.performance.wow = performance.now;
  window.performance.now = now;

  // deterministic RAF
  const rAF = window.requestAnimationFrame;
  window.renderStarted = false;
  window.renderFinished = false;
  window.requestAnimationFrame = function(cb) {
    if (!window.renderStarted) {
      window.setTimeout(function() {
        requestAnimationFrame(cb);
      }, 50);
    } else {
      rAF(function() {
        if (frameId++ < 2) {
          cb(now());
        } else {
          window.renderFinished = true;
        }
      });
    }
  }

}());