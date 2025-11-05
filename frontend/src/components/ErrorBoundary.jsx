// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <h3 className="text-red-300 font-medium">Something went wrong</h3>
          <p className="text-sm text-red-400 mt-1">
            {this.state.error?.message || 'An unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm bg-red-800 hover:bg-red-700 px-3 py-1 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;