import React, { useContext, useState } from "react";
import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  OrderedListOutlined,
  GiftOutlined,
  BankOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/images/logo.png"; // Adjust the path as necessary
import { KeycloakContext } from "./KeycloakProvider";
import { keycloak, logout } from "../services/keycloak";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {authenticated, loading} = useContext(KeycloakContext);
  const navigate = useNavigate();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "1";
    if (path.includes("/products")) return "2";
    if (path.includes("/categories")) return "3";
    if (path.includes("/orders")) return "4";
    if (path.includes("/promotions")) return "5";
    if (path.includes("/payment-methods")) return "6";
    if (path.includes("/users")) return "7";
    if (path.includes("/accounts")) return "8";
    return "1";
  };

  const toggleSider = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    if (keycloak && keycloak.authenticated) {
      logout();
    }
  };

  return (
    <Layout className="h-screen flex flex-col overflow-hidden">
      <Layout className="flex flex-row flex-1">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="bg-slate-800 h-full overflow-auto"
          width={250}
        >
          <div className="p-4 h-16 flex items-center justify-center">
            <h1 className="text-white text-lg font-bold truncate">
              <img src={logo} width={200} />
            </h1>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            className="bg-slate-800"
            items={[
              {
                key: "1",
                icon: <DashboardOutlined />,
                label: <Link to="/">Dashboard</Link>,
              },
              {
                key: "2",
                icon: <ShoppingOutlined />,
                label: <Link to="/products">Products</Link>,
              },
              {
                key: "3",
                icon: <TagsOutlined />,
                label: <Link to="/categories">Categories</Link>,
              },
              {
                key: "4",
                icon: <OrderedListOutlined />,
                label: <Link to="/orders">Orders</Link>,
              },
              {
                key: "5",
                icon: <GiftOutlined />,
                label: <Link to="/promotions">Promotions</Link>,
              },
              {
                key: "6",
                icon: <BankOutlined />,
                label: <Link to="/payment-methods">Payment methods</Link>,
              },
              {
                key: "7",
                icon: <UserOutlined />,
                label: <Link to="/users">Users</Link>,
              }
            ]}
          />
        </Sider>
        <Layout className="flex flex-col flex-1">
          <Header className="bg-white p-0 flex items-center justify-between shadow-sm h-16 z-10">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSider}
              className="w-16 h-16"
            />
            <div className="px-4 flex gap-4">
              {keycloak && keycloak.authenticated && (
                <Button
                  color="orange"
                  variant="solid"
                  className="bg-blue-500 text-white"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </div>
          </Header>
          <Content className="m-6 p-6 bg-white rounded-lg flex-1 overflow-auto">
            {/* This is where the nested routes will be rendered */}
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
