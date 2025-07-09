import React from 'react';

export const List = ({ data, type }) => {
  const ListTag = `${type}`;
  return (
    <ListTag>
      {data.map((item, index) => (
        <li key={index}>
          <strong>{item.label}</strong>: {item.text}
        </li>
      ))}
    </ListTag>
  );
};
