/*:
 * ------------------------------------------------------------------------------
 * @plugindesc v1.00 - Decode text from how much the player knows.
 * @author Metaphoric Moose
 * @version 1.0
 * @url https://github.com/MetaphoricalMoose
 *
 * @param Source variable
 * @desc Where the text to decode will be stored
 * Set this variable before calling the command.
 * @default 1
 * @type variable
 *
 * @param Decode Rate
 * @desc Will represent how much was decode
 * @default 3
 * @type variable
 *
 * @param Output line length
 * @desc Number of character per line in the decoded message
 * @default 50
 * @type number
 *
 * @param Coded text color
 * @desc Text not decoded will be using this color
 * @default 5
 * @type number
 *
 * @param Decoded text color
 * @desc Text decoded will be using this color
 * @default 0
 * @type number
 *
 * @param Decoded Message Position
 * @desc Position of message containing the decode
 * @default Middle
 * @type select
 * @option Top
 * @option Middle
 * @option Bottom
 *
 * @param Decoded Message Background
 * @desc Background of message containing the decode
 * @default Transparent
 * @type select
 * @option Opaque
 * @option Transparent
 * @option Invisible
 *
 * @param Additional non-decode characters
 * @desc Character that shouldn't be translate (already included: (space) , . ; ? ! '), as comma-separated list
 * @type text
 *
 * ------------------------------------------------------------------------------
 * @help
 * This plugin allows to use an alphabetical permutation code in your project.
 * It is heavily inspired by the Al Bhed language/cipher from Final Fantasy X.
 *
 * How to use:
 * 
 * 1. Set up the coded message in the variable you configured as Source variable
 * in the plugin's configuration. This is easily done with a script call:
 * 
 * $gameVariables.setValue(1, "Dra xielg pnufh vuq zisbc ujan dra mywo tuk.");
 *
 * Assuming you want to use variable #1 as source.
 * 
 * 2. Call the plugin command 'MooseDecode'. It will read what you wrote in the
 * Source Variable and decode it according to what the player has discovered of
 * the code so far. The decoded message will be displayed by the command.
 *
 * To teach a letter permutation to the player, refer to the command "MooseLearn"
 *
 * 3. The plugin provides a decoding rate after every decode task that is
 * available for you to use, should you need it. It will be stored in the
 * variable you configured as Decode Rate.
 * It will represent how many iteration of each letter was decoded, not how
 * many unique letters were.
 * For example, let's take the phrase "The cat cast a spell", assuming its code
 * is: "Dra lyd lycd y cbamm", and the player only knows (coded) Y = A.
 * 3 letters in 20 were decoded, thus giving a rate of 15%, and NOT 1 in 26 for
 * a rate of 3.8%
 * 
 * ------------------------------------------------------------------------------
 *  Plugin Commands
 * ------------------------------------------------------------------------------
 *
 * ---------------
 *  MooseDecode
 * ---------------
 * After you have stored the text to decode, run this command to decode it.
 * The full or partial decode will be displayed according to the configuration
 * you defined in the Decoded Message Position and Decoded Message Background
 * configuration items.
 * 
 * During the display process, the command will take into consideration a
 * maximum number of character per line (not counting the \c[x] for colors).
 * The default value is 50, but if it doesn't fit your font / font-size and
 * what not, you can change it with the Output line length configuration item.
 * 
 * Some characters (mostly punctuation) are ignored when decoding or when
 * computing the decoding rate. Already included in the plugin are:
 *
 * (space) , . ; ? ! '
 * 
 * If you need to add more, the Additional non-decode characters configuration
 * item exists for this purpose.
 * 
 * This command doesn't accept any argument.
 *
 * ---------------
 *  MooseLearn CodedLetter DecodedLetter
 * ---------------
 * This command can be used to teach the player a permutation. To teach the
 * player that a coded Y is a decoded B, the command would be:
 *
 * MooseLearn Y A
 * 
 * You can use it from a common even bound to an object, or directly from a map
 * event page. Availabel wherever plugin commands can be called.
 * 
 * ------------------------------------------------------------------------------
 * Limits
 * ------------------------------------------------------------------------------
 *
 * 1. One coded letter will equal one decoded letter. There is no "TH" = "Ð".
 * 2. This plug-in doesn't support multiple code systems.
 * 3. This plug-in doesn't support adding a face image alongside the decoded
 * message.
 * 
 * ------------------------------------------------------------------------------
 * Terms of Use
 * ------------------------------------------------------------------------------
 * - Free for use in non-commercial projects with credits
 * - Do not use in commercial projects
 * - Please credit MetaphoricalMoose if you use it :)
 */

