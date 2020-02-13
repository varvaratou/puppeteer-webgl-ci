let puppeteer = require( 'puppeteer' );
const handler = require( 'serve-handler' );
const http = require( 'http' );
let pixelmatch = require( 'pixelmatch' );
let png = require( 'pngjs' ).PNG;
let fs = require( 'fs' );

const port = 1234;
const pixelThreshold = 0.2;
const maxFailedPixels = 0.05;
let networkTimeout = 1000;
let networkTax = 3300;										// additional timout tax for resources size
let minPageSize = 1.0;										// in mb, when networkTax = 0
let maxPageSize = 5.0;										// in mb, when networkTax = networkTax
let renderTimeout = 2500;
let exceptionList = [
	'misc_animation_authoring',							// need fix in examples
	'webgl_loader_texture_pvrtc',						// not supported in CI, usless
	'webgl_materials_car',
	'webgl_materials_envmaps_parallax',
	'webgl_video_panorama_equirectangular',	// video not fully deterministic
	'webgl_test_memory2',										// gives fatal error in puppeteer
	'webgl_worker_offscreencanvas',					// in a worker, not robust
];
console.redLog = ( msg ) => console.log( `\x1b[31m${ msg }\x1b[37m` );
console.greenLog = ( msg ) => console.log( `\x1b[32m${ msg }\x1b[37m` );


/* Launch server */

const server = http.createServer( ( request, response ) => handler( request, response ) );
server.on( 'SIGINT', () => process.exit( 1 ) );
server.listen( port, async () => {

	try {

		await pup;

	} catch ( e ) {
		
		console.error( e );
	
	} finally { 
		
		server.close();
	
	}

} );


/* Launch puppeteer with WebGL support in Linux */

let pup = puppeteer.launch( {

	headless: !process.env.VISIBLE,
	args: [
		'--use-gl=egl',
		'--no-sandbox',
		'--enable-surface-synchronization'
	]

} ).then( async browser => {


	/* Prepare page */

	let pageSize;
	let page = ( await browser.pages() )[  0  ];
	await page.setViewport( { width: 800, height: 600 } );
	const injection = fs.readFileSync( 'test/puppeteer/deterministic-injection.js', 'utf8' );
	await page.evaluateOnNewDocument( injection );
	await new Promise( resolve => setTimeout( resolve, 300 ) );
	page.on( 'console', msg => ( msg.text().slice( 0, 6 ) == 'Render' ) ? console.log( msg.text() ) : {} );
	page.on( 'response', async ( response ) => {
		try {
			
			await response.buffer().then( buffer => { pageSize += buffer.length } );
		
		} catch {}

	} )


	/* Find target files */

	const files = fs.readdirSync('./examples')
    .filter(f => f.match(new RegExp(`.*\.(.html)`, 'ig')) && f != 'index.html' &&
                (!process.env.FILE || (process.env.FILE && f == process.env.FILE + '.html')))
    .map(s => s.slice(0, s.length - 5));


	/* ForEach file with CI parallelism */

	let failedScreenshot = 0;
	const isParallel = 'CI' in process.env;
	const beginId = isParallel ? Math.floor( parseInt( process.env.CI.slice( 0, 1 ) ) * files.length / 4 ) : 0;
	const endId = isParallel ? Math.floor( ( parseInt( process.env.CI.slice( - 1 ) ) + 1 ) * files.length / 4 ) : files.length;

	for ( let id = beginId; id < endId; id++ ) {


		/* Load target file */

		pageSize = 0;
		global.gc();
		global.gc();

		let file = files[ id ];
		if ( exceptionList.includes( file ) ) {
			
			continue;

		}

		try {

			await page.goto( `http://localhost:${ port }/examples/${ file }.html`, {
				waitUntil: 'networkidle2',
				timeout: networkTimeout
			} );

		} catch ( e ) {

			console.log( 'Network timeout exceeded...' );

		}

		try {

			await page.evaluate( async( pageSize, minPageSize, maxPageSize, networkTax, renderTimeout ) => {


				/* Prepare page */

				let button = document.getElementById( 'startButton' );
				if ( button ) {
					
					button.click();

				}

				let style = document.createElement( 'style' );
				style.type = 'text/css';
				style.innerHTML = `body { font size: 0 !important; }
													#info, button, input, body > div.dg.ac, body > div.lbl { display: none !important; }`;
				document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );

				let canvas = document.getElementsByTagName( 'canvas' );
				for ( let i = 0; i < canvas.length; ++ i ) {

					if ( canvas[ i ].height == 48 ) {
						
						canvas[ i ].style.display = 'none';

					}

				}

				let resourcesSize = Math.min( 1, ( pageSize / 1024 / 1024 - minPageSize ) / maxPageSize );
				await new Promise( resolve => setTimeout( resolve, networkTax * resourcesSize ) );


				/* Render promise */

				window.chromeRenderStarted = true;
				await new Promise( function( resolve ) {

					let renderStart = performance.wow();
					let waitingLoop = setInterval( function() {

						let renderEcceded = ( performance.wow() - renderStart > renderTimeout * window.chromeMaxFrameId );
						if ( window.chromeRenderFinished || renderEcceded ) {

							if ( renderEcceded ) console.log( 'Render timeout exceeded...' );
							clearInterval( waitingLoop );
							resolve();

						}

					}, 0 );

				} );

			}, pageSize, minPageSize, maxPageSize, networkTax, renderTimeout );

		} catch ( e ) {

			console.redLog( `WTF? 'Network timeout' is small for your machine. file: ${ file } \n${ e }` );
			++ failedScreenshot;
			continue;

		}

		if ( process.env.GENERATE ) {


			/* Generate screenshots */

			await page.screenshot( { path: `./examples/screenshots/${ file }.png` } );
			console.greenLog( `file: ${ file } generated` );

		} else if ( fs.existsSync( `./examples/screenshots/${ file }.png` ) ) {


			/* Diff screenshots */

			let actualBuff = await page.screenshot( { path: `./node_modules/temp.png` } );
			let expected = png.sync.read( fs.readFileSync( `./examples/screenshots/${ file }.png` ) );
			let actual = png.sync.read( actualBuff );
			let diff = new png( { width: expected.width, height: expected.height } );
			let currDiff;
			try {

				currDiff = pixelmatch( expected.data, actual.data, diff.data, expected.width, expected.height, { pixelThreshold: pixelThreshold } );

			} catch {

				console.redLog( `ERROR! Image sizes does not match in file: ${ file }` );
				++ failedScreenshot;
				continue;

			}
			currDiff /= expected.width * expected.height;


			/* Save and print result */
			if ( currDiff < maxFailedPixels ) {

				console.greenLog( `diff: ${currDiff.toFixed( 3 )}, file: ${ file }` );

			} else {

				console.redLog( `ERROR! Diff wrong in ${currDiff.toFixed( 3 )} of pixels in file: ${ file }` );
				++ failedScreenshot;
				continue;

			}

		} else {

			console.redLog( `ERROR! Screenshot not exists: ${ file }` );
			++ failedScreenshot;
			continue;

		}

	}

	if ( failedScreenshot ) {

		console.redLog( `TEST FAILED! ${failedScreenshot} from ${endId - beginId} screenshots not pass.` );
		process.exit( 1 );

	} else if ( !process.env.GENERATE ) {

		console.greenLog( `TEST PASSED! ${endId - beginId} screenshots correctly rendered.` );

	}


	await browser.close();

} );