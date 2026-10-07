/**
 * English interface strings — the source of truth. `es.ts` is typed against
 * this object, so a key missing from a translation fails the type check.
 *
 * Interpolated strings are functions. Keep figures out of the sentences' word
 * order assumptions: each language builds its own sentence around the value.
 */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export const en = {
  common: {
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    signIn: 'Sign in',
    reset: 'Reset',
    loading: 'Loading',
    open: 'Open',
    delete: 'Delete',
    tryAgain: 'Try again',
    viewAll: 'View all',
    none: 'None',
    total: 'Total',
    name: 'Name',
    perMonthShort: '/mo',
    years: (n: number) => `${n} ${plural(n, 'year', 'years')}`,
    months: (n: number) => `${n} ${plural(n, 'month', 'months')}`,
  },

  meta: {
    siteTitle: 'SumAI — Financial calculators that explain themselves',
    siteDescription:
      'Loan, mortgage, car loan, savings, investment and debt payoff calculators, with plain-language explanations of every result.',
  },

  countries: {
    label: 'Country',
    co: 'Colombia',
    us: 'United States',
    ca: 'Canada',
  },

  nav: {
    calculators: 'Calculators',
    compareRates: 'Compare rates',
    howItWorks: 'How it works',
    pricing: 'Pricing',
    dashboard: 'Dashboard',
    scenarios: 'Scenarios',
    goals: 'Goals',
    profile: 'Profile',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: {
      featuredTitle: 'Compare loan offers',
      featuredBody: 'Put up to three offers side by side and see what each one really costs, fees included.',
      featuredCta: 'Open the comparison',
      viewAll: 'View all calculators',
    },
  },

  footer: {
    tagline: 'Financial calculators that explain their own numbers.',
    calculators: 'Calculators',
    compare: 'Compare',
    company: 'Company',
    about: 'About',
    mortgages: 'Mortgages',
    carLoans: 'Car loans',
    personalLoans: 'Personal loans',
    savingsAccounts: 'Savings accounts',
    disclaimer:
      'SumAI provides general financial information and estimates, not financial advice. Rates shown are illustrative and are not offers of credit. Figures depend on the inputs you provide and on the assumptions stated alongside each result.',
  },

  calculators: {
    loan: {
      title: 'Loan Calculator',
      shortTitle: 'Loan',
      tagline: 'Payment, interest and payoff on any loan',
      description:
        'Work out the payment, total interest and payoff date on any instalment loan, and see what paying a little extra would do.',
    },
    mortgage: {
      title: 'Mortgage Calculator',
      shortTitle: 'Mortgage',
      tagline: 'The real monthly cost of a home',
      description:
        'The full monthly cost of a home: principal, interest, tax, insurance and mortgage insurance, plus what you can afford.',
    },
    'car-loan': {
      title: 'Car Loan Calculator',
      shortTitle: 'Car loan',
      tagline: 'Vehicle financing, tax and trade-in included',
      description:
        'Finance a vehicle including tax, fees and a trade-in, and see when you stop owing more than the car is worth.',
    },
    investment: {
      title: 'Investment Calculator',
      shortTitle: 'Investment',
      tagline: 'What regular investing could grow into',
      description:
        'Project what regular contributions could grow into, after fees, and what that will be worth in today’s money.',
    },
    savings: {
      title: 'Savings Calculator',
      shortTitle: 'Savings',
      tagline: 'Reach a savings target, or project a balance',
      description:
        'Grow a savings balance at a given rate, or work backwards from a target to the deposit it takes to get there.',
    },
    'debt-payoff': {
      title: 'Debt Payoff Calculator',
      shortTitle: 'Debt payoff',
      tagline: 'Avalanche or snowball, compared honestly',
      description:
        'Compare avalanche and snowball across all your debts, and see what each one costs in interest and time.',
    },
  },

  categories: {
    borrowing: { label: 'Borrowing', description: 'Loans, mortgages and financing' },
    growing: { label: 'Growing', description: 'Saving and investing over time' },
    planning: { label: 'Planning', description: 'Getting out of debt and hitting goals' },
  },

  home: {
    titleLead: 'Money decisions,',
    titleEmphasis: 'with the working shown',
    cards: {
      mortgage: {
        eyebrow: 'Mortgage calculator',
        title: 'Your monthly cost,',
        titleAccent: 'broken down',
        monthly: 'Monthly payment',
        interest: 'Total interest',
        payoff: 'Paid off in',
        breakdown: 'Where each payment goes',
        principalInterest: 'Principal & interest',
        tax: 'Property tax',
        insurance: 'Insurance',
        byYear: 'Principal vs interest, year by year',
        principal: 'Principal',
        interestLabel: 'Interest',
        homePrice: (price: string, down: string) => `${price} home · ${down} down`,
      },
      rates: {
        eyebrow: 'Market benchmarks',
        title: 'Rates',
        titleAccent: 'right now',
        mortgage: 'Mortgage',
        carLoan: 'Car loan',
        personalLoan: 'Personal loan',
        savings: 'Savings',
        inflation: 'Inflation',
        note: 'Illustrative benchmarks, not offers',
      },
      savings: {
        eyebrow: 'Savings plan',
        title: 'What saving',
        titleAccent: 'adds up to',
        balance: (duration: string) => `Balance after ${duration}`,
        deposited: 'You deposit',
        interest: 'Interest earned',
        apy: 'Effective yield',
        growth: 'Balance over time',
        perMonth: (amount: string) => `${amount} a month`,
      },
    },
    subtitle: 'Financial calculators that show what every number means.',
    browse: 'Browse calculators',
    scrollHint: 'Scroll to explore',
    advantages: {
      titleLead: 'Why SumAI works',
      titleEmphasis: 'in your favour.',
      tablist: 'Why SumAI',
      previous: 'Previous reason',
      next: 'Next reason',
      position: (current: number, total: number) => `${current} of ${total}`,
      rate: {
        title: 'We look for the best interest rate',
        body: 'We track rates from lenders in your market and surface the lowest one you can get — quoted the way your country quotes it, so you always compare like with like.',
        tab: 'Best interest rate',
        cta: 'Compare rates',
        lender: (letter: string) => `Lender ${letter}`,
        best: 'Best rate',
        note: 'Illustrative rates',
      },
      fit: {
        title: 'We compare every credit to find your best fit',
        body: 'The rate is only part of the cost. We weigh fees, term and requirements against your numbers, and show you the credit that fits you best — not the one paying for placement.',
        tab: 'Best fit for you',
        cta: 'Compare offers',
        heading: 'Your best match',
        criteria: ['Lowest total cost', 'No hidden fees', 'Term that suits you', 'Requirements you meet'],
        verdict: 'Best fit for you',
      },
      eligibility: {
        tab: 'Know where you qualify',
        title: 'We tell you where you qualify before you apply',
        body: 'Add your income and credit score and we check them against each lender’s requirements, so you only apply where you are likely to be approved. Nothing here touches your credit report.',
        cta: 'See where you qualify',
        profile: 'Your profile',
        income: 'Monthly income',
        score: 'Credit score',
        debt: 'Debt-to-income',
        likely: 'Likely eligible',
        unlikely: 'May not qualify',
      },
    },
    carousel: {
      title: 'Every money decision, worked out.',
      viewAll: 'View all calculators',
      previous: 'Previous calculators',
      next: 'Next calculators',
      open: (name: string) => `Open the ${name}`,
      cards: {
        loan: {
          body: 'Your payment, the total interest and the exact payoff date — and what paying a little extra each month changes.',
        },
        mortgage: {
          body: 'Principal, interest, property tax, insurance and building fees in one number, plus how much home your income supports.',
        },
        'car-loan': {
          body: 'Tax, fees and your trade-in included, with the month you finally owe less than the car is worth.',
        },
        investment: {
          body: 'See what monthly contributions grow into after fees, and what that will be worth in today’s money.',
        },
        savings: {
          body: 'Grow a balance at your bank’s real yield, or work back from a target to what you need to set aside.',
        },
        'debt-payoff': {
          body: 'Line up every card and loan, then compare avalanche and snowball to see which saves more and which clears debts first.',
        },
      } as Record<string, { body: string }>,
    },
    // Placeholder testimonials until real customer feedback is collected; the
    // section shows the `sample` note while these are in place.
    testimonials: {
      eyebrow: 'What people say',
      title: 'Decisions people feel good about',
      sample: 'Sample testimonials',
      previous: 'Previous testimonial',
      next: 'Next testimonial',
      show: (name: string) => `Show what ${name} said`,
      items: [
        {
          name: 'Daniel Brooks',
          role: 'First-time home buyer',
          quote: 'I finally understood what my mortgage would really cost me — not just the monthly payment, the whole thing.',
        },
        {
          name: 'Marcus Lee',
          role: 'Paying off two credit cards',
          quote: 'Seeing avalanche against snowball side by side made the choice obvious. I will be debt-free a year sooner.',
        },
        {
          name: 'Emily Watson',
          role: 'Sales manager',
          quote: 'SumAI showed me a loan two points cheaper than the one my bank offered, and explained exactly why.',
        },
        {
          name: 'Sofia Ramirez',
          role: 'Saving for a sabbatical',
          quote: 'The savings calculator turned a vague goal into a number I put aside every month.',
        },
        {
          name: 'Hannah Cole',
          role: 'Buying her first car',
          quote: 'I knew where I would qualify before applying, so I applied once — and got approved.',
        },
      ],
    },
    principles: [
      {
        title: 'The maths is deterministic',
        body: 'Every figure comes from a tested formula, not a model. Run it twice, get the same answer.',
      },
      {
        title: 'The explanation is plain',
        body: 'Ask what a result means and get it in words, grounded only in the numbers on your screen.',
      },
      {
        title: 'Your market, your conventions',
        body: 'Colombia quotes rates effective annual; the US quotes them nominal. We handle both correctly.',
      },
    ],
  },

  about: {
    metaTitle: 'About',
    metaDescription: 'Why SumAI exists, and the rules it follows.',
    title: 'About SumAI',
    paragraphs: [
      'Most financial calculators hand you a number and stop. The monthly payment is on screen, but not why it is what it is, what it assumes, or what would move it.',
      'SumAI is built on the opposite idea. Every calculation shows its working. Every result comes with the assumptions behind it. And when you want to understand what a figure means for you, you can ask — and get an answer grounded only in the numbers you are looking at.',
    ],
    rulesTitle: 'The rules we follow',
    rules: [
      'The maths is deterministic and tested. A model never calculates a figure.',
      'We explain; we do not advise. Nothing here is a recommendation to act.',
      'Rates are labelled with how they are quoted, because the convention changes the cost.',
      'Products are ranked by total cost to you, and sponsored placement is always marked.',
    ],
    whereTitle: 'Where we operate',
    whereBody:
      'We launch in Colombia, the United States and Canada. Each market gets its own currency, terminology and lending rules rather than a translated copy of one.',
  },

  howItWorks: {
    metaTitle: 'How it works',
    metaDescription: 'How SumAI calculates, explains and compares.',
    title: 'How it works',
    subtitle: 'Five steps, and the first three need no account.',
    steps: [
      {
        title: 'Enter your numbers',
        body: 'Pick a calculator and fill in what you know. Results update as you type — there is no submit button to hunt for.',
      },
      {
        title: 'See the full picture',
        body: 'Beyond the headline payment: total interest, the payoff schedule, and where each payment actually goes.',
      },
      {
        title: 'Try what-ifs',
        body: 'One click shows what a shorter term, a lower rate or a little extra each month would change — trade-offs included.',
      },
      {
        title: 'Ask what it means',
        body: 'Get a plain-language read on your result. The explanation references only the figures computed for you.',
      },
      {
        title: 'Save and compare',
        body: 'Sign in to keep scenarios, compare them side by side, and track goals over time.',
      },
    ],
    rateNoteTitle: 'A note on rates',
    rateNoteBody:
      'A rate of 12% does not mean the same thing everywhere. Colombian lenders quote an effective annual rate (E.A.), which already includes compounding. US lenders quote a nominal annual rate compounded monthly, which costs slightly more than it sounds. We convert correctly for your market, and every rate we show says which kind it is.',
    start: 'Start with a calculator',
  },

  pricing: {
    metaTitle: 'Pricing',
    metaDescription:
      'Every calculator is free. Plus adds saved scenarios, goals and the financial coach.',
    title: 'Pricing',
    subtitle: 'The calculators are free, and always will be.',
    mostFlexible: 'Most flexible',
    tiers: {
      free: {
        name: 'Free',
        price: '$0',
        cadence: 'forever',
        description: 'Every calculator, every what-if, no account needed.',
        features: [
          'All six calculators',
          'What-if scenarios',
          'Full payment schedules',
          'Product rate comparison',
          'Three AI explanations a day',
        ],
        cta: 'Start calculating',
      },
      plus: {
        name: 'Plus',
        price: '$6',
        cadence: 'per month',
        description: 'For people planning something big over months, not minutes.',
        features: [
          'Everything in Free',
          'Unlimited saved scenarios',
          'Side-by-side scenario comparison',
          'Goals with progress tracking',
          'Unlimited AI analysis and the financial coach',
        ],
        cta: 'Try Plus',
      },
    },
  },

  calculatorIndex: {
    metaTitle: 'All calculators',
    metaDescription:
      'Loan, mortgage, car loan, investment, savings and debt payoff calculators — each with a full breakdown and what-if scenarios.',
    title: 'Calculators',
    intro:
      'Every calculator shows its full working, the assumptions behind it, and what would change if you changed one thing.',
    openCalculator: 'Open calculator',
  },

  calculatorHeader: {
    home: 'Home',
    calculators: 'Calculators',
    showingFigures: (country: string, currency: string, effective: boolean) =>
      `Showing figures for ${country} in ${currency}. Rates here are quoted ${
        effective ? 'as an effective annual rate' : 'as a nominal annual rate, compounded monthly'
      }.`,
  },

  calculatorForm: {
    title: 'Your numbers',
    saveScenario: 'Save scenario',
  },

  whatIf: {
    title: 'What if you changed one thing?',
    paymentChangesBy: 'Payment changes by',
    saves: 'Saves',
    costs: 'Costs',
    options: {
      'shorter-term': { label: 'Shorter term', description: 'Same loan paid over 12 fewer months' },
      'extra-payment': {
        label: 'Pay a little extra',
        description: 'An extra 10% of the payment toward principal each period',
      },
      'better-rate': {
        label: 'One point lower',
        description: 'The same loan at a rate one percentage point lower',
      },
      'fifteen-year': { label: '15-year term', description: 'Higher payment, far less interest overall' },
      'twenty-percent-down': {
        label: '20% down',
        description: 'Enough equity to avoid mortgage insurance',
      },
      'extra-200': {
        label: 'Extra toward principal',
        description: 'An additional amount applied to principal every month',
      },
      'rate-drop': {
        label: 'Half a point lower',
        description: 'What a refinance at a better rate would look like',
      },
    } as Record<string, { label: string; description: string }>,
  },

  scenarioPanel: {
    saveTitle: 'Save this calculation',
    signInPrompt: 'Sign in to keep this scenario and compare it against others later.',
    yourScenarios: 'Your scenarios',
    saveCurrent: 'Save current',
    emptyTitle: 'Nothing saved yet',
    emptyDescription: 'Save this calculation to compare it against other options.',
    saved: (date: string) => `Saved ${date}`,
    load: 'Load',
    compare: 'Compare',
    dialogTitle: 'Save this scenario',
    dialogDescription: 'Give it a name you will recognise later.',
    namePlaceholder: 'e.g. 20% down, 15 years',
  },

  related: {
    title: 'Related calculators',
  },

  charts: {
    amortizationCaption: 'Where each year of payments goes',
    principal: 'Principal',
    interest: 'Interest',
    yearShort: 'Yr',
    monthShort: 'Mo',
    year: 'Year',
    month: 'Month',
    growthCaption: 'What you put in, and what it grew into',
    contributed: 'What you contributed',
    growth: 'Growth',
    breakdownCaption: 'What makes up the payment',
    comparisonCaption: 'Total cost by option',
  },

  loan: {
    amount: 'Loan amount',
    frequency: 'Payment frequency',
    frequencies: { monthly: 'Monthly', biweekly: 'Every two weeks', weekly: 'Weekly' },
    paymentLabels: {
      monthly: 'Monthly payment',
      biweekly: 'Payment every two weeks',
      weekly: 'Weekly payment',
      annually: 'Annual payment',
    },
    extra: 'Extra toward principal, each payment',
    extraHint: 'Goes straight to principal, which shortens the loan.',
    fee: 'Origination fee',
    paymentsTotal: (n: number) => `${n} payments in total`,
    totalInterest: 'Total interest',
    totalPaid: 'Total paid',
    includingFees: 'Including fees',
    effectiveRate: 'Effective annual rate',
    effectiveRateHint: 'The true yearly cost once compounding is included.',
    interestSaved: 'Interest saved by paying extra',
  },

  mortgage: {
    homePrice: 'Home price',
    ofPrice: (pct: string) => `${pct} of the price`,
    propertyTax: 'Property tax / yr',
    insurance: 'Insurance / yr',
    hoa: 'HOA or building fees / mo',
    extra: 'Extra toward principal / mo',
    totalMonthly: 'Total monthly payment',
    totalMonthlyDetail: 'Principal, interest, tax, insurance and fees',
    borrowed: 'Amount borrowed',
    totalInterest: 'Total interest',
    paidOffIn: 'Paid off in',
    monthsEarly: (n: number) => `${n} months early`,
    segments: {
      principalAndInterest: 'Principal and interest',
      propertyTax: 'Property tax',
      homeInsurance: 'Home insurance',
      mortgageInsurance: 'Mortgage insurance',
      hoa: 'HOA / fees',
    },
    miNotice: (threshold: string, years: number | null) =>
      `Your down payment is below ${threshold}, so lenders typically add mortgage insurance.${
        years ? ` At this pace it drops off after about ${years} years.` : ''
      }`,
  },

  carLoan: {
    vehiclePrice: 'Vehicle price',
    cashDown: 'Cash down',
    tradeInValue: 'Trade-in value',
    tradeInOwed: 'Still owed on it',
    termOption: (months: number) => `${months} months (${months / 12} yr)`,
    salesTax: 'Sales tax',
    fees: 'Fees and registration',
    amountFinanced: 'Amount financed',
    totalInterest: 'Total interest',
    segments: { vehicle: 'Vehicle', salesTax: 'Sales tax', fees: 'Fees', interest: 'Interest' },
    negativeEquity: (amount: string) =>
      `You owe ${amount} more on your trade-in than it is worth. That amount is added to this loan.`,
    underwater: 'You would owe more than the car is worth at signing.',
    catchUp: (months: number) => ` At this pace you catch up after about ${months} months.`,
    noCatchUp: ' At this pace you may not catch up before the loan ends.',
  },

  investment: {
    startingAmount: 'Starting amount',
    monthlyContribution: 'Monthly contribution',
    expectedReturn: 'Expected annual return',
    expectedReturnHint:
      'Long-run averages are not guarantees. Try a lower figure to see a cautious case.',
    yearsInvested: 'Years invested',
    fees: 'Annual fees',
    feesHint: 'The expense ratio of the fund, charged on the whole balance every year.',
    inflation: 'Inflation',
    raise: 'Raise contributions each year by',
    balanceAfter: (years: number) => `Balance after ${years} years`,
    multiple: (x: number) => `${x}× what you put in`,
    todaysMoney: 'In today’s money',
    todaysMoneyHint: 'The final balance adjusted for inflation: what it would buy today.',
    contributed: 'You contributed',
    lostToFees: 'Lost to fees',
    rangeTitle: 'Range of outcomes',
    rangeIntro: 'Returns vary. The same plan at three points lower and higher:',
    weaker: 'Weaker',
    expected: 'Expected',
    stronger: 'Stronger',
    doubling: (years: string) =>
      `At this net return, money doubles roughly every ${years} years.`,
  },

  savings: {
    project: 'Project a balance',
    target: 'Reach a target',
    targetAmount: 'Target amount',
    startingBalance: 'Starting balance',
    monthlyDeposit: 'Monthly deposit',
    interestRate: 'Interest rate',
    timeFrame: 'Time frame',
    compounding: 'Compounding',
    compoundingOptions: { daily: 'Daily', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' },
    depositNeeded: 'Monthly deposit needed',
    toReach: (amount: string, duration: string) => `To reach ${amount} in ${duration}`,
    atCurrentDeposit: 'At your current deposit',
    projectedBalance: 'Projected balance',
    apy: 'Effective yield (APY)',
    apyHint: 'The quoted rate once compounding is included.',
    balanceAfter: (duration: string) => `Balance after ${duration}`,
    youDeposit: 'You deposit',
    interestEarned: 'Interest earned',
    chartCaption: 'Deposits and interest over time',
  },

  debtPayoff: {
    formTitle: 'Your debts',
    debtNameLabel: (i: number) => `Name of debt ${i}`,
    remove: (name: string) => `Remove ${name}`,
    balance: 'Balance',
    rate: 'Rate',
    minimum: 'Minimum',
    addDebt: 'Add a debt',
    newDebtName: (n: number) => `Debt ${n}`,
    defaultNames: { 'card-1': 'Credit card', 'card-2': 'Store card', student: 'Student loan' } as Record<
      string,
      string
    >,
    budget: 'Total you can pay each month',
    budgetHint: (minimums: string) =>
      `Minimums add up to ${minimums}. Anything above that speeds things up.`,
    avalanche: 'Highest rate first',
    snowball: 'Smallest balance first',
    debtFreeIn: 'Debt free in',
    totalInterest: 'Total interest',
    totalPaid: 'Total paid',
    compareTitle: 'Avalanche or snowball?',
    compareSaves: (amount: string) =>
      `Paying the highest rate first saves ${amount} in interest. Paying the smallest balance first clears your first account sooner, which some people find easier to stick with.`,
    compareSame:
      'With these debts, both approaches cost about the same. Pick whichever you will stick with.',
    compareCaption: 'Total interest by strategy',
    payoffOrder: 'Payoff order',
    colDebt: 'Debt',
    colPaidOffAfter: 'Paid off after',
    colInterest: 'Interest paid',
  },

  compare: {
    metaTitle: 'Compare loan offers',
    metaDescription:
      'Put up to three loan offers side by side and compare what each one costs in total, fees included.',
    title: 'Compare loan offers',
    intro:
      'The lowest rate is not always the cheapest loan. Enter the offers you have and see what each costs over its full term, fees included.',
    amount: 'Amount to borrow',
    offerName: 'Offer name',
    offer: (letter: string) => `Offer ${letter}`,
    term: 'Term',
    termOption: (months: number) => `${months} months`,
    upfrontFees: 'Upfront fees',
    monthlyPayment: 'Monthly payment',
    totalInterest: 'Total interest',
    totalCost: 'Total cost',
    moreThanCheapest: (amount: string) => `${amount} more than the cheapest offer`,
    cheapest: 'Cheapest',
    chartTitle: 'Total cost side by side',
    chartCaption: 'Everything you would pay, fees included',
  },

  ai: {
    title: 'What this means',
    explainButton: 'Explain my result',
    analysing: 'Analysing your result',
    unavailable: 'Analysis is unavailable right now',
    askFollowUp: 'Ask a follow-up',
    intro: 'Get a plain-language read on what these numbers mean for you.',
    disclaimer:
      'This is general information, not financial advice. Figures are estimates based on the inputs shown.',
    chatPlaceholder: 'Ask about your numbers…',
    chatEmpty: 'Ask about a scenario, a goal, or what a number means.',
    chatError: 'Sorry — I could not answer that just now.',
    yourQuestion: 'Your question',
    send: 'Send',
    coachTitle: 'Your financial coach',
    openCoach: 'Open financial coach',
    explaining: (term: string) => `Explaining ${term}`,
    forExample: 'For example',
    explanationUnavailable: 'That explanation is unavailable right now.',
    confidence: { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' },
  },

  products: {
    hubMetaTitle: 'Compare rates',
    hubMetaDescription:
      'Mortgages, car loans, personal loans and savings accounts, compared on total cost.',
    hubTitle: 'Compare rates',
    hubIntro: (country: string) =>
      `Products available in ${country}, ranked by what they would cost you — not by who pays for placement.`,
    benchmark: 'Market benchmark around',
    categories: {
      mortgage: {
        title: 'Mortgages',
        body: 'Home loans compared on what they cost over the full term.',
        intro:
          'Home loan rates from lenders in your market, ranked by what they would cost you over the full term.',
        calculatorLabel: 'Open the mortgage calculator',
        metaTitle: 'Compare mortgages',
        metaDescription: 'Mortgage rates from lenders in your country, ranked by total cost.',
      },
      'car-loan': {
        title: 'Car loans',
        body: 'Vehicle financing with fees and total interest up front.',
        intro: 'Vehicle financing from banks and lenders, ranked by total cost including fees.',
        calculatorLabel: 'Open the car loan calculator',
        metaTitle: 'Compare car loans',
        metaDescription: 'Vehicle financing rates, ranked by total cost including fees.',
      },
      'personal-loan': {
        title: 'Personal loans',
        body: 'Unsecured loans, ranked by total cost rather than headline rate.',
        intro:
          'Unsecured loans for consolidating debt or covering a big expense, ranked by total cost.',
        calculatorLabel: 'Open the loan calculator',
        metaTitle: 'Compare personal loans',
        metaDescription: 'Personal loan rates and fees, ranked by what the loan actually costs.',
      },
      savings: {
        title: 'Savings accounts',
        body: 'Where your money earns the most, as the yield you actually receive.',
        intro:
          'Where your savings can earn the most, with each rate shown as the yield you actually receive.',
        calculatorLabel: 'Open the savings calculator',
        metaTitle: 'Compare savings accounts',
        metaDescription: 'Savings account rates in your country, with the effective yield shown.',
      },
    },
    knowNumbers:
      'Know your numbers first — the calculator shows what each rate means for your payment.',
    emptyTitle: 'No products to show yet',
    emptyDescription: (category: string, country: string) =>
      `We do not have ${category.toLowerCase()} listed for ${country} right now. Check back soon.`,
    footnote:
      'Rates are illustrative and not offers of credit. Your rate depends on your credit profile and the lender. Ranked by estimated total cost, then by how well each product fits; sponsored placements are always labelled.',
    featured: 'Featured',
    provider: 'Provider',
    estimatedPayment: 'Estimated payment',
    amount: 'Amount',
    term: 'Term',
    fee: 'Fee',
    rate: 'Rate',
    payment: 'Payment',
    eligibility: 'Eligibility',
    viewOffer: 'View offer',
    view: 'View',
    from: 'From',
    productCount: (n: number) => `${n} ${plural(n, 'product', 'products')}`,
    rateBasis: { effective: 'E.A.', nominal: 'APR' },
    rateTypes: { fixed: 'fixed', variable: 'variable' },
    effectiveHint: 'Effective annual rate: the true yearly cost once compounding is included.',
    nominalHint: 'Nominal annual rate, compounded monthly.',
    eligibilityNotChecked: 'Requirements not checked',
    eligibilityNotCheckedHint: 'Add your income and credit score to see whether you qualify.',
    likelyEligible: 'Likely eligible',
    mayNotQualify: 'May not qualify',
    requirementsNotMet: 'You do not meet the stated requirements.',
    comparisonTitle: 'Total cost compared',
    comparisonIntro: (amount: string, years: number, country: string) =>
      `Borrowing ${amount} over ${years} years in ${country}, including fees.`,
    comparisonCaption: 'What each option costs in total',
    lowestCost: 'Lowest cost',
    feeSuffix: (amount: string) => ` · ${amount} fee`,
    overTerm: (amount: string) => `+${amount} over the term`,
    reasons: {
      lowestRate: 'Lowest rate in these results',
      noFee: 'No origination fee',
      meetsRequirements: 'You meet the stated requirements',
      needsScore: (score: number) => `Needs a credit score of ${score}`,
      incomeBelow: 'Income below the stated minimum',
      debtAbove: 'Existing debt is above the stated limit',
    },
  },

  fields: {
    loan: {
      payment: 'Payment',
      totalInterest: 'Total interest',
      totalPaid: 'Total paid',
      payoffPeriods: 'Payoff time',
    },
    mortgage: {
      monthlyTotal: 'Monthly payment',
      totalInterest: 'Total interest',
      loanAmount: 'Amount borrowed',
      payoffPeriods: 'Payoff time',
    },
    'car-loan': {
      monthlyPayment: 'Payment',
      amountFinanced: 'Amount financed',
      totalInterest: 'Total interest',
    },
    investment: {
      finalBalance: 'Final balance',
      realBalance: 'In today’s money',
      totalGrowth: 'Growth',
      totalFees: 'Fees',
    },
    savings: {
      finalBalance: 'Final balance',
      totalInterest: 'Interest earned',
      monthsToTarget: 'Time to goal',
    },
    'debt-payoff': {
      monthsToDebtFree: 'Debt free in',
      totalInterest: 'Total interest',
      totalPaid: 'Total paid',
    },
  } as Record<string, Record<string, string>>,

  inputKeys: {
    amount: 'Amount',
    annualRate: 'Annual rate',
    termMonths: 'Term (months)',
    frequency: 'Frequency',
    extraPayment: 'Extra payment',
    originationFee: 'Origination fee',
    homePrice: 'Home price',
    downPayment: 'Down payment',
    vehiclePrice: 'Vehicle price',
    initialAmount: 'Starting amount',
    contribution: 'Contribution',
    deposit: 'Deposit',
    years: 'Years',
    months: 'Months',
    monthlyBudget: 'Monthly budget',
    strategy: 'Strategy',
  } as Record<string, string>,

  scenarios: {
    metaTitle: 'Scenarios',
    title: 'Scenarios',
    intro: 'Saved calculations. Pick two from the same calculator to compare them.',
    emptyTitle: 'No scenarios yet',
    emptyDescription: 'Run any calculator and save the result to start comparing options.',
    openCalculator: 'Open a calculator',
    pickOneMore: 'Pick one more scenario from the same calculator to compare.',
    comparing: 'Comparing the two selected scenarios below.',
    incompatible: 'These scenarios come from different calculators and cannot be compared.',
    clear: 'Clear',
    selectForComparison: (name: string) => `Select ${name} for comparison`,
    updated: (date: string) => `Updated ${date}`,
    vs: (a: string, b: string) => `${a} vs ${b}`,
    figure: 'Figure',
    difference: 'Difference',
    noChange: 'No change',
    better: 'better',
    worse: 'worse',
    summarySame: (compared: string, base: string) =>
      `${compared} and ${base} produce the same figures.`,
    summary: (base: string, compared: string, improves: string[], costs: string[]) => {
      const parts: string[] = []
      if (improves.length) parts.push(`improves ${improves.join(', ')}`)
      if (costs.length) parts.push(`costs more on ${costs.join(', ')}`)
      return `Compared with ${base}, ${compared} ${parts.join(' but ')}.`
    },
    details: 'Details',
    notes: 'Notes',
    notesPlaceholder: 'What were you weighing up?',
    saveChanges: 'Save changes',
    confirmDelete: (name: string) => `Delete "${name}"? This cannot be undone.`,
    timelineEmpty: 'No saved scenarios yet.',
    allScenarios: 'All scenarios',
    savedUpdated: (created: string, updated: string) => `Saved ${created} · updated ${updated}`,
    openInCalculator: 'Open in calculator',
    results: 'Results',
    inputs: 'Inputs',
  },

  goals: {
    metaTitle: 'Goals',
    title: 'Goals',
    intro: 'Where you are, when you will get there, and what would get you there sooner.',
    newGoal: 'New goal',
    dialogDescription:
      'Set a target. We will work out when you get there, and what it takes to get there sooner.',
    createGoal: 'Create goal',
    emptyTitle: 'No goals yet',
    emptyDescription:
      'A house deposit, an emergency fund, becoming debt free — set a target and track it.',
    types: {
      savings: 'Savings',
      'debt-free': 'Debt free',
      purchase: 'Purchase',
      retirement: 'Retirement',
    },
    typeOptions: {
      savings: 'Savings',
      purchase: 'Big purchase',
      'debt-free': 'Become debt free',
      retirement: 'Retirement',
    },
    onTrack: 'On track',
    behind: 'Behind',
    projected: (date: string) => `Projected ${date}`,
    addContribution: 'Add a monthly contribution to see a date',
    gapHint: (amount: string) =>
      `About ${amount} more a month would get you there by the target date.`,
    of: 'of',
    percentOfGoal: (pct: number) => `${pct}% of goal`,
    nameLabel: 'Name',
    namePlaceholder: 'e.g. House deposit',
    type: 'Type',
    target: 'Target amount',
    savedSoFar: 'Saved so far',
    monthly: 'Monthly contribution',
    expectedReturn: 'Expected return',
    expectedReturnHint:
      'What the money earns while it waits. A savings account rate is a cautious assumption.',
    targetDate: 'Target date (optional)',
    saveGoal: 'Save goal',
    allGoals: 'All goals',
    onTrackToReach: 'On track to reach it',
    atCurrentPace: 'At your current pace',
    around: (date: string) => `Around ${date}`,
    neededMonthly: 'Needed each month to hit your date',
    contributingNow: 'Contributing now',
    whatWouldChange: 'What would change the date',
    sooner: (duration: string) => `${duration} sooner`,
    later: (duration: string) => `${duration} later`,
    noChange: 'No change',
    chartCaption: 'Your balance on the way to the goal',
    variants: {
      'add-50': { label: 'Add a little more', description: 'An extra 50 a month toward the goal' },
      'add-quarter': {
        label: 'Increase by 25%',
        description: 'A quarter more than the current contribution',
      },
      'lower-return': { label: 'If returns disappoint', description: 'The same plan at two points lower' },
    } as Record<string, { label: string; description: string }>,
  },

  dashboard: {
    metaTitle: 'Dashboard',
    title: 'Dashboard',
    intro: 'Your saved work and progress in one place.',
    savedScenarios: 'Saved scenarios',
    activeGoals: 'Active goals',
    profileHealth: 'Profile health',
    addDetails: 'Add details in your profile',
    goals: 'Goals',
    allGoals: 'All goals',
    noGoalsTitle: 'No goals yet',
    noGoalsDescription: 'Set a target and see when you will reach it at your current pace.',
    createGoal: 'Create a goal',
    recentScenarios: 'Recent scenarios',
    nothingSaved: 'Nothing saved yet',
    nothingSavedDescription: 'Run a calculator and save the result to compare it later.',
    openCalculator: 'Open a calculator',
  },

  profile: {
    metaTitle: 'Profile',
    title: 'Profile',
    intro:
      'The more you share, the sharper eligibility checks and coaching get. None of it is required.',
    formTitle: 'Your finances',
    formIntro:
      'All optional. Used only to check product eligibility and to give the coach context.',
    income: 'Monthly income (after tax)',
    expenses: 'Monthly expenses',
    debts: 'Monthly debt payments',
    savings: 'Savings balance',
    risk: 'Comfort with investment risk',
    riskOptions: {
      conservative: 'Cautious',
      balanced: 'Balanced',
      aggressive: 'Comfortable with swings',
    },
    preferNot: 'Prefer not to say',
    saveProfile: 'Save profile',
    saved: 'Saved.',
    quickRead: 'A quick read',
    quickReadNote: 'A rough guide from the figures you gave, not a credit assessment.',
    addIncome: 'Add your income and expenses to see how your finances look.',
    statuses: { good: 'Healthy', watch: 'Worth watching', attention: 'Needs attention' },
    signals: {
      dtiLabel: 'Debt-to-income',
      dtiDetail: (pct: string, ceiling: string) =>
        `Debt payments are ${pct} of income. Lenders here generally look for ${ceiling} or less.`,
      savingsRateLabel: 'Savings rate',
      savingsRatePositive: (pct: string) => `About ${pct} of income is left over each month.`,
      savingsRateNegative: 'Expenses currently match or exceed income.',
      emergencyLabel: 'Emergency fund',
      emergencyDetail: (months: number) => `Savings cover about ${months} months of expenses.`,
    },
  },

  rateInput: {
    label: 'Interest rate',
    basis: 'How the rate is quoted',
    effectiveAnnual: 'E.A.',
    monthly: 'M.V.',
    effectiveAnnualHint: 'Effective annual (E.A.): the true yearly cost, compounding included.',
    monthlyHint: 'Monthly (M.V., mes vencido): the rate charged each month.',
    equivalent: (rate: string, basis: string) => `Equivalent to ${rate} ${basis}`,
  },

  validation: {
    enterAmount: 'Enter an amount',
    amountPositive: 'Amount must be greater than zero',
    amountNegative: 'Amount cannot be negative',
    enterRate: 'Enter a rate',
    rateNegative: 'Rate cannot be negative',
    rateAsPercent: 'Enter the rate as a percentage, e.g. 7.25',
    enterTerm: 'Enter a term',
    termWhole: 'Term must be a whole number of months',
    termMin: 'Term must be at least 1 month',
    termMax: 'Term cannot exceed 50 years',
    downPaymentBelowPrice: 'Down payment must be less than the home price',
    carTermMax: 'Car loans rarely run beyond 8 years',
    yearsMin: 'Enter at least 1 year',
    yearsMax: 'Cap the horizon at 60 years',
    targetRequired: 'Set a target amount to solve for',
    debtName: 'Name this debt',
    debtsMin: 'Add at least one debt',
    budgetCoversMinimums: 'Budget must at least cover every minimum payment',
  } as Record<string, string>,
}

export type Dictionary = typeof en
