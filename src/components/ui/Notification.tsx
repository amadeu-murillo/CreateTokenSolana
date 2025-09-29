"use client";

import React from 'react';
import styles from './Notification.module.css';

// Ícones SVG
const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const XCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

const InfoCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// Interface atualizada para incluir o tipo 'info'
export interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  txId?: string | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, txId, onClose }) => {
    
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <XCircle />;
      case 'info':
        return <InfoCircle />;
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.iconWrapper}>
        {getIcon()}
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        {type === 'success' && txId && (
          <a href={`https://solscan.io/tx/${txId}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className={styles.link}>
            Ver no Solscan
          </a>
        )}
      </div>
       <button onClick={onClose} className={styles.closeButton}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default Notification;
