import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'folds';
import WalletSideBarIcon from '@app/static/icons/WalletSideBarIcon';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { WALLET_PATH } from '../../paths';
import { useWalletSelected } from '../../../hooks/router/useWalletSelected';

export function WalletTab() {
  const walletSelected = useWalletSelected();

  const navigate = useNavigate();
  const handleClick = () => {
    navigate(WALLET_PATH);
  };

  return (
    <SidebarItem>
      <SidebarItemTooltip tooltip="Wallet">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} onClick={handleClick} outlined>
            <Icon src={WalletSideBarIcon} size="100" filled={walletSelected} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
