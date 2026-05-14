import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DonationsProvider } from "./context/DonationsContext";
import { I18nProvider } from "./context/I18nContext";
import { OnchainCharityProvider } from "./context/OnchainCharityContext";
import { ToastProvider } from "./context/ToastContext";
import { WalletProvider } from "./context/WalletContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <WalletProvider>
            <OnchainCharityProvider>
              <DonationsProvider>
                <App />
              </DonationsProvider>
            </OnchainCharityProvider>
          </WalletProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
);
