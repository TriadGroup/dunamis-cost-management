import type { PropsWithChildren } from 'react';
import { CenterModal } from '@/shared/ui/CenterModal';

interface InspectorDrawerProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export const InspectorDrawer = ({ open, title, onClose, children }: InspectorDrawerProps) => {
  return (
    <CenterModal open={open} title={title} onClose={onClose}>
      <div className="inspector-content">{children}</div>
    </CenterModal>
  );
};
