
/* SIGNAL PATHS */
var audioCtx = new AudioContext();
var finalOutput = audioCtx.createMediaStreamDestination();

finalOutput.connect(audioCtx.destination);

var voiceManager = new VoicePool();
var delay = new DelayModule();

voiceManager.getOutput().connect(delay.getInput());

delay.getOutput().connect(finalOutput);

/* END SIGNAL PATHS */

var MidiDevices = null;


var domReady = function(callback) {
    document.readyState === "interactive" || document.readyState === "complete" ? callback() : document.addEventListener("DOMContentLoaded", callback);
};
