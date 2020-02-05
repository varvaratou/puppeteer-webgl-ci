import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import express from 'express';
import fs from 'fs';
import { PNG } from 'pngjs';

const port = 1234;
const threshold = 0.2;     // threshold in one pixel
const totalDiff = 0.05;    // total diff <5% of pixels
const networkTimeout = 2750;
const renderTimeout = 4000;
const checkInterval = 0;
const glueInterval = 0;

console.rlog = function(msg) { console.log(`\x1b[31m${msg}\x1b[37m`)}
console.glog = function(msg) { console.log(`\x1b[32m${msg}\x1b[37m`)}

// launch express server
const app = express();
app.use(express.static(__dirname + '/../'));
const server = app.listen(port, async () => {

  // launch puppeteer with WebGL support in Linux
  puppeteer.launch({
    headless: !process.env.VISIBLE,
    args: [ '--use-gl=egl', '--no-sandbox' ]
  }).then(async browser => {

    let page = (await browser.pages())[0];
    await page.setViewport({ width: 800, height: 600 });
    page.on('console', msg => {
      if (msg.text() == 'Render timeout exceeded...') console.log(msg.text());
    });
    const injection = fs.readFileSync('test/deterministic-injection.js', 'utf8');
    await page.evaluateOnNewDocument(injection);

    // find target files
    const files = fs.readdirSync('./examples')
      .filter(
        f => f.match(new RegExp(`.*\.(.html)`, 'ig')) &&
        f != 'index.html' && f != 'webgl_test_memory2.html' && // <-exceptions
        ((process.env.GENERATE == 'ALL' || f == process.env.GENERATE + '.html') || !process.env.GENERATE))
      .map(s => s.slice(0, s.length - 5));

    // forEach with CI parallelism
    let failedScreenshot = 0;
    const isParallel = 'CI' in process.env;
    const beginId = isParallel ? Math.floor(parseInt(process.env.CI) * files.length / 4) : 0;
    const endId = isParallel ? Math.floor((parseInt(process.env.CI) + 1) * files.length / 4) : files.length;
    for (let id = beginId; id < endId; id++) {

      // load target file
      let file = files[id];
      try {
        await page.goto(`http://localhost:${port}/examples/${file}.html`, { waitUntil: 'networkidle2', timeout: networkTimeout });
      } catch (e) {
        console.log('Network timeout exceeded...');
      }
      await new Promise((resolve) => setTimeout(resolve, glueInterval));

      // start rendering
      await page.evaluate((file) => {
        let style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `body { font size: 0 !important; }
          #info, button, input, body>div.dg.ac, body>div.lbl { display: none !important; }`;
        document.getElementsByTagName('head')[0].appendChild(style);
        let canvas = document.getElementsByTagName('canvas');
        for (let i = 0; i < canvas.length; i++) {
          if (canvas[i].height == 48) canvas[i].style.display = 'none';
        }
        let button = document.getElementById('startButton');
        if (button) button.click();
        if (file == 'misc_animation_authoring') {
          let divs = document.getElementsByTagName('div')
          for(let i = 0; i < divs.length; i++) divs[i].style.display = 'none'
        }
        window.renderStarted = true;
      }, file);
      await new Promise((resolve) => setTimeout(resolve, glueInterval));

      // wait until rendering
      await page.evaluate(async (renderTimeout, checkInterval) => {
        await new Promise(function(resolve) {
          let renderStart = performance.wow();
          let waitingLoop = setInterval(function() {
            let renderEcceded = (performance.wow() - renderStart > renderTimeout);
            if (window.renderFinished || renderEcceded) {
              if (renderEcceded) console.log('Render timeout exceeded...');;
              clearInterval(waitingLoop);
              resolve();
            }
          }, checkInterval);
        })
      }, renderTimeout, checkInterval);
      await new Promise((resolve) => setTimeout(resolve, glueInterval));

      if (process.env.GENERATE) {

        // generate screenshots
        await page.screenshot({ path: `./test/screenshot-samples/${file}.png`, fullPage: true});
        console.glog(`file: ${file} generated`);

      } else if (fs.existsSync(`./test/screenshot-samples/${file}.png`)) {

        // diff screenshots
        await page.screenshot({ path: `./node_modules/temp.png`, fullPage: true});
        let img1 = PNG.sync.read(fs.readFileSync(`./test/screenshot-samples/${file}.png`));
        let img2 = PNG.sync.read(fs.readFileSync(`./node_modules/temp.png`));
        let diff = new PNG({ width: img1.width, height: img1.height });
        try {
          pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: threshold });
        } catch(e) {
          console.rlog(`ERROR! Image sizes does not match in file: ${file}`)
        }

        // save and print result
        let stream = fs.createWriteStream(`./node_modules/diff.png`)
        diff.pack().pipe(stream);
        stream.end();
        let currDiff = diff.data
          .filter((bit, i) => (i % 4 == 0) && (bit == 255) && (diff.data[i+1] == 0) && (diff.data[i+2] == 0))
          .reduce(sum => sum + 1, 0) / img1.width / img1.height;
        if (currDiff < totalDiff) {
          console.glog(`diff: ${currDiff.toFixed(3)}, file: ${file}`);
        } else {
          failedScreenshot++;
          console.rlog(`ERROR! Diff wrong in ${currDiff.toFixed(3)} of pixels in file: ${file}`);
        }

      } else {
        failedScreenshot++;
        console.rlog(`ERROR! Screenshot not exists: ${file}`);
      }
    }

    server.close();
    if (failedScreenshot > 0) {
      console.rlog(`TESTS FAILED! ${failedScreenshot} from ${files.length} screenshots not pass`);
      //process.exit(1);
    }
    await browser.close();

  });

});