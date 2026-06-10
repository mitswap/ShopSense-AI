import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  Brain,
  CheckCircle2,
  ChevronDown,
  CloudSun,
  Link2,
  MessageSquare,
  ShieldCheck,
  Store,
} from 'lucide-react'

type FeatureItem = {
  icon: typeof Store
  title: string
  text: string
}

const featureItems: FeatureItem[] = [
  {
    icon: Store,
    title: 'Dashboards',
    text: 'Read sales, stock pressure, and store performance in one calm workspace instead of scattered reports.',
  },
  {
    icon: MessageSquare,
    title: 'Shop Analyzer',
    text: 'Ask natural questions about your shop data and get grounded answers in a proper AI chat experience.',
  },
  {
    icon: Brain,
    title: 'AI Advice',
    text: 'Use owner advice, root-cause analysis, and weather-aware guidance to decide what to reorder or protect.',
  },
  {
    icon: CloudSun,
    title: 'Weather Advice',
    text: 'Combine forecast conditions with shop context to prepare inventory and store actions ahead of demand shifts.',
  },
  {
    icon: Link2,
    title: 'Analytics & Connections',
    text: 'Understand product relationships, graph signals, and hidden movement across your inventory.',
  },
  {
    icon: Boxes,
    title: 'Live Inventory',
    text: 'Track low stock, dead stock, and product-level availability before shelf problems hit daily sales.',
  },
]

const workflowSteps = [
  {
    number: '01',
    title: 'Upload your data',
    text: 'Bring in your sales and inventory dataset to create the working shop context.',
  },
  {
    number: '02',
    title: 'Open the dashboards',
    text: 'Review revenue, stock movement, and category performance in a clean view.',
  },
  {
    number: '03',
    title: 'Ask Shop Analyzer',
    text: 'Chat with your data to check stock, trends, risks, and product-specific questions.',
  },
  {
    number: '04',
    title: 'Get AI advice',
    text: 'Use advice, root cause, and weather reasoning for better business decisions.',
  },
  {
    number: '05',
    title: 'Act on inventory',
    text: 'Update stock, plan purchases, and move faster with clearer signals.',
  },
] as const

const valuePillars = [
  {
    icon: Store,
    title: 'Built for everyday retail operations',
    text: 'The product is designed for busy shop owners who need direction fast, not enterprise complexity.',
  },
  {
    icon: ShieldCheck,
    title: 'Grounded in your real shop data',
    text: 'Numbers stay tied to analytics, inventory, forecasts, and product evidence instead of random text.',
  },
  {
    icon: Brain,
    title: 'AI that leads to action',
    text: "The goal is not summary for summary's sake. It is reorder, protect, investigate, and improve.",
  },
  {
    icon: CloudSun,
    title: 'One place for daily decisions',
    text: 'Dashboards, alerts, advice, and analyzer chat work together so the store view stays connected.',
  },
] as const

const pricingPlans = [
  {
    name: 'Free Trial',
    label: 'Available now',
    price: 'Start Trial',
    description:
      'Use the current product flow through the existing login and explore the core intelligence experience.',
    bullets: [
      'Landing page routes to the same login flow',
      'Dashboards, alerts, analyzer, and advice',
      'Best for exploring the current product',
    ],
    cta: 'Start Trial',
    href: '/login',
    upcoming: false,
  },
  {
    name: 'Pro',
    label: 'Coming soon',
    price: 'Upcoming',
    description:
      'For stores that want deeper forecasting, more workflow depth, and broader AI operating support.',
    bullets: [
      'Advanced operational intelligence',
      'Expanded team workflows',
      'Deeper store planning features',
    ],
    cta: '',
    href: '',
    upcoming: true,
  },
  {
    name: 'Custom',
    label: 'Coming soon',
    price: 'Upcoming',
    description:
      'For larger rollouts that need tailored onboarding, deployment planning, and store-specific setup.',
    bullets: [
      'Multi-store alignment',
      'Tailored onboarding',
      'Custom deployment planning',
    ],
    cta: '',
    href: '',
    upcoming: true,
  },
] as const

const faqItems = [
  {
    question: 'What type of business is ShopSense AI built for?',
    answer:
      'ShopSense AI is built for SMEs and modern retail shops that need clearer visibility into stock, sales, alerts, and next actions.',
  },
  {
    question: 'Does the landing page create a new signup flow?',
    answer:
      'No. The current landing page still routes into the existing product login flow without changing how the app works today.',
  },
  {
    question: 'What insights does the platform generate?',
    answer:
      'It helps with dashboards, Shop Analyzer chat, AI advice, weather guidance, inventory visibility, and product-connection analytics.',
  },
  {
    question: 'Can merchants use it without advanced analytics knowledge?',
    answer:
      'Yes. The experience is designed to feel direct and usable for everyday operators who want clearer signals, not technical complexity.',
  },
  {
    question: 'Are Pro and Custom available today?',
    answer:
      'Not yet. They are shown as the roadmap while the currently available experience stays focused on the existing Free Trial flow.',
  },
] as const

