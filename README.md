# 🎬 زینگو (Zingo) - پلتفرم دانلود فیلم و سریال

![Zingo](https://img.shields.io/badge/Zingo-v1.0.0-rose?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![Python](https://img.shields.io/badge/Python-Scraper-3776AB?style=flat-square&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql)

زینگو یک وب‌سایت مدرن و اپلیکیشن‌لایک برای دانلود رایگان فیلم و سریال است. طراحی شده با تم تاریک، پشتیبانی کامل RTL فارسی، سیستم اسکرپ خودکار، پنل مدیریت حرفه‌ای و سیستم تبلیغات جامع.

## ✨ ویژگی‌ها

### 🎬 بخش عمومی
- 🏠 صفحه اصلی با هیرو اسلایدر و بخش‌های مختلف
- 📱 طراحی اپلیکیشن‌لایک با Bottom Navigation
- 🌙 تم تاریک / روشن
- 📜 پشتیبانی کامل RTL فارسی با فونت Vazirmatn
- 🔍 جستجوی پیشرفته با فیلتر ژانر، سال، امتیاز
- 📺 صفحات لیست فیلم و سریال با مرتب‌سازی
- 📄 صفحه تکی با پوستر، تصاویر کپشن، تریلر، دانلود
- ⭐ صفحه برترین‌های IMDB
- 🆕 صفحه تازه‌ترین‌ها

### 🕷️ سیستم اسکرپ
- اسکرپ خودکار از **animex.click** (انیمه، فیلم، سریال کره‌ای)
- اسکرپ خودکار از **donyayeserial.com** (فیلم و سریال خارجی)
- استخراج متادیتا + لینک دانلود
- زمان‌بندی خودکار هر ۶ ساعت
- اسکرپ دستی از پنل مدیریت
- گزارش وضعیت اسکرپ

### 👤 سیستم کاربران
- ثبت‌نام و ورود با ایمیل + رمز عبور
- سیستم علاقه‌مندی‌ها
- سیستم کامنت
- پروفایل کاربری

### 📢 سیستم تبلیغات
- تبلیغات بنری (هدر، سایدبار، بین‌محتوا، فوتر)
- تبلیغات پاپ‌آپ
- اینتراستیشن
- بخش ویژه اسپانسرها
- گزارش آماری (نمایش و کلیک)

### 🛡️ پنل مدیریت
- داشبورد با آمار کلی (فیلم، سریال، کاربر، بازدید)
- مدیریت فیلم‌ها (ویرایش، حذف)
- مدیریت سریال‌ها
- مدیریت کاربران
- مدیریت تبلیغات
- مدیریت ژانرها
- مدیریت کامنت‌ها
- کنترل اسکرپ

## 🛠️ Tech Stack

| بخش | تکنولوژی |
|------|----------|
| **فرانت‌اند** | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| **بک‌اند** | Node.js, Express.js, Prisma ORM |
| **دیتابیس** | PostgreSQL, Redis |
| **اسکرپر** | Python, BeautifulSoup, APScheduler |
| **احراز هویت** | JWT |
| **دواپس** | Docker, Docker Compose |

## 📁 ساختار پروژه

```
zingo/
├── frontend/             # Next.js 15 (فرانت‌اند)
│   ├── src/
│   │   ├── app/          # صفحات
│   │   │   ├── (public)/     # صفحات عمومی
│   │   │   ├── (auth)/       # ورود و ثبت‌نام
│   │   │   ├── (user)/       # پنل کاربر
│   │   │   └── admin/        # پنل مدیریت
│   │   ├── components/   # کامپوننت‌ها
│   │   ├── context/      # Theme Provider
│   │   ├── lib/          # API, Auth, Utils
│   │   ├── styles/       # استایل سراسری
│   │   └── types/        # TypeScript types
│   └── public/
│
├── backend/              # Express API
│   ├── src/
│   │   ├── config/       # تنظیمات
│   │   ├── middleware/   # Auth, ErrorHandler
│   │   ├── routes/       # API routes
│   │   ├── services/     # Prisma client
│   │   └── index.ts      # Entry point
│   └── prisma/
│       └── schema.prisma # شمای دیتابیس
│
├── scraper/              # Python scraper
│   ├── scrapers/
│   │   ├── animex_scraper.py
│   │   └── donyayeserial_scraper.py
│   ├── api_client.py
│   ├── scheduler.py
│   └── main.py
│
├── docker-compose.yml    # PostgreSQL + Redis
├── .env.example          # متغیرهای محیطی
└── README.md
```

## 🚀 راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- Python 3.9+
- PostgreSQL (یا Docker)
- Redis (یا Docker)
- Git

### ۱. کلون کردن پروژه
```bash
git clone <repo-url>
cd zingo
```

### ۲. تنظیم متغیرهای محیطی
```bash
cp .env.example .env
# .env را ویرایش کنید و مقادیر مناسب قرار دهید
```

### ۳. راه‌اندازی دیتابیس با Docker
```bash
docker-compose up -d
```

### ۴. راه‌اندازی بک‌اند
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
سرور بک‌اند روی `http://localhost:5000` اجرا می‌شود.

### ۵. راه‌اندازی فرانت‌اند
```bash
cd frontend
npm install
npm run dev
```
فرانت‌اند روی `http://localhost:3000` اجرا می‌شود.

### ۶. راه‌اندازی اسکرپر (اختیاری)
```bash
cd scraper
pip install -r requirements.txt

# اسکرپ همه منابع
python main.py all

# فقط animex
python main.py animex

# فقط donyayeserial
python main.py donyayeserial

# اسکرپ با زمان‌بندی خودکار
python scheduler.py
```

## 🌐 API Endpoints

### احراز هویت
| متد | مسیر | توضیح |
|------|------|--------|
| POST | `/api/auth/register` | ثبت‌نام |
| POST | `/api/auth/login` | ورود |
| GET | `/api/auth/me` | اطلاعات کاربر |

### فیلم‌ها
| متد | مسیر | توضیح |
|------|------|--------|
| GET | `/api/movies` | لیست فیلم‌ها (فیلتر، صفحه‌بندی) |
| GET | `/api/movies/top-imdb` | برترین IMDB |
| GET | `/api/movies/:id` | جزئیات فیلم |

### سریال‌ها
| متد | مسیر | توضیح |
|------|------|--------|
| GET | `/api/series` | لیست سریال‌ها |
| GET | `/api/series/:id` | جزئیات سریال |

### سایر
| متد | مسیر | توضیح |
|------|------|--------|
| GET | `/api/genres` | ژانرها |
| GET/POST | `/api/favorites` | علاقه‌مندی‌ها |
| GET/POST | `/api/comments` | کامنت‌ها |
| GET | `/api/ads` | تبلیغات |
| GET | `/api/admin/dashboard` | داشبورد |

## 📸 اسکرین‌شات

> پس از نصب و اجرای پروژه، صفحات در مرورگر نمایش داده می‌شوند.

## 📄 مجوز

این پروژه فقط برای اهداف آموزشی و شخصی است. لطفاً از محتوای اسکرپ شده استفاده تجاری نکنید و قوانین کپی‌رایت را رعایت کنید.

## 🤝 مشارکت

مشارکت‌ها خوش‌آمد هستند! لطفاً ابتدا یک Issue ایجاد کنید.

## 📧 تماس

ایمیل: info@zingo.ir
