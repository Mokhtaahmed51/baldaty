importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyDh5pTDXDQ1kLOzyCkufiWcPSEo8Q6J7SY",
  authDomain: "studio-61196567-8edf5.firebaseapp.com",
  projectId: "studio-61196567-8edf5",
  storageBucket: "studio-61196567-8edf5.firebasestorage.app",
  messagingSenderId: "484094142486",
  appId: "1:484094142486:web:baldaty"
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'بلدتي - إشعار جديد';
    const options = {
      body: (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      dir: 'rtl',
      lang: 'ar',
      data: payload.data
    };
    self.registration.showNotification(title, options);
  });
}
