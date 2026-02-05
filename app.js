// FCM 테스트 앱 메인 로직
let messaging = null;
let vapidKey = null;
let currentToken = null;

// 로그 함수
function addLog(message, type = 'info') {
    const logsDiv = document.getElementById('logs');
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    logEntry.innerHTML = `<span class="log-time">[${time}]</span> ${icon} ${message}`;
    logsDiv.insertBefore(logEntry, logsDiv.firstChild);
    
    console.log(`[${time}] ${message}`);
}

function clearLogs() {
    document.getElementById('logs').innerHTML = '';
    addLog('로그가 지워졌습니다');
}

// 상태 업데이트
function updateStatus(type, status, isOk) {
    const element = document.getElementById(`${type}Status`);
    element.textContent = status;
    element.className = `status-value ${isOk ? 'ok' : 'error'}`;
}

// Firebase 초기화
async function initFirebase() {
    const resultDiv = document.getElementById('initResult');
    resultDiv.innerHTML = '<div class="alert alert-info">⏳ 초기화 중...</div>';
    addLog('Firebase 초기화 시작...');

    try {
        // Firebase 라이브러리 확인
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase 라이브러리를 불러올 수 없습니다. 인터넷 연결을 확인하세요.');
        }

        // 입력값 가져오기
        const apiKey = document.getElementById('apiKey').value.trim();
        const projectId = document.getElementById('projectId').value.trim();
        const senderId = document.getElementById('senderId').value.trim();
        const appId = document.getElementById('appId').value.trim();
        vapidKey = document.getElementById('vapidKey').value.trim();

        if (!apiKey || !projectId || !senderId || !appId || !vapidKey) {
            throw new Error('모든 필드를 입력해주세요!');
        }

        addLog(`Project ID: ${projectId}`);

        // Firebase 설정
        const firebaseConfig = {
            apiKey: apiKey,
            authDomain: `${projectId}.firebaseapp.com`,
            projectId: projectId,
            storageBucket: `${projectId}.appspot.com`,
            messagingSenderId: senderId,
            appId: appId
        };

        // Firebase 초기화
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            addLog('Firebase 앱 초기화 완료', 'success');
        } else {
            addLog('Firebase 이미 초기화되어 있음', 'warning');
        }

        // Messaging 초기화
        messaging = firebase.messaging();
        addLog('Firebase Messaging 초기화 완료', 'success');

        // 포그라운드 메시지 리스너
        messaging.onMessage((payload) => {
            addLog('포그라운드 메시지 수신!', 'success');
            console.log('Foreground message:', payload);
            
            if (payload.notification) {
                showNotification(
                    payload.notification.title || '알림',
                    payload.notification.body || ''
                );
            }
        });

        resultDiv.innerHTML = '<div class="alert alert-success">✅ Firebase 초기화 성공!</div>';
        updateStatus('firebase', '✅ 연결됨', true);
        document.getElementById('getTokenBtn').disabled = false;
        addLog('Firebase 초기화 완료!', 'success');

    } catch (error) {
        addLog(`초기화 실패: ${error.message}`, 'error');
        resultDiv.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
        updateStatus('firebase', '❌ 오류', false);
    }
}

// 알림 권한 요청
async function requestPermission() {
    const resultDiv = document.getElementById('permResult');
    addLog('알림 권한 요청 시작...');

    try {
        if (!('Notification' in window)) {
            throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
        }

        addLog(`현재 권한 상태: ${Notification.permission}`);

        const permission = await Notification.requestPermission();
        addLog(`권한 요청 결과: ${permission}`);

        if (permission === 'granted') {
            resultDiv.innerHTML = '<div class="alert alert-success">✅ 알림 권한이 허용되었습니다!</div>';
            updateStatus('permission', '✅ 허용됨', true);
            addLog('알림 권한 허용됨!', 'success');
        } else if (permission === 'denied') {
            resultDiv.innerHTML = '<div class="alert alert-error">❌ 알림 권한이 거부되었습니다.<br>주소창 옆 자물쇠 아이콘 → 권한 → 알림 → 허용</div>';
            updateStatus('permission', '❌ 거부됨', false);
            addLog('알림 권한 거부됨', 'error');
        } else {
            resultDiv.innerHTML = '<div class="alert alert-warning">⚠️ 권한 요청이 무시되었습니다.</div>';
            updateStatus('permission', '⚠️ 보류', false);
            addLog('알림 권한 보류됨', 'warning');
        }

    } catch (error) {
        addLog(`권한 요청 실패: ${error.message}`, 'error');
        resultDiv.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
    }
}

// Service Worker 등록
async function registerSW() {
    const resultDiv = document.getElementById('permResult');
    addLog('Service Worker 등록 시작...');

    try {
        if (!('serviceWorker' in navigator)) {
            throw new Error('이 브라우저는 Service Worker를 지원하지 않습니다.');
        }

        const registration = await navigator.serviceWorker.register('${location.pathname}firebase-messaging-sw.js');
        addLog('Service Worker 등록 성공!', 'success');
        addLog(`Scope: ${registration.scope}`);
        
        resultDiv.innerHTML = '<div class="alert alert-success">✅ Service Worker가 등록되었습니다!</div>';
        updateStatus('sw', '✅ 등록됨', true);

        // Service Worker 상태 확인
        if (registration.active) {
            addLog('Service Worker 활성 상태', 'success');
        } else if (registration.installing) {
            addLog('Service Worker 설치 중...', 'info');
        } else if (registration.waiting) {
            addLog('Service Worker 대기 중...', 'warning');
        }

    } catch (error) {
        addLog(`Service Worker 등록 실패: ${error.message}`, 'error');
        resultDiv.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
        updateStatus('sw', '❌ 오류', false);
    }
}

