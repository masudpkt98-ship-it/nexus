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

// Page-header subtitles (descriptive taglines), one array per language, aligned
// to SUBTITLE_KEYS. Acronyms (KPI, SLA, IDP, SMART, STAR, OKR, RKAP, PIC, SOP,
// NPS) and separators are kept; only the descriptive words are translated.
const SUBTITLE_KEYS = [
  "Daily & Weekly Summary · Risk Detection · Delay Prediction · Executive Insight",
  "Productivity · Department Performance · Competency · Training · SLA · Executive Dashboard",
  "Dictionary · Matrix · Mapping · Assessment · Gap Analysis · IDP · Career Readiness",
  "Executive Dashboard · Everything connected — People → Competency → Execution → Performance → Value",
  "Operator · Supervisor · Leadership Development · Training Calendar · Learning Journey",
  "Upload · Version Control · Folder · Permission · Digital Signature · Approval Workflow",
  "SOP · Work Instruction · Guidelines · Templates · Version Control",
  "Agenda · Minutes · Attendance · Action Items · Task Creation",
  "Email · WhatsApp · In-App · Push · Deadline & Approval Reminders",
  "Corporate · Department · Individual KPI · SMART · Weight · Auto Score · Appraisal · STAR",
  "Program · Project · Milestone · Deliverables · Budget · Risk · Dependency",
  "Internal Service Request · Ticket · SLA · PIC · Approval",
  "Survey · Rating · Net Promoter Score · Service Quality",
  "Vision · Mission · Department Goals · Annual Programs · OKR · RKAP",
  "Task · Sub-task · Checklist · Approval — Kanban, List, Calendar & Gantt views",
] as const;

