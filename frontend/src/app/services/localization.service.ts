import { Injectable, signal, computed } from '@angular/core';

export interface CountryInfo {
  code: string;           // ISO 2-letter, e.g. 'PK', 'US', 'SA'
  name: string;           // e.g. 'Pakistan', 'United States'
  nativeName: string;     // e.g. 'پاکستان', 'United States'
  flag: string;           // Emoji flag sticker, e.g. '🇵🇰', '🇺🇸'
  currencyCode: string;   // e.g. 'PKR', 'USD'
  currencySymbol: string; // e.g. '₨', '$'
  currencyName: string;   // e.g. 'Pakistani Rupee', 'US Dollar'
  rateToUSD: number;      // 1 USD = rateToUSD in this currency
  defaultLang: string;    // 'ur', 'en', 'ar', etc.
}

export interface LanguageInfo {
  code: string;           // e.g. 'en', 'ur', 'ar', 'hi', 'tr'
  name: string;           // 'English', 'Urdu', 'Arabic'
  nativeName: string;     // 'English', 'اردو', 'العربية'
  flag: string;           // '🇬🇧', '🇵🇰', '🇸🇦'
  dir: 'ltr' | 'rtl';
}

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  // All 35+ countries with flag stickers, official currencies and exchange rates (base USD)
  readonly countries: CountryInfo[] = [
    {
      code: 'PK',
      name: 'Pakistan',
      nativeName: 'پاکستان',
      flag: '🇵🇰',
      currencyCode: 'PKR',
      currencySymbol: 'Rs.',
      currencyName: 'Pakistani Rupee',
      rateToUSD: 278.50,
      defaultLang: 'ur'
    },
    {
      code: 'US',
      name: 'United States',
      nativeName: 'United States',
      flag: '🇺🇸',
      currencyCode: 'USD',
      currencySymbol: '$',
      currencyName: 'US Dollar',
      rateToUSD: 1.00,
      defaultLang: 'en'
    },
    {
      code: 'SA',
      name: 'Saudi Arabia',
      nativeName: 'المملكة العربية السعودية',
      flag: '🇸🇦',
      currencyCode: 'SAR',
      currencySymbol: 'ر.س',
      currencyName: 'Saudi Riyal',
      rateToUSD: 3.75,
      defaultLang: 'ar'
    },
    {
      code: 'AE',
      name: 'United Arab Emirates',
      nativeName: 'الإمارات العربية المتحدة',
      flag: '🇦🇪',
      currencyCode: 'AED',
      currencySymbol: 'د.إ',
      currencyName: 'UAE Dirham',
      rateToUSD: 3.67,
      defaultLang: 'ar'
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      nativeName: 'United Kingdom',
      flag: '🇬🇧',
      currencyCode: 'GBP',
      currencySymbol: '£',
      currencyName: 'British Pound',
      rateToUSD: 0.79,
      defaultLang: 'en'
    },
    {
      code: 'EU',
      name: 'European Union',
      nativeName: 'Europe',
      flag: '🇪🇺',
      currencyCode: 'EUR',
      currencySymbol: '€',
      currencyName: 'Euro',
      rateToUSD: 0.92,
      defaultLang: 'en'
    },
    {
      code: 'IN',
      name: 'India',
      nativeName: 'भारत',
      flag: '🇮🇳',
      currencyCode: 'INR',
      currencySymbol: '₹',
      currencyName: 'Indian Rupee',
      rateToUSD: 83.50,
      defaultLang: 'hi'
    },
    {
      code: 'CA',
      name: 'Canada',
      nativeName: 'Canada',
      flag: '🇨🇦',
      currencyCode: 'CAD',
      currencySymbol: 'CA$',
      currencyName: 'Canadian Dollar',
      rateToUSD: 1.36,
      defaultLang: 'en'
    },
    {
      code: 'AU',
      name: 'Australia',
      nativeName: 'Australia',
      flag: '🇦🇺',
      currencyCode: 'AUD',
      currencySymbol: 'A$',
      currencyName: 'Australian Dollar',
      rateToUSD: 1.52,
      defaultLang: 'en'
    },
    {
      code: 'QA',
      name: 'Qatar',
      nativeName: 'قطر',
      flag: '🇶🇦',
      currencyCode: 'QAR',
      currencySymbol: '﷼',
      currencyName: 'Qatari Riyal',
      rateToUSD: 3.64,
      defaultLang: 'ar'
    },
    {
      code: 'KW',
      name: 'Kuwait',
      nativeName: 'الكويت',
      flag: '🇰🇼',
      currencyCode: 'KWD',
      currencySymbol: 'د.ك',
      currencyName: 'Kuwaiti Dinar',
      rateToUSD: 0.31,
      defaultLang: 'ar'
    },
    {
      code: 'BH',
      name: 'Bahrain',
      nativeName: 'البحرين',
      flag: '🇧🇭',
      currencyCode: 'BHD',
      currencySymbol: '.د.ب',
      currencyName: 'Bahraini Dinar',
      rateToUSD: 0.38,
      defaultLang: 'ar'
    },
    {
      code: 'OM',
      name: 'Oman',
      nativeName: 'عُمان',
      flag: '🇴🇲',
      currencyCode: 'OMR',
      currencySymbol: '﷼',
      currencyName: 'Omani Rial',
      rateToUSD: 0.38,
      defaultLang: 'ar'
    },
    {
      code: 'TR',
      name: 'Turkey',
      nativeName: 'Türkiye',
      flag: '🇹🇷',
      currencyCode: 'TRY',
      currencySymbol: '₺',
      currencyName: 'Turkish Lira',
      rateToUSD: 32.50,
      defaultLang: 'tr'
    },
    {
      code: 'CN',
      name: 'China',
      nativeName: '中国',
      flag: '🇨🇳',
      currencyCode: 'CNY',
      currencySymbol: '¥',
      currencyName: 'Chinese Yuan',
      rateToUSD: 7.24,
      defaultLang: 'zh'
    },
    {
      code: 'JP',
      name: 'Japan',
      nativeName: '日本',
      flag: '🇯🇵',
      currencyCode: 'JPY',
      currencySymbol: '¥',
      currencyName: 'Japanese Yen',
      rateToUSD: 155.00,
      defaultLang: 'ja'
    },
    {
      code: 'SG',
      name: 'Singapore',
      nativeName: 'Singapore',
      flag: '🇸🇬',
      currencyCode: 'SGD',
      currencySymbol: 'S$',
      currencyName: 'Singapore Dollar',
      rateToUSD: 1.35,
      defaultLang: 'en'
    },
    {
      code: 'MY',
      name: 'Malaysia',
      nativeName: 'Malaysia',
      flag: '🇲🇾',
      currencyCode: 'MYR',
      currencySymbol: 'RM',
      currencyName: 'Malaysian Ringgit',
      rateToUSD: 4.72,
      defaultLang: 'en'
    },
    {
      code: 'DE',
      name: 'Germany',
      nativeName: 'Deutschland',
      flag: '🇩🇪',
      currencyCode: 'EUR',
      currencySymbol: '€',
      currencyName: 'Euro',
      rateToUSD: 0.92,
      defaultLang: 'de'
    },
    {
      code: 'FR',
      name: 'France',
      nativeName: 'France',
      flag: '🇫🇷',
      currencyCode: 'EUR',
      currencySymbol: '€',
      currencyName: 'Euro',
      rateToUSD: 0.92,
      defaultLang: 'fr'
    },
    {
      code: 'ES',
      name: 'Spain',
      nativeName: 'España',
      flag: '🇪🇸',
      currencyCode: 'EUR',
      currencySymbol: '€',
      currencyName: 'Euro',
      rateToUSD: 0.92,
      defaultLang: 'es'
    },
    {
      code: 'IT',
      name: 'Italy',
      nativeName: 'Italia',
      flag: '🇮🇹',
      currencyCode: 'EUR',
      currencySymbol: '€',
      currencyName: 'Euro',
      rateToUSD: 0.92,
      defaultLang: 'it'
    },
    {
      code: 'BR',
      name: 'Brazil',
      nativeName: 'Brasil',
      flag: '🇧🇷',
      currencyCode: 'BRL',
      currencySymbol: 'R$',
      currencyName: 'Brazilian Real',
      rateToUSD: 5.15,
      defaultLang: 'pt'
    },
    {
      code: 'EG',
      name: 'Egypt',
      nativeName: 'مصر',
      flag: '🇪🇬',
      currencyCode: 'EGP',
      currencySymbol: 'E£',
      currencyName: 'Egyptian Pound',
      rateToUSD: 47.50,
      defaultLang: 'ar'
    },
    {
      code: 'ZA',
      name: 'South Africa',
      nativeName: 'South Africa',
      flag: '🇿🇦',
      currencyCode: 'ZAR',
      currencySymbol: 'R',
      currencyName: 'South African Rand',
      rateToUSD: 18.30,
      defaultLang: 'en'
    },
    {
      code: 'NG',
      name: 'Nigeria',
      nativeName: 'Nigeria',
      flag: '🇳🇬',
      currencyCode: 'NGN',
      currencySymbol: '₦',
      currencyName: 'Nigerian Naira',
      rateToUSD: 1450.00,
      defaultLang: 'en'
    },
    {
      code: 'BD',
      name: 'Bangladesh',
      nativeName: 'বাংলাদেশ',
      flag: '🇧🇩',
      currencyCode: 'BDT',
      currencySymbol: '৳',
      currencyName: 'Bangladeshi Taka',
      rateToUSD: 117.00,
      defaultLang: 'en'
    },
    {
      code: 'ID',
      name: 'Indonesia',
      nativeName: 'Indonesia',
      flag: '🇮🇩',
      currencyCode: 'IDR',
      currencySymbol: 'Rp',
      currencyName: 'Indonesian Rupiah',
      rateToUSD: 16100.00,
      defaultLang: 'id'
    },
    {
      code: 'PH',
      name: 'Philippines',
      nativeName: 'Pilipinas',
      flag: '🇵🇭',
      currencyCode: 'PHP',
      currencySymbol: '₱',
      currencyName: 'Philippine Peso',
      rateToUSD: 58.20,
      defaultLang: 'en'
    },
    {
      code: 'KR',
      name: 'South Korea',
      nativeName: '대한민국',
      flag: '🇰🇷',
      currencyCode: 'KRW',
      currencySymbol: '₩',
      currencyName: 'South Korean Won',
      rateToUSD: 1370.00,
      defaultLang: 'en'
    },
    {
      code: 'CH',
      name: 'Switzerland',
      nativeName: 'Schweiz',
      flag: '🇨🇭',
      currencyCode: 'CHF',
      currencySymbol: 'CHF',
      currencyName: 'Swiss Franc',
      rateToUSD: 0.91,
      defaultLang: 'de'
    },
    {
      code: 'NZ',
      name: 'New Zealand',
      nativeName: 'New Zealand',
      flag: '🇳🇿',
      currencyCode: 'NZD',
      currencySymbol: 'NZ$',
      currencyName: 'New Zealand Dollar',
      rateToUSD: 1.66,
      defaultLang: 'en'
    },
    {
      code: 'MX',
      name: 'Mexico',
      nativeName: 'México',
      flag: '🇲🇽',
      currencyCode: 'MXN',
      currencySymbol: 'Mex$',
      currencyName: 'Mexican Peso',
      rateToUSD: 16.80,
      defaultLang: 'es'
    },
    {
      code: 'SE',
      name: 'Sweden',
      nativeName: 'Sverige',
      flag: '🇸🇪',
      currencyCode: 'SEK',
      currencySymbol: 'kr',
      currencyName: 'Swedish Krona',
      rateToUSD: 10.75,
      defaultLang: 'en'
    },
    {
      code: 'NO',
      name: 'Norway',
      nativeName: 'Norge',
      flag: '🇳🇴',
      currencyCode: 'NOK',
      currencySymbol: 'kr',
      currencyName: 'Norwegian Krone',
      rateToUSD: 10.65,
      defaultLang: 'en'
    },
    {
      code: 'DK',
      name: 'Denmark',
      nativeName: 'Danmark',
      flag: '🇩🇰',
      currencyCode: 'DKK',
      currencySymbol: 'kr',
      currencyName: 'Danish Krone',
      rateToUSD: 6.88,
      defaultLang: 'en'
    },
    {
      code: 'PL',
      name: 'Poland',
      nativeName: 'Polska',
      flag: '🇵🇱',
      currencyCode: 'PLN',
      currencySymbol: 'zł',
      currencyName: 'Polish Zloty',
      rateToUSD: 3.98,
      defaultLang: 'en'
    },
    {
      code: 'TH',
      name: 'Thailand',
      nativeName: 'ประเทศไทย',
      flag: '🇹🇭',
      currencyCode: 'THB',
      currencySymbol: '฿',
      currencyName: 'Thai Baht',
      rateToUSD: 36.70,
      defaultLang: 'en'
    },
    {
      code: 'VN',
      name: 'Vietnam',
      nativeName: 'Việt Nam',
      flag: '🇻🇳',
      currencyCode: 'VND',
      currencySymbol: '₫',
      currencyName: 'Vietnamese Dong',
      rateToUSD: 25400.00,
      defaultLang: 'en'
    }
  ];

  // Supported Languages
  readonly languages: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English (US/UK)', flag: '🇬🇧', dir: 'ltr' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو (Urdu)', flag: '🇵🇰', dir: 'rtl' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية (Arabic)', flag: '🇸🇦', dir: 'rtl' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (Hindi)', flag: '🇮🇳', dir: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
    { code: 'zh', name: 'Chinese', nativeName: '中文 (Simplified)', flag: '🇨🇳', dir: 'ltr' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', dir: 'ltr' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' }
  ];

  // Multi-language translation dictionary for core app UI
  readonly translations: Record<string, Record<string, string>> = {
    en: {
      currency_converter: 'Currency Converter',
      language_selector: 'Language Selector',
      select_country: 'Select Country & Currency',
      search_country: 'Search country or currency...',
      search_language: 'Search language...',
      all_countries: 'All Countries',
      languages: 'Languages',
      converter_calc: 'Live Currency Calculator',
      enter_amount: 'Enter amount',
      converted_result: 'Converted Result',
      apply_currency: 'Apply Currency',
      rates_info: 'Global real-time exchange rates synchronized across all business modules & store.',
      home: 'Home',
      solutions: 'Solutions',
      technology: 'Technology',
      how_it_works: 'How It Works',
      store: 'Premium Store',
      pricing: 'Pricing',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      system_live: 'System Live',
      offline: 'Offline',
      students: 'Students',
      fees: 'Fee Challans',
      attendance: 'Gate Attendance',
      exams: 'Exams & Grades',
      payroll: 'Faculty Payroll',
      admissions: 'New Admissions',
      live_classes: 'Live Classes',
      search: 'Search...',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      total: 'Total',
      status: 'Status',
      paid: 'Paid',
      pending: 'Pending',
      overdue: 'Overdue',
      bulk_challans: 'Bulk Monthly Challans',
      single_challan: 'Single Challan',
      fee_collected: 'Fee Collected',
      fee_pending: 'Pending Dues',
      view: 'View',
      add_to_cart: 'Add',
      checkout: 'Checkout',
      cart: 'Cart',
      items: 'items',
      price: 'Price',
      overview: 'Overview',
      clients: 'Clients',
      super_admin_hub: 'Super Admin Hub',
      enterprise_platform_live: 'ENTERPRISE PLATFORM LIVE',
      good_morning: 'Good Morning',
      good_afternoon: 'Good Afternoon',
      good_evening: 'Good Evening',
      super_admin_desc: 'Super Admin Control Center. Monitor multi-tenant infrastructure, revenue streams, and client health metrics in real-time.',
      portal_preview: 'Portal Preview',
      view_clients: 'View Clients',
      system_config: 'SYSTEM CONFIG',
      business_kpis: 'BUSINESS KPIS',
      syncing_in: 'SYNCING IN',
      total_tenants: 'TOTAL TENANTS',
      active: 'ACTIVE',
      rejected: 'REJECTED',
      industry_matrix: 'INDUSTRY BUSINESS MATRIX',
      business_suites_title: 'BUSINESS SUITES & DEDICATED CONSOLES',
      business_suites_desc: 'Direct access to 30 official industry business suites with 13 specialized operational consoles',
      school_hub: 'School & College Management',
      account_settings: 'Account & Profile Settings',
      account_settings_desc: 'Name, credentials & personal options',
      active_workspace: 'My Active Business Workspace',
      sign_out: 'Sign Out',
      exit_preview: 'Exit Business Preview',
      language: 'Language',
      currency: 'Currency',
      country: 'Country',
      select_country_currency: 'Country & Currency',
      search_placeholder: 'Search country or currency...',
      search_lang_placeholder: 'Search language...',
      live: 'Live'
    },
    ur: {
      currency_converter: 'کرنسی کنورٹر',
      language_selector: 'زبان منتخب کریں',
      select_country: 'ملک اور کرنسی منتخب کریں',
      search_country: 'ملک یا کرنسی تلاش کریں...',
      search_language: 'زبان تلاش کریں...',
      all_countries: 'تمام ممالک',
      languages: 'زبانیں',
      converter_calc: 'لائیو کرنسی کیلکولیٹر',
      enter_amount: 'رقم درج کریں',
      converted_result: 'تبدیل شدہ رقم',
      apply_currency: 'کرنسی نافذ کریں',
      rates_info: 'عالمی ریئل ٹائم ایکسچینج ریٹس تمام کاروباری ماڈیولز اور اسٹور پر لاگو ہیں۔',
      home: 'ہوم',
      solutions: 'حل',
      technology: 'ٹیکنالوجی',
      how_it_works: 'یہ کیسے کام کرتا ہے',
      store: 'پریمیم اسٹور',
      pricing: 'قیمتیں',
      login: 'لاگ ان',
      register: 'رجسٹر',
      dashboard: 'ڈیش بورڈ',
      system_live: 'سسٹم لائیو',
      offline: 'آف لائن',
      students: 'طلباء',
      fees: 'فیس چالان',
      attendance: 'گیٹ حاضری',
      exams: 'امتحانات اور گریڈز',
      payroll: 'تنخواہوں کا نظام',
      admissions: 'نئے داخلے',
      live_classes: 'لائیو کلاسز',
      search: 'تلاش کریں...',
      previous: 'پچھلا',
      next: 'اگلا',
      page: 'صفحہ',
      of: 'از',
      total: 'کل',
      status: 'حیثیت',
      paid: 'ادا شدہ',
      pending: 'واجب الادا',
      overdue: 'تاخیر شدہ',
      bulk_challans: 'ماہانہ بلک چالان',
      single_challan: 'اکیلا چالان',
      fee_collected: 'وصول شدہ فیس',
      fee_pending: 'بقیہ واجبات',
      view: 'دیکھیں',
      add_to_cart: 'شامل کریں',
      checkout: 'چیک آؤٹ',
      cart: 'ٹوکری',
      items: 'اشیاء',
      price: 'قیمت',
      overview: 'جائزہ',
      clients: 'کلائنٹس',
      super_admin_hub: 'سپر ایڈمن حب',
      enterprise_platform_live: 'انٹرپرائز پلیٹ فارم لائیو',
      good_morning: 'صبح بخیر',
      good_afternoon: 'دوپہر بخیر',
      good_evening: 'شام بخیر',
      super_admin_desc: 'سپر ایڈمن کنٹرول سینٹر۔ ملٹی ٹیننٹ انفراسٹرکچر، آمدنی کے ذرائع، اور میٹرکس کی حقیقی وقت میں نگرانی کریں۔',
      portal_preview: 'پورٹل کا پیش نظارہ',
      view_clients: 'کلائنٹس دیکھیں',
      system_config: 'سسٹم کنفیگریشن',
      business_kpis: 'کاروباری اشاریے',
      syncing_in: 'مطابقت پذیری',
      total_tenants: 'کل ٹیننٹس',
      active: 'فعال',
      rejected: 'مسترد شدہ',
      industry_matrix: 'صنعتی کاروباری میٹرکس',
      business_suites_title: 'کاروباری سویٹس اور وقف شدہ کنسولز',
      business_suites_desc: '13 خصوصی آپریشنل کنسولز کے ساتھ 30 سرکاری صنعتی کاروباری سویٹس تک براہ راست رسائی',
      school_hub: 'اسکول اور کالج کا انتظام',
      account_settings: 'اکاؤنٹ اور پروفائل کی ترتیبات',
      account_settings_desc: 'نام، لاگ ان کی تفصیلات اور ذاتی ترتیبات',
      active_workspace: 'میرا فعال کاروباری ورک اسپیس',
      sign_out: 'سائن آؤٹ',
      exit_preview: 'کاروباری پیش نظارہ ختم کریں',
      language: 'زبان',
      currency: 'کرنسی',
      country: 'ملک',
      select_country_currency: 'ملک اور کرنسی',
      search_placeholder: 'ملک یا کرنسی تلاش کریں...',
      search_lang_placeholder: 'زبان تلاش کریں...',
      live: 'لائیو'
    },
    ar: {
      currency_converter: 'محول العملات',
      language_selector: 'اختيار اللغة',
      select_country: 'اختر الدولة والعملة',
      search_country: 'ابحث عن الدولة أو العملة...',
      search_language: 'ابحث عن اللغة...',
      all_countries: 'جميع الدول',
      languages: 'اللغات',
      converter_calc: 'حاسبة العملات المباشرة',
      enter_amount: 'أدخل المبلغ',
      converted_result: 'النتيجة المحولة',
      apply_currency: 'تطبيق العملة',
      rates_info: 'أسعار الصرف العالمية الفورية متزامنة عبر جميع وحدات الأعمال والمتجر.',
      home: 'الرئيسية',
      solutions: 'الحلول',
      technology: 'التكنولوجيا',
      how_it_works: 'كيف يعمل',
      store: 'المتجر المميز',
      pricing: 'الأسعار',
      login: 'تسجيل الدخول',
      register: 'تسجيل جديد',
      dashboard: 'لوحة التحكم',
      system_live: 'النظام متصل',
      offline: 'غير متصل',
      students: 'الطلاب',
      fees: 'إيصالات الرسوم',
      attendance: 'حضور البوابة',
      exams: 'الامتحانات والدرجات',
      payroll: 'الرواتب والأجور',
      admissions: 'القبول والتسجيل',
      live_classes: 'الفصول المباشرة',
      search: 'بحث...',
      previous: 'السابق',
      next: 'التالي',
      page: 'صفحة',
      of: 'من',
      total: 'المجموع',
      status: 'الحالة',
      paid: 'مدفوع',
      pending: 'معلق',
      overdue: 'متأخر',
      bulk_challans: 'إيصالات شهرية شاملة',
      single_challan: 'إيصال فردي',
      fee_collected: 'الرسوم المحصلة',
      fee_pending: 'الرسوم المعلقة',
      view: 'عرض',
      add_to_cart: 'إضافة',
      checkout: 'الدفع',
      cart: 'السلة',
      items: 'عناصر',
      price: 'السعر',
      overview: 'نظرة عامة',
      clients: 'العملاء',
      super_admin_hub: 'مركز الإدارة العامة',
      enterprise_platform_live: 'منصة المؤسسات المباشرة',
      good_morning: 'صباح الخير',
      good_afternoon: 'مساء الخير',
      good_evening: 'مساء الخير',
      super_admin_desc: 'مركز تحكم المدير العام. مراقبة البنية التحتية متعددة المستأجرين وتدفقات الإيرادات في الوقت الفعلي.',
      portal_preview: 'معاينة البوابة',
      view_clients: 'عرض العملاء',
      system_config: 'إعدادات النظام',
      business_kpis: 'مؤشرات الأداء الرئيسية',
      syncing_in: 'المزامنة خلال',
      total_tenants: 'إجمالي المستأجرين',
      active: 'نشط',
      rejected: 'مرفوض',
      industry_matrix: 'مصفوفة الأعمال الصناعية',
      business_suites_title: 'أجنحة الأعمال ووحدات التحكم المخصصة',
      business_suites_desc: 'الوصول المباشر إلى 30 جناح أعمال صناعي رسمي مع 13 وحدة تحكم تشغيلية',
      school_hub: 'إدارة المدارس والكليات',
      account_settings: 'إعدادات الحساب والملف الشخصي',
      account_settings_desc: 'الاسم وبيانات الاعتماد والخيارات الشخصية',
      active_workspace: 'مساحة عمل أعمالي النشطة',
      sign_out: 'تسجيل الخروج',
      exit_preview: 'إنهاء المعاينة',
      language: 'اللغة',
      currency: 'العملة',
      country: 'الدولة',
      select_country_currency: 'الدولة والعملة',
      search_placeholder: 'ابحث عن الدولة أو العملة...',
      search_lang_placeholder: 'ابحث عن اللغة...',
      live: 'مباشر'
    },
    hi: {
      currency_converter: 'मुद्रा परिवर्तक',
      language_selector: 'भाषा चयन',
      select_country: 'देश और मुद्रा चुनें',
      search_country: 'देश या मुद्रा खोजें...',
      search_language: 'भाषा खोजें...',
      all_countries: 'सभी देश',
      languages: 'भाषाएँ',
      converter_calc: 'लाइव मुद्रा कैलकुलेटर',
      enter_amount: 'राशि दर्ज करें',
      converted_result: 'परिवर्तित राशि',
      apply_currency: 'मुद्रा लागू करें',
      rates_info: 'वैश्विक वास्तविक समय विनिमय दरें सभी व्यावसायिक मॉड्यूल और स्टोर में समन्वयित हैं।',
      home: 'होम',
      solutions: 'समाधान',
      technology: 'प्रौद्योगिकी',
      how_it_works: 'यह कैसे काम करता है',
      store: 'प्रीमियम स्टोर',
      pricing: 'मूल्य निर्धारण',
      login: 'लॉग इन',
      register: 'पंजीकरण',
      dashboard: 'डैशबोर्ड',
      system_live: 'सिस्टम लाइव',
      offline: 'ऑफ़लाइन',
      students: 'छात्र',
      fees: 'शुल्क चालान',
      attendance: 'उपस्थिति',
      exams: 'परीक्षा और ग्रेड',
      payroll: 'वेतन प्रणाली',
      admissions: 'नए प्रवेश',
      live_classes: 'लाइव कक्षाएं',
      search: 'खोजें...',
      previous: 'पिछला',
      next: 'अगला',
      page: 'पृष्ठ',
      of: 'का',
      total: 'कुल',
      status: 'स्थिति',
      paid: 'भुगतान किया गया',
      pending: 'लंबित',
      overdue: 'अतिदेय',
      bulk_challans: 'मासिक थोक चालान',
      single_challan: 'एकल चालान',
      fee_collected: 'एकत्रित शुल्क',
      fee_pending: 'लंबित देय राशि',
      view: 'देखें',
      add_to_cart: 'जोड़ें',
      checkout: 'चेकआउट',
      cart: 'कार्ट',
      items: 'आइटम',
      price: 'कीमत',
      overview: 'अवलोकन',
      clients: 'ग्राहक',
      super_admin_hub: 'सुपर एडमिन हब',
      enterprise_platform_live: 'एंटरप्राइज प्लेटफॉर्म लाइव',
      good_morning: 'शुभ प्रभात',
      good_afternoon: 'शुभ दोपहर',
      good_evening: 'शुभ संध्या',
      super_admin_desc: 'सुपर एडमिन नियंत्रण केंद्र। वास्तविक समय में मल्टी-टेनेंट बुनियादी ढांचे और राजस्व की निगरानी करें।',
      portal_preview: 'पोर्टल पूर्वावलोकन',
      view_clients: 'ग्राहक देखें',
      system_config: 'सिस्टम कॉन्फ़िगरेशन',
      business_kpis: 'व्यावसायिक संकेतक',
      syncing_in: 'सिंक हो रहा है',
      total_tenants: 'कुल किरायेदार',
      active: 'सक्रिय',
      rejected: 'अस्वीकृत',
      industry_matrix: 'उद्योग व्यापार मैट्रिक्स',
      business_suites_title: 'बिजनेस सुइट्स और कंसोल',
      business_suites_desc: '13 विशेष कंसोल के साथ 30 आधिकारिक उद्योग सुइट्स तक सीधी पहुंच',
      school_hub: 'स्कूल और कॉलेज प्रबंधन',
      account_settings: 'खाता और प्रोफ़ाइल सेटिंग्स',
      account_settings_desc: 'नाम, क्रेडेंशियल और व्यक्तिगत विकल्प',
      active_workspace: 'सक्रिय व्यावसायिक कार्यक्षेत्र',
      sign_out: 'साइन आउट',
      exit_preview: 'पूर्वावलोकन से बाहर निकलें',
      language: 'भाषा',
      currency: 'मुद्रा',
      country: 'देश',
      select_country_currency: 'देश और मुद्रा',
      search_placeholder: 'देश या मुद्रा खोजें...',
      search_lang_placeholder: 'भाषा खोजें...',
      live: 'लाइव'
    },
    es: {
      currency_converter: 'Conversor de Divisas',
      language_selector: 'Selector de Idioma',
      select_country: 'Seleccionar País y Moneda',
      search_country: 'Buscar país o divisa...',
      search_language: 'Buscar idioma...',
      all_countries: 'Todos los Países',
      languages: 'Idiomas',
      converter_calc: 'Calculadora de Divisas en Vivo',
      enter_amount: 'Ingrese el monto',
      converted_result: 'Resultado Convertido',
      apply_currency: 'Aplicar Divisa',
      rates_info: 'Tasas de cambio globales en tiempo real sincronizadas en todos los módulos y tienda.',
      home: 'Inicio',
      solutions: 'Soluciones',
      technology: 'Tecnología',
      how_it_works: 'Cómo Funciona',
      store: 'Tienda Premium',
      pricing: 'Precios',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      dashboard: 'Panel',
      system_live: 'Sistema En Línea',
      offline: 'Desconectado',
      students: 'Estudiantes',
      fees: 'Recibos de Matrícula',
      attendance: 'Asistencia',
      exams: 'Exámenes y Calificaciones',
      payroll: 'Nómina',
      admissions: 'Admisiones',
      live_classes: 'Clases en Vivo',
      search: 'Buscar...',
      previous: 'Anterior',
      next: 'Siguiente',
      page: 'Página',
      of: 'de',
      total: 'Total',
      status: 'Estado',
      paid: 'Pagado',
      pending: 'Pendiente',
      overdue: 'Atrasado',
      bulk_challans: 'Recibos Mensuales Masivos',
      single_challan: 'Recibo Individual',
      fee_collected: 'Tarifas Recaudadas',
      fee_pending: 'Cuotas Pendientes',
      view: 'Ver',
      add_to_cart: 'Añadir',
      checkout: 'Pagar',
      cart: 'Carrito',
      items: 'artículos',
      price: 'Precio',
      overview: 'Visión General',
      clients: 'Clientes',
      super_admin_hub: 'Centro de Superadministración',
      enterprise_platform_live: 'PLATAFORMA EMPRESARIAL EN VIVO',
      good_morning: 'Buenos Días',
      good_afternoon: 'Buenas Tardes',
      good_evening: 'Buenas Noches',
      super_admin_desc: 'Centro de Control de Superadministrador. Monitoree infraestructura multiinquilino e ingresos en tiempo real.',
      portal_preview: 'Vista Previa del Portal',
      view_clients: 'Ver Clientes',
      system_config: 'CONFIGURACIÓN DEL SISTEMA',
      business_kpis: 'KPIS EMPRESARIALES',
      syncing_in: 'SINCRONIZANDO EN',
      total_tenants: 'TOTAL CLIENTES',
      active: 'ACTIVOS',
      rejected: 'RECHAZADOS',
      industry_matrix: 'MATRIZ DE NEGOCIOS',
      business_suites_title: 'SUITES DE NEGOCIOS Y CONSOLAS',
      business_suites_desc: 'Acceso directo a 30 suites de negocios oficiales con 13 consolas operativas especializadas',
      school_hub: 'Gestión Escolar y Universitaria',
      account_settings: 'Configuración de Cuenta y Perfil',
      account_settings_desc: 'Nombre, credenciales y opciones personales',
      active_workspace: 'Mi Espacio de Trabajo Activo',
      sign_out: 'Cerrar Sesión',
      exit_preview: 'Salir de Vista Previa',
      language: 'Idioma',
      currency: 'Moneda',
      country: 'País',
      select_country_currency: 'País y Moneda',
      search_placeholder: 'Buscar país o moneda...',
      search_lang_placeholder: 'Buscar idioma...',
      live: 'En Vivo'
    },
    tr: {
      currency_converter: 'Para Birimi Çevirici',
      language_selector: 'Dil Seçici',
      select_country: 'Ülke ve Para Birimi Seçin',
      search_country: 'Ülke veya para birimi ara...',
      search_language: 'Dil ara...',
      all_countries: 'Tüm Ülkeler',
      languages: 'Diller',
      converter_calc: 'Canlı Döviz Hesaplayıcı',
      enter_amount: 'Miktar girin',
      converted_result: 'Dönüştürülen Sonuç',
      apply_currency: 'Para Birimini Uygula',
      rates_info: 'Tüm işletme modüllerinde ve mağazada senkronize canlı küresel döviz kurları.',
      home: 'Ana Sayfa',
      solutions: 'Çözümler',
      technology: 'Teknoloji',
      how_it_works: 'Nasıl Çalışır',
      store: 'Premium Mağaza',
      pricing: 'Fiyatlandırma',
      login: 'Giriş Yap',
      register: 'Kayıt Ol',
      dashboard: 'Panel',
      system_live: 'Sistem Aktif',
      offline: 'Çevrimdışı',
      students: 'Öğrenciler',
      fees: 'Harç Makbuzları',
      attendance: 'Kapı Yoklaması',
      exams: 'Sınavlar ve Notlar',
      payroll: 'Maaş Bordrosu',
      admissions: 'Yeni Kayıtlar',
      live_classes: 'Canlı Dersler',
      search: 'Ara...',
      previous: 'Önceki',
      next: 'Sonraki',
      page: 'Sayfa',
      of: '/',
      total: 'Toplam',
      status: 'Durum',
      paid: 'Ödendi',
      pending: 'Beklemede',
      overdue: 'Gecikmiş',
      bulk_challans: 'Toplu Aylık Makbuzlar',
      single_challan: 'Tek Makbuz',
      fee_collected: 'Tahsil Edilen',
      fee_pending: 'Bekleyen Borçlar',
      view: 'Görüntüle',
      add_to_cart: 'Ekle',
      checkout: 'Ödeme',
      cart: 'Sepet',
      items: 'ürün',
      price: 'Fiyat',
      overview: 'Genel Bakış',
      clients: 'Müşteriler',
      super_admin_hub: 'Süper Yönetici Merkezi',
      enterprise_platform_live: 'KURUMSAL PLATFORM CANLI',
      good_morning: 'Günaydın',
      good_afternoon: 'Tünaydın',
      good_evening: 'İyi Akşamlar',
      super_admin_desc: 'Süper Yönetici Kontrol Merkezi. Çok kiracılı altyapıyı ve gelir akışlarını gerçek zamanlı izleyin.',
      portal_preview: 'Portal Önizleme',
      view_clients: 'Müşterileri Görüntüle',
      system_config: 'SİSTEM YAPILANDIRMASI',
      business_kpis: 'İŞLETME KPI\'LARI',
      syncing_in: 'SENKRONİZE EDİLİYOR',
      total_tenants: 'TOPLAM MÜŞTERİ',
      active: 'AKTİF',
      rejected: 'REDDEDİLEN',
      industry_matrix: 'ENDÜSTRİ İŞ MATRİSİ',
      business_suites_title: 'İŞ SUİTLERİ VE ÖZEL KONSOLLAR',
      business_suites_desc: '13 uzman operasyon konsoluyla 30 resmi endüstri iş paketine doğrudan erişim',
      school_hub: 'Okul ve Üniversite Yönetimi',
      account_settings: 'Hesap ve Profil Ayarları',
      account_settings_desc: 'İsim, kimlik bilgileri ve kişisel seçenekler',
      active_workspace: 'Aktif İş Çalışma Alanım',
      sign_out: 'Çıkış Yap',
      exit_preview: 'Önizlemeden Çık',
      language: 'Dil',
      currency: 'Para Birimi',
      country: 'Ülke',
      select_country_currency: 'Ülke ve Para Birimi',
      search_placeholder: 'Ülke veya para birimi ara...',
      search_lang_placeholder: 'Dil ara...',
      live: 'Canlı'
    }
  };

  /**
   * Helper to get official high-resolution country sticker / flag logo URL
   */
  getFlagUrl(code: string): string {
    if (!code) return 'https://flagcdn.com/w40/pk.png';
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  }

  // State signals
  readonly currentCountry = signal<CountryInfo>(this.countries[0]); // Defaults to Pakistan PKR
  readonly currentLanguage = signal<LanguageInfo>(this.languages[0]); // Defaults to English, can switch to Urdu or others

  // Derived helpers
  readonly currentCurrencyCode = computed(() => this.currentCountry().currencyCode);
  readonly currentCurrencySymbol = computed(() => this.currentCountry().currencySymbol);
  readonly currentRateToUSD = computed(() => this.currentCountry().rateToUSD);
  readonly currentLangCode = computed(() => this.currentLanguage().code);
  readonly isRtl = computed(() => this.currentLanguage().dir === 'rtl');

  constructor() {
    this.restoreSavedPreferences();
  }

  private restoreSavedPreferences(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const savedCountryCode = localStorage.getItem('scs_selected_country');
      if (savedCountryCode) {
        const found = this.countries.find(c => c.code === savedCountryCode);
        if (found) {
          this.currentCountry.set(found);
        }
      }

      const savedLangCode = localStorage.getItem('scs_selected_language');
      if (savedLangCode) {
        const foundLang = this.languages.find(l => l.code === savedLangCode);
        if (foundLang) {
          this.currentLanguage.set(foundLang);
          this.applyDocumentDirection(foundLang.dir);
        }
      }
    } catch (e) {
      console.warn('Could not restore localization preferences', e);
    }
  }

  // Switch country (which also updates primary currency and optionally language)
  setCountry(country: CountryInfo | string, syncLanguage = false): void {
    const target = typeof country === 'string'
      ? this.countries.find(c => c.code === country || c.currencyCode === country)
      : country;

    if (!target) return;
    this.currentCountry.set(target);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('scs_selected_country', target.code);
      localStorage.setItem('scs_selected_currency', target.currencyCode);
    }

    if (syncLanguage && target.defaultLang) {
      this.setLanguage(target.defaultLang);
    }
  }

  // Directly set currency by currency code (e.g. 'USD', 'PKR', 'SAR', 'AED', 'EUR')
  setCurrencyByCode(code: string): void {
    const found = this.countries.find(c => c.currencyCode === code);
    if (found) {
      this.setCountry(found);
    }
  }

  // Switch language
  setLanguage(lang: LanguageInfo | string): void {
    const target = typeof lang === 'string'
      ? this.languages.find(l => l.code === lang)
      : lang;

    if (!target) return;
    this.currentLanguage.set(target);
    this.applyDocumentDirection(target.dir);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('scs_selected_language', target.code);
    }
  }

  private applyDocumentDirection(dir: 'ltr' | 'rtl'): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = this.currentLanguage().code;
    }
  }

  /**
   * Convert an amount from USD base to the currently selected currency.
   * e.g. amount in USD 10 -> in PKR (10 * 278.5) = 2,785
   */
  convertFromUSD(amountUSD: number): number {
    if (isNaN(amountUSD) || amountUSD == null) return 0;
    return amountUSD * this.currentRateToUSD();
  }

  /**
   * Convert an amount from PKR base to currently selected currency.
   * Base rate of PKR is 278.50 per USD.
   */
  convertFromPKR(amountPKR: number): number {
    if (isNaN(amountPKR) || amountPKR == null) return 0;
    const pkrRate = 278.50;
    const inUSD = amountPKR / pkrRate;
    return this.convertFromUSD(inUSD);
  }

  /**
   * Convert between any two currencies given codes
   */
  convertBetween(amount: number, fromCode: string, toCode: string): number {
    const fromCountry = this.countries.find(c => c.currencyCode === fromCode) || this.countries[1]; // default USD
    const toCountry = this.countries.find(c => c.currencyCode === toCode) || this.currentCountry();

    const inUSD = fromCountry.rateToUSD > 0 ? (amount / fromCountry.rateToUSD) : amount;
    return inUSD * toCountry.rateToUSD;
  }

  /**
   * Universal price formatter: converts from base ('USD' or 'PKR') and returns formatted string with country symbol!
   * e.g. formatPrice(120, 'USD') -> "₨ 33,420" (when PKR selected), or "$120.00" (when USD selected), or "ر.س 450.00" (when SAR selected)
   */
  formatPrice(amount: number, baseCurrency: 'USD' | 'PKR' = 'USD'): string {
    const converted = baseCurrency === 'PKR'
      ? this.convertFromPKR(amount)
      : this.convertFromUSD(amount);

    const symbol = this.currentCurrencySymbol();
    const formattedNum = this.formatNumber(converted);

    // Some currencies look better with symbol in front, some with space
    return `${symbol} ${formattedNum}`;
  }

  /**
   * Converts a raw string price like "RS 13,000" or "$450" into the active currency!
   */
  convertStringPrice(priceStr: string): string {
    if (!priceStr) return '';
    // Strip RS, PKR, $, €, etc. and commas
    const cleanStr = priceStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return priceStr;

    // Detect if original was RS/PKR
    const isPKR = priceStr.toUpperCase().includes('RS') || priceStr.toUpperCase().includes('PKR');
    return this.formatPrice(num, isPKR ? 'PKR' : 'USD');
  }

  /**
   * Translate text key
   */
  t(key: string): string {
    const lang = this.currentLangCode();
    const dict = this.translations[lang] || this.translations['en'];
    return dict[key] || this.translations['en'][key] || key;
  }

  private formatNumber(val: number): string {
    if (val >= 1000) {
      // Round to whole numbers if > 1000 or for high rate currencies like PKR, JPY, IDR, KRW
      return Math.round(val).toLocaleString('en-US');
    }
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
