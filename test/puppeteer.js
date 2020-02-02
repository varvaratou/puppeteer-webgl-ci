import puppeteer from 'puppeteer';

(async () => {

  // launch puppeteer with WebGL support in Linux and headless:false in Travis
  puppeteer.launch({
    headless: false,
    //headless: !process.env.TRAVIS,
    args: ['--use-gl=egl']
  }).then(async browser => {

    let page = (await browser.pages())[0];
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.setViewport({ width: 800, height: 600 });
    await page.goto('http://127.0.0.1:8080/examples/webgl_loader_mmd_audio.html');
    
    // save screenshot and exit
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: './examples/screenshots/miko.png', fullPage: true});
    await browser.close();

  });

})()