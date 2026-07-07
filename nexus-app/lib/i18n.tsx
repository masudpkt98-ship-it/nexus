"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang =
  | "en"
  | "id"
  | "zh"
  | "ru"
  | "fr"
  | "es"
  | "ar"
  | "bn"
  | "hi"
  | "ur"
  | "ko"
  | "ja"
  | "pt";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "zh", label: "中文" },
  { code: "ru", label: "Русский" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "ur", label: "اردو" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "pt", label: "Português" },
];

const CODES = LANGS.map((l) => l.code);
const RTL: Lang[] = ["ar", "ur"];

// Keys translated per language, in a fixed order, so each language is a plain array.
const KEYS = [
  "Overview",
  "Plan & Execute",
  "People & Performance",
  "Customer",
  "Workspace",
  "Intelligence",
  "Dashboard",
  "Strategic Planning",
  "Program Management",
  "Task Management",
  "Competency",
  "Performance",
  "Development",
  "Customer Request",
  "Satisfaction",
  "Meetings",
  "Knowledge",
  "Documents",
  "Notifications",
  "AI Assistant",
  "Analytics",
  "Search tasks, people, KPI, documents…",
  "Mark all read",
  "View all",
  "No notifications.",
  "4 new insights",
] as const;

const TRANSLATIONS: Record<Exclude<Lang, "en">, string[]> = {
  id: ["Ikhtisar", "Rencana & Eksekusi", "SDM & Kinerja", "Pelanggan", "Ruang Kerja", "Kecerdasan", "Dasbor", "Perencanaan Strategis", "Manajemen Program", "Manajemen Tugas", "Kompetensi", "Kinerja", "Pengembangan", "Permintaan Pelanggan", "Kepuasan", "Rapat", "Pengetahuan", "Dokumen", "Notifikasi", "Asisten AI", "Analitik", "Cari tugas, orang, KPI, dokumen…", "Tandai semua dibaca", "Lihat semua", "Tidak ada notifikasi.", "4 wawasan baru"],
  zh: ["概览", "规划与执行", "人员与绩效", "客户", "工作区", "智能", "仪表板", "战略规划", "项目管理", "任务管理", "能力", "绩效", "发展", "客户请求", "满意度", "会议", "知识", "文档", "通知", "AI 助手", "分析", "搜索任务、人员、KPI、文档…", "全部标为已读", "查看全部", "暂无通知。", "4 条新洞察"],
  ru: ["Обзор", "Планирование и выполнение", "Люди и эффективность", "Клиент", "Рабочее пространство", "Интеллект", "Панель", "Стратегическое планирование", "Управление программами", "Управление задачами", "Компетенции", "Эффективность", "Развитие", "Запрос клиента", "Удовлетворённость", "Встречи", "База знаний", "Документы", "Уведомления", "ИИ-ассистент", "Аналитика", "Поиск задач, людей, KPI, документов…", "Отметить все как прочитанные", "Показать все", "Нет уведомлений.", "4 новых вывода"],
  fr: ["Aperçu", "Planifier et exécuter", "Personnes et performance", "Client", "Espace de travail", "Intelligence", "Tableau de bord", "Planification stratégique", "Gestion des programmes", "Gestion des tâches", "Compétence", "Performance", "Développement", "Demande client", "Satisfaction", "Réunions", "Connaissances", "Documents", "Notifications", "Assistant IA", "Analytique", "Rechercher tâches, personnes, KPI, documents…", "Tout marquer comme lu", "Tout voir", "Aucune notification.", "4 nouvelles analyses"],
  es: ["Resumen", "Planificar y ejecutar", "Personas y desempeño", "Cliente", "Espacio de trabajo", "Inteligencia", "Panel", "Planificación estratégica", "Gestión de programas", "Gestión de tareas", "Competencias", "Desempeño", "Desarrollo", "Solicitud de cliente", "Satisfacción", "Reuniones", "Conocimiento", "Documentos", "Notificaciones", "Asistente IA", "Analítica", "Buscar tareas, personas, KPI, documentos…", "Marcar todo como leído", "Ver todo", "Sin notificaciones.", "4 nuevas ideas"],
  ar: ["نظرة عامة", "التخطيط والتنفيذ", "الأفراد والأداء", "العميل", "مساحة العمل", "الذكاء", "لوحة القيادة", "التخطيط الاستراتيجي", "إدارة البرامج", "إدارة المهام", "الكفاءة", "الأداء", "التطوير", "طلب العميل", "الرضا", "الاجتماعات", "المعرفة", "المستندات", "الإشعارات", "مساعد الذكاء الاصطناعي", "التحليلات", "ابحث عن المهام والأشخاص والمؤشرات والمستندات…", "تحديد الكل كمقروء", "عرض الكل", "لا توجد إشعارات.", "٤ رؤى جديدة"],
  bn: ["ওভারভিউ", "পরিকল্পনা ও বাস্তবায়ন", "মানুষ ও কর্মক্ষমতা", "গ্রাহক", "কর্মক্ষেত্র", "বুদ্ধিমত্তা", "ড্যাশবোর্ড", "কৌশলগত পরিকল্পনা", "প্রোগ্রাম ব্যবস্থাপনা", "টাস্ক ব্যবস্থাপনা", "দক্ষতা", "কর্মক্ষমতা", "উন্নয়ন", "গ্রাহক অনুরোধ", "সন্তুষ্টি", "সভা", "জ্ঞান", "নথি", "বিজ্ঞপ্তি", "এআই সহকারী", "বিশ্লেষণ", "টাস্ক, মানুষ, KPI, নথি খুঁজুন…", "সব পঠিত হিসেবে চিহ্নিত করুন", "সব দেখুন", "কোনো বিজ্ঞপ্তি নেই।", "৪টি নতুন অন্তর্দৃষ্টি"],
  hi: ["अवलोकन", "योजना और निष्पादन", "लोग और प्रदर्शन", "ग्राहक", "कार्यक्षेत्र", "बुद्धिमत्ता", "डैशबोर्ड", "रणनीतिक योजना", "कार्यक्रम प्रबंधन", "कार्य प्रबंधन", "योग्यता", "प्रदर्शन", "विकास", "ग्राहक अनुरोध", "संतुष्टि", "बैठकें", "ज्ञान", "दस्तावेज़", "सूचनाएं", "एआई सहायक", "विश्लेषण", "कार्य, लोग, KPI, दस्तावेज़ खोजें…", "सभी को पढ़ा हुआ चिह्नित करें", "सभी देखें", "कोई सूचना नहीं।", "4 नई अंतर्दृष्टि"],
  ur: ["جائزہ", "منصوبہ بندی اور عملدرآمد", "لوگ اور کارکردگی", "گاہک", "ورک اسپیس", "ذہانت", "ڈیش بورڈ", "اسٹریٹجک منصوبہ بندی", "پروگرام مینجمنٹ", "ٹاسک مینجمنٹ", "مہارت", "کارکردگی", "ترقی", "گاہک کی درخواست", "اطمینان", "میٹنگز", "علم", "دستاویزات", "اطلاعات", "اے آئی اسسٹنٹ", "تجزیات", "ٹاسک، لوگ، KPI، دستاویزات تلاش کریں…", "سب کو پڑھا ہوا نشان زد کریں", "سب دیکھیں", "کوئی اطلاع نہیں۔", "4 نئی بصیرتیں"],
  ko: ["개요", "계획 및 실행", "인력 및 성과", "고객", "워크스페이스", "인텔리전스", "대시보드", "전략 기획", "프로그램 관리", "작업 관리", "역량", "성과", "개발", "고객 요청", "만족도", "회의", "지식", "문서", "알림", "AI 어시스턴트", "분석", "작업, 사람, KPI, 문서 검색…", "모두 읽음으로 표시", "전체 보기", "알림이 없습니다.", "새 인사이트 4개"],
  ja: ["概要", "計画と実行", "人材とパフォーマンス", "顧客", "ワークスペース", "インテリジェンス", "ダッシュボード", "戦略立案", "プログラム管理", "タスク管理", "コンピテンシー", "パフォーマンス", "育成", "顧客リクエスト", "満足度", "会議", "ナレッジ", "ドキュメント", "通知", "AI アシスタント", "分析", "タスク、人、KPI、ドキュメントを検索…", "すべて既読にする", "すべて表示", "通知はありません。", "新しいインサイト4件"],
  pt: ["Visão geral", "Planejar e executar", "Pessoas e desempenho", "Cliente", "Espaço de trabalho", "Inteligência", "Painel", "Planejamento estratégico", "Gestão de programas", "Gestão de tarefas", "Competência", "Desempenho", "Desenvolvimento", "Solicitação de cliente", "Satisfação", "Reuniões", "Conhecimento", "Documentos", "Notificações", "Assistente de IA", "Análise", "Buscar tarefas, pessoas, KPI, documentos…", "Marcar tudo como lido", "Ver tudo", "Sem notificações.", "4 novas perspectivas"],
};