const SUBTITLES: Record<Exclude<Lang, "en">, string[]> = {
  id: ["Ringkasan Harian & Mingguan · Deteksi Risiko · Prediksi Keterlambatan · Wawasan Eksekutif", "Produktivitas · Kinerja Departemen · Kompetensi · Pelatihan · SLA · Dasbor Eksekutif", "Kamus · Matriks · Pemetaan · Asesmen · Analisis Kesenjangan · IDP · Kesiapan Karier", "Dasbor Eksekutif · Semua terhubung — Orang → Kompetensi → Eksekusi → Kinerja → Nilai", "Operator · Supervisor · Pengembangan Kepemimpinan · Kalender Pelatihan · Perjalanan Belajar", "Unggah · Kontrol Versi · Folder · Izin · Tanda Tangan Digital · Alur Persetujuan", "SOP · Instruksi Kerja · Panduan · Templat · Kontrol Versi", "Agenda · Notulen · Kehadiran · Item Tindakan · Pembuatan Tugas", "Email · WhatsApp · Dalam Aplikasi · Push · Pengingat Tenggat & Persetujuan", "Korporat · Departemen · KPI Individu · SMART · Bobot · Skor Otomatis · Penilaian · STAR", "Program · Proyek · Milestone · Deliverable · Anggaran · Risiko · Ketergantungan", "Permintaan Layanan Internal · Tiket · SLA · PIC · Persetujuan", "Survei · Rating · Net Promoter Score · Kualitas Layanan", "Visi · Misi · Sasaran Departemen · Program Tahunan · OKR · RKAP", "Tugas · Sub-tugas · Checklist · Persetujuan — tampilan Kanban, Daftar, Kalender & Gantt"],
  zh: ["每日与每周摘要 · 风险检测 · 延误预测 · 高管洞察", "生产力 · 部门绩效 · 能力 · 培训 · SLA · 高管仪表板", "词典 · 矩阵 · 映射 · 评估 · 差距分析 · IDP · 职业准备度", "高管仪表板 · 一切互联 — 人员 → 能力 → 执行 → 绩效 → 价值", "操作员 · 主管 · 领导力发展 · 培训日历 · 学习旅程", "上传 · 版本控制 · 文件夹 · 权限 · 数字签名 · 审批流程", "SOP · 工作指南 · 准则 · 模板 · 版本控制", "议程 · 会议纪要 · 出勤 · 行动项 · 任务创建", "电子邮件 · WhatsApp · 应用内 · Push · 截止与审批提醒", "公司 · 部门 · 个人 KPI · SMART · 权重 · 自动评分 · 考核 · STAR", "计划 · 项目 · 里程碑 · 交付物 · 预算 · 风险 · 依赖", "内部服务请求 · 工单 · SLA · PIC · 审批", "调查 · 评分 · 净推荐值 · 服务质量", "愿景 · 使命 · 部门目标 · 年度计划 · OKR · RKAP", "任务 · 子任务 · 清单 · 审批 — 看板、列表、日历和甘特图视图"],
  ru: ["Ежедневная и еженедельная сводка · Обнаружение рисков · Прогноз задержек · Аналитика для руководства", "Продуктивность · Эффективность отдела · Компетенции · Обучение · SLA · Панель руководителя", "Словарь · Матрица · Сопоставление · Оценка · Анализ пробелов · IDP · Готовность к карьере", "Панель руководителя · Всё связано — Люди → Компетенции → Исполнение → Эффективность → Ценность", "Оператор · Супервайзер · Развитие лидерства · Календарь обучения · Путь обучения", "Загрузка · Контроль версий · Папка · Разрешения · Цифровая подпись · Процесс согласования", "SOP · Рабочая инструкция · Руководства · Шаблоны · Контроль версий", "Повестка · Протокол · Посещаемость · Пункты действий · Создание задач", "Эл. почта · WhatsApp · В приложении · Push · Напоминания о сроках и согласованиях", "Корпоративный · Отдел · Индивидуальный KPI · SMART · Вес · Автооценка · Аттестация · STAR", "Программа · Проект · Веха · Результаты · Бюджет · Риск · Зависимость", "Внутренний запрос на обслуживание · Тикет · SLA · PIC · Согласование", "Опрос · Оценка · Net Promoter Score · Качество услуг", "Видение · Миссия · Цели отдела · Годовые программы · OKR · RKAP", "Задача · Подзадача · Чек-лист · Согласование — виды Kanban, Список, Календарь и Гант"],
  fr: ["Résumé quotidien et hebdomadaire · Détection des risques · Prévision des retards · Aperçu exécutif", "Productivité · Performance du département · Compétence · Formation · SLA · Tableau de bord exécutif", "Dictionnaire · Matrice · Cartographie · Évaluation · Analyse des écarts · IDP · Préparation de carrière", "Tableau de bord exécutif · Tout est connecté — Personnes → Compétence → Exécution → Performance → Valeur", "Opérateur · Superviseur · Développement du leadership · Calendrier de formation · Parcours d'apprentissage", "Téléverser · Contrôle de version · Dossier · Autorisation · Signature numérique · Flux d'approbation", "SOP · Instruction de travail · Directives · Modèles · Contrôle de version", "Ordre du jour · Compte rendu · Présence · Points d'action · Création de tâches", "E-mail · WhatsApp · Dans l'app · Push · Rappels d'échéance et d'approbation", "Entreprise · Département · KPI individuel · SMART · Pondération · Score automatique · Évaluation · STAR", "Programme · Projet · Jalon · Livrables · Budget · Risque · Dépendance", "Demande de service interne · Ticket · SLA · PIC · Approbation", "Enquête · Notation · Net Promoter Score · Qualité de service", "Vision · Mission · Objectifs du département · Programmes annuels · OKR · RKAP", "Tâche · Sous-tâche · Liste de contrôle · Approbation — vues Kanban, Liste, Calendrier & Gantt"],
  es: ["Resumen diario y semanal · Detección de riesgos · Predicción de retrasos · Perspectiva ejecutiva", "Productividad · Desempeño del departamento · Competencia · Capacitación · SLA · Panel ejecutivo", "Diccionario · Matriz · Mapeo · Evaluación · Análisis de brechas · IDP · Preparación profesional", "Panel ejecutivo · Todo conectado — Personas → Competencia → Ejecución → Desempeño → Valor", "Operador · Supervisor · Desarrollo de liderazgo · Calendario de capacitación · Ruta de aprendizaje", "Subir · Control de versiones · Carpeta · Permiso · Firma digital · Flujo de aprobación", "SOP · Instrucción de trabajo · Directrices · Plantillas · Control de versiones", "Agenda · Actas · Asistencia · Puntos de acción · Creación de tareas", "Correo · WhatsApp · En la app · Push · Recordatorios de vencimiento y aprobación", "Corporativo · Departamento · KPI individual · SMART · Peso · Puntuación automática · Evaluación · STAR", "Programa · Proyecto · Hito · Entregables · Presupuesto · Riesgo · Dependencia", "Solicitud de servicio interno · Ticket · SLA · PIC · Aprobación", "Encuesta · Calificación · Net Promoter Score · Calidad del servicio", "Visión · Misión · Metas del departamento · Programas anuales · OKR · RKAP", "Tarea · Subtarea · Lista de verificación · Aprobación — vistas Kanban, Lista, Calendario & Gantt"],
  ar: ["ملخص يومي وأسبوعي · كشف المخاطر · التنبؤ بالتأخير · رؤية تنفيذية", "الإنتاجية · أداء القسم · الكفاءة · التدريب · SLA · لوحة القيادة التنفيذية", "القاموس · المصفوفة · التخطيط · التقييم · تحليل الفجوات · IDP · الجاهزية المهنية", "لوحة القيادة التنفيذية · كل شيء متصل — الأفراد ← الكفاءة ← التنفيذ ← الأداء ← القيمة", "مشغّل · مشرف · تطوير القيادة · تقويم التدريب · رحلة التعلّم", "رفع · التحكم في الإصدارات · مجلد · إذن · توقيع رقمي · سير الموافقة", "SOP · تعليمات العمل · إرشادات · قوالب · التحكم في الإصدارات", "جدول الأعمال · المحضر · الحضور · بنود العمل · إنشاء المهام", "بريد إلكتروني · واتساب · داخل التطبيق · Push · تذكيرات المواعيد والموافقات", "مؤسسي · قسم · KPI فردي · SMART · الوزن · تقييم تلقائي · تقييم الأداء · STAR", "برنامج · مشروع · معلم · مخرجات · ميزانية · مخاطر · تبعية", "طلب خدمة داخلي · تذكرة · SLA · PIC · موافقة", "استبيان · تقييم · Net Promoter Score · جودة الخدمة", "الرؤية · الرسالة · أهداف القسم · البرامج السنوية · OKR · RKAP", "مهمة · مهمة فرعية · قائمة تحقق · موافقة — عروض Kanban وقائمة وتقويم وGantt"],
  bn: ["দৈনিক ও সাপ্তাহিক সারসংক্ষেপ · ঝুঁকি শনাক্তকরণ · বিলম্ব পূর্বাভাস · নির্বাহী অন্তর্দৃষ্টি", "উৎপাদনশীলতা · বিভাগীয় কর্মক্ষমতা · দক্ষতা · প্রশিক্ষণ · SLA · এক্সিকিউটিভ ড্যাশবোর্ড", "অভিধান · ম্যাট্রিক্স · ম্যাপিং · মূল্যায়ন · গ্যাপ বিশ্লেষণ · IDP · ক্যারিয়ার প্রস্তুতি", "এক্সিকিউটিভ ড্যাশবোর্ড · সবকিছু সংযুক্ত — মানুষ → দক্ষতা → বাস্তবায়ন → কর্মক্ষমতা → মূল্য", "অপারেটর · সুপারভাইজার · নেতৃত্ব উন্নয়ন · প্রশিক্ষণ ক্যালেন্ডার · শেখার যাত্রা", "আপলোড · সংস্করণ নিয়ন্ত্রণ · ফোল্ডার · অনুমতি · ডিজিটাল স্বাক্ষর · অনুমোদন প্রবাহ", "SOP · কাজের নির্দেশনা · নির্দেশিকা · টেমপ্লেট · সংস্করণ নিয়ন্ত্রণ", "আলোচ্যসূচি · কার্যবিবরণী · উপস্থিতি · অ্যাকশন আইটেম · টাস্ক তৈরি", "ইমেল · WhatsApp · ইন-অ্যাপ · Push · সময়সীমা ও অনুমোদন অনুস্মারক", "কর্পোরেট · বিভাগ · ব্যক্তিগত KPI · SMART · ওজন · স্বয়ংক্রিয় স্কোর · মূল্যায়ন · STAR", "প্রোগ্রাম · প্রকল্প · মাইলফলক · ডেলিভারেবল · বাজেট · ঝুঁকি · নির্ভরতা", "অভ্যন্তরীণ সেবা অনুরোধ · টিকিট · SLA · PIC · অনুমোদন", "জরিপ · রেটিং · Net Promoter Score · সেবার মান", "ভিশন · মিশন · বিভাগীয় লক্ষ্য · বার্ষিক প্রোগ্রাম · OKR · RKAP", "টাস্ক · সাব-টাস্ক · চেকলিস্ট · অনুমোদন — Kanban, তালিকা, ক্যালেন্ডার ও Gantt ভিউ"],
  hi: ["दैनिक और साप्ताहिक सारांश · जोखिम पहचान · विलंब पूर्वानुमान · कार्यकारी अंतर्दृष्टि", "उत्पादकता · विभागीय प्रदर्शन · योग्यता · प्रशिक्षण · SLA · कार्यकारी डैशबोर्ड", "शब्दकोश · मैट्रिक्स · मैपिंग · मूल्यांकन · गैप विश्लेषण · IDP · करियर तैयारी", "कार्यकारी डैशबोर्ड · सब कुछ जुड़ा हुआ — लोग → योग्यता → निष्पादन → प्रदर्शन → मूल्य", "ऑपरेटर · पर्यवेक्षक · नेतृत्व विकास · प्रशिक्षण कैलेंडर · सीखने की यात्रा", "अपलोड · संस्करण नियंत्रण · फ़ोल्डर · अनुमति · डिजिटल हस्ताक्षर · अनुमोदन प्रवाह", "SOP · कार्य निर्देश · दिशानिर्देश · टेम्पलेट · संस्करण नियंत्रण", "एजेंडा · कार्यवृत्त · उपस्थिति · कार्य बिंदु · कार्य निर्माण", "ईमेल · WhatsApp · इन-ऐप · Push · समयसीमा और अनुमोदन अनुस्मारक", "कॉर्पोरेट · विभाग · व्यक्तिगत KPI · SMART · भार · स्वतः स्कोर · मूल्यांकन · STAR", "कार्यक्रम · परियोजना · मील का पत्थर · डिलिवरेबल्स · बजट · जोखिम · निर्भरता", "आंतरिक सेवा अनुरोध · टिकट · SLA · PIC · अनुमोदन", "सर्वेक्षण · रेटिंग · Net Promoter Score · सेवा गुणवत्ता", "विज़न · मिशन · विभागीय लक्ष्य · वार्षिक कार्यक्रम · OKR · RKAP", "कार्य · उप-कार्य · चेकलिस्ट · अनुमोदन — Kanban, सूची, कैलेंडर और Gantt दृश्य"],
  ur: ["روزانہ اور ہفتہ وار خلاصہ · خطرے کی شناخت · تاخیر کی پیشگوئی · ایگزیکٹو بصیرت", "پیداواری صلاحیت · شعبہ جاتی کارکردگی · مہارت · تربیت · SLA · ایگزیکٹو ڈیش بورڈ", "لغت · میٹرکس · میپنگ · تشخیص · گیپ تجزیہ · IDP · کیریئر کی تیاری", "ایگزیکٹو ڈیش بورڈ · سب کچھ منسلک — لوگ ← مہارت ← عملدرآمد ← کارکردگی ← قدر", "آپریٹر · سپروائزر · قیادت کی ترقی · تربیتی کیلنڈر · سیکھنے کا سفر", "اپ لوڈ · ورژن کنٹرول · فولڈر · اجازت · ڈیجیٹل دستخط · منظوری کا عمل", "SOP · کام کی ہدایات · رہنما اصول · ٹیمپلیٹس · ورژن کنٹرول", "ایجنڈا · کارروائی · حاضری · ایکشن آئٹمز · ٹاسک تخلیق", "ای میل · WhatsApp · ان-ایپ · Push · ڈیڈ لائن اور منظوری یاد دہانیاں", "کارپوریٹ · شعبہ · انفرادی KPI · SMART · وزن · خودکار اسکور · تشخیص · STAR", "پروگرام · پروجیکٹ · سنگ میل · ڈیلیوریبلز · بجٹ · خطرہ · انحصار", "اندرونی سروس درخواست · ٹکٹ · SLA · PIC · منظوری", "سروے · درجہ بندی · Net Promoter Score · سروس کا معیار", "ویژن · مشن · شعبہ جاتی اہداف · سالانہ پروگرام · OKR · RKAP", "ٹاسک · ذیلی ٹاسک · چیک لسٹ · منظوری — Kanban، فہرست، کیلنڈر اور Gantt ویوز"],
  ko: ["일간 및 주간 요약 · 위험 감지 · 지연 예측 · 경영진 인사이트", "생산성 · 부서 성과 · 역량 · 교육 · SLA · 경영진 대시보드", "사전 · 매트릭스 · 매핑 · 평가 · 격차 분석 · IDP · 경력 준비도", "경영진 대시보드 · 모두 연결 — 인력 → 역량 → 실행 → 성과 → 가치", "운영자 · 감독자 · 리더십 개발 · 교육 일정 · 학습 여정", "업로드 · 버전 관리 · 폴더 · 권한 · 전자 서명 · 승인 워크플로", "SOP · 작업 지침 · 가이드라인 · 템플릿 · 버전 관리", "안건 · 회의록 · 출석 · 실행 항목 · 작업 생성", "이메일 · WhatsApp · 인앱 · Push · 마감 및 승인 알림", "전사 · 부서 · 개인 KPI · SMART · 가중치 · 자동 점수 · 평가 · STAR", "프로그램 · 프로젝트 · 마일스톤 · 산출물 · 예산 · 리스크 · 종속성", "내부 서비스 요청 · 티켓 · SLA · PIC · 승인", "설문 · 평점 · Net Promoter Score · 서비스 품질", "비전 · 미션 · 부서 목표 · 연간 프로그램 · OKR · RKAP", "작업 · 하위 작업 · 체크리스트 · 승인 — 칸반, 목록, 캘린더 및 간트 보기"],
  ja: ["日次・週次サマリー · リスク検知 · 遅延予測 · エグゼクティブインサイト", "生産性 · 部門パフォーマンス · コンピテンシー · 研修 · SLA · エグゼクティブダッシュボード", "辞書 · マトリクス · マッピング · アセスメント · ギャップ分析 · IDP · キャリア準備度", "エグゼクティブダッシュボード · すべてがつながる — 人材 → コンピテンシー → 実行 → パフォーマンス → 価値", "オペレーター · スーパーバイザー · リーダーシップ育成 · 研修カレンダー · 学習ジャーニー", "アップロード · バージョン管理 · フォルダ · 権限 · 電子署名 · 承認ワークフロー", "SOP · 作業手順書 · ガイドライン · テンプレート · バージョン管理", "アジェンダ · 議事録 · 出席 · アクションアイテム · タスク作成", "メール · WhatsApp · アプリ内 · Push · 期限・承認リマインダー", "全社 · 部門 · 個人KPI · SMART · ウェイト · 自動スコア · 評価 · STAR", "プログラム · プロジェクト · マイルストーン · 成果物 · 予算 · リスク · 依存関係", "社内サービスリクエスト · チケット · SLA · PIC · 承認", "アンケート · 評価 · Net Promoter Score · サービス品質", "ビジョン · ミッション · 部門目標 · 年間プログラム · OKR · RKAP", "タスク · サブタスク · チェックリスト · 承認 — カンバン、リスト、カレンダー、ガントビュー"],
  pt: ["Resumo diário e semanal · Detecção de riscos · Previsão de atrasos · Visão executiva", "Produtividade · Desempenho do departamento · Competência · Treinamento · SLA · Painel executivo", "Dicionário · Matriz · Mapeamento · Avaliação · Análise de lacunas · IDP · Prontidão de carreira", "Painel executivo · Tudo conectado — Pessoas → Competência → Execução → Desempenho → Valor", "Operador · Supervisor · Desenvolvimento de liderança · Calendário de treinamento · Jornada de aprendizagem", "Upload · Controle de versão · Pasta · Permissão · Assinatura digital · Fluxo de aprovação", "SOP · Instrução de trabalho · Diretrizes · Modelos · Controle de versão", "Pauta · Ata · Presença · Itens de ação · Criação de tarefas", "E-mail · WhatsApp · No app · Push · Lembretes de prazo e aprovação", "Corporativo · Departamento · KPI individual · SMART · Peso · Pontuação automática · Avaliação · STAR", "Programa · Projeto · Marco · Entregáveis · Orçamento · Risco · Dependência", "Solicitação de serviço interno · Ticket · SLA · PIC · Aprovação", "Pesquisa · Avaliação · Net Promoter Score · Qualidade do serviço", "Visão · Missão · Metas do departamento · Programas anuais · OKR · RKAP", "Tarefa · Subtarefa · Checklist · Aprovação — visualizações Kanban, Lista, Calendário & Gantt"],
};

const dictionaries: Record<Lang, Record<string, string>> = { en: {} } as Record<Lang, Record<string, string>>;
for (const [code, values] of Object.entries(TRANSLATIONS)) {
  const map: Record<string, string> = {};
  KEYS.forEach((key, i) => (map[key] = values[i]));
  Object.assign(map, PAGE_TITLES[code as Exclude<Lang, "en">]);
  SUBTITLE_KEYS.forEach((key, i) => (map[key] = SUBTITLES[code as Exclude<Lang, "en">][i]));
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
