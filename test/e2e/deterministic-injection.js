/**
 * @author munrocket / https://github.com/munrocket
 */

( function () {


	/* Deterministic random */

	let seed = Math.PI / 4;
	window.Math.random = function () {

		const x = Math.sin( seed ++ ) * 10000;
		return x - Math.floor( x );

	};


	/* Deterministic timer */

	let frameId = 0;
	const now = () => frameId * 16;
	window.Date.now = now;
	window.Date.prototype.getTime = now;
	window.performance.now = now;


	/* Deterministic RAF */

	const maxFrameId = 2;
	const RAF = window.requestAnimationFrame;
	window.requestAnimationFrame = function ( cb ) {

		RAF( function() {

			if ( frameId ++ < maxFrameId ) {

				cb( now() );

			}

		} );

	};


	/* Semi-determitistic video */

	let play = HTMLVideoElement.prototype.play;
	HTMLVideoElement.prototype.play = async function () {

		play.call( this );
		this.addEventListener( 'timeupdate', () => this.pause() );

		function renew() {

			this.load();
			play.call( this );
			RAF( renew );

		}
		RAF( renew );

	};

}() );
