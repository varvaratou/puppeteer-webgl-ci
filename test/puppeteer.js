import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import { PNG } from 'pngjs';

const width = 800;
const height = 600;
const PORT = 4321;
const DIFFMAX = 0.3;  // threshold in one pixel
const DIFFNUM = 0.5;  // max number of pixels in percent (WAT? 50%?)
const TIMEOUT = 900;

(async () => {

  // launch puppeteer with WebGL support in Linux
  puppeteer.launch({
    headless: !process.env.VIS,
    args: [
      '--hide-scrollbars',
      '--enable-font-antialiasing',
      '--force-device-scale-factor=1', '--high-dpi-support=1',
      '--use-gl=egl', '--no-sandbox', '--disable-setuid-sandbox'
    ]
  }).then(async browser => {

    // initialize
    let page = (await browser.pages())[0];
    const timerInjection = fs.readFileSync('test/timer-injection.js', 'utf8');
    page.evaluateOnNewDocument(timerInjection);

    // find target files
    let files = fs.readdirSync('./examples')
      .filter(f => f.match(new RegExp(`.*\.(.html)`, 'ig')) && f != 'index.html')
      .map(s => s.slice(0, s.length - 5));

    //for (let i = 0; i < files.length; i++) {
    for (let i = 40; i < 50; i++) {

      // load target file
      let file = files[i];
      await page.setViewport({ width, height });
      await page.goto(`http://127.0.0.1:${PORT}/examples/${file}.html`);
      await new Promise(r => setTimeout(r, TIMEOUT));

      
      if (process.env.GEN) {

        // generate screenshots
        await page.screenshot({ path: `./test/screenshot-samples/${file}.png`, fullPage: true});

      } else {

        // diff screenshots
        await page.screenshot({ path: `./node_modules/temp.png`, fullPage: true});
        let img1 = PNG.sync.read(fs.readFileSync(`./test/screenshot-samples/${file}.png`));
        let img2 = PNG.sync.read(fs.readFileSync(`./node_modules/temp.png`));
        let diff = new PNG({ width, height });
        pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: DIFFMAX });

        // save and print result
        diff.pack().pipe(fs.createWriteStream(`./node_modules/diff.png`));
        let diffnum = diff.data
          .filter((bit, i) => (i % 4 == 0) && (bit == 255) && (diff.data[i+1] == 0) && (diff.data[i+2] == 0))
          .reduce(sum => sum + 1, 0);
        if (diffnum < DIFFNUM * width * height) {
          console.log('\x1b[32m' + `file: ${file}.html, diff: ${diffnum} pixels` + '\x1b[37m');
        } else {
          console.log('\x1b[31m' + `DIFF FAILED ON FILE: ${file}.html, DIFF: ${diffnum} pixels` + '\x1b[37m');
          process.exit(1);
        }
      }

    }
    await browser.close();

  });

})()