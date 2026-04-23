"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
              <p className="text-gray-400 text-sm">The page encountered an error. Please try refreshing.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl font-bold text-sm transition-all"
              >
                Go to Home
              </button>
            </div>
            {this.state.error && (
              <details className="text-left mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">Error details</summary>
                <pre className="text-[10px] text-red-400 mt-2 bg-black/30 p-3 rounded-lg overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
