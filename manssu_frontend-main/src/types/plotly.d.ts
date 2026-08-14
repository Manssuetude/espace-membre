export {};

declare global {
  interface Window {
    Plotly?: {
      newPlot: (
        element: HTMLElement,
        data: Record<string, unknown>[],
        layout: Record<string, unknown>,
        config: Record<string, unknown>,
      ) => void;
    };
  }
}
