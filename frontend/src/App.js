import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Application Tracker</h1>
        <p className="text-gray-600">Stay organized and track your job search progress</p>
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Component</h2>
          <p>If you can see this, React is working!</p>
        </div>
      </div>
    </div>
  );
}

export default App;