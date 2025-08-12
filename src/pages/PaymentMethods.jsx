import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Input,
  Select,
  Form,
  Popconfirm,
  Switch,
  message,
  Card,
  Statistic,
  Upload,
  Tooltip,
  Badge,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BankOutlined,
  CreditCardOutlined,
  DollarOutlined,
  WalletOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;
const { Option } = Select;

const PaymentMethods = () => {
  // State for payment methods data
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for modal and form
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentMethod, setCurrentMethod] = useState(null);
  const [form] = Form.useForm();

  // State for filtering/searching
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterActive, setFilterActive] = useState(null);

  const [iconPreview, setIconPreview] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconFileList, setIconFileList] = useState([]);

  // State for statistics
  const [stats, setStats] = useState({
    totalMethods: 0,
    activeMethods: 0,
    byType: {},
  });

  // Fetch payment methods
  const fetchPaymentMethods = async (
    page = currentPage,
    size = pageSize,
    filter,
    isActive,
    search
  ) => {
    let formmattedFilter =
      filter !== null && filter !== undefined ? filter : null;
    let formmattedIsActive =
      isActive !== null && isActive !== undefined ? isActive : null;
    let formmattedSearch = search ? search : "";

    try {
      setLoading(true);
      const response = await apiClient.get("/api/payment-methods", {
        params: {
          page: page,
          size,
          filter: formmattedFilter,
          isActive: formmattedIsActive,
          search: formmattedSearch,
        },
      });

      // Cấu trúc dữ liệu mới - dữ liệu trong mảng data trực tiếp
      const paymentMethodsData = response.data.data.methods;

      console.log("API Response:", response.data);

      // Cập nhật state
      setPaymentMethods(paymentMethodsData);
      setTotalElements(paymentMethodsData.totalElements);
      setCurrentPage(response.data.data.page);
      setPageSize(response.data.data.size);

      // Tính toán thống kê từ dữ liệu
      const activeMethods = paymentMethodsData.filter(
        (method) => method.isActive
      ).length;

      const byType = paymentMethodsData.reduce((acc, method) => {
        acc[method.type] = (acc[method.type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalMethods: paymentMethodsData.length,
        activeMethods,
        byType,
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      message.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const showModal = (type, method = null) => {
    setModalType(type);
    setCurrentMethod(method);
    setVisible(true);

    if (method) {
      // Log để kiểm tra dữ liệu
      console.log("Original method data:", method);

      const formData = {
        ...method,
        paymentMethodId: method.paymentMethodId,
        iconUrl: method.iconUrl || "",
        isActive: !!method.isActive, // Đảm bảo isActive là boolean
      };

      console.log("Setting form values:", formData);
      form.setFieldsValue(formData);

      // Set icon preview if available
      setIconPreview(method?.iconUrl || "");

      // Cập nhật iconFileList khi có icon URL
      if (method.iconUrl) {
        setIconFileList([
          {
            uid: "-1",
            name: "image.png",
            status: "done",
            url: method.iconUrl,
          },
        ]);
      } else {
        setIconFileList([]);
      }
    } else {
      form.resetFields();
      setIconFileList([]);
      setIconPreview("");
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          setLoading(true);

          // Đảm bảo paymentMethodId được đặt đúng
          if (modalType === "edit") {
            values.paymentMethodId = currentMethod.paymentMethodId;
          }

          // Đảm bảo isActive luôn có giá trị boolean
          values.isActive =
            values.isActive === undefined ? true : !!values.isActive;

          // Đảm bảo iconUrl được gửi đi nếu có
          if (iconFileList.length > 0 && iconFileList[0].url) {
            values.iconUrl = iconFileList[0].url;
          }

          console.log("Modified values to send:", values);

          if (modalType === "add") {
            await apiClient.post("/api/payment-methods", values);
            message.success("Payment method created successfully");
          } else {
            await apiClient.put(`/api/payment-methods`, values);
            message.success("Payment method updated successfully");
          }

          setVisible(false);
          fetchPaymentMethods();
        } catch (error) {
          console.error("Error saving payment method:", error);
          message.error("Failed to save payment method");
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validation failed:", info);
      });
  };

  // Delete handler
  const handleDelete = async (id) => {
    try {
      console.log("Deleting payment method with ID:", id);
      if (!id) {
        message.error("Cannot delete: Invalid payment method ID");
        return;
      }

      await apiClient.delete(`/api/payment-methods/${id}`);
      message.success("Payment method deleted successfully");
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      message.error(
        `Failed to delete payment method: ${error.message || "Unknown error"}`
      );
    }
  };

  // Search handler
  const handleSearch = (value) => {
    console.log(value);
    setSearchText(value);
    fetchPaymentMethods(1, pageSize, filterType, filterActive, value);
  };

  // Filter handlers
  const handleTypeFilter = (value) => {
    console.log(value);
    setFilterType(value);
    fetchPaymentMethods(1, pageSize, value, filterActive, searchText);
  };

  const handleActiveFilter = (value) => {
    setFilterActive(value);
    console.log(value);
    fetchPaymentMethods(1, pageSize, filterType, value, searchText);
  };

  // Pagination handler
  const handlePaginationChange = (page, pageSize) => {
    fetchPaymentMethods(page, pageSize, filterType, filterActive, searchText);
  };

  const handleIconChange = ({ fileList }) => {
    // Cập nhật danh sách file hiển thị
    setIconFileList(fileList);

    // Kiểm tra nếu fileList rỗng (người dùng đã xóa ảnh)
    if (fileList.length === 0) {
      form.setFieldsValue({ iconUrl: "" });
      setIconPreview("");
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case "bank_transfer":
        return <BankOutlined style={{ color: "#1890ff" }} />;
      case "credit_card":
        return <CreditCardOutlined style={{ color: "#52c41a" }} />;
      case "cod":
        return <DollarOutlined style={{ color: "#faad14" }} />;
      case "e_wallet":
        return <WalletOutlined style={{ color: "#722ed1" }} />;
      default:
        return null;
    }
  };

  // Table columns
  const columns = [
    {
      title: "Icon",
      dataIndex: "iconUrl",
      key: "iconUrl",
      render: (iconUrl, record) => (
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={record.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            getTypeIcon(record.type)
          )}
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.code}</div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {type.split("_").map(capitalizeFirstLetter).join(" ")}
        </Tag>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      render: (provider) => provider || "-",
    },
    {
      title: "Currency",
      dataIndex: "currency",
      key: "currency",
      render: (currency) => currency.toUpperCase(),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Badge
          status={isActive ? "success" : "error"}
          text={isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => showModal("view", record)}
            />
          </Tooltip>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal("edit", record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this payment method?"
            onConfirm={() => handleDelete(record.paymentMethodId)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Helper functions
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "bank_transfer":
        return "blue";
      case "credit_card":
        return "green";
      case "cod":
        return "orange";
      case "e_wallet":
        return "purple";
      default:
        return "default";
    }
  };

  const customUploadIcon = async ({ file, onSuccess, onError }) => {
    try {
      console.log("Starting upload...");

      // Show local preview immediately
      const reader = new FileReader();
      reader.addEventListener("load", () => setIconPreview(reader.result));
      reader.readAsDataURL(file);

      // Create form data for image upload
      const formData = new FormData();
      formData.append("image", file);

      // Upload to server
      const response = await apiClient.post(
        "/api/files/images/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Upload response:", response.data);

      // Kiểm tra nhiều cấu trúc response có thể có
      let imageUrl;
      if (response.data.url) {
        imageUrl = response.data.url;
      } else if (response.data.data && response.data.data.url) {
        imageUrl = response.data.data.url;
      } else if (response.data.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else {
        // Fallback, có thể response trả về trực tiếp URL
        imageUrl = response.data;
      }

      console.log("Image URL extracted:", imageUrl);

      // Update form field
      form.setFieldsValue({ iconUrl: imageUrl });
      console.log("Form field updated with iconUrl:", imageUrl);

      // Also update the fileList with url
      setIconFileList([
        {
          uid: "-1",
          name: file.name,
          status: "done",
          url: imageUrl,
        },
      ]);

      // Notify upload success
      message.success("Image uploaded successfully");
      onSuccess(response, file);
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
      onError(error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Payment Methods</Title>
        <Space>
          <Input
            placeholder="Search payment methods"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Filter by type"
            style={{ width: 150 }}
            onChange={handleTypeFilter}
            allowClear
            value={filterType}
          >
            <Option value="bank_transfer">Bank Transfer</Option>
            <Option value="credit_card">Credit Card</Option>
            <Option value="cod">Cash on Delivery</Option>
            <Option value="e_wallet">E-Wallet</Option>
          </Select>
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            onChange={handleActiveFilter}
            allowClear
            value={filterActive}
          >
            <Option value={true}>Active</Option>
            <Option value={false}>Inactive</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal("add")}
          >
            Add Payment Method
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Statistic
            title="Total Payment Methods"
            value={stats.totalMethods || 0}
            prefix={<CreditCardOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Active Methods"
            value={stats.activeMethods || 0}
            valueStyle={{ color: "#3f8600" }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Bank Transfer Methods"
            value={stats.byType?.bank_transfer || 0}
            valueStyle={{ color: "#1890ff" }}
            prefix={<BankOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="E-Wallet Methods"
            value={stats.byType?.e_wallet || 0}
            valueStyle={{ color: "#722ed1" }}
            prefix={<WalletOutlined />}
          />
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={paymentMethods}
        rowKey="paymentMethodId"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: handlePaginationChange,
        }}
      />

      <Modal
        title={
          modalType === "add" ? "Add Payment Method" : "Edit Payment Method"
        }
        visible={visible}
        onCancel={handleCancel}
        // Thêm vào phần footer của Modal
        footer={
          modalType === "view"
            ? [
                <Button key="back" onClick={handleCancel}>
                  Close
                </Button>,
              ]
            : [
                <Button key="back" onClick={handleCancel}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleOk}
                  loading={loading}
                >
                  {modalType === "add" ? "Create" : "Update"}
                </Button>,
              ]
        }
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="paymentMethodId" hidden>
            <Input />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Form.Item
                name="name"
                label="Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter payment method name",
                  },
                ]}
              >
                <Input placeholder="e.g., Visa Credit Card" />
              </Form.Item>

              <Form.Item
                name="code"
                label="Code"
                rules={[
                  {
                    required: true,
                    message: "Please enter payment method code",
                  },
                  {
                    pattern: /^[a-z0-9_]+$/,
                    message:
                      "Code must contain only lowercase letters, numbers, and underscores",
                  },
                ]}
              >
                <Input placeholder="e.g., credit_card_visa" />
              </Form.Item>

              <Form.Item
                name="type"
                label="Payment Type"
                rules={[
                  { required: true, message: "Please select payment type" },
                ]}
              >
                <Select placeholder="Select payment type">
                  <Option value="bank_transfer">Bank Transfer</Option>
                  <Option value="credit_card">Credit Card</Option>
                  <Option value="cod">Cash on Delivery</Option>
                  <Option value="e_wallet">E-Wallet</Option>
                </Select>
              </Form.Item>

              <Form.Item name="provider" label="Provider (For e-wallets)">
                <Input placeholder="e.g., MoMo, ZaloPay, VNPay" />
              </Form.Item>
            </div>

            <div>
              <Form.Item name="currency" label="Currency" initialValue="vnd">
                <Select placeholder="Select currency">
                  <Option value="vnd">VND</Option>
                  <Option value="usd">USD</Option>
                  <Option value="eur">EUR</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>

              <Form.Item name="iconUrl" hidden>
                <Input />
              </Form.Item>

              <Form.Item label="Icon">
                <Upload
                  name="icon"
                  listType="picture-card"
                  fileList={iconFileList}
                  onChange={handleIconChange}
                  customRequest={customUploadIcon}
                  maxCount={1}
                  disabled={modalType === "view"}
                  onRemove={() => {
                    form.setFieldsValue({ iconUrl: "" });
                    setIconPreview("");
                    setIconFileList([]);
                  }}
                >
                  {iconFileList.length < 1 && modalType !== "view" && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
                <Text type="secondary">
                  Recommended size: 64x64px. PNG or SVG format.
                </Text>
              </Form.Item>
            </div>
          </div>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentMethods;
