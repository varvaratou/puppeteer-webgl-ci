const puppeteer = require( 'puppeteer' );
const handler = require( 'serve-handler' );
const http = require( 'http' );
const pixelmatch = require( 'pixelmatch' );
const printImage = require( 'image-output' );
const jimp = require('jimp');
const fs = require( 'fs' );

const port = 1234;
const pixelThreshold = 0.2;                // threshold error in one pixel
const maxFailedPixels = 0.05;              // total failed pixels

const width = 800;
const height = 600;
const jpgScale = 0.4;
const jpgQuality = 90;

const loadTimeout = 500;
const domTimeout = 50;
const sizeTimeout = 1800;                  // additional timeout for resources size
const minPageSize = 1.0;                   // in mb, when sizeTimeout = 0
const maxPageSize = 6.0;                   // in mb, when sizeTimeout = sizeTimeout

const maxAttemptId = 3;                    // progresseve attempts
const progressFunc = n => 1 + n;

const exceptionList = [
	'index',
	'css3d_youtube',
	'webgl_materials_envmaps_parallax'
].concat( ( process.platform === "win32" ) ? [ // for windows
	'webgl_effects_ascii'
] : [] );

console.log('stress test 7');
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


/* Launch puppeteer with WebGL support in Linu x */

const pup = puppeteer.launch( {
	args: [
		'--use-gl=egl',
		'--no-sandbox',
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

	page.on( 'console', msg => ( msg.text().slice( 0, 8 ) === 'Warning.' ) ? console.null( msg.text() ) : {} );
	page.on( 'response', async ( response ) => {

		try {

			await response.buffer().then( buffer => pageSize += buffer.length );

		} catch ( e ) {

			console.null( `Warning. Wrong request. ${ e }` );

		}

	} );

	await new Promise( resolve => setTimeout( resolve, loadTimeout ) );


	/* Find files */

	const exactList = process.argv.slice( 2 ).map( f => f.replace( '.html', '' ) );

	const files = fs.readdirSync( './examples' )
		.filter( s => s.slice( - 5 ) === '.html' )
		.map( s => s.slice( 0, s.length - 5 ) )
		.filter( f => ( process.argv.length > 2 ) ? exactList.includes( f ) : ! exceptionList.includes( f ) );


	/* Loop for each file, with CI parallelism */

	let pageSize, file, attemptProgress;
	let failedScreenshots = 0;
	const isParallel = 'CI' in process.env;
	const beginId = isParallel ? Math.floor( parseInt( process.env.CI.slice( 0, 1 ) ) * files.length / 4 ) : 0;
	const endId = isParallel ? Math.floor( ( parseInt( process.env.CI.slice( - 1 ) ) + 1 ) * files.length / 4 ) : files.length;

	for ( let id = beginId; id < endId; ++ id ) {


		/* At least 3 attempts before fail */

		let attemptId = process.env.MAKE ? 1 : 0;

		while ( attemptId < maxAttemptId ) {


			/* Load target page */

			file = files[ id ];
			attemptProgress = progressFunc( attemptId );
			pageSize = 0;
			global.gc();
			global.gc();

			try {

				await page.goto( `http://localhost:${ port }/examples/${ file }.html`, {
					waitUntil: 'load',
					timeout: loadTimeout * attemptProgress
				} );

			} catch {

				console.log( 'Warning. Network timeout exceeded...' );

			}


			/* Prepare page */

			try {

				await page.evaluate( async ( domTimeout, attemptProgress ) => {

					await new Promise( resolve => setTimeout( resolve, domTimeout * attemptProgress ) );

				}, domTimeout, attemptProgress)

				await page.evaluate( preparePage );

				await page.evaluate( async ( pageSize, minPageSize, maxPageSize, sizeTimeout, domTimeout, attemptProgress ) => {

					await new Promise( resolve => setTimeout( resolve, domTimeout * attemptProgress ) );
					let resourcesSize = Math.min( 1, ( pageSize / 1024 / 1024 - minPageSize ) / maxPageSize );
					await new Promise( resolve => setTimeout( resolve, sizeTimeout * resourcesSize * attemptProgress ) );

				}, pageSize, minPageSize, maxPageSize, sizeTimeout, domTimeout, attemptProgress );

			} catch ( e ) {

				if ( ++ attemptId === maxAttemptId ) {

					console.red( `WTF? 'Network timeout' is small for your machine. file: ${ file } \n${ e }` );
					++ failedScreenshots;
					continue;

				} else {

					console.log( 'Another attempt..' );
					await new Promise( resolve => setTimeout( resolve, loadTimeout * attemptProgress ) );

				}

			}


			/* Make or diff? */

			if ( process.env.MAKE ) {


				/* Make screenshots */

				attemptId = maxAttemptId;
				let capture = await devtools.send( 'HeadlessExperimental.beginFrame', { screenshot: {} } );
				let img = await jimp.read( Buffer.from( capture.screenshotData, 'base64' ) );
				img.write( `./examples/screenshots/${ file }.png`)
					.scale( jpgScale ).quality( jpgQuality )
					.write( `./examples/thumbnails/${ file }.jpg` );
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
