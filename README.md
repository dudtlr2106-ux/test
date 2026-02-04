# FCM 푸시 알림 테스트 홈페이지

Firebase Cloud Messaging을 테스트할 수 있는 완전한 웹 애플리케이션입니다.

## 📁 파일 구조

```
fcm-test/
├── index.html              # 메인 페이지
├── firebase-messaging-sw.js # Service Worker
├── app.js                  # 앱 로직
├── manifest.json           # PWA Manifest
└── README.md              # 이 파일
```

## 🚀 사용 방법

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 후 생성
4. 프로젝트 설정 (⚙️) → "일반" 탭
5. "웹 앱" 추가 (</> 아이콘)
6. 설정 정보 복사:
   - API Key
   - Project ID
   - Messaging Sender ID
   - App ID
7. "Cloud Messaging" 탭 → "웹 푸시 인증서" 생성
8. VAPID Key 복사

### 2. 웹 서버에 배포

**로컬에서는 FCM이 제대로 작동하지 않습니다!**
반드시 HTTPS 웹 서버에 배포하세요.

#### 옵션 A: GitHub Pages (무료, 추천)
```bash
1. GitHub 저장소 생성
2. 모든 파일 업로드
3. Settings → Pages → 소스 선택
4. https://your-username.github.io/repo-name 에서 접속
```

#### 옵션 B: Netlify (무료, 가장 쉬움)
```bash
1. https://app.netlify.com/drop 접속
2. 폴더를 드래그 앤 드롭
3. 바로 HTTPS URL 받음!
```

#### 옵션 C: Vercel (무료)
```bash
npm install -g vercel
vercel --prod
```

### 3. 테스트 진행

1. 배포된 사이트 접속
2. Firebase 설정값 입력
3. 순서대로 버튼 클릭:
   - Firebase 초기화
   - 알림 권한 요청
   - Service Worker 등록
   - FCM 토큰 받기
   - 알림 테스트

## 📱 모바일에서 테스트

### Android Chrome
1. Chrome으로 사이트 접속
2. 설정 → 앱 → Chrome → 알림 → 소리/진동 켜기
3. 사이트에서 권한 허용
4. 테스트!

### iOS Safari (제한적)
- iOS Safari는 PWA로 설치 후에만 푸시 알림 가능
- 홈 화면에 추가 → 앱으로 실행

## 🔔 실제 푸시 알림 보내기

FCM 토큰을 받은 후, 서버나 Firebase Console에서 알림을 보낼 수 있습니다.

### Firebase Console에서 보내기 (가장 쉬움)
1. Firebase Console → Cloud Messaging
2. "첫 번째 캠페인" → "Firebase 알림 메시지"
3. 제목/내용 입력
4. 테스트 메시지 전송 → FCM 토큰 입력

### Node.js 서버에서 보내기
```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: '테스트 알림',
    body: '서버에서 보낸 푸시 알림입니다!'
  },
  token: 'FCM_TOKEN_HERE'
};

admin.messaging().send(message)
  .then(response => console.log('성공:', response))
  .catch(error => console.log('실패:', error));
```

### cURL로 보내기
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "FCM_TOKEN_HERE",
      "notification": {
        "title": "테스트",
        "body": "cURL로 보낸 알림!"
      }
    }
  }'
```

## 🐛 문제 해결

### 진동/소리가 안 나올 때
1. Android 설정 → 앱 → Chrome → 알림
2. "소리" 및 "진동" 켜기
3. 알림 중요도 "긴급" 또는 "높음"으로 설정
4. 방해 금지 모드 해제

### Service Worker 등록 실패
1. HTTPS 사이트인지 확인 (또는 localhost)
2. `firebase-messaging-sw.js` 파일이 루트에 있는지 확인
3. 브라우저 캐시 삭제 후 재시도

### 토큰을 못 받을 때
1. Firebase 초기화 성공했는지 확인
2. 알림 권한 허용했는지 확인
3. Service Worker 등록 확인
4. VAPID Key가 정확한지 확인

## 📊 로그 확인

페이지 하단의 "로그" 섹션에서 모든 작업 기록을 확인할 수 있습니다.
문제가 생기면 로그를 먼저 확인하세요!

## 🔒 보안 주의사항

- API Key는 공개되어도 괜찮습니다 (클라이언트 키)
- 하지만 **Server Key**는 절대 공개하면 안 됩니다!
- GitHub에 올릴 때 .env 파일 사용 권장

## 📞 지원

문제가 생기면:
1. 로그 확인
2. 브라우저 콘솔 확인 (F12)
3. Firebase Console에서 오류 확인

---

Made with ❤️ for FCM Testing
