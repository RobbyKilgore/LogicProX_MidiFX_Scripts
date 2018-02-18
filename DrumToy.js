//-----------------------------------------------------------------------------
// MidiBot ===================  18-FEB-2018
//
//		A Logic/MainStage MIDI FX 'Scripter' hack
//		robbykilgore.com
//		midirotator@gmail.com
//
//
//
//		PATTERN_LENGTH:		The number of steps in the sequence (see code)
//		NUMBER_OF_VOICES:	Number of concurrent MidiBot voices (see code)
//		SUBDIVISIONS:		The number of subdivisions
//							Defaults to "16th" (Indexed toe divisionBeats array)
//
//		THE PARAMETERS
//		---------------------------------------------------------------
//		Midi Note: The Root
//		Modality: Scale or Mode
//		Note Range: The number of notes to choose from
//		Play Every: The bot will play a note every ## SUBDIVISIONSs
//		Velocity: Applies to "Play Every" notes
//		Offset: The number of SUBDIVISIONSs to offset the "Play Every" notes
//		Fill Probability: The chance that a note will be inserted on "Non Play Every" steps
//		Fill Velocity: The velocity of the fill notes
//
//		PLAY: Activate MidiBot.
//		STOP: All notes off. Resets counters.
//		
//-----------------------------------------------------------------------------

// USER CAN ADJUST THESE VALUES
var PATTERN_LENGTH = 16;
var NUMBER_OF_VOICES = 1;

// RYTHMIC INITIALIZATION
var divisionBeats = [
        .166, .25, .375,  // 1/16t, 1/16, 1/16d
        .333, .5, .75,    // 1/8t, 1/8, 1/8d
        .666, 1, 1.5,     // 1/4t, 1/4, 1/4d
        1.333, 2, 3       // 1/2t, 1/2, 1/2d
    ];
var SUBDIVISIONS = divisionBeats[1]; // Change the basic subdivision. Indexed from devisionBeats array (above)

// INITS
ResetParameterDefaults = true;
var PluginParameters = [];
var NeedsTimingInfo = true;
var MIDI_NOTE = [];
var MODALITY = [];
var NOTE_RANGE = [];
var PLAY_EVERY = [];
var ROOT_PROBABILITY = [];
var VELOCITY = [];
var OFFSET = [];
var FILL_PROBABILITY = [];
var FILL_VELOCITY = [];

// HARMONIC INITIALIZATION
var ROOT_NOTES = ["C-2", "C#-2", "D-2", "D#-2", "E-2", "F-2", "F#-2", "G-2", "G#-2", "A-2", "A#-2", "B-2",
					"C-1", "C#-1", "D-1", "D#-1", "E-1", "F-1", "F#-1", "G-1", "G#-1", "A-1", "A#-1", "B-1",   
					"C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0", 
					"C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1", 
					"C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2", 
					"C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", 
					"C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
					"C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
					"C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
					"C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "A#7", "B7",
					"C8", "C#8", "D8", "D#8", "E8", "F8", "F#8", "G8" ];
var MODE_LIST = ["Ionian","Dorian","Phrygian","Lydian","Mixolydian","Aolian","Locrian","Pentatonic Minor","Pentatonic Major"]
var modalSteps = [2,2,1,2,2,2,1];
var pentaSteps = [3,2,3,2,2];

// MISC INITS
var stepPlayed = false;
var nextBeat = 1;
var count = 0;


// ---- MIDI PROCESS LOOP ---- //
function ProcessMIDI() {

    var musicInfo = GetTimingInfo();    

	  if (musicInfo.playing) {

	  		// LOOP LENGTH
	  		if (count > PATTERN_LENGTH - 1) {
	  			count = 0;
	  		} 
	  
			// For each step in the sequence
			if (!stepPlayed){
				
				// THINGS HAPPEN HERE
				for (var i = 0; i < NUMBER_OF_VOICES; i++) {

					if ((count + OFFSET[i]) % PLAY_EVERY[i] == 0){

						playNote(MIDI_NOTE[i], VELOCITY[i], ROOT_PROBABILITY[i], 100, NOTE_RANGE[i], MODALITY[i]);			

					}else{

						playNote(MIDI_NOTE[i], FILL_VELOCITY[i], ROOT_PROBABILITY[i], FILL_PROBABILITY[i], NOTE_RANGE[i], MODALITY[i]);

					}

				}

				// Advance to the next step
				nextBeat = (nextBeat + SUBDIVISIONS);
				count += 1;
				stepPlayed = true;

			}

			// Holding for next sequence event
			if (nextBeat >= musicInfo.blockStartBeat && nextBeat < musicInfo.blockEndBeat){

				stepPlayed = false;

			}

		}else{

			// STOPPED - reset midi and counters
			MIDI.allNotesOff();
			nextBeat = 1;
			count = 0;

		}
}


