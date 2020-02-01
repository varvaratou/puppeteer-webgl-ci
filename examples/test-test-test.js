if (navigator.webdriver) {
  console.log("Chrome headless detected");
  console.log('IT WORK');
  window.performance.now = () => 8000;
}