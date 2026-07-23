import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const languages = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', short: 'DE', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'zh', label: '中文', short: '中文', flag: '🇨🇳' },
]

const ru = {
  nav: { crosshairs: 'Прицелы', install: 'Как установить', admin: 'Администратор' },
  language: { label: 'Язык сайта' },
  common: { copy: 'Копировать', copied: 'Готово', copyCode: 'Копировать код', copiedCode: 'Скопировано', close: 'Закрыть' },
  hero: {
    kicker: 'БАЗА ПРИЦЕЛОВ FRAGPUNK', title: 'ТОЧКА', accent: 'РЕШАЕТ.',
    line1: 'Коллекция лучших прицелов для FragPunk.', line2: 'Выбирай, копируй код и забирай раунд.',
    cta: 'Найти свой прицел', crosshairs: 'ПРИЦЕЛОВ', copies: 'КОПИРОВАНИЙ', free: 'БЕСПЛАТНО',
  },
  gallery: {
    index: '01 / БАЗА', title: 'ГАЛЕРЕЯ ПРИЦЕЛОВ', subtitle: 'Проверенные настройки. Никакого мусора.',
    results: 'РЕЗУЛЬТАТОВ', search: 'Поиск по названию или тегу...', popular: 'Популярные', new: 'Новые',
    all: 'Все прицелы', emptyTitle: 'Ничего не найдено', emptyText: 'Попробуйте другой тег или поисковый запрос.',
    reset: 'Сбросить фильтры', retry: 'Попробовать снова', game: 'FRAGPUNK',
  },
  detail: {
    preview: 'ПРЕДПРОСМОТР / В ИГРЕ', eyebrow: 'КОД ПРИЦЕЛА', fallback: 'Пользовательский прицел для FragPunk.',
    step: 'Скопируйте код', instruction: 'Откройте настройки FragPunk и импортируйте код в разделе прицела.',
  },
  guide: {
    index: '02 / БЫСТРЫЙ СТАРТ', title1: 'ОТ КОДА ДО', title2: 'ХЕДШОТА.', subtitle: 'Три шага — и новый прицел уже в игре.',
    copyTitle: 'Скопируй код', copyText: 'Выбери прицел в галерее и нажми кнопку копирования.',
    settingsTitle: 'Открой настройки', settingsText: 'Перейди в раздел настройки прицела в FragPunk.',
    importTitle: 'Импортируй', importText: 'Вставь код и сохрани новый профиль прицела.',
  },
  admin: {
    private: 'ЗАКРЫТЫЙ ДОСТУП', loginTitle: 'Вход администратора',
    loginText: 'Только владелец сайта может добавлять и удалять прицелы.', password: 'Пароль',
    passwordPlaceholder: 'Введите пароль', checking: 'Проверяем...', login: 'Войти',
    sessionNote: 'Сессия защищена HttpOnly cookie и действует 12 часов.',
    control: 'ПАНЕЛЬ УПРАВЛЕНИЯ', title: 'Управление прицелами', logout: 'Выйти',
    addTab: 'Добавить прицел', allTab: 'Все прицелы',
    name: 'Название', namePlaceholder: 'Например, Neon Dot', tags: 'Теги', tagsPlaceholder: 'точка, зелёный, pro',
    code: 'Код прицела', codePlaceholder: 'Вставьте полный код прицела из FragPunk',
    description: 'Короткое описание', descriptionPlaceholder: 'Чем хорош этот прицел?',
    uploadTitle: 'Загрузите скриншот', uploadHint: 'JPG, PNG или WEBP · до 8 МБ', replace: 'Нажмите, чтобы заменить',
    uploading: 'Загружаем...', publish: 'Опубликовать прицел', deleteConfirm: 'Удалить «{{title}}»?', delete: 'Удалить {{title}}',
  },
  toast: { copied: 'Код прицела скопирован', published: 'Прицел опубликован' },
  footer: { disclaimer: 'Независимый фанатский проект. Не связан с Bad Guitar Studio или NetEase Games.' },
  seed: {
    'neon-precision': 'Тонкий статичный крест для точных одиночных выстрелов.',
    'minimal-dot': 'Чистая точка без лишних линий — максимум обзора.',
    'cyan-gap': 'Контрастный голубой крест с открытым центром.',
    'tiny-red': 'Микро-прицел для любителей агрессивной игры.',
    'classic-green': 'Универсальная классика для любого оружия.',
    'pink-pop': 'Яркий розовый прицел, заметный на любой карте.',
  },
  errors: {
    unauthorized: 'Требуется вход администратора', rateLimited: 'Слишком много попыток. Попробуйте позже.',
    wrongPassword: 'Неверный пароль', required: 'Укажите название, код и скриншот',
    tooLong: 'Одно из полей слишком длинное', notFound: 'Прицел не найден',
    invalidImage: 'Поддерживаются JPG, PNG и WEBP', imageDimensions: 'Разрешение изображения слишком большое',
    fileTooLarge: 'Файл слишком большой. Максимум — 8 МБ', invalidForm: 'Проверьте заполненные поля',
    untrustedOrigin: 'Недоверенный источник запроса', missingAdminHeader: 'Недействительный запрос администратора',
    network: 'Нет соединения с сервером', generic: 'Не удалось обработать запрос',
  },
  tags: {
    'точка': 'точка', 'точный': 'точный', 'зелёный': 'зелёный', 'минимализм': 'минимализм', 'белый': 'белый',
    'крест': 'крест', 'с зазором': 'с зазором', 'голубой': 'голубой', 'маленький': 'маленький',
    'красный': 'красный', 'классика': 'классика', 'яркий': 'яркий', 'розовый': 'розовый',
  },
}

