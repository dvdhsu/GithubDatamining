/* Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Functions that are useful
 */

function NewGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function ToAscii(chars) {
    var ascii = '';
    for (var i = 0, l = chars.length; i < l; i++) {
        var c = chars[i].charCodeAt(0);

        // make sure we only convert half-full width char
        if (c >= 0xFF00 && c <= 0xFFEF) {
            c = 0xFF & (c + 0x20);
        }

        ascii += String.fromCharCode(c);
    }

    return ascii;
}

function NumberOfBytes(str) {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}
module.exports = {
    //Returns a guid type string
    NewGuid: NewGuid,
    
    //Converts a string to ascii
    ToAscii: ToAscii,

    //Returns the number of bytes in a string
    NumberOfBytes: NumberOfBytes
}
