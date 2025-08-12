import React from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./styles/App.scss";
import routes from "./routes";


function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {

  return (
    <Router>
      <div className="App">
        <Header />
          <AppRoutes />
        <Footer />
      </div>
    </Router>
  );
}

