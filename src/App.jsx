import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MainLayout from "./components/MainLayout";

import NotFound from "./pages/NotFound";
import { AuthContextProvider } from "./context/AuthContext";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Accounts from "./pages/Accounts";
import Users from "./pages/Users";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import Orders from "./pages/Orders";
import Promotions from "./pages/Promotions";
import PaymentMethods from "./pages/PaymentMethods";
import { KeycloakProvider } from "./components/KeycloakProvider";
import NotifyConfig from "./pages/NotifyConfig";
import Campaigns from "./pages/Campaigns";
import QuestionCollections from "./pages/QuestionCollections";

function App() {
  return (
    <KeycloakProvider>
      <AuthContextProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            {/* MainLayout with nested routes */}
            <Route path="/" element={<MainLayout />}>
              <Route
                index
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="home"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="products"
                element={
                  <PrivateRoute>
                    <Products />
                  </PrivateRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <PrivateRoute>
                    <Categories />
                  </PrivateRoute>
                }
              />
              <Route
                path="users"
                element={
                  <PrivateRoute>
                    <Users />
                  </PrivateRoute>
                }
              />
              <Route
                path="accounts"
                element={
                  <PrivateRoute>
                    <Accounts />
                  </PrivateRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                }
              />
              <Route
                path="promotions"
                element={
                  <PrivateRoute>
                    <Promotions />
                  </PrivateRoute>
                }
              />
              <Route
                path="payment-methods"
                element={
                  <PrivateRoute>
                    <PaymentMethods />
                  </PrivateRoute>
                }
              />
              <Route
                path="notify-config"
                element={
                  <PrivateRoute>
                    <NotifyConfig />
                  </PrivateRoute>
                }
              />
              <Route
                path="campaigns"
                element={
                  <PrivateRoute>
                    <Campaigns />
                  </PrivateRoute>
                }
              />
              <Route
                path="question-collections"
                element={
                  <PrivateRoute>
                    <QuestionCollections />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthContextProvider>
    </KeycloakProvider>
  );
}

export default App;
