import { useState } from "react";

export function InputPreview() {
  const [formData, setFormData] = useState({
    text: "",
    email: "",
    textarea: "",
    checkbox: false,
    radio: "",
    select: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Form Inputs</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Text Input</h3>
          <input
            type="text"
            name="text"
            placeholder="Type here"
            value={formData.text}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Email Input</h3>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Textarea</h3>
          <textarea
            name="textarea"
            placeholder="Enter your message"
            value={formData.textarea}
            onChange={handleChange}
            className="textarea textarea-bordered w-full h-32"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Select</h3>
          <select
            name="select"
            value={formData.select}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="">Choose an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Range Input</h3>
          <input type="range" min="0" max="100" className="range" />
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Checkbox & Radio</h3>
          <div className="space-y-3">
            <div className="form-control">
              <label className="cursor-pointer label">
                <span className="label-text">Remember me</span>
                <input
                  type="checkbox"
                  name="checkbox"
                  checked={formData.checkbox}
                  onChange={handleChange}
                  className="checkbox"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="radio"
                  value="option1"
                  checked={formData.radio === "option1"}
                  onChange={handleChange}
                  className="radio"
                />
                <span>Option 1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="radio"
                  value="option2"
                  checked={formData.radio === "option2"}
                  onChange={handleChange}
                  className="radio"
                />
                <span>Option 2</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Form Data</h3>
          <pre className="bg-base-300 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
