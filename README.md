# بلدتي (Baldaty) - دليل الربط والتشغيل مع Firebase

منصة مجتمعية تفاعلية لكل محافظات مصر (دليل خدمات، راصد مشكلات، أبطال البلدة، العمل الخيري، سوق البلدة، فعاليات، وظائف، وأرقام مهمة).

---

## 1. إعداد مشروع Firebase

1. توجه إلى [Firebase Console](https://console.firebase.google.com/) وأنشئ مشروعاً جديداً باسم `baldaty` (أو استخدم مشروعك الحالي).
2. **تفعيل المصادقة (Authentication):**
   - افتح **Build > Authentication > Sign-in method**.
   - فعّل موفر **Google** (واختر بريد الدعم) واضغط **Save**.
   - فعّل موفر **Email/Password** (كبديل مباشر) واضغط **Save**.
   - في تبويب **Settings** > قسم **Authorized domains**: اضغط **Add domain** وأضف نطاق التطبيق (مثل نطاق المعاينة السحابي أو نطاق استضافتك) ليسمح Firebase بإجراءات Google OAuth.
3. **تفعيل قاعدة بيانات Cloud Firestore:**
   - افتح **Build > Firestore Database**.
   - اختر **Create database** في وضع الإنتاج (Production mode)، واختر أقرب منطقة جغرافية (مثل `europe-west3` أو `me-central1` أو `europe-west2`).
4. **تفعيل مساحة التخزين Cloud Storage:**
   - افتح **Build > Storage** واضغط **Get started** بنفس المنطقة.
5. **تفعيل إشعارات السحاب Cloud Messaging (FCM):**
   - من إعدادات المشروع (Project Settings) > علامة تبويب **Cloud Messaging** > فعّل **Firebase Cloud Messaging API (V1)**.
   - في قسم **Web configuration** أنشئ زوج مفاتيح **Web Push certificates (VAPID Key)**.

---

## 2. إعداد المتغيرات والإعدادات (CFG)

في ملف `index.html` وملف `firebase-messaging-sw.js`، يتم وضع كائن الإعدادات المستخرج من **Project Settings > General > Your apps (Web)**:

```javascript
const CFG = {
  apiKey: "AIzaSyDh5pTDXDQ1kLOzyCkufiWcPSEo8Q6J7SY",
  authDomain: "studio-61196567-8edf5.firebaseapp.com",
  projectId: "studio-61196567-8edf5",
  storageBucket: "studio-61196567-8edf5.firebasestorage.app",
  messagingSenderId: "484094142486",
  appId: "1:484094142486:web:baldaty"
};
```
> **ملاحظة:** إذا تم ترك `CFG.apiKey` فارغاً (`""`)، سيعمل التطبيق تلقائياً في وضع التجربة المحلي (Offline mock via `localStorage`) دون أي أخطاء.

---

## 3. نشر القواعد والدوال والفهارس

قم بتثبيت Firebase CLI وسجل الدخول:
```bash
npm install -g firebase-tools
firebase login
firebase use --add studio-61196567-8edf5
```

ثم انشر المشروع كاملاً:
```bash
firebase deploy
```

أو انشر كل جزء على حدة:
```bash
# نشر قواعد أمان Firestore والفهارس
firebase deploy --only firestore

# نشر قواعد أمان التخزين Storage
firebase deploy --only storage

# نشر الدوال السحابية Cloud Functions (تحتاج ترقية المشروع لخطة Blaze المجانية المدعومة)
cd functions
npm install
cd ..
firebase deploy --only functions

# نشر الواجهة على Firebase Hosting
firebase deploy --only hosting
```

---

## 4. تعيين أول أدمن (Admin Role)

لأسباب أمنية مشددة، تمنع القواعد أي مستخدم من تسجيل حسابه بصلاحية أدمن مباشرة. لتعيين أول مدير للنظام:

1. افتح التطبيق وسجّل حساباً عادياً (بأي بريد مثل `admin@baldaty.app`).
2. افتح **Firebase Console > Firestore Database**.
3. ادخل إلى مجموعة `users`، وابحث عن المستند الخاص بحسابك (بمعرف `uid`).
4. عدّل الحقول التالية:
   - `role`: غيّر القيمة من `citizen` إلى `admin`.
   - `verify`: اضبط القيمة على `approved`.
5. أعد تحميل الصفحة أو افتح حسابك في التطبيق، وستجد زر **🛡 الأدمن** قد ظهر في الشريط العلوي فوراً!
6. من لوحة الأدمن > **الدفع**، حدّد رقم اتصالات كاش المعتمد لتبدأ في استقبال المدفوعات وتفعيل التمييز واشتراكات الداعمين.

---

## 5. ملخص التغييرات المعمارية وسلوك البيانات

| البند | السلوك السابق | السلوك الجديد المعتمد |
| :--- | :--- | :--- |
| **فصل البيانات الحساسة** | كانت كل البيانات في `users/{uid}` | نقل `email`، ومسار وثيقة الهوية `doc`، وهاتف المتبرع `dphone`، والـ `fcmToken` إلى مجموعة خاصة `users_private/{uid}` لا يقرأها إلا صاحبها أو الأدمن. |
| **حظر تخزين كلمات المرور** | كان يُخزن `pw` في المستند عند الوضع التجريبي | منع تخزين كلمة المرور نهائياً في أي مستند Firestore، والاعتماد بالكامل على Firebase Auth المشفر. |
| **المصفوفات التفاعلية** | إعادة كتابة المصفوفة كاملة | استخدام `FieldValue.arrayUnion` و `arrayRemove` (في الإعجابات `likes`، الحضور `going`، المفضلات `fav`، وقائمة المتبرعين `donors`). |
| **إسناد النقاط** | استدعاء دالة `pts()` من جانب العميل | حُذف الاستدعاء من العميل ونُقل إلى **Cloud Functions** على الخادم (+10 نقاط للمشكلات المحلولة، +20 نقطة للأبطال المعتمدين) مع علامة `pointsAwarded` لضمان المنح لمرة واحدة فقط وبأمان تام. |
| **تخزين الصور الحساسة** | روابط عامة للتحميل | صور الهوية وإيصالات اتصالات كاش تُخزن في مسار `private/{uid}/...` بحجم لا يتجاوز 1 ميجابايت، ويُخزن في المستند مسار التخزين فقط، ويتم توليد رابط `getDownloadURL` لحظياً ومؤقتاً لصاحبها وللأدمن فقط مع كاش محلي سريع. |
| **العمليات متعددة الخطوات** | استدعاءات متتالية غير ذرية | استخدام `writeBatch` لتنفيذ عمليات قبول الدفع (تحديث الدفعة + تفعيل تمييز الخدمة + الداعمين + الغرامة) وتغريم المحتوى (إنشاء الغرامة + حذف المحتوى) كعملية ذرية واحدة لا تتجزأ. |
| **استعلامات المحافظة** | فلترة في المتصفح | استعلامات مخصصة بـ `where('gov', 'in', [GV, 'all']).orderBy('at', 'desc')` مع ملف فهارس كامل `firestore.indexes.json`. |
| **منع undefined** | حدوث أخطاء استثناء في Firestore | دالة `cleanDoc()` تقوم بمسح أي مفتاح يحمل القيمة `undefined` بشكل تعاودي قبل أي عملية كتابة. |
