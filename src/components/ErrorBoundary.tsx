import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const boundaryName = this.props.name || 'Component';
    console.error(`[ErrorBoundary:${boundaryName}] Caught runtime error:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const boundaryName = this.props.name || 'Component';

      return (
        <div className="p-6 bg-[#141414] border border-red-500/30 rounded-xl my-4 text-white shadow-2xl font-sans">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-red-500">
                  {boundaryName} Render Error
                </h3>
                <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                  RECOVERY BOUNDARY
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mb-3">
                An unexpected error occurred while rendering this section. Other parts of the system remain operational.
              </p>
              
              <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#222] font-mono text-xs text-red-400 mb-4 overflow-x-auto">
                {this.state.error?.message || 'Unknown runtime error'}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] text-gray-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
                >
                  Reload App
                </button>
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="px-3 py-2 text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 ml-auto"
                >
                  {this.state.showDetails ? (
                    <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>View Stack <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              {this.state.showDetails && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Component Stack Trace</p>
                  <pre className="p-3 bg-[#050505] text-[11px] font-mono text-gray-400 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed border border-[#1a1a1a]">
                    {this.state.errorInfo?.componentStack || 'No component stack available.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
