function AsrEG(){
    this._attackTime = 0.1;
    this._sustainLevel = 0.5;
    this._releaseTime = 0.1;
    
    this._targetModule = null;
}

AsrEG.prototype = Object.create(null,{
    constructor: {
        value: AsrEG
    },
    connect: {
        value: function(param){
            this._targetModule = param;
        }
        
    },
    gateOn: {
        value: function(base){
            if(this._targetModule){
                base = (typeof base !== 'undefined') ?  base : this._targetModule.base;
                base = (typeof base !== 'undefined') ?  base : 0;
                base = (base < 0) ? 0 : base;
                var now = audioCtx.currentTime;
                this._targetModule.cancelScheduledValues(now);
                this._targetModule.linearRampToValueAtTime(base + this._sustainLevel, now + this._attackTime);
            }
        }
    },
    gateOff: {
        value: function(){
            if(this._targetModule){
                var now = audioCtx.currentTime;
                this._targetModule.linearRampToValueAtTime(0, now + this._attackTime + this._releaseTime);
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

function DelayModule(){
    this._delay = audioCtx.createDelay(5.0);
    this._delay.delayTime.value = 2.5;
        
    this._delayGain = audioCtx.createGain();
    this._delayGain.gain.value = 0.5;
    this._delayGain.connect(this._delay)

    this._input = audioCtx.createMediaStreamDestination();
    this._output = audioCtx.createMediaStreamDestination();
    
    this._merger = audioCtx.createChannelMerger(2);
    this._splitter = audioCtx.createChannelSplitter(2);
        
    this._input.connect(this._merger,0,1);
    this._input.connect(this._merger,0,0);
    this._delay.connect(this._merger,0,1);
    this._delay.connect(this._merger,0,0);
    
    this._merger.connect(this._splitter);
    
    this._splitter.connect(this._output,0);
    this._splitter.connect(this._delayGain,1);

}

DelayModule.prototype = Object.create(null,{
    constructor:{
        value: DelayModule
    },
    delayTime: {
        get: function(){
            return this._delay.delayTime.value;
        },
        set: function(d){
            this._delay.delayTime.value = d;
        }
    },
    delayFeedback: {
        get: function(){
            return this._delayGain.gain.value;
        },
        set: function(d){
            this._delayGain.gain.value  = d;
        }
    },
    getInput: {
        value: function(){
            return this._input;
        }
    },
    getOutput: {
        value: function(){
            return this._output;
        }
    },
    params: {
        get: function(){
            return { feedback: this._delayGain.gain.value, time: this._delay.delayTime.value }
        },
        set: function(a){
            this._delay.delayTime.value = a.time;
            this._delayGain.gain.value = a.feedback;
        }
    }
});

function Voice(output){
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
    this._filter.connect(output,0,0);
    this._filter.connect(output,0,1);
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
            var base = (this._filter.kbdTrack)? this._oscSquare.frequency.value + this._filter.frequency.base : this._filter.frequency.base;
            this._filterEnv.gateOn(base);
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
            return { c: this._filter.frequency.base, r: this._filter.Q.value, t: this._filter.type, kbdTrack: this._filter.kbdTrack }
        },
        set: function(p){
            this._filter.frequency.base = parseFloat(p.c);
            this._filter.Q.value = parseFloat(p.r);
            this._filter.type = p.t;
            this._filter.kbdTrack = p.kbdTrack;
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
    
    this._output = audioCtx.createChannelMerger(2);
    
    for(var i = 0; i < this._voiceCount; i++){
        this._voices[i] = new Voice(this._output);
        this._voicesFrequencies[i] = 0;
    }
}

VoicePool.prototype = Object.create(null,{
    constructor: {
        value: VoicePool
    },
    getFreeVoice: {
        value: function(freq){
            //is the freq already playing
            for(var i = 0; i < this._voiceCount; i++){
                if(this._voicesFrequencies[i] == freq){
                    v = i;
                    return v; //note already playing on a voice so return that
                }
            }
            var v = this._voiceCycleIdx; //if we can't find a free voice we'll use the first
            for(var i = 0; i < this._voiceCount; i++){
                var idx = this._voiceCycleIdx + i;
                if(idx == this._voiceCount){
                    idx -= this._voiceCycleIdx;
                }
                if(this._voicesFrequencies[idx] == 0){ //if the voice is free (note: that this is the assigned frequency not the one actually sounding. If it's "assigned" 0 freq then it's been released although it may still be playing a sound)
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
    },
    getOutput: {
        value: function(){
            return this._output;
        }
    }
});

function MidiInputDevice(){
    this._input = null;
    this._output = null;
}

MidiInputDevice.prototype = Object.create(Object,{
    constructor:{
        value: MidiInputDevice
    },
    onMIDIMessage: {
        value: function(message) {
            
        }
    },
    input: {
        get: function(){
            return this._input;
        },
        set: function(i){
            this._input = i;
            var self = this;
            this._input.onmidimessage = function(m){ self.onMIDIMessage(m); }
        }
    },
    output: {
        get: function(){
            return this._output;
        },
        set: function(i){
            this._output = i;
        }
    }
});

function LaunchPad(){
    
    MidiInputDevice.call(this);
    
    this._root = "C";

    this._notes = {
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

    this._map = [
        [['C' ,3],['D' ,3],['E' ,3],['F' ,3],['G' ,3],['A', 4],['B', 4],['C', 4]],
        [['G' ,2],['A' ,3],['B' ,3],['C' ,3],['D' ,3],['E' ,3],['F' ,3],['G' ,3]],
        [['D' ,2],['E' ,2],['F' ,2],['G' ,2],['A' ,3],['B' ,3],['C' ,3],['D' ,3]],
        [['A' ,2],['B' ,2],['C' ,2],['D' ,2],['E' ,2],['F' ,2],['G' ,2],['A' ,3]],
        [['E' ,1],['F' ,1],['G' ,1],['A' ,2],['B' ,2],['C' ,2],['D' ,2],['E' ,2]],
        [['B' ,1],['C' ,1],['D' ,1],['E' ,1],['F' ,1],['G' ,1],['A' ,2],['B' ,2]],
        [['F' ,0],['G' ,0],['A' ,1],['B' ,1],['C' ,1],['D' ,1],['E' ,1],['F' ,1]],
        [['C' ,0],['D' ,0],['E' ,0],['F' ,0],['G' ,0],['A' ,1],['B' ,1],['C' ,1]]
    ];
    
    
    
    this.buildGrid();
}

LaunchPad.prototype = Object.create(MidiInputDevice.prototype,{
    constructor:{
        value: LaunchPad
    },
    onMIDIMessage: {
        value: function(message) {
            var x = Math.floor(message.data[1]/16);
            var y = message.data[1] - (16 * x);
            try {
                var n = this._map[x][y];
                var freq = this._notes[n[0]] * Math.pow(2,n[1]+parseInt(document.getElementById('octave').value));
                if(message.data[2] == 127){
                    voiceManager.keyDown(freq);
                    this.sendColorToDevice(x,y,'on');
                    document.querySelector('#grid-map>div:nth-child(' + (x+1) + ')>div:nth-child(' + (y+1) + ')').classList.add('active');
                }else{
                    voiceManager.keyUp(freq);
                    this.sendColorToDevice(x,y,'off');
                    document.querySelector('#grid-map>div:nth-child(' + (x+1) + ')>div:nth-child(' + (y+1) + ')').classList.remove('active');
                }
                
            }
            catch(e){
                console.log(e)
            }
        }
    },
    normalizeColors: {
        value: function(){
            for(var x = 0; x < this._map.length; x++){
                for(var y = 0; y < this._map[x].length; y++){
                    this.sendColorToDevice(x,y);
                }
            }
        }
    },
    sendColorToDevice: {
        value: function(x,y,state){
            var color = 127;
            switch(state){
                case 'on':
                    color = 48;
                    break;
                default:
                    var n = this._map[x][y]; //note in freq
                    var freq = this._notes[n[0]] * Math.pow(2,n[1]+parseInt(document.getElementById('octave').value));
                    if(freq % this._notes[this._root] != 0){ 
                        color = 83;
                    }else{
                        color: 113;
                    }
                    break;
            }
            var row = x * 16;
            var column = y;
            this._output.send( [ 144, row + column, color ] );
        }
    },
    buildGrid: {
        value: function(){
            document.querySelector('body').insertAdjacentHTML('beforeend',`
            <div id='grid-map'>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
             <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            <div>
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
            </div>
            </div>
            `);
            var rows = Array.prototype.slice.call( document.getElementById('grid-map').children );
            for(y = rows.length -1 ; y >= 0; y--){
                var cells = Array.prototype.slice.call( rows[y].children ); 
                for(x = 0 ; x < cells.length; x++ ){
                    var n = this._map[x][y];
                    var freq = this._notes[n[0]] * Math.pow(2,n[1]+parseInt(document.getElementById('octave').value));
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
        }
    }
});


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

domReady(function() {
    
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(
            function(midi){ //success
                console.log('Got midi!', midi);
                MidiDevices = midi;
                var inputs = MidiDevices.inputs.values();
                var outputs = MidiDevices.outputs.values();
                for (var input = inputs.next();
                     input && !input.done;
                     input = inputs.next()) {
                    // each time there is a midi message call the onMIDIMessage function
                    if(input.value.name.toLowerCase().includes('launchpad')){
                        console.log(input.value.name);
                        var midiController = new LaunchPad();
                        midiController.input = input.value;
                        //map the colors back!
                        for (var output = outputs.next();
                             output && !output.done;
                             output = outputs.next()) {
                            if(output.value.name.toLowerCase().includes('launchpad')){
                                console.log(output.value.name);
                                midiController.output = output.value;
                                midiController.normalizeColors();
                            }
                        }
                    }
                }
            },
            function(){ //failure
                console.log('could not get midi devices');
            }
        );
    }

    var updateVcoControls = function(){
        var mix = { square: document.querySelector('#vco-square-mix').value, saw: document.querySelector('#vco-saw-mix').value, sine: document.querySelector('#vco-sine-mix').value };
        voiceManager.getVoices().forEach(function(e){
            e.vcoMixParams = mix;   
        });
    };
    updateVcoControls();
    document.querySelectorAll('#vco-controls input').forEach(function(e){
        e.oninput = updateVcoControls;
    });  
    
    var updateFilter = function(){
        var v = { c: document.querySelector('#filter-cutoff').value, r: document.querySelector('#filter-resonance').value, t: document.querySelector('#filter-type').value, kbdTrack: document.querySelector('#filter-track').checked };
        voiceManager.getVoices().forEach(function(e){
            e.filterParams = v;   
        });
    };
    updateFilter();    
    document.querySelectorAll('#filter-controls input, #filter-controls select').forEach(function(e){
        e.oninput = updateFilter;
        e.onchange = updateFilter;
    });   
    
    var updateVcaEnv = function(){
        var v = { a: document.querySelector('#vca-attack').value, s: document.querySelector('#vca-sustain').value, r: document.querySelector('#vca-release').value };
        voiceManager.getVoices().forEach(function(e){
            e.vcaEnvParams = v;   
        });
    };
    updateVcaEnv();
    document.querySelectorAll('#vca-env-controls input').forEach(function(e){
        e.oninput = updateVcaEnv;
    });
    
    var updateFilterEnv = function(){
        var v = { a: document.querySelector('#filter-attack').value, s: document.querySelector('#filter-sustain').value, r: document.querySelector('#filter-release').value };
        voiceManager.getVoices().forEach(function(e){
            e.filterEnvParams = v;   
        });
    };
    updateFilterEnv();
    document.querySelectorAll('#filter-env-controls input').forEach(function(e){
        e.oninput = updateFilterEnv;
    });
    
    var updateDelay = function(){
        var v = { feedback: document.querySelector('#delay-feedback').value, time: document.querySelector('#delay-time').value };
        voiceManager.getVoices().forEach(function(e){
            delay.params = v;   
        });
    }
    updateDelay();
    document.querySelectorAll('#delay-controls input').forEach(function(e){
        e.oninput = updateDelay;
    });
    /*
    var BPM = 120;
    var seq = [
        notes['A'] * Math.pow(2,3),
        notes['C'] * Math.pow(2,3),
        notes['D'] * Math.pow(2,3),
        notes['G'] * Math.pow(2,3)
    ];
    var i = 0;
    setInterval(function(){
        voiceManager.keyDown(seq[i]);
        voiceManager.keyUp(seq[i]);
        i++;
        if(i == seq.length){
            i = 0;
        }
    }, 60000 / BPM ); */

});