function playNote(note,vel,Rprob,Fprob,range,modality){

	var rnd = Math.floor(Math.random() * 100);
	var notes = buildScale(note,range,modality);
	var rndNoteIndex = Math.floor(Math.random() * notes.length);
	var rndRoot = Math.floor(Math.random() * 100);
	var rndFill = Math.floor(Math.random() * 100);

	if (Rprob > rndRoot){

		_note = note;

	}else{

		_note = notes[rndNoteIndex];

	}

	if (Fprob > rnd){

		var noteOn = new NoteOn();
		noteOn.pitch = _note;
		noteOn.velocity = vel;
		noteOn.send();				
		var noteOff = new NoteOff(noteOn);
		noteOff.sendAtBeat(nextBeat + SUBDIVISIONS/1.25);

	}
}


function ParameterChanged(param, value) {

  	// Which voice index is it?
	var voiceIndex = parseInt((param % 10 == 0) ? param / 10 : (param - 1) / 10);

	switch (param % 10) {

  		case 1:
  			MIDI_NOTE[voiceIndex] = value;
  			break;

  		case 2:
  			MODALITY[voiceIndex] = value;
  			break;

  		case 3:
  			NOTE_RANGE[voiceIndex] = value;
  			break;

  		case 4:
  			PLAY_EVERY[voiceIndex] = value;
  			break;

  		case 5:
  			ROOT_PROBABILITY[voiceIndex] = value;
  			break;

   		case 6:
  			VELOCITY[voiceIndex] = value;
  			break;

  		case 7:
  	  		OFFSET[voiceIndex] = value;
			break;

  		case 8:
  			FILL_PROBABILITY[voiceIndex] = value;
  			break;

  		case 9:
  			FILL_VELOCITY[voiceIndex] = value;
  			break;

 		default:
    		break;
	}
}


// BUILD PARAMETER CONTROLS
for (var i = 0; i < NUMBER_OF_VOICES; i++) {

	var voiceNumber = i + 1;

	PluginParameters.push({name:"===== MIDIBOT #" + (i+1) + " =====", type:"text"});
			
	PluginParameters.push({name:"Midi Note", type:"menu", 
		valueStrings:ROOT_NOTES, defaultValue:60});
	
	PluginParameters.push({name:"Modality", type:"menu", 
		valueStrings:MODE_LIST, defaultValue:0});

	PluginParameters.push({name:"Note Range", type:"linear",
		minValue:1, maxValue:24, 
		numberOfSteps:23, defaultValue:7});

	PluginParameters.push({name:"Play Every", type:"linear",
		minValue:1, maxValue:32, 
		numberOfSteps:31, defaultValue:4});
		
	PluginParameters.push({name:"Root Probability", type:"%",
		minValue:0, maxValue:100, 
		numberOfSteps:100, defaultValue:33});
		
	PluginParameters.push({name:"Velocity", type:"linear",
		minValue:0, maxValue:127, 
		numberOfSteps:127, defaultValue:127});
		
	PluginParameters.push({name:"Offset", type:"linear",
		minValue:0, maxValue:16, 
		numberOfSteps:16, defaultValue:0});

	PluginParameters.push({name:"Fill Probability", type:"%",
		minValue:0, maxValue:100, 
		numberOfSteps:100, defaultValue:33});
		
	PluginParameters.push({name:"Fill Velocity", type:"linear",
		minValue:0, maxValue:127, 
		numberOfSteps:127, defaultValue:100});

}

// Build scale for available notes
function buildScale(root,range,modality){

	var maxCount = range + modality;
	var first = true;
	var availableNotes = [];

	for (i=modality;i<maxCount;i++){

		if (first == true){

			availableNotes.push(root);
			first = false;

    	}else{

        	if (modality<7){

            	availableNotes.push(availableNotes[(i-modality)-1] + modalSteps[(i-1)%7]);

        	}else{

            	availableNotes.push(availableNotes[(i-modality)-1] + pentaSteps[(i-1)%5]);

        	}  
    	}    
	}
	return availableNotes;
}
