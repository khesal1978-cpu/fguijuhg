import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Wifi, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState((prev) => ({ 
      hasError: false, 
      error: undefined,
      retryCount: prev.retryCount + 1 
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private getErrorMessage = (): { title: string; message: string; icon: ReactNode } => {
    const errorMessage = this.state.error?.message?.toLowerCase() || "";
    
    if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("offline")) {
      return {
        title: "Connection Issue",
        message: "Please check your internet connection and try again.",
        icon: <Wifi className="size-8 text-gold" />,
      };
    }
    
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return {
        title: "Access Denied",
        message: "You don't have permission to access this. Please sign in again.",
        icon: <AlertTriangle className="size-8 text-destructive" />,
      };
    }

    if (this.state.retryCount >= 2) {
      return {
        title: "Persistent Error",
        message: "Something keeps going wrong. Try reloading the app completely.",
        icon: <AlertTriangle className="size-8 text-destructive" />,
      };
    }
    
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred. Tap below to try again.",
      icon: <AlertTriangle className="size-8 text-destructive" />,
    };
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, message, icon } = this.getErrorMessage();
      const showReloadPrompt = this.state.retryCount >= 2;

      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
          <div className="text-center max-w-sm space-y-6">
            <div className="mx-auto size-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              {icon}
            </div>
            
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {!showReloadPrompt ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full px-6 py-3.5 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  Try Again
                </button>
              ) : (
                <button
                  onClick={this.handleReload}
                  className="w-full px-6 py-3.5 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="size-5" />
                  Reload App
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full px-6 py-3 text-sm font-medium rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Home className="size-4" />
                Go to Home
              </button>
            </div>

            <p className="text-xs text-muted-foreground/60">
              If this keeps happening, try closing and reopening the app.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
