const puppeteer = require( 'puppeteer' );
const handler = require( 'serve-handler' );
const http = require( 'http' );
const pixelmatch = require( 'pixelmatch' );
const printImage = require( 'image-output' );
const png = require( 'pngjs' ).PNG;
const fs = require( 'fs' );

const port = 1234;
const pixelThreshold = 0.2;
const maxFailedPixels = 0.05;
const networkTimeout = 600;
const networkTax = 2000;                   // additional timout tax for resources size
const pageSizeMinTax = 1.0;                // in mb, when networkTax = 0
const pageSizeMaxTax = 5.0;                // in mb, when networkTax = networkTax
const renderTimeout = 1200;
const maxAttemptId = 3;                    // progresseve attempts

let exceptionList = [

	'index',
	'webgl_loader_texture_pvrtc',            // not supported in CI, usless
	'webgl_materials_envmaps_parallax',
	'webgl_test_memory2',                    // gives fatal error in puppeteer
	'webgl_worker_offscreencanvas',          // in a worker, not robust

].concat(

	( process.platform === "win32" ) ?
	[ 'webgl_effects_ascii' ] :              // windows fonts
	[]

);

console.green = ( msg ) => console.log( `\x1b[32m${ msg }\x1b[37m` );
console.red = ( msg ) => console.log( `\x1b[31m${ msg }\x1b[37m` );
console.null = ( msg ) => {};


/* Launch server */

const server = http.createServer( ( request, response ) => {

	return handler( request, response );

} );

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

