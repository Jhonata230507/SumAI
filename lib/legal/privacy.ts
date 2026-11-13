import type { Language } from '@/lib/i18n'

/**
 * The privacy policy, in each language. It describes what the code actually
 * does; when a feature that touches personal data changes (a new cookie, a new
 * provider, a new stored field), this changes with it.
 *
 * BEFORE LAUNCH: fill in the legal entity and contact address below, and have
 * the text reviewed by counsel for each market you operate in (for example
 * Colombia's Ley 1581 de 2012, US state privacy laws, Canada's PIPEDA).
 */
export const PRIVACY_CONTACT = {
  /** The company responsible for the data (the "controller"). */
  entity: 'Suma',
  email: 'privacy@suma.example',
}

/** The date the current version takes effect. */
export const PRIVACY_UPDATED = { year: 2026, month: 11, day: 12 }

export interface PolicySection {
  id: string
  title: string
  /** Paragraphs; a string array inside is a bulleted list. */
  body: (string | string[])[]
}

export interface PrivacyPolicy {
  title: string
  metaDescription: string
  intro: string
  updated: (date: string) => string
  summaryTitle: string
  summary: string[]
  contentsTitle: string
  sections: PolicySection[]
}

const en: PrivacyPolicy = {
  title: 'Privacy policy',
  metaDescription: 'What Suma collects, why, who it is shared with, and the choices you have.',
  intro:
    'Suma helps you work out loans, mortgages, savings and investments. Doing that means handling numbers about your money, so this page explains plainly what we collect, what we do with it, and what we never do.',
  updated: (date) => `Last updated ${date}`,
  summaryTitle: 'The short version',
  summary: [
    'You can use every calculator without an account. The numbers you type are calculated in your browser and are not saved.',
    'We do not sell your personal information, and we do not share it with lenders.',
    'If you create an account, we keep what you choose to save (scenarios, goals and your financial profile) until you delete it.',
    'You can ask us for a copy of your data, to correct it, or to delete it at any time.',
  ],
  contentsTitle: 'On this page',
  sections: [
    {
      id: 'collect',
      title: 'What we collect',
      body: [
        'Using the calculators without an account:',
        [
          'The numbers you type into a calculator stay in your browser. They are calculated there and are not stored on our servers.',
          'To rank offers for you, we send the loan amount, term and any profile details you entered (such as a credit score range or income) to our server. They are used for that request and not saved.',
          'Your country, worked out from your connection when you first visit, or as you pick it. We keep it in a cookie so the site shows the right currency and rates.',
        ],
        'If you create an account:',
        [
          'Your email address, used to sign you in.',
          'What you choose to save: calculator scenarios, savings and investment goals, and the financial profile you fill in (income, expenses, debt payments, credit score, savings and risk tolerance).',
        ],
        'Automatically:',
        [
          'When you click through to a lender or account offer, we record the click (which offer, its position and your country) so we can measure which offers are useful.',
          'If you use the AI coach, we record how much it was used (a count of text processed), not what you asked.',
          'Where product analytics are enabled, we record which pages and calculators are used. These events do not include the amounts you type.',
        ],
      ],
    },
    {
      id: 'use',
      title: 'How we use it',
      body: [
        [
          'To run the calculators and show results in your currency and market.',
          'To rank lenders and accounts for your amount, term and profile.',
          'To keep your saved scenarios, goals and profile, if you have an account.',
          'To answer your questions in the AI coach, when you use it.',
          'To understand which features help people, fix problems and keep the service secure.',
        ],
        'We do not use your information to make decisions about credit, and we do not decide whether you qualify for anything: offers marked “You likely qualify” are estimates from the lenders’ published requirements.',
      ],
    },
    {
      id: 'ai',
      title: 'The AI coach',
      body: [
        'When you ask the AI coach a question, your question and the figures it needs (for example the result of a calculation) are sent to Anthropic, the company that provides the AI model, to write the reply. Anthropic processes this on our behalf and does not use it to train its models under our agreement with them.',
        'Avoid typing details the coach does not need, such as account numbers or your full name.',
      ],
    },
    {
      id: 'share',
      title: 'Who we share it with',
      body: [
        'We do not sell your personal information, and we do not share it with lenders or advertisers. When you click an offer you go to the lender’s site, and from then on their privacy policy applies.',
        'We use a few service providers that process data on our behalf, only to run Suma:',
        [
          'Supabase: database and sign-in, where accounts and saved data are stored.',
          'Anthropic: the AI model behind the coach.',
          'PostHog: product analytics, where enabled.',
          'Vercel: hosting; it sees your IP address when you connect, and tells us your country.',
        ],
        'We may also disclose information when the law requires it, or to protect the rights and safety of our users and of Suma.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and local storage',
      body: [
        [
          'country: remembers your country for a year, so prices and rates match your market. Needed for the site to work.',
          'Sign-in cookies: keep you signed in, only if you have an account. Needed for the account area.',
          'A browser setting that remembers how you like interest rates shown (for example E.A. or M.V. in Colombia). It never leaves your device.',
          'Analytics cookies, where product analytics are enabled.',
        ],
        'You can clear cookies and site data in your browser at any time. The site still works, but it will ask for your country again and sign you out.',
      ],
    },
    {
      id: 'retention',
      title: 'How long we keep it',
      body: [
        'Calculator inputs are not kept. Account data (your email, scenarios, goals and profile) is kept until you delete it or close your account; we then delete it within 30 days, except where the law requires us to keep something longer. Records of offer clicks and AI usage are kept for up to 24 months and are no longer linked to you once your account is deleted.',
      ],
    },
    {
      id: 'rights',
      title: 'Your choices and rights',
      body: [
        'Depending on where you live, you can ask us to:',
        [
          'give you a copy of the personal information we hold about you;',
          'correct information that is wrong;',
          'delete your information or your account;',
          'stop or limit how we use it, or object to a use;',
          'withdraw consent you gave earlier.',
        ],
        'You can edit or delete saved scenarios, goals and your profile from your account at any time. For anything else, write to us at the address below; we answer within the time the law of your country sets. You can also complain to your data protection authority, such as the Superintendencia de Industria y Comercio in Colombia or the Office of the Privacy Commissioner in Canada.',
      ],
    },
    {
      id: 'security',
      title: 'Security',
      body: [
        'Data is encrypted in transit, and account data is stored with access rules that let each user read only their own records. No system is perfectly secure, but we limit what we collect so there is less to protect.',
      ],
    },
    {
      id: 'children',
      title: 'Children',
      body: ['Suma is meant for adults. We do not knowingly collect information from anyone under 18.'],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      body: [
        'When we change this policy, we update the date at the top. If a change affects how we use information you already gave us, we tell signed-in users before it takes effect.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      body: [
        `Questions or requests about your privacy: ${PRIVACY_CONTACT.email}. ${PRIVACY_CONTACT.entity} is responsible for the personal information described here.`,
      ],
    },
  ],
}

const es: PrivacyPolicy = {
  title: 'Política de privacidad',
  metaDescription: 'Qué recopila Suma, para qué, con quién se comparte y qué opciones tienes.',
  intro:
    'Suma te ayuda a calcular créditos, hipotecas, ahorros e inversiones. Para eso maneja números sobre tu dinero, así que esta página explica con claridad qué recopilamos, qué hacemos con ello y qué nunca hacemos.',
  updated: (date) => `Última actualización: ${date}`,
  summaryTitle: 'En resumen',
  summary: [
    'Puedes usar todas las calculadoras sin cuenta. Los números que escribes se calculan en tu navegador y no se guardan.',
    'No vendemos tu información personal ni la compartimos con prestamistas.',
    'Si creas una cuenta, guardamos lo que tú decidas guardar (escenarios, metas y tu perfil financiero) hasta que lo borres.',
    'Puedes pedirnos una copia de tus datos, corregirlos o eliminarlos cuando quieras.',
  ],
  contentsTitle: 'En esta página',
  sections: [
    {
      id: 'collect',
      title: 'Qué recopilamos',
      body: [
        'Al usar las calculadoras sin cuenta:',
        [
          'Los números que escribes en una calculadora se quedan en tu navegador. Se calculan ahí y no se guardan en nuestros servidores.',
          'Para ordenar ofertas para ti, enviamos a nuestro servidor el monto, el plazo y los datos de perfil que hayas ingresado (como un rango de puntaje de crédito o tu ingreso). Se usan para esa consulta y no se guardan.',
          'Tu país, deducido de tu conexión en tu primera visita o según lo elijas. Lo guardamos en una cookie para mostrar la moneda y las tasas correctas.',
        ],
        'Si creas una cuenta:',
        [
          'Tu correo electrónico, para iniciar sesión.',
          'Lo que decidas guardar: escenarios de las calculadoras, metas de ahorro e inversión, y el perfil financiero que llenes (ingresos, gastos, pagos de deudas, puntaje de crédito, ahorros y tolerancia al riesgo).',
        ],
        'De forma automática:',
        [
          'Cuando haces clic en la oferta de un prestamista o de una cuenta, registramos el clic (qué oferta, su posición y tu país) para medir qué ofertas son útiles.',
          'Si usas el asesor con IA, registramos cuánto se usó (una cuenta del texto procesado), no lo que preguntaste.',
          'Donde la analítica de producto está activa, registramos qué páginas y calculadoras se usan. Estos eventos no incluyen los montos que escribes.',
        ],
      ],
    },
    {
      id: 'use',
      title: 'Para qué lo usamos',
      body: [
        [
          'Para que funcionen las calculadoras y mostrar resultados en tu moneda y tu mercado.',
          'Para ordenar prestamistas y cuentas según tu monto, plazo y perfil.',
          'Para guardar tus escenarios, metas y perfil, si tienes cuenta.',
          'Para responder tus preguntas en el asesor con IA, cuando lo usas.',
          'Para entender qué funciones ayudan a la gente, corregir problemas y mantener el servicio seguro.',
        ],
        'No usamos tu información para tomar decisiones de crédito ni decidimos si calificas para algo: las ofertas marcadas “Es probable que califiques” son estimaciones a partir de los requisitos que publican los prestamistas.',
      ],
    },
    {
      id: 'ai',
      title: 'El asesor con IA',
      body: [
        'Cuando le haces una pregunta al asesor con IA, tu pregunta y las cifras que necesita (por ejemplo, el resultado de un cálculo) se envían a Anthropic, la empresa que provee el modelo de IA, para redactar la respuesta. Anthropic los procesa por cuenta nuestra y, según nuestro acuerdo, no los usa para entrenar sus modelos.',
        'Evita escribir datos que el asesor no necesita, como números de cuenta o tu nombre completo.',
      ],
    },
    {
      id: 'share',
      title: 'Con quién lo compartimos',
      body: [
        'No vendemos tu información personal ni la compartimos con prestamistas o anunciantes. Cuando haces clic en una oferta vas al sitio del prestamista, y desde ahí aplica su política de privacidad.',
        'Usamos algunos proveedores que procesan datos por cuenta nuestra, solo para operar Suma:',
        [
          'Supabase: base de datos e inicio de sesión, donde se guardan las cuentas y los datos guardados.',
          'Anthropic: el modelo de IA del asesor.',
          'PostHog: analítica de producto, donde está activa.',
          'Vercel: alojamiento; ve tu dirección IP cuando te conectas y nos indica tu país.',
        ],
        'También podemos revelar información cuando la ley lo exija, o para proteger los derechos y la seguridad de nuestros usuarios y de Suma.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies y almacenamiento local',
      body: [
        [
          'country: recuerda tu país durante un año, para que precios y tasas correspondan a tu mercado. Necesaria para que el sitio funcione.',
          'Cookies de inicio de sesión: mantienen tu sesión abierta, solo si tienes cuenta. Necesarias para el área de cuenta.',
          'Un ajuste del navegador que recuerda cómo prefieres ver las tasas (por ejemplo E.A. o M.V. en Colombia). Nunca sale de tu dispositivo.',
          'Cookies de analítica, donde la analítica de producto está activa.',
        ],
        'Puedes borrar las cookies y los datos del sitio en tu navegador cuando quieras. El sitio sigue funcionando, pero te pedirá tu país de nuevo y cerrará tu sesión.',
      ],
    },
    {
      id: 'retention',
      title: 'Cuánto tiempo lo guardamos',
      body: [
        'Los datos que escribes en las calculadoras no se guardan. Los datos de la cuenta (tu correo, escenarios, metas y perfil) se guardan hasta que los borres o cierres tu cuenta; luego los eliminamos en un plazo de 30 días, salvo cuando la ley nos obligue a conservar algo por más tiempo. Los registros de clics en ofertas y de uso de la IA se guardan hasta 24 meses y dejan de estar vinculados a ti cuando eliminas tu cuenta.',
      ],
    },
    {
      id: 'rights',
      title: 'Tus opciones y derechos',
      body: [
        'Según dónde vivas, puedes pedirnos:',
        [
          'una copia de la información personal que tenemos sobre ti;',
          'corregir la información que esté mal;',
          'eliminar tu información o tu cuenta;',
          'dejar de usarla o limitar su uso, u oponerte a un uso;',
          'retirar un consentimiento que diste antes.',
        ],
        'Puedes editar o borrar tus escenarios, metas y perfil desde tu cuenta cuando quieras. Para cualquier otra solicitud, escríbenos a la dirección de abajo; respondemos en el plazo que fija la ley de tu país. También puedes presentar una queja ante tu autoridad de protección de datos, como la Superintendencia de Industria y Comercio en Colombia o la Office of the Privacy Commissioner en Canadá.',
      ],
    },
    {
      id: 'security',
      title: 'Seguridad',
      body: [
        'Los datos viajan cifrados, y los datos de las cuentas se guardan con reglas de acceso que permiten a cada usuario leer solo sus propios registros. Ningún sistema es perfectamente seguro, pero limitamos lo que recopilamos para que haya menos que proteger.',
      ],
    },
    {
      id: 'children',
      title: 'Menores de edad',
      body: ['Suma está pensada para adultos. No recopilamos a sabiendas información de menores de 18 años.'],
    },
    {
      id: 'changes',
      title: 'Cambios a esta política',
      body: [
        'Cuando cambiamos esta política, actualizamos la fecha de arriba. Si un cambio afecta cómo usamos información que ya nos diste, se lo avisamos a los usuarios con sesión iniciada antes de que entre en vigor.',
      ],
    },
    {
      id: 'contact',
      title: 'Contacto',
      body: [
        `Preguntas o solicitudes sobre tu privacidad: ${PRIVACY_CONTACT.email}. ${PRIVACY_CONTACT.entity} es responsable de la información personal descrita aquí.`,
      ],
    },
  ],
}

export function getPrivacyPolicy(language: Language): PrivacyPolicy {
  return language === 'es' ? es : en
}
