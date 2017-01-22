
/* SIGNAL PATHS */
var audioCtx = new AudioContext();
var finalOutput = audioCtx.createMediaStreamDestination();

finalOutput.connect(audioCtx.destination);

var voiceManager = new VoicePool();
var delay = new DelayModule();

voiceManager.getOutput().connect(delay.getInput());

delay.getOutput().connect(finalOutput);

/* END SIGNAL PATHS */

var notes = {
    'Ab': 12.98,
    'A' : 13.75,
    'A#': 14.57,
    'Bb': 14.57,
    'B' : 15.435,
    'C' : 16.35,
    'C#': 17.32,
    'Db': 17.32,
    'D' : 18.35,
    'D#': 19.45,
    'Eb': 19.45,
    'E' : 20.60,
    'F' : 21.83,
    'F#': 23.12,
    'Gb': 23.12,
    'G' : 24.50,
    'G#': 25.96
};

var map = [
    [['C' ,3],['D' ,3],['E' ,3],['F' ,3],['G' ,3],['A', 4],['B', 4],['C', 4]],
    [['G' ,2],['A' ,3],['B' ,3],['C' ,3],['D' ,3],['E' ,3],['F' ,3],['G' ,3]],
    [['D' ,2],['E' ,2],['F' ,2],['G' ,2],['A' ,3],['C' ,3],['D' ,3],['E' ,3]],
    [['A' ,2],['B' ,2],['C' ,2],['D' ,2],['E' ,2],['F' ,2],['G' ,2],['A' ,3]],
    [['E' ,1],['F' ,1],['G' ,1],['A' ,2],['B' ,2],['C' ,2],['D' ,2],['E' ,2]],
    [['B' ,1],['C' ,1],['D' ,1],['E' ,1],['F' ,1],['G' ,1],['A' ,2],['B' ,2]],
    [['F' ,0],['G' ,0],['A' ,1],['B' ,1],['C' ,1],['D' ,1],['E' ,1],['F' ,1]],
    [['C' ,0],['D' ,0],['E' ,0],['F' ,0],['G' ,0],['A' ,1],['B' ,1],['C' ,1]]
];

var MidiDevices = null;


var domReady = function(callback) {
    document.readyState === "interactive" || document.readyState === "complete" ? callback() : document.addEventListener("DOMContentLoaded", callback);
};
