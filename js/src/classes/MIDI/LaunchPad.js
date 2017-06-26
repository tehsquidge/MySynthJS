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
