/**
 * GEMINI API WRAPPER
 * -------------------
 * This Object acts as a "namespace" or collection of related tools. 
 * Instead of writing standalone functions, we group them inside 'GeminiAPI'.
 * This is similar to a module or class in other languages.
 */
const GeminiAPI = {

    /**
     * Arrow Functions: '() => ...'
     * This is a modern, shorthand way to write a function in JavaScript.
     * It's identical to writing function() { return localStorage.getItem(...) }
     * 
     * localStorage: A browser-native database. It allows us to save strings
     * on the user's hard drive so that refreshing the page doesn't lose the API key.
     */
    getKey: () => localStorage.getItem('gemini_api_key'),
    
    // Saves the key the user typed into the browser's persistent storage.
    setKey: (key) => localStorage.setItem('gemini_api_key', key),
    
    /**
     * generateNPC
     * -----------
     * The 'async' keyword tells JavaScript that this function does things that take time 
     * (like talking to a server). It essentially wraps the return value in a "Promise" 
     * (a promise that it will eventually return data when the server replies).
     */
    generateNPC: async (name, params) => {
        // 1. Retrieve the saved API key.
        const key = GeminiAPI.getKey();

        // 2. Error Check: 'throw new Error()' stops the code completely and causes a crash
        // which we gracefully 'catch' in our app.js UI instead of breaking the app.
        if (!key) throw new Error("No Gemini API key found. Please add it in settings.");

        /**
         * 3. Template Literals (Template Strings)
         * Using the backtick (`) instead of quotes (" or ') allows us to write strings 
         * across multiple lines and magically inject variables directly into the text 
         * using the ${variable} syntax.
         * 
         * This constructs our exact instructions for the AI based on the user's GUI selections.
         */
        const prompt = `
Generate a Traveller RPG (Mongoose 2nd Edition) NPC profile for a character named "${name}".

Follow these exact parameters:
- Race: ${params.race}
- Career: ${params.career}
- Age Category: ${params.age}
- Current System: ${params.system}
- Current Occupation: ${params.occupation}

Include the following sections clearly formatted in Markdown:
1. **Characteristics**: Generate a precise UPP (Universal Personal Profile) string matching Mongoose 2E (STR, DEX, END, INT, EDU, SOC). Provide the hexadecimal string (e.g. 777777) and spell out the stats.
2. **Skills**: A bulleted list of skills and levels (e.g., Pilot (Spacecraft) 2, GunCombat (Energy) 1) appropriate to their career, race, age, and occupation.
3. **Background**: A 2-paragraph narrative explaining their history, why they are currently in the '${params.system}' system, and how they ended up in their current occupation.
4. **Motivation**: 1-2 sentences on their primary driving goal.

Return ONLY the markdown. Do not include introductory text like "Here is your profile:".`;

        /**
         * 4. Creating the HTTP Request (The 'fetch' API)
         * 'fetch' is the modern standard for making network requests (equivalent to old AJAX).
         * We 'await' the fetch so the code pauses right here until Google's server actually replies.
         */
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
            method: 'POST', // We are sending data (POST), not just requesting a webpage (GET)
            headers: {
                'Content-Type': 'application/json' // Telling Google to expect JSON formatting
            },
            
            // JSON.stringify converts our JavaScript Object into a literal text string 
            // structured perfectly for Google's API documentation requirements.
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7, // Lower = more robotic/factual. Higher = more creative/random. (0.7 is a good middle ground).
                }
            })
        });

        /**
         * 5. Catching Network Errors
         * The 'ok' boolean is true if the HTTP status is between 200 and 299.
         * If Google sends back a 400 (Bad Request), 403 (Forbidden), or 404 (Not Found),
         * 'response.ok' is false, meaning the API failed.
         */
        if (!response.ok) {
            let errorMsg = response.statusText; // Default text like "Not Found"
            
            // We use try/catch here because if the server crashes, it might return raw HTML
            // instead of neat JSON. If '.json()' fails, we just default to the raw status text.
            try {
                // Wait for the exact error message text block from Google
                const errData = await response.json();
                errorMsg = errData.error?.message || errorMsg; // Optional Chaining (?.) prevents crashing if 'error' doesn't exist
            } catch (e) {
                // Fallback formatter if Google returned an HTML error page
                errorMsg = `HTTP Error ${response.status}: ${errorMsg}`;
            }
            
            // Bubble the error up to the UI so app.js can show the red error box
            throw new Error(`Gemini API Error: ${errorMsg}`);
        }

        /**
         * 6. Parsing the Success Data
         * Wait for the server data to stream in and convert it back into a JavaScript Object.
         */
        const data = await response.json();
        
        // Google's response is deeply nested (Candidates Array > Content Object > Parts Array > Text).
        // This targets the exact string block.
        return data.candidates[0].content.parts[0].text;
    }
};
