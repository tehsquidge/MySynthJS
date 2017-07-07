function Kick(output){
    this._osc = audioCtx.createOscillator();
    this._osc.type = 'sine';
    this._osc.frequency.value = 0;
    this._osc.start();
    
    this._pitchEnv = new AsrEG();
    this._pitchEnv.attack = 0;
    this._pitchEnv.sustain = 0;
    this._pitchEnv.release = 0.1; //this
    this._pitchEnv.connect(this._osc.frequency);
    
    this._vca = audioCtx.createGain();
    this._vca.gain.value = 0;
            
    this._vcaEnv = new AsrEG();
    this._vcaEnv.attack = 0;
    this._vcaEnv.sustain = 0.9;
    this._vcaEnv.release = 0.2;
    this._vcaEnv.connect(this._vca.gain);
    
    
    this._osc.connect(this._vca);
    
    this._vca.connect(output);
    
    this._pitch = 440;
    
}

Kick.prototype = Object.create(null, {
    constructor: {
        value: Kick
    },
    pitch: {
        get: function(){
            return this._pitch;
        },
        set: function(newFreq){
            this._pitch = newFreq;
        }
    },
    gateOn: {
        value: function(){
            this._vcaEnv.gateOn();
            this._pitchEnv.gateOn(this._pitch);
        }
    },
    gateOff: {
        value: function(){
            this._vcaEnv.gateOff();
            this._pitchEnv.gateOff();
        }
    },
    trigger: {
        value: function(){
            this.gateOn();
            this.gateOff();
        }
    }
});
