//-----------------------------------------------------------------------------
// 	MidiBot ===================  24-FEB-2018
//		Build: 1.06
//
//		A Logic/MainStage MIDI FX 'Scripter' hack
//		robbykilgore.com
//		midirotator@gmail.com
//		
//		NUMBER_OF_VOICES:	Number of concurrent MidiBot voices (Default=1)
//
//		THE GLOBAL PARAMETERS
//		---------------------------------------------------------------
//		Sequence Length:		The number of steps in the sequence
//		Clock Divisions:		The number of subdivisions
//		Swing:							The amount of swing applied
//		Midi Input:				Enables/Disables midi note input to the Root parameter
//
//		VOICE PARAMETERS
//		---------------------------------------------------------------
//		Root: The Root
//		Modality: Scale or Mode
//		Note Range: The number of notes to choose from the Modality
//		Play Every: Plays a note every X number of Clock Divisions
//		Offset: The number of Clock Divisions to offset the "Play Every" notes
//		Root Probability: Applies to "Play Every" notes
//		Root Velocity: Applies to "Play Every" notes
//		Fill Probability: The chance that a note will be inserted on non "Play Every" steps
//		Fill Velocity: The velocity of the fill notes
//
//		PLAY: Activate MidiBot.
//		STOP: All notes off. Resets counters.
//		
//-----------------------------------------------------------------------------

// USER CAN ADJUST THESE VALUES
var NUMBER_OF_VOICES = 1; // 1, 2, or 3 voices work ok


// RYTHMIC INITIALIZATION
var divisionLabels = [
				"1/16t", "1/16", "1/16d",
				"1/8t", "1/8", "1/8d",
				"1/2t", "1/2", "1/2d"
		];	
var divisionBeats = [
		.166, .25, .375,  // 1/16t, 1/16, 1/16d
		.333, .5, .75,    // 1/8t, 1/8, 1/8d
		.666, 1, 1.5,     // 1/4t, 1/4, 1/4d
		1.333, 2, 3       // 1/2t, 1/2, 1/2d
	];
var SUBDIVISIONS = divisionBeats[1]; // Change the basic subdivision. Indexed from devisionBeats array (above)
var swingDistance = 0;
var SWING_PERCENT = 0;
var SWING = 0;

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
var PATTERN_LENGTH = 16;


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

var modalSteps = [2,2,1,2,2,2,1];
var pentaSteps = [3,2,3,2,2];
var chromatic = [1,1,1,1,1,1,1,1,1,1,1,1];
var minorMajor = [2,2,1,2,1,2,2];
var fifths = [7,5];
var MODE_LIST = ["Ionian","Dorian","Phrygian","Lydian","Mixolydian","Aolian","Locrian",
				"Pentatonic Minor","Pentatonic Major",
				"Chromatic","Harmonic Minor","Dorian b9","Lydian #5", "Lydian Dominant", "Mixolydian b13", "Aolian b5","Augmented", "Fifths"]


// MISC INITS
var stepPlayed = false;
var nextBeat = 1;
var count = 1000;


// RESET
function Reset() {
	ResetParameterDefaults = true;
}


// HANDLE MIDI INPUT
function HandleMIDI(event){

	// If Midi Input is enabled, update parameter
	if (GetParameter("Midi Input") == 1) {

		SetParameter(5, event.pitch); // Midi Note slider

	}
	
} 


// PROCESS MIDI - MAIN LOOP
function ProcessMIDI() {

	var musicInfo = GetTimingInfo();    

	  if (musicInfo.playing) {

			// LOOP LENGTH
			if (count > PATTERN_LENGTH - 1) {
				if (count==1000){
					nextBeat = musicInfo.blockStartBeat;
				}
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
				if(count%2){

					// Unswung Beats
					nextBeat = (nextBeat + SUBDIVISIONS - SWING);

				}else{

					// Swung beats
					nextBeat = (nextBeat + SUBDIVISIONS + SWING);

				}

				count += 1;
				stepPlayed = true;

			}

			// Holding for next sequence event
			var lookAhead = nextBeat + SUBDIVISIONS - SWING;
			if (musicInfo.cycling){
				cycleBeats = musicInfo.rightCycleBeat - musicInfo.leftCycleBeat;
			}
			if (nextBeat < musicInfo.blockEndBeat){
				if (musicInfo.cycling & lookAhead > musicInfo.rightCycleBeat) {
					nextBeat -= cycleBeats;
				}
				stepPlayed = false;
			}

		}else{
			// STOPPED - reset midi and counters
			MIDI.allNotesOff();
			nextBeat = 1;
			count = 1000;
		}
}


