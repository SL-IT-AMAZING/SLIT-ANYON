import { Palette, Sparkles, Zap } from "lucide-react";

export function OverviewPreview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">DaisyUI Component Preview</h1>
        <p className="text-lg opacity-75">
          A comprehensive showcase of DaisyUI components with Tailwind CSS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="card-title">Beautiful Design</h2>
            </div>
            <p>
              DaisyUI provides beautiful, pre-built components with a consistent
              design system.
            </p>
          </div>
        </div>

        <div className="card bg-secondary text-secondary-content shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6" />
              <h2 className="card-title">Fast Development</h2>
            </div>
            <p>Build UIs rapidly with ready-to-use components and utilities.</p>
          </div>
        </div>

        <div className="card bg-accent text-accent-content shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-3">
              <Palette className="w-6 h-6" />
              <h2 className="card-title">Theme Support</h2>
            </div>
            <p>
              Multiple built-in themes to customize your application's look and
              feel.
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 opacity-75">
            <li>Semantic HTML components</li>
            <li>CSS utilities for rapid styling</li>
            <li>Dark mode support</li>
            <li>Responsive design patterns</li>
            <li>Accessibility-first approach</li>
            <li>Highly customizable themes</li>
          </ul>
        </div>
      </div>

      <div className="alert alert-info shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          Navigate through the tabs above to explore different component
          categories and see live examples.
        </span>
      </div>
    </div>
  );
}