var Imported = Imported || {};
Imported['Moose_Decode'] = "1.0";

var MooseDecode = MooseDecode || {};
MooseDecode.parameters = {};

(function() {
	const MODE_CODE = 'code';
	const MODE_DECODE = 'decode';

	const LETTER_KNOWN_IN_KNOWN_CONTEXT = 0b11;
	const LETTER_KNOWN_IN_UNKNOWN_CONTEXT = 0b10;
	const LETTER_UNKNOWN_IN_KNOWN_CONTEXT = 0b01;
	const LETTER_UNKNOWN_IN_UNKNOWN_CONTEXT = 0b00;

	const NO_DECODING = [' ', ',', '.', ';', '?', '!', '\'' ];

    const parameters = PluginManager.parameters('Moose_Decode');

    MooseDecode.parameters['source'] = parameters['Source variable'];
    MooseDecode.parameters['output_char_per_line'] = parameters['Output line length'];
    MooseDecode.parameters['rate'] = parameters['Decode Rate'];
    MooseDecode.parameters['coded_color'] = parameters['Coded text color'];
    MooseDecode.parameters['decoded_color'] = parameters['Decoded text color'];
    MooseDecode.parameters['decoded_msg_position'] = getPositionValue(parameters['Decoded Message Position']);
    MooseDecode.parameters['decoded_msg_background'] = getBackgroundValue(parameters['Decoded Message Background']);
    MooseDecode.parameters['other_non_decode'] = parameters['Additional non-decode characters'].split(',').map(c => c.trim());

    let dictionnary = {};

    // Persistance
    let _mooseDecode_DataManager_makeSaveContents = DataManager.makeSaveContents;
    let _mooseDecode_DataManager_extractSaveContents = DataManager.extractSaveContents;

    DataManager.makeSaveContents = function() {
    	let contents = _mooseDecode_DataManager_makeSaveContents.call(this);
    	contents.dictionnary = dictionnary;

    	return contents;
    };

    DataManager.extractSaveContents = function(contents) {
		_mooseDecode_DataManager_extractSaveContents.call(this, contents);
		dictionnary = contents.dictionnary;
	};

 	// Plugin commands
    let old_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        old_Game_Interpreter_pluginCommand.call(this, command, args);

        if(command.toLowerCase() === 'moosedecode') {
			decode();
        }
        
        if(command.toLowerCase() === 'mooselearn') {
			let codedLetter = args[0];
			let decodedLetter = args[1];

			learn(codedLetter, decodedLetter);
        }
    }

    // Logic
    learn = function(codedLetter, decodedLetter) {
    	dictionnary[codedLetter] = decodedLetter;
    }

    function wouldExceedLineLength(currentLength, nextWordLength) {
    	return (currentLength + nextWordLength) > MooseDecode.parameters['output_char_per_line'];
    }

    decode = function(codeName) {
    	let source = $gameVariables.value(MooseDecode.parameters['source']);
    	let sourceSplit = source.split('');

    	let wordSplit = source.split(' ');

    	let lines = [];
    	let currentLine = 0;
    	lines[currentLine] = '';

    	for(word of wordSplit) {
    		if (wouldExceedLineLength(lines[currentLine].length, word.length)) {
    			lines[++currentLine] = word;
    		} else {
    			lines[currentLine] += ` ${word}`;
    		}
    	}

    	lines = lines.map(l => l.trim());

    	let decodedLines = [];
    	let initialCharacterCount = 0;
    	let decodedCharacterCount = 0;

    	for(line of lines) {
    		let { lineCharacterCount, lineDecodedCharacterCount, decodedLine } = decodeLine(line);
    		decodedLines.push(decodedLine);
    		initialCharacterCount += lineCharacterCount;
    		decodedCharacterCount += lineDecodedCharacterCount;
    	}

    	let decodeRate = Math.round((decodedCharacterCount/initialCharacterCount)*100);

    	$gameVariables.setValue(MooseDecode.parameters['rate'], decodeRate);

    	let decodedMessage = decodedLines.join('\n');

    	$gameMessage.setBackground(MooseDecode.parameters['decoded_msg_background']);
		$gameMessage.setPositionType(MooseDecode.parameters['decoded_msg_position']);
		$gameMessage.add(decodedMessage);
    }

    function decodeLine(line) {
    	let sourceSplit = line.split('');

    	let outputBuffer = ''; // Add characters here
		let currentContext;

		let charactersEligibleToDecode = 0;
		let charactersDecoded = 0;

		let charactersOnLine = 0;

		for(letter of sourceSplit) {
			let letterToAdd = getNextLetter(letter, currentContext);

			outputBuffer += getNextLetter(letter, currentContext);

			// Update the context only if current character isn't a punctuation sign or user-defined non-decode
			if (isCharacterDecodable(letter)) {
				let playerKnowsLetter = letterIsKnown(letter);
				currentContext = playerKnowsLetter ? MODE_DECODE : MODE_CODE;

				++charactersEligibleToDecode;
				if (playerKnowsLetter) {
					++charactersDecoded;
				}
			}
		}		

		return {
			lineCharacterCount: charactersEligibleToDecode,
			lineDecodedCharacterCount: charactersDecoded,
			decodedLine: outputBuffer
		}
    }

    function isCharacterDecodable(character) {
    	return !NO_DECODING.contains(letter) && !MooseDecode.parameters['other_non_decode'].contains(letter);
    }


	function getNextLetter(letter, currentContext) {
		// Punctuation isn't coded
		if (!isCharacterDecodable(letter)) {
			return letter;
		}

		// If not punctuation
		let currentCase = evaluateCase(letter, currentContext);

		switch(currentCase) {
			case LETTER_KNOWN_IN_KNOWN_CONTEXT:
				// No need to change coloring here
				return dictionnary[letter];
			case LETTER_KNOWN_IN_UNKNOWN_CONTEXT:
				return `\\c[${MooseDecode.parameters['decoded_color']}]${dictionnary[letter]}`;
			case LETTER_UNKNOWN_IN_KNOWN_CONTEXT:
				return `\\c[${MooseDecode.parameters['coded_color']}]${letter}`;
			case LETTER_UNKNOWN_IN_UNKNOWN_CONTEXT:
				// No need to change coloring here
				return letter;
		}
	}

	function evaluateCase(letter, currentContext) {
		let letterIsKnown = Object.keys(dictionnary)
			.contains(letter);

		if (letterIsKnown && currentContext === MODE_DECODE) return LETTER_KNOWN_IN_KNOWN_CONTEXT;
		if (letterIsKnown && currentContext === MODE_CODE) return LETTER_KNOWN_IN_UNKNOWN_CONTEXT;
		if (!letterIsKnown && currentContext === MODE_DECODE) return LETTER_UNKNOWN_IN_KNOWN_CONTEXT;
		if (!letterIsKnown && currentContext === MODE_CODE) return LETTER_UNKNOWN_IN_UNKNOWN_CONTEXT;

		// Passed this point, it we're on the 1st character in the message, so we'll add the coloring.
		if (letterIsKnown) {
			return LETTER_KNOWN_IN_UNKNOWN_CONTEXT;
		} else {
			return LETTER_UNKNOWN_IN_KNOWN_CONTEXT;
		}
	}

	function letterIsKnown(letter) {
		return Object.keys(dictionnary).contains(letter);
	}

	function getPositionValue(userValue) {
		switch(userValue) {
			case 'Top': return 0;
			case 'Middle': return 1;
			case 'Bottom': return 2;
		}
	}

	function getBackgroundValue(userValue) {
		switch(userValue) {
			case 'Opaque': return 0;
			case 'Transparent': return 1;
			case 'Invisible': return 2;
		}
	}
})();
