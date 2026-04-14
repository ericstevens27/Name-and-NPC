/**
 * LINGUISTIC GENERATOR ENGINE (generator.js)
 * ------------------------------------------
 * This script contains the pure logic for assembling character strings.
 * It uses Object-Oriented Programming (OOP) to define a Class.
 * A Class is like a blueprint that builds "LinguisticGenerator" objects, allowing 
 * us to keep all its internal variables (like the 'history' Set) isolated from the rest 
 * of the application.
 */
class LinguisticGenerator {
    
    /**
     * The 'constructor' runs exactly once when you create `new LinguisticGenerator()`.
     * It sets up the default variables this specific generator will need.
     * We use `this.` to attach variables specifically to the generator instance.
     */
    constructor() {
        // A Set is used to store names. Unlike an Array, a Set mathematically guarantees 
        // that all values inside it are unique, preventing duplicate name generation!
        this.history = new Set();
        
        // This splits the string into an Array of characters: ['a', 'e', 'i', 'o', 'u', 'y']
        this.vowels = 'aeiouy'.split('');
        
        // Dictionaries (Objects) that map characters to specific shifting combinations.
        this.hardToSoft = { 'k': 's', 'K': 'S', 'g': 'j', 'G': 'J', 'q': 'c', 'Q': 'C' };
        this.softToHard = { 'c': 'k', 'C': 'K', 's': 't', 'S': 'T', 'z': 'd', 'Z': 'D' };
        this.consonantGroups = { 'th': 't', 'ph': 'f', 'sh': 's', 'ch': 'k', 'gh': 'f' };
    }

    /**
     * Utility method: Picks a random item from a given Array.
     * Math.random() generates a decimal between 0 and 1.
     * We multiply it by the length of the array, and use Math.floor to round DOWN to an integer.
     */
    getRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    /**
     * Core Algorithm: Phonetic Shifting
     * This takes a standard English name from our dictionary and strategically modifies
     * consonants/vowels based on probability to make it sound "alien" or "fantasy".
     */
    baseShift(text, shiftProb) {
        if (!text) return text; // If empty string, do nothing (failsafe)
        
        // If the random roll is higher than our GUI slider probability, we skip shifting!
        if (Math.random() > shiftProb) return text;

        let tempText = text;
        
        // Object.entries loops through our dictionary, pulling out pairs like ['th', 't']
        for (const [group, single] of Object.entries(this.consonantGroups)) {
            // .toLowerCase() normalizes the string so we don't have to check both 'Th' and 'th'
            if (tempText.toLowerCase().includes(group) && Math.random() < 0.8) {
                // RegExp (Regular Expression) with the 'g' flag means "Global Replace"
                // It finds every instance of 'th' and replaces it with 't'.
                tempText = tempText.replace(new RegExp(group, 'g'), single);
                
                // We do it again for the capitalized version explicitly handling 'Th' -> 'T'
                tempText = tempText.replace(new RegExp(group.charAt(0).toUpperCase() + group.slice(1), 'g'), single.toUpperCase());
            }
        }

        // Split the string into a temporary array of standalone characters so we can loop over them easily
        let chars = tempText.split('');
        for (let i = 0; i < chars.length; i++) {
            let roll = Math.random();
            let lowerChar = chars[i].toLowerCase();
            
            // Logically shift Vowels (50% chance if it IS a vowel)
            if (this.vowels.includes(lowerChar) && roll < 0.5) {
                let newV = this.getRandom(this.vowels);
                // Ternary syntax (Condition ? TrueCase : FalseCase) to preserve original capitalization
                chars[i] = chars[i] === chars[i].toUpperCase() ? newV.toUpperCase() : newV;
            } 
            // Shift Hard Consonants to Soft
            else if (this.hardToSoft[chars[i]] && roll < 0.5) {
                chars[i] = this.hardToSoft[chars[i]];
            } 
            // Shift Soft Consonants to Hard
            else if (this.softToHard[chars[i]] && roll < 0.5) {
                chars[i] = this.softToHard[chars[i]];
            }
        }

        // 50% chance to insert one completely random extra character somewhere in the word
        if (Math.random() < 0.5) {
            let idx = Math.floor(Math.random() * chars.length);
            let extraChar = this.getRandom('abcdefghijklmnopqrstuvwxyz'.split(''));
            chars.splice(idx, 0, extraChar); // .splice injects into the array at 'idx' index
        }

        return chars.join(''); // Put the array back together into a single string
    }

