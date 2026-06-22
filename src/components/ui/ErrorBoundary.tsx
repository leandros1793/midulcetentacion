import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Fallback personalizado opcional. Si no se provee, muestra la UI default. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Captura errores de renderizado en el árbol de componentes hijos.
 * Sin esto, cualquier excepción no capturada deja la app en blanco.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción podría enviarse a Sentry / LogRocket
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-rose-400" />
        </div>
        <h2 className="font-bold text-stone-800 text-lg mb-2">Algo salió mal</h2>
        <p className="text-sm text-stone-400 mb-6 max-w-xs leading-relaxed">
          Ocurrió un error inesperado. Podés intentar recargar esta sección.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre className="text-left text-[10px] bg-stone-50 border border-stone-200 rounded-xl p-3 mb-4 max-w-sm overflow-auto text-stone-500">
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition-colors"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }
}
