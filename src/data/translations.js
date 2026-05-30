// Translations file for IOT Public Transit & Tourism Dashboard
// Languages supported: ar (Arabic), en (English), fr (French), es (Spanish), it (Italian)

export const TRANSLATIONS = {
  ar: {
    dir: 'rtl',
    align: 'text-right',
    alignOpposite: 'text-left',
    flexRowReverse: 'flex-row-reverse',
    langName: 'العربية',
    
    // Header & Tabs
    transportTab: '🚌 النقل',
    tourismTab: '🗺️ السياحة',
    sandboxBtn: 'صندوق الرمل',
    signOut: 'تسجيل الخروج',
    clientAccount: 'حساب العميل',
    secLevel: 'بوابة الدخول · مستوى الأمان 1',

    // Sector Public Transit
    transitHeader: 'قطاع النقل · Public Transit',
    busNetwork: 'شبكة الباصات الأردنية',
    totalRoutes: 'إجمالي الخطوط',
    brtRoutes: 'خطوط BRT السريعة',
    intercityRoutes: 'بين المدن',
    avgFare: 'متوسط التعرفة',
    cityIrbid: 'إربد',
    cityAmman: 'عمان',
    cityZarqa: 'الزرقاء',

    // Transit Widgets
    liveRoute: 'مسار الحافلة الحي',
    gpsTracking: 'GPS · تتبع حي',
    activeRoutesCount: 'خط نشط',
    weatherNow: 'الطقس الآن',
    loading: 'جاري التحميل...',
    failedWeather: 'تعذّر تحميل الطقس',
    feelsLike: 'يبدو كـ',
    humidity: 'الرطوبة',
    windSpeed: 'كم/س',
    temp: 'حرارة',

    // Transit Tracker
    availSeats: 'المقاعد المتاحة',
    seatsUnit: 'مقعد',
    eta: 'وقت الوصول',
    minutesUnit: 'دقيقة',
    departure: 'الانطلاق',
    arrival: 'الوصول',
    completed: 'مكتمل',
    liveTrack: 'تتبع حي',
    busLabel: 'باص إربد - عمان',

    // Routes List / Detail
    routesOfCity: 'خطوط',
    routeCountUnit: 'خط',
    brtFast: 'BRT سريع',
    intercityLabel: 'بين مدن',
    stoppedLabel: 'متوقف',
    fareLabel: 'التعرفة',
    freqLabel: 'التكرار',
    stopsLabel: 'المحطات',
    mainStopLabel: 'رئيسية',
    fareUnit: 'دينار',

    // Tourism Panel
    tourismHeader: 'قطاع السياحة · Jordan Tourism Portal',
    exploreSites: 'استكشف المواقع السياحية الأردنية',
    scanSuccess: 'مسح رمز QR ناجح · السياحة الذكية IoT',
    connected: 'متصل',
    interactiveMap: 'خريطة الأردن التفاعلية',
    sitesCountUnit: 'موقع',
    calm: 'هادئ',
    moderate: 'متوسط',
    crowded: 'مزدحم',
    availSitesList: 'المواقع المتاحة',
    chooseSitePrompt: 'اختر موقعاً من الخريطة أو القائمة',
    backBtn: 'رجوع',
    fullscreen: 'ملء الشاشة',
    exitFullscreen: 'إغلاق ملء الشاشة',

    // Site Details
    entryFee: 'سعر الدخول',
    openHours: 'أوقات العمل',
    avgVisit: 'متوسط الزيارة',
    visitHoursUnit: 'ساعة',
    crowdPeak: 'ذروة الازدحام',
    crowdLevelNow: 'مستوى الازدحام الآن',
    notableLandmarks: 'أبرز المعالم',
    freeEntry: 'مجاني',
    twentyFourSeven: 'طوال الساعة',
    
    // Types
    heritage: 'تراث',
    nature: 'طبيعة',
    adventure: 'مغامرة',
    religious: 'ديني',

    // Dynamic Site Texts
    sites: {
      petra: {
        name: 'البترا',
        desc: 'مدينة النبطيين الأثرية المحفورة في الصخر، إحدى عجائب الدنيا السبع الجديدة.',
        highlights: ['الخزنة', 'السيق', 'الدير', 'المسرح الروماني']
      },
      wadi_rum: {
        name: 'وادي رم',
        desc: 'صحراء رملية حمراء خلابة تُعرف بـ"وادي القمر"، مقصد لمحبي المغامرة والتخييم.',
        highlights: ['جمال الرمال الحمراء', 'ليالي النجوم', 'جولات الجيب', 'التخييم في الصحراء']
      },
      dead_sea: {
        name: 'البحر الميت',
        desc: 'أخفض بقعة على سطح الأرض. مياه ملحية شديدة تجعلك تطفو بسهولة وتُعالج الجلد.',
        highlights: ['الطفو الطبيعي', 'طين الشفاء', 'المنتجعات الفاخرة']
      },
      jerash: {
        name: 'جرش',
        desc: 'مدينة رومانية أثرية محفوظة بشكل استثنائي، من أجمل المدن الرومانية خارج إيطاليا.',
        highlights: ['الأبواب الحجرية', 'الساحة الأوفالية', 'معبد أرتميس', 'المدرج الجنوبي']
      },
      ajloun: {
        name: 'قلعة عجلون',
        desc: 'قلعة إسلامية بنيت في القرن الثاني عشر، تطل على جبال عجلون الخضراء الخلابة.',
        highlights: ['الأبراج الدفاعية', 'المنظر الطبيعي', 'المتحف الداخلي']
      },
      aqaba: {
        name: 'العقبة',
        desc: 'المنفذ البحري الأردني الوحيد على البحر الأحمر، مشهورة بالغوص وشعاب المرجانية.',
        highlights: ['الغوص', 'ركوب الأمواج', 'القلعة الأثرية', 'المطاعم البحرية']
      },
      madaba: {
        name: 'مادبا',
        desc: 'مدينة الفسيفساء الأردنية. تحتضن أقدم خريطة مفصلة للأراضي المقدسة مصنوعة من الفسيفساء.',
        highlights: ['كنيسة القديس جورج', 'متحف الفسيفساء', 'جبل نيبو']
      },
      karak: {
        name: 'قلعة الكرك',
        desc: 'قلعة صليبية ضخمة تعود للقرن الثاني عشر، وقعت عليها معارك تاريخية شهيرة.',
        highlights: ['الأنفاق الصليبية', 'برج الكشافة', 'متحف القلعة']
      }
    }
  },
  en: {
    dir: 'ltr',
    align: 'text-left',
    alignOpposite: 'text-right',
    flexRowReverse: 'flex-row',
    langName: 'English',
    
    // Header & Tabs
    transportTab: '🚌 Transport',
    tourismTab: '🗺️ Tourism',
    sandboxBtn: 'Sandbox',
    signOut: 'Sign Out',
    clientAccount: 'Client Account',
    secLevel: 'GATEWAY · SECURITY LEVEL 1',

    // Sector Public Transit
    transitHeader: 'Public Transit Sector · Jordanian Transport Network',
    busNetwork: 'Jordanian Public Bus Network',
    totalRoutes: 'Total Routes',
    brtRoutes: 'BRT Express Routes',
    intercityRoutes: 'Intercity Routes',
    avgFare: 'Average Fare',
    cityIrbid: 'Irbid',
    cityAmman: 'Amman',
    cityZarqa: 'Zarqa',

    // Transit Widgets
    liveRoute: 'Live Bus Route Track',
    gpsTracking: 'GPS · Live Tracking',
    activeRoutesCount: 'Active Routes',
    weatherNow: 'Live Weather',
    loading: 'Loading weather...',
    failedWeather: 'Failed to load weather',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    windSpeed: 'km/h',
    temp: 'Temp',

    // Transit Tracker
    availSeats: 'Available Seats',
    seatsUnit: 'seats',
    eta: 'Time of Arrival',
    minutesUnit: 'min',
    departure: 'Departure',
    arrival: 'Arrival',
    completed: 'completed',
    liveTrack: 'Live Track',
    busLabel: 'Irbid - Amman Bus',

    // Routes List / Detail
    routesOfCity: 'Routes',
    routeCountUnit: 'routes',
    brtFast: 'BRT Fast',
    intercityLabel: 'Intercity',
    stoppedLabel: 'Stopped',
    fareLabel: 'Fare',
    freqLabel: 'Frequency',
    stopsLabel: 'Stops',
    mainStopLabel: 'Main',
    fareUnit: 'JOD',

    // Tourism Panel
    tourismHeader: 'Tourism Sector · Jordan Tourism Portal',
    exploreSites: 'Explore Jordan Tourist Sites',
    scanSuccess: 'QR Code Scan Successful · IoT Smart Tourism',
    connected: 'Online',
    interactiveMap: 'Interactive Map of Jordan',
    sitesCountUnit: 'sites',
    calm: 'Quiet',
    moderate: 'Moderate',
    crowded: 'Crowded',
    availSitesList: 'Available Sites',
    chooseSitePrompt: 'Choose a site from the map or list',
    backBtn: 'Back',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',

    // Site Details
    entryFee: 'Entry Fee',
    openHours: 'Opening Hours',
    avgVisit: 'Avg. Visit Time',
    visitHoursUnit: 'hours',
    crowdPeak: 'Crowd Peak Hour',
    crowdLevelNow: 'Current Crowd Level',
    notableLandmarks: 'Highlights',
    freeEntry: 'Free',
    twentyFourSeven: '24/7',

    // Types
    heritage: 'Heritage',
    nature: 'Nature',
    adventure: 'Adventure',
    religious: 'Religious',

    // Dynamic Site Texts
    sites: {
      petra: {
        name: 'Petra',
        desc: 'The ancient Nabataean city carved into rose-red rock — a UNESCO World Heritage Site.',
        highlights: ['Al-Khazneh (Treasury)', 'The Siq', 'Ad Deir (Monastery)', 'Roman Theater']
      },
      wadi_rum: {
        name: 'Wadi Rum',
        desc: 'A spectacular red desert valley known as "Valley of the Moon", popular for jeep tours and camping.',
        highlights: ['Red Sand Dunes', 'Starlit Skies', 'Jeep Safaris', 'Bedouin Camping']
      },
      dead_sea: {
        name: 'Dead Sea',
        desc: 'The lowest point on Earth. Ultra-saline waters allow effortless floating and have therapeutic skin benefits.',
        highlights: ['Natural Floating', 'Healing Mud', 'Luxury Resorts']
      },
      jerash: {
        name: 'Jerash',
        desc: 'One of the best-preserved Roman cities outside of Italy, featuring colonnaded streets and grand temples.',
        highlights: ['Hadrian\'s Arch', 'Oval Plaza', 'Temple of Artemis', 'South Theater']
      },
      ajloun: {
        name: 'Ajloun Castle',
        desc: 'A 12th-century Islamic castle built by Izz al-Din Usama, offering stunning views over forested hills.',
        highlights: ['Defense Towers', 'Panoramic View', 'Inner Museum']
      },
      aqaba: {
        name: 'Aqaba',
        desc: "Jordan's only coastal city on the Red Sea, renowned for world-class diving and coral reefs.",
        highlights: ['Scuba Diving', 'Windsurfing', 'Aqaba Castle', 'Seafood Dining']
      },
      madaba: {
        name: 'Madaba',
        desc: 'The "City of Mosaics" — home to the famous 6th-century mosaic map of the Holy Land.',
        highlights: ['St. George Church', 'Mosaic Museum', 'Mount Nebo']
      },
      karak: {
        name: 'Karak Castle',
        desc: 'A massive 12th-century Crusader castle, one of the largest and best preserved in the Levant region.',
        highlights: ['Crusader Galleries', 'Keep Tower', 'Castle Museum']
      }
    }
  },
  fr: {
    dir: 'ltr',
    align: 'text-left',
    alignOpposite: 'text-right',
    flexRowReverse: 'flex-row',
    langName: 'Français',
    
    // Header & Tabs
    transportTab: '🚌 Transport',
    tourismTab: '🗺️ Tourisme',
    sandboxBtn: 'Sandbox',
    signOut: 'Se déconnecter',
    clientAccount: 'Compte client',
    secLevel: 'GATEWAY · NIVEAU DE SÉCURITÉ 1',

    // Sector Public Transit
    transitHeader: 'Secteur des Transports Publics Jordaniens',
    busNetwork: 'Réseau de Bus Publics de Jordanie',
    totalRoutes: 'Total des Lignes',
    brtRoutes: 'Lignes Express BRT',
    intercityRoutes: 'Interurbain',
    avgFare: 'Tarif Moyen',
    cityIrbid: 'Irbid',
    cityAmman: 'Amman',
    cityZarqa: 'Zarqa',

    // Transit Widgets
    liveRoute: 'Suivi de Ligne de Bus en Direct',
    gpsTracking: 'GPS · Suivi en Direct',
    activeRoutesCount: 'Lignes Actives',
    weatherNow: 'Météo en Direct',
    loading: 'Chargement météo...',
    failedWeather: 'Échec de chargement météo',
    feelsLike: 'Ressenti',
    humidity: 'Humidité',
    windSpeed: 'km/h',
    temp: 'Temp',

    // Transit Tracker
    availSeats: 'Sièges Disponibles',
    seatsUnit: 'sièges',
    eta: 'Heure d\'Arrivée',
    minutesUnit: 'min',
    departure: 'Départ',
    arrival: 'Arrivée',
    completed: 'terminé',
    liveTrack: 'Suivi Live',
    busLabel: 'Bus Irbid - Amman',

    // Routes List / Detail
    routesOfCity: 'Lignes',
    routeCountUnit: 'lignes',
    brtFast: 'BRT Rapide',
    intercityLabel: 'Interurbain',
    stoppedLabel: 'Arrêté',
    fareLabel: 'Tarif',
    freqLabel: 'Fréquence',
    stopsLabel: 'Arrêts',
    mainStopLabel: 'Principal',
    fareUnit: 'JOD',

    // Tourism Panel
    tourismHeader: 'Secteur Touristique · Portail du Tourisme en Jordanie',
    exploreSites: 'Explorez les Sites Touristiques de Jordanie',
    scanSuccess: 'Scan du code QR Réussi · Tourisme Intelligent IoT',
    connected: 'En ligne',
    interactiveMap: 'Carte Interactive de la Jordanie',
    sitesCountUnit: 'sites',
    calm: 'Calme',
    moderate: 'Modéré',
    crowded: 'Peuplé',
    availSitesList: 'Sites Disponibles',
    chooseSitePrompt: 'Sélectionnez un site sur la carte ou dans la liste',
    backBtn: 'Retour',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',

    // Site Details
    entryFee: 'Frais d\'Entrée',
    openHours: 'Heures d\'Ouverture',
    avgVisit: 'Durée de Visite',
    visitHoursUnit: 'heures',
    crowdPeak: 'Heure de Pointe',
    crowdLevelNow: 'Niveau d\'Affluence Actuel',
    notableLandmarks: 'Points Forts',
    freeEntry: 'Gratuit',
    twentyFourSeven: '24h/24',

    // Types
    heritage: 'Patrimoine',
    nature: 'Nature',
    adventure: 'Aventure',
    religious: 'Religieux',

    // Dynamic Site Texts
    sites: {
      petra: {
        name: 'Pétra',
        desc: 'La cité antique nabatéenne sculptée dans la roche rose-rouge - un site du patrimoine mondial de l\'UNESCO.',
        highlights: ['La Khazneh (Trésor)', 'Le Sîq', 'Ad Deir (Monastère)', 'Théâtre Romain']
      },
      wadi_rum: {
        name: 'Wadi Rum',
        desc: 'Une vallée désertique de sable rouge spectaculaire appelée "Vallée de la Lune", célèbre pour le camping et le jeep tour.',
        highlights: ['Dunes de Sable Rouge', 'Nuits Étoilées', 'Safaris en Jeep', 'Camping Bédouin']
      },
      dead_sea: {
        name: 'Mer Morte',
        desc: 'Le point le plus bas de la Terre. Les eaux ultra-salines permettent de flotter sans effort et ont des bienfaits thérapeutiques.',
        highlights: ['Flottaison Naturelle', 'Boue Curative', 'Complexes Hôteliers']
      },
      jerash: {
        name: 'Gérasa',
        desc: 'L\'une des cités romaines les mieux conservées hors d\'Italie, avec ses rues à colonnades et ses grands temples.',
        highlights: ['Arche d\'Hadrien', 'Place Ovale', 'Temple d\'Artémis', 'Théâtre Sud']
      },
      ajloun: {
        name: 'Château d\'Ajloun',
        desc: 'Un château islamique du XIIe siècle construit par Izz al-Din Usama, offrant une vue imprenable sur les collines boisées.',
        highlights: ['Tours de Défense', 'Vue Panoramique', 'Musée Intérieur']
      },
      aqaba: {
        name: 'Aqaba',
        desc: "La seule ville côtière de Jordanie sur la mer Rouge, réputée pour la plongée sous-marine de classe mondiale et ses récifs.",
        highlights: ['Plongée Sous-Marine', 'Planche à Voile', 'Fort d\'Aqaba', 'Dîner de fruits de mer']
      },
      madaba: {
        name: 'Madaba',
        desc: 'La "Ville des Mosaïques", abritant la célèbre carte en mosaïque du VIe siècle représentant la Terre Sainte.',
        highlights: ['Église Saint-Georges', 'Musée de la Mosaïque', 'Mont Nébo']
      },
      karak: {
        name: 'Château de Kérak',
        desc: 'Un imposant château fort des Croisés du XIIe siècle, l\'un des plus grands et des mieux conservés du Levant.',
        highlights: ['Galeries des Croisés', 'Donjon', 'Musée du Château']
      }
    }
  },
  es: {
    dir: 'ltr',
    align: 'text-left',
    alignOpposite: 'text-right',
    flexRowReverse: 'flex-row',
    langName: 'Español',
    
    // Header & Tabs
    transportTab: '🚌 Transporte',
    tourismTab: '🗺️ Turismo',
    sandboxBtn: 'Sandbox',
    signOut: 'Cerrar Sesión',
    clientAccount: 'Cuenta de Cliente',
    secLevel: 'GATEWAY · NIVEL DE SEGURIDAD 1',

    // Sector Public Transit
    transitHeader: 'Sector de Transporte Público de Jordania',
    busNetwork: 'Red de Autobuses Públicos de Jordania',
    totalRoutes: 'Total de Rutas',
    brtRoutes: 'Líneas Express BRT',
    intercityRoutes: 'Interurbano',
    avgFare: 'Tarifa Promedio',
    cityIrbid: 'Irbid',
    cityAmman: 'Amán',
    cityZarqa: 'Zarqa',

    // Transit Widgets
    liveRoute: 'Seguimiento de Ruta de Autobús en Vivo',
    gpsTracking: 'GPS · Seguimiento en Vivo',
    activeRoutesCount: 'Líneas Activas',
    weatherNow: 'Clima en Vivo',
    loading: 'Cargando clima...',
    failedWeather: 'Error al cargar el clima',
    feelsLike: 'Sensación',
    humidity: 'Humedad',
    windSpeed: 'km/h',
    temp: 'Temp',

    // Transit Tracker
    availSeats: 'Asientos Disponibles',
    seatsUnit: 'asientos',
    eta: 'Hora de Llegada',
    minutesUnit: 'min',
    departure: 'Salida',
    arrival: 'Llegada',
    completed: 'completado',
    liveTrack: 'Seguimiento',
    busLabel: 'Autobús Irbid - Amán',

    // Routes List / Detail
    routesOfCity: 'Líneas',
    routeCountUnit: 'líneas',
    brtFast: 'BRT Rápido',
    intercityLabel: 'Interurbano',
    stoppedLabel: 'Detenido',
    fareLabel: 'Tarifa',
    freqLabel: 'Frecuencia',
    stopsLabel: 'Paradas',
    mainStopLabel: 'Principal',
    fareUnit: 'JOD',

    // Tourism Panel
    tourismHeader: 'Sector Turístico · Portal de Turismo de Jordania',
    exploreSites: 'Explore los Sitios Turísticos de Jordania',
    scanSuccess: 'Escaneo de Código QR Exitoso · Turismo Inteligente IoT',
    connected: 'En línea',
    interactiveMap: 'Mapa Interactivo de Jordania',
    sitesCountUnit: 'sitios',
    calm: 'Tranquilo',
    moderate: 'Moderado',
    crowded: 'Concurrido',
    availSitesList: 'Sitios Disponibles',
    chooseSitePrompt: 'Seleccione un sitio en el mapa o en la lista',
    backBtn: 'Atrás',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',

    // Site Details
    entryFee: 'Tarifa de Entrada',
    openHours: 'Horario de Apertura',
    avgVisit: 'Duración de Visita',
    visitHoursUnit: 'horas',
    crowdPeak: 'Hora Pico',
    crowdLevelNow: 'Nivel de Afluencia Actual',
    notableLandmarks: 'Destacados',
    freeEntry: 'Gratis',
    twentyFourSeven: '24/7',

    // Types
    heritage: 'Patrimonio',
    nature: 'Naturaleza',
    adventure: 'Aventura',
    religious: 'Religioso',

    // Dynamic Site Texts
    sites: {
      petra: {
        name: 'Petra',
        desc: 'La antigua ciudad nabatea tallada en roca de color rosa rojizo, declarada Patrimonio de la Humanidad por la UNESCO.',
        highlights: ['Al-Khazneh (El Tesoro)', 'El Siq', 'Ad Deir (Monasterio)', 'Teatro Romano']
      },
      wadi_rum: {
        name: 'Wadi Rum',
        desc: 'Un espectacular valle desértico de arena roja conocido como el "Valle de la Luna", popular para paseos en jeep y acampadas.',
        highlights: ['Dunas de Arena Roja', 'Noches Estrelladas', 'Safaris en Jeep', 'Camping Beduino']
      },
      dead_sea: {
        name: 'Mar Muerto',
        desc: 'El punto más bajo de la Tierra. Las aguas ultra salinas le permiten flotar sin esfuerzo y tienen beneficios curativos para la piel.',
        highlights: ['Flotación Natural', 'Lodo Curativo', 'Resorts de Lujo']
      },
      jerash: {
        name: 'Gerasa',
        desc: 'Una de las ciudades romanas mejor conservadas fuera de Italia, con calles flanqueadas por columnas y templos imponentes.',
        highlights: ['Arco de Adriano', 'Plaza Oval', 'Templo de Artemisa', 'Teatro Sur']
      },
      ajloun: {
        name: 'Castillo de Ajlun',
        desc: 'Un castillo islámico del siglo XII construido por Izz al-Din Usama, que ofrece impresionantes vistas de las colinas boscosas.',
        highlights: ['Torres de Defensa', 'Vista Panorámica', 'Museo Interior']
      },
      aqaba: {
        name: 'Áqaba',
        desc: "La única ciudad costera de Jordania en el Mar Rojo, famosa por el buceo de clase mundial y sus hermosos arrecifes de coral.",
        highlights: ['Buceo de Superficie', 'Windsurf', 'Castillo de Áqaba', 'Restaurantes de Mariscos']
      },
      madaba: {
        name: 'Mádaba',
        desc: 'La "Ciudad de los Mosaicos", que alberga el famoso mapa de mosaico del siglo VI de la Tierra Santa.',
        highlights: ['Iglesia de San Jorge', 'Museo del Mosaico', 'Monte Nebo']
      },
      karak: {
        name: 'Castillo de Karak',
        desc: 'Un enorme castillo de los cruzados del siglo XII, uno de los más grandes y mejor conservados de toda la región de Levante.',
        highlights: ['Galerías de Cruzados', 'Torre del Homenaje', 'Museo del Castillo']
      }
    }
  },
  it: {
    dir: 'ltr',
    align: 'text-left',
    alignOpposite: 'text-right',
    flexRowReverse: 'flex-row',
    langName: 'Italiano',
    
    // Header & Tabs
    transportTab: '🚌 Trasporti',
    tourismTab: '🗺️ Turismo',
    sandboxBtn: 'Sandbox',
    signOut: 'Disconnetti',
    clientAccount: 'Account Cliente',
    secLevel: 'GATEWAY · LIVELLO DI SICUREZZA 1',

    // Sector Public Transit
    transitHeader: 'Settore Trasporti Pubblici Giordani',
    busNetwork: 'Rete Automobilistica Pubblica Giordana',
    totalRoutes: 'Totale Linee',
    brtRoutes: 'Linee BRT Rapide',
    intercityRoutes: 'Interurbano',
    avgFare: 'Tariffa Media',
    cityIrbid: 'Irbid',
    cityAmman: 'Amman',
    cityZarqa: 'Zarqa',

    // Transit Widgets
    liveRoute: 'Tracciamento Linea Autobus in Tempo Reale',
    gpsTracking: 'GPS · Tracciamento in Diretta',
    activeRoutesCount: 'Linee Attive',
    weatherNow: 'Meteo in Tempo Reale',
    loading: 'Caricamento meteo...',
    failedWeather: 'Impossibile caricare il meteo',
    feelsLike: 'Percepito',
    humidity: 'Umidità',
    windSpeed: 'km/h',
    temp: 'Temp',

    // Transit Tracker
    availSeats: 'Posti Disponibili',
    seatsUnit: 'posti',
    eta: 'Tempo di Arrivo',
    minutesUnit: 'min',
    departure: 'Partenza',
    arrival: 'Arrivo',
    completed: 'completato',
    liveTrack: 'Tracciamento Live',
    busLabel: 'Autobus Irbid - Amman',

    // Routes List / Detail
    routesOfCity: 'Linee',
    routeCountUnit: 'linee',
    brtFast: 'BRT Rapido',
    intercityLabel: 'Interurbano',
    stoppedLabel: 'Sospeso',
    fareLabel: 'Tariffa',
    freqLabel: 'Frequenza',
    stopsLabel: 'Fermate',
    mainStopLabel: 'Principale',
    fareUnit: 'JOD',

    // Tourism Panel
    tourismHeader: 'Settore Turistico · Portale del Turismo in Giordania',
    exploreSites: 'Esplora i Siti Turistici Giordani',
    scanSuccess: 'Scansione Codice QR Riuscita · Turismo Intelligente IoT',
    connected: 'Online',
    interactiveMap: 'Mappa Interattiva della Giordania',
    sitesCountUnit: 'siti',
    calm: 'Calmo',
    moderate: 'Moderato',
    crowded: 'Affollato',
    availSitesList: 'Siti Disponibili',
    chooseSitePrompt: 'Seleziona un sito dalla mappa o dall\'elenco',
    backBtn: 'Indietro',
    fullscreen: 'Schermo intero',
    exitFullscreen: 'Esci da schermo intero',

    // Site Details
    entryFee: 'Costo d\'Ingresso',
    openHours: 'Orari di Apertura',
    avgVisit: 'Durata della Visita',
    visitHoursUnit: 'ore',
    crowdPeak: 'Ora di Punta',
    crowdLevelNow: 'Livello di Affollamento Attuale',
    notableLandmarks: 'Punti Forti',
    freeEntry: 'Gratis',
    twentyFourSeven: '24/7',

    // Types
    heritage: 'Patrimonio',
    nature: 'Natura',
    adventure: 'Avventura',
    religious: 'Religioso',

    // Dynamic Site Texts
    sites: {
      petra: {
        name: 'Petra',
        desc: 'L\'antica città nabatea scolpita nella roccia rosa-rossa - patrimonio dell\'umanità dell\'UNESCO.',
        highlights: ['Al-Khazneh (Il Tesoro)', 'Il Siq', 'Ad Deir (Monastero)', 'Teatro Romano']
      },
      wadi_rum: {
        name: 'Wadi Rum',
        desc: 'Uno spettacolare deserto di sabbia rossa noto come "Valle della Luna", famoso per escursioni in jeep e campeggio.',
        highlights: ['Dune di Sabbia Rossa', 'Notti Stellate', 'Safari in Jeep', 'Campeggio Beduino']
      },
      dead_sea: {
        name: 'Mar Morto',
        desc: 'Il punto più basso della Terra. Le acque ricchissime di sale permettono di galleggiare senza sforzo e hanno proprietà terapeutiche.',
        highlights: ['Galleggiamento Naturale', 'Fanghi Curativi', 'Resort di Lusso']
      },
      jerash: {
        name: 'Gerasa',
        desc: 'Una delle città romane meglio conservate al mondo fuori dall\'Italia, con strade colonnate e templi maestosi.',
        highlights: ['Arco di Adriano', 'Piazza Ovale', 'Tempio di Artemide', 'Teatro Sud']
      },
      ajloun: {
        name: 'Castello di Ajloun',
        desc: 'Un castello islamico del XII secolo fatto costruire da Izz al-Din Usama, situato su colline ricche di boschi.',
        highlights: ['Torri Difensive', 'Vista Panoramica', 'Museo Interno']
      },
      aqaba: {
        name: 'Aqaba',
        desc: "L'unica città costiera della Giordania sul Mar Rosso, famosa per le immersioni di livello mondiale e la barriera corallina.",
        highlights: ['Snorkeling', 'Windsurf', 'Forte di Aqaba', 'Ristoranti di Pesce']
      },
      madaba: {
        name: 'Madaba',
        desc: 'La "Città dei Mosaici" — celebre per la mappa musiva della Terra Santa risalente al VI secolo d.C.',
        highlights: ['Chiesa di San Giorgio', 'Museo del Mosaico', 'Monte Nebo']
      },
      karak: {
        name: 'Castello di Karak',
        desc: 'Un imponente castello dei Crociati del XII secolo, uno dei più grandi e spettacolari di tutto il Levante.',
        highlights: ['Gallerie dei Crociati', 'Mastio', 'Museo del Castello']
      }
    }
  }
};
