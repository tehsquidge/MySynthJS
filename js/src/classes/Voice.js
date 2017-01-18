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
            
        },
        set: function(p){
            this._filter.frequency.base = parseFloat(p.c);
            this._filter.Q.value = parseFloat(p.r);
            this._filter.type = p.t;
        }
    }
});