// FCM 토큰 받기
async function getToken() {
    const resultDiv = document.getElementById('tokenResult');
    resultDiv.innerHTML = '<div class="alert alert-info">⏳ 토큰 요청 중...</div>';
    addLog('FCM 토큰 요청 시작...');

    try {
        if (!messaging) {
            throw new Error('Firebase를 먼저 초기화하세요!');
        }

        if (Notification.permission !== 'granted') {
            throw new Error('알림 권한을 먼저 허용하세요!');
        }

        // Service Worker 등록 확인
        const registration = await navigator.serviceWorker.ready;
        addLog('Service Worker 준비 완료');

        // 토큰 받기
        const token = await messaging.getToken({
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
        });

        if (token) {
            currentToken = token;
            addLog('FCM 토큰 받기 성공!', 'success');
            addLog(`토큰 길이: ${token.length} 문자`);
            
            resultDiv.innerHTML = `
                <div class="alert alert-success">✅ FCM 토큰을 받았습니다!</div>
                <div class="token-box">${token}</div>
                <button class="btn-info" onclick="copyToken()">📋 토큰 복사</button>
            `;
            updateStatus('token', '✅ 받음', true);
        } else {
            throw new Error('토큰을 받지 못했습니다.');
        }

    } catch (error) {
        addLog(`토큰 받기 실패: ${error.message}`, 'error');
        resultDiv.innerHTML = `<div class="alert alert-error">❌ ${error.message}</div>`;
        updateStatus('token', '❌ 없음', false);
    }
}

// 토큰 복사
function copyToken() {
    if (currentToken) {
        navigator.clipboard.writeText(currentToken).then(() => {
            addLog('토큰이 클립보드에 복사되었습니다!', 'success');
            alert('✅ 토큰이 복사되었습니다!');
        }).catch(err => {
            addLog('토큰 복사 실패', 'error');
            alert('❌ 복사 실패. 직접 선택해서 복사하세요.');
        });
    }
}

// 로컬 알림 전송
async function sendLocalNotification() {
    addLog('로컬 알림 전송 시도...');

    try {
        if (Notification.permission !== 'granted') {
            addLog('알림 권한이 없습니다', 'error');
            alert('❌ 먼저 알림 권한을 허용하세요!');
            return;
        }

        const title = document.getElementById('notifTitle').value;
        const body = document.getElementById('notifBody').value;

        await showNotification(title, body);
        addLog('로컬 알림 전송 완료!', 'success');
        alert('✅ 알림이 전송되었습니다!');

    } catch (error) {
        addLog(`알림 전송 실패: ${error.message}`, 'error');
        alert('❌ 알림 전송 실패: ' + error.message);
    }
}

// 알림 표시 함수
async function showNotification(title, body) {
    try {
        // Service Worker 등록 확인
        const registration = await navigator.serviceWorker.ready;
        
        const options = {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [300, 100, 300, 100, 300],
            requireInteraction: false,
            silent: false,
            tag: 'fcm-test-' + Date.now(),
            data: { url: '/' }
        };

        // Service Worker를 통해 알림 표시
        await registration.showNotification(title, options);
        addLog('알림 표시 완료!', 'success');

        // 진동
        if ('vibrate' in navigator) {
            navigator.vibrate([300, 100, 300, 100, 300]);
            addLog('진동 실행', 'success');
        }
    } catch (error) {
        addLog(`알림 표시 실패: ${error.message}`, 'error');
        throw error;
    }
}

// 진동 테스트
function testVibration() {
    addLog('진동 테스트 시작...');

    if (!('vibrate' in navigator)) {
        addLog('이 기기는 진동을 지원하지 않습니다', 'error');
        alert('❌ 이 기기는 진동을 지원하지 않습니다.');
        return;
    }

    // 강력한 진동 패턴
    const pattern = [
        300, 100,  // 긴 진동
        300, 100,  // 긴 진동
        300, 100,  // 긴 진동
        300        // 긴 진동
    ];

    navigator.vibrate(pattern);
    addLog('진동 실행 완료!', 'success');
    alert('✅ 진동이 실행되었습니다!');
}

// 페이지 로드 시 초기화
window.addEventListener('load', async () => {
    addLog('페이지 로드 완료');
    addLog(`브라우저: ${navigator.userAgent}`);
    
    // 초기 상태 확인
    if ('Notification' in window) {
        addLog(`알림 API 지원: ${Notification.permission}`);
        if (Notification.permission === 'granted') {
            updateStatus('permission', '✅ 허용됨', true);
        }
    } else {
        addLog('알림 API 미지원', 'error');
    }

    if ('serviceWorker' in navigator) {
        addLog('Service Worker API 지원');
        
        // 등록된 SW 확인
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            addLog('Service Worker 이미 등록되어 있음', 'success');
            updateStatus('sw', '✅ 등록됨', true);
        }
    } else {
        addLog('Service Worker API 미지원', 'error');
    }

    // Firebase SDK 확인
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            addLog('Firebase SDK 로드 완료', 'success');
        } else {
            addLog('Firebase SDK 로드 실패', 'error');
        }
    }, 1000);
});

// Service Worker 메시지 리스너
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        addLog('Service Worker로부터 메시지 수신', 'info');
        console.log('SW Message:', event.data);
        
        if (event.data.type === 'NOTIFICATION_RECEIVED') {
            addLog('푸시 알림 수신!', 'success');
        }
    });
}
