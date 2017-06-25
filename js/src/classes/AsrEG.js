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
                base = (base < 0) ? 0 : base;
                console.log('base: ' + base);
                console.log('sustain: ' + this._sustainLevel);
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
