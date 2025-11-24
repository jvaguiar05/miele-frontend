import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Ocorreu um erro na autenticação. Por favor, recarregue a página
                ou faça login novamente.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="flex-1"
              >
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
