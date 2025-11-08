// Simple test version - use this to verify React is working
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg inline-block mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">React is Working! 🎉</h1>
          <p className="text-gray-600 mb-4">Your Vite + React setup is correct.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
            <p className="text-sm text-green-800">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
              <li>Check browser console for any errors</li>
              <li>Verify components are loading correctly</li>
              <li>Check that backend is running on port 3001</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;


