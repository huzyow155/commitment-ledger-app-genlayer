import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { Header } from "./components/Header";
import { Landing } from "./pages/Landing";
import { Workbench } from "./pages/Workbench";

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <main className="site-shell">
          <Header />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Workbench />} />
          </Routes>
        </main>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;
