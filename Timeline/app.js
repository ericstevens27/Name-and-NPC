// Global Application State
const appState = {
    filepath: localStorage.getItem('travellerFilepath') || '',
    weeksToDisplay: parseInt(localStorage.getItem('travellerWeeksNum')) || 2,
    currentDate: '',      // e.g. "1105-001"
    selectedDate: '',     // The date the user clicked on
    notesMap: {},         // Map of "YYYY-DDD" -> { zhodani: "...", event: "Markdown string" }
    originalFileText: '', // Full original markdown text cache to allow precision replacement
    isDirty: false        // Tracks if we have unsaved modifications
};

// DOM Elements
const els = {
    filepathInput: document.getElementById('filepathInput'),
    weeksDisplayInput: document.getElementById('weeksDisplayInput'),
    currentDateDisplay: document.getElementById('currentDateDisplay'),
    calendarGrid: document.getElementById('calendarGrid'),
    
    noteDateLabel: document.getElementById('noteDateLabel'),
    noteEditor: document.getElementById('noteEditor'),
    notePreview: document.getElementById('notePreview'),
    btnTogglePreview: document.getElementById('btnTogglePreview'),
    
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
    // Expected format YYYY-DDD
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

    // A very loose regex matching markdown table lines: | something | something | something |
    const tableLineRegex = /^\|(.*)\|$/;
    
    for (let line of lines) {
        const match = line.trim().match(tableLineRegex);
        if (match) {
            inTable = true;
            const cells = match[1].split('|').map(s => s.trim());
            
            // Check if it's the header divider
            if (cells.length >= 3 && cells[0].replace(/-/g, '') === '') {
                headersFound = true;
                continue;
            }
            
            // If it's a data row with at least Date, Zhodani Date, Event
            if (headersFound && cells.length >= 3) {
                const date = cells[0];
                if (date && date.includes('-')) {
                    const zhodani = cells[1];
                    const eventText = cells.slice(2).join('|').trim(); // in case event has pipes
                    
                    map[date] = {
                        zhodani: zhodani,
                        event: eventText
                    };
                }
            }
        } else {
            // Unbroken sequence of table lines is done
            if (inTable && headersFound) {
                 // Stop parsing the rest if user only had one table, or parse them all? Let's just break on first table
                 break;
            }
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
        const evt = obj.event.replace(/\n/g, '<br>'); // Prevent line breaks in markdown cell
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
            
            // Auto-detect a reasonable currentDate (latest entry)
            const dates = Object.keys(appState.notesMap).sort();
            if (dates.length > 0) {
                appState.currentDate = dates[dates.length - 1];
            } else {
                appState.currentDate = '1105-001';
            }
            
            appState.isDirty = false;
            els.currentDateDisplay.value = appState.currentDate;
            selectDate(appState.currentDate);
            renderCalendar();
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
    
    // If we have original file text, replace or append
    if (appState.originalFileText) {
        // Broad regex to match a Markdown table with our exact columns
        const tableBlockRegex = /(\|\s*Date\s*\|\s*Zhodani Date\s*\|\s*Event\s*\|[\s\S]*?(?=\n\n|\n$|$))/m;
        
        if (tableBlockRegex.test(appState.originalFileText)) {
            newFullContent = appState.originalFileText.replace(tableBlockRegex, newTable);
        } else {
            newFullContent = appState.originalFileText + "\n\n" + newTable;
        }
    } else {
        newFullContent = "# Campaign Log\n\n" + newTable;
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
    
    appState.isDirty = false; // Note editing starts clean for this interaction
    
    // Switch to editor view, ensure preview is off
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
    
    const weeksLimit = appState.weeksToDisplay;
    const daysBefore = weeksLimit * 7;
    const daysAfter = weeksLimit * 7;
    
    // We want a continuum. Traveller year is 365 days. 
    // Day 1 is Holiday. Days 2-365 are 52 weeks of 7 days.
    
    // Let's generate dates in chronological order
    const startDateObj = parseDate(addDays(appState.currentDate, -daysBefore));
    let cur = formatDate(startDateObj.year, startDateObj.day);
    
    const maxDaysRender = daysBefore + daysAfter + 7; // Give some padding
    let daysIterated = 0;
    
    let currentWeekRow = null;
    let daysContainer = null;
    let inHolidayRow = false;

    // Small helper to construct a day cell
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
                ${appState.notesMap[dStr] ? (appState.notesMap[dStr].event || 'Note entry...') : ''}
            </div>
        `;
        
        cell.onclick = () => selectDate(dStr);
        return cell;
    }

    const startD = parseDate(cur);
    let iterDateStr = cur;
    let iterDateObj = startD;

    // To organize by logical Traveller weeks, year begins day 1 (Holiday). 
    // Week 1 is Days 2-8. Week 52 is Days 359-365.
    
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

    // Determine the starting alignment
    // If iterDateObj.day == 1, it's a holiday row.
    // Else, week index = Math.floor((iterDateObj.day - 2) / 7) + 1
    let lastWeekIdx = -1;

    for (let i = 0; i < maxDaysRender; i++) {
        if (iterDateObj.day === 1) {
            appendNewRow(iterDateObj.year + ' HOL');
            daysContainer.appendChild(createCell(iterDateStr));
            lastWeekIdx = -1; // reset for the new year
        } else {
            const weekIdx = Math.floor((iterDateObj.day - 2) / 7) + 1;
            if (weekIdx !== lastWeekIdx) {
                appendNewRow(iterDateObj.year + ' W' + weekIdx);
                lastWeekIdx = weekIdx;
            }
            daysContainer.appendChild(createCell(iterDateStr));
        }
        
        iterDateStr = addDays(iterDateStr, 1);
        iterDateObj = parseDate(iterDateStr);
    }
}

// Event Listeners

// Header Controls
els.currentDateDisplay.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if(parseDate(val)) {
        appState.currentDate = val;
        renderCalendar();
    } else {
        els.currentDateDisplay.value = appState.currentDate;
    }
});

els.btnIncDay.onclick = () => {
    appState.currentDate = addDays(appState.currentDate, 1);
    selectDate(appState.currentDate);
};

els.btnGasGiant.onclick = () => {
    // Increment day and forcefully record "Gas Giant Refueling" for that day
    appState.currentDate = addDays(appState.currentDate, 1);
    let note = appState.notesMap[appState.currentDate] || { zhodani: '', event: '' };
    note.event = note.event ? note.event + " <br>**Gas Giant Refueling**" : "**Gas Giant Refueling**";
    updateDateValue(appState.currentDate, note);
    selectDate(appState.currentDate);
};

els.btnJump.onclick = () => {
    // Jump distance is typically standard 1 week in hyperspace
    appState.currentDate = addDays(appState.currentDate, 7);
    let note = appState.notesMap[appState.currentDate] || { zhodani: '', event: '' };
    note.event = note.event ? note.event + " <br>**Emerged from Jump Space**" : "**Emerged from Jump Space**";
    updateDateValue(appState.currentDate, note);
    selectDate(appState.currentDate);
};

els.btnSaveToDisk.onclick = writeCampaignFile;

// Note Editor
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
        // Use marked if available, fallback if disconnected
        if (typeof marked !== 'undefined') {
            els.notePreview.innerHTML = marked.parse(els.noteEditor.value);
        } else {
            els.notePreview.innerHTML = "<p>Markdown parsing unavailable.</p>";
        }
        els.notePreview.classList.add('visible');
        els.btnTogglePreview.textContent = 'Edit Content';
    }
};

// Settings Modal
els.btnSettings.onclick = () => {
    els.filepathInput.value = appState.filepath;
    els.weeksDisplayInput.value = appState.weeksToDisplay;
    els.settingsModal.classList.remove('hidden');
};

els.closeSettingsBtn.onclick = () => {
    els.settingsModal.classList.add('hidden');
};

els.saveSettingsBtn.onclick = () => {
    appState.filepath = els.filepathInput.value.trim();
    appState.weeksToDisplay = parseInt(els.weeksDisplayInput.value, 10) || 2;
    
    localStorage.setItem('travellerFilepath', appState.filepath);
    localStorage.setItem('travellerWeeksNum', appState.weeksToDisplay);
    
    els.settingsModal.classList.add('hidden');
    readCampaignFile(); // Reload data explicitly with new path
};

// Review Modal
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
    const MAX_DAYS = 365 * 3; // sanity max loop threshold
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
// Try to boot up using local storage values
if(appState.filepath) {
    readCampaignFile();
} else {
    // Blank state init
    appState.currentDate = '1105-001';
    els.settingsModal.classList.remove('hidden'); // Force open settings
    renderCalendar();
}
