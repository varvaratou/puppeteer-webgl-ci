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
  window.requestAnimationFrame = function(callback, element) {
    let currTime = performance.getNow();
    let timeToCall = lastTime ? Math.max(0, 200 - (currTime - lastTime)) : 0;
    let id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };

}());