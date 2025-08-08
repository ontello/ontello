import React from 'react';
import PropTypes from 'prop-types';
import './RoomTile.scss';

import colorMXID from '../../../util/colorMXID';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';

function RoomTile({
  avatarSrc,
  name,
  id,
  description,
  inviterName,
  memberCount,
  desc,
  options,
  users,
}) {
  return (
    <div className="room-tile">
      <div className="room-tile__avatar">
        <Avatar imageSrc={avatarSrc} bgColor={colorMXID(id)} text={name} />
      </div>
      <div className="room-tile__content">
        <Text variant="s1" className="room-tile__name">
          <span>{name}</span>
          {users !== null && <span className="room-tile__users">{users}</span>}
        </Text>
        <Text variant="b3" className="room-tile__id">
          {(inviterName !== null
            ? `Invited by ${inviterName} to ${id}${
                memberCount === null ? '' : ` • ${memberCount} members`
              }`
            : id + (memberCount === null ? '' : ` • ${memberCount} members`)) +
            (description ? ` | ${description}` : '')}
        </Text>
        {desc !== null && typeof desc === 'string' ? (
          <Text className="room-tile__content__desc" variant="b2">
            {desc}
          </Text>
        ) : (
          desc
        )}
      </div>
      {options !== null && <div className="room-tile__options">{options}</div>}
    </div>
  );
}

RoomTile.defaultProps = {
  avatarSrc: null,
  description: null,
  inviterName: null,
  options: null,
  desc: null,
  memberCount: null,
  users: null,
};
RoomTile.propTypes = {
  avatarSrc: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  description: PropTypes.string,
  inviterName: PropTypes.string,
  memberCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  desc: PropTypes.node,
  options: PropTypes.node,
  users: PropTypes.node,
};

export default RoomTile;
