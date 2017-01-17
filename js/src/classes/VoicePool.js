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
