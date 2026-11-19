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

const NON_LATIN_SCRIPTS = new Set([
  'ur', 'sd', 'pa', 'ps', 'skr', 'bal', 'ks', 'ar', 'fa',
  'hi', 'bn', 'ne', 'si',
  'zh', 'ja', 'ko', 'th', 'my', 'km', 'lo', 'dv',
  'ru', 'uk', 'kk', 'tg', 'ky', 'ka', 'hy', 'mn', 'bg', 'sr', 'be', 'mk',
  'el', 'he', 'am'
]);
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const CACHE_PREFIX = 'scs_i18n_v3_';
const LEGACY_CACHE_PREFIX = 'scs_i18n_v2_';
const IDB_NAME = 'SoftCodeI18nOfflineVault';
const IDB_STORE = 'packs';

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
  },
  bn: {
    'Home': 'বাড়ি',
    'Solutions': 'সমাধান',
    'Technology': 'প্রযুক্তি',
    'How It Works': 'কিভাবে এটা কাজ করে',
    'Store': 'দোকান',
    'About': 'সম্পর্কে',
    'Login': 'লগইন করুন',
    'Register': 'নিবন্ধন করুন',
    'Sign In': 'সাইন ইন করুন',
    'Create Account': 'অ্যাকাউন্ট তৈরি করুন',
    'Deploy Now': 'এখনই স্থাপন করুন',
    'Explore Store': 'দোকান অন্বেষণ',
    'High-Performance': 'উচ্চ কর্মক্ষমতা',
    'Done': 'সম্পন্ন',
    'Technical Support': 'প্রযুক্তিগত সহায়তা',
    'Submit Ticket': 'টিকিট জমা দিন',
    'Live Chat': 'লাইভ চ্যাট',
    'Track Ticket': 'ট্র্যাক টিকেট'
  },
  fa: {
    'Home': 'صفحه اصلی',
    'Solutions': 'راه حل ها',
    'Technology': 'تکنولوژی',
    'How It Works': 'چگونه کار می کند',
    'Store': 'فروشگاه',
    'About': 'درباره',
    'Login': 'وارد شوید',
    'Register': 'ثبت نام کنید',
    'Sign In': 'وارد شوید',
    'Create Account': 'ایجاد حساب کاربری',
    'Deploy Now': 'اکنون مستقر شود',
    'Explore Store': 'فروشگاه را کاوش کنید',
    'High-Performance': 'با کارایی بالا',
    'Done': 'انجام شد',
    'Technical Support': 'پشتیبانی فنی',
    'Submit Ticket': 'ارسال بلیط',
    'Live Chat': 'چت زنده',
    'Track Ticket': 'بلیط آهنگ'
  },
  ne: {
    'Home': 'घर',
    'Solutions': 'समाधानहरू',
    'Technology': 'प्रविधि',
    'How It Works': 'यो कसरी काम गर्दछ',
    'Store': 'स्टोर',
    'About': 'बारे',
    'Login': 'लगइन गर्नुहोस्',
    'Register': 'दर्ता गर्नुहोस्',
    'Sign In': 'साइन इन गर्नुहोस्',
    'Create Account': 'खाता सिर्जना गर्नुहोस्',
    'Deploy Now': 'अहिले डिप्लोय गर्नुहोस्',
    'Explore Store': 'स्टोर अन्वेषण गर्नुहोस्',
    'High-Performance': 'उच्च प्रदर्शन',
    'Done': 'सकियो',
    'Technical Support': 'प्राविधिक समर्थन',
    'Submit Ticket': 'टिकट पेश गर्नुहोस्',
    'Live Chat': 'लाइभ च्याट',
    'Track Ticket': 'ट्र्याक टिकट'
  },
  ko: {
    'Home': '집',
    'Solutions': '솔루션',
    'Technology': '기술',
    'How It Works': '작동 방식',
    'Store': '가게',
    'About': '에 대한',
    'Login': '로그인',
    'Register': '등록하다',
    'Sign In': '로그인',
    'Create Account': '계정 만들기',
    'Deploy Now': '지금 배포',
    'Explore Store': '매장 살펴보기',
    'High-Performance': '고성능',
    'Done': '완료',
    'Technical Support': '기술지원',
    'Submit Ticket': '티켓 제출',
    'Live Chat': '라이브 채팅',
    'Track Ticket': '트랙 티켓'
  },
  si: {
    'Home': 'නිවස',
    'Solutions': 'විසඳුම්',
    'Technology': 'තාක්ෂණය',
    'How It Works': 'එය ක්රියා කරන ආකාරය',
    'Store': 'ගබඩා කරන්න',
    'About': 'ගැන',
    'Login': 'ඇතුල් වන්න',
    'Register': 'ලියාපදිංචි කරන්න',
    'Sign In': 'පුරන්න',
    'Create Account': 'ගිණුම තනන්න',
    'Deploy Now': 'දැන් යොදවන්න',
    'Explore Store': 'ගබඩාව ගවේෂණය කරන්න',
    'High-Performance': 'ඉහළ කාර්ය සාධනය',
    'Done': 'කළා',
    'Technical Support': 'තාක්ෂණික සහාය',
    'Submit Ticket': 'ටිකට්පත් ඉදිරිපත් කරන්න',
    'Live Chat': 'සජීවී කතාබස්',
    'Track Ticket': 'ට්‍රැක් ටිකට්'
  },
  th: {
    'Home': 'บ้าน',
    'Solutions': 'โซลูชั่น',
    'Technology': 'เทคโนโลยี',
    'How It Works': 'มันทำงานอย่างไร',
    'Store': 'เก็บ',
    'About': 'เกี่ยวกับ',
    'Login': 'เข้าสู่ระบบ',
    'Register': 'ลงทะเบียน',
    'Sign In': 'เข้าสู่ระบบ',
    'Create Account': 'สร้างบัญชี',
    'Deploy Now': 'ปรับใช้ทันที',
    'Explore Store': 'สำรวจร้านค้า',
    'High-Performance': 'ประสิทธิภาพสูง',
    'Done': 'เสร็จแล้ว',
    'Technical Support': 'การสนับสนุนด้านเทคนิค',
    'Submit Ticket': 'ส่งตั๋ว',
    'Live Chat': 'แชทสด',
    'Track Ticket': 'ติดตามตั๋ว'
  },
  vi: {
    'Home': 'Trang chủ',
    'Solutions': 'Giải pháp',
    'Technology': 'Công nghệ',
    'How It Works': 'Nó hoạt động như thế nào',
    'Store': 'Cửa hàng',
    'About': 'Về',
    'Login': 'Đăng nhập',
    'Register': 'Đăng ký',
    'Sign In': 'Đăng nhập',
    'Create Account': 'Tạo tài khoản',
    'Deploy Now': 'Triển khai ngay',
    'Explore Store': 'Khám phá cửa hàng',
    'High-Performance': 'Hiệu suất cao',
    'Done': 'Xong',
    'Technical Support': 'Hỗ trợ kỹ thuật',
    'Submit Ticket': 'Gửi vé',
    'Live Chat': 'Trò chuyện trực tiếp',
    'Track Ticket': 'Theo dõi vé'
  },
  ms: {
    'Home': 'Rumah',
    'Solutions': 'Penyelesaian',
    'Technology': 'Teknologi',
    'How It Works': 'Bagaimana Ia Berfungsi',
    'Store': 'Kedai',
    'About': 'Tentang',
    'Login': 'Log masuk',
    'Register': 'Daftar',
    'Sign In': 'Log Masuk',
    'Create Account': 'Buat Akaun',
    'Deploy Now': 'Gunakan Sekarang',
    'Explore Store': 'Terokai Kedai',
    'High-Performance': 'Berprestasi Tinggi',
    'Done': 'Selesai',
    'Technical Support': 'Sokongan Teknikal',
    'Submit Ticket': 'Hantar Tiket',
    'Live Chat': 'Sembang Langsung',
    'Track Ticket': 'Tiket Trek'
  },
  tl: {
    'Home': 'Bahay',
    'Solutions': 'Mga solusyon',
    'Technology': 'Teknolohiya',
    'How It Works': 'Paano Ito Gumagana',
    'Store': 'Tindahan',
    'About': 'Tungkol sa',
    'Login': 'Mag-login',
    'Register': 'Magrehistro',
    'Sign In': 'Mag-sign In',
    'Create Account': 'Lumikha ng Account',
    'Deploy Now': 'I-deploy Ngayon',
    'Explore Store': 'I-explore ang Store',
    'High-Performance': 'Mataas na Pagganap',
    'Done': 'Tapos na',
    'Technical Support': 'Teknikal na Suporta',
    'Submit Ticket': 'Magsumite ng Ticket',
    'Live Chat': 'Live Chat',
    'Track Ticket': 'Track Ticket'
  },
  my: {
    'Home': 'အိမ်',
    'Solutions': 'ဖြေရှင်းချက်များ',
    'Technology': 'နည်းပညာ',
    'How It Works': 'ဘယ်လိုအလုပ်လုပ်လဲ။',
    'Store': 'စတိုး',
    'About': 'အကြောင်း',
    'Login': 'လော့ဂ်အင်',
    'Register': 'မှတ်ပုံတင်ပါ။',
    'Sign In': 'ဆိုင်းအင်လုပ်ခြင်း',
    'Create Account': 'အကောင့်ပြုလုပ်ပါ',
    'Deploy Now': 'ယခုအသုံးပြုပါ။',
    'Explore Store': 'စတိုးကို စူးစမ်းပါ။',
    'High-Performance': 'စွမ်းဆောင်ရည်မြင့်',
    'Done': 'ပြီးပြီ။',
    'Technical Support': 'နည်းပညာနှင့်ပတ်သက်သောအထောက်အပံ့',
    'Submit Ticket': 'လက်မှတ်တင်သွင်းပါ။',
    'Live Chat': 'တိုက်ရိုက်စကားပြောခြင်း။',
    'Track Ticket': 'ခြေရာခံလက်မှတ်'
  },
  km: {
    'Home': 'ផ្ទះ',
    'Solutions': 'ដំណោះស្រាយ',
    'Technology': 'បច្ចេកវិទ្យា',
    'How It Works': 'របៀបដែលវាដំណើរការ',
    'Store': 'ហាង',
    'About': 'អំពី',
    'Login': 'ចូល',
    'Register': 'ចុះឈ្មោះ',
    'Sign In': 'ចូល',
    'Create Account': 'បង្កើតគណនី',
    'Deploy Now': 'ដាក់ពង្រាយឥឡូវនេះ',
    'Explore Store': 'រុករកហាង',
    'High-Performance': 'ប្រសិទ្ធភាពខ្ពស់។',
    'Done': 'រួចរាល់',
    'Technical Support': 'ជំនួយបច្ចេកទេស',
    'Submit Ticket': 'ដាក់ស្នើសំបុត្រ',
    'Live Chat': 'ជជែកផ្ទាល់',
    'Track Ticket': 'តាមដានសំបុត្រ'
  },
  az: {
    'Home': 'Ev',
    'Solutions': 'Həll yolları',
    'Technology': 'Texnologiya',
    'How It Works': 'Necə işləyir',
    'Store': 'Mağaza',
    'About': 'Haqqında',
    'Login': 'Daxil ol',
    'Register': 'Qeydiyyatdan keçin',
    'Sign In': 'Daxil ol',
    'Create Account': 'Hesab yaradın',
    'Deploy Now': 'İndi Yerləşdirin',
    'Explore Store': 'Mağazanı araşdırın',
    'High-Performance': 'Yüksək Performanslı',
    'Done': 'Bitdi',
    'Technical Support': 'Texniki Dəstək',
    'Submit Ticket': 'Bilet təqdim edin',
    'Live Chat': 'Canlı Söhbət',
    'Track Ticket': 'Track Bilet'
  },
  uz: {
    'Home': 'Uy',
    'Solutions': 'Yechimlar',
    'Technology': 'Texnologiya',
    'How It Works': 'U qanday ishlaydi',
    'Store': 'Do\'kon',
    'About': 'Haqida',
    'Login': 'Tizimga kirish',
    'Register': 'Roʻyxatdan oʻtish',
    'Sign In': 'Tizimga kirish',
    'Create Account': 'Hisob yaratish',
    'Deploy Now': 'Hozir tarqating',
    'Explore Store': 'Do\'konni o\'rganing',
    'High-Performance': 'Yuqori unumdorlik',
    'Done': 'Bajarildi',
    'Technical Support': 'Texnik yordam',
    'Submit Ticket': 'Chipta yuborish',
    'Live Chat': 'Jonli suhbat',
    'Track Ticket': 'Kuzatuv chiptasi'
  },
  kk: {
    'Home': 'Үй',
    'Solutions': 'Шешімдер',
    'Technology': 'Технология',
    'How It Works': 'Ол қалай жұмыс істейді',
    'Store': 'Дүкен',
    'About': 'туралы',
    'Login': 'Жүйеге кіру',
    'Register': 'Тіркелу',
    'Sign In': 'Кіру',
    'Create Account': 'Аккаунт ашу',
    'Deploy Now': 'Қазір орналастыру',
    'Explore Store': 'Дүкенді зерттеңіз',
    'High-Performance': 'Жоғары өнімділік',
    'Done': 'Дайын',
    'Technical Support': 'Техникалық көмек',
    'Submit Ticket': 'Билет жіберу',
    'Live Chat': 'Тікелей чат',
    'Track Ticket': 'Жол жүру билеті'
  },
  nl: {
    'Home': 'Thuis',
    'Solutions': 'Oplossingen',
    'Technology': 'Technologie',
    'How It Works': 'Hoe het werkt',
    'Store': 'Winkel',
    'About': 'Over',
    'Login': 'Login',
    'Register': 'Register',
    'Sign In': 'Inloggen',
    'Create Account': 'Account aanmaken',
    'Deploy Now': 'Nu implementeren',
    'Explore Store': 'Ontdek winkel',
    'High-Performance': 'Hoge prestaties',
    'Done': 'Klaar',
    'Technical Support': 'Technische ondersteuning',
    'Submit Ticket': 'Ticket indienen',
    'Live Chat': 'Livechat',
    'Track Ticket': 'Trackticket'
  },
  pl: {
    'Home': 'Dom',
    'Solutions': 'Rozwiązania',
    'Technology': 'Technologia',
    'How It Works': 'Jak to działa',
    'Store': 'Sklep',
    'About': 'O',
    'Login': 'Login',
    'Register': 'Rejestr',
    'Sign In': 'Zalogować się',
    'Create Account': 'Utwórz konto',
    'Deploy Now': 'Wdróż teraz',
    'Explore Store': 'Przeglądaj sklep',
    'High-Performance': 'Wysoka wydajność',
    'Done': 'Zrobione',
    'Technical Support': 'Wsparcie techniczne',
    'Submit Ticket': 'Prześlij bilet',
    'Live Chat': 'Czat na żywo',
    'Track Ticket': 'Bilet na utwór'
  },
  uk: {
    'Home': 'додому',
    'Solutions': 'Рішення',
    'Technology': 'технології',
    'How It Works': 'Як це працює',
    'Store': 'Магазин',
    'About': 'про',
    'Login': 'Логін',
    'Register': 'зареєструватися',
    'Sign In': 'Увійти',
    'Create Account': 'Створити акаунт',
    'Deploy Now': 'Розгорнути зараз',
    'Explore Store': 'Дослідіть магазин',
    'High-Performance': 'Висока продуктивність',
    'Done': 'Готово',
    'Technical Support': 'Технічна підтримка',
    'Submit Ticket': 'Надіслати квиток',
    'Live Chat': 'Живий чат',
    'Track Ticket': 'Трек-квиток'
  },
  sv: {
    'Home': 'Hem',
    'Solutions': 'Lösningar',
    'Technology': 'Teknologi',
    'How It Works': 'Hur det fungerar',
    'Store': 'Lagra',
    'About': 'Om',
    'Login': 'Inloggning',
    'Register': 'Register',
    'Sign In': 'Logga in',
    'Create Account': 'Skapa konto',
    'Deploy Now': 'Distribuera nu',
    'Explore Store': 'Utforska butik',
    'High-Performance': 'Högpresterande',
    'Done': 'Gjort',
    'Technical Support': 'Teknisk support',
    'Submit Ticket': 'Skicka in biljett',
    'Live Chat': 'Livechatt',
    'Track Ticket': 'Spårbiljett'
  },
  no: {
    'Home': 'Hjem',
    'Solutions': 'Løsninger',
    'Technology': 'Teknologi',
    'How It Works': 'Hvordan det fungerer',
    'Store': 'Lager',
    'About': 'Om',
    'Login': 'Logg inn',
    'Register': 'Register',
    'Sign In': 'Logg på',
    'Create Account': 'Opprett konto',
    'Deploy Now': 'Distribuer nå',
    'Explore Store': 'Utforsk butikken',
    'High-Performance': 'Høy ytelse',
    'Done': 'Ferdig',
    'Technical Support': 'Teknisk støtte',
    'Submit Ticket': 'Send inn billett',
    'Live Chat': 'Live Chat',
    'Track Ticket': 'Sporbillett'
  },
  da: {
    'Home': 'Hjem',
    'Solutions': 'Løsninger',
    'Technology': 'Teknologi',
    'How It Works': 'Hvordan det virker',
    'Store': 'Butik',
    'About': 'Om',
    'Login': 'Log ind',
    'Register': 'Register',
    'Sign In': 'Log ind',
    'Create Account': 'Opret konto',
    'Deploy Now': 'Implementer nu',
    'Explore Store': 'Udforsk butik',
    'High-Performance': 'Højtydende',
    'Done': 'Færdig',
    'Technical Support': 'Teknisk support',
    'Submit Ticket': 'Indsend billet',
    'Live Chat': 'Live Chat',
    'Track Ticket': 'Sporbillet'
  },
  fi: {
    'Home': 'Kotiin',
    'Solutions': 'Ratkaisut',
    'Technology': 'Tekniikka',
    'How It Works': 'Miten se toimii',
    'Store': 'Store',
    'About': 'Noin',
    'Login': 'Kirjaudu sisään',
    'Register': 'Rekisteröidy',
    'Sign In': 'Kirjaudu sisään',
    'Create Account': 'Luo tili',
    'Deploy Now': 'Ota käyttöön nyt',
    'Explore Store': 'Tutustu kauppaan',
    'High-Performance': 'Korkea suorituskyky',
    'Done': 'Tehty',
    'Technical Support': 'Tekninen tuki',
    'Submit Ticket': 'Lähetä lippu',
    'Live Chat': 'Live Chat',
    'Track Ticket': 'Rata Lippu'
  },
  el: {
    'Home': 'Σπίτι',
    'Solutions': 'Λύσεις',
    'Technology': 'Τεχνολογία',
    'How It Works': 'Πώς λειτουργεί',
    'Store': 'Κατάστημα',
    'About': 'Για',
    'Login': 'Σύνδεση',
    'Register': 'Μητρώο',
    'Sign In': 'Είσοδος',
    'Create Account': 'Δημιουργία λογαριασμού',
    'Deploy Now': 'Αναπτύξτε τώρα',
    'Explore Store': 'Εξερευνήστε το κατάστημα',
    'High-Performance': 'Υψηλής απόδοσης',
    'Done': 'Γινώμενος',
    'Technical Support': 'Τεχνική Υποστήριξη',
    'Submit Ticket': 'Υποβολή εισιτηρίου',
    'Live Chat': 'Ζωντανή συνομιλία',
    'Track Ticket': 'Εισιτήριο πίστας'
  },
  he: {
    'Home': 'בַּיִת',
    'Solutions': 'פתרונות',
    'Technology': 'טֶכנוֹלוֹגִיָה',
    'How It Works': 'איך זה עובד',
    'Store': 'חנות',
    'About': 'אוֹדוֹת',
    'Login': 'כְּנִיסָה לַמַעֲרֶכֶת',
    'Register': 'לִרְשׁוֹם',
    'Sign In': 'היכנס',
    'Create Account': 'צור חשבון',
    'Deploy Now': 'פרוס עכשיו',
    'Explore Store': 'גלה את החנות',
    'High-Performance': 'ביצועים גבוהים',
    'Done': 'נַעֲשָׂה',
    'Technical Support': 'תמיכה טכנית',
    'Submit Ticket': 'שלח כרטיס',
    'Live Chat': 'צ\'אט חי',
    'Track Ticket': 'כרטיס מסלול'
  },
  cs: {
    'Home': 'Domov',
    'Solutions': 'Řešení',
    'Technology': 'Technologie',
    'How It Works': 'Jak to funguje',
    'Store': 'Obchod',
    'About': 'O',
    'Login': 'Přihlášení',
    'Register': 'Rejstřík',
    'Sign In': 'Přihlaste se',
    'Create Account': 'Vytvořit účet',
    'Deploy Now': 'Nasadit hned',
    'Explore Store': 'Prozkoumat obchod',
    'High-Performance': 'Vysoký výkon',
    'Done': 'Hotovo',
    'Technical Support': 'Technická podpora',
    'Submit Ticket': 'Odeslat vstupenku',
    'Live Chat': 'Živý chat',
    'Track Ticket': 'Sledovat lístek'
  },
  hu: {
    'Home': 'Otthon',
    'Solutions': 'Megoldások',
    'Technology': 'Technológia',
    'How It Works': 'Hogyan működik',
    'Store': 'Bolt',
    'About': 'Körülbelül',
    'Login': 'Bejelentkezés',
    'Register': 'Nyilvántartás',
    'Sign In': 'Jelentkezzen be',
    'Create Account': 'Fiók létrehozása',
    'Deploy Now': 'Telepítse most',
    'Explore Store': 'Fedezze fel az üzletet',
    'High-Performance': 'Nagy teljesítményű',
    'Done': 'Kész',
    'Technical Support': 'Műszaki támogatás',
    'Submit Ticket': 'Jegy benyújtása',
    'Live Chat': 'Élő csevegés',
    'Track Ticket': 'Pályajegy'
  },
  ro: {
    'Home': 'Acasă',
    'Solutions': 'Soluții',
    'Technology': 'Tehnologie',
    'How It Works': 'Cum funcționează',
    'Store': 'Magazin',
    'About': 'Despre',
    'Login': 'Log in',
    'Register': 'Registru',
    'Sign In': 'Conectare',
    'Create Account': 'Creează cont',
    'Deploy Now': 'Implementează acum',
    'Explore Store': 'Explorați magazinul',
    'High-Performance': 'Înaltă performanță',
    'Done': 'Făcut',
    'Technical Support': 'Suport tehnic',
    'Submit Ticket': 'Trimiteți biletul',
    'Live Chat': 'Chat live',
    'Track Ticket': 'Bilet de pistă'
  },
  sw: {
    'Home': 'Nyumbani',
    'Solutions': 'Ufumbuzi',
    'Technology': 'Teknolojia',
    'How It Works': 'Jinsi Inavyofanya Kazi',
    'Store': 'Hifadhi',
    'About': 'Kuhusu',
    'Login': 'Ingia',
    'Register': 'Sajili',
    'Sign In': 'Ingia',
    'Create Account': 'Fungua Akaunti',
    'Deploy Now': 'Sambaza Sasa',
    'Explore Store': 'Gundua Duka',
    'High-Performance': 'Utendaji wa Juu',
    'Done': 'Imekamilika',
    'Technical Support': 'Msaada wa Kiufundi',
    'Submit Ticket': 'Peana Tiketi',
    'Live Chat': 'Chat ya Moja kwa Moja',
    'Track Ticket': 'Tikiti ya Kufuatilia'
  },
  am: {
    'Home': 'ቤት',
    'Solutions': 'መፍትሄዎች',
    'Technology': 'ቴክኖሎጂ',
    'How It Works': 'እንዴት እንደሚሰራ',
    'Store': 'ማከማቻ',
    'About': 'ስለ',
    'Login': 'ግባ',
    'Register': 'ይመዝገቡ',
    'Sign In': 'ይግቡ',
    'Create Account': 'መለያ ፍጠር',
    'Deploy Now': 'አሁን አሰማር',
    'Explore Store': 'ማከማቻን ያስሱ',
    'High-Performance': 'ከፍተኛ አፈጻጸም',
    'Done': 'ተከናውኗል',
    'Technical Support': 'የቴክኒክ ድጋፍ',
    'Submit Ticket': 'ቲኬት አስገባ',
    'Live Chat': 'የቀጥታ ውይይት',
    'Track Ticket': 'ትኬት ይከታተሉ'
  },
  tg: {
    'Home': 'Хона',
    'Solutions': 'Ҳалли',
    'Technology': 'Технология',
    'How It Works': 'Чӣ тавр он кор мекунад',
    'Store': 'Мағоза',
    'About': 'Дар бораи',
    'Login': 'Даромадан',
    'Register': 'Сабти ном',
    'Sign In': 'Даромад',
    'Create Account': 'Ҳисоб кушоед',
    'Deploy Now': 'Ҳоло ҷойгир кунед',
    'Explore Store': 'Дӯконро омӯзед',
    'High-Performance': 'Самаранокии баланд',
    'Done': 'Иҷро шуд',
    'Technical Support': 'Пуштибонии фаннӣ',
    'Submit Ticket': 'Билетро пешниҳод кунед',
    'Live Chat': 'Чати зинда',
    'Track Ticket': 'Чиптаи трек',
    'Country & Currency / Language': 'Кишвар ва асъор / забон',
    'Select your country to update all prices & text': 'Барои нав кардани ҳама нархҳо ва матн кишвари худро интихоб кунед',
    'Currency & Country': 'Асъор ва кишвар',
    'Live forex rates synced automatically': 'Қурбҳои мустақими форекс ба таври худкор ҳамоҳанг карда мешаванд',
    'Connected to SoftCode Ops Desk': 'Ба SoftCode Ops Desk пайваст шудааст',
    'Normal': 'Муқаррарӣ',
    'High': 'Баланд',
    'Urgent': 'Срочно'
  },
  ky: {
    'Home': 'Үй',
    'Solutions': 'Чечимдер',
    'Technology': 'Технология',
    'How It Works': 'Бул кантип иштейт',
    'Store': 'Дүкөн',
    'About': 'Жөнүндө',
    'Login': 'Кирүү',
    'Register': 'Каттоо',
    'Sign In': 'Кирүү',
    'Create Account': 'Эсеп түзүү',
    'Deploy Now': 'Азыр жайылтуу',
    'Explore Store': 'Дүкөндү изилдөө',
    'High-Performance': 'Жогорку өндүрүмдүүлүк',
    'Done': 'Бүттү',
    'Technical Support': 'Техникалык колдоо',
    'Submit Ticket': 'Билет тапшыруу',
    'Live Chat': 'Түз чат',
    'Track Ticket': 'Трек билет',
    'Country & Currency / Language': 'Өлкө & Валюта / Тил',
    'Select your country to update all prices & text': 'Бардык бааларды жана текстти жаңыртуу үчүн өлкөңүздү тандаңыз',
    'Currency & Country': 'Валюта жана өлкө',
    'Live forex rates synced automatically': 'Live Forex курстары автоматтык түрдө шайкештештирилет',
    'Connected to SoftCode Ops Desk': 'SoftCode Ops Desk менен туташты',
    'Normal': 'Кадимки',
    'High': 'Жогорку',
    'Urgent': 'Шашылыш'
  },
  tk: {
    'Home': 'Öý',
    'Solutions': 'Çözgütler',
    'Technology': 'Tehnologiýa',
    'How It Works': 'Bu nähili işleýär',
    'Store': 'Dükan',
    'About': 'Takmynan',
    'Login': 'Giriş',
    'Register': 'Hasaba al',
    'Sign In': 'Giriň',
    'Create Account': 'Hasap dörediň',
    'Deploy Now': 'Indi ýerleşdiriň',
    'Explore Store': 'Dükany öwreniň',
    'High-Performance': '-Okary öndürijilik',
    'Done': 'Boldy',
    'Technical Support': 'Tehniki goldaw',
    'Submit Ticket': 'Bilet iberiň',
    'Live Chat': 'Göni söhbetdeşlik',
    'Track Ticket': 'Bilet yzarla',
    'Country & Currency / Language': 'Ýurt we walýuta / Dil',
    'Select your country to update all prices & text': 'Priceshli bahalary we teksti täzelemek üçin ýurduňyzy saýlaň',
    'Currency & Country': 'Walýuta we ýurt',
    'Live forex rates synced automatically': 'Göni forex nyrhlary awtomatiki sinhronlanýar',
    'Connected to SoftCode Ops Desk': 'SoftCode Ops Stolyna birikdirildi',
    'Normal': 'Adaty',
    'High': 'Beýik',
    'Urgent': 'Gyssagly'
  },
  ka: {
    'Home': 'მთავარი',
    'Solutions': 'გადაწყვეტილებები',
    'Technology': 'ტექნიკა',
    'How It Works': 'როგორ მუშაობს',
    'Store': 'მაღაზია',
    'About': 'შესახებ',
    'Login': 'შესვლა',
    'Register': 'რეგისტრაცია',
    'Sign In': 'შესვლა',
    'Create Account': 'ანგარიშის შექმნა',
    'Deploy Now': 'განათავსეთ ახლავე',
    'Explore Store': 'შეისწავლეთ მაღაზია',
    'High-Performance': 'მაღალი წარმადობა',
    'Done': 'შესრულებულია',
    'Technical Support': 'ტექნიკური მხარდაჭერა',
    'Submit Ticket': 'ბილეთის გაგზავნა',
    'Live Chat': 'ცოცხალი ჩატი',
    'Track Ticket': 'სიმღერა ბილეთი',
    'Country & Currency / Language': 'ქვეყანა და ვალუტა / ენა',
    'Select your country to update all prices & text': 'აირჩიეთ თქვენი ქვეყანა ყველა ფასისა და ტექსტის გასაახლებლად',
    'Currency & Country': 'ვალუტა და ქვეყანა',
    'Live forex rates synced automatically': 'პირდაპირი ფორექსის ტარიფები სინქრონიზებულია ავტომატურად',
    'Connected to SoftCode Ops Desk': 'დაკავშირებულია SoftCode Ops Desk-თან',
    'Normal': 'ნორმალური',
    'High': 'მაღალი',
    'Urgent': 'სასწრაფო'
  },
  hy: {
    'Home': 'Տուն',
    'Solutions': 'Լուծումներ',
    'Technology': 'Տեխնոլոգիա',
    'How It Works': 'Ինչպես է այն աշխատում',
    'Store': 'Խանութ',
    'About': 'Մոտ',
    'Login': 'Մուտք գործել',
    'Register': 'Գրանցվել',
    'Sign In': 'Մուտք գործեք',
    'Create Account': 'Ստեղծել հաշիվ',
    'Deploy Now': 'Տեղադրեք հիմա',
    'Explore Store': 'Ուսումնասիրեք խանութը',
    'High-Performance': 'Բարձր կատարողականություն',
    'Done': 'Կատարված է',
    'Technical Support': 'Տեխնիկական աջակցություն',
    'Submit Ticket': 'Տոմս ներկայացնել',
    'Live Chat': 'Ուղիղ զրույց',
    'Track Ticket': 'Հետևել տոմս',
    'Country & Currency / Language': 'Երկիր և արժույթ / լեզու',
    'Select your country to update all prices & text': 'Ընտրեք ձեր երկիրը՝ բոլոր գները և տեքստը թարմացնելու համար',
    'Currency & Country': 'Արժույթ և երկիր',
    'Live forex rates synced automatically': 'Ուղիղ արտարժույթի փոխարժեքները համաժամացվում են ավտոմատ կերպով',
    'Connected to SoftCode Ops Desk': 'Միացված է SoftCode Ops Desk-ին',
    'Normal': 'Նորմալ',
    'High': 'Բարձր',
    'Urgent': 'Շտապ'
  },
  mn: {
    'Home': 'Гэр',
    'Solutions': 'Шийдэл',
    'Technology': 'Технологи',
    'How It Works': 'Энэ нь хэрхэн ажилладаг',
    'Store': 'Дэлгүүр',
    'About': 'тухай',
    'Login': 'Нэвтрэх',
    'Register': 'Бүртгүүлэх',
    'Sign In': 'Нэвтрэх',
    'Create Account': 'Бүртгэл үүсгэх',
    'Deploy Now': 'Одоо байрлуул',
    'Explore Store': 'Дэлгүүрийг судлах',
    'High-Performance': 'Өндөр гүйцэтгэлтэй',
    'Done': 'Дууслаа',
    'Technical Support': 'Техникийн дэмжлэг',
    'Submit Ticket': 'Тасалбар илгээх',
    'Live Chat': 'Шууд чат',
    'Track Ticket': 'Замын тасалбар',
    'Country & Currency / Language': 'Улс, валют / Хэл',
    'Select your country to update all prices & text': 'Бүх үнэ, текстийг шинэчлэхийн тулд улсаа сонго',
    'Currency & Country': 'Валют ба улс',
    'Live forex rates synced automatically': 'Амьд валютын ханшийг автоматаар синк хийнэ',
    'Connected to SoftCode Ops Desk': 'SoftCode Ops Desk-д холбогдсон',
    'Normal': 'Ердийн',
    'High': 'Өндөр',
    'Urgent': 'Яаралтай'
  },
  lo: {
    'Home': 'ບ້ານ',
    'Solutions': 'ວິທີແກ້ໄຂ',
    'Technology': 'ເຕັກໂນໂລຊີ',
    'How It Works': 'ມັນເຮັດວຽກແນວໃດ',
    'Store': 'ຮ້ານຄ້າ',
    'About': 'ກ່ຽວກັບ',
    'Login': 'ເຂົ້າສູ່ລະບົບ',
    'Register': 'ລົງທະບຽນ',
    'Sign In': 'ເຂົ້າສູ່ລະບົບ',
    'Create Account': 'ສ້າງບັນຊີ',
    'Deploy Now': 'ນຳໃຊ້ດຽວນີ້',
    'Explore Store': 'ສຳຫຼວດຮ້ານ',
    'High-Performance': 'ປະສິດທິພາບສູງ',
    'Done': 'ສຳເລັດແລ້ວ',
    'Technical Support': 'ສະຫນັບສະຫນູນດ້ານວິຊາການ',
    'Submit Ticket': 'ສົ່ງປີ້',
    'Live Chat': 'ສົນທະນາສົດ',
    'Track Ticket': 'ຕິດຕາມປີ້',
    'Country & Currency / Language': 'ປະເທດ & ສະກຸນເງິນ / ພາສາ',
    'Select your country to update all prices & text': 'ເລືອກປະເທດຂອງທ່ານເພື່ອອັບເດດລາຄາ ແລະຂໍ້ຄວາມທັງໝົດ',
    'Currency & Country': 'ສະກຸນເງິນ & ປະເທດ',
    'Live forex rates synced automatically': 'ອັດຕາ forex ສົດຖືກຊິ້ງໂດຍອັດຕະໂນມັດ',
    'Connected to SoftCode Ops Desk': 'ເຊື່ອມຕໍ່ກັບ SoftCode Ops Desk',
    'Normal': 'ປົກກະຕິ',
    'High': 'ສູງ',
    'Urgent': 'ດ່ວນ'
  },
  dv: {
    'Home': 'ގެ',
    'Solutions': 'ހައްލުތައް',
    'Technology': 'ޓެކްނޮލޮޖީ',
    'How It Works': 'އެކަން ކުރާ ގޮތް',
    'Store': 'ސްޓޯރ',
    'About': 'ގުޅިގެން',
    'Login': 'ލޮގިން ވެވޭނެއެވެ',
    'Register': 'ރަޖިސްޓްރީކުރުން',
    'Sign In': 'ސައިން އިން',
    'Create Account': 'އެކައުންޓް އުފެއްދުން',
    'Deploy Now': 'ޑިޕްލޮއި ނޯ',
    'Explore Store': 'އެކްސްޕްލޯރ ސްޓޯރ',
    'High-Performance': 'ހައި-ޕާފޯމަންސް',
    'Done': 'ނިމިއްޖު',
    'Technical Support': 'ޓެކްނިކަލް ސަޕޯޓް ދިނުން',
    'Submit Ticket': 'ޓިކެޓް ހުށަހެޅުން',
    'Live Chat': 'ލައިވް ޗެޓް',
    'Track Ticket': 'ޓްރެކް ޓިކެޓް',
    'Country & Currency / Language': 'ޤައުމު & ފައިސާ / ބަސް',
    'Select your country to update all prices & text': 'ހުރިހާ އަގުތަކެއް & ޓެކްސްޓް އަޕްޑޭޓް ކުރުމަށް ޤައުމު ހޮވާށެވެ',
    'Currency & Country': 'ފައިސާ & ޤައުމު',
    'Live forex rates synced automatically': 'ލައިވް ފޮރެކްސް ރޭޓްތައް އޮޓޮމެޓިކުން ސިންކް ކުރެވެއެވެ',
    'Connected to SoftCode Ops Desk': 'ގުޅިފައިވަނީ SoftCode އޮޕްސް ޑެސްކަށެވެ',
    'Normal': 'އާދައިގެ',
    'High': 'އުސް',
    'Urgent': 'ވަރަށް އަވަސް'
  },
  bg: {
    'Home': 'Начало',
    'Solutions': 'Решения',
    'Technology': 'технология',
    'How It Works': 'Как работи',
    'Store': 'Магазин',
    'About': 'За',
    'Login': 'Вход',
    'Register': 'Регистрирайте се',
    'Sign In': 'Вход',
    'Create Account': 'Създаване на акаунт',
    'Deploy Now': 'Разположете сега',
    'Explore Store': 'Разгледайте магазина',
    'High-Performance': 'Висока производителност',
    'Done': 'Готово',
    'Technical Support': 'Техническа поддръжка',
    'Submit Ticket': 'Изпратете билет',
    'Live Chat': 'Чат на живо',
    'Track Ticket': 'Билет за писта',
    'Country & Currency / Language': 'Държава и валута / език',
    'Select your country to update all prices & text': 'Изберете вашата държава, за да актуализирате всички цени и текст',
    'Currency & Country': 'Валута и държава',
    'Live forex rates synced automatically': 'Валутните курсове на живо се синхронизират автоматично',
    'Connected to SoftCode Ops Desk': 'Свързан с SoftCode Ops Desk',
    'Normal': 'нормално',
    'High': 'високо',
    'Urgent': 'Спешно'
  },
  sr: {
    'Home': 'Хоме',
    'Solutions': 'Решења',
    'Technology': 'Технологија',
    'How It Works': 'Како то ради',
    'Store': 'Продавница',
    'About': 'Абоут',
    'Login': 'Логин',
    'Register': 'Региструјте се',
    'Sign In': 'Пријавите се',
    'Create Account': 'Креирајте налог',
    'Deploy Now': 'Деплои Нов',
    'Explore Store': 'Истражите продавницу',
    'High-Performance': 'Високе перформансе',
    'Done': 'Готово',
    'Technical Support': 'Техничка подршка',
    'Submit Ticket': 'Пошаљи карту',
    'Live Chat': 'Ливе Цхат',
    'Track Ticket': 'Трацк Тицкет',
    'Country & Currency / Language': 'Земља и валута / Језик',
    'Select your country to update all prices & text': 'Изаберите своју земљу да бисте ажурирали све цене и текст',
    'Currency & Country': 'Валута и држава',
    'Live forex rates synced automatically': 'Ливе форек стопе се аутоматски синхронизују',
    'Connected to SoftCode Ops Desk': 'Повезано са SoftCode Опс Деск',
    'Normal': 'Нормално',
    'High': 'Високо',
    'Urgent': 'Хитно'
  },
  hr: {
    'Home': 'Dom',
    'Solutions': 'Rješenja',
    'Technology': 'Tehnologija',
    'How It Works': 'Kako to radi',
    'Store': 'Store',
    'About': 'Oko',
    'Login': 'Prijava',
    'Register': 'Registar',
    'Sign In': 'Prijavite se',
    'Create Account': 'Napravi račun',
    'Deploy Now': 'Postavite odmah',
    'Explore Store': 'Istražite trgovinu',
    'High-Performance': 'Visoke performanse',
    'Done': 'Gotovo',
    'Technical Support': 'Tehnička podrška',
    'Submit Ticket': 'Pošalji ulaznicu',
    'Live Chat': 'Razgovor uživo',
    'Track Ticket': 'Ulaznica za stazu',
    'Country & Currency / Language': 'Država i valuta / jezik',
    'Select your country to update all prices & text': 'Odaberite svoju zemlju za ažuriranje svih cijena i teksta',
    'Currency & Country': 'Valuta i država',
    'Live forex rates synced automatically': 'Forex tečajevi uživo sinkronizirani su automatski',
    'Connected to SoftCode Ops Desk': 'Povezan na SoftCode Ops Desk',
    'Normal': 'Normalan',
    'High': 'visoko',
    'Urgent': 'Hitno'
  },
  sk: {
    'Home': 'Domov',
    'Solutions': 'Riešenia',
    'Technology': 'Technológia',
    'How It Works': 'Ako to funguje',
    'Store': 'Obchod',
    'About': 'O',
    'Login': 'Prihláste sa',
    'Register': 'Zaregistrujte sa',
    'Sign In': 'Prihlásiť sa',
    'Create Account': 'Vytvoriť účet',
    'Deploy Now': 'Nasadiť teraz',
    'Explore Store': 'Preskúmať obchod',
    'High-Performance': 'Vysoký výkon',
    'Done': 'Hotovo',
    'Technical Support': 'Technická podpora',
    'Submit Ticket': 'Odoslať lístok',
    'Live Chat': 'Živý rozhovor',
    'Track Ticket': 'Traťový lístok',
    'Country & Currency / Language': 'Krajina a mena / jazyk',
    'Select your country to update all prices & text': 'Ak chcete aktualizovať všetky ceny a text, vyberte svoju krajinu',
    'Currency & Country': 'Mena a krajina',
    'Live forex rates synced automatically': 'Live forex kurzy synchronizované automaticky',
    'Connected to SoftCode Ops Desk': 'Pripojené k SoftCode Ops Desk',
    'Normal': 'Normálne',
    'High': 'Vysoká',
    'Urgent': 'Naliehavé'
  },
  sl: {
    'Home': 'domov',
    'Solutions': 'Rešitve',
    'Technology': 'tehnologija',
    'How It Works': 'Kako deluje',
    'Store': 'Trgovina',
    'About': 'O tem',
    'Login': 'Prijava',
    'Register': 'Registrirajte se',
    'Sign In': 'Prijavite se',
    'Create Account': 'Ustvari račun',
    'Deploy Now': 'Namestite zdaj',
    'Explore Store': 'Raziščite trgovino',
    'High-Performance': 'Visoka zmogljivost',
    'Done': 'Končano',
    'Technical Support': 'Tehnična podpora',
    'Submit Ticket': 'Oddaj vstopnico',
    'Live Chat': 'Klepet v živo',
    'Track Ticket': 'Izsledni vozovnica',
    'Country & Currency / Language': 'Država &#38; Valuta / Jezik',
    'Select your country to update all prices & text': 'Izberite državo, da posodobite vse cene in besedilo',
    'Currency & Country': 'Valuta in država',
    'Live forex rates synced automatically': 'Živim valutnim tečajem se avtomatsko sinhronizira',
    'Connected to SoftCode Ops Desk': 'Povezano z zastopnikom SoftCode',
    'Normal': 'normalno',
    'High': 'visoko',
    'Urgent': 'Nujno'
  },
  lt: {
    'Home': 'Pradžia',
    'Solutions': 'Sprendimai',
    'Technology': 'Technologijos',
    'How It Works': 'Kaip tai veikia',
    'Store': 'Parduotuvė',
    'About': 'Apie',
    'Login': 'Prisijungti',
    'Register': 'Registruotis',
    'Sign In': 'Prisijunkite',
    'Create Account': 'Sukurti paskyrą',
    'Deploy Now': 'Įdiegti dabar',
    'Explore Store': 'Naršyti parduotuvę',
    'High-Performance': 'Didelio našumo',
    'Done': 'Atlikta',
    'Technical Support': 'Techninė pagalba',
    'Submit Ticket': 'Pateikite bilietą',
    'Live Chat': 'Tiesioginis pokalbis',
    'Track Ticket': 'Trasos bilietas',
    'Country & Currency / Language': 'Šalis ir valiuta / kalba',
    'Select your country to update all prices & text': 'Pasirinkite šalį, kad atnaujintumėte visas kainas ir tekstą',
    'Currency & Country': 'Valiuta ir šalis',
    'Live forex rates synced automatically': 'Tiesioginiai Forex kursai sinchronizuojami automatiškai',
    'Connected to SoftCode Ops Desk': 'Prijungtas prie SoftCode Ops Desk',
    'Normal': 'Normalus',
    'High': 'Aukštas',
    'Urgent': 'Skubiai'
  },
  lv: {
    'Home': 'Sākums',
    'Solutions': 'Risinājumi',
    'Technology': 'Tehnoloģija',
    'How It Works': 'Kā tas darbojas',
    'Store': 'Veikals',
    'About': 'Par',
    'Login': 'Pieteikties',
    'Register': 'Reģistrēties',
    'Sign In': 'Pierakstīties',
    'Create Account': 'Izveidot kontu',
    'Deploy Now': 'Izvietot tūlīt',
    'Explore Store': 'Izpētiet veikalu',
    'High-Performance': 'Augstas veiktspējas',
    'Done': 'Gatavs',
    'Technical Support': 'Tehniskais atbalsts',
    'Submit Ticket': 'Iesniedziet biļeti',
    'Live Chat': 'Tiešraides tērzēšana',
    'Track Ticket': 'Trases biļete',
    'Country & Currency / Language': 'Valsts un valūta / valoda',
    'Select your country to update all prices & text': 'Atlasiet savu valsti, lai atjauninātu visas cenas un tekstu',
    'Currency & Country': 'Valūta un valsts',
    'Live forex rates synced automatically': 'Reāllaika forex kursi tiek sinhronizēti automātiski',
    'Connected to SoftCode Ops Desk': 'Savienots ar SoftCode Ops Desk',
    'Normal': 'Normāls',
    'High': 'Augsts',
    'Urgent': 'Steidzami'
  },
  et: {
    'Home': 'Kodu',
    'Solutions': 'Lahendused',
    'Technology': 'Tehnoloogia',
    'How It Works': 'Kuidas see töötab',
    'Store': 'Kauplus',
    'About': 'Umbes',
    'Login': 'Logi sisse',
    'Register': 'Registreeru',
    'Sign In': 'Logi sisse',
    'Create Account': 'Loo konto',
    'Deploy Now': 'Juuruta kohe',
    'Explore Store': 'Avastage pood',
    'High-Performance': 'Suure jõudlusega',
    'Done': 'Valmis',
    'Technical Support': 'Tehniline tugi',
    'Submit Ticket': 'Esitage pilet',
    'Live Chat': 'Reaalajas vestlus',
    'Track Ticket': 'Raja pilet',
    'Country & Currency / Language': 'Riik ja valuuta / keel',
    'Select your country to update all prices & text': 'Kõigi hindade ja teksti värskendamiseks valige riik',
    'Currency & Country': 'Valuuta ja riik',
    'Live forex rates synced automatically': 'Reaalajas valuutakursid sünkroonitakse automaatselt',
    'Connected to SoftCode Ops Desk': 'Ühendatud SoftCode Ops Deskiga',
    'Normal': 'Tavaline',
    'High': 'Kõrge',
    'Urgent': 'Kiireloomuline'
  },
  is: {
    'Home': 'Heim',
    'Solutions': 'Lausnir',
    'Technology': 'Tækni',
    'How It Works': 'Hvernig það virkar',
    'Store': 'Verslun',
    'About': 'Um',
    'Login': 'Innskráning',
    'Register': 'Skráðu þig',
    'Sign In': 'Skráðu þig inn',
    'Create Account': 'Búðu til reikning',
    'Deploy Now': 'Dreifa núna',
    'Explore Store': 'Skoða verslun',
    'High-Performance': 'Afkastamikil',
    'Done': 'Búið',
    'Technical Support': 'Tæknileg aðstoð',
    'Submit Ticket': 'Sendu miða',
    'Live Chat': 'Lifandi spjall',
    'Track Ticket': 'Track miða',
    'Country & Currency / Language': 'Land & Gjaldmiðill / Tungumál',
    'Select your country to update all prices & text': 'Veldu landið þitt til að uppfæra öll verð og texta',
    'Currency & Country': 'Gjaldmiðill og land',
    'Live forex rates synced automatically': 'Lifandi gjaldeyrisvextir samstilltir sjálfkrafa',
    'Connected to SoftCode Ops Desk': 'Tengdur SoftCode Ops Desk',
    'Normal': 'Eðlilegt',
    'High': 'Hátt',
    'Urgent': 'Brýnt'
  },
  sq: {
    'Home': 'Shtëpi',
    'Solutions': 'Zgjidhjet',
    'Technology': 'Teknologjia',
    'How It Works': 'Si funksionon',
    'Store': 'Dyqani',
    'About': 'Rreth',
    'Login': 'Identifikohu',
    'Register': 'Regjistrohu',
    'Sign In': 'Hyni',
    'Create Account': 'Krijo llogari',
    'Deploy Now': 'Vendoseni Tani',
    'Explore Store': 'Eksploroni Dyqanin',
    'High-Performance': 'Performancë të lartë',
    'Done': 'U krye',
    'Technical Support': 'Mbështetje Teknike',
    'Submit Ticket': 'Paraqisni Biletën',
    'Live Chat': 'Bisedë e drejtpërdrejtë',
    'Track Ticket': 'Bileta e gjurmës',
    'Country & Currency / Language': 'Shteti & Monedha / Gjuha',
    'Select your country to update all prices & text': 'Zgjidhni vendin tuaj për të përditësuar të gjitha çmimet dhe tekstin',
    'Currency & Country': 'Monedha dhe shteti',
    'Live forex rates synced automatically': 'Normat e drejtpërdrejta të Forex sinkronizohen automatikisht',
    'Connected to SoftCode Ops Desk': 'Lidhur me SoftCode Ops Desk',
    'Normal': 'Normale',
    'High': 'Lartë',
    'Urgent': 'Urgjente'
  },
  bs: {
    'Home': 'Dom',
    'Solutions': 'Rješenja',
    'Technology': 'Tehnologija',
    'How It Works': 'Kako radi',
    'Store': 'Store',
    'About': 'O',
    'Login': 'Prijava',
    'Register': 'Registrirajte se',
    'Sign In': 'Prijavite se',
    'Create Account': 'Kreirajte nalog',
    'Deploy Now': 'Ugrađivanje sada',
    'Explore Store': 'Istražite prodavnicu',
    'High-Performance': 'Visoke performanse',
    'Done': 'Gotovo',
    'Technical Support': 'Tehnička podrška',
    'Submit Ticket': 'Podnijeti karticu',
    'Live Chat': 'Živ Čat',
    'Track Ticket': 'Karta za stazu',
    'Country & Currency / Language': 'Država i valuta / jezik',
    'Select your country to update all prices & text': 'Odaberite svoju zemlju da ažurirate sve cijene i tekst',
    'Currency & Country': 'Valuta & Država',
    'Live forex rates synced automatically': 'Live forex stope se automatski sinhronizuju',
    'Connected to SoftCode Ops Desk': 'Povezano na SoftCode Ops Desk',
    'Normal': 'Normalno',
    'High': 'Visoko',
    'Urgent': 'Hitno'
  },
  be: {
    'Home': 'дадому',
    'Solutions': 'Рашэнні',
    'Technology': 'Тэхналогія',
    'How It Works': 'Як гэта працуе',
    'Store': 'Крама',
    'About': 'Аб',
    'Login': 'Увайсці',
    'Register': 'Зарэгіструйцеся',
    'Sign In': 'Увайдзіце',
    'Create Account': 'Стварыць уліковы запіс',
    'Deploy Now': 'Разгарнуць зараз',
    'Explore Store': 'Азнаёмцеся з крамай',
    'High-Performance': 'Высокая прадукцыйнасць',
    'Done': 'Гатова',
    'Technical Support': 'Тэхнічная падтрымка',
    'Submit Ticket': 'Адправіць білет',
    'Live Chat': 'Жывы чат',
    'Track Ticket': 'Трэк-білет',
    'Country & Currency / Language': 'Краіна і валюта / мова',
    'Select your country to update all prices & text': 'Выберыце сваю краіну, каб абнавіць усе цэны і тэкст',
    'Currency & Country': 'Валюта і краіна',
    'Live forex rates synced automatically': 'Актуальныя курсы валют сінхранізуюцца аўтаматычна',
    'Connected to SoftCode Ops Desk': 'Падключаны да SoftCode Ops Desk',
    'Normal': 'Нармальны',
    'High': 'Высокі',
    'Urgent': 'Тэрмінова'
  },
  mk: {
    'Home': 'Дома',
    'Solutions': 'Решенија',
    'Technology': 'Технологија',
    'How It Works': 'Како функционира',
    'Store': 'Продавница',
    'About': 'За',
    'Login': 'Најавете се',
    'Register': 'Регистрирајте се',
    'Sign In': 'Пријавете се',
    'Create Account': 'Креирај сметка',
    'Deploy Now': 'Распоредете сега',
    'Explore Store': 'Истражете ја продавницата',
    'High-Performance': 'Високи перформанси',
    'Done': 'Готово',
    'Technical Support': 'Техничка поддршка',
    'Submit Ticket': 'Поднесете билет',
    'Live Chat': 'Разговор во живо',
    'Track Ticket': 'Билет за песна',
    'Country & Currency / Language': 'Земја и валута / Јазик',
    'Select your country to update all prices & text': 'Изберете ја вашата земја за да ги ажурирате сите цени и текст',
    'Currency & Country': 'Валута и земја',
    'Live forex rates synced automatically': 'Стапките на девизен курс во живо се синхронизираат автоматски',
    'Connected to SoftCode Ops Desk': 'Поврзан со SoftCode Ops Desk',
    'Normal': 'Нормално',
    'High': 'Високо',
    'Urgent': 'Итно'
  },
  mt: {
    'Home': 'Dar',
    'Solutions': 'Soluzzjonijiet',
    'Technology': 'Teknoloġija',
    'How It Works': 'Kif Taħdem',
    'Store': 'Aħżen',
    'About': 'Dwar',
    'Login': 'Idħol',
    'Register': 'Irreġistra',
    'Sign In': 'Idħol',
    'Create Account': 'Oħloq Kont',
    'Deploy Now': 'Skjerament Issa',
    'Explore Store': 'Esplora Aħżen',
    'High-Performance': 'Prestazzjoni Għolja',
    'Done': 'Magħmul',
    'Technical Support': 'Appoġġ Tekniku',
    'Submit Ticket': 'Ibgħat Biljett',
    'Live Chat': 'Chat Live',
    'Track Ticket': 'Biljett tal-Track',
    'Country & Currency / Language': 'Pajjiż u Munita / Lingwa',
    'Select your country to update all prices & text': 'Agħżel pajjiżek biex taġġorna l-prezzijiet u t-test kollha',
    'Currency & Country': 'Munita u Pajjiż',
    'Live forex rates synced automatically': 'Rati forex ħajjin issinkronizzati awtomatikament',
    'Connected to SoftCode Ops Desk': 'Konness ma\' SoftCode Ops Desk',
    'Normal': 'Normali',
    'High': 'Għoli',
    'Urgent': 'Urġenti'
  },
  ga: {
    'Home': 'Baile',
    'Solutions': 'Réitigh',
    'Technology': 'Teicneolaíocht',
    'How It Works': 'Conas a Oibríonn sé',
    'Store': 'Stóráil',
    'About': 'Maidir',
    'Login': 'Logáil isteach',
    'Register': 'Clár',
    'Sign In': 'Sínigh Isteach',
    'Create Account': 'Cruthaigh Cuntas',
    'Deploy Now': 'Imscaradh Anois',
    'Explore Store': 'Déan iniúchadh ar an Store',
    'High-Performance': 'Ardfheidhmíocht',
    'Done': 'Déanta',
    'Technical Support': 'Tacaíocht Theicniúil',
    'Submit Ticket': 'Cuir Ticéad isteach',
    'Live Chat': 'Comhrá Beo',
    'Track Ticket': 'Ticéad Rian',
    'Country & Currency / Language': 'Tír & Airgeadra / Language',
    'Select your country to update all prices & text': 'Roghnaigh do thír chun gach praghas & téacs a nuashonrú',
    'Currency & Country': 'Airgeadra & Tír',
    'Live forex rates synced automatically': 'Déantar rátaí forex beo a shioncronú go huathoibríoch',
    'Connected to SoftCode Ops Desk': 'Ceangailte le Deasc OP SoftCode',
    'Normal': 'Gnáth',
    'High': 'Ard',
    'Urgent': 'Práinneach'
  },
  so: {
    'Home': 'Guriga',
    'Solutions': 'Xalka',
    'Technology': 'Farsamada',
    'How It Works': 'Sida ay u shaqeyso',
    'Store': 'Bakhaar',
    'About': 'Ku saabsan',
    'Login': 'Soo gal',
    'Register': 'Is diwaangeli',
    'Sign In': 'Soo gal',
    'Create Account': 'Abuur Account',
    'Deploy Now': 'Hadda geyso',
    'Explore Store': 'Baadh Bakhaarka',
    'High-Performance': 'Waxqabad sare',
    'Done': 'La sameeyay',
    'Technical Support': 'Taageerada Farsamada',
    'Submit Ticket': 'Soo gudbi tigidh',
    'Live Chat': 'Sheeko toos ah',
    'Track Ticket': 'Raad raac Tigidh',
    'Country & Currency / Language': 'Dalka & Lacagta / Luuqadda',
    'Select your country to update all prices & text': 'Dooro dalkaaga si aad u cusboonaysiiso dhammaan qiimayaasha & qoraalka',
    'Currency & Country': 'Lacagta & Dalka',
    'Live forex rates synced automatically': 'Sicirrada forex-ka tooska ah si toos ah ayaa loo habeeyey',
    'Connected to SoftCode Ops Desk': 'Ku xidhan SoftCode Ops Desk',
    'Normal': 'Caadi ah',
    'High': 'Sare',
    'Urgent': 'Degdeg'
  },
  mg: {
    'Home': 'an-trano',
    'Solutions': 'vahaolana',
    'Technology': 'TECHNOLOGY',
    'How It Works': 'Ahoana ny fiasan\'izany',
    'Store': 'Store',
    'About': 'About',
    'Login': 'Hiditra',
    'Register': 'hisoratra anarana',
    'Sign In': 'Hiditra',
    'Create Account': 'Hamorona kaonty',
    'Deploy Now': 'Alefaso izao',
    'Explore Store': 'Fikarohana fivarotana',
    'High-Performance': 'High-fampisehoana',
    'Done': 'hatao',
    'Technical Support': 'Tohana ara-teknika',
    'Submit Ticket': 'Alefaso tapakila',
    'Live Chat': 'Firesahana mivantana',
    'Track Ticket': 'Tapakila fanaraha-maso',
    'Country & Currency / Language': 'Firenena & Vola / Fiteny',
    'Select your country to update all prices & text': 'Fidio ny firenenao hanavaozana ny vidiny sy lahatsoratra rehetra',
    'Currency & Country': 'Vola & Firenena',
    'Live forex rates synced automatically': 'Ny tahan\'ny forex mivantana dia synced ho azy',
    'Connected to SoftCode Ops Desk': 'Ireo singa mifandraika amin\'ny SoftCode',
    'Normal': 'ara-dalàna',
    'High': 'Avo',
    'Urgent': 'MAIKA'
  },
  rw: {
    'Home': 'Murugo',
    'Solutions': 'Ibisubizo',
    'Technology': 'Ikoranabuhanga',
    'How It Works': 'Uburyo Bikora',
    'Store': 'Ububiko',
    'About': 'Ibyerekeye',
    'Login': 'Injira',
    'Register': 'Iyandikishe',
    'Sign In': 'Injira',
    'Create Account': 'Kora Konti',
    'Deploy Now': 'Kohereza Noneho',
    'Explore Store': 'Shakisha Ububiko',
    'High-Performance': 'Imikorere-yo hejuru',
    'Done': 'Byakozwe',
    'Technical Support': 'Inkunga ya tekiniki',
    'Submit Ticket': 'Tanga Tike',
    'Live Chat': 'Ikiganiro kizima',
    'Track Ticket': 'Kurikirana Amatike',
    'Country & Currency / Language': 'Igihugu & Ifaranga / Ururimi',
    'Select your country to update all prices & text': 'Hitamo igihugu cyawe kugirango uvugurure ibiciro byose & inyandiko',
    'Currency & Country': 'Ifaranga & Igihugu',
    'Live forex rates synced automatically': 'Igipimo cya Forex kizima cyahujwe mu buryo bwikora',
    'Connected to SoftCode Ops Desk': 'Uhujwe na SoftCode Ops Ibiro',
    'Normal': 'Bisanzwe',
    'High': 'Hejuru',
    'Urgent': 'Byihutirwa'
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
  private isScanning = false;
  private rescanNeeded = false;

  private textState = new WeakMap<Text, TrackedTextState>();
  private trackedTextNodes = new Set<Text>();
  private attrState = new WeakMap<Element, Map<string, TrackedTextState>>();
  private trackedElements = new Set<Element>();

  private langCache = new Map<string, Map<string, string>>();
  private hydratedIdbLangs = new Set<string>();
  private syncedServerLangs = new Set<string>();
  private coreBundlePromise: Promise<Record<string, Record<string, string>> | null> | null = null;
  private idbPromise: Promise<IDBDatabase | null> | null = null;
  private inflightKeys = new Set<string>();
  private retryCounts = new Map<string, number>();

  init(): void {
    if (this.initialized || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.initialized = true;
    this.cleanupLegacyCache();

    window.addEventListener('online', () => {
      const langCode = this.loc.currentLangCode();
      if (langCode !== 'en') {
        this.retryCounts.clear();
        void this.hydrateLanguageFromOfflineAndServer(langCode);
        this.scheduleScan(120);
      }
      void this.syncAllDownloadedPacksFromServer();
    });

    void this.loadCoreOfflineBundle().then(() => {
      const active = this.loc.currentLangCode();
      if (active !== 'en') {
        this.applyDictionaryNow(active);
      }
    });

    setTimeout(() => {
      void this.syncAllDownloadedPacksFromServer();
    }, 1500);

    effect(() => {
      const langCode = this.loc.currentLangCode();
      this.ensureDirectionStaysLtr(langCode);
      if (langCode === 'en') {
        this.restoreAllToEnglish();
      } else {
        this.retryCounts.clear();
        void this.hydrateLanguageFromOfflineAndServer(langCode);
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
      void this.hydrateLanguageFromOfflineAndServer(this.loc.currentLangCode());
      this.scheduleScan(30);
    }
  }

  private cleanupLegacyCache(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LEGACY_CACHE_PREFIX)) {
          toRemove.push(k);
        }
      }
      for (const k of toRemove) {
        localStorage.removeItem(k);
      }
    } catch {}
  }

  private openOfflineDb(): Promise<IDBDatabase | null> {
    if (this.idbPromise) return this.idbPromise;
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      this.idbPromise = Promise.resolve(null);
      return this.idbPromise;
    }
    this.idbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'lang' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return this.idbPromise;
  }

  private async readPackFromIdb(lang: string): Promise<Record<string, string> | null> {
    const db = await this.openOfflineDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(lang);
        req.onsuccess = () => {
          const val = req.result;
          resolve(val && typeof val.translations === 'object' ? val.translations : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async writePackToIdb(lang: string, map: Map<string, string>): Promise<void> {
    const db = await this.openOfflineDb();
    if (!db || map.size === 0) return;
    const translations: Record<string, string> = {};
    for (const [k, v] of map.entries()) {
      if (this.isAcceptableCacheEntry(lang, k, v)) {
        translations[k] = v;
      }
    }
    const count = Object.keys(translations).length;
    if (count === 0) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({
          lang,
          count,
          updatedAt: Date.now(),
          translations
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private async getAllIdbCounts(): Promise<Record<string, number>> {
    const db = await this.openOfflineDb();
    if (!db) return {};
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).getAll();
        req.onsuccess = () => {
          const counts: Record<string, number> = {};
          const rows = Array.isArray(req.result) ? req.result : [];
          for (const row of rows) {
            if (row?.lang) {
              counts[row.lang] = Number(row.count || Object.keys(row.translations || {}).length || 0);
            }
          }
          resolve(counts);
        };
        req.onerror = () => resolve({});
      } catch {
        resolve({});
      }
    });
  }

  private loadCoreOfflineBundle(): Promise<Record<string, Record<string, string>> | null> {
    if (this.coreBundlePromise) return this.coreBundlePromise;
    if (typeof fetch === 'undefined') {
      this.coreBundlePromise = Promise.resolve(null);
      return this.coreBundlePromise;
    }
    this.coreBundlePromise = fetch('/i18n-core-packs.json')
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json();
        const packs = json?.packs && typeof json.packs === 'object' ? json.packs : json;
        if (!packs || typeof packs !== 'object') return null;
        for (const [lang, entries] of Object.entries(packs)) {
          if (!entries || typeof entries !== 'object' || lang === 'en') continue;
          const dict = this.getLangMap(lang);
          let added = 0;
          for (const [k, v] of Object.entries(entries as Record<string, unknown>)) {
            if (typeof v === 'string' && this.isAcceptableCacheEntry(lang, k, v) && !dict.has(k)) {
              dict.set(k, v.trim());
              added++;
            }
          }
          if (added > 0) {
            void this.writePackToIdb(lang, dict);
          }
        }
        return packs as Record<string, Record<string, string>>;
      })
      .catch(() => null);
    return this.coreBundlePromise;
  }

  private async hydrateLanguageFromOfflineAndServer(lang: string): Promise<void> {
    if (!lang || lang === 'en') return;

    // Wait briefly if static offline core bundle is loading
    await this.loadCoreOfflineBundle();

    const dict = this.getLangMap(lang);
    let updated = false;

    if (!this.hydratedIdbLangs.has(lang)) {
      this.hydratedIdbLangs.add(lang);
      const idbPack = await this.readPackFromIdb(lang);
      if (idbPack) {
        for (const [k, v] of Object.entries(idbPack)) {
          if (typeof v === 'string' && this.isAcceptableCacheEntry(lang, k, v) && !dict.has(k)) {
            dict.set(k, v.trim());
            updated = true;
          }
        }
      }
    }

    if (updated && this.loc.currentLangCode() === lang) {
      this.applyDictionaryNow(lang);
    }

    // Sync full downloaded SQLite pack from backend (works both online & local offline server)
    if (!this.syncedServerLangs.has(lang)) {
      this.syncedServerLangs.add(lang);
      try {
        const resp = await fetch(`/api/i18n/pack/${encodeURIComponent(lang)}`);
        if (resp.ok) {
          const data = await resp.json();
          const entries = data?.translations;
          if (data?.ok && entries && typeof entries === 'object') {
            let serverAdded = 0;
            for (const [k, v] of Object.entries(entries as Record<string, unknown>)) {
              if (typeof v === 'string' && this.isAcceptableCacheEntry(lang, k, v) && !dict.has(k)) {
                dict.set(k, v.trim());
                serverAdded++;
              }
            }
            if (serverAdded > 0) {
              this.persistLangMap(lang, dict);
              if (this.loc.currentLangCode() === lang) {
                this.applyDictionaryNow(lang);
              }
            }
          }
        }
      } catch {}
    }
  }

  private async syncAllDownloadedPacksFromServer(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      const summaryRes = await fetch('/api/i18n/packs/summary');
      if (!summaryRes.ok) return;
      const summaryJson = await summaryRes.json();
      const serverPacks = summaryJson?.packs;
      if (!summaryJson?.ok || !serverPacks || typeof serverPacks !== 'object') return;

      const localCounts = await this.getAllIdbCounts();
      const langsToSync = Object.entries(serverPacks)
        .filter(([lang, meta]: [string, any]) => {
          const srvCount = Number(meta?.count || 0);
          return lang !== 'en' && srvCount > 0 && srvCount > (localCounts[lang] || 0);
        })
        .map(([lang]) => lang);

      for (const lang of langsToSync) {
        try {
          const res = await fetch(`/api/i18n/pack/${encodeURIComponent(lang)}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.ok && data.translations && typeof data.translations === 'object') {
            const dict = this.getLangMap(lang);
            let added = 0;
            for (const [k, v] of Object.entries(data.translations as Record<string, unknown>)) {
              if (typeof v === 'string' && this.isAcceptableCacheEntry(lang, k, v) && !dict.has(k)) {
                dict.set(k, v.trim());
                added++;
              }
            }
            if (added > 0) {
              void this.writePackToIdb(lang, dict);
              if (this.loc.currentLangCode() === lang) {
                this.applyDictionaryNow(lang);
              }
            }
            this.syncedServerLangs.add(lang);
          }
        } catch {}
      }
    } catch {}
  }

  private isAcceptableCacheEntry(lang: string, orig: string, translated: string): boolean {
    const tr = translated.trim();
    if (!tr) return false;
    if (NON_LATIN_SCRIPTS.has(lang) && tr === orig.trim()) {
      return !/[a-z]{3,}\s+[a-z]{3,}/i.test(orig);
    }
    return true;
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
              if (typeof v === 'string' && this.isAcceptableCacheEntry(lang, k, v)) {
                map.set(k, v.trim());
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
    // Always store complete unlimited dictionary in IndexedDB for all 73 non-English languages offline
    void this.writePackToIdb(lang, map);

    // Mirror active language to fast synchronous L1 localStorage (auto-pruning inactive keys if 5MB quota hits)
    try {
      const obj: Record<string, string> = {};
      let count = 0;
      for (const [k, v] of map.entries()) {
        if (!this.isAcceptableCacheEntry(lang, k, v)) continue;
        obj[k] = v;
        count++;
        if (count >= 2500) break;
      }
      const serialized = JSON.stringify(obj);
      try {
        localStorage.setItem(`${CACHE_PREFIX}${lang}`, serialized);
      } catch {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}${lang}`) {
            localStorage.removeItem(key);
          }
        }
        try {
          localStorage.setItem(`${CACHE_PREFIX}${lang}`, serialized);
        } catch {}
      }
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
    if (/^(PKR|USD|EUR|GBP|SAR|AED|INR|CAD|AUD|QAR|KWD|BHD|OMR|TRY|CNY|JPY|SGD|MYR|BRL|EGP|ZAR|NGN|BDT|IDR|PHP|KRW|CHF|NZD|MXN|SEK|NOK|DKK|PLN|THB|VND|IRR|NPR|LKR|AZN|UZS|KZT|MMK|KHR|RUB|UAH|ILS|CZK|RON|HUF|KES|ETB|AFN|TJS|KGS|TMT|GEL|AMD|MNT|LAK|MVR|BGN|RSD|ISK|ALL|BAM|BYN|MKD|SOS|MGA|RWF|IQD|JOD|LBP|MAD|DZD|TND|LYD|YER|SDG|SYP|ARS|COP|CLP|PEN|VES|UYU|CRC|PAB|DOP|TWD|HKD|BND|TZS|UGX|GHS|MDL|XOF|XAF|AOA|MZN|ISO|API|SLA|PWA|USB|POS|ERP|CRM|SMS|SMTP|PDF|JSON|SQL|WAL|RTL|LTR|HTTPS|TLS|AES|RBAC|VISA|AMEX|MM\/YY)$/i.test(t)) {
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

    if (this.isScanning) {
      this.rescanNeeded = true;
      return;
    }
    this.isScanning = true;
    this.rescanNeeded = false;

    try {
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
      const isBrowserOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

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
                    if (this.isAcceptableCacheEntry(targetLang, orig, cleanTr)) {
                      dict.set(orig, cleanTr);
                      continue;
                    }
                  }
                  if (!isBrowserOffline()) {
                    this.retryCounts.set(flightKey, (this.retryCounts.get(flightKey) || 0) + 1);
                    hadMissedItems = true;
                  }
                }
              } else if (!isBrowserOffline()) {
                hadMissedItems = true;
              }
            } else if (!isBrowserOffline()) {
              hadMissedItems = true;
            }
          } catch {
            if (!isBrowserOffline()) {
              hadMissedItems = true;
              for (const orig of batch) {
                const flightKey = `${targetLang}::${orig}`;
                this.retryCounts.set(flightKey, (this.retryCounts.get(flightKey) || 0) + 1);
              }
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

      // If any items failed transiently while online, schedule one automatic retry pass after short backoff
      if (hadMissedItems && !isBrowserOffline() && this.loc.currentLangCode() === targetLang) {
        this.scheduleScan(450);
      }
    } finally {
      this.isScanning = false;
      if (this.rescanNeeded && this.loc.currentLangCode() !== 'en') {
        this.rescanNeeded = false;
        this.scheduleScan(60);
      }
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
