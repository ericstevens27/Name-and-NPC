// Global Application State
const appState = {
    filepath: localStorage.getItem('travellerFilepath') || '',
    weeksBefore: parseInt(localStorage.getItem('travellerWeeksBefore')) !== NaN ? parseInt(localStorage.getItem('travellerWeeksBefore')) : 2,
    weeksAfter: parseInt(localStorage.getItem('travellerWeeksAfter')) !== NaN ? parseInt(localStorage.getItem('travellerWeeksAfter')) : 2,
    currentDate: '',      // e.g. "1105-001"
    selectedDate: '',     // The date the user clicked on
    savedCurrentDate: '', // Extracted from file
    notesMap: {},         // Map of "YYYY-DDD" -> { zhodani: "...", event: "Markdown string" }
    originalFileText: '', // Full original markdown text cache to allow precision replacement
    isDirty: false        // Tracks if we have unsaved modifications
};

if (isNaN(appState.weeksBefore)) appState.weeksBefore = 2;
if (isNaN(appState.weeksAfter)) appState.weeksAfter = 2;

// DOM Elements
const els = {
    filepathInput: document.getElementById('filepathInput'),
    weeksBeforeInput: document.getElementById('weeksBeforeInput'),
    weeksAfterInput: document.getElementById('weeksAfterInput'),
    currentDateDisplay: document.getElementById('currentDateDisplay'),
    calendarGrid: document.getElementById('calendarGrid'),
    
    noteDateLabel: document.getElementById('noteDateLabel'),
    noteEditor: document.getElementById('noteEditor'),
    notePreview: document.getElementById('notePreview'),
    btnTogglePreview: document.getElementById('btnTogglePreview'),
    btnSetCurrent: document.getElementById('btnSetCurrent'),
    
    btnIncDay: document.getElementById('btnIncDay'),
    btnGasGiant: document.getElementById('btnGasGiant'),
    btnJump: document.getElementById('btnJump'),
    btnSaveToDisk: document.getElementById('btnSaveToDisk'),
    
    settingsModal: document.getElementById('settingsModal'),
    btnSettings: document.getElementById('btnSettings'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    
    reviewModal: document.getElementById('reviewModal'),
    btnReview: document.getElementById('btnReview'),
    closeReviewBtn: document.getElementById('closeReviewBtn'),
    reviewStartInput: document.getElementById('reviewStartInput'),
    reviewEndInput: document.getElementById('reviewEndInput'),
    loadReviewBtn: document.getElementById('loadReviewBtn'),
    reviewContent: document.getElementById('reviewContent'),
};

// Utility Date Functions
function parseDate(dateStr) {
    const parts = dateStr.trim().split('-');
    if (parts.length !== 2) return null;
    return {
        year: parseInt(parts[0], 10),
        day: parseInt(parts[1], 10)
    };
}

function formatDate(year, day) {
    return `${year.toString().padStart(4, '0')}-${day.toString().padStart(3, '0')}`;
}

function addDays(dateStr, amount) {
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    
    d.day += amount;
    
    while (d.day > 365) {
        d.year++;
        d.day -= 365;
    }
    while (d.day < 1) {
        d.year--;
        d.day += 365;
    }
    
    return formatDate(d.year, d.day);
}

// Markdown Table Parser
function parseMarkdownToMap(markdownStr) {
    const map = {};
    const lines = markdownStr.split('\n');
    let inTable = false;
    let headersFound = false;

    // Check for Current Date metadata
    const mdDateRegex = /\*\*Current Date:\*\*\s*([0-9]{4}-[0-9]{3})/;
    const m = markdownStr.match(mdDateRegex);
    if (m) {
        appState.savedCurrentDate = m[1];
    } else {
        appState.savedCurrentDate = '';
    }

    const tableLineRegex = /^\|(.*)\|$/;
    
    for (let line of lines) {
        const match = line.trim().match(tableLineRegex);
        if (match) {
            inTable = true;
            const cells = match[1].split('|').map(s => s.trim());
            
            if (cells.length >= 3 && cells[0].replace(/-/g, '') === '') {
                headersFound = true;
                continue;
            }
            
            if (headersFound && cells.length >= 3) {
                const date = cells[0];
                if (date && date.includes('-')) {
                    const zhodani = cells[1];
                    const eventText = cells.slice(2).join('|').trim();
                    map[date] = { zhodani: zhodani, event: eventText };
                }
            }
        } else {
            if (inTable && headersFound) break;
        }
    }
    return map;
}

function constructMarkdownTable(map) {
    const dates = Object.keys(map).sort();
    let md = '| Date | Zhodani Date | Event |\n';
    md += '|---|---|---|\n';
    for (let date of dates) {
        const obj = map[date];
        const evt = obj.event.replace(/\n/g, '<br>');
        md += `| ${date} | ${obj.zhodani || ''} | ${evt} |\n`;
    }
    return md;
}

// Backend Communication
async function readCampaignFile() {
    if (!appState.filepath) {
        appState.isDirty = true;
        updateUI();
        appState.currentDate = '1105-001';
        renderCalendar();
        return;
    }
    
    try {
        const res = await fetch('/api/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: appState.filepath })
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            appState.originalFileText = data.content;
            appState.notesMap = parseMarkdownToMap(data.content);
            
            if (appState.savedCurrentDate && parseDate(appState.savedCurrentDate)) {
                appState.currentDate = appState.savedCurrentDate;
            } else {
                const dates = Object.keys(appState.notesMap).sort();
                if (dates.length > 0) {
                    appState.currentDate = dates[dates.length - 1];
                } else {
                    appState.currentDate = '1105-001';
                }
            }
            
            appState.isDirty = false;
            els.currentDateDisplay.value = appState.currentDate;
            selectDate(appState.currentDate);
            alert('File loaded successfully.');
        } else {
            alert('Error loading file: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Could not connect to back-end server.');
    }
}

async function writeCampaignFile() {
    if (!appState.filepath) {
        alert("No filepath set. Configure in Settings.");
        return;
    }
    
    let newFullContent = "";
    const newTable = constructMarkdownTable(appState.notesMap);
    
    if (appState.originalFileText) {
        let textBase = appState.originalFileText;
        
        // Inject or update Current Date
        const cdRegex = /\*\*Current Date:\*\*\s*[0-9]{4}-[0-9]{3}/g;
        if (cdRegex.test(textBase)) {
            textBase = textBase.replace(cdRegex, `**Current Date:** ${appState.currentDate}`);
        } else {
            if (textBase.includes('| Date |')) {
                textBase = textBase.replace(/(\| Date \|[\s\S]*)/, `**Current Date:** ${appState.currentDate}\n\n$1`);
            } else {
                textBase += `\n\n**Current Date:** ${appState.currentDate}\n`;
            }
        }
        
        const tableBlockRegex = /(\|\s*Date\s*\|\s*Zhodani Date\s*\|\s*Event\s*\|[\s\S]*?(?=\n\n|\n$|$))/m;
        if (tableBlockRegex.test(textBase)) {
            newFullContent = textBase.replace(tableBlockRegex, newTable);
        } else {
            newFullContent = textBase + "\n\n" + newTable;
        }
    } else {
        newFullContent = `# Campaign Log\n\n**Current Date:** ${appState.currentDate}\n\n` + newTable;
    }
    
    try {
        const res = await fetch('/api/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filepath: appState.filepath,
                content: newFullContent
            })
        });
        
        const data = await res.json();
        if (data.status === 'success') {
            appState.originalFileText = newFullContent;
            appState.savedCurrentDate = appState.currentDate;
            appState.isDirty = false;
            updateUI();
        } else {
            alert('Error writing file: ' + data.message);
        }
    } catch (e) {
        alert('Server communication error.');
    }
}