const en = {
  nav: { crosshairs: 'Crosshairs', install: 'How to install', admin: 'Administrator' },
  language: { label: 'Site language' },
  common: { copy: 'Copy', copied: 'Done', copyCode: 'Copy code', copiedCode: 'Copied', close: 'Close' },
  hero: {
    kicker: 'FRAGPUNK CROSSHAIR DATABASE', title: 'ONE DOT', accent: 'DECIDES.',
    line1: 'A collection of the best FragPunk crosshairs.', line2: 'Choose, copy the code, and take the round.',
    cta: 'Find your crosshair', crosshairs: 'CROSSHAIRS', copies: 'COPIES', free: 'FREE',
  },
  gallery: {
    index: '01 / DATABASE', title: 'CROSSHAIR GALLERY', subtitle: 'Tested settings. No clutter.',
    results: 'RESULTS', search: 'Search by name or tag...', popular: 'Popular', new: 'New',
    all: 'All crosshairs', emptyTitle: 'Nothing found', emptyText: 'Try another tag or search query.',
    reset: 'Reset filters', retry: 'Try again', game: 'FRAGPUNK',
  },
  detail: {
    preview: 'PREVIEW / IN-GAME', eyebrow: 'CROSSHAIR CODE', fallback: 'A custom FragPunk crosshair.',
    step: 'Copy the code', instruction: 'Open FragPunk settings and import the code in the crosshair section.',
  },
  guide: {
    index: '02 / QUICK START', title1: 'FROM CODE TO', title2: 'HEADSHOT.', subtitle: 'Three steps and your new crosshair is in the game.',
    copyTitle: 'Copy the code', copyText: 'Choose a crosshair in the gallery and hit the copy button.',
    settingsTitle: 'Open settings', settingsText: 'Go to the crosshair settings in FragPunk.',
    importTitle: 'Import it', importText: 'Paste the code and save your new crosshair profile.',
  },
  admin: {
    private: 'PRIVATE ACCESS', loginTitle: 'Administrator login',
    loginText: 'Only the site owner can add or remove crosshairs.', password: 'Password',
    passwordPlaceholder: 'Enter password', checking: 'Checking...', login: 'Sign in',
    sessionNote: 'The session uses a secure HttpOnly cookie and lasts 12 hours.',
    control: 'CONTROL ROOM', title: 'Manage crosshairs', logout: 'Sign out',
    addTab: 'Add crosshair', allTab: 'All crosshairs',
    name: 'Name', namePlaceholder: 'For example, Neon Dot', tags: 'Tags', tagsPlaceholder: 'dot, green, pro',
    code: 'Crosshair code', codePlaceholder: 'Paste the full FragPunk crosshair code',
    description: 'Short description', descriptionPlaceholder: 'What makes this crosshair good?',
    uploadTitle: 'Upload a screenshot', uploadHint: 'JPG, PNG or WEBP · up to 8 MB', replace: 'Click to replace',
    uploading: 'Uploading...', publish: 'Publish crosshair', deleteConfirm: 'Delete “{{title}}”?', delete: 'Delete {{title}}',
  },
  toast: { copied: 'Crosshair code copied', published: 'Crosshair published' },
  footer: { disclaimer: 'An independent fan project. Not affiliated with Bad Guitar Studio or NetEase Games.' },
  seed: {
    'neon-precision': 'A thin static cross for precise single shots.',
    'minimal-dot': 'A clean dot with no extra lines for maximum visibility.',
    'cyan-gap': 'A high-contrast cyan cross with an open center.',
    'tiny-red': 'A micro crosshair for aggressive players.',
    'classic-green': 'A versatile classic for every weapon.',
    'pink-pop': 'A bright pink crosshair that stands out on every map.',
  },
  errors: {
    unauthorized: 'Administrator login required', rateLimited: 'Too many attempts. Try again later.',
    wrongPassword: 'Incorrect password', required: 'Provide a name, code, and screenshot',
    tooLong: 'One of the fields is too long', notFound: 'Crosshair not found',
    invalidImage: 'JPG, PNG, and WEBP are supported', imageDimensions: 'The image dimensions are too large',
    fileTooLarge: 'The file is too large. Maximum size is 8 MB', invalidForm: 'Check the form fields',
    untrustedOrigin: 'Untrusted request origin', missingAdminHeader: 'Invalid administrator request',
    network: 'Could not connect to the server', generic: 'Could not process the request',
  },
  tags: {
    'точка': 'dot', 'точный': 'precision', 'зелёный': 'green', 'минимализм': 'minimal', 'белый': 'white',
    'крест': 'cross', 'с зазором': 'gap', 'голубой': 'cyan', 'маленький': 'small',
    'красный': 'red', 'классика': 'classic', 'яркий': 'bright', 'розовый': 'pink',
  },
}

