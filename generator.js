class LinguisticGenerator {
    constructor() {
        this.history = new Set();
        this.vowels = 'aeiouy'.split('');
        this.hardToSoft = { 'k': 's', 'K': 'S', 'g': 'j', 'G': 'J', 'q': 'c', 'Q': 'C' };
        this.softToHard = { 'c': 'k', 'C': 'K', 's': 't', 'S': 'T', 'z': 'd', 'Z': 'D' };
        this.consonantGroups = { 'th': 't', 'ph': 'f', 'sh': 's', 'ch': 'k', 'gh': 'f' };
    }

    getRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    baseShift(text, shiftProb) {
        if (!text) return text;
        if (Math.random() > shiftProb) return text;

        let tempText = text;
        for (const [group, single] of Object.entries(this.consonantGroups)) {
            if (tempText.toLowerCase().includes(group) && Math.random() < 0.8) {
                tempText = tempText.replace(new RegExp(group, 'g'), single);
                tempText = tempText.replace(new RegExp(group.charAt(0).toUpperCase() + group.slice(1), 'g'), single.toUpperCase());
            }
        }

        let chars = tempText.split('');
        for (let i = 0; i < chars.length; i++) {
            let roll = Math.random();
            let lowerChar = chars[i].toLowerCase();
            
            if (this.vowels.includes(lowerChar) && roll < 0.5) {
                let newV = this.getRandom(this.vowels);
                chars[i] = chars[i] === chars[i].toUpperCase() ? newV.toUpperCase() : newV;
            } else if (this.hardToSoft[chars[i]] && roll < 0.5) {
                chars[i] = this.hardToSoft[chars[i]];
            } else if (this.softToHard[chars[i]] && roll < 0.5) {
                chars[i] = this.softToHard[chars[i]];
            }
        }

        if (Math.random() < 0.5) {
            let idx = Math.floor(Math.random() * chars.length);
            let extraChar = this.getRandom('abcdefghijklmnopqrstuvwxyz'.split(''));
            chars.splice(idx, 0, extraChar);
        }

        return chars.join('');
    }

    applyLanguageStyle(firstName, lastName, prefix, suffix, language) {
        let f = firstName;
        let l = lastName;
        let p = prefix;
        let s = suffix;

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
                if (!l.includes('-')) {
                    let baseSuffix = Math.random() < 0.5 ? 'son' : 'sen';
                    if (Math.random() < 0.5) baseSuffix = baseSuffix.charAt(0) + baseSuffix;
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
                // default styles
                break;
        }

        return { firstName: this.capitalize(f), lastName: this.capitalize(l), prefix: p, suffix: s };
    }

    toCV(word) {
        let res = '';
        for (let i = 0; i < word.length; i++) {
            res += word[i];
            if (!this.vowels.includes(word[i].toLowerCase()) && word[i] !== '-' && word[i] !== ' ') {
                if (i === word.length - 1 || !this.vowels.includes(word[i+1]?.toLowerCase())) {
                    res += this.getRandom(['a', 'i', 'u', 'e', 'o']);
                }
            }
        }
        return res;
    }

    capitalize(word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    pickFromWeightedTable(table) {
        if (!table || table.length === 0) return '';
        let totalWeight = table.reduce((sum, item) => sum + item[1], 0);
        let roll = Math.floor(Math.random() * totalWeight) + 1;
        let cumulative = 0;
        for (let i = 0; i < table.length; i++) {
            cumulative += table[i][1];
            if (roll <= cumulative) {
                return table[i][0];
            }
        }
        return table[0][0]; // fallback
    }

    proceduralGenerateWord(language) {
        const pd = proceduralData[language];
        if (!pd) return '';
        
        // Simulating a 1d3 roll (1 to 3 syllables)
        let count = Math.floor(Math.random() * 3) + 1; 
        let useBasic = true;
        let syllables = [];

        for (let i = 0; i < count; i++) {
            let table = useBasic ? pd.syllable_types_basic : pd.syllable_types_alternate;
            let type = this.pickFromWeightedTable(table);
            
            let s = '';
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
            useBasic = (type === 'v' || type === 'cv');
        }
        return syllables.join('');
    }

    generateParameters(config) {
        const alienLanguages = ['arrghoun', 'aslan', 'oynprith', 'solomani', 'zdetl'];
        
        if (alienLanguages.includes(config.language)) {
            let f = this.proceduralGenerateWord(config.language);
            let l = this.proceduralGenerateWord(config.language);
            return { firstName: this.capitalize(f), lastName: this.capitalize(l), prefix: '', suffix: '' };
        }

        let isHyphenated = Math.random() < config.hyphenProb;
        let p = '';
        let s = '';
        let l = '';

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

        return this.applyLanguageStyle(f, l, p, s, config.language);
    }

    generate(config) {
        let maxAttempts = 100; // prevent infinite loops
        
        for (let idx = 0; idx < config.count; idx++) {
            let attempts = 0;
            let fullName = '';
            
            while (attempts < maxAttempts) {
                let { firstName, lastName, prefix, suffix } = this.generateParameters(config);
                
                let fullLastName = lastName;
                
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
                        fullLastName = `${fullLastName}${suffix.slice(1)}`;
                    } else {
                        fullLastName = `${fullLastName} ${suffix}`;
                    }
                }
                
                fullName = `${firstName} ${fullLastName}`.trim().toLowerCase();
                
                // Deduplication check
                if (!this.history.has(fullName)) {
                    this.history.add(fullName);
                    // Format nice string
                    let formattedName = `${this.capitalize(firstName)} ${fullLastName}`;
                    // Send to UI callback
                    if (config.onNameGenerated) {
                        config.onNameGenerated(formattedName);
                    }
                    break;
                }
                attempts++;
            }
        }
        
        return this.history.size;
    }

    clearHistory() {
        this.history.clear();
    }
}
