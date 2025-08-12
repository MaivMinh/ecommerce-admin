import React, { useState } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button,
  Badge
} from 'antd';
import {
  ShoppingOutlined,
  TagsOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const Home = () => {
  const [statistics, setStatistics] = useState({
    totalProducts: 256,
    totalCategories: 24,
    totalUsers: 1204,
    totalOrders: 358,
    totalRevenue: 125800,
    outOfStock: 12,
  });

  return (
    <>
      <Title level={2}>Dashboard Overview</Title>
      
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Products"
              value={statistics.totalProducts}
              prefix={<ShoppingOutlined className="text-blue-500 mr-2" />}
            />
            <Button type="link" className="p-0 mt-2">
              <Link to="/products">View all products</Link>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Categories"
              value={statistics.totalCategories}
              prefix={<TagsOutlined className="text-green-500 mr-2" />}
            />
            <Button type="link" className="p-0 mt-2">
              <Link to="/categories">View all categories</Link>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Users"
              value={statistics.totalUsers}
              prefix={<TeamOutlined className="text-purple-500 mr-2" />}
            />
            <Button type="link" className="p-0 mt-2">
              <Link to="/users">View all users</Link>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Orders"
              value={statistics.totalOrders}
              prefix={<ShoppingCartOutlined className="text-orange-500 mr-2" />}
            />
            <Button type="link" className="p-0 mt-2">
              <Link to="/orders">View all orders</Link>
            </Button>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Revenue"
              value={statistics.totalRevenue}
              prefix={<DollarOutlined className="text-green-600 mr-2" />}
              suffix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Out of Stock Products"
              value={statistics.outOfStock}
              prefix={<Badge status="error" />}
            />
            <Button type="link" className="p-0 mt-2" danger>
              <Link to="/products?status=out_of_stock">View out of stock</Link>
            </Button>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Home;