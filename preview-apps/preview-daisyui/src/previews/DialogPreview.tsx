import { useState } from "react";

export function DialogPreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dialogs (Modals)</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Basic Modal</h3>
          <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
            Open Modal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Default Modal</h3>
            <button
              className="btn btn-outline"
              onClick={() => {
                const modal = document.getElementById(
                  "modal1",
                ) as HTMLDialogElement;
                modal?.showModal();
              }}
            >
              Open
            </button>
            <dialog id="modal1" className="modal">
              <form method="dialog" className="modal-box">
                <h3 className="font-bold text-lg">Default Modal</h3>
                <p className="py-4">This is a basic modal using DaisyUI.</p>
                <div className="modal-action">
                  <button className="btn btn-primary">Close</button>
                </div>
              </form>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Alert Modal</h3>
            <button
              className="btn btn-warning"
              onClick={() => {
                const modal = document.getElementById(
                  "modal2",
                ) as HTMLDialogElement;
                modal?.showModal();
              }}
            >
              Show Alert
            </button>
            <dialog id="modal2" className="modal">
              <form
                method="dialog"
                className="modal-box bg-warning text-warning-content"
              >
                <h3 className="font-bold text-lg">Warning</h3>
                <p className="py-4">
                  This is a warning modal with alert styling.
                </p>
                <div className="modal-action">
                  <button className="btn btn-ghost">Got it!</button>
                </div>
              </form>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Confirmation Modal</h3>
            <button
              className="btn btn-error"
              onClick={() => {
                const modal = document.getElementById(
                  "modal3",
                ) as HTMLDialogElement;
                modal?.showModal();
              }}
            >
              Confirm Action
            </button>
            <dialog id="modal3" className="modal">
              <form method="dialog" className="modal-box">
                <h3 className="font-bold text-lg">Confirmation</h3>
                <p className="py-4">Are you sure you want to proceed?</p>
                <div className="modal-action">
                  <button className="btn btn-ghost">Cancel</button>
                  <button className="btn btn-error">Confirm</button>
                </div>
              </form>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Bottom Sheet Modal</h3>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const modal = document.getElementById(
                "modal4",
              ) as HTMLDialogElement;
              modal?.showModal();
            }}
          >
            Open Bottom Sheet
          </button>
          <dialog id="modal4" className="modal modal-bottom sm:modal-middle">
            <form method="dialog" className="modal-box">
              <h3 className="font-bold text-lg">Bottom Sheet</h3>
              <p className="py-4">
                This modal appears at the bottom on mobile.
              </p>
              <div className="modal-action">
                <button className="btn">Close</button>
              </div>
            </form>
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">React State Modal</h3>
            <p className="mb-6">
              This modal is controlled by React state instead of HTML dialog
              element.
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
