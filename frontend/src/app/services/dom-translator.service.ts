import { Injectable, inject, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LocalizationService } from './localization.service';

interface TrackedTextState {
  original: string;
  lastApplied: string | null;
}

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'SVG',
  'MATH',
  'MAT-ICON',
  'LUCIDE-ICON',
  'TEXTAREA',
  'CANVAS',
  'IFRAME'
]);

const BRAND_AND_TECH_TOKENS = new Set([
  'SoftCodeSolution',
  'SoftCode Solution',
  'SoftCode',
  'SCS',
  'SOFTCODESOLUTION',
  'Angular v21 LTS',
  'Tailwind CSS v4',
  'Node.js 22 LTS',
  'Express 5',
  'Go 1.27',
  'SQLite WAL',
  'JSON 2.0'
]);

const NON_LATIN_SCRIPTS = new Set(['ur', 'sd', 'pa', 'ps', 'skr', 'bal', 'ks', 'ar', 'hi', 'zh', 'ja', 'ru']);
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const CACHE_PREFIX = 'scs_i18n_v2_';

const INSTANT_PHRASES: Record<string, Record<string, string>> = {
  ur: {
    'Home': 'ہوم',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'یہ کیسے کام کرتا ہے',
    'Store': 'پریمیم اسٹور',
    'About': 'ہمارے بارے میں',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کریں',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ بنائیں',
    'Deploy Now': 'ابھی شروع کریں',
    'Explore Store': 'اسٹور دیکھیں',
    'Enterprise Tenancy & Scalability': 'انٹرپرائز ملٹی ٹیننسی اور اسکیل ایبلٹی',
    'High-Performance': 'اعلیٰ کارکردگی',
    'Country & Currency / Language': 'ملک اور کرنسی / زبان',
    'Select your country to update all prices & text': 'قیمتیں اور زبان تبدیل کرنے کے لیے ملک یا زبان منتخب کریں',
    'Currency & Country': 'کرنسی اور ملک',
    'Language (زبان)': 'زبان (Language)',
    'Done': 'مکمل',
    'Live forex rates synced automatically': 'لائیو کرنسی ریٹس خودکار طور پر مطابقت پذیر ہیں',
    'Technical Support': 'تکنیکی معاونت',
    'Submit Ticket': 'ٹکٹ جمع کریں',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ ٹریک کریں',
    'Connected to SoftCode Ops Desk': 'سافٹ کوڈ آپس ڈیسک سے منسلک',
    'Normal': 'عام',
    'High': 'اہم',
    'Urgent': 'فوری'
  },
  sd: {
    'Home': 'گهر',
    'Solutions': 'سافٽ ويئر حل',
    'Technology': 'ٽيڪنالاجي',
    'How It Works': 'هي ڪيئن ڪم ڪري ٿو',
    'Store': 'پريميئم اسٽور',
    'About': 'اسان جي باري ۾',
    'Login': 'لاگ ان',
    'Register': 'رجسٽر ڪريو',
    'Sign In': 'سائن ان',
    'Create Account': 'اڪائونٽ ٺاهيو',
    'Deploy Now': 'هاڻي شروع ڪريو',
    'Explore Store': 'اسٽور ڏسو',
    'Enterprise Tenancy & Scalability': 'انٽرپرائز ملٽي ٽيننسي ۽ اسڪيل ايبلٽي',
    'High-Performance': 'اعليٰ ڪارڪردگي',
    'Country & Currency / Language': 'ملڪ ۽ ڪرنسي / ٻولي',
    'Select your country to update all prices & text': 'قيمتون ۽ ٻولي تبديل ڪرڻ لاءِ ملڪ يا ٻولي چونڊيو',
    'Currency & Country': 'ڪرنسي ۽ ملڪ',
    'Language (زبان)': 'ٻولي (Language)',
    'Done': 'مڪمل',
    'Live forex rates synced automatically': 'لائيو ڪرنسي ريٽ پاڻمرادو هم آهنگ آهن',
    'Technical Support': 'ٽيڪنيڪل سپورٽ',
    'Submit Ticket': 'ٽڪيٽ جمع ڪريو',
    'Live Chat': 'لائيو چيٽ',
    'Track Ticket': 'ٽڪيٽ ٽريڪ ڪريو',
    'Connected to SoftCode Ops Desk': 'سافٽ ڪوڊ آپس ڊيسڪ سان جڙيل',
    'Normal': 'عام',
    'High': 'اهم',
    'Urgent': 'تڪڙو'
  },
  pa: {
    'Home': 'گھر',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'ایہہ کیویں کم کردا اے',
    'Store': 'پریمیم اسٹور',
    'About': 'ساڈے بارے وچ',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کرو',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ بناؤ',
    'Deploy Now': 'ہن شروع کرو',
    'Explore Store': 'اسٹور ویکھو',
    'Enterprise Tenancy & Scalability': 'انٹرپرائز ملٹی ٹیننسی تے اسکیل ایبلٹی',
    'High-Performance': 'اعلیٰ کارکردگی',
    'Country & Currency / Language': 'ملک تے کرنسی / بولی',
    'Select your country to update all prices & text': 'قیمتاں تے بولی بدلن لئی ملک یا بولی چݨو',
    'Currency & Country': 'کرنسی تے ملک',
    'Language (زبان)': 'بولی (Language)',
    'Done': 'مکمل',
    'Live forex rates synced automatically': 'لائیو کرنسی ریٹ آپے آپ اپ ڈیٹ ہن',
    'Technical Support': 'تکنیکی مدد',
    'Submit Ticket': 'ٹکٹ جمع کراؤ',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ ٹریک کرو',
    'Connected to SoftCode Ops Desk': 'سافٹ کوڈ آپس ڈیسک نال جڑیا',
    'Normal': 'عام',
    'High': 'اہم',
    'Urgent': 'فوری'
  },
  ps: {
    'Home': 'کور',
    'Solutions': 'سافټویر حل لارې',
    'Technology': 'ټکنالوژي',
    'How It Works': 'دا څنګه کار کوي',
    'Store': 'پریمیم پلورنځی',
    'About': 'زموږ په اړه',
    'Login': 'ننوتل',
    'Register': 'راجستر',
    'Sign In': 'ننوتل',
    'Create Account': 'حساب جوړ کړئ',
    'Deploy Now': 'اوس پیل کړئ',
    'Explore Store': 'پلورنځی وګورئ',
    'Enterprise Tenancy & Scalability': 'انټرپرایز ملټي ټیننسي او پراختیا',
    'High-Performance': 'لوړ فعالیت',
    'Country & Currency / Language': 'هېواد او اسعار / ژبه',
    'Select your country to update all prices & text': 'د بیو او ژبې بدلولو لپاره هېواد یا ژبه وټاکئ',
    'Currency & Country': 'اسعار او هېواد',
    'Language (زبان)': 'ژبه (Language)',
    'Done': 'بشپړ شو',
    'Live forex rates synced automatically': 'ژوندي تبادلې نرخونه په اتومات ډول همغږي دي',
    'Technical Support': 'تخنیکي ملاتړ',
    'Submit Ticket': 'ټکټ واستوئ',
    'Live Chat': 'ژوندۍ خبرې',
    'Track Ticket': 'ټکټ تعقیب کړئ',
    'Connected to SoftCode Ops Desk': 'د سافټ کوډ عملیاتو ډیسک سره وصل',
    'Normal': 'عادي',
    'High': 'لوړ',
    'Urgent': 'بیړنی'
  },
  skr: {
    'Home': 'گھر',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'اے کیویں کم کریندے',
    'Store': 'پریمیم اسٹور',
    'About': 'اساݙے بارے وچ',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کرو',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ بݨاؤ',
    'Deploy Now': 'ہݨ شروع کرو',
    'Explore Store': 'اسٹور ݙیکھو',
    'Enterprise Tenancy & Scalability': 'انٹرپرائز ملٹی ٹیننسی تے اسکیل ایبلٹی',
    'High-Performance': 'اعلیٰ کارکردگی',
    'Country & Currency / Language': 'ملک تے کرنسی / زبان',
    'Select your country to update all prices & text': 'قیمتاں تے زبان بدلن کیتے ملک یا زبان چݨو',
    'Currency & Country': 'کرنسی تے ملک',
    'Language (زبان)': 'زبان (Language)',
    'Done': 'مکمل',
    'Live forex rates synced automatically': 'لائیو کرنسی ریٹ خودکار طریقے نال اپ ڈیٹ ہن',
    'Technical Support': 'تکنیکی مدد',
    'Submit Ticket': 'ٹکٹ جمع کراؤ',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ ٹریک کرو',
    'Connected to SoftCode Ops Desk': 'سافٹ کوڈ آپس ڈیسک نال جڑیا',
    'Normal': 'عام',
    'High': 'اہم',
    'Urgent': 'فوری'
  },
  bal: {
    'Home': 'لوگ',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'اے چوں کار کنت',
    'Store': 'پریمیم دکان',
    'About': 'مئے باروا',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کن',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ جوڑ کن',
    'Deploy Now': 'نوں بندات کن',
    'Explore Store': 'دکان بچار',
    'Enterprise Tenancy & Scalability': 'انٹرپرائز ملٹی ٹیننسی ءُ اسکیل ایبلٹی',
    'High-Performance': 'شرّیں کارکردگی',
    'Country & Currency / Language': 'ملک ءُ کرنسی / زبان',
    'Select your country to update all prices & text': 'نرخ ءُ زبان مٹ کنگ ءِ واستہ ملک یا زبان گچین کن',
    'Currency & Country': 'کرنسی ءُ ملک',
    'Language (زبان)': 'زبان (Language)',
    'Done': 'شپوک',
    'Live forex rates synced automatically': 'لائیو کرنسی نرخ وتکار ہمگرنچ انت',
    'Technical Support': 'تکنیکی کمک',
    'Submit Ticket': 'ٹکٹ دیم دئے',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ شوھاز کن',
    'Connected to SoftCode Ops Desk': 'سافٹ کوڈ آپس ڈیسک گوں بندوک',
    'Normal': 'عام',
    'High': 'مزن',
    'Urgent': 'اشتاپی'
  },
  ks: {
    'Home': 'گھر',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'یہِ کِتھ کٔنہِ چُھ کٲم کَران',
    'Store': 'پریمیم اسٹور',
    'About': 'اسہِ متعلق',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کٔرِو',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ بناوِو',
    'Deploy Now': 'وونہِ شُروع کٔرِو',
    'Explore Store': 'اسٹور وُچھِو',
    'Enterprise Tenancy & Scalability': 'انٹرپرائز ملٹی ٹیننسی تہٕ اسکیل ایبلٹی',
    'High-Performance': 'اعلیٰ کارکردگی',
    'Country & Currency / Language': 'ملک تہٕ کرنسی / زبان',
    'Select your country to update all prices & text': 'قیمژٕ تہٕ زبان بدلاونہٕ خٲطرٕ ملک یا زبان ژارِو',
    'Currency & Country': 'کرنسی تہٕ ملک',
    'Language (زبان)': 'زبان (Language)',
    'Done': 'مکمل',
    'Live forex rates synced automatically': 'لائیو کرنسی ریٹ چھِ خودکار طور مطابقت پذیر',
    'Technical Support': 'تکنیکی مدد',
    'Submit Ticket': 'ٹکٹ جمع کٔرِو',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ ٹریک کٔرِو',
    'Connected to SoftCode Ops Desk': 'سافٹ کوڈ آپس ڈیسکس سٟتؠ جُڑِتھ',
    'Normal': 'عام',
    'High': 'اہم',
    'Urgent': 'فوری'
  },
  ar: {
    'Home': 'الرئيسية',
    'Solutions': 'الحلول',
    'Technology': 'التكنولوجيا',
    'How It Works': 'كيف يعمل',
    'Store': 'المتجر',
    'About': 'من نحن',
    'Login': 'تسجيل الدخول',
    'Register': 'إنشاء حساب',
    'Sign In': 'تسجيل الدخول',
    'Create Account': 'إنشاء حساب',
    'Deploy Now': 'ابدأ الآن',
    'Explore Store': 'استكشف المتجر',
    'High-Performance': 'أداء فائق',
    'Country & Currency / Language': 'الدولة والعملة / اللغة',
    'Currency & Country': 'العملة والدولة',
    'Language (زبان)': 'اللغة (Language)',
    'Done': 'تم',
    'Live forex rates synced automatically': 'تتم مزامنة أسعار الصرف المباشرة تلقائياً',
    'Technical Support': 'الدعم الفني',
    'Submit Ticket': 'إرسال تذكرة',
    'Live Chat': 'دردشة مباشرة',
    'Track Ticket': 'تتبع التذكرة',
    'Normal': 'عادي',
    'High': 'مرتفع',
    'Urgent': 'عاجل'
  },
  hi: {
    'Home': 'होम',
    'Solutions': 'समाधान',
    'Technology': 'प्रौद्योगिकी',
    'How It Works': 'यह कैसे काम करता है',
    'Store': 'स्टोर',
    'About': 'हमारे बारे में',
    'Login': 'लॉग इन',
    'Register': 'रजिस्टर करें',
    'Sign In': 'साइन इन',
    'Create Account': 'खाता बनाएँ',
    'Deploy Now': 'अभी शुरू करें',
    'Explore Store': 'स्टोर देखें',
    'High-Performance': 'उच्च प्रदर्शन',
    'Country & Currency / Language': 'देश और मुद्रा / भाषा',
    'Currency & Country': 'मुद्रा और देश',
    'Language (زبان)': 'भाषा (Language)',
    'Done': 'हो गया',
    'Technical Support': 'तकनीकी सहायता',
    'Submit Ticket': 'टिकट सबमिट करें',
    'Live Chat': 'लाइव चैट',
    'Track Ticket': 'टिकट ट्रैक करें',
    'Normal': 'सामान्य',
    'High': 'उच्च',
    'Urgent': 'अत्यावश्यक'
  },
  es: {
    'Home': 'Inicio',
    'Solutions': 'Soluciones',
    'Technology': 'Tecnología',
    'How It Works': 'Cómo Funciona',
    'Store': 'Tienda',
    'About': 'Nosotros',
    'Login': 'Iniciar Sesión',
    'Register': 'Registrarse',
    'Sign In': 'Acceder',
    'Create Account': 'Crear Cuenta',
    'Deploy Now': 'Desplegar Ahora',
    'Explore Store': 'Explorar Tienda',
    'High-Performance': 'Alto Rendimiento',
    'Done': 'Listo',
    'Technical Support': 'Soporte Técnico',
    'Submit Ticket': 'Enviar Ticket',
    'Live Chat': 'Chat en Vivo',
    'Track Ticket': 'Rastrear Ticket'
  },
  fr: {
    'Home': 'Accueil',
    'Solutions': 'Solutions',
    'Technology': 'Technologie',
    'How It Works': 'Comment ça marche',
    'Store': 'Boutique',
    'About': 'À propos',
    'Login': 'Connexion',
    'Register': 'S’inscrire',
    'Sign In': 'Se connecter',
    'Create Account': 'Créer un compte',
    'Deploy Now': 'Déployer',
    'Explore Store': 'Explorer la boutique',
    'High-Performance': 'Haute Performance',
    'Done': 'Terminé',
    'Technical Support': 'Support Technique',
    'Submit Ticket': 'Soumettre un ticket',
    'Live Chat': 'Chat en direct',
    'Track Ticket': 'Suivre le ticket'
  },
  de: {
    'Home': 'Startseite',
    'Solutions': 'Lösungen',
    'Technology': 'Technologie',
    'How It Works': 'So funktioniert es',
    'Store': 'Shop',
    'About': 'Über uns',
    'Login': 'Anmelden',
    'Register': 'Registrieren',
    'Sign In': 'Anmelden',
    'Create Account': 'Konto erstellen',
    'Deploy Now': 'Jetzt starten',
    'Explore Store': 'Shop entdecken',
    'High-Performance': 'Hochleistung',
    'Done': 'Fertig',
    'Technical Support': 'Technischer Support',
    'Submit Ticket': 'Ticket senden',
    'Live Chat': 'Live-Chat',
    'Track Ticket': 'Ticket verfolgen'
  },
  zh: {
    'Home': '首页',
    'Solutions': '解决方案',
    'Technology': '技术架构',
    'How It Works': '工作原理',
    'Store': '应用商店',
    'About': '关于我们',
    'Login': '登录',
    'Register': '注册',
    'Sign In': '登录',
    'Create Account': '创建账户',
    'Deploy Now': '立即部署',
    'Explore Store': '浏览商店',
    'High-Performance': '高性能',
    'Done': '完成',
    'Technical Support': '技术支持',
    'Submit Ticket': '提交工单',
    'Live Chat': '在线客服',
    'Track Ticket': '追踪工单'
  },
  tr: {
    'Home': 'Ana Sayfa',
    'Solutions': 'Çözümler',
    'Technology': 'Teknoloji',
    'How It Works': 'Nasıl Çalışır',
    'Store': 'Mağaza',
    'About': 'Hakkımızda',
    'Login': 'Giriş Yap',
    'Register': 'Kayıt Ol',
    'Sign In': 'Giriş Yap',
    'Create Account': 'Hesap Oluştur',
    'Deploy Now': 'Hemen Başla',
    'Explore Store': 'Mağazayı Keşfet',
    'High-Performance': 'Yüksek Performans',
    'Done': 'Tamam',
    'Technical Support': 'Teknik Destek',
    'Submit Ticket': 'Talep Gönder',
    'Live Chat': 'Canlı Destek',
    'Track Ticket': 'Talep Takip'
  },
  ja: {
    'Home': 'ホーム',
    'Solutions': 'ソリューション',
    'Technology': 'テクノロジー',
    'How It Works': '仕組み',
    'Store': 'ストア',
    'About': '会社概要',
    'Login': 'ログイン',
    'Register': '登録',
    'Sign In': 'サインイン',
    'Create Account': 'アカウント作成',
    'Deploy Now': '今すぐ導入',
    'Explore Store': 'ストアを見る',
    'High-Performance': '高性能',
    'Done': '完了',
    'Technical Support': 'テクニカルサポート',
    'Submit Ticket': 'チケット送信',
    'Live Chat': 'ライブチャット',
    'Track Ticket': 'チケット追跡'
  },
  pt: {
    'Home': 'Início',
    'Solutions': 'Soluções',
    'Technology': 'Tecnologia',
    'How It Works': 'Como Funciona',
    'Store': 'Loja',
    'About': 'Sobre',
    'Login': 'Entrar',
    'Register': 'Registrar',
    'Sign In': 'Entrar',
    'Create Account': 'Criar Conta',
    'Deploy Now': 'Implantar Agora',
    'Explore Store': 'Explorar Loja',
    'High-Performance': 'Alto Desempenho',
    'Done': 'Concluído',
    'Technical Support': 'Suporte Técnico',
    'Submit Ticket': 'Enviar Ticket',
    'Live Chat': 'Chat ao Vivo',
    'Track Ticket': 'Rastrear Ticket'
  },
  id: {
    'Home': 'Beranda',
    'Solutions': 'Solusi',
    'Technology': 'Teknologi',
    'How It Works': 'Cara Kerja',
    'Store': 'Toko',
    'About': 'Tentang Kami',
    'Login': 'Masuk',
    'Register': 'Daftar',
    'Sign In': 'Masuk',
    'Create Account': 'Buat Akun',
    'Deploy Now': 'Mulai Sekarang',
    'Explore Store': 'Jelajahi Toko',
    'High-Performance': 'Performa Tinggi',
    'Done': 'Selesai',
    'Technical Support': 'Dukungan Teknis',
    'Submit Ticket': 'Kirim Tiket',
    'Live Chat': 'Obrolan Langsung',
    'Track Ticket': 'Lacak Tiket'
  },
  it: {
    'Home': 'Home',
    'Solutions': 'Soluzioni',
    'Technology': 'Tecnologia',
    'How It Works': 'Come Funziona',
    'Store': 'Negozio',
    'About': 'Chi Siamo',
    'Login': 'Accedi',
    'Register': 'Registrati',
    'Sign In': 'Accedi',
    'Create Account': 'Crea Account',
    'Deploy Now': 'Distribuisci Ora',
    'Explore Store': 'Esplora Negozio',
    'High-Performance': 'Alte Prestazioni',
    'Done': 'Fatto',
    'Technical Support': 'Supporto Tecnico',
    'Submit Ticket': 'Invia Ticket',
    'Live Chat': 'Chat dal Vivo',
    'Track Ticket': 'Traccia Ticket'
  },
  ru: {
    'Home': 'Главная',
    'Solutions': 'Решения',
    'Technology': 'Технологии',
    'How It Works': 'Как это работает',
    'Store': 'Магазин',
    'About': 'О нас',
    'Login': 'Войти',
    'Register': 'Регистрация',
    'Sign In': 'Войти',
    'Create Account': 'Создать аккаунт',
    'Deploy Now': 'Запустить сейчас',
    'Explore Store': 'Перейти в магазин',
    'High-Performance': 'Высокая производительность',
    'Done': 'Готово',
    'Technical Support': 'Техническая поддержка',
    'Submit Ticket': 'Отправить тикет',
    'Live Chat': 'Онлайн-чат',
    'Track Ticket': 'Отследить тикет'
  }
};

