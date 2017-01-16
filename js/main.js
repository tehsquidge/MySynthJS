var audioCtx = new AudioContext();

function AsrEG(){
    this._attackTime = 0.1;
    this._sustainLevel = 0.5;
    this._releaseTime = 0.1;
    
    this._param = null;
}

AsrEG.prototype = Object.create(null,{
    constructor: {
        value: AsrEG
    },
    connect: {
        value: function(param){
            this._param = param;
        }
    },
    gateOn: {
        value: function(){
            if(this._param){
                var now = audioCtx.currentTime;
                this._param.cancelScheduledValues(now);
                this._param.linearRampToValueAtTime(this._sustainLevel, now + this._attackTime);
            }
        }
    },
    gateOff: {
        value: function(){
            if(this._param){
                var now = audioCtx.currentTime;
                this._param.linearRampToValueAtTime(0, now + this._attackTime + this._releaseTime);
            }
        }
    },
    attack: {
        get: function(){
            return this._attackTime;
        },
        set: function(t){
            this._attackTime = t;
        }
    },
    sustain: {
        get: function(){
            return this._sustainLevel;
        },
        set: function(l){
            this._sustainLevel = l;
        }
    },
    release: {
        get: function(){
            return this._releaseTime;
        },
        set: function(t){
            this._releaseTime = t;
        }
    }
});

function Voice(){
    this._oscSquare = audioCtx.createOscillator();
    this._oscSquare.type = 'square';
    this._oscSquare.frequency.value = 440;
    this._oscSquare.start();
    
    this._oscSaw = audioCtx.createOscillator();
    this._oscSaw.type = 'sawtooth';
    this._oscSaw.frequency.value = 440;
    this._oscSaw.start();
    
    this._oscSine = audioCtx.createOscillator();
    this._oscSine.type = 'sine';
    this._oscSine.frequency.value = 440;
    this._oscSine.start();
    
    this._oscMixer = audioCtx.createChannelMerger(2);
    this._oscSaw.connect(this._oscMixer,0,0);
    this._oscSaw.connect(this._oscMixer,0,1);
    this._oscSquare.connect(this._oscMixer,0,0);
    this._oscSquare.connect(this._oscMixer,0,1);
    this._oscSine.connect(this._oscMixer,0,0);
    this._oscSine.connect(this._oscMixer,0,1);
    this._oscMixerOutput = audioCtx.createMediaStreamDestination();
    this._oscMixer.connect(this._oscMixerOutput);
    
    this._vca = audioCtx.createGain();
    this._vca.gain.value = 0;
            
    this._vcaEnv = new AsrEG();
    this._vcaEnv.attack = 0.1;
    this._vcaEnv.sustain = 0.4;
    this._vcaEnv.release = 0.2;
    this._vcaEnv.connect(this._vca.gain);
    
    this._filter = audioCtx.createBiquadFilter();
    this._filter.frequency.value = 0;
    this._filter.Q.value = 0.6;
    this._filter.type = 'lowpass';
    
    this._filterEnv = new AsrEG();
    this._filterEnv.attack = 0.25;
    this._filterEnv.sustain = 500;
    this._filterEnv.release = 0.5;
    this._filterEnv.connect(this._filter.frequency);
    
    this._oscMixerOutput.connect(this._vca);
    this._vca.connect(this._filter);
    this._filter.connect(audioCtx.destination);
}

Voice.prototype = Object.create(null, {
    constructor: {
        value: Voice
    },
    setFreq: {
        value: function(newFreq){
            this._oscSquare.frequency.setValueAtTime(newFreq,audioCtx.currentTime);
            this._oscSaw.frequency.setValueAtTime(newFreq,audioCtx.currentTime);
            this._oscSine.frequency.setValueAtTime(newFreq,audioCtx.currentTime);
        }
    },
    gateOn: {
        value: function(){
            this._vcaEnv.gateOn();
            this._filterEnv.gateOn();
        }
    },
    gateOff: {
        value: function(){
            this._vcaEnv.gateOff();
            this._filterEnv.gateOff();
        }
    }
});

var Voice1 = new Voice();

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
    [['B' ,0],['C' ,1],['D' ,1],['E' ,1],['F' ,1],['G' ,1],['A' ,2],['B' ,2]],
    [['F' ,0],['G' ,0],['A' ,1],['B' ,1],['C' ,1],['D' ,1],['E' ,1],['F' ,1]],
    [['C' ,0],['D' ,0],['E' ,0],['F' ,0],['G' ,0],['A' ,1],['B' ,1],['C' ,1]]
];


var MidiDevices = null;

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
        .then(
        function(midi){ //success
            console.log('Got midi!', midi);
            MidiDevices = midi;
            var inputs = MidiDevices.inputs.values();
            for (var input = inputs.next();
                 input && !input.done;
                 input = inputs.next()) {
                // each time there is a midi message call the onMIDIMessage function
                input.value.onmidimessage = onMIDIMessage;
            }

            function onMIDIMessage (message) {
                var x = Math.floor(message.data[1]/16);
                var y = message.data[1] - (16 * x);
                try {
                    var n = map[x][y];
                    console.log(n);
                    if(message.data[2] == 127){
                        var freq = notes[n[0]] * Math.pow(2,n[1]+1);
                        console.log(freq);
                        Voice1.gateOn();
                        Voice1.setFreq(freq);
                    }else{
                        Voice1.gateOff();
                    }
                    
                }
                catch(e){
                    console.log('not mapped')
                }
            }
        },
        function(){ //failure
            console.log('could not get midi devices');
        }
    );
}
