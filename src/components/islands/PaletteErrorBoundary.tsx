import { Component, type ReactNode } from "react";

type Props = {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  children: ReactNode;
};

type State = { failed: boolean };

// Dá o foco ao botão assim que ele aparece: o campo de busca que tinha o foco
// já saiu da tela. Função fora do componente para a identidade ser estável.
function focusOnMount(element: HTMLButtonElement | null) {
  element?.focus();
}

// Pega a falha do chunk do corpo (rede caiu, deploy novo trocou os nomes dos arquivos).
// Sem isto o erro derrubaria a ilha inteira e a paleta deixaria de abrir.
export class PaletteErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn("Não foi possível carregar a paleta de comandos.", error);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <p role="alert" className="text-sm text-fg">
          {this.props.message}
        </p>
        <button
          type="button"
          ref={focusOnMount}
          onClick={this.props.onRetry}
          className="inline-flex min-h-10 items-center rounded-(--radius-control) border border-line px-3 font-mono text-sm text-fg"
        >
          {this.props.retryLabel}
        </button>
      </div>
    );
  }
}