    /**
     * Real-World Language Mutators
     * Applies specific linguistic quirks to mimic real-world linguistic aesthetics.
     */
    applyLanguageStyle(firstName, lastName, prefix, suffix, language) {
        let f = firstName;
        let l = lastName;
        let p = prefix;
        let s = suffix;

        // A Switch block acts like a giant, super-clean If/Else chain checking the language string
        switch(language) {
            case 'welsh':
                f = f.replace(/l/g, 'll').replace(/L/g, 'Ll').replace(/f/g, 'ff').replace(/v/g, 'f');
                l = l.replace(/l/g, 'll').replace(/L/g, 'Ll').replace(/f/g, 'ff').replace(/v/g, 'f');
                if (Math.random() < 0.5 && !s) s = '-ap-' + l.substring(0, 3);
                break;
            case 'scottish':
                if (Math.random() < 0.7) {
                    p = Math.random() < 0.5 ? 'Mac' : 'Mc';
                }
                break;
            case 'nordic':
                f = f.replace(/o/g, 'ö').replace(/a/g, 'å').replace(/O/g, 'Ö').replace(/A/g, 'Å');
                l = l.replace(/o/g, 'ø').replace(/a/g, 'ä').replace(/O/g, 'Ø').replace(/A/g, 'Ä');
                // The '!' operator means "Not". Only add a suffix if the last name doesn't contain a hyphen already.
                if (!l.includes('-')) {
                    let baseSuffix = Math.random() < 0.5 ? 'son' : 'sen';
                    if (Math.random() < 0.5) baseSuffix = baseSuffix.charAt(0) + baseSuffix; // 50% chance to double the start character ('sson')
                    // We prepend an internal "+" marker. The builder later slices this off, knowing 
                    // a "+" means "Append without typing a space character".
                    s = '+' + baseSuffix;
                }
                break;
            case 'russian':
                f = f.replace(/w/g, 'v').replace(/W/g, 'V');
                l = l.replace(/w/g, 'v').replace(/W/g, 'V');
                if (!l.includes('-')) {
                    s = '+' + (Math.random() < 0.5 ? 'ov' : 'sky');
                }
                break;
            case 'arabic':
                f = f.replace(/p/g, 'b').replace(/P/g, 'B').replace(/v/g, 'f').replace(/V/g, 'F');
                l = l.replace(/p/g, 'b').replace(/P/g, 'B').replace(/v/g, 'f').replace(/V/g, 'F');
                p = Math.random() < 0.5 ? 'Al-' : 'ibn ';
                break;
            case 'japanese':
                f = this.toCV(f).replace(/l/g, 'r').replace(/L/g, 'R');
                l = this.toCV(l).replace(/l/g, 'r').replace(/L/g, 'R');
                // Japanese linguistic style zeros out prefixes/suffixes globally
                p = '';
                s = '';
                break;
            case 'chinese':
                f = f.substring(0, Math.floor(Math.random() * 2) + 3).replace(/th/g, 'zh').replace(/sh/g, 'x');
                l = l.substring(0, Math.floor(Math.random() * 2) + 3).replace(/ch/g, 'q');
                p = '';
                s = '';
                break;
            case 'english':
            default:
                // No overrides for default English!
                break;
        }

        // Returns all 4 variables bundled neatly inside a single Object {} dictionary
        return { firstName: this.capitalize(f), lastName: this.capitalize(l), prefix: p, suffix: s };
    }

    /**
     * Consonant-Vowel (CV) Transformer
     * Forces strings to adopt a strict CV structure typical of Japanese transliteration.
     */
    toCV(word) {
        let res = '';
        for (let i = 0; i < word.length; i++) {
            res += word[i];
            
            // Check if current letter is NOT a vowel, space, or hyphen
            if (!this.vowels.includes(word[i].toLowerCase()) && word[i] !== '-' && word[i] !== ' ') {
                // If it's the last letter OR the next letter is also a consonant (Optional Chaining '?.' prevents crashing)
                if (i === word.length - 1 || !this.vowels.includes(word[i+1]?.toLowerCase())) {
                    // Inject a random vowel to break up the hard consonant group
                    res += this.getRandom(['a', 'i', 'u', 'e', 'o']);
                }
            }
        }
        return res;
    }

