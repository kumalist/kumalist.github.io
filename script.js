/**
 * Global Configuration & Data Management
 * Google Spreadsheet ID and Tab Name
 */
const SHEET_ID = '1hTPuwTZkRnPVoo5GUUC1fhuxbscwJrLdWVG-eHPWaIM';
const SHEET_TITLE = '시트1'; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TITLE}`;

/**
 * Company Information Structure
 * Maps company codes to display names and groups
 */
const companyInfo = {
    groups: {
        old: ["b-flat", "Anova", "Furyu"],
        new: ["Daewon", "Spiralcute", "Parade", "Furyu_new"]
    },
    names: {
        "b-flat": "비플랏",
        "Anova": "지그노/에이노바",
        "Furyu": "후류",
        "Daewon": "대원미디어",
        "Spiralcute": "스파이럴큐트",
        "Parade": "퍼레이드",
        "Furyu_new": "후류"
    }
};

// State Variables
let productData = [];
let currentTab = 'owned'; 
let filters = { country: 'all', character: 'all', companyGroup: 'all', companySpecific: null };

// Load saved data from localStorage
let checkedItems = {
    owned: new Set(JSON.parse(localStorage.getItem('nongdam_owned') || '[]')),
    wish: new Set(JSON.parse(localStorage.getItem('nongdam_wish') || '[]'))
};

// DOM Elements
const listContainer = document.getElementById('listContainer');

// ============================================================
// Initialization Logic
// ============================================================

/**
 * Initialize application
 * Fetches data and renders the initial list
 */
document.addEventListener('DOMContentLoaded', async () => {
    // UI Initialization
    if (listContainer) {
        listContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">Loading Data... 🐻</div>';
    }

    // Initialize Event Listeners for Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Fetch and Render
    await fetchSheetData();
    renderCompanySubFilters();
    renderList();
    updateTabUI();
});

/**
 * Fetch data from Google Spreadsheet CSV
 */
async function fetchSheetData() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.text();
        const rows = data.split(/\r?\n/);
        
        if (rows.length < 2) throw new Error('Empty data returned from sheet');

        const headers = parseCsvRow(rows[0]);
        
        productData = rows.slice(1)
            .filter(row => row.trim() !== "")
            .map(row => {
                const values = parseCsvRow(row);
                let obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] || "";
                });
                return obj;
            });

        console.log(`[System] Successfully loaded ${productData.length} items.`);

    } catch (err) {
        console.error("[System] Data Fetch Error:", err);
        if (listContainer) {
            listContainer.innerHTML = `<div style="text-align:center; padding:50px; color:#ff7675;">
                Failed to load data.<br>
                Error: ${err.message}<br>
                Please check the Google Sheet publishing settings.
            </div>`;
        }
    }
}

/**
 * CSV Row Parser
 * Handles commas inside quotes correctly
 */
function parseCsvRow(row) {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        if (row[i] === '"') inQuotes = !inQuotes;
        else if (row[i] === ',' && !inQuotes) {
            result.push(row.substring(startValueIndex, i).replace(/^"|"$/g, '').trim());
            startValueIndex = i + 1;
        }
    }
    result.push(row.substring(startValueIndex).replace(/^"|"$/g, '').trim());
    return result;
}

// ============================================================
// Rendering & Filtering Logic
// ============================================================

function switchTab(tab) {
    currentTab = tab;
    if (tab === 'wish') document.body.classList.add('theme-wish');
    else document.body.classList.remove('theme-wish');
    updateTabUI();
    renderList();
}

function updateTabUI() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === currentTab);
    });
}

function renderList() {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    // Apply Filters
    const filteredData = productData.filter(item => {
        if (filters.country !== 'all' && item.country !== filters.country) return false;
        if (filters.character !== 'all' && item.character !== filters.character) return false;
        if (filters.companyGroup === 'old') {
            if (filters.companySpecific) { if (item.company !== filters.companySpecific) return false; }
            else { if (!companyInfo.groups.old.includes(item.company)) return false; }
        } else if (filters.companyGroup === 'new') {
            if (filters.companySpecific) { if (item.company !== filters.companySpecific) return false; }
            else { if (!companyInfo.groups.new.includes(item.company)) return false; }
        }
        return true;
    });

    if (filteredData.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">No items match your filter. 😢</div>';
        return;
    }

    // Grouping Logic
    const grouped = {};
    filteredData.forEach(item => {
        let groupKey;
        if (filters.character === 'ngn' && item.subGroup) groupKey = item.subGroup;
        else groupKey = item.group || "Others";

        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(item);
    });

    // Render Groups and Cards
    Object.keys(grouped).forEach(groupName => {
        const title = document.createElement('h3');
        title.className = 'group-title';
        title.innerText = groupName;
        listContainer.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'items-grid';
        
        grouped[groupName].forEach(item => {
            const isChecked = checkedItems[currentTab].has(item.id);
            const card = document.createElement('div');
            card.className = `item-card ${isChecked ? 'checked' : ''}`;
            card.onclick = () => toggleCheck(item.id, card);
            card.innerHTML = `
                <div class="item-img-wrapper">
                    <img src="${item.image}" alt="${item.nameKo}" loading="lazy">
                    <div class="check-overlay"></div>
                </div>
                <div class="item-info">
                    <div class="item-name">${item.nameKo}</div>
                    <div class="item-price">${item.price}</div>
                </div>
            `;
            grid.appendChild(card);
        });
        listContainer.appendChild(grid);
    });
}

function toggleCheck(id, cardElement) {
    if (checkedItems[currentTab].has(id)) { 
        checkedItems[currentTab].delete(id); 
        cardElement.classList.remove('checked'); 
    } else { 
        checkedItems[currentTab].add(id); 
        cardElement.classList.add('checked'); 
    }
    saveData();
}

function saveData() { 
    localStorage.setItem(`nongdam_${currentTab}`, JSON.stringify([...checkedItems[currentTab]])); 
}

// ============================================================
// Filter Actions (Exposed to Global Scope for HTML onclick)
// ============================================================

window.setFilter = function(type, value) {
    filters[type] = value;
    const parentWrapper = event.currentTarget.closest('.filter-item-wrapper');
    if (parentWrapper) {
        parentWrapper.querySelectorAll('.flag-btn, .char-btn, .text-btn').forEach(btn => btn.classList.remove('active'));
    }
    event.currentTarget.classList.add('active');
    renderList();
};

window.setCompanyFilter = function(group) {
    filters.companyGroup = group; 
    filters.companySpecific = null;
    
    const companyWrapper = document.querySelector('[data-type="company"]').closest('.filter-item-wrapper');
    companyWrapper.querySelectorAll('.text-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.val === group));
    
    const oldSub = document.getElementById('old-subs');
    const newSub = document.getElementById('new-subs');
    if(oldSub) oldSub.classList.toggle('show', group === 'old');
    if(newSub) newSub.classList.toggle('show', group === 'new');
    
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    renderList();
};

window.setCompanySpecific = function(companyName, btnElement) {
    if (filters.companySpecific === companyName) { 
        filters.companySpecific = null; 
        btnElement.classList.remove('active'); 
    } else { 
        filters.companySpecific = companyName; 
        btnElement.parentElement.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active')); 
        btnElement.classList.add('active'); 
    }
    renderList();
};

window.renderCompanySubFilters = function() {
    const oldContainer = document.getElementById('old-subs');
    if(oldContainer) {
        oldContainer.innerHTML = '';
        companyInfo.groups.old.forEach(comp => { 
            const btn = document.createElement('button'); 
            btn.className = 'sub-btn'; 
            btn.innerText = companyInfo.names[comp] || comp; 
            btn.onclick = (e) => setCompanySpecific(comp, e.target); 
            oldContainer.appendChild(btn); 
        });
    }

    const newContainer = document.getElementById('new-subs');
    if(newContainer) {
        newContainer.innerHTML = '';
        companyInfo.groups.new.forEach(comp => { 
            const btn = document.createElement('button'); 
            btn.className = 'sub-btn'; 
            btn.innerText = companyInfo.names[comp] || comp; 
            btn.onclick = (e) => setCompanySpecific(comp, e.target); 
            newContainer.appendChild(btn); 
        });
    }
};

window.resetFilters = function() {
    filters = { country: 'all', character: 'all', companyGroup: 'all', companySpecific: null };
    document.querySelectorAll('.flag-btn, .char-btn, .text-btn, .sub-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('button[onclick*="all"]').forEach(btn => btn.classList.add('active'));
    
    const oldSub = document.getElementById('old-subs');
    const newSub = document.getElementById('new-subs');
    if(oldSub) oldSub.classList.remove('show');
    if(newSub) newSub.classList.remove('show');
    
    renderList();
};

window.resetRecords = function() {
    const listName = currentTab === 'owned' ? 'Owned' : 'Wish';
    if (confirm(`Delete all records for [${listName} List]?`)) { 
        checkedItems[currentTab].clear(); 
        saveData(); 
        renderList(); 
        alert(`Reset complete.`); 
    }
};

// ============================================================
// Image Generation Logic
// ============================================================

/**
 * Helper: Draw Rounded Rectangle
 */
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Helper: Load Font with Timeout
 * Prevents application hang if font fails to load
 */
async function loadFontWithTimeout(name, url, timeout = 3000) {
    try {
        const font = new FontFace(name, `url(${url})`);
        
        const loadPromise = font.load().then(() => {
            document.fonts.add(font);
            return true;
        });

        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.warn("[System] Font load timed out. Using fallback.");
                resolve(false);
            }, timeout);
        });

        return await Promise.race([loadPromise, timeoutPromise]);
    } catch (e) {
        console.warn("[System] Font loading failed:", e);
        return false;
    }
}

/**
 * Main Image Generator Function
 * Triggered by the "Generate Image" button
 */
window.generateImage = async function() {
    const ids = [...checkedItems[currentTab]];
    if (ids.length === 0) return alert("No items selected!");
    
    // Get Options
    const showNameEl = document.getElementById('showName');
    const showPriceEl = document.getElementById('showPrice');
    const btn = document.getElementById('genBtn');
    
    const showName = showNameEl ? showNameEl.checked : true;
    const showPrice = showPriceEl ? showPriceEl.checked : true;
    
    const originalText = btn.innerText;
    btn.innerText = "Loading Fonts...";
    btn.disabled = true;

    try {
        // Attempt to load font (Jua)
        await loadFontWithTimeout('Jua', 'https://fonts.gstatic.com/s/jua/v14/co364W5X5_Y8yykk.woff2');
        
        btn.innerText = "Generating...";

        const items = ids.map(id => productData.find(p => p.id === id)).filter(p => p);
        const cvs = document.createElement('canvas');
        const ctx = cvs.getContext('2d');

        // Layout Configuration
        // Dynamic columns: Use count if less than 4, max 4
        const cols = Math.min(items.length, 4); 
        const rows = Math.ceil(items.length / cols);
        const cardW = 300, cardH = 420;
        const gap = 30, padding = 60;
        const headerH = 200; // Increased header height for spacing
        const cornerRadius = 40; // Rounded corners radius

        // Calculate Canvas Size
        cvs.width = padding * 2 + (cardW * cols) + (gap * (cols - 1));
        cvs.height = headerH + padding * 2 + (cardH * rows) + (gap * (rows - 1));

        // Background with Rounded Corners (Clipping)
        roundedRect(ctx, 0, 0, cvs.width, cvs.height, cornerRadius);
        ctx.clip(); 

        // Fill Background
        ctx.fillStyle = "#fdfbf7";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        // Header Background Color (Fixed to 'Owned' theme color as requested)
        ctx.fillStyle = "#aeb4d1"; 
        
        // Draw Title
        ctx.font = "bold 70px 'Jua', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; 
        const titleText = currentTab === 'owned' ? "내 농담곰 컬렉션" : "농담곰 위시리스트";
        ctx.fillText(titleText, cvs.width / 2, headerH / 2);

        // Image Loader Helper
        const loadImage = (src) => new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

        // Loop through items and draw cards
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = padding + c * (cardW + gap);
            const y = headerH + padding + r * (cardH + gap);

            // Draw Card Background
            ctx.save();
            roundedRect(ctx, x, y, cardW, cardH, 20); 
            ctx.fillStyle = "white";
            ctx.shadowColor = "rgba(0,0,0,0.1)";
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;
            ctx.fill();
            
            // Draw Card Border
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = "#eae8e4";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.clip(); // Clip for image

            // Draw Product Image
            const img = await loadImage(item.image);
            if (img) {
                const aspect = img.width / img.height;
                let dw = 260, dh = 260;
                if (aspect > 1) dh = dw / aspect; else dw = dh * aspect;
                ctx.drawImage(img, x + (cardW - dw)/2, y + 30 + (260 - dh)/2, dw, dh);
            }
            ctx.restore();

            // Draw Text
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            
            // Name
            if (showName) {
                ctx.fillStyle = "#2d3436";
                ctx.font = "bold 22px 'Gowun Dodum', sans-serif";
                const name = item.nameKo;
                const words = name.split(' ');
                let line = '', lineY = y + 320;
                for(let n = 0; n < words.length; n++) {
                    let testLine = line + words[n] + ' ';
                    if (ctx.measureText(testLine).width > 260 && n > 0) {
                        ctx.fillText(line, x + cardW/2, lineY);
                        line = words[n] + ' '; lineY += 28;
                    } else { line = testLine; }
                }
                ctx.fillText(line, x + cardW/2, lineY);
            }

            // Price
            if (showPrice) {
                ctx.fillStyle = "#a4b0be";
                ctx.font = "bold 18px 'Gowun Dodum', sans-serif";
                const priceY = showName ? y + 395 : y + 340; 
                ctx.fillText(item.price, x + cardW/2, priceY);
            }
        }

        // Trigger Download
        const link = document.createElement('a');
        link.download = `nongdam_${currentTab}_list.png`;
        link.href = cvs.toDataURL('image/png');
        link.click();

    } catch (err) {
        alert("Image Generation Error: " + err.message);
        console.error(err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};
