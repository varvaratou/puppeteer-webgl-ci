import puppeteer from 'puppeteer';
//const parallel = 2;

(async () => {
  puppeteer.launch({
    headless: !process.env.CI,
    args: ['--use-gl=egl']
  }).then(async browser => {
    const main = (await browser.pages())[0];
    await main.goto('http://127.0.0.1:8080/test/page-inject.js');
    const injectScript = await main.evaluate(() => document.getElementsByTagName('pre')[0].innerHTML);

    //const promises = [];
    let page = await browser.newPage();
    await page.evaluateOnNewDocument(injectScript);

    await page.setViewport({ width: 800, height: 600 });
    await page.goto('http://127.0.0.1:8080/examples/webgl_loader_mmd_audio.html');
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: './examples/screenshots/miko.png', fullPage: true}); 
    await browser.close();
  });
})()