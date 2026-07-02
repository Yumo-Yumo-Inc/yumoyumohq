"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isNetworkError: boolean;
  isChunkError: boolean;
}

/**
 * A failed dynamic-import / chunk load. Happens when the deployed chunk graph
 * changed (e.g. components were added/removed) but the browser still has stale
 * cached chunks that reference modules that no longer exist. Recovered by purging
 * caches + the service worker and reloading once.
 */
function isChunkLoadError(error: Error | null | undefined): boolean {
  if (!error) return false;
  const m = error.message || "";
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk [\w-]+ failed/i.test(m) ||
    /Loading CSS chunk/i.test(m) ||
    /failed to fetch dynamically imported module/i.test(m) ||
    /error loading dynamically imported module/i.test(m) ||
    /importing a module script failed/i.test(m)
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if error is network-related
    const isNetworkError =
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Network request failed") ||
      error.message.includes("ERR_INTERNET_DISCONNECTED") ||
      error.message.includes("ERR_NETWORK_CHANGED") ||
      error.name === "TypeError" && error.message.includes("fetch");

    // Check if error is DOM-related (likely from Google Translate or other extensions)
    const isDOMError =
      error.name === "NotFoundError" ||
      error.message.includes("removeChild") ||
      error.message.includes("insertBefore") ||
      error.message.includes("appendChild") ||
      error.message.includes("not a child of this node");

    // If it's a DOM error, don't show error boundary (just log it)
    // These are usually harmless and caused by browser extensions
    if (isDOMError) {
      console.warn("DOM manipulation error (likely from browser extension):", error.message);
      // Return no error state to prevent error boundary from showing
      return {
        hasError: false,
        error: null,
        isNetworkError: false,
        isChunkError: false,
      };
    }

    return {
      hasError: true,
      error,
      isNetworkError,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if it's a DOM manipulation error (likely from Google Translate)
    const isDOMError =
      error.name === "NotFoundError" ||
      error.message.includes("removeChild") ||
      error.message.includes("insertBefore") ||
      error.message.includes("appendChild") ||
      error.message.includes("not a child of this node") ||
      error.message.includes("Failed to execute 'removeChild'") ||
      error.message.includes("commitDeletionEffectsOnFiber");

    if (isDOMError) {
      // Log as warning instead of error - these are usually harmless
      console.warn(
        "DOM manipulation error detected (likely from Google Translate or browser extension):",
        error.message
      );
      // Reset error state to prevent UI from breaking
      this.setState({
        hasError: false,
        error: null,
        isNetworkError: false,
        isChunkError: false,
      });
      return;
    }

    // Stale-chunk crash after a deploy → self-heal: purge caches + service
    // worker and reload once (sessionStorage guard prevents a reload loop).
    if (isChunkLoadError(error) && typeof window !== "undefined") {
      const RELOAD_KEY = "yumo-chunk-reload";
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        void (async () => {
          try {
            if ("caches" in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if (navigator.serviceWorker) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
          } catch {
            // best effort — reload anyway
          }
          window.location.reload();
        })();
      }
      return;
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      isNetworkError: false,
      isChunkError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      // Chunk error self-heals (caches purged + reload in componentDidCatch).
      // Show a calm "updating" state instead of a scary error during the reload.
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <CardTitle>Güncelleniyor…</CardTitle>
                </div>
                <CardDescription>Yeni sürüm yükleniyor, sayfa birazdan yenilenecek.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        );
      }

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                {this.state.isNetworkError ? (
                  <WifiOff className="h-6 w-6 text-yellow-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                )}
                <CardTitle>
                  {this.state.isNetworkError ? "No Internet Connection" : "Something Went Wrong"}
                </CardTitle>
              </div>
              <CardDescription>
                {this.state.isNetworkError
                  ? "Please check your internet connection and try again."
                  : "An unexpected error occurred. Please try refreshing the page."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!this.state.isNetworkError && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <p className="font-medium mb-1">Error details:</p>
                  <p className="font-mono text-xs">{this.state.error?.message || "Unknown error"}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.resetError} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

