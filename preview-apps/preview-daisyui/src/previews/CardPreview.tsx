export function CardPreview() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Cards</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <figure>
            <div className="bg-gradient-to-r from-primary to-secondary h-48 w-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Image</span>
            </div>
          </figure>
          <div className="card-body">
            <h2 className="card-title">Card with Image</h2>
            <p>
              This card demonstrates how to include an image or figure element.
            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>

        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Colored Card</h2>
            <p>
              This card uses the primary color for a more prominent appearance.
            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-ghost btn-sm">Action</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg border-l-4 border-accent">
          <div className="card-body">
            <h2 className="card-title text-accent">Accent Border Card</h2>
            <p>Cards can have accented borders for visual distinction.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-accent btn-sm">Explore</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Compact Card</h2>
            <p className="text-sm">
              This is a more compact card with less padding.
            </p>
            <div className="card-actions justify-between mt-4">
              <span className="text-xs opacity-50">Card Footer</span>
              <button className="btn btn-sm btn-ghost">×</button>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary via-accent to-secondary text-primary-content shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Gradient Card</h2>
            <p>Use Tailwind's gradient utilities for dynamic backgrounds.</p>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-sm btn-outline btn-primary">
                View
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Centered Card</h2>
            <p>This card centers its content for a different layout style.</p>
            <div className="card-actions">
              <button className="btn btn-primary btn-sm">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
