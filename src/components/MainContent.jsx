import React from 'react';
import Dashboard from './Dashboard';

function MainContent() {
  return (
    <main className="flex-1 overflow-y-auto p-5 bg-dark-bg">
      <Dashboard />
    </main>
  );
}

export default MainContent;
