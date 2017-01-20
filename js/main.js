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
        value: function(base){
            if(this._param){
                base = (typeof base !== 'undefined') ?  base : this._param.base;
                base = (typeof base !== 'undefined') ?  base : 0;
                var now = audioCtx.currentTime;
                this._param.cancelScheduledValues(now);
                this._param.linearRampToValueAtTime(base + this._sustainLevel, now + this._attackTime);
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
    
    this._oscSquareAmp = audioCtx.createGain();
    this._oscSquareAmp.gain.value = 0.5;
    this._oscSquare.connect(this._oscSquareAmp);
    
    this._oscSaw = audioCtx.createOscillator();
    this._oscSaw.type = 'sawtooth';
    this._oscSaw.frequency.value = 440;
    this._oscSaw.start();

    this._oscSawAmp = audioCtx.createGain();
    this._oscSawAmp.gain.value = 0.5;
    this._oscSaw.connect(this._oscSawAmp);
    
    this._oscSine = audioCtx.createOscillator();
    this._oscSine.type = 'sine';
    this._oscSine.frequency.value = 440;
    this._oscSine.start();
    
    this._oscSineAmp = audioCtx.createGain();
    this._oscSineAmp.gain.value = 0;
    this._oscSine.connect(this._oscSineAmp);
    
    this._oscMixer = audioCtx.createChannelMerger(2);
    this._oscSawAmp.connect(this._oscMixer,0,0);
    this._oscSawAmp.connect(this._oscMixer,0,1);
    this._oscSquareAmp.connect(this._oscMixer,0,0);
    this._oscSquareAmp.connect(this._oscMixer,0,1);
    this._oscSineAmp.connect(this._oscMixer,0,0);
    this._oscSineAmp.connect(this._oscMixer,0,1);
    this._oscMixerOutput = audioCtx.createMediaStreamDestination();
    this._oscMixer.connect(this._oscMixerOutput);
    
    this._vca = audioCtx.createGain();
    this._vca.gain.value = 0;
            
    this._vcaEnv = new AsrEG();
    this._vcaEnv.attack = 0.4;
    this._vcaEnv.sustain = 0.05;
    this._vcaEnv.release = 0.4;
    this._vcaEnv.connect(this._vca.gain);
    
    this._filter = audioCtx.createBiquadFilter();
    this._filter.frequency.value = 0;
    this._filter.frequency.base = 0;
    this._filter.Q.value = 10;
    this._filter.type = 'lowpass';
    
    this._filterEnv = new AsrEG();
    this._filterEnv.attack = 0.2;
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
    freq: {
        get: function(){
            return this._oscSquare.frequency.value;
        },
        set: function(newFreq){
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
    },
    vcaEnvParams: {
        get: function(){
            return { a: this._vcaEnv.attack, s: this._vcaEnv.sustain, r: this._vcaEnv.release }
        },
        set: function(p){
            this._vcaEnv.attack = parseFloat(p.a);
            this._vcaEnv.sustain = parseFloat(p.s);
            this._vcaEnv.release = parseFloat(p.r);
        }
    },
    filterEnvParams: {
        get: function(){
            return { a: this._filterEnv.attack, s: this._filterEnv.sustain, r: this._filterEnv.release }
        },
        set: function(p){
            this._filterEnv.attack = parseFloat(p.a);
            this._filterEnv.sustain = parseFloat(p.s);
            this._filterEnv.release = parseFloat(p.r);
        }
    },
    filterParams: {
        get: function(){
            return { c: this._filter.frequency.base, r: this._filter.Q.value, t: this._filter.type}
        },
        set: function(p){
            this._filter.frequency.base = parseFloat(p.c);
            this._filter.Q.value = parseFloat(p.r);
            this._filter.type = p.t;
        }
    },
    vcoMixParams: {
        get: function(){
            return { square: this._filter.frequency.base, saw: this._filter.Q.value, sine: this._filter.type}
        },
        set: function(p){
            this._oscSquareAmp.gain.value = parseFloat(p.square);
            this._oscSawAmp.gain.value = parseFloat(p.saw);
            this._oscSineAmp.gain.value = parseFloat(p.sine);
        }
    }
    

});

function VoicePool() {
    this._voiceCount = 8;
    this._voices = [];
    this._voicesFrequencies = [];
    this._voiceCycleIdx = 0;
    
    for(var i = 0; i < this._voiceCount; i++){
        this._voices[i] = new Voice();
        this._voicesFrequencies[i] = 0;
    }
}

VoicePool.prototype = Object.create(null,{
    constructor: {
        value: VoicePool
    },
    getFreeVoice: {
        value: function(freq){
            var v = this._voiceCycleIdx; //if we can't find a free voice we'll use the first
            for(var i = 0; i < this._voiceCount; i++){
                var idx = this._voiceCycleIdx + i;
                if(idx = this._voiceCount){
                    idx -= this._voiceCycleIdx;
                }
                if(this._voicesFrequencies[idx] == 0){ //if the voice is free
                    v = idx;
                    break;
                }
            }
            this._voiceCycleIdx++;
            if(this._voiceCycleIdx == this._voiceCount)
                this._voiceCycleIdx = 0;
            this._voicesFrequencies[v] = freq;
            return v;
        },
        enumerable: false, //hide from devs
        writable: false, //readonly
        configurable: false //can not change above
    },
    releaseVoice: {
        value: function(freq){
            for(var i = 0; i < this._voiceCount; i++){
                if(this._voicesFrequencies[i] == freq){ //if the voice is playing a released freq
                    this._voicesFrequencies[i] = 0;
                    this._voices[i].gateOff();
                }
            }
        },
        enumerable: false, //hide from devs
        writable: false, //readonly
        configurable: false //can not change above
    },
    keyDown: {
        value: function(freq){
                var voiceIdx = this.getFreeVoice(freq);
                this._voices[voiceIdx].gateOn();
                this._voices[voiceIdx].freq = freq;
        }
    },
    keyUp: {
        value: function(freq){
                var voiceIdx = this.releaseVoice(freq);
        }
    },
    getVoices: {
        value: function(){
            return this._voices;
        }
    }
});

var audioCtx = new AudioContext();

var voiceManager = new VoicePool();

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
                    var freq = notes[n[0]] * Math.pow(2,n[1]+parseInt(document.getElementById('octave').value));
                    if(message.data[2] == 127){
                        voiceManager.keyDown(freq);
                        document.querySelector('#grid-map>div:nth-child(' + (x+1) + ')>div:nth-child(' + (y+1) + ')').classList.add('active');
                    }else{
                        voiceManager.keyUp(freq);
                        document.querySelector('#grid-map>div:nth-child(' + (x+1) + ')>div:nth-child(' + (y+1) + ')').classList.remove('active');
                    }
                    
                }
                catch(e){
                    console.log(e)
                }
            }
        },
        function(){ //failure
            console.log('could not get midi devices');
        }
    );
}


