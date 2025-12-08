// ==========================================
// ★設定項目 (あなたの環境に合わせています)
// ==========================================
const COGNITO_DOMAIN = "https://us-west-2y4blf7hds.auth.us-west-2.amazoncognito.com";
const CLIENT_ID = "6r14oe2o88f4c7ib0eb33kr16r";
const REDIRECT_URI = "https://d3clw2e825frde.cloudfront.net";
// 最後に /guidance を付けたURL
const API_URL = "https://z991hwe97l.execute-api.us-west-2.amazonaws.com/dev/guidance";
// ==========================================

let directionsService;
let currentPosition = null;
let idToken = null; // ログイン用トークン

// 多言語対応の翻訳データ
const translations = {
    ja: {
        tagline: 'あなたの命を守る避難誘導サービス',
        locationLabel: '現在地',
        btnText: '避難開始',
        loadingText: '最適な避難所を検索中...',
        showRoute: '🗺️ ルートを表示',
        locationLoading: '位置情報を取得中...',
        aiError: 'AI通信エラー'
    },
    en: {
        tagline: 'Emergency Evacuation Guidance Service',
        locationLabel: 'Current Location',
        btnText: 'Start Evacuation',
        loadingText: 'Finding optimal shelters...',
        showRoute: '🗺️ Show Route',
        locationLoading: 'Getting location...',
        aiError: 'AI Connection Error'
    },
    zh: {
        tagline: '守护您生命的避难引导服务',
        locationLabel: '当前位置',
        btnText: '开始避难',
        loadingText: '正在搜索最佳避难所...',
        showRoute: '🗺️ 显示路线',
        locationLoading: '正在获取位置...',
        aiError: 'AI连接错误'
    }
};

let currentLang = 'ja';

// ▼▼▼ 1. ログイン処理と初期化 ▼▼▼

function init() {
    console.log('Lifeline アプリケーション起動');
    
    // URLからトークンを取得 (Cognitoからの戻り)
    const hash = window.location.hash;
    if (hash.includes("id_token=")) {
        const match = hash.match(/id_token=([^&]+)/);
        idToken = match ? match[1] : null;
        // URLを綺麗にする
        window.history.replaceState(null, null, ' ');
    }

    if (idToken) {
        // ログイン済みならアプリ画面を表示
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'block';
        // Google Mapsは callback=initMap で呼ばれるため、ここでは何もしない
    } else {
        // 未ログインならログイン画面のまま
        document.getElementById('login-view').style.display = 'block';
        document.getElementById('app-view').style.display = 'none';
    }
}

// ログイン画面へのリダイレクト
function redirectToLogin() {
    const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=token&scope=email+openid&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = loginUrl;
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ▲▲▲ ログイン処理ここまで ▲▲▲


/**
 * Google Maps初期化コールバック
 */
function initMap() {
    console.log('Google Maps API loaded');
    directionsService = new google.maps.DirectionsService();
    // ログイン済みの場合のみ位置情報を取得開始
    if(idToken) {
        getCurrentLocation();
    }
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
                document.getElementById('location-value').textContent = '東京都新宿区西新宿 (現在地取得失敗)';
            }
        );
    } else {
        console.log('位置情報APIが利用できません');
        currentPosition = { lat: 35.6896, lng: 139.7006 };
        document.getElementById('location-value').textContent = '位置情報API無効';
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
 * ▼▼▼ 2. 避難開始ボタン処理 (API連携) ▼▼▼
 */
async function startEvacuation() {
    const shelterList = document.getElementById('shelter-list');
    const loading = document.getElementById('loading');
    const sheltersDiv = document.getElementById('shelters');
    const aiArea = document.getElementById('ai-response-area');
    const aiText = document.getElementById('ai-answer-text');
    
    shelterList.classList.add('active');
    loading.style.display = 'block';
    sheltersDiv.innerHTML = '';
    aiArea.style.display = 'none';

    // 位置情報がない場合はデフォルトを使用
    if (!currentPosition) {
        currentPosition = { lat: 35.6896, lng: 139.7006 };
    }

    try {
        // バックエンドAPIへの送信
        console.log("Sending request to API:", API_URL);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken // Cognitoトークン
            },
            body: JSON.stringify({
                latitude: currentPosition.lat,
                longitude: currentPosition.lng
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        // AIの回答を表示
        loading.style.display = 'none';
        
        if (data.answer) {
            aiArea.style.display = 'block';
            aiText.innerText = data.answer;
        }

        // ▼注意: 本来はAIの回答から座標を解析しますが、
        // 今のBackendはテキストしか返さないため、
        // 画面上は「デモ用の避難所データ」を表示して、地図機能を維持します。
        showDemoShelters();

    } catch (error) {
        console.error(error);
        loading.style.display = 'none';
        aiArea.style.display = 'block';
        aiText.innerText = `エラーが発生しました: ${error.message}`;
        // エラーでもデモデータは表示しておく
        showDemoShelters();
    }
}

/**
 * 避難所リストを表示 (デモデータ)
 */
function showDemoShelters() {
    const sheltersDiv = document.getElementById('shelters');
    
    // バックエンドがまだ座標リストを返さないため、
    // UI確認用にデザイナーが作成したデモデータを使用します
    const shelters = [
        { 
            name: '新宿区立 西新宿小学校',
            address: '東京都新宿区西新宿4-35-4',
            lat: 35.6869,
            lng: 139.6917,
            capacity: 35
        },
        { 
            name: '新宿スポーツセンター',
            address: '東京都新宿区大久保3-5-1',
            lat: 35.7018,
            lng: 139.7007,
            capacity: 68
        },
        { 
            name: '新宿区役所 本庁舎',
            address: '東京都新宿区歌舞伎町1-4-1',
            lat: 35.6938,
            lng: 139.7036,
            capacity: 52 
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
            
            const card = createShelterCard(shelter, index);
            container.appendChild(card);
        } else {
            console.error('ルート取得失敗:', status);
            const card = createShelterCardWithoutRoute(shelter, index);
            container.appendChild(card);
        }
    });
}

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

function createShelterCardWithoutRoute(shelter, index) {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    const t = translations[currentLang];

    card.innerHTML = `
        <div class="shelter-name">${index + 1}. ${shelter.name}</div>
        <div class="shelter-info">
            <span>📍 ${shelter.address}</span>
            <span>👥 混雑度: ${shelter.capacity}%</span>
        </div>
        <button class="show-route-btn" onclick='openGoogleMapsRoute(${JSON.stringify(shelter)})'>
            ${t.showRoute}
        </button>
    `;
    return card;
}

function openGoogleMapsRoute(shelter) {
    let origin = '';
    if (currentPosition) {
        origin = `${currentPosition.lat},${currentPosition.lng}`;
    } else {
        origin = encodeURIComponent(document.getElementById('location-value').textContent);
    }
    const destination = encodeURIComponent(shelter.address);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank');
}