document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const languageSelect = document.getElementById('languageSelect');
    
    const countInput = document.getElementById('countInput');
    const countValue = document.getElementById('countValue');
    const shiftProb = document.getElementById('shiftProb');
    const shiftValue = document.getElementById('shiftValue');
    const hyphenProb = document.getElementById('hyphenProb');
    const hyphenValue = document.getElementById('hyphenValue');
    const prefixProb = document.getElementById('prefixProb');
    const prefixValue = document.getElementById('prefixValue');
    const suffixProb = document.getElementById('suffixProb');
    const suffixValue = document.getElementById('suffixValue');
    
    const generateBtn = document.getElementById('generateBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const resultsList = document.getElementById('resultsList');
    const uniqueCountSpan = document.getElementById('uniqueCount');

    // New Elements
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

    // Initialize state
    const generator = new LinguisticGenerator();
    let selectedNames = new Set();
    
    // API Key
    apiKeyInput.value = GeminiAPI.getKey() || '';

    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', () => {
        GeminiAPI.setKey(apiKeyInput.value.trim());
        settingsModal.classList.add('hidden');
    });

    const updateSelectionUI = () => {
        if (selectedNames.size > 0) {
            npcGenerateBtn.classList.remove('hidden');
            selectedCountSpan.textContent = selectedNames.size;
        } else {
            npcGenerateBtn.classList.add('hidden');
        }
    };

    // Sliders
    countInput.addEventListener('input', (e) => countValue.textContent = e.target.value);
    shiftProb.addEventListener('input', (e) => shiftValue.textContent = Math.round(e.target.value * 100) + '%');
    hyphenProb.addEventListener('input', (e) => hyphenValue.textContent = Math.round(e.target.value * 100) + '%');
    prefixProb.addEventListener('input', (e) => prefixValue.textContent = Math.round(e.target.value * 100) + '%');
    suffixProb.addEventListener('input', (e) => suffixValue.textContent = Math.round(e.target.value * 100) + '%');

    const copyToClipboard = async (text, btn) => {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => btn.innerHTML = originalHTML, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const addNameToUI = (name) => {
        const emptyState = resultsList.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const card = document.createElement('div');
        card.className = 'name-card';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'name-inner';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'name-select-checkbox';
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) selectedNames.add(name);
            else selectedNames.delete(name);
            updateSelectionUI();
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

    generateBtn.addEventListener('click', () => {
        generateBtn.style.transform = 'scale(0.95)';
        setTimeout(() => { generateBtn.style.transform = 'none'; }, 150);

        const config = {
            count: parseInt(countInput.value),
            shiftProb: parseFloat(shiftProb.value),
            hyphenProb: parseFloat(hyphenProb.value),
            prefixProb: parseFloat(prefixProb.value),
            suffixProb: parseFloat(suffixProb.value),
            language: languageSelect.value,
            onNameGenerated: addNameToUI
        };

        const totalUnique = generator.generate(config);
        uniqueCountSpan.textContent = totalUnique;
    });

    clearHistoryBtn.addEventListener('click', () => {
        generator.clearHistory();
        selectedNames.clear();
        updateSelectionUI();
        uniqueCountSpan.textContent = '0';
        resultsList.innerHTML = `<div class="empty-state"><p>History cleared. Ready for new names.</p></div>`;
    });

    // NPC Config Modal Builder
    npcGenerateBtn.addEventListener('click', () => {
        npcFormsContainer.innerHTML = '';
        selectedNames.forEach(name => {
            const card = document.createElement('div');
            card.className = 'npc-form-card';
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
        npcConfigModal.classList.remove('hidden');
    });

    closeNpcConfigBtn.addEventListener('click', () => npcConfigModal.classList.add('hidden'));

    startNpcGenBtn.addEventListener('click', async () => {
        if (!GeminiAPI.getKey()) {
            alert('Please add your Gemini API Key in the settings first.');
            return;
        }

        const originalText = startNpcGenBtn.textContent;
        startNpcGenBtn.textContent = 'Generating...';
        startNpcGenBtn.disabled = true;

        let combinedMarkdown = '';

        try {
            const arrNames = Array.from(selectedNames);
            for (let i = 0; i < arrNames.length; i++) {
                const name = arrNames[i];
                const race = document.querySelector(`.npc-race[data-name="${name}"]`).value;
                const age = document.querySelector(`.npc-age[data-name="${name}"]`).value;
                const career = document.querySelector(`.npc-career[data-name="${name}"]`).value;
                const occ = document.querySelector(`.npc-occ[data-name="${name}"]`).value;
                const system = document.querySelector(`.npc-system[data-name="${name}"]`).value;

                startNpcGenBtn.textContent = `Generating (${i+1}/${arrNames.length})...`;
                
                const mdResult = await GeminiAPI.generateNPC(name, { race, age, career, occupation: occ, system });
                combinedMarkdown += `\n# Profile: ${name}\n\n${mdResult}\n\n<hr/>\n`;
            }

            npcConfigModal.classList.add('hidden');
            npcOutputSection.classList.remove('hidden');
            
            rawMarkdown.textContent = combinedMarkdown;
            markdownContent.innerHTML = marked.parse(combinedMarkdown);

        } catch (e) {
            console.error(e);
            npcConfigModal.classList.add('hidden');
            npcOutputSection.classList.remove('hidden');
            const errorOutput = `### Configuration Error\n\n${e.message}\n\nPlease check your Gemini API key inside the Ethereal Settings gear or ensure you have billing/access enabled.`;
            rawMarkdown.textContent = errorOutput;
            markdownContent.innerHTML = marked.parse(errorOutput);
        } finally {
            startNpcGenBtn.textContent = originalText;
            startNpcGenBtn.disabled = false;
        }
    });

    closeNpcBtn.addEventListener('click', () => npcOutputSection.classList.add('hidden'));

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
