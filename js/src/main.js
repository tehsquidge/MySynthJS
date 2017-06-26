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