function SectionHeading({
  eyebrow,
  title,
  text,
  invert = false,
}: {
  eyebrow: string
  title: string
  text: string
  invert?: boolean
}) {
  return (
    <div className="max-w-4xl">
      <p
        className={`text-xs font-extrabold uppercase tracking-[0.28em] ${
          invert ? 'text-emerald-300' : 'text-emerald-700'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl ${
          invert ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-5 max-w-3xl text-base leading-8 ${
          invert ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {text}
      </p>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#eef3ec] px-3 py-3 sm:px-5">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5">
        <section className="overflow-hidden rounded-[34px] border border-[#d8e5d7] bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
          <header className="relative flex items-center justify-between border-b border-[#e5ede2] px-6 py-5">
            <Link to="/" className="relative z-10 shrink-0">
              <img
                src="/Logo-ShopSense-AI.png"
                alt="ShopSense AI"
                className="h-20 w-auto max-w-[320px] object-contain"
              />
            </Link>

            <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#111a17] px-6 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.14)] md:block">
              <div className="flex flex-wrap items-center justify-center gap-6 text-[0.95rem] font-semibold text-white">
                <a href="#features" className="transition hover:text-emerald-300">
                  Features
                </a>
                <a href="#workflow" className="transition hover:text-emerald-300">
                  How it Works
                </a>
                <a href="#pricing" className="transition hover:text-emerald-300">
                  Pricing
                </a>
                <a href="#faq" className="transition hover:text-emerald-300">
                  FAQ
                </a>
              </div>
            </nav>

            <div className="relative z-10 ml-auto shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3 text-[0.95rem] font-semibold text-white shadow-[0_18px_38px_rgba(5,150,105,0.22)] transition hover:opacity-95"
              >
                Login
              </Link>
            </div>
          </header>

          <div className="relative overflow-hidden px-6 py-8 lg:px-8 lg:py-10">
            <div className="pointer-events-none absolute left-[-126px] top-[86px] h-52 w-52">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_198deg,transparent_0deg,transparent_212deg,#a7f3d0_238deg,#34d399_282deg,#14b8a6_324deg,#059669_360deg)] opacity-95 shadow-[0_14px_38px_rgba(16,185,129,0.24)]" />
              <div className="absolute inset-[26px] rounded-full bg-white" />
              <div className="absolute left-[14px] top-[18px] h-36 w-36 rounded-full bg-emerald-300/30 blur-2xl" />
            </div>
            <div className="pointer-events-none absolute right-[-126px] top-[84px] h-52 w-52">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_-18deg,transparent_0deg,transparent_212deg,#a7f3d0_238deg,#34d399_282deg,#14b8a6_324deg,#059669_360deg)] opacity-95 shadow-[0_14px_38px_rgba(20,184,166,0.24)]" />
              <div className="absolute inset-[26px] rounded-full bg-white" />
              <div className="absolute right-[14px] top-[18px] h-36 w-36 rounded-full bg-teal-300/30 blur-2xl" />
            </div>

            <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
              <h1 className="max-w-[12ch] text-[clamp(2.25rem,5vw,4.15rem)] font-black leading-[1.05] tracking-[-0.04em] text-slate-950">
                Transforming SME Data
                <br />
                Into <span className="text-emerald-700">Business Intelligence</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                Helping online businesses make smarter decisions with AI.
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(5,150,105,0.22)] transition hover:opacity-95"
                >
                  Start Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="rounded-[34px] border border-[#d8e5d7] bg-white px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8"
        >
          <SectionHeading
            eyebrow="Features"
            title="The main parts of the product, without the noise."
            text="Each section is built to make the next business decision easier, not to overwhelm the screen."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureItems.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-[28px] border border-[#dce7db] bg-[#fbfdfa] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)]"
              >
                <div className="w-fit rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-8 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="rounded-[34px] border border-[#1d3228] bg-[#101916] px-6 py-8 shadow-[0_24px_65px_rgba(15,23,42,0.18)] sm:px-8"
        >
          <SectionHeading
            eyebrow="How It Works"
            title="A simple workflow from data to decision."
            text="The experience is designed to feel direct: upload, read, ask, decide, and update."
            invert
          />
          <div className="mt-10 grid gap-4 xl:grid-cols-5">
            {workflowSteps.map((step) => (
              <article key={step.number} className="rounded-[28px] border border-[#2c4037] bg-[#18231e] p-5">
                <span className="inline-flex rounded-full bg-[#0f8d66] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-white">
                  {step.number}
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.03em] text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-8 text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="why-us"
          className="rounded-[34px] border border-[#d8e5d7] bg-white px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8"
        >
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Built to solve real retail problems with less friction."
            text="The product focuses on clarity, grounded reasoning, and actions that matter inside a working shop."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {valuePillars.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-[28px] border border-[#dce7db] bg-[#fbfdfa] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)]"
              >
                <div className="w-fit rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-8 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="rounded-[34px] border border-[#1d3228] bg-[#101916] px-6 py-8 shadow-[0_24px_65px_rgba(15,23,42,0.18)] sm:px-8"
        >
          <SectionHeading
            eyebrow="Pricing"
            title="Flexible now, expandable later"
            text="The current product flow is available through the Free plan. Pro and Custom stay visible as the roadmap without introducing a signup or payment experience."
            invert
          />
          <div className="mt-10 grid gap-4 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[30px] border p-6 ${
                  plan.upcoming ? 'border-[#2c4037] bg-[#18231e]' : 'border-[#19392f] bg-[#13201b]'
                }`}
              >
                <span className="inline-flex rounded-full bg-[#0f8d66] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-white">
                  {plan.label}
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-white">{plan.name}</h3>
                <strong className="mt-4 block text-5xl font-black tracking-[-0.07em] text-white">
                  {plan.price}
                </strong>
                <p className="mt-4 text-sm leading-8 text-slate-300">{plan.description}</p>

                <div className="mt-6 grid gap-3">
                  {plan.bullets.map((item) => (
                    <div key={item} className="rounded-[24px] border border-[#31433b] bg-[#1d2823] p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                        <p className="text-sm leading-7 text-slate-200">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  {plan.upcoming ? (
                    <div className="inline-flex w-full items-center justify-center rounded-full border border-[#31433b] px-5 py-4 text-sm font-semibold text-slate-300">
                      Upcoming plan
                    </div>
                  ) : (
                    <Link
                      to={plan.href}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(5,150,105,0.22)] transition hover:opacity-95"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="rounded-[34px] border border-[#d8e5d7] bg-white px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-emerald-700">FAQ</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Clear answers for merchants, teams, and judges
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                The landing page explains the current product honestly: what it does today, who it is for,
                and how the login flow works.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={item.question}
                  className="group rounded-[26px] border border-[#dce7db] bg-[#fbfdfa] px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-bold tracking-[-0.03em] text-slate-950">
                    <span>{item.question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 pr-8 text-sm leading-8 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <footer className="rounded-[34px] border border-[#d8e5d7] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
            <div>
              <img
                src="/Logo-ShopSense-AI.png"
                alt="ShopSense AI"
                className="h-14 w-auto max-w-[220px] object-contain"
              />
              <p className="mt-4 max-w-md text-sm leading-8 text-slate-600">
                An AI-powered business intelligence platform that helps merchants make better inventory and
                purchasing decisions.
              </p>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">Product</p>
              <div className="mt-5 space-y-4 text-[0.95rem] font-medium text-slate-600">
                <a href="#features" className="block transition hover:text-emerald-700">
                  Features
                </a>
                <a href="#why-us" className="block transition hover:text-emerald-700">
                  Why Us
                </a>
                <a href="#pricing" className="block transition hover:text-emerald-700">
                  Pricing
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">Access</p>
              <div className="mt-5 space-y-4 text-[0.95rem] font-medium text-slate-600">
                <Link to="/login" className="block transition hover:text-emerald-700">
                  Login
                </Link>
                <Link to="/login" className="block transition hover:text-emerald-700">
                  Start Trial
                </Link>
                <Link to="/docs" className="block transition hover:text-emerald-700">
                  Docs
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">Legal</p>
              <div className="mt-5 space-y-4 text-[0.95rem] font-medium text-slate-600">
                <a href="#faq" className="block transition hover:text-emerald-700">
                  FAQ
                </a>
                <a href="#why-us" className="block transition hover:text-emerald-700">
                  About
                </a>
                <a href="/" className="block transition hover:text-emerald-700">
                  Terms &amp; Conditions
                </a>
                <a href="/" className="block transition hover:text-emerald-700">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