// UI Logic
function selectDate(dateStr) {
    appState.selectedDate = dateStr;
    els.noteDateLabel.textContent = dateStr;
    
    const entry = appState.notesMap[dateStr];
    els.noteEditor.value = entry ? entry.event.replace(/<br>/g, '\n') : '';
    
    appState.isDirty = false;
    
    els.notePreview.classList.remove('visible');
    els.btnTogglePreview.textContent = 'View Markdown';
    
    renderCalendar();
}

function updateDateValue(dateStr, notesObj) {
    if (!notesObj.event.trim() && !notesObj.zhodani) {
        delete appState.notesMap[dateStr];
    } else {
        appState.notesMap[dateStr] = notesObj;
    }
    appState.isDirty = true;
    updateUI();
    renderCalendar();
}

function updateUI() {
    if (appState.isDirty) {
        els.btnSaveToDisk.classList.remove('hidden');
    } else {
        els.btnSaveToDisk.classList.add('hidden');
    }
}

// Calendar Rendering Logic
function renderCalendar() {
    els.calendarGrid.innerHTML = '';
    
    const centerDate = parseDate(appState.currentDate || '1105-001');
    if (!centerDate) return;
    
    els.currentDateDisplay.value = appState.currentDate;
    
    // Calculate start date alignment bounds
    // We step backwards until we align with the start of a week before calculating limits.
    let startD = parseDate(addDays(appState.currentDate, -appState.weeksBefore * 7));
    while (startD.day !== 1 && (startD.day - 2) % 7 !== 0) {
        startD = parseDate(addDays(formatDate(startD.year, startD.day), -1));
    }
    
    // Step forward until we align with end of a week
    let endD = parseDate(addDays(appState.currentDate, appState.weeksAfter * 7));
    while (endD.day !== 1 && (endD.day - 2) % 7 !== 6) { 
        endD = parseDate(addDays(formatDate(endD.year, endD.day), 1));
    }
    
    let iterDateStr = formatDate(startD.year, startD.day);
    let iterDateObj = startD;
    let maxIter = 365 * 3; // failsafe
    let iterations = 0;
    
    let currentWeekRow = null;
    let daysContainer = null;

    function createCell(dStr) {
        const dObj = parseDate(dStr);
        let cell = document.createElement('div');
        cell.className = 'day-cell';
        
        let label = `Day ${dObj.day}`;
        if (dObj.day === 1) {
            cell.classList.add('holiday');
            label = `YEAR ${dObj.year} HOLIDAY`;
        }
        
        if (dStr === appState.currentDate) cell.classList.add('current-date');
        if (dStr === appState.selectedDate) cell.classList.add('active');
        
        cell.innerHTML = `
            <div class="day-date">${label}</div>
            <div class="day-event-indicator">
                ${appState.notesMap[dStr] ? (appState.notesMap[dStr].event.replace(/<br>/g, ' ') || '') : ''}
            </div>
        `;
        
        cell.onclick = () => selectDate(dStr);
        return cell;
    }

    function appendNewRow(labelStr) {
        currentWeekRow = document.createElement('div');
        currentWeekRow.className = 'week-row';
        
        let label = document.createElement('div');
        label.className = 'week-label';
        label.textContent = labelStr;
        currentWeekRow.appendChild(label);
        
        daysContainer = document.createElement('div');
        daysContainer.className = 'days-container';
        currentWeekRow.appendChild(daysContainer);
        
        els.calendarGrid.appendChild(currentWeekRow);
    }

    let lastWeekIdx = -1;

    while (iterations < maxIter) {
        if (iterDateObj.day === 1) {
            appendNewRow(iterDateObj.year + ' HOL');
            daysContainer.appendChild(createCell(iterDateStr));
            lastWeekIdx = -1; 
        } else {
            const weekIdx = Math.floor((iterDateObj.day - 2) / 7) + 1;
            if (weekIdx !== lastWeekIdx) {
                appendNewRow(iterDateObj.year + ' W' + weekIdx);
                lastWeekIdx = weekIdx;
            }
            daysContainer.appendChild(createCell(iterDateStr));
        }
        
        if (iterDateStr === formatDate(endD.year, endD.day)) {
            break;
        }
        
        iterDateStr = addDays(iterDateStr, 1);
        iterDateObj = parseDate(iterDateStr);
        iterations++;
    }
}

