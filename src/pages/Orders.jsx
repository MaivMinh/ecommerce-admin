import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Badge,
  Input,
  Select,
  Form,
  Divider,
  Drawer,
  Row,
  Col,
  Card,
  Statistic,
  message,
  Tooltip,
  Empty,
  Image,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import moment from "moment";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;
const { Option } = Select;

const Orders = () => {
  // States remain the same
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const fetchOrders = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/orders/all", {
        params: { page, size }
      });
      
      console.log("API Response:", response.data);
      
      const { data } = response.data;
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.page || 1);
      setPageSize(data.size || 10);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("Failed to fetch orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, []);

  // Event handlers remain the same
  const showDrawer = (order) => {
    setCurrentOrder(order);
    setSelectedStatus(order.status);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setCurrentOrder(null);
  };

  const showUpdateStatusModal = () => {
    setModalVisible(true);
    form.setFieldsValue({ status: currentOrder.status });
  };

  const handleStatusUpdate = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          await apiClient.put(`/api/orders/${currentOrder.id}/status`, {
            status: values.status
          });
          
          const updatedOrders = orders.map((order) => {
            if (order.id === currentOrder.id) {
              return { ...order, status: values.status };
            }
            return order;
          });

          setOrders(updatedOrders);
          setCurrentOrder({ ...currentOrder, status: values.status });
          setSelectedStatus(values.status);
          setModalVisible(false);
          message.success("Order status updated successfully!");
        } catch (error) {
          console.error("Failed to update order status:", error);
          message.error("Failed to update order status. Please try again.");
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handlePaginationChange = (page, pageSize) => {
    fetchOrders(page, pageSize);
  };

  // Helper functions remain the same
  const getStatusTag = (status) => {
    let color;
    switch (status) {
      case "pending":
        color = "blue";
        break;
      case "completed":
        color = "green";
        break;
      case "cancelled":
        color = "red";
        break;
      case "failed":
        color = "red";
        break;
      case "refunded":
        color = "orange";
        break;
      default:
        color = "default";
    }

    return <Tag color={color}>{status.toUpperCase()}</Tag>;
  };

  const getPaymentStatusTag = (status) => {
    let color;
    switch (status) {
      case "pending":
        color = "blue";
        break;
      case "completed":
        color = "green";
        break;
      case "failed":
        color = "red";
        break;
      default:
        color = "default";
    }

    return <Tag color={color}>{status.toUpperCase()}</Tag>;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Main orders table columns remain mostly the same
  const columns = [
    {
      title: "Order ID",
      dataIndex: "id",
      key: "id",
      render: (text) => <a>{text.substring(0, 8)}...</a>,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.id.toLowerCase().includes(value.toLowerCase()) ||
          (record.fullName && record.fullName.toLowerCase().includes(value.toLowerCase())) ||
          (record.username && record.username.toLowerCase().includes(value.toLowerCase()));
      }
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => {
        const displayName = record.fullName || record.username || "Anonymous";
        return displayName || <Text type="secondary">Not available</Text>;
      }
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => moment(text).format("MM/DD/YYYY HH:mm"),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
    },
    {
      title: "Items",
      key: "items",
      render: (_, record) => {
        const itemCount = record.orderItemDTOs?.length || 0;
        return <Tag color="cyan">{itemCount}</Tag>;
      }
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => formatCurrency(total),
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Completed", value: "completed" },
        { text: "Cancelled", value: "cancelled" },
        { text: "Failed", value: "failed" },
        { text: "Refunded", value: "refunded" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => getPaymentStatusTag(status),
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Completed", value: "completed" },
        { text: "Failed", value: "failed" },
      ],
      onFilter: (value, record) => record.paymentStatus === value,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => showDrawer(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Updated order items columns to show product details
  const orderItemColumns = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div className="flex items-center">
          {record.productVariantDTO && record.productVariantDTO.cover ? (
            <Avatar
              shape="square"
              size={64}
              src={<Image src={record.productVariantDTO.cover} preview={false} />}
              className="mr-3"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded mr-3">
              <ShoppingCartOutlined style={{ fontSize: '24px', color: '#888' }} />
            </div>
          )}
          <div>
            <div className="font-medium">
              {record.productVariantDTO ? record.productVariantDTO.name : `Product ID: ${record.id.substring(0, 8)}...`}
            </div>
            {record.productVariantDTO && (
              <div className="text-gray-500 text-xs mt-1">
                <Space>
                  <Tag color="blue">
                    <BgColorsOutlined /> {record.productVariantDTO.colorName || "N/A"}
                  </Tag>
                  <Tag color="cyan">
                    <TagOutlined /> {record.productVariantDTO.size || "N/A"}
                  </Tag>
                </Space>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => formatCurrency(price),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => formatCurrency(total),
    },
  ];

  // Main component render
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Orders</Title>
        <Space>
          <Input
            placeholder="Search by order ID or customer"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalElements,
          onChange: handlePaginationChange,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
      />

      <Drawer
        title={`Order Details - ${currentOrder?.id?.substring(0, 8)}...`}
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={720}
        extra={
          <Space>
            <Button type="primary" onClick={showUpdateStatusModal}>
              Update Status
            </Button>
          </Space>
        }
      >
        {currentOrder && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Order Status"
                    value={currentOrder.status}
                    valueStyle={{
                      color:
                        currentOrder.status === "completed"
                          ? "#3f8600"
                          : currentOrder.status === "cancelled" ||
                            currentOrder.status === "failed"
                          ? "#cf1322"
                          : currentOrder.status === "refunded"
                          ? "#fa8c16"
                          : "#1890ff",
                    }}
                    prefix={
                      currentOrder.status === "completed" ? (
                        <CheckCircleOutlined />
                      ) : currentOrder.status === "cancelled" ||
                        currentOrder.status === "failed" ? (
                        <CloseCircleOutlined />
                      ) : (
                        <ClockCircleOutlined />
                      )
                    }
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Amount"
                    value={formatCurrency(currentOrder.total)}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Payment Status"
                    value={currentOrder.paymentStatus}
                    valueStyle={{
                      color:
                        currentOrder.paymentStatus === "completed"
                          ? "#3f8600"
                          : currentOrder.paymentStatus === "failed"
                          ? "#cf1322"
                          : "#1890ff",
                    }}
                    prefix={<CreditCardOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">Customer Information</Divider>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Customer Name">
                <UserOutlined className="mr-2" /> 
                {currentOrder.fullName || currentOrder.username || "Anonymous"}
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Address">
                <EnvironmentOutlined className="mr-2" />{" "}
                {currentOrder.shippingAddress || "No address provided"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Order Information</Divider>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Date">
                {moment(currentOrder.createdAt).format("MMMM D, YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                {getPaymentStatusTag(currentOrder.paymentStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="Subtotal">
                {formatCurrency(currentOrder.subTotal)}
              </Descriptions.Item>
              <Descriptions.Item label="Discount">
                {formatCurrency(currentOrder.discount)}
              </Descriptions.Item>
              <Descriptions.Item label="Total" span={2}>
                <Text strong>{formatCurrency(currentOrder.total)}</Text>
              </Descriptions.Item>
              {currentOrder.note && (
                <Descriptions.Item label="Note" span={2}>
                  {currentOrder.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">Order Items</Divider>
            {currentOrder.orderItemDTOs && currentOrder.orderItemDTOs.length > 0 ? (
              <Table
                columns={orderItemColumns}
                dataSource={currentOrder.orderItemDTOs}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <Empty description="No order items found" />
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="Update Order Status"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleStatusUpdate}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Order Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select new status">
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="failed">Failed</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;