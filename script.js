// Google Maps関連の変数
let map;
let directionsService;
let directionsRenderer;
let currentPosition = null;
let disasterLocation = null; // 災害発生地点

// 多言語対応の翻訳データ
const translations = {
    ja: {
        tagline: 'あなたの命を守る避難誘導サービス',
        statusTitle: '⚠️ 警戒レベル3',
        statusInfo: '地震発生の可能性があります。避難準備を推奨します。',
        locationLabel: '現在地',
        btnText: '避難開始',
        loadingText: '最適な避難所を検索中...',
        disasterTitle: '🔥 災害発生地点',
        disasterInfo: '情報取得中...',
        showRoute: '🗺️ ルートを表示',
        distance: '距離',
        duration: '所要時間',
        fromDisaster: '災害地点から'
    },
    en: {
        tagline: 'Emergency Evacuation Guidance Service',
        statusTitle: '⚠️ Alert Level 3',
        statusInfo: 'Earthquake possible. Evacuation preparation recommended.',
        locationLabel: 'Current Location',
        btnText: 'Start Evacuation',
        loadingText: 'Finding optimal shelters...',
        disasterTitle: '🔥 Disaster Location',
        disasterInfo: 'Loading...',
        showRoute: '🗺️ Show Route',
        distance: 'Distance',
        duration: 'Duration',
        fromDisaster: 'From disaster site'
    },
    zh: {
        tagline: '守护您生命的避难引导服务',
        statusTitle: '⚠️ 警戒级别3',
        statusInfo: '可能发生地震。建议准备避难。',
        locationLabel: '当前位置',
        btnText: '开始避难',
        loadingText: '正在搜索最佳避难所...',
        disasterTitle: '🔥 灾害发生地点',
        disasterInfo: '获取中...',
        showRoute: '🗺️ 显示路线',
        distance: '距离',
        duration: '所需时间',
        fromDisaster: '距离灾害点'
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
 */
function setLanguage(lang) {
    currentLang = lang;
    
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const t = translations[lang];
    document.getElementById('tagline').textContent = t.tagline;
    document.getElementById('status-title').textContent = t.statusTitle;
    document.getElementById('status-info').textContent = t.statusInfo;
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
    const disasterInfo = document.getElementById('disaster-info');
    
    shelterList.classList.add('active');
    loading.style.display = 'block';
    sheltersDiv.innerHTML = '';

    // 現在位置を取得
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('現在位置取得成功:', currentPosition);
                
                // 住所を取得
                getAddressFromCoords(currentPosition, 'location-value');
                
                // 災害地点を設定（デモ：現在地から500m離れた地点）
                // 実際のアプリでは災害情報APIから取得
                disasterLocation = {
                    lat: currentPosition.lat + 0.005,
                    lng: currentPosition.lng + 0.005
                };
                
                // 災害地点の情報を表示
                disasterInfo.style.display = 'block';
                getAddressFromCoords(disasterLocation, 'disaster-location');
                calculateDistanceToDisaster();
                
                // 避難所データを取得
                setTimeout(() => showShelters(), 2000);
            },
            (error) => {
                console.log('位置情報取得失敗、デモデータを使用:', error);
                // デフォルト位置（新宿駅周辺）
                currentPosition = { lat: 35.6896, lng: 139.7006 };
                disasterLocation = { lat: 35.6946, lng: 139.7056 };
                
                disasterInfo.style.display = 'block';
                document.getElementById('disaster-location').textContent = '東京都新宿区新宿3丁目';
                document.getElementById('disaster-distance').textContent = '災害地点まで約600m';
                
                setTimeout(() => showShelters(), 2000);
            }
        );
    } else {
        console.log('位置情報APIが利用できません');
        currentPosition = { lat: 35.6896, lng: 139.7006 };
        disasterLocation = { lat: 35.6946, lng: 139.7056 };
        
        disasterInfo.style.display = 'block';
        document.getElementById('disaster-location').textContent = '東京都新宿区新宿3丁目';
        document.getElementById('disaster-distance').textContent = '災害地点まで約600m';
        
        setTimeout(() => showShelters(), 2000);
    }
}

/**
 * 座標から住所を取得
 */
function getAddressFromCoords(coords, elementId) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById(elementId).textContent = results[0].formatted_address;
        }
    });
}

/**
 * 災害地点までの距離を計算
 */
function calculateDistanceToDisaster() {
    if (!currentPosition || !disasterLocation) return;
    
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [currentPosition],
        destinations: [disasterLocation],
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.METRIC
    }, (response, status) => {
        if (status === 'OK') {
            const distance = response.rows[0].elements[0].distance.text;
            const t = translations[currentLang];
            document.getElementById('disaster-distance').textContent = 
                `${t.fromDisaster}: ${distance}`;
        }
    });
}

/**
 * 避難所リストを表示
 */
function showShelters() {
    const loading = document.getElementById('loading');
    const sheltersDiv = document.getElementById('shelters');
    
    loading.style.display = 'none';

    // デモ用避難所データ
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
    if (!currentPosition) {
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
    
    // 現在位置があればそれを使用、なければ住所
    if (currentPosition) {
        origin = `${currentPosition.lat},${currentPosition.lng}`;
    } else {
        origin = encodeURIComponent(document.getElementById('location-value').textContent);
    }
    
    const destination = encodeURIComponent(shelter.address);
    
    // Google Maps URLを生成
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    
    // 新しいタブで開く
    window.open(url, '_blank');
}

/**
 * 初期化処理
 */
function init() {
    console.log('Lifeline アプリケーション起動');
    
    // デモ用の初期位置表示
    setTimeout(() => {
        document.getElementById('location-value').textContent = '位置情報を取得中...';
    }, 100);
}

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}