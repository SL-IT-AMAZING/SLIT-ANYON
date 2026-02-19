export function TablePreview() {
  const tableData = [
    {
      id: 1,
      name: "Alice Johnson",
      role: "Frontend Developer",
      status: "Active",
    },
    { id: 2, name: "Bob Smith", role: "Backend Developer", status: "Active" },
    { id: 3, name: "Carol White", role: "Design Lead", status: "Inactive" },
    { id: 4, name: "David Brown", role: "Product Manager", status: "Active" },
    { id: 5, name: "Eve Davis", role: "QA Engineer", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Tables</h2>

      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Table</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id}>
                  <th>{row.id}</th>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>
                    <span
                      className={`badge ${row.status === "Active" ? "badge-success" : "badge-error"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Compact Table</h3>
        <div className="overflow-x-auto">
          <table className="table table-compact table-sm">
            <thead>
              <tr className="bg-base-200">
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Laptop</td>
                <td>$999</td>
                <td>2</td>
                <td>$1,998</td>
              </tr>
              <tr className="hover">
                <td>Mouse</td>
                <td>$29</td>
                <td>5</td>
                <td>$145</td>
              </tr>
              <tr>
                <td>Keyboard</td>
                <td>$79</td>
                <td>3</td>
                <td>$237</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Colored Header Table</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-primary text-primary-content">
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Users</th>
                <td>1</td>
                <td>Unlimited</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <th>Storage</th>
                <td>5 GB</td>
                <td>100 GB</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <th>Support</th>
                <td>Community</td>
                <td>Email</td>
                <td>24/7 Phone</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