const de = {
  nav: { crosshairs: 'Fadenkreuze', install: 'Installation', admin: 'Administrator' },
  language: { label: 'Seitensprache' },
  common: { copy: 'Kopieren', copied: 'Fertig', copyCode: 'Code kopieren', copiedCode: 'Kopiert', close: 'Schließen' },
  hero: {
    kicker: 'FRAGPUNK-FADENKREUZ-DATENBANK', title: 'EIN PUNKT', accent: 'ENTSCHEIDET.',
    line1: 'Eine Sammlung der besten FragPunk-Fadenkreuze.', line2: 'Auswählen, Code kopieren und die Runde holen.',
    cta: 'Fadenkreuz finden', crosshairs: 'FADENKREUZE', copies: 'KOPIEN', free: 'KOSTENLOS',
  },
  gallery: {
    index: '01 / DATENBANK', title: 'FADENKREUZ-GALERIE', subtitle: 'Geprüfte Einstellungen. Kein Ballast.',
    results: 'ERGEBNISSE', search: 'Nach Name oder Tag suchen...', popular: 'Beliebt', new: 'Neu',
    all: 'Alle Fadenkreuze', emptyTitle: 'Nichts gefunden', emptyText: 'Versuche einen anderen Tag oder Suchbegriff.',
    reset: 'Filter zurücksetzen', retry: 'Erneut versuchen', game: 'FRAGPUNK',
  },
  detail: {
    preview: 'VORSCHAU / IM SPIEL', eyebrow: 'FADENKREUZ-CODE', fallback: 'Ein benutzerdefiniertes FragPunk-Fadenkreuz.',
    step: 'Code kopieren', instruction: 'Öffne die FragPunk-Einstellungen und importiere den Code im Fadenkreuz-Bereich.',
  },
  guide: {
    index: '02 / SCHNELLSTART', title1: 'VOM CODE ZUM', title2: 'HEADSHOT.', subtitle: 'Drei Schritte und dein neues Fadenkreuz ist im Spiel.',
    copyTitle: 'Code kopieren', copyText: 'Wähle ein Fadenkreuz in der Galerie und klicke auf Kopieren.',
    settingsTitle: 'Einstellungen öffnen', settingsText: 'Öffne die Fadenkreuz-Einstellungen in FragPunk.',
    importTitle: 'Importieren', importText: 'Füge den Code ein und speichere dein neues Profil.',
  },
  admin: {
    private: 'PRIVATER ZUGANG', loginTitle: 'Administrator-Anmeldung',
    loginText: 'Nur der Website-Betreiber kann Fadenkreuze hinzufügen oder entfernen.', password: 'Passwort',
    passwordPlaceholder: 'Passwort eingeben', checking: 'Wird geprüft...', login: 'Anmelden',
    sessionNote: 'Die Sitzung nutzt ein sicheres HttpOnly-Cookie und gilt 12 Stunden.',
    control: 'KONTROLLRAUM', title: 'Fadenkreuze verwalten', logout: 'Abmelden',
    addTab: 'Fadenkreuz hinzufügen', allTab: 'Alle Fadenkreuze',
    name: 'Name', namePlaceholder: 'Zum Beispiel Neon Dot', tags: 'Tags', tagsPlaceholder: 'Punkt, grün, pro',
    code: 'Fadenkreuz-Code', codePlaceholder: 'Vollständigen FragPunk-Code einfügen',
    description: 'Kurzbeschreibung', descriptionPlaceholder: 'Was macht dieses Fadenkreuz besonders?',
    uploadTitle: 'Screenshot hochladen', uploadHint: 'JPG, PNG oder WEBP · bis 8 MB', replace: 'Zum Ersetzen klicken',
    uploading: 'Wird hochgeladen...', publish: 'Fadenkreuz veröffentlichen', deleteConfirm: '„{{title}}“ löschen?', delete: '{{title}} löschen',
  },
  toast: { copied: 'Fadenkreuz-Code kopiert', published: 'Fadenkreuz veröffentlicht' },
  footer: { disclaimer: 'Ein unabhängiges Fanprojekt. Nicht mit Bad Guitar Studio oder NetEase Games verbunden.' },
  seed: {
    'neon-precision': 'Ein dünnes statisches Kreuz für präzise Einzelschüsse.',
    'minimal-dot': 'Ein klarer Punkt ohne zusätzliche Linien für maximale Sicht.',
    'cyan-gap': 'Ein kontrastreiches cyanfarbenes Kreuz mit offener Mitte.',
    'tiny-red': 'Ein Mikro-Fadenkreuz für aggressive Spieler.',
    'classic-green': 'Ein vielseitiger Klassiker für jede Waffe.',
    'pink-pop': 'Ein leuchtend rosa Fadenkreuz, das auf jeder Karte auffällt.',
  },
  errors: {
    unauthorized: 'Administrator-Anmeldung erforderlich', rateLimited: 'Zu viele Versuche. Bitte später erneut versuchen.',
    wrongPassword: 'Falsches Passwort', required: 'Name, Code und Screenshot sind erforderlich',
    tooLong: 'Eines der Felder ist zu lang', notFound: 'Fadenkreuz nicht gefunden',
    invalidImage: 'JPG, PNG und WEBP werden unterstützt', imageDimensions: 'Die Bildauflösung ist zu groß',
    fileTooLarge: 'Die Datei ist zu groß. Maximal 8 MB', invalidForm: 'Bitte die Formularfelder prüfen',
    untrustedOrigin: 'Nicht vertrauenswürdige Anfragequelle', missingAdminHeader: 'Ungültige Administratoranfrage',
    network: 'Keine Verbindung zum Server', generic: 'Anfrage konnte nicht verarbeitet werden',
  },
  tags: {
    'точка': 'Punkt', 'точный': 'präzise', 'зелёный': 'grün', 'минимализм': 'minimal', 'белый': 'weiß',
    'крест': 'Kreuz', 'с зазором': 'mit Lücke', 'голубой': 'cyan', 'маленький': 'klein',
    'красный': 'rot', 'классика': 'klassisch', 'яркий': 'leuchtend', 'розовый': 'rosa',
  },
}

