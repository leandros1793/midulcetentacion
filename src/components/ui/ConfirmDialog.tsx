import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex gap-3 mb-5">
        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancelar</button>
        <button onClick={onConfirm} className="btn-danger flex-1 justify-center">Eliminar</button>
      </div>
    </Modal>
  );
}
