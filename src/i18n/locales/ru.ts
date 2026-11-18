import { TranslationDictionary } from "../types";
import { PRICING_SOL, formatSolAmount, getTokenCreationFeeRangeSol } from "@/config/pricing";

const FEE_RANGE = getTokenCreationFeeRangeSol();

const dictionary: TranslationDictionary = {
  nav: {
    createToken: "Создать Токен",
    liquidityPool: "Пул Ликвидности",
    burn: "Сжигание / возврат SOL",
    airdrop: "Массовый Airdrop",
    manage: "Права (Authorities)",
    affiliates: "Партнёрам (30%)",
    docs: "Документация",
  },
  wallet: {
    connect: "Подключить Кошелёк",
    connecting: "Подключение...",
    copyAddress: "Скопировать Адрес",
    copied: "✓ Скопировано!",
    changeWallet: "Сменить Кошелёк",
    viewExplorer: "Открыть в Solscan ↗",
    disconnect: "Отключить Кошелёк",
    balanceLabel: "Баланс в Сети",
  },
  network: {
    mainnetShort: "Mainnet (Реальная)",
    devnetShort: "Devnet (Тест)",
    mainnetBannerTitle: "АКТИВНА ОСНОВНАЯ СЕТЬ: SOLANA MAINNET-BETA",
    mainnetBannerDesc:
      "Вы работаете в продакшн-сети. Все токены, пулы ликвидности и комиссии используют реальные SOL.",
    devnetBannerTitle: "АКТИВЕН ТЕСТОВЫЙ РЕЖИМ: SOLANA DEVNET (SANDBOX)",
    devnetBannerDesc:
      "Бесплатная среда симуляции! Токены в Devnet предназначены для тестирования и не имеют рыночной стоимости.",
    switchToDevnet: "Тестировать в Devnet →",
    switchToMainnet: "Перейти в Mainnet →",
    faucetBtn: "🚰 +1 Бесплатный SOL (Faucet)",
    faucetLoading: "Отправка +1 SOL...",
    faucetSuccess: "✓ +1 SOL Получен!",
  },
  home: {
    heroBadgeMainnet: "🟢 Работа в Сети · Solana Mainnet-Beta",
    heroBadgeDevnet: "🟠 Тестовая Песочница · Solana Devnet",
    heroTitle: "Создайте Токен на Solana за Секунды",
    heroSubtitle:
      "Запускайте токены SPL или Token-2022 с защитой RugCheck 100/100, неизменяемыми метаданными в Arweave и пулами ликвидности без программирования.",
    costSummaryTitle: "Модульный Расчёт Стоимости",
    quickGuideTitle: "Краткое Руководство",
    suiteTitle: "Полная Экосистема для Вашего Токена",
    suiteSubtitle:
      "Всё необходимое после минта: создание пулов ликвидности, сжигание LP с PNG-сертификатом, возврат SOL с пустых аккаунтов и массовые аирдропы.",
    faqTitle: "Часто Задаваемые Вопросы (FAQ)",
    quickGuide: [
      {
        title: "Что такое токен SPL?",
        description:
          "Официальный стандарт взаимозаменяемых токенов в сети Solana. Совместим со всеми кошельками (Phantom, Solflare) и DEX (Raydium, Meteora, Jupiter).",
      },
      {
        title: "Что такое Token-2022?",
        description:
          "Новое поколение программы токенов Solana с поддержкой встроенной комиссии за переводы (Tax Token) на уровне протокола.",
      },
      {
        title: "RugCheck 100/100 (Mint и Freeze)",
        description:
          "Отзыв Freeze Authority открывает создание пулов ликвидности (+50 баллов). Отзыв Mint Authority фиксирует эмиссию (+35 баллов), а Immutable Metadata даёт +15 баллов.",
      },
      {
        title: "Mainnet-Beta против Devnet",
        description:
          "В Mainnet-Beta ваш токен реален и торгуется на DEX. В Devnet вы можете бесплатно протестировать создание токена с помощью кнопки Faucet (+1 SOL).",
      },
    ],
    ecosystemDesc: {
      liquidityPool:
        "Создавайте пулы или выводите ликвидность в SOL на Raydium CPMM и Meteora Dynamic AMM в 1 клик.",
      burn: "Сжигайте токены/LP с официальным PNG-сертификатом и возвращайте SOL с пустых аккаунтов.",
      airdrop:
        "Рассылайте токены на сотни кошельков одновременно с автоматическим созданием ATA-аккаунтов.",
      manage: "Проверяйте рейтинг безопасности RugCheck и отзывайте права Mint или Freeze ончейн.",
      affiliates:
        "Создайте реферальную ссылку и мгновенно получайте 30% комиссии в SOL в каждой транзакции.",
      docs: "Пошаговые руководства по токеномике, пулам ликвидности и безопасности RugCheck.",
    },
  },
  form: {
    targetNetwork: "Выбранная Сеть:",
    totalModularFee: "Итоговая Модульная Комиссия:",
    step1: "1. Профиль Токена",
    step2: "2. Логотип и Соцсети",
    step3: "3. Безопасность и Минт",
    tokenName: "Название Токена",
    tokenSymbol: "Тикер (Символ)",
    decimals: "Десятичные Знаки (0 – 9)",
    supply: "Начальная Эмиссия (Supply)",
    storagePipeline: "Хранение Логотипа и Метаданных",
    logoLabel: "Логотип Токена (PNG, JPG, WEBP, GIF — Макс. 5 МБ)",
    dropzonePrompt: "Перетащите логотип токена сюда или нажмите для выбора файла",
    uploadingImg: "Загрузка и проверка изображения...",
    description: "Описание Проекта (Необязательно)",
    website: "Официальный Сайт (Необязательно)",
    twitter: "X / Twitter (Необязательно)",
    instagram: "Instagram (Необязательно)",
    customCreatorTitle: 'Настроить "Creator Info" в Метаданных',
    customCreatorDesc:
      "Заменяет стандартную подпись создателя в метаданных на название и сайт вашей команды.",
    creatorName: "Имя Создателя / Студии",
    creatorUrl: "Официальный Сайт Создателя",
    tokenStandard: "Стандарт Программы Solana",
    standardSpl: "Стандартный SPL (Универсальная Совместимость)",
    standard2022: "Token-2022 (Расширение Tax Token / Комиссия за Перевод)",
    securityTitle: "Ончейн-Защита и RugCheck 100/100 (Модульные Опции)",
    revokeFreezeTitle: "Отозвать Freeze Authority (Рекомендуется)",
    revokeFreezeDesc:
      "Обязательно для создания пула ликвидности на Raydium/Meteora и торговли на Jupiter (+50 баллов RugCheck).",
    revokeMintTitle: "Отозвать Mint Authority (Рекомендуется)",
    revokeMintDesc:
      "Навсегда фиксирует общую эмиссию и запрещает дополнительный выпуск токенов (+35 баллов RugCheck).",
    immutableTitle: "Неизменяемые Метаданные (Immutable)",
    immutableDesc:
      "Навсегда закрепляет имя, символ и изображение токена в эксплорерах (+15 баллов RugCheck).",
    backBtn: "← Назад",
    continueBtn: "Далее →",
    submitMainnet: "🚀 Создать Токен в Mainnet-Beta",
    submitDevnet: "🧪 Создать Тестовый Токен в Devnet",
  },
  costs: {
    headerTitle: "Прозрачность Ончейн-Расходов",
    headerBadge: "100% Атомарно",
    rentLabel: "Рента аккаунта сети (Rent):",
    networkFeeLabel: "Комиссия сети:",
    serviceFeeLabel: "Сервисная комиссия:",
    baseCreate: "Базовая Комиссия за Создание (Token Mint)",
    revokeFreeze: "Отзыв Freeze Authority (Готовность к Пулу)",
    revokeMint: "Отзыв Mint Authority (Фиксированный Supply)",
    immutable: "Неизменяемые Метаданные (Immutable)",
    customCreator: "Персонализация Creator Info (Метаданные)",
    transferFeeExt: "Расширение Tax Token / Transfer Fee (Token-2022)",
    totalModular: "Итого Модульная Комиссия:",
    networkRent: "Рента Сети Solana (Оценка):",
    estimatedWalletTotal: "Итоговая Оценка",
    singleSignatureSub: "Одна подпись в кошельке",
    atomicDisclaimer:
      "Атомарное списание в одной транзакции с мгновенным распределением 30% партнёру и 70% на Dev Wallet.",
  },
  common: {
    activeNetwork: "Активная Сеть:",
    refreshWallet: "↻ Обновить Кошелёк",
    availableBalance: "Доступный Баланс:",
    walletBalance: "Баланс Кошелька:",
    copy: "Копировать",
    copied: "✓ Скопировано!",
    viewOnSolscan: "Открыть в Solscan ↗",
    loading: "Загрузка...",
    cancel: "Отмена",
    confirmAndRevoke: "Подтвердить и Отозвать",
    signingAndConfirming: "Подписание и Подтверждение...",
    irreversibleWarning: "⚠️ Необратимое Ончейн-Действие",
  },
  tokenSelector: {
    loadingAria: "Загрузка токенов кошелька",
    balancePrefix: "Баланс:",
    noTokensDetected: "В подключённом кошельке не найдено токенов в этой сети",
    clickToChoose: "Нажмите, чтобы выбрать токен из подключённого кошелька",
    dropdownHeader: "Активы Подключённого Кошелька — Нажмите для Выбора",
    lpPoolTokenTag: "LP Токен Пула",
  },
  tokenPreview: {
    cardTitle: "Симулятор Кошелька и Аудит Безопасности",
    cardDesc:
      "Предпросмотр вашего токена в реальном времени для Phantom, Solflare и DexScreener.",
    headerLabel: "ПРЕДПРОСМОТР АКТИВА В КОШЕЛЬКЕ SOLANA",
    defaultTokenName: "Название Токена",
    decimalsLabel: "Десятичные",
    transferFeeLabel: "Налог на Перевод",
    metadataLabel: "Метаданные",
    immutable: "Неизменяемые",
    mutable: "Изменяемые",
    auditTitle: "🛡️ Аудит Безопасности и RugCheck Score",
    alertSafe: "🟢 100/100 - Безопасно (Стандарт DexScreener / RugCheck)",
    alertFreeze: "🔴 Критично: Активный Freeze Authority блокирует пулы и торговлю на Jupiter",
    alertMint: "🟡 Риск размытия: Открытый Mint Authority вызывает предупреждения в сканерах",
    alertMutable:
      `🟡 Изменяемые метаданные: Заблокируйте метаданные (+${formatSolAmount(PRICING_SOL.immutableMetadata)} SOL) для 100/100 в RugCheck`,
  },
  stepper: {
    defaultTitle: "Выполнение Транзакции Solana",
    stepBadge: "Шаг",
    steps: [
      "1. Загрузка в Irys",
      "2. Загрузка Метаданных",
      "3. Ожидание Подписи",
      "4. Подтверждение в Сети",
    ],
  },
  liquidityPage: {
    addFeeLabel: "Комиссия Создания Пула:",
    withdrawFeeLabel: "Комиссия Вывода Ликвидности:",
    titleAdd: "Создать Ончейн Пул Ликвидности",
    titleWithdraw: "Вывести Ликвидность в SOL",
    descAdd:
      "Инициализируйте пул ликвидности и выпустите LP-токены на Solana. Выберите токен прямо из кошелька, внесите начальную ликвидность и получите 100% LP-токенов.",
    descWithdraw:
      "Выберите токен или LP-токен прямо из подключённого кошелька. Конвертирует хранилище WSOL обратно в нативные SOL в одной атомарной транзакции.",
    tabAdd: "➕ Добавить Ликвидность",
    tabWithdraw: "💸 Вывести Ликвидность в SOL",
    configurePairTitle: "Настройка Пары Ликвидности",
    configurePairDesc:
      "Выберите токен из кошелька, укажите объём начальной ликвидности и выпустите LP-токены в одной атомарной транзакции.",
    readyStep1: "1. AMM Выбран ✓",
    readyStep2Done: "2. Токен Выбран ✓",
    readyStep2Pending: "2. Ожидание Токена",
    readyStep3Done: "3. Суммы Указаны ✓",
    readyStep3Pending: "3. Ожидание Сумм",
    readyStep4Done: "4. Freeze Auth Готов ✓",
    readyStep4Warn: "4. Требуется Отзыв Freeze",
    step1AmmLabel: "1. Выберите Архитектуру AMM",
    raydiumDesc:
      "Хранилища ликвидности постоянного произведения с нативным выпуском LP-токенов в Mainnet-Beta и Devnet.",
    meteoraDesc:
      "Динамические пулы ликвидности с настраиваемыми уровнями комиссий и мгновенным выпуском LP.",
    step2SelectToken: "2. Выберите Токен Прямо из Подключённого Кошелька",
    freezeWarnTitle: "Обнаружен Активный Freeze Authority",
    freezeWarnDesc:
      "Для создания пула ликвидности необходимо отозвать Freeze Authority. Мы отзовём его автоматически в той же транзакции.",
    freezeAutoRevokeCheck: "Авто-отзыв в той же транзакции",
    tokenAmountLabel: "Количество Токенов в Пул",
    initialLiquidityLabel: "Начальная Ликвидность",
    swapFeeTierLabel: "Комиссия Свопа в Пуле",
    tierRecommended: "Рекомендуется",
    tierStandard: "Стандарт AMM",
    tierHighVol: "Высокая Волатильность",
    activationScheduleLabel: "Время Запуска Торгов",
    immediateBtn: "Мгновенно",
    scheduleTimeBtn: "Запланировать",
    simulatorTitle: "Экономическая Симуляция Пула в Реальном Времени",
    initialPriceLabel: "Начальная Цена Токена",
    impliedMcapLabel: "Расчётный Market Cap",
    poolAllocationLabel: "Доля Эмиссии в Пуле",
    devFeeLabel: "Сервисная Комиссия",
    submitAddBtn: "Создать Пул Ликвидности и Выпустить LP",
    initializingPoolStatus: "Инициализация Ончейн Пула Ликвидности...",
    withdrawCardTitle: "Вывод Ликвидности в SOL",
    withdrawCardDesc:
      "Нажмите на любой токен или LP-токен из вашего кошелька ниже — без ручного ввода тикера или адреса.",
    selectWithdrawalShareLabel: "2. Выберите Долю Вывода SOL",
    sharePartial: "Частичный Выход",
    shareHalf: "Половина Позиции",
    shareMajor: "Основная Часть",
    shareFull: "Полный Вывод + Рента",
    withdrawSimulatorTitle: "Расчёт Вывода Ликвидности в SOL",
    selectedShareLabel: "Выбранная Доля",
    estimatedSolUnwrapped: "Ожидаемый Возврат SOL",
    estNetSolToWallet: "Чистый Возврат SOL в Кошелёк",
    submitWithdrawBtn: "💸 Вывести Ликвидность в SOL",
    withdrawingStatus: "Вывод Ликвидности в SOL...",
    vaultAutoDetected: "Автоматически Обнаружено Хранилище WSOL",
    inspectingVault: "Проверка ончейн-хранилища...",
    readyToUnwrap: "Готово к разблокировке WSOL / ATA",
    sidebarAddTitle: "Архитектура Пула и Ончейн-Досье",
    sidebarWithdrawTitle: "Прямой Вывод SOL в Кошелёк",
    sidebarAddBullets: [
      {
        title: "Выбор в 1 Клик:",
        text: "Выберите любой токен прямо из подключённого кошелька без ввода адреса смарт-контракта.",
      },
      {
        title: "Реальный Выпуск LP Ончейн:",
        text: "Создаёт детерминированный Pool Authority PDA, оборачивает SOL в WSOL-хранилище и начисляет LP-токены.",
      },
      {
        title: "Гибкий Возврат SOL:",
        text: "Нужно вывести внесённые SOL позже? Переключитесь на вкладку «Вывести Ликвидность в SOL» в любое время.",
      },
    ],
    sidebarWithdrawBullets: [
      {
        title: "Без Ввода Адресов:",
        text: "Просто выберите токен или LP-токен из списка кошелька; адрес хранилища определяется автоматически.",
      },
      {
        title: "Частичный или Полный Вывод (25% – 100%):",
        text: "Выведите часть ликвидности или 100% MAX (включая возврат ренты аккаунта).",
      },
    ],
  },
  burnPage: {
    feeBadgeLabel: "Фиксированная Комиссия Сжигания:",
    pageTitle: "Ончейн Сжигание Токенов и LP + Возврат SOL",
    pageDesc:
      "Выберите любой токен или LP-токен из кошелька, сгенерируйте визуальный PNG-сертификат Rug-Proof и верните SOL, заблокированные в пустых аккаунтах.",
    cardTitle: "Сжигание Токенов или LP-Токенов",
    cardDescPrefix:
      "Выберите токен или LP-токен прямо из подключённого кошелька. Сервисная комиссия:",
    step1SelectLabel: "1. Выберите Токен или LP-Токен из Вашего Кошелька",
    step2AmountLabel: "2. Количество для Сжигания",
    impactTitle: "🔥 Предпросмотр Дефляционного Сжигания",
    irreversibleBadge: "НЕОБРАТИМО ОНЧЕЙН",
    currentBalanceLabel: "Текущий Баланс Кошелька",
    amountToDestroyLabel: "Количество к Уничтожению",
    remainingBalanceLabel: "Остаток на Балансе",
    shareBurnedLabel: "Доля Сожжённых Токенов",
    submitBurnBtnPrefix: "🔥 Сжечь Выбранные Токены",
    executingBurnStatus: "Выполнение Ончейн-Сжигания...",
    certHeaderTitle: "🏆 Официальный Сертификат LP Burn / Rug-Proof",
    downloadPngBtn: "⬇️ Скачать PNG Сертификат",
    shareXBtn: "𝕏 Поделиться в X (Twitter)",
    reclaimBadge: "💎 ВИРУСНЫЙ ИНСТРУМЕНТ · ЗАКРЫТИЕ ПУСТЫХ АККАУНТОВ",
    reclaimTitle: "Возврат SOL с Пустых Аккаунтов (Rent Recovery)",
    reclaimDesc:
      "Каждый пустой токен-аккаунт в вашем кошельке удерживает SOL за аренду (rent). Закройте до 20 пустых аккаунтов за одну транзакцию и мгновенно верните свои SOL.",
    reclaimBannerPrefix: "В вашем кошельке обнаружено",
    reclaimBannerSuffix: "пустых аккаунтов =",
    emptyAccountsLabel: "Пустые Аккаунты (Баланс 0)",
    platformFeeLabel: "Комиссия Платформы (8%)",
    netToYouLabel: "Чистыми Вам (92%)",
    reclaimSubmitBtn: "⚡ Вернуть Мои SOL Сейчас",
    reclaimEmptyBtn: "В Подключённом Кошельке Нет Пустых Аккаунтов",
    reclaimingStatus: "Возврат SOL...",
    sidebarHowItWorks: "Как Работает Сжигание Токенов и LP",
    tutorial1Title: "1. Прямой Выбор из Кошелька",
    tutorial1Desc:
      "Все токены SPL, Token-2022 и LP из вашего кошелька отображаются автоматически (или выбираются через ?mint=).",
    tutorial2Title: "2. Визуальный Сертификат и Возврат SOL",
    tutorial2Desc:
      "После сжигания скачайте официальный PNG-сертификат '100% BURNED & VERIFIED ON-CHAIN' и поделитесь им в X. Также закройте пустые аккаунты для возврата SOL.",
    withdrawCtaTitle: "Хотите Сначала Вывести Ликвидность в SOL?",
    withdrawCtaDesc:
      "Если вы хотите вернуть вложенные SOL перед сжиганием LP-токенов, воспользуйтесь инструментом:",
    withdrawCtaLink: `Вывести Ликвидность в SOL (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
  },
  airdropPage: {
    feeBadgeLabel: "Комиссия за Пакет:",
    pageTitle: "Массовый Airdrop Токенов и Multi-Sender",
    pageDesc:
      "Рассылайте токены SPL или Token-2022 на множество кошельков Solana пакетными атомарными транзакциями с автоматическим созданием ATA.",
    cardTitle: "Настройка Массовой Рассылки (Airdrop)",
    cardDescPrefix:
      "Выберите токен, импортируйте или вставьте список адресов и проверьте баланс перед отправкой. Сервисная комиссия:",
    step1SelectLabel: "1. Выберите Токен для Рассылки",
    step2RecipientsLabel: "2. Список Кошельков Получателей (Адрес,Количество)",
    loadSampleBtn: "📄 Загрузить Пример",
    importCsvBtn: "📁 Импорт CSV / TXT",
    clearListBtn: "✕ Очистить Список",
    uniformLabel: "⚡ Установить Единую Сумму для Всех Кошельков:",
    applyAllBtn: "Применить ко Всем Строкам",
    textareaPlaceholder:
      "Один получатель на строку: АдресКошелька,Количество\nПример:\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
    textareaHint:
      "Разделяйте адрес кошелька и количество токенов запятой, пробелом или точкой с запятой.",
    summaryTitle: "📊 Проверка Списка и Сводка Расходов",
    readyToBroadcast: "✓ Готово к Отправке",
    reviewRequired: "⚠️ Требуется Проверка",
    validWalletsLabel: "Валидных Кошельков",
    totalTokensLabel: "Всего Токенов к Отправке",
    atomicBatchesLabel: "Атомарных Пакетов (Batches)",
    totalServiceFeeLabel: "Общая Сервисная Комиссия",
    validateBtn: "✓ Проверить Список Получателей",
    sendAirdropBtn: "📦 Отправить Airdrop",
    processingAirdropStatus: "Отправка Airdrop...",
    launchAnotherBtn: "📦 Запустить Ещё Один Airdrop",
    sidebarTitle: "Как Работает Multi-Send",
    tutorialSteps: [
      {
        title: "1. Выберите Токен из Кошелька",
        description:
          "Выберите любой токен SPL или Token-2022 из подключённого кошелька для рассылки сообществу.",
      },
      {
        title: "2. Импортируйте CSV или Вставьте Список",
        description:
          "Вставьте пары Адрес,Количество, загрузите файл .CSV/.TXT или укажите единую сумму для всех адресов.",
      },
      {
        title: "3. Авто-Создание ATA и Пакетная Отправка",
        description:
          "Автоматически создаёт недостающие ATA-аккаунты и объединяет до 10 получателей в одну атомарную транзакцию.",
      },
    ],
  },
  dashboardPage: {
    feeBadgeLabel: "Фиксированная Комиссия Отзыва:",
    pageTitle: "Управление Правами (Authorities) и Безопасностью",
    pageDesc:
      "Проверьте ончейн-рейтинг безопасности вашего токена и навсегда отзовите права Mint или Freeze в сети Solana.",
    panelTitle: "Панель Проверки Прав и Безопасности",
    panelDesc:
      "Выберите любой актив SPL или Token-2022 из вашего кошелька для проверки RugCheck Score и отзыва активных прав.",
    connectPrompt: "Подключите кошелёк для проверки и управления правами ваших токенов.",
    step1SelectLabel: "1. Выберите Токен из Вашего Кошелька",
    securityScoreTitle: "🛡️ Ончейн-Рейтинг Безопасности и Готовность к RugCheck",
    scoreFull: "100% Неизменяемый и Готов к DEX ✓",
    scorePartial: "Частично Отозваны",
    scoreActive: "Права Активны",
    mintAuthTitle: "Mint Authority (Лимит Эмиссии)",
    freezeAuthTitle: "Freeze Authority (Доступ к DEX Пулу)",
    statusRevoked: "Отозвано ✓",
    statusActive: "Активно",
    mintRevokedDesc:
      "Эмиссия токена зафиксирована навсегда. Дополнительный выпуск токенов невозможен.",
    mintActiveDesc:
      "Ваш кошелёк всё ещё может выпускать новые токены. Отзовите право для фиксации эмиссии.",
    freezeRevokedDesc:
      "Ни один кошелёк не может быть заморожен. Токен готов для пулов ликвидности Raydium и Meteora.",
    freezeActiveDesc:
      "Необходимо отозвать перед созданием пула ликвидности AMM на Raydium или Meteora.",
    revokeMintBtn: "🔒 Отозвать Mint Authority",
    revokeFreezeBtn: "❄️ Отозвать Freeze Authority",
    goToLpBtn: "💧 Перейти к Пулу Ликвидности →",
    modalTitlePrefix: "Подтвердите Бессрочный Отзыв Права:",
    modalDesc:
      "Это действие необратимо в блокчейне Solana и обеспечивает максимальное доверие инвесторов в RugCheck. Продолжить?",
    guideSections: [
      {
        title: "Права Mint против Freeze",
        description:
          "Mint Authority отвечает за выпуск новых токенов. Freeze Authority позволяет замораживать счета держателей.",
      },
      {
        title: "Готовность к DEX и Raydium",
        description:
          "Отзыв Freeze Authority обязателен для пулов Raydium и Meteora. Отзыв Mint Authority подтверждает фиксированную эмиссию в RugCheck.",
      },
      {
        title: "Бессрочное Атомарное Выполнение",
        description:
          "Отзыв прав необратим в сети Solana и выполняется в одной атомарной транзакции, подписанной вашим кошельком.",
      },
    ],
  },
  affiliatesPage: {
    pageTitle: "Партнёрская Программа: 30% в SOL Мгновенно",
    pageDesc:
      "Присоединяйтесь к нашей ончейн партнёрской программе и получайте 30% мгновенной комиссии в SOL с каждого создания токена или пула ликвидности по вашей ссылке.",
    linkCardTitle: "Ваша Персональная Реферальная Ссылка",
    linkExplanation:
      "Это ваша уникальная реферальная ссылка. Параметр ?ref= сохраняется при входе на любую страницу и автоматически переводит 30% сервисной комиссии прямо на ваш кошелёк в той же транзакции.",
    connectPrompt: "Подключите кошелёк Solana, чтобы сгенерировать персональную реферальную ссылку.",
    viewEarningsBtn: "Показать Мои Доходы и Историю",
    hideEarningsBtn: "Скрыть Панель Доходов",
    dashboardTitle: "Панель Доходов Партнёра",
    dashboardDesc: "Отслеживайте подтверждённые ончейн-рефералы и полученные комиссии 30% в SOL.",
    totalEarningsLabel: "Общий Доход (30% Сплит)",
    verifiedReferralsLabel: "Подтверждённые Рефералы",
    historyTitle: "Последние 10 Подтверждённых Выплат",
    dateCol: "Дата",
    amountCol: "Сумма",
    txCol: "Транзакция",
    noHistoryText: "Пока нет подтверждённых партнёрских выплат.",
    howItWorksTitle: "Как Это Работает",
    steps: [
      {
        title: "1. Подключите Кошелёк:",
        text: "Публичный адрес вашего кошелька служит уникальным идентификатором партнёра.",
      },
      {
        title: "2. Скопируйте Ссылку:",
        text: "Ваша партнёрская ссылка создаётся автоматически с параметром ?ref=ВАШ_КОШЕЛЁК.",
      },
      {
        title: "3. Делитесь Ссылкой:",
        text: "Отправляйте ссылку создателям мемкоинов, токенов и пулов ликвидности.",
      },
      {
        title: "4. Получайте 30% Мгновенно:",
        text: "30% сервисной комиссии переводится прямо на ваш кошелёк в той же транзакции (70% Dev / 30% Партнёр).",
      },
    ],
    commissionCardTitle: "Ваша Комиссия 30% в SOL",
    commissionCardText:
      "Вы получаете 30% от всех модульных комиссий за выпуск токенов и создание пулов ликвидности по вашей ссылке напрямую в кошелёк без задержек.",
    transparentCardTitle: "Прозрачные Ончейн-Выплаты",
    transparentCardText:
      "Выплаты происходят атомарно через SystemProgram.transfer сети Solana и проверяются в блокчейне.",
  },
  docsPage: {
    pageTitle: "Документация Платформы",
    pageSubtitle:
      "Полное техническое руководство по созданию токенов, запуску пулов ликвидности, сжиганию LP и массовым аирдропам.",
    tocTitle: "Навигация",
    sections: [
      {
        id: "criar-token",
        title: "Создание Токенов (SPL и Token-2022)",
        summary:
          "Узнайте, как выпустить собственный токен на Solana с метаданными в Arweave и защитой RugCheck 100/100.",
        intro:
          "Процесс создания позволяет запустить цифровой актив в блокчейне Solana одной атомарной транзакцией:",
        bullets: [
          {
            label: "Параметры Токена:",
            text: "Укажите имя, тикер, десятичные знаки (0–9) и общую эмиссию с точной поддержкой BigInt.",
          },
          {
            label: "Вечные Метаданные:",
            text: "Логотип и JSON метаданных сохраняются децентрализованно через Arweave/Irys по стандарту Metaplex.",
          },
          {
            label: "Выбор Стандарта:",
            text: "Стандартный SPL (универсальная совместимость) или Token-2022 (встроенный налог на переводы / Tax Token).",
          },
          {
            label: "Защита RugCheck 100/100:",
            text: "Отзовите Freeze Authority (+50 баллов), Mint Authority (+35 баллов) и закрепите метаданные (+15 баллов).",
          },
        ],
      },
      {
        id: "criar-liquidez",
        title: "Создание Пула Ликвидности (Raydium и Meteora)",
        summary:
          "Откройте публичные торги вашим токеном, запустив AMM-пул на Raydium CPMM или Meteora Dynamic AMM.",
        intro:
          "Без ликвидности токен нельзя купить или продать. Создание пула связывает ваш токен с SOL или USDC:",
        bullets: [
          {
            label: "Raydium CPMM и Meteora DAMM:",
            text: "Запускайте пулы постоянного произведения без покупки дорогого OpenBook Market ID.",
          },
          {
            label: "Начальная Цена и Капитализация:",
            text: "Соотношение внесённых токенов и SOL/USDC автоматически формирует стартовую цену.",
          },
          {
            label: "LP-Токены:",
            text: "Вы получаете 100% выпущенных LP-токенов: их можно сжечь для блокировки ликвидности или использовать для вывода SOL.",
          },
        ],
      },
      {
        id: "queimar-tokens",
        title: "Сжигание Токенов (Burn) и Возврат SOL",
        summary:
          "Сокращайте эмиссию, сжигайте LP-токены с PNG-сертификатом и возвращайте ренту SOL с пустых аккаунтов.",
        intro:
          "Сжигание токенов — необратимый дефляционный механизм, подтверждаемый в блокчейне Solana:",
        bullets: [
          {
            label: "Официальный PNG-Сертификат:",
            text: "Скачивайте сертификат высокого разрешения '100% BURNED & VERIFIED ON-CHAIN' со ссылкой на Solscan.",
          },
          {
            label: "Возврат SOL (Rent Recovery):",
            text: "Закрывайте пустые токен-аккаунты в кошельке и мгновенно возвращайте заблокированные SOL.",
          },
        ],
      },
      {
        id: "airdrop",
        title: "Массовая Рассылка (Airdrop)",
        summary: "Отправляйте токены на десятки и сотни кошельков пакетными транзакциями.",
        intro: "Инструмент Multi-Sender ускоряет проведение аирдропов и вознаграждение комьюнити:",
        bullets: [
          {
            label: "Умная Валидация:",
            text: "Проверяет каждый адрес Base58 и достаточность баланса перед отправкой.",
          },
          {
            label: "Авто-Создание ATA:",
            text: "Автоматически инициализирует токен-аккаунты (ATA) для получателей, у которых ещё нет вашего токена.",
          },
        ],
      },
      {
        id: "gerenciar-tokens",
        title: "Управление Правами (Authorities)",
        summary: "Проверяйте безопасность токенов и отзывайте права Mint и Freeze ончейн.",
        intro:
          "Панель управления позволяет в любой момент проверить и отозвать права любого вашего токена:",
        bullets: [
          {
            label: "Отзыв Mint Authority:",
            text: "Делает общую эмиссию токена строго фиксированной навсегда.",
          },
          {
            label: "Отзыв Freeze Authority:",
            text: "Запрещает заморозку кошельков и открывает доступ к пулам ликвидности Raydium и Meteora.",
          },
        ],
      },
      {
        id: "afiliados",
        title: "Ончейн Партнёрская Программа (30%)",
        summary: "Получайте 30% комиссии в SOL автоматически с каждой приглашённой транзакции.",
        intro:
          "Партнёрская программа распределяет сервисную комиссию атомарно внутри самой транзакции Solana:",
        bullets: [
          {
            label: "Мгновенная Ссылка:",
            text: "Подключите кошелёк, скопируйте ссылку ?ref=ВАШ_КОШЕЛЁК и отслеживайте выплаты в Solscan.",
          },
        ],
      },
    ],
  },
  costsPage: {
    pageTitle: "Прозрачная Таблица Стоимости и Комиссий",
    pageDesc:
      "Расчётная стоимость всех операций в сети Solana, включая модульную сервисную комиссию платформы и ренту сети (Rent).",
    loading: "Загрузка таблицы комиссий...",
    labels: {
      createToken: `Создание Токена (Модульно ${FEE_RANGE.minDisplay} – ${FEE_RANGE.maxFullSuiteDisplay})`,
      burnToken: `Сжигание Токенов / LP (Комиссия ${formatSolAmount(PRICING_SOL.burnStandard)} SOL)`,
      airdrop: `Массовый Airdrop (${formatSolAmount(PRICING_SOL.massAirdropPerBatch)} SOL / Пакет)`,
      manageAuthority: `Отзыв Прав / Authorities (Комиссия ${formatSolAmount(PRICING_SOL.revokeAuthorityStandalone)} SOL)`,
      createLiquidityPool: "Создание Пула Ликвидности (Комиссия 0.15 SOL)",
      removeLiquidity: `Вывод Ликвидности в SOL (Комиссия ${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
    },
  },
  confirmationPage: {
    pageTitle: "Статус Запуска Токена",
    infoBanner:
      "Ваш токен успешно создан в сети Solana! Выполните 3 шага ниже, чтобы добавить ликвидность, сжечь LP (Rug-Proof) и провести аирдроп.",
    mintedVerifiedTitle: "Токен Выпущен и Подтверждён Ончейн!",
    mintAddressLabel: "Адрес Минта Токена:",
    txSignatureLabel: "Подпись Транзакции:",
    viewTokenSolscan: "Открыть Токен в Solscan ↗",
    viewTxSolscan: "Открыть Транзакцию в Solscan ↗",
    funnelTitle: "🚀 Следующие Шаги для Листинга Токена",
    funnelSubtitle:
      "Адрес вашего нового токена будет автоматически выбран на каждом шаге:",
    step1Badge: "Шаг 1 · Торговля на DEX",
    step1Title: "💧 Создать Пул Ликвидности",
    step1Desc:
      "Запустите торговую пару на Raydium CPMM или Meteora DAMM для открытия покупок и продаж.",
    step2Badge: "Шаг 2 · Сертификат Rug-Proof",
    step2Title: "🔥 Сжечь Ликвидность / Эмиссию (LP Burn)",
    step2Desc:
      "Сожгите LP-токены или часть эмиссии и скачайте подтверждённый PNG-сертификат.",
    step3Badge: "Шаг 3 · Рост Сообщества",
    step3Title: "📦 Провести Airdrop для Сообщества",
    step3Desc:
      "Отправьте токены списку кошельков с автоматическим созданием ATA-аккаунтов.",
    backToCreator: "← Вернуться к Созданию Токена",
  },
  footer: {
    badges: [
      {
        title: "100% Некастодиально и Белый Список Программ",
        desc: "Каждая транзакция проверяется по белому списку программ Solana и симулируется перед подписью.",
      },
      {
        title: "Проверенные Ончейн-Протоколы",
        desc: "Построено напрямую поверх официальных программ SPL Token, Token-2022, Metaplex и AMM-хранилищ.",
      },
      {
        title: "Модульные Тарифы и 30% Партнёрам",
        desc: "Прозрачные модульные комиссии с мгновенным атомарным отчислением 30% рефералам ончейн.",
      },
      {
        title: "Mainnet-Beta по Умолчанию и Devnet",
        desc: "Работает в Solana Mainnet-Beta для реальных запусков с переключением в Devnet в 1 клик для тестов.",
      },
    ],
    tagline:
      "Некастодиальный лаунчпад в стиле Swiss Design для выпуска токенов SPL и Token-2022, создания пулов ликвидности AMM и управления правами на Solana.",
    connectedTo: "Подключено к RPC Solana",
    servicesTitle: "Сервисы Платформы",
    resourcesTitle: "Ресурсы и Прозрачность",
    programsTitle: "Проверенные Ончейн-Программы",
    rightsReserved:
      "Все права защищены. Некастодиальный интерфейс для блокчейна Solana.",
    securityNotice:
      "Уведомление о безопасности: всегда проверяйте симуляцию транзакции в кошельке перед подписанием.",
  },
};

dictionary.costs = dictionary.costsPage;

export default dictionary;
