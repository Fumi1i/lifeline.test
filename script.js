// 多言語対応の翻訳データ
const translations = {
    ja: {
        tagline: 'あなたの命を守る避難誘導サービス',
        statusTitle: '⚠️ 警戒レベル3',
        statusInfo: '地震発生の可能性があります。避難準備を推奨します。',
        locationLabel: '現在地',
        btnText: '避難開始',
        loadingText: '最適な避難所を検索中...',
        feature1: 'AIによる最適化',
        feature2: 'リアルタイムルート',
        feature3: '多言語対応'
    },
    en: {
        tagline: 'Emergency Evacuation Guidance Service',
        statusTitle: '⚠️ Alert Level 3',
        statusInfo: 'Earthquake possible. Evacuation preparation recommended.',
        locationLabel: 'Current Location',
        btnText: 'Start Evacuation',
        loadingText: 'Finding optimal shelters...',
        feature1: 'AI Optimized',
        feature2: 'Real-time Routes',
        feature3: 'Multi-language'
    },
    zh: {
        tagline: '守护您生命的避难引导服务',
        statusTitle: '⚠️ 警戒级别3',
        statusInfo: '可能发生地震。建议准备避难。',
        locationLabel: '当前位置',
        btnText: '开始避难',
        loadingText: '正在搜索最佳避难所...',
        feature1: 'AI优化',
        feature2: '实时路线',
        feature3: '多语言支持'
    }
};

// 現在の言語
let currentLang = 'ja';

/**
 * 言語を切り替える関数
 * @param {string} lang - 言語コード ('ja', 'en', 'zh')
 */
function setLanguage(lang) {
    currentLang = lang;
    
    // ボタンのアクティブ状態を更新
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 翻訳を適用
    const t = translations[lang];
    document.getElementById('tagline').textContent = t.tagline;
    document.getElementById('status-title').textContent = t.statusTitle;
    document.getElementById('status-info').textContent = t.statusInfo;
    document.getElementById('location-label').textContent = t.locationLabel;
    document.getElementById('btn-text').textContent = t.btnText;
    document.getElementById('loading-text').textContent = t.loadingText;
    document.getElementById('feature1').textContent = t.feature1;
    document.getElementById('feature2').textContent = t.feature2;
    document.getElementById('feature3').textContent = t.feature3;
}

/**
 * 避難開始ボタンが押された時の処理
 */
function startEvacuation() {
    const shelterList = document.getElementById('shelter-list');
    const loading = document.getElementById('loading');
    const sheltersDiv = document.getElementById('shelters');
    
    // 避難所リストを表示
    shelterList.classList.add('active');
    loading.style.display = 'block';
    sheltersDiv.innerHTML = '';

    // 位置情報を取得
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('位置情報取得成功:', position.coords);
                // 実際のアプリでは、ここでバックエンドAPIに位置情報を送信
                // 例: fetchShelters(position.coords.latitude, position.coords.longitude);
                setTimeout(() => showShelters(), 2000);
            },
            (error) => {
                console.log('位置情報取得失敗、デモデータを使用:', error);
                setTimeout(() => showShelters(), 2000);
            }
        );
    } else {
        console.log('位置情報APIが利用できません');
        setTimeout(() => showShelters(), 2000);
    }
}

/**
 * 避難所リストを表示する関数
 */
function showShelters() {
    const loading = document.getElementById('loading');
    const sheltersDiv = document.getElementById('shelters');
    
    loading.style.display = 'none';

    // デモ用の避難所データ
    // 実際のアプリでは、バックエンドAPIから取得
    const shelters = [
        { 
            name: '新宿区立 西新宿小学校', 
            distance: '450m', 
            time: '6分', 
            capacity: 35, 
            maxCapacity: 100 
        },
        { 
            name: '新宿スポーツセンター', 
            distance: '820m', 
            time: '11分', 
            capacity: 68, 
            maxCapacity: 100 
        },
        { 
            name: '新宿区役所 本庁舎', 
            distance: '1.2km', 
            time: '16分', 
            capacity: 52, 
            maxCapacity: 100 
        }
    ];

    // 各避難所のカードを作成
    shelters.forEach((shelter, index) => {
        const card = createShelterCard(shelter, index);
        sheltersDiv.appendChild(card);
    });
}

/**
 * 避難所カードのDOM要素を作成
 * @param {Object} shelter - 避難所データ
 * @param {number} index - インデックス
 * @returns {HTMLElement} カード要素
 */
function createShelterCard(shelter, index) {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    card.onclick = () => openGoogleMaps(shelter);
    
    // 混雑度に応じたクラスを決定
    let capacityClass = '';
    if (shelter.capacity > 70) {
        capacityClass = 'high';
    } else if (shelter.capacity > 40) {
        capacityClass = 'medium';
    }

    card.innerHTML = `
        <div class="shelter-name">${index + 1}. ${shelter.name}</div>
        <div class="shelter-info">
            <span>📏 ${shelter.distance}</span>
            <span>⏱️ 徒歩${shelter.time}</span>
            <span>👥 混雑度: ${shelter.capacity}%</span>
        </div>
        <div class="capacity-bar">
            <div class="capacity-fill ${capacityClass}" style="width: ${shelter.capacity}%"></div>
        </div>
    `;
    
    return card;
}

/**
 * Google Mapsで避難所へのルートを開く
 * @param {Object} shelter - 避難所データ
 */
function openGoogleMaps(shelter) {
    const destination = encodeURIComponent(shelter.name + ' 東京都新宿区');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank');
}

/**
 * 初期化処理
 */
function init() {
    // 位置情報の初期表示をシミュレート
    setTimeout(() => {
        document.getElementById('location-value').textContent = '東京都新宿区西新宿';
    }, 500);
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}