// script.js 최종 수정본

let currentTab = 'owned'; 
let filters = { country: 'all', character: 'all', companyGroup: 'all', companySpecific: null };

let checkedItems = {
    owned: new Set(JSON.parse(localStorage.getItem('nongdam_owned') || '[]')),
    wish: new Set(JSON.parse(localStorage.getItem('nongdam_wish') || '[]'))
};

const listContainer = document.getElementById('listContainer');

function init() {
    renderCompanySubFilters();
    renderList();
    updateTabUI();
}

function switchTab(tab) {
    currentTab = tab;
    
    // 테마 적용 (CSS 변수 변경됨 -> 햄버거 버튼, 로고, 뱃지 색상 자동 변경)
    if (tab === 'wish') { 
        document.body.classList.add('theme-wish'); 
    } else { 
        document.body.classList.remove('theme-wish'); 
    }
    
    updateTabUI();
    renderList();

    // 저장 옵션의 타이틀 변경
    const titleInput = document.getElementById('customTitle');
    if(titleInput) {
        titleInput.value = tab === 'owned' ? "농담곰 인형 보유 리스트" : "농담곰 인형 위시 리스트";
    }

    // ✨ [추가] 모바일 헤더 뱃지 텍스트 변경 ✨
    const badge = document.getElementById('mobileModeBadge');
    if (badge) {
        badge.innerText = tab === 'owned' ? "보유" : "위시";
    }
}
function updateTabUI() {
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.tab === currentTab); });
}