// Event Listeners

els.currentDateDisplay.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if(parseDate(val)) {
        appState.currentDate = val;
        selectDate(val);
    } else {
        els.currentDateDisplay.value = appState.currentDate;
    }
});

els.btnIncDay.onclick = () => {
    appState.currentDate = addDays(appState.currentDate, 1);
    selectDate(appState.currentDate);
};

els.btnGasGiant.onclick = () => {
    appState.currentDate = addDays(appState.currentDate, 1);
    let note = appState.notesMap[appState.currentDate] || { zhodani: '', event: '' };
    note.event = note.event ? note.event + " <br>**Gas Giant Refueling**" : "**Gas Giant Refueling**";
    updateDateValue(appState.currentDate, note);
    selectDate(appState.currentDate);
};

els.btnJump.onclick = () => {
    appState.currentDate = addDays(appState.currentDate, 7);
    let note = appState.notesMap[appState.currentDate] || { zhodani: '', event: '' };
    note.event = note.event ? note.event + " <br>**Emerged from Jump Space**" : "**Emerged from Jump Space**";
    updateDateValue(appState.currentDate, note);
    selectDate(appState.currentDate);
};

els.btnSaveToDisk.onclick = writeCampaignFile;

els.btnSetCurrent.onclick = () => {
    if (appState.selectedDate) {
        appState.currentDate = appState.selectedDate;
        appState.isDirty = true;
        updateUI();
        renderCalendar();
    }
};

