import React, { useState } from 'react';

const GenericTabs = ({
  tabButtons,
  tabs,
  emptyStateTab,
  classNames = {},
}: {
  tabButtons: { name: string; value: string; icon?: React.ComponentType }[];
  tabs: Record<string, React.ReactNode>;
  emptyStateTab?: React.ReactNode;
  classNames?: {
    container?: string;
    tabSection?: string;
    tabButtons?: string;
  };
}) => {
  const [activeTab, setActiveTab] = useState<string>(tabButtons[0].value);
  return (
    <div className={`w-full h-auto flex flex-col ${classNames?.container}`}>
      <div
        className={`flex border-b border-gray-200 dark:border-gray-700 mb-6 ${classNames.tabButtons}`}
      >
        {tabButtons.map((item) => (
          <button
            key={item.value}
            onClick={() => setActiveTab(item.value)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === item.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className={`w-full h-fit ${classNames.tabSection}`}>
        {Object.entries(tabs).map(
          ([key, item]) =>
            key === activeTab && <div className="space-y-4">{item}</div>
        )}
        {emptyStateTab &&
          !tabButtons.map((i) => i.value).includes(activeTab) && (
            <div className="space-y-4">{emptyStateTab}</div>
          )}
      </div>
    </div>
  );
};

export default GenericTabs;
