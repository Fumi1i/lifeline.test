// Google Maps関連の変数
let map;
let directionsService;
let directionsRenderer;
let currentPosition = null;

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
        feature3: '多言語対応',
        distance: '距離',
        duration: '所要時間',
        startNavigation: 'ナビゲーション開始'
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
        feature3: 'Multi-language',
        distance: 'Distance',
        duration: 'Duration',
        startNavigation: 'Start Navigation'
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
        feature3: '多语言支持',
        distance: '距离',
        duration: '所需时间',
        startNavigation: '开始导航'
    }
};

// 現在の言語
let currentLang = 'ja';

/**
 * Google Maps初期化コールバック
 */
function initMap() {
    console.log('Google Maps API loaded');
    // DirectionsServiceとRendererを初期化
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 6
        }
    });
}

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
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('位置情報取得成功:', currentPosition);
                
                // 逆ジオコーディングで住所を取得
                getAddressFromCoords(currentPosition);
                
                // 避難所データを取得して表示
                setTimeout(() => showShelters(), 2000);
            },
            (error) => {
                console.log('位置情報取得失敗、デモデータを使用:', error);
                // デフォルトの位置（新宿駅周辺）
                currentPosition = { lat: 35.6896, lng: 139.7006 };
                setTimeout(() => showShelters(), 2000);
            }
        );
    } else {
        console.log('位置情報APIが利用できません');
        currentPosition = { lat: 35.6896, lng: 139.7006 };
        setTimeout(() => showShelters(), 2000);
    }
}

/**
 * 座標から住所を取得
 * @param {Object} coords - 座標 {lat, lng}
 */
function getAddressFromCoords(coords) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('location-value').textContent = 
                results[0].formatted_address;
        }
    });
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
            address: '東京都新宿区西新宿4-35-4',
            lat: 35.6869,
            lng: 139.6917,
            capacity: 35,
            maxCapacity: 100 
        },
        { 
            name: '新宿スポーツセンター',
            address: '東京都新宿区大久保3-5-1',
            lat: 35.7018,
            lng: 139.7007,
            capacity: 68,
            maxCapacity: 100 
        },
        { 
            name: '新宿区役所 本庁舎',
            address: '東京都新宿区歌舞伎町1-4-1',
            lat: 35.6938,
            lng: 139.7036,
            capacity: 52,
            maxCapacity: 100 
        }
    ];

    // 各避難所までのルート情報を取得して表示
    shelters.forEach((shelter, index) => {
        calculateAndDisplayRoute(shelter, index, sheltersDiv);
    });
}

/**
 * Routes APIを使用してルートを計算し、避難所カードを作成
 * @param {Object} shelter - 避難所データ
 * @param {number} index - インデックス
 * @param {HTMLElement} container - コンテナ要素
 */
function calculateAndDisplayRoute(shelter, index, container) {
    if (!currentPosition) {
        // 位置情報がない場合はデモデータで表示
        const card = createShelterCardWithoutRoute(shelter, index);
        container.appendChild(card);
        return;
    }

    const request = {
        origin: currentPosition,
        destination: { lat: shelter.lat, lng: shelter.lng },
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.METRIC
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            const route = result.routes[0].legs[0];
            shelter.distance = route.distance.text;
            shelter.duration = route.duration.text;
            shelter.routeData = result;
            
            const card = createShelterCard(shelter, index);
            container.appendChild(card);
        } else {
            console.error('ルート取得失敗:', status);
            const card = createShelterCardWithoutRoute(shelter, index);
            container.appendChild(card);
        }
    });
}

/**
 * ルート情報ありの避難所カードを作成
 * @param {Object} shelter - 避難所データ
 * @param {number} index - インデックス
 * @returns {HTMLElement} カード要素
 */
function createShelterCard(shelter, index) {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    card.onclick = () => showRouteOnMap(shelter);
    
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
            <span>⏱️ ${shelter.duration}</span>
            <span>👥 混雑度: ${shelter.capacity}%</span>
        </div>
        <div class="capacity-bar">
            <div class="capacity-fill ${capacityClass}" style="width: ${shelter.capacity}%"></div>
        </div>
    `;
    
    return card;
}

/**
 * ルート情報なしの避難所カード作成（フォールバック）
 * @param {Object} shelter - 避難所データ
 * @param {number} index - インデックス
 * @returns {HTMLElement} カード要素
 */
function createShelterCardWithoutRoute(shelter, index) {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    card.onclick = () => openGoogleMapsWeb(shelter);
    
    let capacityClass = '';
    if (shelter.capacity > 70) {
        capacityClass = 'high';
    } else if (shelter.capacity > 40) {
        capacityClass = 'medium';
    }

    card.innerHTML = `
        <div class="shelter-name">${index + 1}. ${shelter.name}</div>
        <div class="shelter-info">
            <span>📍 ${shelter.address}</span>
            <span>👥 混雑度: ${shelter.capacity}%</span>
        </div>
        <div class="capacity-bar">
            <div class="capacity-fill ${capacityClass}" style="width: ${shelter.capacity}%"></div>
        </div>
    `;
    
    return card;
}

/**
 * 地図上にルートを表示
 * @param {Object} shelter - 避難所データ
 */
function showRouteOnMap(shelter) {
    const mapContainer = document.getElementById('map-container');
    const mapDiv = document.getElementById('map');
    const routeDetails = document.getElementById('route-details');
    
    // マップコンテナを表示
    mapContainer.style.display = 'block';
    
    // 地図を初期化
    if (!map) {
        map = new google.maps.Map(mapDiv, {
            zoom: 14,
            center: currentPosition
        });
        directionsRenderer.setMap(map);
    }
    
    // ルートを表示
    directionsRenderer.setDirections(shelter.routeData);
    
    // ルート詳細を表示
    const t = translations[currentLang];
    routeDetails.innerHTML = `
        <div class="route-info">
            <span class="route-label">${t.distance}:</span>
            <span class="route-value">${shelter.distance}</span>
        </div>
        <div class="route-info">
            <span class="route-label">${t.duration}:</span>
            <span class="route-value">${shelter.duration}</span>
        </div>
        <button class="start-navigation-btn" onclick="startNavigation('${shelter.address}')">
            🧭 ${t.startNavigation}
        </button>
    `;
    
    // 地図までスクロール
    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Google Mapsアプリでナビゲーションを開始
 * @param {string} address - 目的地の住所
 */
function startNavigation(address) {
    const destination = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank');
}

/**
 * Web版Google Mapsで開く（フォールバック）
 * @param {Object} shelter - 避難所データ
 */
function openGoogleMapsWeb(shelter) {
    const destination = encodeURIComponent(shelter.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank');
}

/**
 * 初期化処理
 */
function init() {
    console.log('アプリケーション初期化');
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
