// ============================================================
// 1. 기본 설정 및 데이터
// ============================================================
const SHEET_ID = '1hTPuwTZkRnPVoo5GUUC1fhuxbscwJrLdWVG-eHPWaIM';
const SHEET_TITLE = '시트1'; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TITLE}`;

// 회사 정보 데이터
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

// 상태 변수들
let productData = [];
let currentTab = 'owned'; 
let filters = { country: 'all', character: 'all', companyGroup: 'all', companySpecific: null };

// 저장된 체크박스 불러오기 (없으면 빈 리스트)
let checkedItems = {
    owned: new Set(JSON.parse(localStorage.getItem('nongdam_owned') || '[]')),
    wish: new Set(JSON.parse(localStorage.getItem('nongdam_wish') || '[]'))
};

const listContainer = document.getElementById('listContainer');

// ============================================================
// 2. 초기화 및 데이터 로드 (여기가 제일 중요!)
// ============================================================
async function init() {
    // 로딩 메시지 띄우기
    if(listContainer) {
        listContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">🐻 농담곰 데이터 불러오는 중...</div>';
    }
    
    await fetchSheetData(); // 데이터 가져오기
    
    // 데이터 로드 후 화면 그리기
    renderCompanySubFilters();
    renderList();
    updateTabUI();
}

async function fetchSheetData() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('구글 시트 연결 실패');
        
        const data = await response.text();
        const rows = data.split(/\r?\n/); // 줄바꿈으로 나누기
        
        if (rows.length < 2) {
            throw new Error('데이터가 비어있습니다.');
        }

        const headers = parseCsvRow(rows[0]); // 첫 줄은 제목(헤더)
        
        // 데이터 파싱
        productData = rows.slice(1)
            .filter(row => row.trim() !== "") // 빈 줄 제거
            .map(row => {
                const values = parseCsvRow(row);
                let obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] || "";
                });
                return obj;
            });

        console.log(`성공! 총 ${productData.length}개의 데이터를 가져왔어!`);

    } catch (err) {
        console.error("데이터 로드 에러:", err);
        if(listContainer) {
            listContainer.innerHTML = `<div style="text-align:center; padding:50px; color:#ff7675;">
                데이터를 가져오지 못했어 😢<br>
                1. 구글 시트가 [웹에 게시] 되었는지 확인해줘.<br>
                2. 오류 내용: ${err.message}
            </div>`;
        }
    }
}

// CSV 파싱 함수 (따옴표, 쉼표 처리)
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
// 3. 화면 렌더링 및 필터 로직
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
    
    // 필터링
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

    // 데이터 없음 처리
    if (filteredData.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">해당하는 농담곰이 없어요 😢</div>';
        return;
    }

    // 그룹화 및 카드 생성
    const grouped = {};
    filteredData.forEach(item => {
        let groupKey;
        if (filters.character === 'ngn' && item.subGroup) groupKey = item.subGroup;
        else groupKey = item.group || "기타"; // 그룹 없으면 기타 처리

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

// 필터 버튼 클릭 이벤트들
function setFilter(type, value) {
    filters[type] = value;
    const parentWrapper = event.currentTarget.closest('.filter-item-wrapper');
    if (parentWrapper) {
        parentWrapper.querySelectorAll('.flag-btn, .char-btn, .text-btn').forEach(btn => btn.classList.remove('active'));
    }
    event.currentTarget.classList.add('active');
    renderList();
}

function setCompanyFilter(group) {
    filters.companyGroup = group; filters.companySpecific = null;
    const companyWrapper = document.querySelector('[data-type="company"]').closest('.filter-item-wrapper');
    companyWrapper.querySelectorAll('.text-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.val === group));
    
    const oldSub = document.getElementById('old-subs');
    const newSub = document.getElementById('new-subs');
    if(oldSub) oldSub.classList.toggle('show', group === 'old');
    if(newSub) newSub.classList.toggle('show', group === 'new');
    
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
}

function resetFilters() {
    filters = { country: 'all', character: 'all', companyGroup: 'all', companySpecific: null };
    document.querySelectorAll('.flag-btn, .char-btn, .text-btn, .sub-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('button[onclick*="all"]').forEach(btn => btn.classList.add('active'));
    
    const oldSub = document.getElementById('old-subs');
    const newSub = document.getElementById('new-subs');
    if(oldSub) oldSub.classList.remove('show');
    if(newSub) newSub.classList.remove('show');
    
    renderList();
}

function resetRecords() {
    const listName = currentTab === 'owned' ? '보유' : '위시';
    if (confirm(`[${listName} 리스트]의 체크 기록을 모두 삭제하시겠습니까?`)) { 
        checkedItems[currentTab].clear(); 
        saveData(); 
        renderList(); 
        alert(`초기화되었습니다.`); 
    }
}

// ============================================================
// 4. 이미지 생성 로직 (안전벨트 추가 버전)
// ============================================================

// 둥근 사각형 그리기 헬퍼
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

// 폰트 로딩 함수 (타임아웃 기능 추가 - 3초 지나면 무시)
async function loadFontWithTimeout(name, url, timeout = 3000) {
    const font = new FontFace(name, `url(${url})`);
    
    const loadPromise = font.load().then(() => {
        document.fonts.add(font);
        return true;
    });

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            console.warn("폰트 로딩 시간 초과! 기본 폰트를 사용합니다.");
            resolve(false);
        }, timeout);
    });

    return Promise.race([loadPromise, timeoutPromise]);
}

// 메인 이미지 생성 함수
async function generateImage() {
    const ids = [...checkedItems[currentTab]];
    if (ids.length === 0) return alert("선택된 인형이 없어요!");
    
    // HTML 요소 가져오기 (없을 경우 대비)
    const showNameEl = document.getElementById('showName');
    const showPriceEl = document.getElementById('showPrice');
    const btn = document.getElementById('genBtn');
    
    const showName = showNameEl ? showNameEl.checked : true;
    const showPrice = showPriceEl ? showPriceEl.checked : true;
    
    const originalText = btn.innerText;
    btn.innerText = "폰트 로딩 중...";
    btn.disabled = true;

    try {
        // 폰트 로딩 시도 (실패하거나 오래 걸려도 멈추지 않음)
        await loadFontWithTimeout('Jua', 'https://fonts.gstatic.com/s/jua/v14/co364W5X5_Y8yykk.woff2');
        
        btn.innerText = "이미지 생성 중...";

        const items = ids.map(id => productData.find(p => p.id === id)).filter(p => p);
        const cvs = document.createElement('canvas');
        const ctx = cvs.getContext('2d');

        // 디자인 설정
        const cols = Math.min(items.length, 4); 
        const rows = Math.ceil(items.length / cols);
        const cardW = 300, cardH = 420;
        const gap = 30, padding = 60;
        const headerH = 200; 
        const cornerRadius = 40;

        // 캔버스 크기 계산
        cvs.width = padding * 2 + (cardW * cols) + (gap * (cols - 1));
        cvs.height = headerH + padding * 2 + (cardH * rows) + (gap * (rows - 1));

        // 전체 라운드 처리
        roundedRect(ctx, 0, 0, cvs.width, cvs.height, cornerRadius);
        ctx.clip(); 

        // 배경색
        ctx.fillStyle = "#fdfbf7";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        // 테마 색상 (보유 테마 고정)
        ctx.fillStyle = "#aeb4d1"; 
        
        // 타이틀 텍스트
        ctx.font = "bold 70px 'Jua', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; 
        const titleText = currentTab === 'owned' ? "내 농담곰 컬렉션" : "농담곰 위시리스트";
        ctx.fillText(titleText, cvs.width / 2, headerH / 2);

        // 이미지 로드 헬퍼
        const loadImage = (src) => new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

        // 카드 루프
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = padding + c * (cardW + gap);
            const y = headerH + padding + r * (cardH + gap);

            // 카드 그리기
            ctx.save();
            roundedRect(ctx, x, y, cardW, cardH, 20); 
            ctx.fillStyle = "white";
            ctx.shadowColor = "rgba(0,0,0,0.1)";
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;
            ctx.fill();
            
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = "#eae8e4";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.clip();

            const img = await loadImage(item.image);
            if (img) {
                const aspect = img.width / img.height;
                let dw = 260, dh = 260;
                if (aspect > 1) dh = dw / aspect; else dw = dh * aspect;
                ctx.drawImage(img, x + (cardW - dw)/2, y + 30 + (260 - dh)/2, dw, dh);
            }
            ctx.restore();

            // 텍스트 설정
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            
            // 이름
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

            // 가격
            if (showPrice) {
                ctx.fillStyle = "#a4b0be";
                ctx.font = "bold 18px 'Gowun Dodum', sans-serif";
                const priceY = showName ? y + 395 : y + 340; 
                ctx.fillText(item.price, x + cardW/2, priceY);
            }
        }

        // 다운로드
        const link = document.createElement('a');
        link.download = `nongdam_${currentTab}_list.png`;
        link.href = cvs.toDataURL('image/png');
        link.click();

    } catch (err) {
        alert("오류 발생: " + err.message);
        console.error(err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 탭 버튼 이벤트 등록
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// 시작!
init();
