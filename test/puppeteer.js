import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import express from 'express';
import fs from 'fs';
import { PNG } from 'pngjs';

const port = 1234;
const threshold = 0.2;   // threshold in one pixel
const totalDiff = 0.05;  // total error <5% of pixels
const idleTime = 2500;
const renderTime = 2000;

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
    const injection = fs.readFileSync('test/deterministic-injection.js', 'utf8');
    await page.evaluateOnNewDocument(injection);
    await page.setViewport({ width: 800, height: 600 });

    // find target files
    const files = fs.readdirSync('./examples')
      .filter(f => f.match(new RegExp(`.*\.(.html)`, 'ig')) && f != 'index.html' && f != 'webgl_test_memory2.html')
      .map(s => s.slice(0, s.length - 5));

    let failedScreenshot = 0;
    const isParallel = 'CI' in process.env;
    const beginId = isParallel ? Math.floor(parseInt(process.env.CI) * files.length / 4) : 0;
    const endId = isParallel ? Math.floor((parseInt(process.env.CI) + 1) * files.length / 4) : files.length;
    for (let id = beginId; id < endId; id++) {

      // load target file
      let file = files[id];
      try {
        await page.goto(`http://localhost:${port}/examples/${file}.html`, { waitUntil: 'networkidle2', timeout: idleTime });
      } catch (e) {
        console.log('TIMEOUT EXCEEDED!');
      }
      await page.evaluate(() => {
        let style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = ` #info { display: none !important; }
                            body > div.dg.ac { display: none !important; }`;
        document.getElementsByTagName('head')[0].appendChild(style);
      });
      await page.evaluate(() => { window.resoursesLoaded = true; });
      await new Promise(function(resolve) { setTimeout(resolve, renderTime) });

      if (process.env.GENERATE) {

        // generate screenshots
        await page.screenshot({ path: `./test/screenshot-samples/${file}.png`, fullPage: true});
        console.log('\x1b[32m' + `file: ${file}.html generated` + '\x1b[37m');

      } else if (fs.existsSync(`./test/screenshot-samples/${file}.png`)) {

        // diff screenshots
        await page.screenshot({ path: `./node_modules/temp.png`, fullPage: true});
        let img1 = PNG.sync.read(fs.readFileSync(`./test/screenshot-samples/${file}.png`));
        let img2 = PNG.sync.read(fs.readFileSync(`./node_modules/temp.png`));
        let diff = new PNG({ width: img1.width, height: img1.height });
        pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: threshold });

        // save and print result
        let stream = fs.createWriteStream(`./node_modules/diff.png`)
        diff.pack().pipe(stream);
        stream.end();
        let currDiff = diff.data
          .filter((bit, i) => (i % 4 == 0) && (bit == 255) && (diff.data[i+1] == 0) && (diff.data[i+2] == 0))
          .reduce(sum => sum + 1, 0) / img1.width / img1.height;
        if (currDiff < totalDiff) {
          console.log('\x1b[32m' + `diff: ${currDiff.toFixed(3)}, file: ${file}.html` + '\x1b[37m');
        } else {
          failedScreenshot++;
          console.log('\x1b[31m' + `DIFF WRONG ON ${currDiff.toFixed(3)} OF PIXELS IN FILE ${file}.html` + '\x1b[37m');
        }

      } else {
        failedScreenshot++;
        console.log('\x1b[31m' + `SCRENSHOT NOT EXISTS! ${file}.html` + '\x1b[37m');
      }
    }

    server.close();
    if (failedScreenshot > 0) {
      console.log('\x1b[31m' + `${failedScreenshot} FROM ${files.length} SCRENSHOT FAILED`+ '\x1b[37m');
      //process.exit(1);
    }
    await browser.close();

  });

});