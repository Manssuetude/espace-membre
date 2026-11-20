import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { PageTitleProvider } from "./contexts/PageTitleContext";
import { UpcomingSessionsProvider } from "./contexts/UpcomingSessionsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PageTitleProvider>
            <UpcomingSessionsProvider>
              <App />
              <Toaster position="top-right" richColors />
              <Analytics />
            </UpcomingSessionsProvider>
          </PageTitleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
