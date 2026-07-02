"use client";

import { useEffect } from "react";

/**
 * Component to prevent Google Translate from modifying the DOM
 * This runs early in the component tree to block translation before it starts
 */
export function GoogleTranslateBlocker() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {}; // Return empty cleanup function for consistency
    }

    // Set translate="no" on html element
    document.documentElement.setAttribute("translate", "no");
    document.documentElement.setAttribute("data-notranslate", "true");

    // Block Google Translate script if it tries to inject
    const blockGoogleTranslate = () => {
      // Remove Google Translate iframe/widget
      const googleTranslateFrame = document.querySelector("#google_translate_element");
      if (googleTranslateFrame) {
        googleTranslateFrame.remove();
      }

      // Remove Google Translate script
      const googleTranslateScript = document.querySelector('script[src*="translate.googleapis.com"]');
      if (googleTranslateScript) {
        googleTranslateScript.remove();
      }

      // Remove Google Translate style
      const googleTranslateStyle = document.querySelector('style[id*="google_translate"]');
      if (googleTranslateStyle) {
        googleTranslateStyle.remove();
      }
    };

    // Run immediately
    blockGoogleTranslate();

    // Monitor for Google Translate injection
    const observer = new MutationObserver((mutations) => {
      let shouldBlock = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check if it's a Google Translate element
            if (
              element.id?.includes("google_translate") ||
              element.classList?.contains("goog-te-banner-frame") ||
              element.classList?.contains("goog-te-menu-frame") ||
              element.querySelector("#google_translate_element")
            ) {
              shouldBlock = true;
            }
          }
        });
      });

      if (shouldBlock) {
        blockGoogleTranslate();
      }
    });

    // Observe document for Google Translate injection
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also observe head for script injection
    observer.observe(document.head, {
      childList: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}





