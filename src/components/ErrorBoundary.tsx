import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                ކުށެއް ދިމާވެއްޖެ / Unexpected Error
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-thaana">
                ޕޯޓަލް މަސައްކަތްކުރުމުގައި މައްސަލައެއް ދިމާވެއްޖެއެވެ. ސަފްހާ ރީލޯޑް ކޮށްލައްވާށެވެ.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected interface issue occurred. Please reload the portal or clear temporary cache to resume.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left overflow-x-auto text-[11px] text-slate-700 font-mono max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ރީލޯޑް / Reload Portal</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                title="Clears local browser cache in case of corrupted data"
              >
                <span>ކޭޝް ފޮހެލާ / Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
