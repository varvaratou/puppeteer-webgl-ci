/**
 * @author munrocket / https://github.com/munrocket
 */

const puppeteer = require( 'puppeteer' );
const handler = require( 'serve-handler' );
const http = require( 'http' );
const pixelmatch = require( 'pixelmatch' );
const printImage = require( 'image-output' );
const jimp = require( 'jimp' );
const fs = require( 'fs' );

const port = 1234;
const pixelThreshold = 0.2; // threshold error in one pixel
const maxFailedPixels = 0.05; // total failed pixels

const width = 800;
const height = 600;
const jpgScale = 0.4;
const jpgQuality = 90;

const loadTimeout = 600;
const domTimeout = 50;
const sizeTimeout = 2200; // additional timeout for resources size
const minPageSize = 4.0; // in mb, when sizeTimeout = 0
const maxPageSize = 28.0; // in mb, when sizeTimeout = sizeTimeout

const maxAttemptId = 3; // progresseve attempts
const progressFunc = n => 1 + n;

const exceptionList = [
	'index',
	'webgl_kinect',
	'css3d_youtube',
	'webgl_materials_envmaps_parallax'
].concat( ( process.platform === "win32" ) ? [ // exceptions for windows
	'webgl_effects_ascii'
] : [] );

const sleep = ( timeout ) => new Promise( resolve => setTimeout( resolve, timeout ) );
console.green = ( msg ) => console.log( `\x1b[32m${ msg }\x1b[37m` );
console.red = ( msg ) => console.log( `\x1b[31m${ msg }\x1b[37m` );
console.null = () => {};


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
server.on( 'SIGINT', () => process.exit( 1 ) );


/* Launch puppeteer with WebGL support in Linux */