@Injectable({
  providedIn: 'root'
})
export class DomTranslatorService {
  private loc = inject(LocalizationService);
  private router = inject(Router);

  private initialized = false;
  private observer: MutationObserver | null = null;
  private scanTimer: any = null;

  private textState = new WeakMap<Text, TrackedTextState>();
  private trackedTextNodes = new Set<Text>();
  private attrState = new WeakMap<Element, Map<string, TrackedTextState>>();
  private trackedElements = new Set<Element>();

  private langCache = new Map<string, Map<string, string>>();
  private inflightKeys = new Set<string>();
  private retryCounts = new Map<string, number>();

  init(): void {
    if (this.initialized || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.initialized = true;

    effect(() => {
      const langCode = this.loc.currentLangCode();
      this.ensureDirectionStaysLtr(langCode);
      if (langCode === 'en') {
        this.restoreAllToEnglish();
      } else {
        this.retryCounts.clear();
        this.scheduleScan(10);
      }
    });

    this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe(() => {
        if (this.loc.currentLangCode() !== 'en') {
          this.scheduleScan(60);
        }
      });

    this.observer = new MutationObserver((mutations) => {
      const currentLang = this.loc.currentLangCode();
      let needsScan = false;

      for (const m of mutations) {
        if (m.type === 'characterData' && m.target instanceof Text) {
          const tracked = this.textState.get(m.target);
          if (tracked) {
            if (m.target.nodeValue === tracked.lastApplied) {
              continue;
            }
            tracked.original = m.target.nodeValue || '';
            tracked.lastApplied = null;
            if (currentLang !== 'en') needsScan = true;
          } else if (currentLang !== 'en') {
            needsScan = true;
          }
        } else if (m.type === 'attributes' && m.target instanceof Element && m.attributeName) {
          const map = this.attrState.get(m.target);
          const entry = map?.get(m.attributeName);
          const currentVal = m.target.getAttribute(m.attributeName) || '';
          if (entry) {
            if (currentVal === entry.lastApplied) continue;
            entry.original = currentVal;
            entry.lastApplied = null;
            if (currentLang !== 'en') needsScan = true;
          } else if (currentLang !== 'en') {
            needsScan = true;
          }
        } else if (m.type === 'childList' && m.addedNodes.length > 0) {
          if (currentLang !== 'en') needsScan = true;
        }
      }

      if (needsScan) {
        this.scheduleScan(65);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRS]
    });

    if (this.loc.currentLangCode() !== 'en') {
      this.scheduleScan(30);
    }
  }

  private normalizeKey(raw: string): string {
    return raw.replace(/\s+/g, ' ').trim();
  }

  private ensureDirectionStaysLtr(langCode: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = langCode;
    }
  }

