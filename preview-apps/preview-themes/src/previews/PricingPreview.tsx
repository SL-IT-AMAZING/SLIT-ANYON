import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Basic",
    monthly: 19,
    yearly: 15,
    description: "For solo creators shipping quickly.",
    features: ["3 projects", "Community support", "Basic analytics"],
  },
  {
    name: "Pro",
    monthly: 49,
    yearly: 39,
    description: "For growing teams with higher velocity.",
    features: [
      "Unlimited projects",
      "Priority support",
      "Advanced automations",
      "Custom domains",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthly: 129,
    yearly: 109,
    description: "For organizations that need governance and scale.",
    features: ["SSO + SCIM", "Audit logs", "Dedicated CSM", "Security reviews"],
  },
];

const matrix = [
  ["Projects", "3", "Unlimited", "Unlimited"],
  ["Team members", "5", "50", "Unlimited"],
  ["Automation runs", "1k / month", "50k / month", "Unlimited"],
  ["Support", "Community", "Priority", "Dedicated"],
  ["Data retention", "30 days", "1 year", "Custom"],
];

export function PricingPreview() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Simple plans that scale from launch to enterprise.
        </p>
      </header>

      <div className="flex items-center justify-center gap-3 text-sm">
        <span
          className={!isYearly ? "text-foreground" : "text-muted-foreground"}
        >
          Monthly
        </span>
        <button
          onClick={() => setIsYearly((prev) => !prev)}
          className={`h-6 w-11 rounded-full p-0.5 transition-colors ${isYearly ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-card transition-transform ${isYearly ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
        <span
          className={isYearly ? "text-foreground" : "text-muted-foreground"}
        >
          Yearly
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-xl border p-5 ${
              plan.highlighted
                ? "border-primary bg-primary/5 shadow-sm"
                : "bg-card text-card-foreground"
            }`}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {plan.name}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              ${isYearly ? plan.yearly : plan.monthly}
              <span className="text-base font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {plan.description}
            </p>
            <button
              className={`mt-5 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-secondary-foreground hover:opacity-90"
              }`}
            >
              Choose {plan.name}
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <article className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="border-b px-5 py-4">
          <p className="font-medium">Feature Comparison</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-left font-medium">Basic</th>
                <th className="px-4 py-3 text-left font-medium">Pro</th>
                <th className="px-4 py-3 text-left font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row[0]} className="border-t">
                  <td className="px-4 py-3">{row[0]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row[1]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row[2]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
