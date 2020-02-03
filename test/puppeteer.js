import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import express from 'express';
import fs from 'fs';
import { PNG } from 'pngjs';

const PORT = 1234;
const MAXDIFF = 0.1;     // threshold in one pixel
const TOTALDIFF = 0.05;  // total error <5% of pixels

// launch express server
const app = express();
app.use(express.static(__dirname + '/../'));
const server = app.listen(PORT, async () => {

  // launch puppeteer with WebGL support in Linux
  puppeteer.launch({
    headless: !process.env.VIS,
    args: [ '--use-gl=egl', '--no-sandbox' ]
  }).then(async browser => {

    // initialize
    let page = (await browser.pages())[0];
    const injection = fs.readFileSync('test/deterministic-injection.js', 'utf8');
    page.evaluateOnNewDocument(injection);

    // find target files
    let files = fs.readdirSync('./examples')
      .filter(f => f.match(new RegExp(`.*\.(.html)`, 'ig')) && f != 'index.html')
      .map(s => s.slice(0, s.length - 5));

    let failedCount = 0;
    for (let i = 0; i < files.length; i++) {

      // load target file
      let file = files[i];
      await page.setViewport({ width: 800, height: 600 });
      try {
        await page.goto(`http://localhost:${PORT}/examples/${file}.html`, { waitUntil: 'networkidle2', timeout: 12000 });
      } catch (e) {
        console.log('TIMEOUT EXCEEDED!');
      }
      await page.evaluate(() => {
        try {
          var style = document.createElement('style');
          style.type = 'text/css';
          style.innerHTML = `
            #info { display: none !important; }
            #container div { display: none !important; }
            body > div.dg.ac { display: none !important; }
          `;
          document.getElementsByTagName('head')[0].appendChild(style);
        } catch {}
      })

      // generate or diff screenshots
      if (process.env.GEN) {

        await page.screenshot({ path: `./test/screenshot-samples/${file}.png`, fullPage: true});
        console.log('\x1b[32m' + `file: ${file}.html generated` + '\x1b[37m');

      } else if (fs.existsSync(`./test/screenshot-samples/${file}.png`)) {

        // diff screenshots
        await page.screenshot({ path: `./node_modules/temp.png`, fullPage: true});
        let img1 = PNG.sync.read(fs.readFileSync(`./test/screenshot-samples/${file}.png`));
        let img2 = PNG.sync.read(fs.readFileSync(`./node_modules/temp.png`));
        let diff = new PNG({ width: img1.width, height: img1.height });
        pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: MAXDIFF });

        // save and print result
        diff.pack().pipe(fs.createWriteStream(`./node_modules/diff.png`));
        let totaldiff = diff.data
          .filter((bit, i) => (i % 4 == 0) && (bit == 255) && (diff.data[i+1] == 0) && (diff.data[i+2] == 0))
          .reduce(sum => sum + 1, 0) / img1.width / img1.height;
        if (totaldiff < TOTALDIFF) {
          console.log('\x1b[32m' + `diff: ${totaldiff.toFixed(3)}, file: ${file}.html` + '\x1b[37m');
        } else {
          failedCount++;
          console.log('\x1b[31m' + `DIFF WRONG ON ${totaldiff.toFixed(3)} OF PIXELS IN FILE ${file}.html` + '\x1b[37m');
        }

      } else {
        failedCount++;
        console.log('\x1b[31m' + `SCRENSHOT NOT EXISTS! ${file}.html` + '\x1b[37m');
      }
    }

    server.close();
    if (failedCount > 0) {
      console.log('\x1b[31m' + `${failedCount} FROM ${files.length} SCRENSHOT FAILED`+ '\x1b[37m');
      //process.exit(1);
    }
    await browser.close();

  });

});