const fr = {
  nav: { crosshairs: 'Réticules', install: 'Installation', admin: 'Administrateur' },
  language: { label: 'Langue du site' },
  common: { copy: 'Copier', copied: 'Terminé', copyCode: 'Copier le code', copiedCode: 'Copié', close: 'Fermer' },
  hero: {
    kicker: 'BASE DE RÉTICULES FRAGPUNK', title: 'UN POINT', accent: 'DÉCIDE.',
    line1: 'Une collection des meilleurs réticules FragPunk.', line2: 'Choisis, copie le code et remporte la manche.',
    cta: 'Trouver mon réticule', crosshairs: 'RÉTICULES', copies: 'COPIES', free: 'GRATUIT',
  },
  gallery: {
    index: '01 / BASE', title: 'GALERIE DE RÉTICULES', subtitle: 'Réglages testés. Aucun superflu.',
    results: 'RÉSULTATS', search: 'Rechercher par nom ou tag...', popular: 'Populaires', new: 'Nouveaux',
    all: 'Tous les réticules', emptyTitle: 'Aucun résultat', emptyText: 'Essaie un autre tag ou une autre recherche.',
    reset: 'Réinitialiser', retry: 'Réessayer', game: 'FRAGPUNK',
  },
  detail: {
    preview: 'APERÇU / EN JEU', eyebrow: 'CODE DU RÉTICULE', fallback: 'Un réticule FragPunk personnalisé.',
    step: 'Copie le code', instruction: 'Ouvre les paramètres de FragPunk et importe le code dans la section du réticule.',
  },
  guide: {
    index: '02 / DÉMARRAGE RAPIDE', title1: 'DU CODE AU', title2: 'HEADSHOT.', subtitle: 'Trois étapes et ton nouveau réticule est en jeu.',
    copyTitle: 'Copie le code', copyText: 'Choisis un réticule dans la galerie et clique sur Copier.',
    settingsTitle: 'Ouvre les paramètres', settingsText: 'Va dans les paramètres du réticule de FragPunk.',
    importTitle: 'Importe-le', importText: 'Colle le code et enregistre ton nouveau profil.',
  },
  admin: {
    private: 'ACCÈS PRIVÉ', loginTitle: 'Connexion administrateur',
    loginText: 'Seul le propriétaire du site peut ajouter ou supprimer des réticules.', password: 'Mot de passe',
    passwordPlaceholder: 'Saisir le mot de passe', checking: 'Vérification...', login: 'Se connecter',
    sessionNote: 'La session utilise un cookie HttpOnly sécurisé et dure 12 heures.',
    control: 'SALLE DE CONTRÔLE', title: 'Gérer les réticules', logout: 'Déconnexion',
    addTab: 'Ajouter un réticule', allTab: 'Tous les réticules',
    name: 'Nom', namePlaceholder: 'Par exemple, Neon Dot', tags: 'Tags', tagsPlaceholder: 'point, vert, pro',
    code: 'Code du réticule', codePlaceholder: 'Colle le code FragPunk complet',
    description: 'Description courte', descriptionPlaceholder: 'Pourquoi ce réticule est-il efficace ?',
    uploadTitle: 'Importer une capture', uploadHint: 'JPG, PNG ou WEBP · 8 Mo max.', replace: 'Cliquer pour remplacer',
    uploading: 'Importation...', publish: 'Publier le réticule', deleteConfirm: 'Supprimer « {{title}} » ?', delete: 'Supprimer {{title}}',
  },
  toast: { copied: 'Code du réticule copié', published: 'Réticule publié' },
  footer: { disclaimer: 'Projet de fans indépendant. Sans affiliation avec Bad Guitar Studio ou NetEase Games.' },
  seed: {
    'neon-precision': 'Une fine croix statique pour des tirs uniques précis.',
    'minimal-dot': 'Un point net sans lignes superflues pour une visibilité maximale.',
    'cyan-gap': 'Une croix cyan contrastée avec un centre ouvert.',
    'tiny-red': 'Un micro-réticule pour les joueurs agressifs.',
    'classic-green': 'Un classique polyvalent pour toutes les armes.',
    'pink-pop': 'Un réticule rose vif visible sur toutes les cartes.',
  },
  errors: {
    unauthorized: 'Connexion administrateur requise', rateLimited: 'Trop de tentatives. Réessaie plus tard.',
    wrongPassword: 'Mot de passe incorrect', required: 'Indique un nom, un code et une capture',
    tooLong: 'Un des champs est trop long', notFound: 'Réticule introuvable',
    invalidImage: 'Formats JPG, PNG et WEBP acceptés', imageDimensions: 'La résolution de l’image est trop grande',
    fileTooLarge: 'Le fichier est trop volumineux. Maximum 8 Mo', invalidForm: 'Vérifiez les champs du formulaire',
    untrustedOrigin: 'Origine de requête non fiable', missingAdminHeader: 'Requête administrateur non valide',
    network: 'Impossible de joindre le serveur', generic: 'Impossible de traiter la demande',
  },
  tags: {
    'точка': 'point', 'точный': 'précis', 'зелёный': 'vert', 'минимализм': 'minimaliste', 'белый': 'blanc',
    'крест': 'croix', 'с зазором': 'avec espace', 'голубой': 'cyan', 'маленький': 'petit',
    'красный': 'rouge', 'классика': 'classique', 'яркий': 'vif', 'розовый': 'rose',
  },
}

