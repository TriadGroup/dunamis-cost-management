import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
          <div className="frost-card max-w-lg rounded-3xl p-8 border border-white/10">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Ops! Algo deu errado.</h1>
            <p className="text-white/60 mb-6">
              Ocorreu um erro inesperado no sistema. Tente recarregar a página ou limpe o cache do navegador.
            </p>
            <div className="bg-white/5 rounded-xl p-4 text-left font-mono text-xs overflow-auto max-h-40 mb-6 border border-white/5">
              <span className="text-red-300 font-bold block mb-1">Erro:</span>
              {this.state.error?.message || 'Erro desconhecido'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="cta-btn w-full"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
