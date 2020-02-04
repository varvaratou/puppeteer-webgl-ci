(function() {

  // deterministic random
  let seed = Math.PI / 4;
  window.Math.random = function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // deterministic timer
  const now = function() { return 0; };
  window.Date.now = now;
  window.Date.prototype.getTime = now;
  window.performance.getNow = performance.now;
  window.performance.now = now;

  // deterministic RAF
  let lastTime = 0;
  window.requestAnimationFrame = function(callback) {
    window.setTimeout(function() { callback(now()); }, 200);
  };

}());