const zh = {
  nav: { crosshairs: '准星', install: '安装方法', admin: '管理员' },
  language: { label: '网站语言' },
  common: { copy: '复制', copied: '完成', copyCode: '复制代码', copiedCode: '已复制', close: '关闭' },
  hero: {
    kicker: '界外狂潮准星数据库', title: '一点', accent: '定胜负。',
    line1: '精选界外狂潮优质准星。', line2: '选择、复制代码，赢下这一局。',
    cta: '寻找我的准星', crosshairs: '准星', copies: '复制次数', free: '完全免费',
  },
  gallery: {
    index: '01 / 数据库', title: '准星画廊', subtitle: '经过验证的设置，绝无冗余。',
    results: '个结果', search: '按名称或标签搜索...', popular: '热门', new: '最新',
    all: '全部准星', emptyTitle: '没有找到结果', emptyText: '请尝试其他标签或搜索词。',
    reset: '重置筛选', retry: '重试', game: '界外狂潮',
  },
  detail: {
    preview: '预览 / 游戏内', eyebrow: '准星代码', fallback: '自定义界外狂潮准星。',
    step: '复制代码', instruction: '打开界外狂潮设置，在准星页面导入代码。',
  },
  guide: {
    index: '02 / 快速开始', title1: '从代码到', title2: '爆头。', subtitle: '只需三步，新准星即可投入游戏。',
    copyTitle: '复制代码', copyText: '在画廊中选择准星并点击复制按钮。',
    settingsTitle: '打开设置', settingsText: '进入界外狂潮的准星设置页面。',
    importTitle: '导入代码', importText: '粘贴代码并保存新的准星方案。',
  },
  admin: {
    private: '私密访问', loginTitle: '管理员登录',
    loginText: '只有网站所有者可以添加或删除准星。', password: '密码',
    passwordPlaceholder: '输入密码', checking: '正在验证...', login: '登录',
    sessionNote: '会话使用安全的 HttpOnly Cookie，有效期为 12 小时。',
    control: '控制中心', title: '管理准星', logout: '退出',
    addTab: '添加准星', allTab: '全部准星',
    name: '名称', namePlaceholder: '例如 Neon Dot', tags: '标签', tagsPlaceholder: '点，绿色，职业',
    code: '准星代码', codePlaceholder: '粘贴完整的界外狂潮准星代码',
    description: '简短说明', descriptionPlaceholder: '这个准星有什么优势？',
    uploadTitle: '上传截图', uploadHint: 'JPG、PNG 或 WEBP · 最大 8 MB', replace: '点击替换',
    uploading: '正在上传...', publish: '发布准星', deleteConfirm: '删除“{{title}}”？', delete: '删除 {{title}}',
  },
  toast: { copied: '准星代码已复制', published: '准星已发布' },
  footer: { disclaimer: '独立粉丝项目，与 Bad Guitar Studio 或网易游戏无关。' },
  seed: {
    'neon-precision': '细窄的静态十字，适合精准点射。',
    'minimal-dot': '无多余线条的纯净圆点，提供最大视野。',
    'cyan-gap': '高对比度青色十字，中心留空。',
    'tiny-red': '适合激进打法的微型准星。',
    'classic-green': '适用于各种武器的经典通用准星。',
    'pink-pop': '在任何地图上都清晰醒目的亮粉色准星。',
  },
  errors: {
    unauthorized: '需要管理员登录', rateLimited: '尝试次数过多，请稍后再试。',
    wrongPassword: '密码错误', required: '请提供名称、代码和截图',
    tooLong: '某个字段内容过长', notFound: '未找到准星',
    invalidImage: '支持 JPG、PNG 和 WEBP', imageDimensions: '图片分辨率过大',
    fileTooLarge: '文件过大，最大为 8 MB', invalidForm: '请检查表单字段',
    untrustedOrigin: '请求来源不受信任', missingAdminHeader: '管理员请求无效',
    network: '无法连接服务器', generic: '无法处理请求',
  },
  tags: {
    'точка': '点', 'точный': '精准', 'зелёный': '绿色', 'минимализм': '极简', 'белый': '白色',
    'крест': '十字', 'с зазором': '中空', 'голубой': '青色', 'маленький': '小型',
    'красный': '红色', 'классика': '经典', 'яркий': '鲜艳', 'розовый': '粉色',
  },
}

const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language.split('-')[0]
const savedLanguage = typeof localStorage === 'undefined' ? null : localStorage.getItem('fragpunk-crosshairs-language')
const initialLanguage = languages.some(({ code }) => code === savedLanguage)
  ? savedLanguage
  : languages.some(({ code }) => code === browserLanguage) ? browserLanguage : 'en'

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, en: { translation: en }, de: { translation: de }, fr: { translation: fr }, zh: { translation: zh } },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (language) => {
  localStorage.setItem('fragpunk-crosshairs-language', language)
  document.documentElement.lang = language
})
document.documentElement.lang = initialLanguage

export default i18n
