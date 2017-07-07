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
            var freq = 440 * Math.pow(2, (message.data[1] - 69) / 12);
            switch(message.data[0]){
                case 144:
                    voiceManager.keyDown(freq);
                    break;
                case 128:
                    voiceManager.keyUp(freq);
                    break;
            }

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
