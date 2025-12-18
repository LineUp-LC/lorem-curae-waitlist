import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import PasswordGate from "./PasswordGate"; // ✅ import the gate

function App() {
  return (
    <PasswordGate>   {/* ✅ wrap EVERYTHING inside this */}
      <I18nextProvider i18n={i18n}>
        <BrowserRouter basename={__BASE_PATH__}>
          <AppRoutes />
        </BrowserRouter>
      </I18nextProvider>
    </PasswordGate>
  );
}

export default App;