// CALCULATE AND PLAY THE RIGHT NOTES
function playNote(note,vel,Rprob,Fprob,range,modality){

	var notes = buildScale(note,range,modality);
	var rnd = Math.floor(Math.random() * 100);
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
		noteOff.sendAtBeat(nextBeat + SUBDIVISIONS/2);

	}
}

// 
function ParameterChanged(param, value) {

	if (param>13 && param <=24){

		param = param + 4;

	}else if(param > 24){
	
		param = param + 8;
	
	}

	// which voice is it?
	var voiceIndex = parseInt((param % 14 == 0) ? param / 14 : (param - 1) / 14);

  switch (param % 14) {

		case 0:

			PATTERN_LENGTH = value;
			break;

		case 1:

			SUBDIVISIONS = divisionBeats[value];
			swingDistance = divisionBeats[value+1] - divisionBeats[value];
			break;

		case 2:

			SWING_PERCENT = value;
			SWING = -(swingDistance - (swingDistance * ((SWING_PERCENT/100)+1)));
			break;
			
		case 5:

			MIDI_NOTE[voiceIndex] = value;
			break;

		case 6:

			MODALITY[voiceIndex] = value;
			break;

		case 7:

			NOTE_RANGE[voiceIndex] = value;
			break;

		case 8:

			PLAY_EVERY[voiceIndex] = value;
			break;

		case 9:

			OFFSET[voiceIndex] = value;
			break;

		case 10:

			ROOT_PROBABILITY[voiceIndex] = value;
			break;

		case 11:

			VELOCITY[voiceIndex] = value;
			break;

		case 12:

			FILL_PROBABILITY[voiceIndex] = value;
			break;

		case 13:

			FILL_VELOCITY[voiceIndex] = value;
			break;

		default:

			break;

	}	
}


// BUILD GUI CONTROLS

// Global Controls
PluginParameters.push({name:"Sequence Length", type:"linear",
		minValue:1, maxValue:32, 
		numberOfSteps:31, defaultValue:16});

PluginParameters.push({name:"Clock Divisions", type:"menu", 
		valueStrings:divisionLabels, defaultValue:1});
		
PluginParameters.push({name:"Swing", type:"%",
		minValue:0, maxValue:100, 
		numberOfSteps:100, defaultValue:0});

PluginParameters.push({name:"Midi Input", type:"checkbox", 
		valueStrings: ["Disable","Enable"], defaultValue:1});


// Voice Controls
for (var i = 0; i < NUMBER_OF_VOICES; i++) {
	var voiceNumber = i + 1;
	PluginParameters.push({name:"    MIDIBOT 1.06         robby kilgore", type:"text"});
			
	PluginParameters.push({name:"Root", type:"menu", 
		valueStrings:ROOT_NOTES, defaultValue:60});
	
	PluginParameters.push({name:"Modality", type:"menu", 
		valueStrings:MODE_LIST, defaultValue:0});

	PluginParameters.push({name:"Note Range", type:"linear",
		minValue:1, maxValue:24, 
		numberOfSteps:23, defaultValue:1});

	PluginParameters.push({name:"Play Every", type:"linear",
		minValue:1, maxValue:32, 
		numberOfSteps:31, defaultValue:4});
		
	PluginParameters.push({name:"Offset", type:"linear",
		minValue:0, maxValue:16, 
		numberOfSteps:16, defaultValue:0});

	PluginParameters.push({name:"Root Probability", type:"%",
		minValue:0, maxValue:100, 
		numberOfSteps:100, defaultValue:0});
		
	PluginParameters.push({name:"Root Velocity", type:"linear",
		minValue:0, maxValue:127, 
		numberOfSteps:127, defaultValue:111});
		
	PluginParameters.push({name:"Fill Probability", type:"%",
		minValue:0, maxValue:100, 
		numberOfSteps:100, defaultValue:0});
		
	PluginParameters.push({name:"Fill Velocity", type:"linear",
		minValue:0, maxValue:127, 
		numberOfSteps:127, defaultValue:75});

}

// CREATE HARMONIC CONTENT
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

			}else if(modality >= 7 && modality < 9) {

				availableNotes.push(availableNotes[(i-modality)-1] + pentaSteps[(i-1)%5]);

			}else if(modality == 9) {

				availableNotes.push(availableNotes[(i-modality)-1] + chromatic[(i-1)%12]);

			}else if(modality >= 10 && modality < 17) {

				availableNotes.push(availableNotes[(i-modality)-1] + minorMajor[(i-1)%7]);

			}else if(modality == 17) {

				availableNotes.push(availableNotes[(i-modality)-1] + fifths[(i-1)%2]);

			}  
		}    
	}
	return availableNotes;
}