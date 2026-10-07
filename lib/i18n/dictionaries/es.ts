import type { Dictionary } from './en'

/**
 * Spanish (Colombia). Written for Colombian readers: "tú", and the terms local
 * banks use — cuota, plazo, cuota inicial, abono a capital, retoma, E.A.
 */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export const es: Dictionary = {
  common: {
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    signIn: 'Iniciar sesión',
    reset: 'Restablecer',
    loading: 'Cargando',
    open: 'Abrir',
    delete: 'Eliminar',
    tryAgain: 'Intentar de nuevo',
    viewAll: 'Ver todo',
    none: 'Ninguna',
    total: 'Total',
    name: 'Nombre',
    perMonthShort: '/mes',
    years: (n: number) => `${n} ${plural(n, 'año', 'años')}`,
    months: (n: number) => `${n} ${plural(n, 'mes', 'meses')}`,
  },

  meta: {
    siteTitle: 'SumAI — Calculadoras financieras que se explican solas',
    siteDescription:
      'Calculadoras de crédito, hipoteca, vehículo, ahorro, inversión y pago de deudas, con una explicación clara de cada resultado.',
  },

  countries: {
    label: 'País',
    co: 'Colombia',
    us: 'Estados Unidos',
    ca: 'Canadá',
  },

  nav: {
    calculators: 'Calculadoras',
    compareRates: 'Comparar tasas',
    howItWorks: 'Cómo funciona',
    pricing: 'Precios',
    dashboard: 'Panel',
    scenarios: 'Escenarios',
    goals: 'Metas',
    profile: 'Perfil',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    menu: {
      featuredTitle: 'Compara ofertas de crédito',
      featuredBody: 'Pon hasta tres ofertas lado a lado y mira cuánto cuesta realmente cada una, con comisiones incluidas.',
      featuredCta: 'Abrir la comparación',
      viewAll: 'Ver todas las calculadoras',
    },
  },

  footer: {
    tagline: 'Calculadoras financieras que explican sus propios números.',
    calculators: 'Calculadoras',
    compare: 'Comparar',
    company: 'Empresa',
    about: 'Nosotros',
    mortgages: 'Créditos hipotecarios',
    carLoans: 'Créditos de vehículo',
    personalLoans: 'Créditos de libre inversión',
    savingsAccounts: 'Cuentas de ahorros',
    disclaimer:
      'SumAI ofrece información financiera general y estimaciones, no asesoría financiera. Las tasas son ilustrativas y no constituyen ofertas de crédito. Las cifras dependen de los datos que ingreses y de los supuestos indicados junto a cada resultado.',
  },

  calculators: {
    loan: {
      title: 'Calculadora de crédito',
      shortTitle: 'Crédito',
      tagline: 'Cuota, intereses y plazo de cualquier crédito',
      description:
        'Calcula la cuota, el total de intereses y la fecha de pago de cualquier crédito, y mira qué pasa si haces abonos a capital.',
    },
    mortgage: {
      title: 'Calculadora de crédito hipotecario',
      shortTitle: 'Hipotecario',
      tagline: 'El costo mensual real de una vivienda',
      description:
        'El costo mensual completo de una vivienda: capital, intereses, impuestos, seguros y administración, y cuánto te alcanza.',
    },
    'car-loan': {
      title: 'Calculadora de crédito de vehículo',
      shortTitle: 'Vehículo',
      tagline: 'Financiación con impuestos y retoma incluidos',
      description:
        'Financia un vehículo incluyendo impuestos, gastos y retoma, y descubre cuándo dejas de deber más de lo que vale el carro.',
    },
    investment: {
      title: 'Calculadora de inversión',
      shortTitle: 'Inversión',
      tagline: 'En qué se puede convertir invertir con constancia',
      description:
        'Proyecta en qué se pueden convertir tus aportes periódicos, después de comisiones, y cuánto valdrían en dinero de hoy.',
    },
    savings: {
      title: 'Calculadora de ahorro',
      shortTitle: 'Ahorro',
      tagline: 'Alcanza una meta de ahorro o proyecta tu saldo',
      description:
        'Haz crecer tu ahorro a una tasa dada, o calcula al revés cuánto debes ahorrar para llegar a una meta.',
    },
    'debt-payoff': {
      title: 'Calculadora para salir de deudas',
      shortTitle: 'Deudas',
      tagline: 'Avalancha o bola de nieve, comparadas con honestidad',
      description:
        'Compara los métodos avalancha y bola de nieve con todas tus deudas, y mira cuánto cuesta cada uno en intereses y tiempo.',
    },
  },

  categories: {
    borrowing: { label: 'Créditos', description: 'Préstamos, hipotecas y financiación' },
    growing: { label: 'Crecer tu dinero', description: 'Ahorrar e invertir en el tiempo' },
    planning: { label: 'Planear', description: 'Salir de deudas y cumplir metas' },
  },

  home: {
    titleLead: 'Decisiones de dinero,',
    titleEmphasis: 'con las cuentas a la vista',
    cards: {
      mortgage: {
        eyebrow: 'Calculadora hipotecaria',
        title: 'Tu costo mensual,',
        titleAccent: 'al detalle',
        monthly: 'Cuota mensual',
        interest: 'Total de intereses',
        payoff: 'Pagado en',
        breakdown: 'A dónde va cada cuota',
        principalInterest: 'Capital e intereses',
        tax: 'Impuesto predial',
        insurance: 'Seguro',
        byYear: 'Capital vs. intereses, año a año',
        principal: 'Capital',
        interestLabel: 'Intereses',
        homePrice: (price: string, down: string) => `Vivienda de ${price} · ${down} de cuota inicial`,
      },
      rates: {
        eyebrow: 'Referencias del mercado',
        title: 'Tasas',
        titleAccent: 'hoy',
        mortgage: 'Hipotecario',
        carLoan: 'Vehículo',
        personalLoan: 'Libre inversión',
        savings: 'Ahorro',
        inflation: 'Inflación',
        note: 'Referencias ilustrativas, no ofertas',
      },
      savings: {
        eyebrow: 'Plan de ahorro',
        title: 'En qué se convierte',
        titleAccent: 'tu ahorro',
        balance: (duration: string) => `Saldo después de ${duration}`,
        deposited: 'Tus depósitos',
        interest: 'Intereses ganados',
        apy: 'Rendimiento efectivo',
        growth: 'Saldo en el tiempo',
        perMonth: (amount: string) => `${amount} al mes`,
      },
    },
    subtitle: 'Calculadoras financieras que te muestran qué significa cada número.',
    browse: 'Ver calculadoras',
    scrollHint: 'Desliza para explorar',
    advantages: {
      titleLead: 'Por qué SumAI',
      titleEmphasis: 'juega a tu favor.',
      tablist: 'Por qué SumAI',
      previous: 'Razón anterior',
      next: 'Siguiente razón',
      position: (current: number, total: number) => `${current} de ${total}`,
      rate: {
        title: 'Buscamos la mejor tasa de interés',
        body: 'Seguimos las tasas de las entidades de tu mercado y te mostramos la más baja a la que puedes acceder — expresada como se usa en tu país, para que compares siempre en igualdad de condiciones.',
        tab: 'La mejor tasa',
        cta: 'Comparar tasas',
        lender: (letter: string) => `Entidad ${letter}`,
        best: 'Mejor tasa',
        note: 'Tasas ilustrativas',
      },
      fit: {
        title: 'Comparamos todos los créditos para mostrarte el que mejor se ajusta a ti',
        body: 'La tasa es solo una parte del costo. Evaluamos comisiones, plazo y requisitos frente a tus números, y te mostramos el crédito que mejor te conviene — no el que paga por aparecer.',
        tab: 'El crédito para ti',
        cta: 'Comparar ofertas',
        heading: 'Tu mejor opción',
        criteria: ['Menor costo total', 'Sin comisiones ocultas', 'Plazo a tu medida', 'Requisitos que cumples'],
        verdict: 'El que mejor se ajusta a ti',
      },
      eligibility: {
        tab: 'Dónde calificas',
        title: 'Te decimos dónde calificas antes de solicitar',
        body: 'Agrega tus ingresos y tu puntaje de crédito y los comparamos con los requisitos de cada entidad, para que solo solicites donde es probable que te aprueben. Nada de esto toca tu historial crediticio.',
        cta: 'Ver dónde califico',
        profile: 'Tu perfil',
        income: 'Ingreso mensual',
        score: 'Puntaje de crédito',
        debt: 'Endeudamiento',
        likely: 'Probablemente calificas',
        unlikely: 'Puede que no califiques',
      },
    },
    carousel: {
      title: 'Cada decisión de dinero, con sus cuentas.',
      viewAll: 'Ver todas las calculadoras',
      previous: 'Calculadoras anteriores',
      next: 'Siguientes calculadoras',
      open: (name: string) => `Abrir la ${name.toLowerCase()}`,
      cards: {
        loan: {
          body: 'Tu cuota, el total de intereses y la fecha exacta de pago — y lo que cambia si abonas un poco más cada mes.',
        },
        mortgage: {
          body: 'Capital, intereses, predial, seguros y administración en una sola cifra, y cuánta vivienda te alcanza con tus ingresos.',
        },
        'car-loan': {
          body: 'Impuestos, gastos y tu retoma incluidos, con el mes en que por fin debes menos de lo que vale el carro.',
        },
        investment: {
          body: 'Descubre en qué se convierten tus aportes mensuales después de comisiones, y cuánto valdrán en dinero de hoy.',
        },
        savings: {
          body: 'Haz crecer tu saldo con el rendimiento real de tu banco, o calcula al revés cuánto debes ahorrar cada mes.',
        },
        'debt-payoff': {
          body: 'Reúne todas tus tarjetas y créditos, y compara avalancha y bola de nieve para ver cuál ahorra más y cuál cierra deudas antes.',
        },
      },
    },
    // Testimonios de ejemplo hasta tener comentarios reales de clientes; la
    // sección muestra la nota `sample` mientras estén.
    testimonials: {
      eyebrow: 'Lo que dicen',
      title: 'Decisiones que se sienten bien',
      sample: 'Testimonios de ejemplo',
      previous: 'Testimonio anterior',
      next: 'Siguiente testimonio',
      show: (name: string) => `Ver lo que dijo ${name}`,
      items: [
        {
          name: 'Daniel Restrepo',
          role: 'Compró su primera vivienda',
          quote: 'Por fin entendí cuánto me iba a costar el crédito hipotecario de verdad, no solo la cuota mensual.',
        },
        {
          name: 'Andrés Gómez',
          role: 'Pagando dos tarjetas de crédito',
          quote: 'Ver la avalancha y la bola de nieve lado a lado hizo obvia la decisión. Saldré de deudas un año antes.',
        },
        {
          name: 'Valentina Ortiz',
          role: 'Gerente comercial',
          quote: 'SumAI me mostró un crédito dos puntos más barato que el que me ofrecía mi banco, y me explicó por qué.',
        },
        {
          name: 'Sofía Ramírez',
          role: 'Ahorrando para un año sabático',
          quote: 'La calculadora de ahorro convirtió una meta vaga en un monto que separo cada mes.',
        },
        {
          name: 'Laura Castillo',
          role: 'Comprando su primer carro',
          quote: 'Supe dónde calificaba antes de solicitar, así que solicité una sola vez y me aprobaron.',
        },
      ],
    },
    principles: [
      {
        title: 'Las cuentas son exactas',
        body: 'Cada cifra sale de una fórmula probada, no de un modelo. Calcula dos veces y obtendrás el mismo resultado.',
      },
      {
        title: 'La explicación es clara',
        body: 'Pregunta qué significa un resultado y recibe una respuesta en palabras sencillas, basada solo en los números de tu pantalla.',
      },
      {
        title: 'Tu mercado, tus convenciones',
        body: 'En Colombia las tasas se expresan efectivas anuales; en Estados Unidos, nominales. Manejamos ambas correctamente.',
      },
    ],
  },

  about: {
    metaTitle: 'Nosotros',
    metaDescription: 'Por qué existe SumAI y las reglas que sigue.',
    title: 'Sobre SumAI',
    paragraphs: [
      'La mayoría de las calculadoras financieras te dan un número y ya. Ves la cuota mensual, pero no por qué es esa, qué supone ni qué la haría cambiar.',
      'SumAI parte de la idea contraria. Cada cálculo muestra sus cuentas. Cada resultado viene con los supuestos que lo explican. Y cuando quieres entender qué significa una cifra para ti, puedes preguntar — y recibir una respuesta basada solo en los números que tienes enfrente.',
    ],
    rulesTitle: 'Las reglas que seguimos',
    rules: [
      'Las cuentas son exactas y están probadas. Un modelo nunca calcula una cifra.',
      'Explicamos; no asesoramos. Nada de lo que ves aquí es una recomendación.',
      'Cada tasa indica cómo se expresa, porque la convención cambia el costo.',
      'Los productos se ordenan por su costo total para ti, y la publicidad siempre está señalada.',
    ],
    whereTitle: 'Dónde operamos',
    whereBody:
      'Empezamos en Colombia, Estados Unidos y Canadá. Cada mercado tiene su propia moneda, terminología y reglas de crédito, no una copia traducida de otro.',
  },

  howItWorks: {
    metaTitle: 'Cómo funciona',
    metaDescription: 'Cómo SumAI calcula, explica y compara.',
    title: 'Cómo funciona',
    subtitle: 'Cinco pasos, y los tres primeros no necesitan cuenta.',
    steps: [
      {
        title: 'Ingresa tus números',
        body: 'Elige una calculadora y llena lo que sabes. Los resultados se actualizan mientras escribes — no hay botón que buscar.',
      },
      {
        title: 'Mira el panorama completo',
        body: 'Más allá de la cuota: el total de intereses, el plan de pagos y a dónde va realmente cada pago.',
      },
      {
        title: 'Prueba escenarios',
        body: 'Con un clic ves qué cambiaría con un plazo más corto, una tasa menor o un abono extra cada mes — con sus pros y contras.',
      },
      {
        title: 'Pregunta qué significa',
        body: 'Recibe una lectura clara de tu resultado. La explicación usa solo las cifras calculadas para ti.',
      },
      {
        title: 'Guarda y compara',
        body: 'Inicia sesión para guardar escenarios, compararlos lado a lado y seguir tus metas en el tiempo.',
      },
    ],
    rateNoteTitle: 'Una nota sobre las tasas',
    rateNoteBody:
      'Una tasa del 12% no significa lo mismo en todas partes. En Colombia los bancos expresan la tasa efectiva anual (E.A.), que ya incluye la capitalización. En Estados Unidos se expresa una tasa nominal anual capitalizada mensualmente, que cuesta un poco más de lo que parece. Hacemos la conversión correcta para tu mercado, y cada tasa que mostramos indica de qué tipo es.',
    start: 'Empieza con una calculadora',
  },

  pricing: {
    metaTitle: 'Precios',
    metaDescription:
      'Todas las calculadoras son gratis. Plus agrega escenarios guardados, metas y el asesor financiero.',
    title: 'Precios',
    subtitle: 'Las calculadoras son gratis, y siempre lo serán.',
    mostFlexible: 'El más completo',
    tiers: {
      free: {
        name: 'Gratis',
        price: '$0',
        cadence: 'para siempre',
        description: 'Todas las calculadoras y escenarios, sin necesidad de cuenta.',
        features: [
          'Las seis calculadoras',
          'Escenarios "¿qué pasa si?"',
          'Planes de pago completos',
          'Comparación de tasas',
          'Tres explicaciones con IA al día',
        ],
        cta: 'Empezar a calcular',
      },
      plus: {
        name: 'Plus',
        price: 'US$6',
        cadence: 'al mes',
        description: 'Para quienes planean algo grande durante meses, no minutos.',
        features: [
          'Todo lo del plan Gratis',
          'Escenarios guardados ilimitados',
          'Comparación de escenarios lado a lado',
          'Metas con seguimiento de progreso',
          'Análisis con IA ilimitado y asesor financiero',
        ],
        cta: 'Probar Plus',
      },
    },
  },

  calculatorIndex: {
    metaTitle: 'Todas las calculadoras',
    metaDescription:
      'Calculadoras de crédito, hipoteca, vehículo, inversión, ahorro y deudas — cada una con el detalle completo y escenarios.',
    title: 'Calculadoras',
    intro:
      'Cada calculadora muestra sus cuentas completas, los supuestos que usa y qué cambiaría si cambias una sola cosa.',
    openCalculator: 'Abrir calculadora',
  },

  calculatorHeader: {
    home: 'Inicio',
    calculators: 'Calculadoras',
    showingFigures: (country: string, currency: string, effective: boolean) =>
      `Cifras para ${country} en ${currency}. Aquí las tasas se expresan ${
        effective ? 'como tasa efectiva anual' : 'como tasa nominal anual, capitalizada mensualmente'
      }.`,
  },

  calculatorForm: {
    title: 'Tus números',
    saveScenario: 'Guardar escenario',
  },

  whatIf: {
    title: '¿Y si cambias una sola cosa?',
    paymentChangesBy: 'La cuota cambia en',
    saves: 'Ahorras',
    costs: 'Cuesta',
    options: {
      'shorter-term': { label: 'Plazo más corto', description: 'El mismo crédito pagado en 12 meses menos' },
      'extra-payment': {
        label: 'Abona un poco más',
        description: 'Un abono a capital del 10% de la cuota en cada pago',
      },
      'better-rate': {
        label: 'Un punto menos',
        description: 'El mismo crédito con una tasa un punto porcentual más baja',
      },
      'fifteen-year': { label: 'Plazo de 15 años', description: 'Cuota más alta, muchos menos intereses' },
      'twenty-percent-down': {
        label: '20% de cuota inicial',
        description: 'Suficiente para evitar el seguro hipotecario',
      },
      'extra-200': {
        label: 'Abono a capital',
        description: 'Un monto adicional abonado a capital cada mes',
      },
      'rate-drop': {
        label: 'Medio punto menos',
        description: 'Cómo se vería una compra de cartera a mejor tasa',
      },
    },
  },

  scenarioPanel: {
    saveTitle: 'Guarda este cálculo',
    signInPrompt: 'Inicia sesión para guardar este escenario y compararlo con otros después.',
    yourScenarios: 'Tus escenarios',
    saveCurrent: 'Guardar actual',
    emptyTitle: 'Aún no hay nada guardado',
    emptyDescription: 'Guarda este cálculo para compararlo con otras opciones.',
    saved: (date: string) => `Guardado el ${date}`,
    load: 'Cargar',
    compare: 'Comparar',
    dialogTitle: 'Guardar este escenario',
    dialogDescription: 'Ponle un nombre que reconozcas después.',
    namePlaceholder: 'p. ej. 30% de cuota inicial, 15 años',
  },

  related: {
    title: 'Calculadoras relacionadas',
  },

  charts: {
    amortizationCaption: 'A dónde va cada año de pagos',
    principal: 'Capital',
    interest: 'Intereses',
    yearShort: 'Año',
    monthShort: 'Mes',
    year: 'Año',
    month: 'Mes',
    growthCaption: 'Lo que aportaste y en qué se convirtió',
    contributed: 'Lo que aportaste',
    growth: 'Rendimientos',
    breakdownCaption: 'De qué se compone la cuota',
    comparisonCaption: 'Costo total por opción',
  },

  loan: {
    amount: 'Monto del crédito',
    frequency: 'Frecuencia de pago',
    frequencies: { monthly: 'Mensual', biweekly: 'Quincenal', weekly: 'Semanal' },
    paymentLabels: {
      monthly: 'Cuota mensual',
      biweekly: 'Cuota quincenal',
      weekly: 'Cuota semanal',
      annually: 'Cuota anual',
    },
    extra: 'Abono a capital en cada pago',
    extraHint: 'Va directo a capital, así que acorta el crédito.',
    fee: 'Comisión de estudio de crédito',
    paymentsTotal: (n: number) => `${n} cuotas en total`,
    totalInterest: 'Total de intereses',
    totalPaid: 'Total pagado',
    includingFees: 'Incluye comisiones',
    effectiveRate: 'Tasa efectiva anual',
    effectiveRateHint: 'El costo real por año, con la capitalización incluida.',
    interestSaved: 'Intereses que te ahorras con los abonos',
  },

  mortgage: {
    homePrice: 'Valor de la vivienda',
    ofPrice: (pct: string) => `${pct} del valor`,
    propertyTax: 'Impuesto predial / año',
    insurance: 'Seguro de hogar / año',
    hoa: 'Administración / mes',
    extra: 'Abono a capital / mes',
    totalMonthly: 'Cuota mensual total',
    totalMonthlyDetail: 'Capital, intereses, impuestos, seguros y administración',
    borrowed: 'Monto del crédito',
    totalInterest: 'Total de intereses',
    paidOffIn: 'Pagado en',
    monthsEarly: (n: number) => `${n} meses antes`,
    segments: {
      principalAndInterest: 'Capital e intereses',
      propertyTax: 'Impuesto predial',
      homeInsurance: 'Seguro de hogar',
      mortgageInsurance: 'Seguro hipotecario',
      hoa: 'Administración',
    },
    miNotice: (threshold: string, years: number | null) =>
      `Tu cuota inicial es menor al ${threshold}, así que los bancos suelen cobrar un seguro hipotecario.${
        years ? ` A este ritmo deja de aplicar en unos ${years} años.` : ''
      }`,
  },

  carLoan: {
    vehiclePrice: 'Precio del vehículo',
    cashDown: 'Cuota inicial',
    tradeInValue: 'Valor de la retoma',
    tradeInOwed: 'Saldo pendiente',
    termOption: (months: number) => `${months} meses (${months / 12} ${months === 12 ? 'año' : 'años'})`,
    salesTax: 'Impuestos',
    fees: 'Matrícula y gastos',
    amountFinanced: 'Monto financiado',
    totalInterest: 'Total de intereses',
    segments: { vehicle: 'Vehículo', salesTax: 'Impuestos', fees: 'Gastos', interest: 'Intereses' },
    negativeEquity: (amount: string) =>
      `Debes ${amount} más de lo que vale tu carro de retoma. Ese monto se suma a este crédito.`,
    underwater: 'Al firmar, deberías más de lo que vale el carro.',
    catchUp: (months: number) => ` A este ritmo te pones al día en unos ${months} meses.`,
    noCatchUp: ' A este ritmo es posible que no te pongas al día antes de terminar el crédito.',
  },

  investment: {
    startingAmount: 'Monto inicial',
    monthlyContribution: 'Aporte mensual',
    expectedReturn: 'Rentabilidad anual esperada',
    expectedReturnHint:
      'Los promedios de largo plazo no son garantía. Prueba una cifra más baja para ver un escenario prudente.',
    yearsInvested: 'Años de inversión',
    fees: 'Comisión anual',
    feesHint: 'La comisión de administración del fondo, cobrada cada año sobre todo el saldo.',
    inflation: 'Inflación',
    raise: 'Aumentar los aportes cada año en',
    balanceAfter: (years: number) => `Saldo después de ${years} años`,
    multiple: (x: number) => `${x} veces lo que aportaste`,
    todaysMoney: 'En dinero de hoy',
    todaysMoneyHint: 'El saldo final ajustado por inflación: lo que compraría hoy.',
    contributed: 'Tus aportes',
    lostToFees: 'Pagado en comisiones',
    rangeTitle: 'Rango de resultados',
    rangeIntro: 'La rentabilidad varía. El mismo plan con tres puntos menos y más:',
    weaker: 'Menor',
    expected: 'Esperado',
    stronger: 'Mayor',
    doubling: (years: string) =>
      `Con esta rentabilidad neta, el dinero se duplica más o menos cada ${years} años.`,
  },

  savings: {
    project: 'Proyectar un saldo',
    target: 'Alcanzar una meta',
    targetAmount: 'Meta de ahorro',
    startingBalance: 'Saldo inicial',
    monthlyDeposit: 'Ahorro mensual',
    interestRate: 'Tasa de interés',
    timeFrame: 'Plazo',
    compounding: 'Capitalización',
    compoundingOptions: { daily: 'Diaria', monthly: 'Mensual', quarterly: 'Trimestral', annually: 'Anual' },
    depositNeeded: 'Ahorro mensual necesario',
    toReach: (amount: string, duration: string) => `Para llegar a ${amount} en ${duration}`,
    atCurrentDeposit: 'Con tu ahorro actual',
    projectedBalance: 'Saldo proyectado',
    apy: 'Rendimiento efectivo anual',
    apyHint: 'La tasa ofrecida una vez incluida la capitalización.',
    balanceAfter: (duration: string) => `Saldo después de ${duration}`,
    youDeposit: 'Tus depósitos',
    interestEarned: 'Intereses ganados',
    chartCaption: 'Depósitos e intereses en el tiempo',
  },

  debtPayoff: {
    formTitle: 'Tus deudas',
    debtNameLabel: (i: number) => `Nombre de la deuda ${i}`,
    remove: (name: string) => `Eliminar ${name}`,
    balance: 'Saldo',
    rate: 'Tasa',
    minimum: 'Pago mínimo',
    addDebt: 'Agregar una deuda',
    newDebtName: (n: number) => `Deuda ${n}`,
    defaultNames: {
      'card-1': 'Tarjeta de crédito',
      'card-2': 'Tarjeta de almacén',
      student: 'Crédito educativo',
    },
    budget: 'Total que puedes pagar cada mes',
    budgetHint: (minimums: string) =>
      `Los pagos mínimos suman ${minimums}. Todo lo que pagues por encima acelera el proceso.`,
    avalanche: 'Mayor tasa primero',
    snowball: 'Menor saldo primero',
    debtFreeIn: 'Sin deudas en',
    totalInterest: 'Total de intereses',
    totalPaid: 'Total pagado',
    compareTitle: '¿Avalancha o bola de nieve?',
    compareSaves: (amount: string) =>
      `Pagar primero la tasa más alta te ahorra ${amount} en intereses. Pagar primero el saldo más pequeño cierra tu primera deuda antes, y a algunas personas eso les ayuda a no rendirse.`,
    compareSame:
      'Con estas deudas, los dos métodos cuestan casi lo mismo. Elige el que vayas a mantener.',
    compareCaption: 'Total de intereses por método',
    payoffOrder: 'Orden de pago',
    colDebt: 'Deuda',
    colPaidOffAfter: 'Pagada en',
    colInterest: 'Intereses pagados',
  },

  compare: {
    metaTitle: 'Comparar ofertas de crédito',
    metaDescription:
      'Pon hasta tres ofertas de crédito lado a lado y compara cuánto cuesta cada una en total, comisiones incluidas.',
    title: 'Comparar ofertas de crédito',
    intro:
      'La tasa más baja no siempre es el crédito más barato. Ingresa las ofertas que tienes y mira cuánto cuesta cada una durante todo el plazo, comisiones incluidas.',
    amount: 'Monto a pedir',
    offerName: 'Nombre de la oferta',
    offer: (letter: string) => `Oferta ${letter}`,
    term: 'Plazo',
    termOption: (months: number) => `${months} meses`,
    upfrontFees: 'Comisiones iniciales',
    monthlyPayment: 'Cuota mensual',
    totalInterest: 'Total de intereses',
    totalCost: 'Costo total',
    moreThanCheapest: (amount: string) => `${amount} más que la oferta más barata`,
    cheapest: 'La más barata',
    chartTitle: 'Costo total lado a lado',
    chartCaption: 'Todo lo que pagarías, comisiones incluidas',
  },

  ai: {
    title: 'Qué significa esto',
    explainButton: 'Explicar mi resultado',
    analysing: 'Analizando tu resultado',
    unavailable: 'El análisis no está disponible en este momento',
    askFollowUp: 'Haz otra pregunta',
    intro: 'Recibe una explicación clara de lo que estos números significan para ti.',
    disclaimer:
      'Esto es información general, no asesoría financiera. Las cifras son estimaciones basadas en los datos mostrados.',
    chatPlaceholder: 'Pregunta sobre tus números…',
    chatEmpty: 'Pregunta sobre un escenario, una meta o qué significa una cifra.',
    chatError: 'Lo siento — no pude responder eso en este momento.',
    yourQuestion: 'Tu pregunta',
    send: 'Enviar',
    coachTitle: 'Tu asesor financiero',
    openCoach: 'Abrir asesor financiero',
    explaining: (term: string) => `Explicando ${term}`,
    forExample: 'Por ejemplo',
    explanationUnavailable: 'Esa explicación no está disponible en este momento.',
    confidence: { high: 'Confianza alta', medium: 'Confianza media', low: 'Confianza baja' },
  },

  products: {
    hubMetaTitle: 'Comparar tasas',
    hubMetaDescription:
      'Créditos hipotecarios, de vehículo, de libre inversión y cuentas de ahorros, comparados por su costo total.',
    hubTitle: 'Comparar tasas',
    hubIntro: (country: string) =>
      `Productos disponibles en ${country}, ordenados por lo que te costarían — no por quién paga por aparecer.`,
    benchmark: 'Referencia del mercado alrededor de',
    categories: {
      mortgage: {
        title: 'Créditos hipotecarios',
        body: 'Créditos de vivienda comparados por lo que cuestan durante todo el plazo.',
        intro:
          'Tasas de crédito de vivienda de las entidades de tu mercado, ordenadas por lo que te costarían durante todo el plazo.',
        calculatorLabel: 'Abrir la calculadora hipotecaria',
        metaTitle: 'Comparar créditos hipotecarios',
        metaDescription: 'Tasas de crédito hipotecario en tu país, ordenadas por costo total.',
      },
      'car-loan': {
        title: 'Créditos de vehículo',
        body: 'Financiación de vehículos con comisiones e intereses totales a la vista.',
        intro:
          'Financiación de vehículos de bancos y entidades, ordenada por costo total con comisiones incluidas.',
        calculatorLabel: 'Abrir la calculadora de vehículo',
        metaTitle: 'Comparar créditos de vehículo',
        metaDescription: 'Tasas de crédito de vehículo, ordenadas por costo total con comisiones.',
      },
      'personal-loan': {
        title: 'Créditos de libre inversión',
        body: 'Créditos sin garantía, ordenados por costo total y no por la tasa anunciada.',
        intro:
          'Créditos para consolidar deudas o cubrir un gasto grande, ordenados por costo total.',
        calculatorLabel: 'Abrir la calculadora de crédito',
        metaTitle: 'Comparar créditos de libre inversión',
        metaDescription: 'Tasas y comisiones de libre inversión, ordenadas por lo que realmente cuestan.',
      },
      savings: {
        title: 'Cuentas de ahorros',
        body: 'Dónde rinde más tu dinero, con el rendimiento que realmente recibes.',
        intro:
          'Dónde pueden rendir más tus ahorros, con cada tasa expresada como el rendimiento que realmente recibes.',
        calculatorLabel: 'Abrir la calculadora de ahorro',
        metaTitle: 'Comparar cuentas de ahorros',
        metaDescription: 'Tasas de cuentas de ahorros en tu país, con el rendimiento efectivo.',
      },
    },
    knowNumbers:
      'Primero conoce tus números — la calculadora muestra qué significa cada tasa para tu cuota.',
    emptyTitle: 'Aún no hay productos para mostrar',
    emptyDescription: (category: string, country: string) =>
      `Por ahora no tenemos ${category.toLowerCase()} para ${country}. Vuelve pronto.`,
    footnote:
      'Las tasas son ilustrativas y no constituyen ofertas de crédito. Tu tasa depende de tu perfil crediticio y de la entidad. Ordenado por costo total estimado y luego por qué tan bien se ajusta cada producto; la publicidad siempre está señalada.',
    featured: 'Destacado',
    provider: 'Entidad',
    estimatedPayment: 'Cuota estimada',
    amount: 'Monto',
    term: 'Plazo',
    fee: 'Comisión',
    rate: 'Tasa',
    payment: 'Cuota',
    eligibility: 'Requisitos',
    viewOffer: 'Ver oferta',
    view: 'Ver',
    from: 'Desde',
    productCount: (n: number) => `${n} ${plural(n, 'producto', 'productos')}`,
    rateBasis: { effective: 'E.A.', nominal: 'nominal' },
    rateTypes: { fixed: 'fija', variable: 'variable' },
    effectiveHint: 'Tasa efectiva anual: el costo real por año, con la capitalización incluida.',
    nominalHint: 'Tasa nominal anual, capitalizada mensualmente.',
    eligibilityNotChecked: 'Requisitos sin verificar',
    eligibilityNotCheckedHint: 'Agrega tus ingresos y tu puntaje de crédito para ver si cumples.',
    likelyEligible: 'Probablemente cumples',
    mayNotQualify: 'Puede que no cumplas',
    requirementsNotMet: 'No cumples los requisitos indicados.',
    comparisonTitle: 'Costo total comparado',
    comparisonIntro: (amount: string, years: number, country: string) =>
      `Un crédito de ${amount} a ${years} años en ${country}, con comisiones incluidas.`,
    comparisonCaption: 'Lo que cuesta cada opción en total',
    lowestCost: 'Menor costo',
    feeSuffix: (amount: string) => ` · comisión de ${amount}`,
    overTerm: (amount: string) => `+${amount} durante el plazo`,
    reasons: {
      lowestRate: 'La tasa más baja de estos resultados',
      noFee: 'Sin comisión de estudio',
      meetsRequirements: 'Cumples los requisitos indicados',
      needsScore: (score: number) => `Requiere un puntaje de crédito de ${score}`,
      incomeBelow: 'Ingresos por debajo del mínimo indicado',
      debtAbove: 'Tus deudas actuales superan el límite indicado',
    },
  },

  fields: {
    loan: {
      payment: 'Cuota',
      totalInterest: 'Total de intereses',
      totalPaid: 'Total pagado',
      payoffPeriods: 'Plazo de pago',
    },
    mortgage: {
      monthlyTotal: 'Cuota mensual',
      totalInterest: 'Total de intereses',
      loanAmount: 'Monto del crédito',
      payoffPeriods: 'Plazo de pago',
    },
    'car-loan': {
      monthlyPayment: 'Cuota',
      amountFinanced: 'Monto financiado',
      totalInterest: 'Total de intereses',
    },
    investment: {
      finalBalance: 'Saldo final',
      realBalance: 'En dinero de hoy',
      totalGrowth: 'Rendimientos',
      totalFees: 'Comisiones',
    },
    savings: {
      finalBalance: 'Saldo final',
      totalInterest: 'Intereses ganados',
      monthsToTarget: 'Tiempo hasta la meta',
    },
    'debt-payoff': {
      monthsToDebtFree: 'Sin deudas en',
      totalInterest: 'Total de intereses',
      totalPaid: 'Total pagado',
    },
  },

  inputKeys: {
    amount: 'Monto',
    annualRate: 'Tasa anual',
    termMonths: 'Plazo (meses)',
    frequency: 'Frecuencia',
    extraPayment: 'Abono a capital',
    originationFee: 'Comisión de estudio',
    homePrice: 'Valor de la vivienda',
    downPayment: 'Cuota inicial',
    vehiclePrice: 'Precio del vehículo',
    initialAmount: 'Monto inicial',
    contribution: 'Aporte',
    deposit: 'Depósito',
    years: 'Años',
    months: 'Meses',
    monthlyBudget: 'Presupuesto mensual',
    strategy: 'Método',
  },

  scenarios: {
    metaTitle: 'Escenarios',
    title: 'Escenarios',
    intro: 'Cálculos guardados. Elige dos de la misma calculadora para compararlos.',
    emptyTitle: 'Aún no hay escenarios',
    emptyDescription: 'Usa cualquier calculadora y guarda el resultado para empezar a comparar opciones.',
    openCalculator: 'Abrir una calculadora',
    pickOneMore: 'Elige otro escenario de la misma calculadora para comparar.',
    comparing: 'Comparando los dos escenarios seleccionados abajo.',
    incompatible: 'Estos escenarios son de calculadoras distintas y no se pueden comparar.',
    clear: 'Limpiar',
    selectForComparison: (name: string) => `Seleccionar ${name} para comparar`,
    updated: (date: string) => `Actualizado el ${date}`,
    vs: (a: string, b: string) => `${a} vs. ${b}`,
    figure: 'Cifra',
    difference: 'Diferencia',
    noChange: 'Sin cambio',
    better: 'mejor',
    worse: 'peor',
    summarySame: (compared: string, base: string) =>
      `${compared} y ${base} dan las mismas cifras.`,
    summary: (base: string, compared: string, improves: string[], costs: string[]) => {
      const parts: string[] = []
      if (improves.length) parts.push(`mejora ${improves.join(', ')}`)
      if (costs.length) parts.push(`cuesta más en ${costs.join(', ')}`)
      return `Frente a ${base}, ${compared} ${parts.join(', pero ')}.`
    },
    details: 'Detalles',
    notes: 'Notas',
    notesPlaceholder: '¿Qué estabas evaluando?',
    saveChanges: 'Guardar cambios',
    confirmDelete: (name: string) => `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
    timelineEmpty: 'Aún no hay escenarios guardados.',
    allScenarios: 'Todos los escenarios',
    savedUpdated: (created: string, updated: string) =>
      `Guardado el ${created} · actualizado el ${updated}`,
    openInCalculator: 'Abrir en la calculadora',
    results: 'Resultados',
    inputs: 'Datos ingresados',
  },

  goals: {
    metaTitle: 'Metas',
    title: 'Metas',
    intro: 'Dónde estás, cuándo llegarás y qué te haría llegar antes.',
    newGoal: 'Nueva meta',
    dialogDescription:
      'Define una meta. Calculamos cuándo la alcanzas y qué necesitas para llegar antes.',
    createGoal: 'Crear meta',
    emptyTitle: 'Aún no hay metas',
    emptyDescription:
      'La cuota inicial de tu vivienda, un fondo de emergencia, salir de deudas — define una meta y síguela.',
    types: {
      savings: 'Ahorro',
      'debt-free': 'Sin deudas',
      purchase: 'Compra',
      retirement: 'Pensión',
    },
    typeOptions: {
      savings: 'Ahorro',
      purchase: 'Una compra grande',
      'debt-free': 'Salir de deudas',
      retirement: 'Pensión',
    },
    onTrack: 'Vas bien',
    behind: 'Vas atrasado',
    projected: (date: string) => `Proyectado para ${date}`,
    addContribution: 'Agrega un aporte mensual para ver una fecha',
    gapHint: (amount: string) =>
      `Con unos ${amount} más al mes llegarías a tiempo para la fecha objetivo.`,
    of: 'de',
    percentOfGoal: (pct: number) => `${pct}% de la meta`,
    nameLabel: 'Nombre',
    namePlaceholder: 'p. ej. Cuota inicial del apartamento',
    type: 'Tipo',
    target: 'Monto de la meta',
    savedSoFar: 'Ahorrado hasta ahora',
    monthly: 'Aporte mensual',
    expectedReturn: 'Rentabilidad esperada',
    expectedReturnHint:
      'Lo que rinde el dinero mientras tanto. La tasa de una cuenta de ahorros es un supuesto prudente.',
    targetDate: 'Fecha objetivo (opcional)',
    saveGoal: 'Guardar meta',
    allGoals: 'Todas las metas',
    onTrackToReach: 'Vas bien para lograrla',
    atCurrentPace: 'A tu ritmo actual',
    around: (date: string) => `Alrededor de ${date}`,
    neededMonthly: 'Necesario cada mes para llegar a tu fecha',
    contributingNow: 'Aporte actual',
    whatWouldChange: 'Qué cambiaría la fecha',
    sooner: (duration: string) => `${duration} antes`,
    later: (duration: string) => `${duration} después`,
    noChange: 'Sin cambio',
    chartCaption: 'Tu saldo en el camino hacia la meta',
    variants: {
      'add-50': { label: 'Aporta un poco más', description: '50 adicionales al mes para la meta' },
      'add-quarter': {
        label: 'Aumenta un 25%',
        description: 'Una cuarta parte más que tu aporte actual',
      },
      'lower-return': {
        label: 'Si la rentabilidad decepciona',
        description: 'El mismo plan con dos puntos menos',
      },
    },
  },

  dashboard: {
    metaTitle: 'Panel',
    title: 'Panel',
    intro: 'Tu trabajo guardado y tu progreso en un solo lugar.',
    savedScenarios: 'Escenarios guardados',
    activeGoals: 'Metas activas',
    profileHealth: 'Salud del perfil',
    addDetails: 'Completa los datos de tu perfil',
    goals: 'Metas',
    allGoals: 'Todas las metas',
    noGoalsTitle: 'Aún no hay metas',
    noGoalsDescription: 'Define una meta y mira cuándo la alcanzarás a tu ritmo actual.',
    createGoal: 'Crear una meta',
    recentScenarios: 'Escenarios recientes',
    nothingSaved: 'Aún no hay nada guardado',
    nothingSavedDescription: 'Usa una calculadora y guarda el resultado para compararlo después.',
    openCalculator: 'Abrir una calculadora',
  },

  profile: {
    metaTitle: 'Perfil',
    title: 'Perfil',
    intro:
      'Entre más compartas, más precisas serán la verificación de requisitos y la asesoría. Nada es obligatorio.',
    formTitle: 'Tus finanzas',
    formIntro:
      'Todo es opcional. Solo se usa para verificar requisitos de productos y darle contexto al asesor.',
    income: 'Ingreso mensual (neto)',
    expenses: 'Gastos mensuales',
    debts: 'Pagos mensuales de deudas',
    savings: 'Saldo de ahorros',
    risk: 'Qué tan cómodo te sientes con el riesgo al invertir',
    riskOptions: {
      conservative: 'Prudente',
      balanced: 'Moderado',
      aggressive: 'Tranquilo con las subidas y bajadas',
    },
    preferNot: 'Prefiero no decirlo',
    saveProfile: 'Guardar perfil',
    saved: 'Guardado.',
    quickRead: 'Una lectura rápida',
    quickReadNote: 'Una guía aproximada con las cifras que diste, no un estudio de crédito.',
    addIncome: 'Agrega tus ingresos y gastos para ver cómo están tus finanzas.',
    statuses: { good: 'Saludable', watch: 'Para vigilar', attention: 'Requiere atención' },
    signals: {
      dtiLabel: 'Nivel de endeudamiento',
      dtiDetail: (pct: string, ceiling: string) =>
        `Tus pagos de deudas son el ${pct} de tus ingresos. Aquí los bancos suelen buscar ${ceiling} o menos.`,
      savingsRateLabel: 'Tasa de ahorro',
      savingsRatePositive: (pct: string) => `Te sobra cerca del ${pct} de tus ingresos cada mes.`,
      savingsRateNegative: 'Tus gastos igualan o superan tus ingresos.',
      emergencyLabel: 'Fondo de emergencia',
      emergencyDetail: (months: number) => `Tus ahorros cubren unos ${months} meses de gastos.`,
    },
  },

  rateInput: {
    label: 'Tasa de interés',
    basis: 'Cómo se expresa la tasa',
    effectiveAnnual: 'E.A.',
    monthly: 'M.V.',
    effectiveAnnualHint: 'Efectiva anual (E.A.): el costo real por año, con la capitalización incluida.',
    monthlyHint: 'Mes vencido (M.V.): la tasa que se cobra cada mes.',
    equivalent: (rate: string, basis: string) => `Equivale a ${rate} ${basis}`,
  },

  validation: {
    enterAmount: 'Ingresa un monto',
    amountPositive: 'El monto debe ser mayor que cero',
    amountNegative: 'El monto no puede ser negativo',
    enterRate: 'Ingresa una tasa',
    rateNegative: 'La tasa no puede ser negativa',
    rateAsPercent: 'Ingresa la tasa como porcentaje, p. ej. 12,5',
    enterTerm: 'Ingresa un plazo',
    termWhole: 'El plazo debe ser un número entero de meses',
    termMin: 'El plazo debe ser de al menos 1 mes',
    termMax: 'El plazo no puede superar los 50 años',
    downPaymentBelowPrice: 'La cuota inicial debe ser menor que el valor de la vivienda',
    carTermMax: 'Los créditos de vehículo rara vez superan los 8 años',
    yearsMin: 'Ingresa al menos 1 año',
    yearsMax: 'El horizonte máximo es de 60 años',
    targetRequired: 'Define una meta para calcular',
    debtName: 'Ponle nombre a esta deuda',
    debtsMin: 'Agrega al menos una deuda',
    budgetCoversMinimums: 'El presupuesto debe cubrir al menos todos los pagos mínimos',
  },
}
