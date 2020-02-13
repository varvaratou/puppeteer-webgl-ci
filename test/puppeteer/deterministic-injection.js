(  function() {


	/* Deterministic random */

	let seed = Math.PI / 4;
	window.Math.random = function() {

		const x = Math.sin( seed++ ) * 10000;
		return x - Math.floor( x );

	};


	/* Deterministic timer */

	const now = function() { return frameId * 16; };

	window.Date.now = now;
	window.Date.prototype.getTime = now;
	window.performance.wow = performance.now;
	window.performance.now = now;


	/* Deterministic rAF */

	let frameId = 0;
	window.chromeMaxFrameId = 1;
	window.chromeRenderStarted = false;
	window.chromeRenderFinished = false;
	const rAF = window.requestAnimationFrame;
	window.requestAnimationFrame = function( cb ) {

		if ( !chromeRenderStarted ) {

			setTimeout( function() {

				requestAnimationFrame( cb );

			}, 50 );

		} else {

			rAF( function() {

				if ( frameId++ < chromeMaxFrameId ) {

					cb( now() );

				} else {

					chromeRenderFinished = true;

				}

			} );

		}

	}


	/* Semi-determitistic video */

	let play = HTMLVideoElement.prototype.play;
	HTMLVideoElement.prototype.play = async function() {

		play.call( this );
		this.addEventListener( 'timeupdate', () => this.pause() );

		function renew() {
			this.load();
			play.call( this );
			rAF( renew );
		}
		rAF( renew );

	}

}() );