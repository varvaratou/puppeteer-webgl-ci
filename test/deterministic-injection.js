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
  window.performance.getNow = performance.now;
  window.performance.now = now;

  // deterministic RAF
  const RAF = window.requestAnimationFrame;
  window.RESLOADED = false;
  window.RENDERFINISHED = false;
  window.requestAnimationFrame = function(cb) {
    if (!RESLOADED) {
      window.setTimeout(function() { requestAnimationFrame(cb); }, 50);
    } else {
      RAF(function() {
        if (frameId++ < 1) { cb(now());
        } else { RENDERFINISHED = true;}
      });
    }
  }

}());