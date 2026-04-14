const GeminiAPI = {
    getKey: () => localStorage.getItem('gemini_api_key'),
    setKey: (key) => localStorage.setItem('gemini_api_key', key),
    
    generateNPC: async (name, params) => {
        const key = GeminiAPI.getKey();
        if (!key) throw new Error("No Gemini API key found. Please add it in settings.");

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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const errData = await response.json();
                errorMsg = errData.error?.message || errorMsg;
            } catch (e) {
                // Not JSON (e.g., standard 404 HTML response)
                errorMsg = `HTTP Error ${response.status}: ${errorMsg}`;
            }
            throw new Error(`Gemini API Error: ${errorMsg}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
};
