/// <reference types="vite/client" />

declare module "*.worker.ts" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

interface Window {
  __INITIAL_ROUTE__: string;
  renderUnveelsApp(containerId: string, skus?: string[]): void;
}
