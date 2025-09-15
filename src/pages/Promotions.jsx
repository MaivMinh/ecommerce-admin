import {
  CarOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PercentageOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography
} from "antd";
import moment from "moment";
import { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Promotions = () => {
  // State for promotions data
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // State for modal and form
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentPromotion, setCurrentPromotion] = useState(null);
  const [form] = Form.useForm();

  // State for filtering/searching
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);

  // Ref for debounce timer
  const debounceTimer = useRef(null);

  // Fetch promotions data with search
  const fetchPromotions = async (
    page = currentPage,
    size = pageSize,
    code = searchText,
    status = filterStatus
  ) => {
    try {
      setLoading(true);
      
      // Prepare search payload
      const searchPayload = {
        page: page,
        size: size,
        code: code || "", // Send empty string if no search text
        status: status || "" // Send empty string if no status filter
      };

      console.log("Search payload:", searchPayload);

      const response = await apiClient.post("/api/promotions/search", searchPayload);

      const data = response.data.data;
      setPromotions(data.promotions);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.page);
      setPageSize(data.size);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      message.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch function
  const debouncedFetchPromotions = useCallback((page, size, code, status) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchPromotions(page, size, code, status);
    }, 500); // 500ms delay
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchPromotions(currentPage, pageSize, searchText, filterStatus);
  }, []);

  // Modal handlers
  const showModal = (type, promotion = null) => {
    setModalType(type);
    setCurrentPromotion(promotion);
    setVisible(true);

    if (type === "edit" && promotion) {
      form.setFieldsValue({
        ...promotion,
        date_range: [moment(promotion.startDate), moment(promotion.endDate)],
      });
    } else {
      form.resetFields();
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
        console.log(values);
        
        try {
          setLoading(true);

          // Extract date range
          const [startDate, endDate] = values.date_range;

          // Prepare promotion data
          const promotionData = {
            ...values,
            usageCount: 0,
            code: values.code.toUpperCase(),
            startDate: startDate.format(),
            endDate: endDate.format(),
          };

          // Remove date_range field as it's not in the DB schema
          delete promotionData.date_range;

          if (modalType === "add") {
            await apiClient.post("/api/promotions", promotionData);
            message.success("Promotion created successfully");
          } else {
            await apiClient.put(`/api/promotions`, promotionData);
            message.success("Promotion updated successfully");
          }

          setVisible(false);
          fetchPromotions(currentPage, pageSize, searchText, filterStatus);
        } catch (error) {
          console.error("Error saving promotion:", error);
          message.error("Failed to save promotion");
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
      await apiClient.delete(`/api/promotions/${id}`);
      message.success("Promotion deleted successfully");
      fetchPromotions(currentPage, pageSize, searchText, filterStatus);
    } catch (error) {
      console.error("Error deleting promotion:", error);
      message.error("Failed to delete promotion");
    }
  };

  // Search handler with debounce - triggers API call after delay
  const handleSearch = (value) => {
    const newSearchText = value || "";
    setSearchText(newSearchText);
    setCurrentPage(0); // Reset to first page when searching
    
    // Use debounced function for search to avoid overloading backend
    debouncedFetchPromotions(0, pageSize, newSearchText, filterStatus);
  };

  // Status filter handler - triggers API call immediately (no debounce needed for dropdown)
  const handleStatusFilter = (value) => {
    const newStatus = value === undefined ? null : value;
    setFilterStatus(newStatus);
    setCurrentPage(0); // Reset to first page when filtering
    
    // Cancel any pending search requests
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Immediately fetch with new status filter
    fetchPromotions(0, pageSize, searchText, newStatus);
  };

  // Pagination handler - triggers API call immediately
  const handlePaginationChange = (page, size) => {
    const newPage = page - 1; // Convert to 0-based indexing for API
    setCurrentPage(newPage);
    setPageSize(size);
    
    // Cancel any pending search requests
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Immediately fetch with new pagination
    fetchPromotions(newPage, size, searchText, filterStatus);
  };

  // Generate discount type icon
  const getDiscountTypeIcon = (type) => {
    switch (type) {
      case "percentage":
        return <PercentageOutlined style={{ color: "#1890ff" }} />;
      case "fixed":
        return <DollarOutlined style={{ color: "#52c41a" }} />;
      case "shipping":
        return <CarOutlined style={{ color: "#722ed1" }} />;
      default:
        return null;
    }
  };

  // Table columns
  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Space>
          {getDiscountTypeIcon(type)}
          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </Space>
      ),
    },
    {
      title: "Discount",
      dataIndex: "discountValue",
      key: "discountValue",
      render: (value, record) => {
        if (record.type === "percentage") {
          return `${value}%`;
        } else if (record.type === "fixed" || record.type === "shipping") {
          return `${value.toLocaleString()} VND`;
        }
        return value;
      },
    },
    {
      title: "Min Order",
      dataIndex: "minOrderValue",
      key: "minOrderValue",
      render: (value) => `${value.toLocaleString()} VND`,
    },
    {
      title: "Validity",
      key: "validity",
      render: (_, record) => (
        <span>
          {moment(record.startDate).format("MMM D, YYYY")} -{" "}
          {moment(record.endDate).format("MMM D, YYYY")}
        </span>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => {
        const limit = record.usageLimit || "∞";
        return `${record.usageCount} / ${limit}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const now = moment();
        const startDate = moment(record.startDate);
        const endDate = moment(record.endDate);

        let statusText = status;
        let color = "default";

        if (status === "active") {
          if (now.isBefore(startDate)) {
            statusText = "Scheduled";
            color = "purple";
          } else if (now.isAfter(endDate)) {
            statusText = "Expired";
            color = "red";
          } else {
            statusText = "Active";
            color = "green";
          }
        } else {
          statusText = "Inactive";
          color = "volcano";
        }

        return <Tag color={color}>{statusText.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal("edit", record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this promotion?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Promotions</Title>
        <Space>
          <Input
            placeholder="Search by promotion code"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
            onPressEnter={(e) => {
              // Cancel debounce and search immediately on Enter
              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }
              const newSearchText = e.target.value || "";
              setSearchText(newSearchText);
              setCurrentPage(0);
              fetchPromotions(0, pageSize, newSearchText, filterStatus);
            }}
            value={searchText}
          />

          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            onChange={handleStatusFilter}
            allowClear
            value={filterStatus}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal("add")}
          >
            Add Promotion
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Statistic
            title="Total Promotions"
            value={totalElements}
            prefix={<PercentageOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Active Promotions"
            value={
              Array.isArray(promotions)
                ? promotions.filter(
                    (p) =>
                      p.status === "active" &&
                      moment().isBetween(moment(p.startDate), moment(p.endDate))
                  ).length
                : 0
            }
            valueStyle={{ color: "#3f8600" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Total Redemptions"
            value={
              Array.isArray(promotions)
                ? promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0)
                : 0
            }
            valueStyle={{ color: "#722ed1" }}
          />
        </Card>
        <Card>
          <Statistic
            title="Expired Promotions"
            value={
              promotions?.filter(
                (p) =>
                  p.status === "active" && moment().isAfter(moment(p.endDate))
              ).length
            }
            valueStyle={{ color: "#cf1322" }}
          />
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={promotions}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage + 1, // Convert back to 1-based indexing for UI
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: handlePaginationChange,
          onShowSizeChange: handlePaginationChange,
        }}
      />

      <Modal
        title={modalType === "add" ? "Add New Promotion" : "Edit Promotion"}
        open={visible}
        onCancel={handleCancel}
        footer={[
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
        ]}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="code"
            label="Promotion Code"
            rules={[
              { required: true, message: "Please enter promotion code" },
            ]}
          >
            <Input
              placeholder="e.g., SUMMER2023"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Discount Type"
            rules={[{ required: true, message: "Please select discount type" }]}
          >
            <Select placeholder="Select discount type">
              <Option value="percentage">Percentage Discount</Option>
              <Option value="fixed">Fixed Amount Discount</Option>
              <Option value="shipping">Shipping Discount</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="discountValue"
            label="Discount Value"
            rules={[{ required: true, message: "Please enter discount value" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              placeholder="Enter discount value"
            />
          </Form.Item>

          <Form.Item
            name="minOrderValue"
            label="Minimum Order Value"
            rules={[
              { required: true, message: "Please enter minimum order value" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              precision={2}
              placeholder="Enter minimum order value"
            />
          </Form.Item>

          <Form.Item
            name="date_range"
            label="Validity Period"
            rules={[
              { required: true, message: "Please select validity period" },
            ]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="usageCount"
            label="Usage Count (Leave empty for unlimited)"
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Enter usage count"
              disabled={modalType === "add"}
            />
          </Form.Item>

          <Form.Item
            name="usageLimit"
            label="Usage Limit (Leave empty for unlimited)"
          >
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              placeholder="Enter usage limit"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
            initialValue="active"
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Promotions;