# ChemLab UZ — Frontend

Kimyo laboratoriyalari uchun LIMS (Laboratory Information Management
System) veb-ilovasining frontend qismi. React 18 + Ant Design 5 +
Redux Toolkit asosida qurilgan, kimyoviy laboratoriya uslubiga mos
dizayn bilan.

Backend (Django REST API) alohida repo/serverda joylashadi — bu ikkala
qism internet orqali, CORS ruxsati bilan gaplashadi.

---

## Imkoniyatlar

- **Namunalar** — laboratoriyaga kelgan namunalarni ro'yxatga olish va
  holatini kuzatish (qabul qilindi → jarayonda → tugallandi)
- **Tajribalar** — tajriba natijalarini kiritish, kimyogar tomonidan
  tasdiqlash/qaytarish
- **Inventar** — kimyoviy reaktivlar ombori: miqdor, muddat va kam
  qolish ogohlantirishlari, o'zgarishlar tarixi
- **Foydalanuvchilar va rollar** — administrator, kimyogar, laborant,
  kuzatuvchi rollari; adminning o'z sahifasi orqali (Django admin
  panelisiz) foydalanuvchi qo'shishi, rol tayinlashi va hisoblarni
  faollashtirishi/bloklashi
- **Hisobotlar** — PDF ko'rinishida tayyor hisobot generatsiyasi
- **Dashboard** — namunalar/tajribalar statistikasi, reaktiv
  ogohlantirishlari, laborant faolligi

---

## Texnologiyalar

| Qatlam          | Texnologiya                          |
|-----------------|---------------------------------------|
| UI              | React 18, Ant Design 5                |
| Holat boshqaruvi| Redux Toolkit                         |
| Marshrutlash    | React Router 6                        |
| HTTP            | Axios                                 |
| Grafiklar       | Recharts                              |
| Build           | Vite                                  |
| Production      | Docker + Nginx                        |

---

## Loyiha tuzilishi

```
src/
├── api/            # axios instance (baseURL, JWT interceptor)
├── app/            # Redux store
├── components/
│   ├── common/     # RoleGuard, ProtectedRoute, HazardBadge va h.k.
│   └── layout/      # AppLayout, Sidebar, Header
├── features/       # har bir modul uchun API xizmatlari (service)
│   ├── auth/
│   ├── chemicals/
│   ├── dashboard/
│   ├── experiments/
│   ├── reports/
│   ├── samples/
│   └── users/
└── pages/          # sahifalar (Dashboard, Samples, Inventory, ...)
```

---

## 1. Lokal ishga tushirish (Docker'siz)

Talablar: Node.js 20+

```bash
npm install
cp .env.example .env
```

`.env` faylida backend manzilini ko'rsating (lokal backend uchun odatda):

```
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Ilova `http://localhost:5173` manzilida ishga tushadi.

---

## 2. Production'ga joylash (Docker)

Talablar: Docker va Docker Compose, backend allaqachon boshqa
serverda/domenda ishga tushirilgan bo'lishi kerak.

```bash
cp .env.example .env
```

`.env` faylida **`VITE_API_URL`**ni backend joylashgan to'liq manzilga
o'zgartiring:

```
VITE_API_URL=https://api.chemlab.uz
```

> ⚠️ Bu qiymat build vaqtida React kodiga "quyiladi" (Vite build-time
> o'zgaruvchisi) — shuning uchun `.env`ni o'zgartirsangiz, konteynerni
> albatta **qayta qurishingiz** kerak (`docker compose up --build`),
> shunchaki qayta ishga tushirish yetarli emas.

```bash
docker compose up --build -d
```

Brauzerda: `http://<server-ip>` yoki domeningiz.

---

## 3. Backend bilan bog'lash — MUHIM

Bu frontend backend'ga to'g'ridan-to'g'ri (brauzer orqali, CORS bilan)
so'rov yuboradi. Buning uchun **backend tomonida** (`backend/.env`) ushbu
frontend'ning manzili `CORS_ALLOWED_ORIGINS`ga qo'shilgan bo'lishi shart.

Masalan, agar frontend `https://chemlab.uz` da, backend esa
`https://api.chemlab.uz` da joylashgan bo'lsa:

```
frontend/.env:  VITE_API_URL=https://api.chemlab.uz
backend/.env:   CORS_ALLOWED_ORIGINS=https://chemlab.uz
```

Agar bu ikkisi mos kelmasa, brauzer konsolida **CORS xatosi** ko'rasiz
("blocked by CORS policy") — bu eng ko'p uchraydigan xato, shu sababli
avval shu ikkalasini tekshiring.

---

## 4. Production'da HTTPS

Domeningiz bo'lsa, ushbu frontend oldiga (yoki shu nginx konteynerining
o'ziga) Let's Encrypt/Certbot yoki Caddy orqali SSL sertifikat
o'rnatishingiz mumkin. Aralash-kontent xatolariga yo'l qo'ymaslik uchun,
agar frontend HTTPS orqali ishlasa, backend ham HTTPS orqali ishlashi
tavsiya etiladi (brauzerlar HTTPS sahifadan HTTP API'ga so'rovni
bloklashi mumkin).

---

## 5. Kundalik buyruqlar

```bash
docker compose logs -f frontend
docker compose down
docker compose up --build -d     # .env yoki kod o'zgargandan keyin
```

---

## 6. Rollar

| Rol             | Huquqlar                                              |
|-----------------|--------------------------------------------------------|
| Administrator   | Barcha amallar: foydalanuvchi va rol boshqaruvi, inventar qo'shish/o'chirish |
| Kimyogar        | Tajribalarni tasdiqlash/qaytarish, inventarni ko'rish |
| Laborant        | Namuna va tajriba kiritish                            |
| Kuzatuvchi      | Faqat ko'rish (read-only)                             |

---

## Muallif haqida

Loyiha Django REST Framework (backend) va React + Ant Design
(frontend) asosida qurilgan, o'zbek tilidagi kichik laboratoriya
ehtiyojlariga moslashtirilgan LIMS tizimi sifatida ishlab chiqilgan.