const pup = puppeteer.launch( {
	headless: !process.env.VISIBLE,
	args: [
		'--use-gl=egl',
		'--no-sandbox',
		'--enable-surface-synchronization'
	]
} ).then( async browser => {


	/* Prepare page */

	const page = ( await browser.pages() )[ 0 ];
	await page.setViewport( { width: 800, height: 600 } );

	const injection = fs.readFileSync( 'test/diff/deterministic-injection.js', 'utf8' );
	await page.evaluateOnNewDocument( injection );

	page.on( 'console', msg => ( msg.text().slice( 0, 8 ) === 'Warning.' ) ? console.null( msg.text() ) : {} );
	page.on( 'response', async ( response ) => {

		try {

			await response.buffer().then( buffer => pageSize += buffer.length );

		} catch ( e ) {

			console.null( `Warning. Wrong request. \n${ e }` );

		}

	} );


	/* Find files */

	const exactList = process.env.FILE ? process.env.FILE.replace( /\.html/g, '' ).split( ',' ).map( f => f.trim() ) : [];

	const files = fs.readdirSync( './examples' )
		.filter( s => s.slice( - 5 ) === '.html' )
		.map( s => s.slice( 0, s.length - 5 ) )
		.filter( f => process.env.FILE ? exactList.includes( f ) : !exceptionList.includes( f ) );


	/* Loop for each file, with CI parallelism */

	let pageSize, file;
	let failedScreenshots = 0;
	const isParallel = 'CI' in process.env;
	const beginId = isParallel ? Math.floor( parseInt( process.env.CI.slice( 0, 1 ) ) * files.length / 4 ) : 0;
	const endId = isParallel ? Math.floor( ( parseInt( process.env.CI.slice( - 1 ) ) + 1 ) * files.length / 4 ) : files.length;

	for ( let id = beginId; id < endId; ++ id ) {


		/* At least 3 attempts before fail ( for robustness ) */

		let attemptId = process.env.MAKE ? 1 : 0;

		while ( attemptId < maxAttemptId ) {


			/* Initialization */

			file = files[ id ];
			pageSize = 0;
			global.gc();
			global.gc();


			/* Load target page */

			try {

				await page.goto( `http://localhost:${ port }/examples/${ file }.html`, {
					waitUntil: 'networkidle2',
					timeout: networkTimeout * ( 1 + attemptId )
				} );

			} catch {

				console.null( 'Warning. Network timeout exceeded...' );

			}


			try {

				await page.evaluate( async ( pageSize, pageSizeMinTax, pageSizeMaxTax, networkTax, renderTimeout, attemptId ) => {


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

						if ( canvas[i].height === 48 ) {

							canvas[i].style.display = 'none';

						}

					}

					let resourcesSize = Math.min( 1, ( pageSize / 1024 / 1024 - pageSizeMinTax ) / pageSizeMaxTax );
					await new Promise( resolve => setTimeout( resolve, networkTax * resourcesSize * ( 1 + attemptId ) ) );


					/* Resolve render promise */

					window.chromeRenderStarted = true;
					await new Promise( function( resolve ) {

						let renderStart = performance.wow();
						let waitingLoop = setInterval( function() {

							let renderEcceded = ( performance.wow() - renderStart > renderTimeout * window.chromeMaxFrameId  * ( 1 + attemptId ) );
							if ( window.chromeRenderFinished || renderEcceded ) {

								if ( renderEcceded ) {

									console.log( 'Warning. Render timeout exceeded...' );

								}
								clearInterval( waitingLoop );
								resolve();

							}

						}, 0 );

					} );

				}, pageSize, pageSizeMinTax, pageSizeMaxTax, networkTax, renderTimeout, attemptId );

			} catch ( e ) {

				if ( ++ attemptId === maxAttemptId ) {

					console.red( `WTF? 'Network timeout' is small for your machine. file: ${ file } \n${ e }` );
					++ failedScreenshots;
					continue;

				} else {

					console.log( 'Another attempt..' );

				}

			}


			/* Make or diff? */

			if ( process.env.MAKE ) {


				/* Make screenshots */

				attemptId = maxAttemptId;
				await page.screenshot( { path: `./examples/screenshots/${ file }.png` } );
				console.green( `file: ${ file } generated` );


			} else if ( fs.existsSync( `./examples/screenshots/${ file }.png` ) ) {


				/* Diff screenshots */

				let actual = png.sync.read( await page.screenshot() );
				let expected = png.sync.read( fs.readFileSync( `./examples/screenshots/${ file }.png` ) );
				let diff = new png( { width: actual.width, height: actual.height } );

				let numFailedPixels;
				try {

					numFailedPixels = pixelmatch( expected.data, actual.data, diff.data, actual.width, actual.height, {
						threshold: pixelThreshold,
						alpha: 0.2,
						diffMask: process.env.FORCE_COLOR === '0',
						diffColor: process.env.FORCE_COLOR === '0' ? [255, 255, 255] : [255, 0, 0]
					} );

				} catch {

					attemptId = maxAttemptId;
					console.red( `ERROR! Image sizes does not match in file: ${ file }` );
					++ failedScreenshots;
					continue;

				}
				numFailedPixels /= actual.width * actual.height;


				/* Save and print result */

				if ( numFailedPixels < maxFailedPixels ) {

					attemptId = maxAttemptId;
					console.green( `diff: ${ numFailedPixels.toFixed( 3 ) }, file: ${ file }` );

				} else {

					if ( ++ attemptId === maxAttemptId ) {

						printImage(diff, console);
						console.red( `ERROR! Diff wrong in ${ numFailedPixels.toFixed( 3 ) } of pixels in file: ${ file }` );
						++ failedScreenshots;
						continue;

					} else {

						console.log( 'Another attempt...' );

					}

				}

			} else {

				attemptId = maxAttemptId;
				console.red( `ERROR! Screenshot not exists: ${ file }` );
				++ failedScreenshots;
				continue;

			}

		}

	}

	if ( failedScreenshots ) {

		console.red( `TEST FAILED! ${ failedScreenshots } from ${ endId - beginId } screenshots not pass.` );
		process.exit( 1 );

	} else if ( !process.env.MAKE ) {

		console.green( `TEST PASSED! ${ endId - beginId } screenshots correctly rendered.` );

	}


	await browser.close();

} );
