import { Menu, X } from "lucide-react";
import { useState } from "react";

export function NavigationPreview() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Navigation</h2>

      <div>
        <h3 className="text-lg font-semibold mb-3">Tabs</h3>
        <div className="tabs tabs-bordered">
          <input
            type="radio"
            name="tab_demo"
            className="tab"
            aria-label="Dashboard"
            checked={activeTab === "tab1"}
            onChange={() => setActiveTab("tab1")}
          />
          <div className="tab-content p-4">Dashboard Content</div>

          <input
            type="radio"
            name="tab_demo"
            className="tab"
            aria-label="Profile"
            checked={activeTab === "tab2"}
            onChange={() => setActiveTab("tab2")}
          />
          <div className="tab-content p-4">Profile Content</div>

          <input
            type="radio"
            name="tab_demo"
            className="tab"
            aria-label="Settings"
            checked={activeTab === "tab3"}
            onChange={() => setActiveTab("tab3")}
          />
          <div className="tab-content p-4">Settings Content</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Navbar</h3>
        <div className="navbar bg-base-100 shadow-lg rounded-lg">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">AppName</a>
          </div>
          <div className="flex-none gap-2 hidden md:flex">
            <nav className="flex gap-1">
              <a className="btn btn-ghost btn-sm">Home</a>
              <a className="btn btn-ghost btn-sm">Features</a>
              <a className="btn btn-ghost btn-sm">Pricing</a>
              <a className="btn btn-ghost btn-sm">Docs</a>
            </nav>
          </div>
          <div className="flex-none gap-2">
            <button className="btn btn-primary btn-sm">Sign in</button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Breadcrumbs</h3>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#">Documents</a>
            </li>
            <li>Add document</li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Steps</h3>
        <ul className="steps steps-vertical lg:steps-horizontal w-full">
          <li className="step step-primary">Register</li>
          <li className="step step-primary">Choose plan</li>
          <li className="step">Purchase</li>
          <li className="step">Receive Product</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Dropdown Menu</h3>
        <div className="dropdown">
          <button className="btn btn-secondary m-1">Click me</button>
          <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <a>Item 1</a>
            </li>
            <li>
              <a>Item 2</a>
            </li>
            <li>
              <a>Item 3</a>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Mobile Menu</h3>
        <div className="relative border rounded-lg p-4 bg-base-100">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-base-100 border rounded-lg shadow-lg z-10">
              <nav className="p-3 space-y-2">
                <a className="block px-4 py-2 hover:bg-base-200 rounded">
                  Home
                </a>
                <a className="block px-4 py-2 hover:bg-base-200 rounded">
                  Products
                </a>
                <a className="block px-4 py-2 hover:bg-base-200 rounded">
                  About
                </a>
                <a className="block px-4 py-2 hover:bg-base-200 rounded">
                  Contact
                </a>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
