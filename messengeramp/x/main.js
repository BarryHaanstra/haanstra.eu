/*
 * Putty Tray referrer tracking
 */
function URLencode(plaintext)

 {

	var SAFECHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_.!~*'()";

	var HEX = "0123456789ABCDEF";

	var encoded = "";


	for (var i = 0; i < plaintext.length; i++ ) {

		var ch = plaintext.charAt(i);

	    if (ch == " ") {

		    encoded += "+";

		} else if (SAFECHARS.indexOf(ch) != -1) {

		    encoded += ch;

		} else {

		    var charCode = ch.charCodeAt(0);

			if (charCode > 255) {

				encoded += "+";

			} else {

				encoded += "%";

				encoded += HEX.charAt((charCode >> 4) & 0xF);

				encoded += HEX.charAt(charCode & 0xF);

			}

		}

	}



	return encoded;

};