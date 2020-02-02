import puppeteer from 'puppeteer';

(async () => {

  // launch puppeteer with WebGL support in Linux and headless:false in Travis
  puppeteer.launch({
    headless: !process.env.TRAVIS,
    args: ['--use-gl=egl']
  }).then(async browser => {

    // download timer-injection.js
    let page = (await browser.pages())[0];
    await page.goto('http://127.0.0.1:8080/test/timer-injection.js');
    const timerInjection = await page.evaluate(() => document.getElementsByTagName('pre')[0].innerHTML);
    
    // save page body from target page
    let targetBody = '';
    let targetUrl = 'http://127.0.0.1:8080/examples/webgl_loader_mmd_audio.html';
    await page.goto(targetUrl, { waitUntil : 'domcontentloaded' });
    await page.setRequestInterception(true);
    page.on('request', req => req.continue());
    page.on('response', async (resp) => {
      if (resp.url().includes('.html')) {
        targetBody = await resp.text();
      }
    });
    await page.goto(targetUrl, { waitUntil : 'domcontentloaded' });
    
    // make a new request and inject timer in page body
    page.close();
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.setRequestInterception(true);
    page.on('console', msg => console.log('PAGE LOG:' + msg.text()));
    page.on('request', req => {
      if (req.url() == targetUrl) {        
        req.respond({
          status: 200,
          contentType: 'text/html; charset=UTF-8',
          body: targetBody.replace(
            '../build/three.module.js',
            "../build/three.module.js';" + timerInjection + ";'"
          )
        });
      } else {
        req.continue();
      }
    });
    await page.goto(targetUrl);

    // save screenshot and exit
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: './examples/screenshots/miko.png', fullPage: true});
    await browser.close();

  });

})()