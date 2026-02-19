import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef, useEffect, useRef } from "react";

export interface ModalProps extends HTMLAttributes<HTMLDialogElement> {
  open?: boolean;
  onClose?: () => void;
  responsive?: boolean;
}

const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ className, open, onClose, responsive, children, ...props }, ref) => {
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    const setRefs = (el: HTMLDialogElement | null) => {
      dialogRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (open) {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.close();
      }
    }, [open]);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog || !onClose) return;

      const handleClose = () => onClose();
      dialog.addEventListener("close", handleClose);
      return () => dialog.removeEventListener("close", handleClose);
    }, [onClose]);

    return (
      <dialog
        className={cn(
          "modal",
          responsive && "modal-bottom sm:modal-middle",
          className,
        )}
        ref={setRefs}
        {...props}
      >
        {children}
      </dialog>
    );
  },
);
Modal.displayName = "Modal";

const ModalBox = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("modal-box", className)} ref={ref} {...props} />
  ),
);
ModalBox.displayName = "ModalBox";

const ModalAction = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("modal-action", className)} ref={ref} {...props} />
  ),
);
ModalAction.displayName = "ModalAction";

const ModalBackdrop = () => (
  <form method="dialog" className="modal-backdrop">
    <button>close</button>
  </form>
);

export { Modal, ModalBox, ModalAction, ModalBackdrop };
