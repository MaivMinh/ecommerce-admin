import {
  BankOutlined,
  CrownOutlined,
  DashboardOutlined,
  GiftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  ShoppingOutlined,
  TagsOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png"; // Adjust the path as necessary
import { keycloak, logout } from "../services/keycloak";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "1";
    if (path.includes("/products")) return "2";
    if (path.includes("/categories")) return "3";
    if (path.includes("/orders")) return "4";
    if (path.includes("/promotions")) return "5";
    if (path.includes("/payment-methods")) return "6";
    if (path.includes("/users")) return "7";
    if (path.includes("/notify-config")) return "8";
    if (path.includes("/campaigns")) return "9";
    if (path.includes("/question-collections")) return "10";
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
                label: <Link to="/products">Sản phẩm</Link>,
              },
              {
                key: "3",
                icon: <TagsOutlined />,
                label: <Link to="/categories">Danh mục</Link>,
              },
              {
                key: "4",
                icon: <OrderedListOutlined />,
                label: <Link to="/orders">Đơn hàng</Link>,
              },
              {
                key: "5",
                icon: <GiftOutlined />,
                label: <Link to="/promotions">Khuyến mãi</Link>,
              },
              {
                key: "6",
                icon: <BankOutlined />,
                label: <Link to="/payment-methods">Phương thức thanh toán</Link>,
              },
              {
                key: "7",
                icon: <UserOutlined />,
                label: <Link to="/users">Người dùng</Link>,
              },
              {
                key: "9",
                icon: <CrownOutlined />,
                label: <Link to="/campaigns">Chiến dịch quảng cáo</Link>,
              },
              {
                key: "10",
                icon: <QuestionCircleOutlined />,
                label: <Link to="/question-collections">Bộ sưu tập câu hỏi</Link>,
              },
              {
                key: "8",
                icon: <NotificationOutlined />,
                label: <Link to="/notify-config">Cấu hình thông báo</Link>,
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
