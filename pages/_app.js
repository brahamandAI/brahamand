import { Router } from "next/router";
import { useEffect, useState } from "react";
import Loading from "./loading";
import Head from 'next/head';

import "bootstrap/scss/bootstrap.scss";

// ========= Plugins CSS START =========
import "../public/css/plugins/feature.css";
import "../public/css/plugins/fontawesome-all.min.css";
import "../public/css/plugins/animation.css";
import "../node_modules/sal.js/dist/sal.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-tooltip/dist/react-tooltip.css";
import { AuthProvider } from "@/context/AuthContext";
import Context from "@/context/Context";
// ========= Plugins CSS END =========

import "../public/scss/style.scss";

export default function App({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // Clean up script tag when component unmounts
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");

    const handleStart = (url) => url !== Router.asPath && setLoading(true);
    const handleComplete = () => setLoading(false);

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  // Apply minimal language settings on initial load (only font family)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get saved language settings
      const savedLanguage = localStorage.getItem('selectedLanguage');
      const savedLanguageCode = localStorage.getItem('languageCode');
      
      if (savedLanguageCode) {
        // Only set language attribute - do NOT set dir attribute
        document.documentElement.setAttribute('lang', savedLanguageCode);
        
        // Set font family without changing layout
        if (savedLanguage) {
          // Set appropriate font families based on script
          const fontStyleMapping = {
            default: "'Segoe UI', 'Roboto', sans-serif",
            devanagari: "'Nirmala UI', 'Mangal', sans-serif", 
            bengali: "'Nirmala UI', 'Shonar Bangla', sans-serif",
            telugu: "'Nirmala UI', 'Gautami', sans-serif",
            tamil: "'Nirmala UI', 'Latha', sans-serif",
            urdu: "'Aldhabi', 'Urdu Typesetting', sans-serif",
            gujarati: "'Nirmala UI', 'Shruti', sans-serif"
          };
          
          // Apply only font style
          let styleElement = document.getElementById('language-style');
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'language-style';
            document.head.appendChild(styleElement);
          }
          
          // Apply minimal style (only font)
          styleElement.textContent = `
            .language-content {
              font-family: var(--selected-language-font, system-ui, sans-serif);
            }
          `;
        }
      }
    }
  }, []);

  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Immediately restore the theme preference - execute before DOM rendering
                try {
                  const isDarkMode = localStorage.getItem('theme-mode') === 'dark';
                  if (isDarkMode) {
                    document.documentElement.classList.add('dark-mode');
                    document.body.classList.add('active-dark-mode');
                  } else {
                    document.documentElement.classList.remove('dark-mode');
                    document.body.classList.remove('active-dark-mode');
                  }
                  // Prevent flash by hiding body until theme is applied
                  document.documentElement.style.visibility = 'visible';
                } catch (e) {}
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            html {visibility: hidden;}
            html.dark-mode {background-color: #1a1a1a;}
          `
        }} />
      </Head>
      {loading ? (
        <Loading />
      ) : (
        <Context>
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </Context>
      )}
    </>
  );
}