domReady(function() {
    
    var rows = Array.prototype.slice.call( document.getElementById('grid-map').children );
    for(y = rows.length -1 ; y >= 0; y--){
        var cells = Array.prototype.slice.call( rows[y].children ); 
        for(x = 0 ; x < cells.length; x++ ){
            var n = map[x][y];
            var freq = notes[n[0]] * Math.pow(2,n[1]+parseInt(document.getElementById('octave').value));
            cells[x].setAttribute('data-freq', freq);
            cells[x].onmousedown =  function(){
                voiceManager.keyDown(this.getAttribute('data-freq'));
                this.classList.add('active');               
            };
            cells[x].onmouseup = function(){
                voiceManager.keyUp(this.getAttribute('data-freq'));
                this.classList.remove('active');               
            }
        }
    }
    document.querySelectorAll('#vco-controls input').forEach(function(e){
        e.oninput = function(){
            var mix = { square: document.querySelector('#vco-square-mix').value, saw: document.querySelector('#vco-saw-mix').value, sine: document.querySelector('#vco-sine-mix').value };
            voiceManager.getVoices().forEach(function(e){
                e.vcoMixParams = mix;   
            });
        }
    });  
    
    document.querySelectorAll('#filter-controls input, #filter-controls select').forEach(function(e){
        e.oninput = function(){
            var v = { c: document.querySelector('#filter-cutoff').value, r: document.querySelector('#filter-resonance').value, t: document.querySelector('#filter-type').value };
            voiceManager.getVoices().forEach(function(e){
                e.filterParams = v;   
            });
        }
    });   
    document.querySelectorAll('#vca-env-controls input').forEach(function(e){
        e.oninput = function(){
            var v = { a: document.querySelector('#vca-attack').value, s: document.querySelector('#vca-sustain').value, r: document.querySelector('#vca-release').value };
            voiceManager.getVoices().forEach(function(e){
                e.vcaEnvParams = v;   
            });
        }
    });
    document.querySelectorAll('#filter-env-controls input').forEach(function(e){
        e.oninput = function(){
            var v = { a: document.querySelector('#filter-attack').value, s: document.querySelector('#filter-sustain').value, r: document.querySelector('#filter-release').value };
            voiceManager.getVoices().forEach(function(e){
                e.filterEnvParams = v;   
            });
        }
    });
});
