// Google Maps関連の変数
let directionsService;
let currentPosition = null;

// 多言語対応の翻訳データ
const translations = {
    ja: {
        tagline: 'あなたの命を守る避難誘導サービス',
        locationLabel: '現在地',
        btnText: '避難開始',
        loadingText: '最適な避難所を検索中...',
        showRoute: '🗺️ ルートを表示',
        distance: '距離',
        duration: '所要時間',
        locationLoading: '位置情報を取得中...'
    },
    en: {
        tagline: 'Emergency Evacuation Guidance Service',
        locationLabel: 'Current Location',
        btnText: 'Start Evacuation',
        loadingText: 'Finding optimal shelters...',
        showRoute: '🗺️ Show Route',
        distance: 'Distance',
        duration: 'Duration',
        locationLoading: 'Getting location...'
    },
    zh: {
        tagline: '守护您生命的避难引导服务',
        locationLabel: '当前位置',
        btnText: '开始避难',
        loadingText: '正在搜索最佳避难所...',
        showRoute: '🗺️ 显示路线',
        distance: '距离',
        duration: '所需时间',
        locationLoading: '正在获取位置...'
    }
};

// 現在の言語
let currentLang = 'ja';

/**
 * Google Maps初期化コールバック
 */
function initMap() {
    console.log('Google Maps API loaded');
    directionsService = new google.maps.DirectionsService();
    
    // 初期位置情報を取得
    getCurrentLocation();
}

/**
 * 現在位置を取得
 */
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('現在位置取得成功:', currentPosition);
                getAddressFromCoords(currentPosition);
            },
            (error) => {
                console.log('位置情報取得失敗:', error);
                // デフォルト位置（新宿駅周辺）
                currentPosition = { lat: 35.6896, lng: 139.7006 };
                document.getElementById('location-value').textContent = '東京都新宿区西新宿';
            }
        );
    } else {
        console.log('位置情報APIが利用できません');
        currentPosition = { lat: 35.6896, lng: 139.7006 };
        document.getElementById('location-value').textContent = '東京都新宿区西新宿';
    }
}

/**
 * 座標から住所を取得
 */
function getAddressFromCoords(coords) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('location-value').textContent = 
                results[0].formatted_address;
        } else {
            document.getElementById('location-value').textContent = 
                `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
        }
    });
}

/**
 * 言語を切り替える関数
 */
function setLanguage(lang) {
    currentLang = lang;
    
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const t = translations[lang];
    document.getElementById('tagline').textContent = t.tagline;
    document.getElementById('location-label').textContent = t.locationLabel;
    document.getElementById('btn-text').textContent = t.btnText;
    document.getElementById('loading-text').textContent = t.loadingText;
}

/**
 * 避難開始ボタンが押された時の処理
 */
function startEvacuation() {
    const shelterList = document.getElementById('shelter-list');
    const loading = document.getElementById('loading');
    const sheltersDiv = document.getElementById('shelters');
    
    shelterList.classList.add('active');
    loading.style.display = 'block';
    sheltersDiv.innerHTML = '';

    // 位置情報を再取得
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('避難開始：現在位置', currentPosition);
                
                // 避難所データを表示
                setTimeout(() => showShelters(), 1500);
            },
            (error) => {
                console.log('位置情報取得失敗、デフォルト位置を使用:', error);
                if (!currentPosition) {
                    currentPosition = { lat: 35.6896, lng: 139.7006 };
                }
                setTimeout(() => showShelters(), 1500);
            }
        );
    } else {
        if (!currentPosition) {
            currentPosition = { lat: 35.6896, lng: 139.7006 };
        }
        setTimeout(() => showShelters(), 1500);
    }
}

/**
 * 避難所リストを表示
 */
function showShelters() {
    const loading = document.getElementById('loading');
    const sheltersDiv = document.getElementById('shelters');
    
    loading.style.display = 'none';

    // デモ用避難所データ
    // 実際のアプリでは、バックエンドAPIや避難所データベースから取得
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

    // 各避難所のルート情報を計算
    shelters.forEach((shelter, index) => {
        calculateAndDisplayRoute(shelter, index, sheltersDiv);
    });
}

/**
 * ルート計算して避難所カードを作成
 */
function calculateAndDisplayRoute(shelter, index, container) {
    if (!currentPosition || !directionsService) {
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
 * ルート情報ありの避難所カード作成
 */
function createShelterCard(shelter, index) {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    
    let capacityClass = '';
    if (shelter.capacity > 70) capacityClass = 'high';
    else if (shelter.capacity > 40) capacityClass = 'medium';

    const t = translations[currentLang];

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
        <button class="show-route-btn" onclick='openGoogleMapsRoute(${JSON.stringify(shelter)})'>
            ${t.showRoute}
        </button>
    `;
    
    return card;
}

/**
 * ルート情報なしの避難所カード作成
 */
function createShelterCardWithoutRoute(shelter, index) {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    
    let capacityClass = '';
    if (shelter.capacity > 70) capacityClass = 'high';
    else if (shelter.capacity > 40) capacityClass = 'medium';

    const t = translations[currentLang];

    card.innerHTML = `
        <div class="shelter-name">${index + 1}. ${shelter.name}</div>
        <div class="shelter-info">
            <span>📍 ${shelter.address}</span>
            <span>👥 混雑度: ${shelter.capacity}%</span>
        </div>
        <div class="capacity-bar">
            <div class="capacity-fill ${capacityClass}" style="width: ${shelter.capacity}%"></div>
        </div>
        <button class="show-route-btn" onclick='openGoogleMapsRoute(${JSON.stringify(shelter)})'>
            ${t.showRoute}
        </button>
    `;
    
    return card;
}

/**
 * Google Mapsでルートを表示（新しいタブで開く）
 */
function openGoogleMapsRoute(shelter) {
    let origin = '';
    
    // 現在位置があればそれを使用
    if (currentPosition) {
        origin = `${currentPosition.lat},${currentPosition.lng}`;
    } else {
        origin = encodeURIComponent(document.getElementById('location-value').textContent);
    }
    
    const destination = encodeURIComponent(shelter.address);
    
    // Google Maps URLを生成（徒歩ルート）
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    
    // 新しいタブで開く
    window.open(url, '_blank');
}

/**
 * 初期化処理
 */
function init() {
    console.log('Lifeline アプリケーション起動');
    const t = translations[currentLang];
    document.getElementById('location-value').textContent = t.locationLoading;
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}