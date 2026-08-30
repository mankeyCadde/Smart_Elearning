import React, { useState } from 'react';
import './Tabs.css';

export const Tabs = ({ tabs, defaultTab, activeTab: controlledActiveTab, onChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0].id);

  const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (id) => {
    if (onChange) {
      onChange(id);
    } else {
      setInternalActiveTab(id);
    }
  };

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${currentTab === tab.id ? 'active' : ''} title-md`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.find((tab) => tab.id === currentTab)?.content}
      </div>
    </div>
  );
};
