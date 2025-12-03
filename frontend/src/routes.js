import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";

const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/admin", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
];

export default routes;
