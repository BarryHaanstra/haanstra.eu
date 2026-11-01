var transitionDurationProperty = "";
var transformProperty = "";

/*
 * Start a new scene when the document is ready
 */
$(document).ready(function() {
	// Start the main scene
	var scene = new Scene();
	scene.init();

	// Set resize handler
	$(window).resize(function() {
		scene.reinit();
	});
	$(window).bind('orientationchange', function() {
		scene.reinit();
	});

	// Disable bounce in iOS Safari
	document.ontouchmove = function(event) {
		event.preventDefault();
	}
});


/*
 * Defines the main scene on the screen
 */
function Scene() {
	this.animationTimer = null;
	this.screenRects = [];
	this.logoObjects = [];

	/*
	 * Init method
	 * Initialize the page layout
	 */
	this.init = function() {
		// Create and position background logos
		this.createLogoObjects();
		this.layoutLogoObjects();

		// Overlay the main logo
		this.showMainLogoObject();

		// Start animating the background logos
		this.animateLogoObjects();
	};


	/*
	 * ReInit method
	 * Reconfigure after page layout change
	 */
	this.reinit = function() {
		this.createRects();
		this.showMainLogoObject();
	};


	/*
	 * createRects method
	 * Split the screen into parts where logos should appear
	 * This makes distribution more uniform
	 */
	this.createRects = function() {
		this.screenRects = [];

		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		var numberOfPartsX = 2;
		var numberOfPartsY = 2;

		var partWidth = Math.round(windowWidth / numberOfPartsX);
		var partHeight = Math.round(windowHeight / numberOfPartsY);

		for (var j=0; j < numberOfPartsY; j++) {
			for (var i=0; i < numberOfPartsX; i++) {
				var part = new Rect(i * partWidth, j * partHeight, partWidth, partHeight);
				this.screenRects.push(part);
			}
		}
	}


	/*
	 * createLogoObjects method
	 * Create the logo objects, but do not position, size & paint them
	 */
	this.createLogoObjects = function() {
		this.logoObjects = [];

		for (var i=0; i < 3; i++) {
			for (var j=0; j < 4; j++) {
				var logoObject = new Logo(0, 0, 0, 0);
				this.logoObjects.push(logoObject);
			}
		}
	}


	/*
	 * layoutLogoObjects method
	 * Position, size & paint the logo objects
	 */
	this.layoutLogoObjects = function() {
		this.createRects();

		// Logo min/max dimensions
		var windowSize = Math.max($(window).width(), $(window).height());
		var minValues = [windowSize * 0.8, windowSize * 1.5, windowSize * 4];
		var maxValues = [windowSize * 1.2, windowSize * 3, windowSize * 5];

		// Content box resize
		$('#body').css({
			'width' : $(window).width() + 'px',
			'height' : $(window).height() + 'px',
			'overflow': 'hidden'
		});

		// Layout logo objects
		var counter = 0;
		for (var i=0; i < 3; i++) {
			for (var j=0; j < 4; j++) {
				var screenRect = this.screenRects[j];
				var size = this.randomNumber(minValues[i], maxValues[i]);
				var x = this.randomNumber(screenRect.x, screenRect.x2);
				var y = this.randomNumber(screenRect.y, screenRect.y2);
				var logoObject = this.logoObjects[counter];
				logoObject.paint(x, y, size, size);

				counter++;
			}
		}
	}


	this.animateLogoObjects = function() {
		var duration = 20000;

		// Move logo objects
		var counter = 0;
		for (var i=0; i < 3; i++) {
			for (var j=0; j < 4; j++) {
				var screenRect = this.screenRects[j];
				var logoObject = this.logoObjects[counter];

				var x = this.randomNumber(screenRect.x, screenRect.x2);
				var y = this.randomNumber(screenRect.y, screenRect.y2);
				logoObject.animateTo(x, y, (duration / 1000));

				counter++;
			}
		}

		window.clearTimeout(this.animationTimer);
		this.animationTimer = window.setTimeout($.proxy(this.animateLogoObjects, this), (duration + 3000));
	}


	/*
	 * randomNumber method
	 * Utility method for generating numbers between a low and a high number
	 */
	this.randomNumber = function(from, to) {
		return Math.floor(Math.random() * (to - from + 1) + from);
	}


	/*
	 * createMainLogoObject method
	 * Creates the centered main logo
	 */
	this.showMainLogoObject = function() {
   		var windowSize = Math.min($(window).width(), $(window).height());
   		var logoSize = Math.round(windowSize / 2);
   		var logoX = Math.round(($(window).width() / 2) - (logoSize / 2));
   		var logoY = Math.round(($(window).height() / 2) - (logoSize / 2))

   		var divElement = $('#mainLogo');
   		if (!divElement[0]) {
			 	divElement = $('<div>', {
				'id' : 'mainLogo'
			}).load('logomain.svg').appendTo('#content');
   		}

		 divElement.css({
			'position' : 'absolute',
			'left' : logoX + 'px',
			'top' : logoY + 'px',
			'width' : logoSize + 'px',
			'height' : logoSize + 'px',
			'z-index' : 100
		});
	}
};


/*
 * Logo object
 */
function Logo() {
	var divElement = null;
	var currentCenterX = 0;
	var currentCenterY = 0;

	// Display functions
	this.paint = function(centerX, centerY, width, height) {
		currentCenterX = centerX;
		currentCenterY = centerY;

		var x = centerX - Math.round(width / 2);
		var y = centerY - Math.round(height / 2);

		if (divElement == null) {
			divElement = $('<div>', {
				'class' : 'logo'
			}).load('logo.svg').appendTo('#content');
		}

		divElement.css({
			'position' : 'absolute',
			'left' : x + 'px',
			'top' : y + 'px',
			'width' : width + 'px',
			'height' : height + 'px'
		});
	}


	this.animateTo = function(newX, newY, duration) {
		var moveX =  newX - currentCenterX;
		var moveY = newY - currentCenterY;

		divElement.css({
			"transform" : "translate3d(" + moveX + "px" + ", " + moveY + "px" + ", 0)",
			"transition-duration" : duration + "s"
		});
	}
};


/*
 * A rectangle object
 */
function Rect(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.x2 = x + width;
	this.y2 = y + height;
}