// Page-header titles (object form — self-aligned, English falls back to the key).
const PAGE_TITLES: Record<Exclude<Lang, "en">, Record<string, string>> = {
  id: { "Executive Dashboard": "Dasbor Eksekutif", "Competency Management": "Manajemen Kompetensi", "Performance Management": "Manajemen Kinerja", "Development Program": "Program Pengembangan", "Document Management": "Manajemen Dokumen", "Knowledge Management": "Manajemen Pengetahuan", "Meeting Management": "Manajemen Rapat", "Notification Center": "Pusat Notifikasi", "Customer Satisfaction": "Kepuasan Pelanggan" },
  zh: { "Executive Dashboard": "高管仪表板", "Competency Management": "能力管理", "Performance Management": "绩效管理", "Development Program": "发展计划", "Document Management": "文档管理", "Knowledge Management": "知识管理", "Meeting Management": "会议管理", "Notification Center": "通知中心", "Customer Satisfaction": "客户满意度" },
  ru: { "Executive Dashboard": "Панель руководителя", "Competency Management": "Управление компетенциями", "Performance Management": "Управление эффективностью", "Development Program": "Программа развития", "Document Management": "Управление документами", "Knowledge Management": "Управление знаниями", "Meeting Management": "Управление встречами", "Notification Center": "Центр уведомлений", "Customer Satisfaction": "Удовлетворённость клиентов" },
  fr: { "Executive Dashboard": "Tableau de bord exécutif", "Competency Management": "Gestion des compétences", "Performance Management": "Gestion de la performance", "Development Program": "Programme de développement", "Document Management": "Gestion des documents", "Knowledge Management": "Gestion des connaissances", "Meeting Management": "Gestion des réunions", "Notification Center": "Centre de notifications", "Customer Satisfaction": "Satisfaction client" },
  es: { "Executive Dashboard": "Panel ejecutivo", "Competency Management": "Gestión de competencias", "Performance Management": "Gestión del desempeño", "Development Program": "Programa de desarrollo", "Document Management": "Gestión de documentos", "Knowledge Management": "Gestión del conocimiento", "Meeting Management": "Gestión de reuniones", "Notification Center": "Centro de notificaciones", "Customer Satisfaction": "Satisfacción del cliente" },
  ar: { "Executive Dashboard": "لوحة القيادة التنفيذية", "Competency Management": "إدارة الكفاءات", "Performance Management": "إدارة الأداء", "Development Program": "برنامج التطوير", "Document Management": "إدارة المستندات", "Knowledge Management": "إدارة المعرفة", "Meeting Management": "إدارة الاجتماعات", "Notification Center": "مركز الإشعارات", "Customer Satisfaction": "رضا العملاء" },
  bn: { "Executive Dashboard": "এক্সিকিউটিভ ড্যাশবোর্ড", "Competency Management": "দক্ষতা ব্যবস্থাপনা", "Performance Management": "কর্মক্ষমতা ব্যবস্থাপনা", "Development Program": "উন্নয়ন কর্মসূচি", "Document Management": "নথি ব্যবস্থাপনা", "Knowledge Management": "জ্ঞান ব্যবস্থাপনা", "Meeting Management": "সভা ব্যবস্থাপনা", "Notification Center": "বিজ্ঞপ্তি কেন্দ্র", "Customer Satisfaction": "গ্রাহক সন্তুষ্টি" },
  hi: { "Executive Dashboard": "कार्यकारी डैशबोर्ड", "Competency Management": "योग्यता प्रबंधन", "Performance Management": "प्रदर्शन प्रबंधन", "Development Program": "विकास कार्यक्रम", "Document Management": "दस्तावेज़ प्रबंधन", "Knowledge Management": "ज्ञान प्रबंधन", "Meeting Management": "बैठक प्रबंधन", "Notification Center": "सूचना केंद्र", "Customer Satisfaction": "ग्राहक संतुष्टि" },
  ur: { "Executive Dashboard": "ایگزیکٹو ڈیش بورڈ", "Competency Management": "مہارت کا انتظام", "Performance Management": "کارکردگی کا انتظام", "Development Program": "ترقیاتی پروگرام", "Document Management": "دستاویز کا انتظام", "Knowledge Management": "علم کا انتظام", "Meeting Management": "میٹنگ کا انتظام", "Notification Center": "اطلاعاتی مرکز", "Customer Satisfaction": "گاہک کی اطمینان" },
  ko: { "Executive Dashboard": "경영진 대시보드", "Competency Management": "역량 관리", "Performance Management": "성과 관리", "Development Program": "개발 프로그램", "Document Management": "문서 관리", "Knowledge Management": "지식 관리", "Meeting Management": "회의 관리", "Notification Center": "알림 센터", "Customer Satisfaction": "고객 만족도" },
  ja: { "Executive Dashboard": "エグゼクティブダッシュボード", "Competency Management": "コンピテンシー管理", "Performance Management": "パフォーマンス管理", "Development Program": "育成プログラム", "Document Management": "ドキュメント管理", "Knowledge Management": "ナレッジ管理", "Meeting Management": "会議管理", "Notification Center": "通知センター", "Customer Satisfaction": "顧客満足度" },
  pt: { "Executive Dashboard": "Painel executivo", "Competency Management": "Gestão de competências", "Performance Management": "Gestão de desempenho", "Development Program": "Programa de desenvolvimento", "Document Management": "Gestão de documentos", "Knowledge Management": "Gestão do conhecimento", "Meeting Management": "Gestão de reuniões", "Notification Center": "Central de notificações", "Customer Satisfaction": "Satisfação do cliente" },
};

const dictionaries: Record<Lang, Record<string, string>> = { en: {} } as Record<Lang, Record<string, string>>;
for (const [code, values] of Object.entries(TRANSLATIONS)) {
  const map: Record<string, string> = {};
  KEYS.forEach((key, i) => (map[key] = values[i]));
  Object.assign(map, PAGE_TITLES[code as Exclude<Lang, "en">]);
  dictionaries[code as Lang] = map;
}

type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const I18nContext = createContext<I18nValue>({ lang: "en", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("nexus-lang") as Lang | null;
    if (saved && CODES.includes(saved)) setLangState(saved);
  }, []);

  // Reflect language + text direction on <html> (RTL for Arabic & Urdu).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("nexus-lang", l);
    } catch {
      /* storage unavailable */
    }
  };

  const t = (key: string) => dictionaries[lang]?.[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
