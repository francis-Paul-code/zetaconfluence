import React from 'react';

import type { Wallet } from '../constants/chains';
import { useWallet } from '../hooks/useWallet';
import { Modal } from './Modal';

export interface connectedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
}

const ConnectedWalletModal = ({
  isOpen,
  onClose,
  wallet,
}: connectedWalletModalProps) => {
  const { isConnected } = useWallet();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wallet.eip6963.info.name}>
      <div></div>
    </Modal>
  );
};

export default ConnectedWalletModal;
