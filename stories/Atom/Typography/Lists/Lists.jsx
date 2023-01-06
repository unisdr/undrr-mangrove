import React from 'react';

export function List({ data, type }) {
  const ListTag = `${type}`;
  return (
    <ListTag>
      {data.map((item, index) => (
        <li key={index}>{item.text}</li>
      ))}
    </ListTag>
  );
}
