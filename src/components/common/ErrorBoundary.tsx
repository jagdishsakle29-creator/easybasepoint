import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear potentially corrupted local session state if needed
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0F1D] text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-500 text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected display issue occurred. Don't worry, your data and wallet are completely safe.
            </p>
            {this.state.error && (
              <div className="p-3 bg-black/40 rounded-xl text-left border border-white/5 overflow-x-auto text-[11px] text-red-400 font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold rounded-xl transition cursor-pointer text-sm shadow-lg shadow-orange-500/25"
              >
                Reload App
              </button>
              <button
                onClick={this.handleHardReset}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition cursor-pointer text-xs"
              >
                Reset App Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
