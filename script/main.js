/*
 * Background animation: 12 large translucent logos drifting slowly.
 *
 * Everything is drawn on one viewport-sized <canvas> with requestAnimationFrame.
 * The old version animated 12 DOM/SVG layers that were each up to 5x the window
 * size, which forced the browser to rasterize and composite huge layers.
 */
(function () {
	'use strict';

	var MOVE_MS = 20000;  // duration of one glide
	var REST_MS = 3000;   // pause between glides
	var MAX_DPR = 2;      // no need to render a faint background at 3x
	var FILL = 'rgba(0, 0, 0, 0.2)';

	// Logo outline, copied from logo.svg (viewBox 0 0 500 450)
	var LOGO_PATH = new Path2D('m 0,0 c -66.666667,0 -133.33333,0 -200,0 33.33333,33.333333 66.66667,66.666667 100,100 C -66.666667,66.666667 -33.333333,33.333333 0,0 z m 141.4214,-424.2657 c -66.666667,0 -133.3333333,0 -200,0 33.333333,33.33333 66.6666667,66.66667 100,100 33.333333,-33.33333 66.66667,-66.66667 100,-100 z m 282.8418,277.3623 c -47.14067,-47.14067 -94.28133,-94.28133 -141.422,-141.422 0,47.14067 0,94.28133 0,141.422 47.14067,0 94.28133,0 141.422,0 z m -141.421,-0.002 c 47.14033,47.141 94.28067,94.282 141.421,141.423 0,-47.140333 0,-94.280667 0,-141.421 -47.14033,-6.7e-4 -94.28067,-0.001 -141.421,-0.002 z m 141.421,141.4229 c -94.28067,-94.280333 -188.56133,-188.56067 -282.842,-282.841 0,94.28033 0,188.560667 0,282.841 94.28067,0 188.56133,0 282.842,0 z M 141.4214,-424.2647 c -94.281,94.28067 -188.562,188.56133 -282.843,282.842 94.280667,0 188.561333,0 282.842,0 3.3e-4,-94.28067 6.7e-4,-188.56133 0.001,-282.842 z M 282.8413,-5.4815 c 47.14067,47.140667 94.28133,94.281333 141.422,141.422 0,-47.140667 0,-94.281333 0,-141.422 -47.14067,0 -94.28133,0 -141.422,0 z m -424.2632,-135.9414 c 0,47.140667 0,94.281333 0,141.422 47.140667,3.3333333e-4 94.281333,6.6666667e-4 141.422,0.001 0,-47.141 0,-94.282 0,-141.423 -47.140667,0 -94.281333,0 -141.422,0 z');

	// Combined transform from logo.svg, centered on the viewBox (250, 225)
	var LOGO_MATRIX = new DOMMatrix([1.25, 0, 0, -1.25, -250, 225])
		.multiply(new DOMMatrix([0.64075527, 0, 0, 0.64262052, 128.15105, 272.64184]));

	// Size ranges per "layer", as a factor of the largest window side
	var SIZE_RANGES = [[0.8, 1.2], [1.5, 3], [4, 5]];

	var canvas, ctx, width, height, dpr;
	var logos = [];
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	function rand(from, to) {
		return from + Math.random() * (to - from);
	}

	// Smooth start and stop, close to the CSS "ease" curve the old version used
	function ease(t) {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	// Each logo stays within one quarter of the screen, for an even spread.
	// Positions are stored relative (0..1) so a resize just rescales them.
	function randomPointInQuadrant(q) {
		var qx = q % 2, qy = Math.floor(q / 2);
		return { x: (qx + Math.random()) / 2, y: (qy + Math.random()) / 2 };
	}

	function createLogos(now) {
		logos = [];
		SIZE_RANGES.forEach(function (range) {
			for (var q = 0; q < 4; q++) {
				var p = randomPointInQuadrant(q);
				logos.push({
					quadrant: q,
					size: rand(range[0], range[1]), // relative to max(width, height)
					from: p,
					to: randomPointInQuadrant(q),
					t: 0,
					start: now + rand(0, REST_MS)
				});
			}
		});
	}

	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		// Use the canvas's CSS size: on iOS that is the large viewport (under
		// the browser bars), while innerHeight stops short of them
		width = canvas.clientWidth;
		height = canvas.clientHeight;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
	}

	// Advance the logos; returns true if any of them moved since the last frame
	function update(now) {
		var moving = false;

		for (var i = 0; i < logos.length; i++) {
			var logo = logos[i];
			var elapsed = now - logo.start;

			// Glide finished and rest is over: pick a new destination
			if (elapsed >= MOVE_MS + REST_MS) {
				logo.from = logo.to;
				logo.to = randomPointInQuadrant(logo.quadrant);
				logo.start = now;
				elapsed = 0;
			}

			var t = ease(Math.min(Math.max(elapsed / MOVE_MS, 0), 1));
			if (t !== logo.t) {
				logo.t = t;
				moving = true;
			}
		}

		return moving;
	}

	function draw() {
		var side = Math.max(width, height);
		var base = new DOMMatrix([dpr, 0, 0, dpr, 0, 0]);

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = FILL;

		for (var i = 0; i < logos.length; i++) {
			var logo = logos[i];
			var x = (logo.from.x + (logo.to.x - logo.from.x) * logo.t) * width;
			var y = (logo.from.y + (logo.to.y - logo.from.y) * logo.t) * height;
			var scale = (logo.size * side) / 500; // viewBox is 500 wide

			ctx.setTransform(base.translate(x, y).scale(scale).multiply(LOGO_MATRIX));
			ctx.fill(LOGO_PATH);
		}
	}

	function frame(now) {
		// Skip the redraw while every logo is resting
		if (update(now)) draw();
		if (!reduceMotion.matches) {
			requestAnimationFrame(frame);
		}
	}

	function init() {
		canvas = document.getElementById('background');
		ctx = canvas.getContext('2d');

		resize();
		createLogos(performance.now());
		requestAnimationFrame(frame);

		// Scroll past the top overscan, so iOS Safari draws the page under its
		// bars (see --overscan in style.css). Users can't scroll the page.
		history.scrollRestoration = 'manual';
		function scrollPastOverscan() {
			var overscan = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--overscan')) || 0;
			window.scrollTo(0, overscan);
		}
		scrollPastOverscan();
		window.addEventListener('load', scrollPastOverscan);

		// Redraw whenever the canvas changes size (window resize, rotation).
		// Resizing clears the canvas, so always redraw.
		new ResizeObserver(function () {
			resize();
			draw();
			scrollPastOverscan();
		}).observe(canvas);

		// Restart the loop if the user turns reduced motion off
		reduceMotion.addEventListener('change', function () {
			if (!reduceMotion.matches) requestAnimationFrame(frame);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
