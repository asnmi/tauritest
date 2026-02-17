import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import './ConfirmDelete.css';

interface ConfirmDeleteProps {
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ConfirmDelete({
  title = "Confirmer la suppression",
  message,
  onCancel,
  onConfirm,
  cancelText = "Annuler",
  confirmText = "Supprimer",
  children,
  open,
  onOpenChange
}: ConfirmDeleteProps) {
  const handleCancel = () => {
    onCancel();
    onOpenChange?.(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="confirm-delete-dialog">
        <DialogHeader>
          <DialogTitle className="confirm-delete-title">{title}</DialogTitle>
        </DialogHeader>
        <div className="confirm-delete-content">
          <p className="confirm-delete-message">{message}</p>
          <div className="confirm-delete-buttons">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="confirm-delete-cancel"
            >
              {cancelText}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              className="confirm-delete-confirm"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}