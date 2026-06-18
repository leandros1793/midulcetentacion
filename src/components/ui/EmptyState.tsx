import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="bg-rose-50 rounded-full p-5 mb-4">
        <Icon size={36} className="text-rose-300" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-5">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}