function renderList() {
    listContainer.innerHTML = '';
    const filteredData = getFilteredData(); // 헬퍼 함수 사용

    if (filteredData.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">해당하는 농담곰이 없어요 😢</div>';
        return;
    }

    const grouped = {};
    filteredData.forEach(item => {
        let groupKey;
        if (filters.character === 'ngn' && item.subGroup) {
            groupKey = item.subGroup;
        } else {
            groupKey = item.group;
        }

        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(item);
    });

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

// 필터링된 데이터만 반환하는 함수 (화면 렌더링 & 현재 페이지 저장용)
function getFilteredData() {
    return productData.filter(item => {
        if (filters.country !== 'all' && item.country !== filters.country) return false;
        if (filters.character !== 'all' && item.character !== filters.character) return false;
        if (filters.companyGroup === 'old') {
            if (filters.companySpecific) { if (item.company !== filters.companySpecific) return false; } else { if (!companyInfo.groups.old.includes(item.company)) return false; }
        } else if (filters.companyGroup === 'new') {
            if (filters.companySpecific) { if (item.company !== filters.companySpecific) return false; } else { if (!companyInfo.groups.new.includes(item.company)) return false; }
        }
        return true;
    });
}

function toggleCheck(id, cardElement) {
    if (checkedItems[currentTab].has(id)) { checkedItems[currentTab].delete(id); cardElement.classList.remove('checked'); } else { checkedItems[currentTab].add(id); cardElement.classList.add('checked'); }
    saveData();
}

function saveData() { localStorage.setItem(`nongdam_${currentTab}`, JSON.stringify([...checkedItems[currentTab]])); }

function setFilter(type, value) {
    filters[type] = value;
    const parentWrapper = event.currentTarget.closest('.filter-item-wrapper');
    if (parentWrapper) {
        parentWrapper.querySelectorAll('.flag-btn, .char-btn, .text-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    event.currentTarget.classList.add('active');
    renderList();
}

function setCompanyFilter(group) {
    filters.companyGroup = group;
    filters.companySpecific = null;
    const companyWrapper = document.querySelector('[data-type="company"]').closest('.filter-item-wrapper');
    companyWrapper.querySelectorAll('.text-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === group);
    });
    document.getElementById('old-subs').classList.toggle('show', group === 'old');
    document.getElementById('new-subs').classList.toggle('show', group === 'new');
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    renderList();
}

function setCompanySpecific(companyName, btnElement) {
    if (filters.companySpecific === companyName) {
        filters.companySpecific = null;
        btnElement.classList.remove('active');
    } else {
        filters.companySpecific = companyName;
        btnElement.parentElement.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }
    renderList();
}

function renderCompanySubFilters() {
    const oldContainer = document.getElementById('old-subs');
    companyInfo.groups.old.forEach(comp => { const btn = document.createElement('button'); btn.className = 'sub-btn'; btn.innerText = companyInfo.names[comp] || comp; btn.onclick = () => setCompanySpecific(comp, btn); oldContainer.appendChild(btn); });
    const newContainer = document.getElementById('new-subs');
    companyInfo.groups.new.forEach(comp => { const btn = document.createElement('button'); btn.className = 'sub-btn'; btn.innerText = companyInfo.names[comp] || comp; btn.onclick = () => setCompanySpecific(comp, btn); newContainer.appendChild(btn); });
}

function resetFilters() {
    filters = { country: 'all', character: 'all', companyGroup: 'all', companySpecific: null };
    document.querySelectorAll('.flag-btn, .char-btn, .text-btn, .sub-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('button[onclick*="all"]').forEach(btn => btn.classList.add('active'));
    document.getElementById('old-subs').classList.remove('show');
    document.getElementById('new-subs').classList.remove('show');
    renderList();
}

function resetRecords() {
    const listName = currentTab === 'owned' ? '보유' : '위시';
    if (confirm(`${listName} 리스트의 체크 기록을 모두 삭제하시겠습니까?`)) {
        checkedItems[currentTab].clear();
        saveData();
        renderList();
        alert(`${listName} 리스트를 초기화했습니다.`);
    }
}

function toggleNickCheck() {
    const nickInput = document.getElementById('nickInput');
    const nickCheck = document.getElementById('showNick');
    
    if (nickInput.value.trim().length > 0) {
        nickCheck.checked = true;
    } else {
        nickCheck.checked = false;
    }
}

// [수정된 이미지 생성 기능]
// mode: 'all' (전체 체크항목) or 'current' (현재 필터링된 항목 중 체크된 것)
// ----------------------------------------------------------------------
async function generateImage(mode = 'all') {
    let sourceData = [];

    if (mode === 'all') {
        // [이미지 저장] 버튼: 전체 데이터에서 체크된 것 찾기
        sourceData = productData;
    } else {
        // [현재 페이지 저장] 버튼: 현재 필터링된 데이터 중에서 찾기
        sourceData = getFilteredData();
    }

    // 소스 데이터 중에서 '체크된' 아이템만 필터링 (순서는 소스 데이터 순서 유지)
    const items = sourceData.filter(p => checkedItems[currentTab].has(p.id));

    if (items.length === 0) return alert("선택된 인형이 없습니다.");
    
    await document.fonts.ready;

    const showName = document.getElementById('showName').checked;
    const showPrice = document.getElementById('showPrice').checked;
    const showNick = document.getElementById('showNick').checked;
    const showTitle = document.getElementById('showTitle').checked;
    
    const customTitle = document.getElementById('customTitle').value;
    const nickText = document.getElementById('nickInput').value;

    // 버튼 텍스트 잠시 변경 (어떤 버튼을 눌렀는지 확인)
    const btnId = mode === 'all' ? 'genBtnAll' : 'genBtnCurrent';
    const btn = document.getElementById(btnId);
    const originalText = btn.innerText;
    btn.innerText = "생성 중...";
    btn.disabled = true;

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    
    const maxCols = 4;
    const cols = items.length < maxCols ? items.length : maxCols;
    
    const cardW = 300, cardH = 420;
    const gap = 30, padding = 60;
    
    const headerH = 160; 
    const titleY = 60;   
    const nickY = 115;   

    const rows = Math.ceil(items.length / cols);

    cvs.width = padding * 2 + (cardW * cols) + (gap * (cols - 1));
    cvs.height = headerH + padding + (cardH * rows) + (gap * (rows - 1));

    ctx.fillStyle = "#fdfbf7";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    if (showTitle) {
        const titleColor = "#aeb4d1"; 
        ctx.fillStyle = titleColor;
        ctx.font = "bold 45px 'Paperlogy', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; 
        ctx.fillText(customTitle, cvs.width / 2, titleY);
    }

    if (showNick && nickText.trim() !== "") {
        ctx.font = "bold 24px 'Paperlogy', sans-serif"; 
        ctx.fillStyle = "#636e72"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nickText, cvs.width / 2, nickY);
    }

    const loadImage = (src) => new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const c = i % cols; 
        const r = Math.floor(i / cols);
        const x = padding + c * (cardW + gap);
        const y = headerH + r * (cardH + gap); 

        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 15;
        
        roundRect(ctx, x, y, cardW, cardH, 20);
        ctx.fill();
        
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#eae8e4";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, cardW, cardH, 20);
        ctx.stroke();

        const img = await loadImage(item.image);
        if (img) {
            const aspect = img.width / img.height;
            let dw = 260, dh = 260;
            if (aspect > 1) dh = dw / aspect; else dw = dh * aspect;
            ctx.drawImage(img, x + (cardW - dw)/2, y + 20 + (260 - dh)/2, dw, dh);
        }

        if (showName) {
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic"; 
            ctx.fillStyle = "#2d3436";
            ctx.font = "bold 22px 'Gowun Dodum', sans-serif";
            
            const name = item.nameKo;
            const words = name.split(' ');
            let line = '', lineY = y + 310;
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > 260 && n > 0) {
                    ctx.fillText(line, x + cardW/2, lineY);
                    line = words[n] + ' '; lineY += 28;
                } else { line = testLine; }
            }
            ctx.fillText(line, x + cardW/2, lineY);
        }

        if (showPrice) {
            ctx.fillStyle = "#a4b0be";
            ctx.font = "bold 18px 'Gowun Dodum', sans-serif";
            const priceY = showName ? y + 390 : y + 330; 
            ctx.fillText(item.price, x + cardW/2, priceY);
        }
    }

    const link = document.createElement('a');
    link.download = `nongdam_${currentTab}_list.jpg`;
    link.href = cvs.toDataURL('image/jpeg');
    link.click();
    btn.innerText = originalText;
    btn.disabled = false;
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

init();

// 모바일 사이드바 토글 함수
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}