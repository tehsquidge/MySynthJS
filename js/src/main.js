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
    document.querySelectorAll('#vca-env input').forEach(function(e){
        e.oninput = function(){
            var v = { a: document.querySelector('#vca-attack').value, s: document.querySelector('#vca-sustain').value, r: document.querySelector('#vca-release').value };
            voiceManager.getVoices().forEach(function(e){
                e.vcaEnvParams = v;   
            });
        }
    });
    document.querySelectorAll('#filter-env input').forEach(function(e){
        e.oninput = function(){
            var v = { a: document.querySelector('#filter-attack').value, s: document.querySelector('#filter-sustain').value, r: document.querySelector('#filter-release').value };
            voiceManager.getVoices().forEach(function(e){
                e.filterEnvParams = v;   
            });
        }
    });
});

document.querySelectorAll('a').forEach(function(a){
   a.classList.toggle('active'); 
});
