// scripts/test_push.cjs
const webpush = require('web-push');

// 1. YOUR KEYS
const vapidPublicKey = 'BENKAVEB2JcUbfeeR0NN71iKxsCVGzCS3lWJA8Of7SG-MLC9YsPxFs7P0L_noqwnb1NN4njgXSBSy87pTbhtEkc';
const vapidPrivateKey = 'te4NTYhvjHy3KfbBFwL_8tlsVvx52QMF4kpVty3SYmw'; 

// 2. YOUR EMAIL
webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

// 3. YOUR SUBSCRIPTION
const pushSubscription = {"endpoint":"https://fcm.googleapis.com/fcm/send/eZi8GYhyeBU:APA91bHDUNVFkPalB7aHrZlZk3N2TFvyJ1Di8LtSIMnisNWHsvBsCYmgkg00ccBs6g_PH6rAskKI3TD993qHjmwiqqGFyaD_MYK0Pxm9z5bbs2z6i6wwm1aCwFExEyT3Lctv2rOC62Tt","expirationTime":null,"keys":{"p256dh":"BPM2j5chmThBtD7GTQuF9WAsh8FRXxzbZ8HeMwLobCWJjNks5CXR41-dSdkuHlVsr7wRReCDUejeR74u_XT6hJY","auth":"Yc2zmSrlOqKV9m66tyB4IQ"}};

const payload = JSON.stringify({
  title: 'Test Push 🚀',
  body: 'This is a real push notification sent from the terminal!',
  url: 'http://localhost:5173'
});

console.log('Sending push notification...');

webpush.sendNotification(pushSubscription, payload)
  .then(response => {
    console.log('✅ Success! Status:', response.statusCode);
    console.log('Checks your notifications center!');
  })
  .catch(error => {
    console.error('❌ Error sending notification:', error);
  });
