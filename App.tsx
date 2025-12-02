
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SalesReport from './pages/SalesReport';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'sales_report'>('dashboard');

  return (
    <Layout activePage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' ? <Dashboard /> : <SalesReport />}
    </Layout>
  );
};

export default App;
