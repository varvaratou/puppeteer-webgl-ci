import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {

  // launch puppeteer with WebGL support in Linux and headless:false in Travis
  puppeteer.launch({
    //headless: !process.env.TRAVIS,
    headless: false,
    args: ['--use-gl=egl']
  }).then(async browser => {

    // initialize
    let page = (await browser.pages())[0];
    const timerInjection = fs.readFileSync('test/timer-injection.js', 'utf8');
    page.evaluateOnNewDocument(timerInjection);

    // find target pages
    let files = fs.readdirSync('./examples')
      .filter(f => f.match(new RegExp(`.*\.(.html)`, 'ig')) && f != 'index.html')
      .map(s => s.slice(0, s.length - 5));

    //for (let i = 0; i < files.length; i++ ) {
    for (let i = 40; i < 50; i++) {
      // load target page
      let targetPage = files[i];
      page.on('console', msg => console.log('PAGE LOG:' + msg.text()));
      await page.setViewport({ width: 800, height: 600 });
      await page.goto(`http://127.0.0.1:8080/examples/${targetPage}.html`);
      
      // save screenshot and exit
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: `./test/screenshot-samples/${targetPage}.png`, fullPage: true});
    }
    await browser.close();

  });

})()