    /**
     * Extremely common String utility function. Cuts off the literal first character,
     * forces it to become upper case, and splices it onto the remaining fragment.
     */
    capitalize(word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    /**
     * PROBABILISTIC TABLE RESOLVER
     * The heart of the Traveller RPG generation! 
     * Handles Tables formatted as: [['a', 15], ['b', 10]] where [string, probability-weighting].
     */
    pickFromWeightedTable(table) {
        if (!table || table.length === 0) return '';
        
        // .reduce() collapses an entire array into a single number! Here we sum the total weightings.
        let totalWeight = table.reduce((sum, item) => sum + item[1], 0);
        
        // Simulates a random Dice roll inside the bounding parameters
        let roll = Math.floor(Math.random() * totalWeight) + 1;
        let cumulative = 0;
        
        // Scans the tables incrementally adding weights until it eclipses the rolled number!
        for (let i = 0; i < table.length; i++) {
            cumulative += table[i][1];
            if (roll <= cumulative) {
                return table[i][0]; // Target acquired
            }
        }
        return table[0][0]; // fallback
    }

    /**
     * Procedural Engine Logic
     * Rather than modifying english words (baseShift), this physically builds
     * alien names from scratch using algorithmic rules.
     */
    proceduralGenerateWord(language) {
        const pd = proceduralData[language];
        if (!pd) return '';
        
        // Simulating a "1d3" dice roll: generates a 1, 2, or 3
        let count = Math.floor(Math.random() * 3) + 1; 
        
        // Aliens have rules forcing syllables to alternate depending on strict linguistic constraints
        let useBasic = true;
        let syllables = [];

        for (let i = 0; i < count; i++) {
            // Load whichever probability table is currently active 
            let table = useBasic ? pd.syllable_types_basic : pd.syllable_types_alternate;
            let type = this.pickFromWeightedTable(table); // Could be 'v' (vowel) or 'cv' (consonant-vowel)
            
            let s = '';
            
            // Once the type is determined, we construct the literal characters recursively!
            if (type === 'v') {
                s = this.pickFromWeightedTable(pd.vowels);
            } else if (type === 'cv') {
                s = this.pickFromWeightedTable(pd.initial_consonants) + this.pickFromWeightedTable(pd.vowels);
            } else if (type === 'vc') {
                s = this.pickFromWeightedTable(pd.vowels) + this.pickFromWeightedTable(pd.final_consonants);
            } else if (type === 'cvc') {
                s = this.pickFromWeightedTable(pd.initial_consonants) + this.pickFromWeightedTable(pd.vowels) + this.pickFromWeightedTable(pd.final_consonants);
            }
            
            syllables.push(s);
            
            // Update logic table logic (Only use basic on next sweep if we natively ended in a vowel block)
            useBasic = (type === 'v' || type === 'cv');
        }
        return syllables.join('');
    }

    /**
     * Master Pre-Flight execution logic determining whether a name is built via Base-Shifting 
     * English words OR via pure Procedural generation depending on the GUI language select.
     */
    generateParameters(config) {
        const alienLanguages = ['arrghoun', 'aslan', 'oynprith', 'solomani', 'zdetl'];
        
        // If the Language matches an Alien definition, bypass English completely.
        if (alienLanguages.includes(config.language)) {
            let f = this.proceduralGenerateWord(config.language);
            let l = this.proceduralGenerateWord(config.language);
            return { firstName: this.capitalize(f), lastName: this.capitalize(l), prefix: '', suffix: '' };
        }

        // --- Standard Shift Builder ---
        let isHyphenated = Math.random() < config.hyphenProb;
        let p = '';
        let s = '';
        let l = '';

        // Pull standard words from namesData.js arrays natively loaded on screen!
        let f = this.baseShift(this.getRandom(firstNames), config.shiftProb);

        if (isHyphenated) {
            let part1 = this.baseShift(this.getRandom(lastNames), config.shiftProb);
            let part2 = this.baseShift(this.getRandom(lastNames), config.shiftProb);
            l = `${part1}-${part2}`; 
        } else {
            l = this.baseShift(this.getRandom(lastNames), config.shiftProb);
        }

        if (Math.random() < config.prefixProb) {
            p = this.getRandom(prefixes);
        }

        if (!isHyphenated && Math.random() < config.suffixProb) {
            s = this.getRandom(suffixes);
        }

        // Finally, run the English layout string through the targeted language modifier 
        return this.applyLanguageStyle(f, l, p, s, config.language);
    }

    /**
     * The Core Loop triggered directly by App.js!
     * Builds names sequentially and checks them against the 'history' Set memory logic.
     */
    generate(config) {
        let maxAttempts = 100; // Hard fail-safe preventing website freezes if it can't find a unique name!
        
        for (let idx = 0; idx < config.count; idx++) {
            let attempts = 0;
            let fullName = '';
            
            while (attempts < maxAttempts) {
                // Object Destructuring! Pulls the four inner variables out of the returned Object immediately!
                let { firstName, lastName, prefix, suffix } = this.generateParameters(config);
                
                let fullLastName = lastName;
                
                // --- Formatting Logic --- 
                if (prefix) {
                    if (prefix.endsWith("'") || prefix.endsWith("-") || prefix.endsWith(" ")) {
                        fullLastName = `${prefix}${fullLastName}`;
                    } else {
                        fullLastName = `${prefix} ${fullLastName}`;
                    }
                }
                
                if (suffix) {
                    if (suffix.startsWith("-")) {
                        fullLastName = `${fullLastName}${suffix}`;
                    } else if (suffix.startsWith("+")) {
                        // The invisible '+' instructs us to attach it literally without a space!
                        fullLastName = `${fullLastName}${suffix.slice(1)}`;
                    } else {
                        fullLastName = `${fullLastName} ${suffix}`;
                    }
                }
                
                // Finalizing check: trim() deletes accidental edge empty spaces.
                fullName = `${firstName} ${fullLastName}`.trim().toLowerCase();
                
                // Deduplication check: If our History Set does NOT contain this lowercase name string natively...
                if (!this.history.has(fullName)) {
                    this.history.add(fullName); // Add it to memory permanently.
                    
                    let formattedName = `${this.capitalize(firstName)} ${fullLastName}`;
                    
                    // Call the GUI function passed in via the configuration dict explicitly to draw it to the screen!
                    if (config.onNameGenerated) {
                        config.onNameGenerated(formattedName);
                    }
                    
                    // Break completely exits the 'while' loop block! Advancing us functionally to the next character creation loop.
                    break; 
                }
                attempts++;
            }
        }
        
        return this.history.size; // Return the total integer of names inside the set memory.
    }

    clearHistory() {
        this.history.clear();
    }
}
