import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import express from 'express';
import fs from 'fs';
import { PNG } from 'pngjs';

const port = 1234;
const threshold = 0.2;        // threshold in one pixel
const totalDiff = 0.05;       // total diff <5% of pixels
let networkTimeout = 600;     // puppeteer networkidle2 timeout
let networkTax = 3100;        // additional timout tax for resources size
let minPageSize = 1.0;        // in mb, when networkTax = 0
let maxPageSize = 5.0;        // in mb, when networkTax = networkTax
let renderTimeout = 2500;     // promise timeout for render 
let renderInterval = 0;       // how often to check render
let exceptionList = [
  'webgl_loader_draco',
  'webgl_materials_car',
  'webgl_materials_envmaps_parallax',
  'webgl_video_panorama_equirectangular',
  'webgl_test_memory2',                   // gives fatal error in puppeteer
  'webgl_worker_offscreencanvas',         // in a worker, not robust
];

// launch express server
const app = express();
app.use(express.static(__dirname + '/../'));
const server = app.listen(port, async () => {
  try { await pup } catch (e) { console.error(e) } finally { server.close() }
});

// launch puppeteer with WebGL support in Linux
let pup = puppeteer.launch({
  headless: !process.env.VISIBLE,
  args: [ '--use-gl=egl', '--no-sandbox' ]
}).then(async browser => {

  // prepare page
  let pageSize, page = (await browser.pages())[0];
  await page.setViewport({ width: 800, height: 600 });
  const injection = fs.readFileSync('puppeteer/deterministic-injection.js', 'utf8');
  await page.evaluateOnNewDocument(injection);
  page.on('console', msg => (msg.text().slice(0, 6) == 'Render') ? console.log(msg.text()) : {});
  console.redLog = function(msg) { console.log(`\x1b[31m${msg}\x1b[37m`)}
  console.greenLog = function(msg) { console.log(`\x1b[32m${msg}\x1b[37m`)}
  page.on('response', async (response) => {
    try { await response.buffer().then(buffer => { pageSize += buffer.length}); } catch {}
  })

  // find target files
  const files = fs.readdirSync('./examples')
    .filter(f => f.match(new RegExp(`.*\.(.html)`, 'ig')) && f != 'index.html' &&
                (!process.env.FILE || (process.env.FILE && f == process.env.FILE + '.html')))
    .map(s => s.slice(0, s.length - 5));

  // forEach file with CI parallelism
  let failedScreenshot = 0;
  const isParallel = 'CI' in process.env;
  const beginId = isParallel ? Math.floor(parseInt(process.env.CI.slice(0,1)) * files.length / 4) : 0;
  const endId = isParallel ? Math.floor((parseInt(process.env.CI.slice(-1)) + 1) * files.length / 4) : files.length;
  for (let id = beginId; id < endId; id++) {

    // load target file
    let file = files[id];
    pageSize = 0;
    if (exceptionList.includes(file)) continue;
    try {
      await page.goto(`http://localhost:${port}/examples/${file}.html`, { waitUntil: 'networkidle0', timeout: networkTimeout });
    } catch (e) { /*console.log('Network timeout exceeded...');*/}

    // prepare page
    await page.evaluate(async (file, pageSize, minPageSize, maxPageSize, networkTax) => {
      let button = document.getElementById('startButton');
      if (button) button.click();
      let style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = `body { font size: 0 !important; }
                         #info, button, input, body > div.dg.ac, body > div.lbl { display: none !important; }`;
      document.getElementsByTagName('head')[0].appendChild(style);
      let canvas = document.getElementsByTagName('canvas');
      for (let i = 0; i < canvas.length; i++) {
        if (canvas[i].height == 48) canvas[i].style.display = 'none';
      }
      if (file == 'misc_animation_authoring') {
        let divs = document.getElementsByTagName('div')
        for(let i = 0; i < divs.length; i++) divs[i].style.display ='none';
      } 
      let resourcesSize = (pageSize / 1024 / 1024 - minPageSize) / maxPageSize;
      await new Promise((resolve, _) => setTimeout(resolve, networkTax * resourcesSize));
    }, file, pageSize, minPageSize, maxPageSize, networkTax);

    // render promise
    await page.evaluate(async (renderTimeout, renderInterval) => {
      window.renderStarted = true;
      await new Promise(function(resolve, _) {
        let renderStart = performance.wow();
        let waitingLoop = setInterval(function() {
          let renderEcceded = (performance.wow() - renderStart > renderTimeout * window.maxFrameId);
          if (window.renderFinished || renderEcceded) {
            if (renderEcceded) console.log('Render timeout exceeded...');
            clearInterval(waitingLoop);
            resolve();
          }
        }, renderInterval);
      });
    }, renderTimeout, renderInterval);

    if (process.env.GENERATE) {

      // generate screenshots
      await page.screenshot({ path: `./examples/screenshots/${file}.png` });
      console.greenLog(`file: ${file} generated`);

    } else if (fs.existsSync(`./examples/screenshots/${file}.png`)) {

      // diff screenshots
      await page.screenshot({ path: `./node_modules/temp.png` });
      let img1 = PNG.sync.read(fs.readFileSync(`./examples/screenshots/${file}.png`));
      let img2 = PNG.sync.read(fs.readFileSync(`./node_modules/temp.png`));
      let diff = new PNG({ width: img1.width, height: img1.height });
      try {
        pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: threshold });
      } catch(e) {
        ++failedScreenshot;
        console.redLog(`ERROR! Image sizes does not match in file: ${file}`)
      }

      // save and print result
      let stream = fs.createWriteStream(`./node_modules/diff.png`);
      diff.pack().pipe(stream);
      stream.end();
      let currDiff = diff.data
        .filter((bit, i) => (i % 4 == 0) && (bit == 255) && (diff.data[i+1] == 0) && (diff.data[i+2] == 0))
        .reduce(sum => sum + 1, 0) / img1.width / img1.height;
      if (currDiff < totalDiff) {
        console.greenLog(`diff: ${currDiff.toFixed(3)}, file: ${file}`);
      } else {
        ++failedScreenshot;
        console.redLog(`ERROR! Diff wrong in ${currDiff.toFixed(3)} of pixels in file: ${file}`);
      }

    } else {
      ++failedScreenshot;
      console.redLog(`ERROR! Screenshot not exists: ${file}`);
    }
  }

  if (failedScreenshot > 0) {
    console.redLog(`TEST FAILED! ${failedScreenshot} from ${endId - beginId} screenshots not pass.`);
    process.exit(1);
  } else {
    console.greenLog(`TEST PASSED! ${endId - beginId} screenshots correctly rendered.`);
    await browser.close();
  }

});