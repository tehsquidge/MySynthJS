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
