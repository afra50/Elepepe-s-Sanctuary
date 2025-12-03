import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "*", element: <NotFoundPage /> },
];

export default routes;