const pup = puppeteer.launch( {
	args: [
		'--use-gl=egl',
		'--no-sandbox',
		'--enable-precise-memory-info',
		'--enable-begin-frame-control',
		'--enable-surface-synchronization',
		'--run-all-compositor-stages-before-draw',
		'--disable-threaded-animation',
		'--disable-threaded-scrolling',
		'--disable-checker-imaging'
	]
} ).then( async browser => {


	/* Prepare page */

	const page = ( await browser.pages() )[ 0 ];
	await page.setViewport( { width, height } );

	const preparePage = fs.readFileSync( 'test/e2e/prepare-each-page.js', 'utf8' );
	const injection = fs.readFileSync( 'test/e2e/deterministic-injection.js', 'utf8' );
	await page.evaluateOnNewDocument( injection );

	const devtools = await page.target().createCDPSession();
	await devtools.send( 'HeadlessExperimental.enable' );
	await devtools.send( 'HeapProfiler.enable' );

	page.on( 'console', msg => ( msg.text().slice( 0, 8 ) === 'Warning.' ) ? console.null( msg.text() ) : {} );


	/* Find files */

	const exactList = process.argv.slice( 2 ).map( f => f.replace( '.html', '' ) );

	const files = fs.readdirSync( './examples' )
		.filter( s => s.slice( - 5 ) === '.html' )
		.map( s => s.slice( 0, s.length - 5 ) )
		.filter( f => ( process.argv.length > 2 ) ? exactList.includes( f ) : ! exceptionList.includes( f ) );


	/* Loop for each file, with CI parallelism */

	let file, attemptProgress;
	let failedScreenshots = 0;
	const isParallel = 'CI' in process.env;
	const beginId = isParallel ? Math.floor( parseInt( process.env.CI.slice( 0, 1 ) ) * files.length / 4 ) : 0;
	const endId = isParallel ? Math.floor( ( parseInt( process.env.CI.slice( - 1 ) ) + 1 ) * files.length / 4 ) : files.length;
	await sleep( loadTimeout );

	for ( let id = beginId; id < endId; ++ id ) {


		/* At least 3 attempts before fail */

		let attemptId = process.env.MAKE ? 1 : 0;

		while ( attemptId < maxAttemptId ) {


			/* Load target page */

			file = files[ id ];
			attemptProgress = progressFunc( attemptId );
			await page.goto( 'about:blank' );
			await devtools.send( 'HeapProfiler.collectGarbage' );
			await devtools.send( 'HeapProfiler.collectGarbage' );
			global.gc();
			global.gc();

			try {

				await page.goto( `http://localhost:${ port }/examples/${ file }.html`, {
					waitUntil: 'load',
					timeout: loadTimeout * attemptProgress
				} );

			} catch {

				console.null( 'Warning. Network timeout exceeded...' );

			}


			/* Prepare page */

			try {

				await page.evaluateHandle( sleep, domTimeout * attemptProgress );
				await page.evaluate( preparePage );
				await page.evaluateHandle( sleep, domTimeout * attemptProgress );

				async function relativeSize ( page ) {

					const pageSize = await page.evaluate( () => performance.memory.usedJSHeapSize / 1024 / 1024 );
					return Math.min( 1, ( pageSize - minPageSize ) / maxPageSize );

				}

				const size = await relativeSize( page );
				await page.evaluateHandle( sleep, sizeTimeout * attemptProgress * size );
				const newSize = await relativeSize( page );
				await page.evaluateHandle( sleep, sizeTimeout * attemptProgress * ( newSize - size ) );

			} catch ( e ) {

				if ( ++ attemptId === maxAttemptId ) {

					console.red( `WTF? 'Network timeout' is small for your machine. file: ${ file } \n${ e }` );
					++ failedScreenshots;
					continue;

				} else {

					console.log( 'Another attempt..' );
					await sleep( loadTimeout * attemptProgress );

				}

			}


			/* Make or diff? */

			if ( process.env.MAKE ) {


				/* Make screenshots */

				attemptId = maxAttemptId;
				let capture = await devtools.send( 'HeadlessExperimental.beginFrame', { screenshot: {} } );
				let bitmap = ( await jimp.read( Buffer.from( capture.screenshotData, 'base64' ) ) )
					.write( `./examples/screenshots/${ file }.png`)
					.scale( jpgScale ).quality( jpgQuality )
					.write( `./examples/screenshots/${ file }_thumbnail.jpg` ).bitmap;
				printImage( bitmap, console );
				console.green( `file: ${ file } generated` );


			} else if ( fs.existsSync( `./examples/screenshots/${ file }.png` ) ) {


				/* Diff screenshots */

				let capture = await devtools.send( 'HeadlessExperimental.beginFrame', { screenshot: {} } );
				let actual = ( await jimp.read( Buffer.from( capture.screenshotData, 'base64' ) ) ).bitmap;
				let expected = ( await jimp.read( fs.readFileSync( `./examples/screenshots/${ file }.png` ) ) ).bitmap;
				let diff = actual;

				let numFailedPixels;
				try {

					numFailedPixels = pixelmatch( expected.data, actual.data, diff.data, actual.width, actual.height, {
						threshold: pixelThreshold,
						alpha: 0.2,
						diffMask: process.env.FORCE_COLOR === '0',
						diffColor: process.env.FORCE_COLOR === '0' ? [ 255, 255, 255 ] : [ 255, 0, 0 ]
					} );

				} catch {

					attemptId = maxAttemptId;
					console.red( `ERROR! Image sizes does not match in file: ${ file }` );
					++ failedScreenshots;
					continue;

				}
				numFailedPixels /= actual.width * actual.height;


				/* Print results */

				if ( numFailedPixels < maxFailedPixels ) {

					attemptId = maxAttemptId;
					console.green( `diff: ${ numFailedPixels.toFixed( 3 ) }, file: ${ file }` );

				} else {

					if ( ++ attemptId === maxAttemptId ) {

						printImage( diff, console );
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


	/* Finish */

	if ( failedScreenshots ) {

		console.red( `TEST FAILED! ${ failedScreenshots } from ${ endId - beginId } screenshots not pass.` );
		process.exit( 1 );

	} else if ( ! process.env.MAKE ) {

		console.green( `TEST PASSED! ${ endId - beginId } screenshots correctly rendered.` );

	}

	await browser.close();

} );
