import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { Icon, Icons } from 'folds';
import aiImg from '@app/static/imgs/Group 99245961.svg';
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
          <SidebarAvatar as="button" ref={triggerRef} onClick={handleClick}>
            <img src={aiImg} alt="" />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