els.noteEditor.addEventListener('input', (e) => {
    if (!appState.selectedDate) return;
    const oldNote = appState.notesMap[appState.selectedDate] || {};
    updateDateValue(appState.selectedDate, {
        zhodani: oldNote.zhodani || '',
        event: e.target.value.replace(/\n/g, '<br>')
    });
});

els.btnTogglePreview.onclick = () => {
    if (els.notePreview.classList.contains('visible')) {
        els.notePreview.classList.remove('visible');
        els.btnTogglePreview.textContent = 'View Markdown';
    } else {
        if (typeof marked !== 'undefined') {
            els.notePreview.innerHTML = marked.parse(els.noteEditor.value);
        } else {
            els.notePreview.innerHTML = "<p>Markdown parsing unavailable.</p>";
        }
        els.notePreview.classList.add('visible');
        els.btnTogglePreview.textContent = 'Edit Content';
    }
};

els.btnSettings.onclick = () => {
    els.filepathInput.value = appState.filepath;
    els.weeksBeforeInput.value = appState.weeksBefore;
    els.weeksAfterInput.value = appState.weeksAfter;
    els.settingsModal.classList.remove('hidden');
};

els.closeSettingsBtn.onclick = () => {
    els.settingsModal.classList.add('hidden');
};

els.saveSettingsBtn.onclick = () => {
    const oldPath = appState.filepath;
    
    appState.filepath = els.filepathInput.value.trim();
    appState.weeksBefore = parseInt(els.weeksBeforeInput.value, 10) || 0;
    appState.weeksAfter = parseInt(els.weeksAfterInput.value, 10) || 0;
    
    localStorage.setItem('travellerFilepath', appState.filepath);
    localStorage.setItem('travellerWeeksBefore', appState.weeksBefore);
    localStorage.setItem('travellerWeeksAfter', appState.weeksAfter);
    
    els.settingsModal.classList.add('hidden');
    
    if (oldPath !== appState.filepath) {
        readCampaignFile(); 
    } else {
        renderCalendar();
    }
};

els.btnReview.onclick = () => {
    els.reviewStartInput.value = addDays(appState.currentDate, -7);
    els.reviewEndInput.value = appState.currentDate;
    els.reviewContent.innerHTML = '';
    els.reviewModal.classList.remove('hidden');
};

els.closeReviewBtn.onclick = () => {
    els.reviewModal.classList.add('hidden');
};

els.loadReviewBtn.onclick = () => {
    let startStr = els.reviewStartInput.value.trim();
    let endStr = els.reviewEndInput.value.trim();
    
    if(!parseDate(startStr) || !parseDate(endStr)) {
        alert("Invalid dates."); return;
    }
    
    let html = '';
    let cur = startStr;
    const MAX_DAYS = 365 * 3; 
    let limit = 0;
    
    while(limit++ < MAX_DAYS) {
        if(appState.notesMap[cur] && appState.notesMap[cur].event) {
            let renderedHtml = cur;
            if (typeof marked !== 'undefined') {
                renderedHtml = marked.parse(appState.notesMap[cur].event.replace(/<br>/g, '\n'));
            } else {
                renderedHtml = appState.notesMap[cur].event;
            }
            
            html += `<div class="review-day">
                <h3>Log Entry: ${cur}</h3>
                <div class="markdown-body">${renderedHtml}</div>
            </div>`;
        }
        
        if(cur === endStr) break;
        cur = addDays(cur, 1);
    }
    
    els.reviewContent.innerHTML = html || '<p>No logs found within this date range.</p>';
};

// Boot Sequence
if(appState.filepath) {
    readCampaignFile();
} else {
    appState.currentDate = '1105-001';
    els.settingsModal.classList.remove('hidden');
    renderCalendar();
}
