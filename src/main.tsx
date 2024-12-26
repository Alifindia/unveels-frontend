import "regenerator-runtime/runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { VirtualTryOnProductProvider } from "./context/virtual-try-on-product-context.tsx";
import { CartProvider } from "./context/cart-context.tsx";

const queryClient = new QueryClient();

function renderApp(containerId: string, skus?: string[]) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <VirtualTryOnProductProvider initialSkus={skus}>
          <CartProvider>
            <App />
          </CartProvider>
        </VirtualTryOnProductProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

window.renderUnveelsApp = renderApp;

const routes = [
  "skin-tone-finder",
  "personality-finder",
  "face-analyzer",
  "skin-analysis",
  "find-the-look",
  "virtual-try-on",
  "virtual-assistant",
  "see-improvement",
  "virtual-avatar-web",
  "virtual-try-on-web",
  "virtual-try-on-accesories",
  "virtual-try-on-makeup",
  "virtual-try-on-product",
];

// Delegated event listener
document.addEventListener("click", (e) => {
  const target = e.target as Element;

  // Handle virtual try-on button
  const tryOnButton = target.closest(".tryon-button");
  if (tryOnButton) {
    e.preventDefault();
    const skus = tryOnButton.getAttribute("data-sku")?.split(",") || [];
    if (skus.length > 0) {
      createAndRenderContainer("/virtual-try-on-product", skus);
    }
  } else {
    // Handle other route buttons
    for (const route of routes) {
      const routeButton = target.closest(`.${route}`);
      if (routeButton) {
        e.preventDefault();
        createAndRenderContainer(`/${route}`);
        break;
      }
    }
  }
});

function createAndRenderContainer(initialRoute: string, skus?: string[]) {
  let container = document.getElementById("unveels-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "unveels-root";
  }
  container.style.zIndex = "9999";
  container.style.position = "fixed";
  container.classList.add("w-full", "h-full", "inset-0");
  document.body.appendChild(container);

  window.__INITIAL_ROUTE__ = initialRoute;
  renderApp("unveels-root", skus);
}

if (window.__INITIAL_ROUTE__) {
  console.log("Initial route", window.__INITIAL_ROUTE__);
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <VirtualTryOnProductProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </VirtualTryOnProductProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
} else {
  if (import.meta.env.DEV) {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <VirtualTryOnProductProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </VirtualTryOnProductProvider>
        </QueryClientProvider>
      </StrictMode>,
    );

    console.log("Rendered default route");
  } else {
    console.log("No initial route found");
  }
}
