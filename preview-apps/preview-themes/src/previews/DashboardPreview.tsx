import { Activity, BarChart3, CircleDollarSign, Users } from "lucide-react";

const metrics = [
  { label: "Visitors", value: "82,419", change: "+8.2%", icon: Activity },
  {
    label: "Revenue",
    value: "$129,430",
    change: "+11.4%",
    icon: CircleDollarSign,
  },
  { label: "Conversion", value: "4.83%", change: "+0.6%", icon: BarChart3 },
  { label: "Customers", value: "12,284", change: "+3.1%", icon: Users },
];

const rows = [
  {
    account: "Nordstar Labs",
    plan: "Enterprise",
    mrr: "$2,400",
    status: "Active",
  },
  { account: "Granite & Co.", plan: "Pro", mrr: "$790", status: "Active" },
  { account: "Riverline Health", plan: "Pro", mrr: "$790", status: "Trial" },
  { account: "Luna Creative", plan: "Basic", mrr: "$190", status: "Pending" },
  {
    account: "Orbit Commerce",
    plan: "Enterprise",
    mrr: "$2,400",
    status: "Active",
  },
];

export function DashboardPreview() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="grid min-h-[680px] lg:grid-cols-[250px_1fr]">
        <aside className="border-r bg-sidebar px-4 py-5 text-sidebar-foreground">
          <p className="mb-6 text-sm font-semibold tracking-wide">
            Growth Console
          </p>
          <nav className="space-y-1 text-sm">
            {[
              "Overview",
              "Analytics",
              "Customers",
              "Subscriptions",
              "Payouts",
              "Settings",
            ].map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                  index === 0
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <div className="bg-background p-5 sm:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Overview of account and revenue activity.
              </p>
            </div>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Create Report
            </button>
          </header>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {metric.label}
                    </p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-primary">
                    {metric.change} from last month
                  </p>
                </article>
              );
            })}
          </div>

          <article className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <p className="font-medium">Accounts</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Account</th>
                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                    <th className="px-4 py-3 text-left font-medium">MRR</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.account} className="border-t">
                      <td className="px-4 py-3">{row.account}</td>
                      <td className="px-4 py-3">{row.plan}</td>
                      <td className="px-4 py-3">{row.mrr}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            row.status === "Active"
                              ? "bg-primary/15 text-primary"
                              : row.status === "Trial"
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
