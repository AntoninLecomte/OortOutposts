/** 
 * Return a string to the hh:mm:ss format from seconds 
 * @param {number} - The duration to be translated in seconds
 * @returns {string} - The converted duration string
*/
function secondsToDurationString(seconds){
    var hours   = Math.floor(Math.abs(seconds) / 3600);
    var minutes = Math.floor((Math.abs(seconds)  - (hours * 3600)) / 60);
    var seconds = Math.round(Math.abs(seconds)  - (hours * 3600) - (minutes * 60));

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}

    return hours+':'+minutes+':'+seconds;
}

export {secondsToDurationString}