  private scheduleScan(delayMs = 55): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
    }
    this.scanTimer = setTimeout(() => {
      this.scanTimer = null;
      void this.scanAndTranslate();
    }, delayMs);
  }

  private getLangMap(lang: string): Map<string, string> {
    let map = this.langCache.get(lang);
    if (!map) {
      map = new Map<string, string>();
      const instant = INSTANT_PHRASES[lang];
      if (instant) {
        for (const [k, v] of Object.entries(instant)) {
          map.set(this.normalizeKey(k), v);
        }
      }
      try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            for (const [k, v] of Object.entries(parsed)) {
              if (typeof v === 'string' && v.trim()) {
                if (NON_LATIN_SCRIPTS.has(lang) && v.trim() === k.trim()) continue;
                map.set(k, v);
              }
            }
          }
        }
      } catch {}
      this.langCache.set(lang, map);
    }
    return map;
  }

  private persistLangMap(lang: string, map: Map<string, string>): void {
    try {
      const obj: Record<string, string> = {};
      let count = 0;
      for (const [k, v] of map.entries()) {
        if (NON_LATIN_SCRIPTS.has(lang) && v.trim() === k.trim()) continue;
        obj[k] = v;
        count++;
        if (count >= 2000) break;
      }
      localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(obj));
    } catch {}
  }

  private shouldSkipElement(el: Element | null): boolean {
    let cur: Element | null = el;
    while (cur) {
      if (SKIP_TAGS.has(cur.tagName)) return true;
      if (cur.getAttribute('translate') === 'no' || cur.hasAttribute('data-no-translate')) return true;
      if (
        cur.classList.contains('notranslate') ||
        cur.classList.contains('material-icons') ||
        cur.classList.contains('material-icons-outlined') ||
        cur.classList.contains('material-icons-round') ||
        cur.classList.contains('material-icons-sharp') ||
        cur.classList.contains('material-symbols-outlined')
      ) {
        return true;
      }
      if ((cur as HTMLElement).isContentEditable) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  private isTranslatableText(raw: string): boolean {
    const t = this.normalizeKey(raw);
    if (t.length < 2 || t.length > 1400) return false;
    if (!/[A-Za-z]/.test(t)) return false;
    if (BRAND_AND_TECH_TOKENS.has(t)) return false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false;
    if (/^(https?:\/\/|www\.)/i.test(t)) return false;
    if (/^[+\d\s().,:/\-·•%$€£¥₹₨৳₩₫₱₺]+$/.test(t)) return false;
    if (/^[A-Z]{2,5}(-[A-Z0-9]{2,})+$/.test(t)) return false;
    if (/^[\d\s*X•-]+$/.test(t)) return false;
    if (/^1\s+USD\s*=\s*[\d,.]+\s+[A-Z]{2,4}$/i.test(t)) return false;
    if (/^(PKR|USD|EUR|GBP|SAR|AED|INR|CAD|AUD|QAR|KWD|BHD|OMR|TRY|CNY|JPY|SGD|MYR|BRL|EGP|ZAR|NGN|BDT|IDR|PHP|KRW|CHF|NZD|MXN|SEK|NOK|DKK|PLN|THB|VND|ISO|API|SLA|PWA|USB|POS|ERP|CRM|SMS|SMTP|PDF|JSON|SQL|WAL|RTL|LTR|HTTPS|TLS|AES|RBAC|VISA|AMEX|MM\/YY)$/i.test(t)) {
      return false;
    }
    if (/^e\.g\.\s+/i.test(t) || /^you@company\.com$/i.test(t)) return false;
    return true;
  }

  private restoreAllToEnglish(): void {
    for (const node of Array.from(this.trackedTextNodes)) {
      if (!node.isConnected) {
        this.trackedTextNodes.delete(node);
        continue;
      }
      const state = this.textState.get(node);
      if (state && node.nodeValue !== state.original) {
        state.lastApplied = state.original;
        node.nodeValue = state.original;
      }
      if (state) state.lastApplied = null;
    }

    for (const el of Array.from(this.trackedElements)) {
      if (!el.isConnected) {
        this.trackedElements.delete(el);
        continue;
      }
      const map = this.attrState.get(el);
      if (!map) continue;
      for (const [attr, state] of map.entries()) {
        if ((el.getAttribute(attr) || '') !== state.original) {
          state.lastApplied = state.original;
          el.setAttribute(attr, state.original);
        }
        state.lastApplied = null;
      }
    }
  }

  private async scanAndTranslate(): Promise<void> {
    const targetLang = this.loc.currentLangCode();
    if (targetLang === 'en' || typeof document === 'undefined' || !document.body) {
      return;
    }

    const dict = this.getLangMap(targetLang);
    const missingSet = new Set<string>();

    // 1. Walk visible DOM text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const candidateNodes: Text[] = [];

    let curNode = walker.nextNode();
    while (curNode) {
      if (curNode instanceof Text && !this.shouldSkipElement(curNode.parentElement)) {
        let state = this.textState.get(curNode);
        if (!state) {
          const val = curNode.nodeValue || '';
          if (this.isTranslatableText(val)) {
            state = { original: val, lastApplied: null };
            this.textState.set(curNode, state);
            this.trackedTextNodes.add(curNode);
          }
        }
        if (state && this.isTranslatableText(state.original)) {
          candidateNodes.push(curNode);
        }
      }
      curNode = walker.nextNode();
    }

    for (const node of candidateNodes) {
      const state = this.textState.get(node);
      if (!state) continue;
      const key = this.normalizeKey(state.original);
      const hit = dict.get(key);
      if (hit) {
        const leading = state.original.match(/^\s*/)?.[0] || '';
        const trailing = state.original.match(/\s*$/)?.[0] || '';
        const nextText = `${leading}${hit}${trailing}`;
        if (node.nodeValue !== nextText) {
          state.lastApplied = nextText;
          node.nodeValue = nextText;
        }
      } else {
        missingSet.add(key);
      }
    }

    // 2. Walk translatable element attributes
    const attrSelector = TRANSLATABLE_ATTRS.map((a) => `[${a}]`).join(',');
    const attrEls = Array.from(document.body.querySelectorAll(attrSelector));

    for (const el of attrEls) {
      if (this.shouldSkipElement(el)) continue;
      let map = this.attrState.get(el);
      if (!map) {
        map = new Map<string, TrackedTextState>();
        this.attrState.set(el, map);
        this.trackedElements.add(el);
      }
      for (const attr of TRANSLATABLE_ATTRS) {
        const rawAttr = el.getAttribute(attr);
        if (!rawAttr) continue;
        let entry = map.get(attr);
        if (!entry) {
          if (!this.isTranslatableText(rawAttr)) continue;
          entry = { original: rawAttr, lastApplied: null };
          map.set(attr, entry);
        }
        const key = this.normalizeKey(entry.original);
        const hit = dict.get(key);
        if (hit) {
          if (el.getAttribute(attr) !== hit) {
            entry.lastApplied = hit;
            el.setAttribute(attr, hit);
          }
        } else {
          missingSet.add(key);
        }
      }
    }

    if (missingSet.size === 0) return;

    // 3. Batch missing items cleanly (concurrency = 2 so upstream never rate-limits)
    const toFetch: string[] = [];
    for (const phrase of missingSet) {
      const flightKey = `${targetLang}::${phrase}`;
      const retries = this.retryCounts.get(flightKey) || 0;
      if (!this.inflightKeys.has(flightKey) && retries < 2) {
        this.inflightKeys.add(flightKey);
        toFetch.push(phrase);
      }
    }
    if (toFetch.length === 0) return;

    const batchSize = 40;
    const batches: string[][] = [];
    for (let i = 0; i < toFetch.length; i += batchSize) {
      batches.push(toFetch.slice(i, i + batchSize));
    }

    let hadMissedItems = false;
    let nextBatchIdx = 0;
    const runWorker = async () => {
      while (nextBatchIdx < batches.length) {
        const idx = nextBatchIdx++;
        const batch = batches[idx];
        try {
          const resp = await fetch('/api/i18n/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetLang, texts: batch })
          });
          if (resp.ok) {
            const json = await resp.json();
            const mapData = json?.translations;
            if (mapData && typeof mapData === 'object') {
              for (const orig of batch) {
                const tr = mapData[orig];
                const flightKey = `${targetLang}::${orig}`;
                if (typeof tr === 'string' && tr.trim()) {
                  const cleanTr = tr.trim();
                  const unchangedNonLatin = NON_LATIN_SCRIPTS.has(targetLang) && cleanTr === orig;
                  if (!unchangedNonLatin) {
                    dict.set(orig, cleanTr);
                    continue;
                  }
                }
                this.retryCounts.set(flightKey, (this.retryCounts.get(flightKey) || 0) + 1);
                hadMissedItems = true;
              }
            } else {
              hadMissedItems = true;
            }
          } else {
            hadMissedItems = true;
          }
        } catch {
          hadMissedItems = true;
          for (const orig of batch) {
            const flightKey = `${targetLang}::${orig}`;
            this.retryCounts.set(flightKey, (this.retryCounts.get(flightKey) || 0) + 1);
          }
        } finally {
          for (const phrase of batch) {
            this.inflightKeys.delete(`${targetLang}::${phrase}`);
          }
        }

        // Apply each resolved batch right away so page translates progressively & smoothly
        if (this.loc.currentLangCode() === targetLang) {
          this.applyDictionaryNow(targetLang);
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(2, batches.length) }, () => runWorker())
    );

    this.persistLangMap(targetLang, dict);

    // If any items failed transiently, schedule one automatic retry pass after short backoff
    if (hadMissedItems && this.loc.currentLangCode() === targetLang) {
      this.scheduleScan(450);
    }
  }

  private applyDictionaryNow(targetLang: string): void {
    const dict = this.getLangMap(targetLang);
    for (const node of Array.from(this.trackedTextNodes)) {
      if (!node.isConnected) {
        this.trackedTextNodes.delete(node);
        continue;
      }
      const state = this.textState.get(node);
      if (!state) continue;
      const hit = dict.get(this.normalizeKey(state.original));
      if (!hit) continue;
      const leading = state.original.match(/^\s*/)?.[0] || '';
      const trailing = state.original.match(/\s*$/)?.[0] || '';
      const nextText = `${leading}${hit}${trailing}`;
      if (node.nodeValue !== nextText) {
        state.lastApplied = nextText;
        node.nodeValue = nextText;
      }
    }

    for (const el of Array.from(this.trackedElements)) {
      if (!el.isConnected) {
        this.trackedElements.delete(el);
        continue;
      }
      const map = this.attrState.get(el);
      if (!map) continue;
      for (const [attr, entry] of map.entries()) {
        const hit = dict.get(this.normalizeKey(entry.original));
        if (hit && el.getAttribute(attr) !== hit) {
          entry.lastApplied = hit;
          el.setAttribute(attr, hit);
        }
      }
    }
  }
}
