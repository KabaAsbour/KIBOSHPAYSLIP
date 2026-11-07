import React from 'react';
import { UserSession } from '../../types';
import { LoginPage } from './LoginPage';

interface LoginTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: UserSession) => void;
  onOpenRegister: () => void;
}

export const LoginTenantModal: React.FC<LoginTenantModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  onOpenRegister
}) => {
  if (!isOpen) return null;

  return (
    <LoginPage
      isModal={true}
      onClose={onClose}
      onLoginSuccess={(session) => {
        onSelectSession(session);
        onClose();
      }}
      onOpenRegister={() => {
        onClose();
        onOpenRegister();
      }}
    />
  );
};
