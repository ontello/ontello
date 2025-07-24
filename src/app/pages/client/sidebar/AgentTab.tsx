import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Icons } from 'folds';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { AGENT_PATH } from '../../paths';

export function AgentTab() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(AGENT_PATH);
  };
  return (
    <SidebarItem>
      <SidebarItemTooltip tooltip="Agent">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} outlined onClick={handleClick}>
            <Icon src={Icons.User} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
