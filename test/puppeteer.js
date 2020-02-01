import puppeteer from 'puppeteer';
//const parallel = 2;

(async () => {
  puppeteer.launch({
    args: ['--use-gl=egl']
  }).then(async browser => {
    const main = (await browser.pages())[0];
    await main.goto('http://127.0.0.1:8080/test/timer-injection.js');
    const timerInjection = await main.evaluate(() => document.getElementsByTagName('pre')[0].innerHTML);

    let page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.evaluateOnNewDocument(timerInjection);
    await page.setViewport({ width: 800, height: 600 });
    await page.goto('http://127.0.0.1:8080/examples/webgl_loader_mmd_audio.html');

    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: './examples/screenshots/miko.png', fullPage: true});
    await browser.close();
  });
})()