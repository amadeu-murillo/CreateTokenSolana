import React from 'react';
import styles from './ManageAuthorityModal.module.css';
import { Button } from './ui/button';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading: boolean;
}

const ManageAuthorityModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, title, description, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
                <div className={styles.actions}>
                    <Button onClick={onClose} className={styles.cancelButton} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={onConfirm} className={styles.confirmButton} disabled={isLoading}>
                        {isLoading ? 'Confirmando...' : 'Confirmar e Remover'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManageAuthorityModal;
