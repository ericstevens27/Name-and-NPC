/**
 * APP LOGIC CONTROLLER (app.js)
 * -----------------------------
 * This script is responsible for connecting the HTML interface (DOM) 
 * to the background engines (generator.js and gemini-api.js).
 */

// We wait until the HTML page has completely downloaded and parsed before
// running our script. Trying to attach behavior to an element that hasn't
// been drawn yet would cause errors!
document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * 1. GETTING DOM ELEMENTS
     * document.getElementById grabs the exact HTML element so we can read its
     * values or attach clicks to it. We store these references in 'const' variables.
     * 'const' means the reference will never change (we won't point 'languageSelect' 
     * to a different element later).
     */
    const languageSelect = document.getElementById('languageSelect');
    const countInput = document.getElementById('countInput');
    const countValue = document.getElementById('countValue');
    
    // Sliders
    const shiftProb = document.getElementById('shiftProb');
    const shiftValue = document.getElementById('shiftValue');
    const hyphenProb = document.getElementById('hyphenProb');
    const hyphenValue = document.getElementById('hyphenValue');
    const prefixProb = document.getElementById('prefixProb');
    const prefixValue = document.getElementById('prefixValue');
    const suffixProb = document.getElementById('suffixProb');
    const suffixValue = document.getElementById('suffixValue');
    
    // Buttons & Outputs
    const generateBtn = document.getElementById('generateBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const resultsList = document.getElementById('resultsList');
    const uniqueCountSpan = document.getElementById('uniqueCount');

    // NPC Generator Context UI
    const npcGenerateBtn = document.getElementById('npcGenerateBtn');
    const selectedCountSpan = document.getElementById('selectedCount');
    
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    const npcConfigModal = document.getElementById('npcConfigModal');
    const npcFormsContainer = document.getElementById('npcFormsContainer');
    const startNpcGenBtn = document.getElementById('startNpcGenBtn');
    const closeNpcConfigBtn = document.getElementById('closeNpcConfigBtn');

    const npcOutputSection = document.getElementById('npcOutputSection');
    const markdownContent = document.getElementById('markdownContent');
    const rawMarkdown = document.getElementById('rawMarkdown');
    const closeNpcBtn = document.getElementById('closeNpcBtn');
    const copyMdBtn = document.getElementById('copyMdBtn');
    const downloadMdBtn = document.getElementById('downloadMdBtn');

    /**
     * 2. INITIALIZING STATE
     * The LinguisticGenerator handles our procedural name logic.
     * 
     * let selectedNames = new Set()
     * A 'Set' is a special Data Structure that only holds UNIQUE objects.
     * If the user clicks the same checkbox twice, or multiple checkboxes with the same name,
     * the Set automatically prevents duplicates, making it highly efficient for tracking state.
     */
    const generator = new LinguisticGenerator();
    let selectedNames = new Set();
    
    // Auto-load the Gemini API Key into the setting box if we had one saved.
    apiKeyInput.value = GeminiAPI.getKey() || '';

    // ==========================================
    // MODULE: API SETTINGS MODAL
    // ==========================================
    
    // By manipulating the classList (.add or .remove), we toggle CSS properties
    // that determine whether these popups are drawn on the screen (.hidden).
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', () => {
        GeminiAPI.setKey(apiKeyInput.value.trim()); // .trim() cuts off accidental whitespace!
        settingsModal.classList.add('hidden');
    });

    /**
     * Function controlling the Global "Generate NPCs" floating button.
     * If our Set of names is bigger than 0, we show the action button.
     */
    const updateSelectionUI = () => {
        if (selectedNames.size > 0) {
            npcGenerateBtn.classList.remove('hidden');
            selectedCountSpan.textContent = selectedNames.size;
        } else {
            npcGenerateBtn.classList.add('hidden');
        }
    };

    // ==========================================
    // MODULE: NAME GENERATOR SLIDERS
    // ==========================================
    // This updates the visual % text next to each HTML slider whenever you drag it.
    countInput.addEventListener('input', (e) => countValue.textContent = e.target.value);
    shiftProb.addEventListener('input', (e) => shiftValue.textContent = Math.round(e.target.value * 100) + '%');
    hyphenProb.addEventListener('input', (e) => hyphenValue.textContent = Math.round(e.target.value * 100) + '%');
    prefixProb.addEventListener('input', (e) => prefixValue.textContent = Math.round(e.target.value * 100) + '%');
    suffixProb.addEventListener('input', (e) => suffixValue.textContent = Math.round(e.target.value * 100) + '%');

    /**
     * copyToClipboard logic - uses the modern async clipboard interface.
     */
    const copyToClipboard = async (text, btn) => {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => btn.innerHTML = originalHTML, 2000); // Reset icon after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    /**
     * When the generator engine builds a new name, it runs this callback.
     * We dynamically build the HTML Divs and spans entirely out of Javascript,
     * assigning classes and nesting them, then we prepend them to the DOM.
     * Prepending causes newer elements to appear at the Top of the list!
     */
    const addNameToUI = (name) => {
        const emptyState = resultsList.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const card = document.createElement('div');
        card.className = 'name-card';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'name-inner';

        // Build the checkbox that lets a user queue a name to be an NPC
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'name-select-checkbox';
        checkbox.addEventListener('change', (e) => {
            // 'e' is the Event object. e.target.checked returns true or false!
            if (e.target.checked) selectedNames.add(name);
            else selectedNames.delete(name);
            
            updateSelectionUI(); // Refresh the floating global action button
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        
        innerDiv.appendChild(checkbox);
        innerDiv.appendChild(nameSpan);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.addEventListener('click', () => copyToClipboard(name, copyBtn));
        
        card.appendChild(innerDiv);
        card.appendChild(copyBtn);
        
        resultsList.prepend(card);
    };

    // ==========================================
    // MODULE: NAME GENERATOR EVENT TRIGGERS
    // ==========================================
    
    // Main trigger!
    generateBtn.addEventListener('click', () => {
        // Visual button click shrink behavior
        generateBtn.style.transform = 'scale(0.95)';
        setTimeout(() => { generateBtn.style.transform = 'none'; }, 150);

        // Bundle everything on the screen into a single "Config" object dictionary.
        const config = {
            count: parseInt(countInput.value),          // Parses numeric strings "10" into actual integer 10
            shiftProb: parseFloat(shiftProb.value),     // Parse float means decimals allowed "0.15"
            hyphenProb: parseFloat(hyphenProb.value),
            prefixProb: parseFloat(prefixProb.value),
            suffixProb: parseFloat(suffixProb.value),
            language: languageSelect.value,
            
            // We pass the function we made earlier explicitly as a callback,
            // so the Generator can just call config.onNameGenerated(newName) locally.
            onNameGenerated: addNameToUI 
        };

        const totalUnique = generator.generate(config);
        uniqueCountSpan.textContent = totalUnique;
    });

    clearHistoryBtn.addEventListener('click', () => {
        generator.clearHistory();
        selectedNames.clear(); // Empty our selection queue
        updateSelectionUI();
        uniqueCountSpan.textContent = '0';
        resultsList.innerHTML = `<div class="empty-state"><p>History cleared. Ready for new names.</p></div>`;
    });

    // ==========================================
    // MODULE: GEMINI NPC CONFIGURATION MODAL (Dynamic Generation)
    // ==========================================
    
    // User clicked the global action button to generate NPCs!
    npcGenerateBtn.addEventListener('click', () => {
        npcFormsContainer.innerHTML = '';
        
        // Loop over the Set of Strings. We construct one big HTML block for EACH selected name.
        // It injects `data-name="${name}"`. This is extremely important: it tells the browser
        // exactly which form block belongs to which NPC later.
        selectedNames.forEach(name => {
            const card = document.createElement('div');
            card.className = 'npc-form-card';
            
            // Multi-line HTML literal insertion (Template String rendering). 
            card.innerHTML = `
                <h3>${name}</h3>
                <div class="form-row">
                    <div>
                        <label>Race</label>
                        <select class="text-input npc-race" data-name="${name}">
                            <option value="Human (Solomani)">Human (Solomani)</option>
                            <option value="Human (Vilani)">Human (Vilani)</option>
                            <option value="Human (Zhodani)">Human (Zhodani)</option>
                            <option value="Aslan">Aslan</option>
                            <option value="Vargr">Vargr</option>
                            <option value="Hiver">Hiver</option>
                            <option value="K'kree">K'kree</option>
                            <option value="Droyne">Droyne</option>
                        </select>
                    </div>
                    <div>
                        <label>Age Category</label>
                        <select class="text-input npc-age" data-name="${name}">
                            <option value="Young (18-30)">Young</option>
                            <option value="Midlife (31-54)">Midlife</option>
                            <option value="Old (55+)">Old</option>
                        </select>
                    </div>
                    <div>
                        <label>Career</label>
                        <select class="text-input npc-career" data-name="${name}">
                            <option value="Agent">Agent</option>
                            <option value="Army">Army</option>
                            <option value="Citizen" selected>Citizen</option>
                            <option value="Drifter">Drifter</option>
                            <option value="Entertainer">Entertainer</option>
                            <option value="Marine">Marine</option>
                            <option value="Merchant">Merchant</option>
                            <option value="Navy">Navy</option>
                            <option value="Nobility">Nobility</option>
                            <option value="Rogue">Rogue</option>
                            <option value="Scholar">Scholar</option>
                            <option value="Scout">Scout</option>
                        </select>
                    </div>
                    <div>
                        <label>Current Occupation</label>
                        <input type="text" class="text-input npc-occ" data-name="${name}" placeholder="e.g. Smuggler, Trader" value="Trader">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label>Target System</label>
                        <input type="text" class="text-input npc-system" data-name="${name}" placeholder="e.g. Regina / Spinward Marches" value="Local System">
                    </div>
                </div>
            `;
            npcFormsContainer.appendChild(card);
        });
        
        npcConfigModal.classList.remove('hidden'); // Show it!
    });

    closeNpcConfigBtn.addEventListener('click', () => npcConfigModal.classList.add('hidden'));

    // ==========================================
    // MODULE: GEMINI API EXECUTION (ASYNC PIPES)
    // ==========================================
    startNpcGenBtn.addEventListener('click', async () => {
        if (!GeminiAPI.getKey()) {
            alert('Please add your Gemini API Key in the settings first.');
            return;
        }

        // Cache the button text and freeze interactions to prevent clicking twice
        const originalText = startNpcGenBtn.textContent;
        startNpcGenBtn.textContent = 'Generating...';
        startNpcGenBtn.disabled = true;

        let combinedMarkdown = '';

        try {
            // Because our selectedNames uses a Set, which is non-indexed, we convert it
            // into an Array so we can strictly loop through it with array logic [i].
            const arrNames = Array.from(selectedNames);
            for (let i = 0; i < arrNames.length; i++) {
                const name = arrNames[i];
                
                // document.querySelector lets you search the DOM precisely using CSS-style criteria!
                // We ask for the inputs where the custom data-name attribute strictly equates to the current target name.
                const race = document.querySelector(`.npc-race[data-name="${name}"]`).value;
                const age = document.querySelector(`.npc-age[data-name="${name}"]`).value;
                const career = document.querySelector(`.npc-career[data-name="${name}"]`).value;
                const occ = document.querySelector(`.npc-occ[data-name="${name}"]`).value;
                const system = document.querySelector(`.npc-system[data-name="${name}"]`).value;

                // Make the UI look animated! Show progression like (1/3)
                startNpcGenBtn.textContent = `Generating (${i+1}/${arrNames.length})...`;
                
                // CALL OUR GEMINI API ROUTER. (Await stops the loop until it finishes downloading the AI output).
                const mdResult = await GeminiAPI.generateNPC(name, { race, age, career, occupation: occ, system });
                
                // Append the markdown content locally to our growing string cache!
                combinedMarkdown += `\n# Profile: ${name}\n\n${mdResult}\n\n<hr/>\n`;
            }

            // Close the configuration grid and show the Output window!
            npcConfigModal.classList.add('hidden');
            npcOutputSection.classList.remove('hidden');
            
            // Load the hidden unparsed cache and explicitly parse it into Visual Markdown HTML for the viewer panel
            rawMarkdown.textContent = combinedMarkdown;
            markdownContent.innerHTML = marked.parse(combinedMarkdown); 

        } catch (e) {
            console.error(e); // Print complex error to chrome dev inspector
            npcConfigModal.classList.add('hidden');
            npcOutputSection.classList.remove('hidden');
            
            // Even if an error happens, we format a cool Markdown window showing exactly what failed!
            const errorOutput = `### Configuration Error\n\n${e.message}\n\nPlease check your Gemini API key inside the Ethereal Settings gear or ensure you have billing/access enabled.`;
            rawMarkdown.textContent = errorOutput;
            markdownContent.innerHTML = marked.parse(errorOutput);
        } finally {
            // The "Finally" block runs NO MATTER WHAT (success or error).
            // This is critical, otherwise the button would be locked as 'Generating' forever.
            startNpcGenBtn.textContent = originalText;
            startNpcGenBtn.disabled = false;
        }
    });

    closeNpcBtn.addEventListener('click', () => npcOutputSection.classList.add('hidden'));

    /**
     * Data downloading works by mocking a browser hyperlink!
     * We convert our literal text string into a "Blob" (raw file packet),
     * tell the browser to generate a fake "file://" url (URL.createObjectURL),
     * append a hidden <a> tag to the DOM, force it to 'click()' itself, 
     * causing the download prompt, and then instantly destroy the tag.
     */
    copyMdBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(rawMarkdown.textContent);
        const orig = copyMdBtn.textContent;
        copyMdBtn.textContent = 'Copied!';
        setTimeout(() => copyMdBtn.textContent = orig, 2000);
    });

    downloadMdBtn.addEventListener('click', () => {
        const blob = new Blob([rawMarkdown.textContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url;
        a.download = `NPC_Profiles_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
