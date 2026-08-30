import React from 'react';
import './Table.css';

export const Table = ({ columns, data, keyField = 'id' }) => {
  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="title-sm">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty body-md">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row[keyField]}>
                {columns.map((col, index) => (
                  <td key={index} className="body-sm">
                    {col.render ? col.render(row) : row[col.field]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
