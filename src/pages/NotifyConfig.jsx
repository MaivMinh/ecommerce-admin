import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Typography,
  Tag,
  Tabs,
  Card,
  Row,
  Col,
  Divider,
  notification,
  Popconfirm,
  DatePicker,
  Drawer,
  Badge,
  Tooltip,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  BellOutlined,
  MessageOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import apiClient from "../services/apiClient";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const NotifyConfig = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sendLogs, setSendLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isLogDrawerVisible, setIsLogDrawerVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Forms
  const [form] = Form.useForm();
  const [previewForm] = Form.useForm();

  // Active tab
  const [activeTab, setActiveTab] = useState("templates");

  // Fetch templates
  const fetchTemplates = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: size,
      };
      if (activeFilter !== null) {
        params.isActive = activeFilter;
      }
      const response = await apiClient.post("/api/templates/search", params);
      const data = response.data.data;
      setTemplates(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tải danh sách template",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch send logs
  const fetchSendLogs = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/send-logs", {
        params: filters,
      });
      const data = response.data.data;
      setSendLogs(data.content || []);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tải lịch sử gửi",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "templates") {
      fetchTemplates();
    } else {
      fetchSendLogs();
    }
  }, [activeTab, currentPage, pageSize, activeFilter]);

  // Handle create/update template
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        params: values.params
          ? JSON.parse(values.params)
          : null,
        id: editingTemplate ? editingTemplate.id : null,
      };

      if (editingTemplate) {
        await apiClient.put(
          `/api/templates`,
          payload
        );
        notification.success({
          message: "Thành công",
          description: "Cập nhật template thành công",
        });
      } else {
        await apiClient.post("/api/templates", payload);
        notification.success({
          message: "Thành công",
          description: "Tạo template thành công",
        });
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description:
          error.response?.data?.message || "Không thể lưu template",
      });
    }
  };

  // Handle delete template
  const handleDelete = async (templateId) => {
    try {
      await apiClient.delete(`/api/templates/${templateId}`);
      notification.success({
        message: "Thành công",
        description: "Xóa template thành công",
      });
      fetchTemplates();
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa template",
      });
    }
  };

  // Handle preview
  const handlePreview = async (templateCode) => {
    setPreviewLoading(true);
    try {
      const params = previewForm.getFieldsValue();
      const response = await apiClient.post(
        `/api/templates/${templateCode}/render-preview`,
        params.params ? JSON.parse(params.params) : {}
      );
      setPreviewContent(response.data.data);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể render preview",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Open create/edit modal
  const openModal = (template = null) => {
    setEditingTemplate(template);
    if (template) {
      form.setFieldsValue({
        ...template,
        defaultParams: template.defaultParams
          ? JSON.stringify(template.defaultParams, null, 2)
          : "",
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Open preview modal
  const openPreviewModal = (template) => {
    setEditingTemplate(template);
    previewForm.resetFields();
    setPreviewContent(null);
    setIsPreviewModalVisible(true);
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    switch (channel) {
      case "EMAIL":
        return <MailOutlined />;
      case "PUSH":
        return <BellOutlined />;
      case "SMS":
        return <MessageOutlined />;
      default:
        return <SendOutlined />;
    }
  };

  // Get status tag
  const getStatusTag = (status) => {
    switch (status) {
      case "SENT":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã gửi
          </Tag>
        );
      case "FAILED":
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Thất bại
          </Tag>
        );
      case "PENDING":
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            Đang chờ
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Template columns
  const templateColumns = [
    {
      title: "Mã Template",
      dataIndex: "templateCode",
      key: "templateCode",
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Kênh",
      dataIndex: "channel",
      key: "channel",
      width: 100,
      render: (channel) => (
        <Tag icon={getChannelIcon(channel)} color="blue">
          {channel}
        </Tag>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive) => (
        <Badge
          status={isActive ? "success" : "default"}
          text={isActive ? "Hoạt động" : "Tạm dừng"}
        />
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openPreviewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc muốn xóa template này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Send log columns
  const logColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Template",
      dataIndex: "templateCode",
      key: "templateCode",
      width: 180,
    },
    {
      title: "Người nhận",
      dataIndex: "recipient",
      key: "recipient",
      ellipsis: true,
    },
    {
      title: "Kênh",
      dataIndex: "channel",
      key: "channel",
      width: 100,
      render: (channel) => (
        <Tag icon={getChannelIcon(channel)} color="blue">
          {channel}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Số lần thử",
      dataIndex: "attempts",
      key: "attempts",
      width: 100,
      align: "center",
    },
    {
      title: "Thời gian gửi",
      dataIndex: "sentAt",
      key: "sentAt",
      width: 150,
      render: (date) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-display">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="m-0">
            <BellOutlined className="mr-2" />
            Quản lý thông báo
          </Title>
        </div>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span className="flex flex-row gap-x-1">
                  <CodeOutlined />
                  Templates
                </span>
              }
              key="templates"
            >
              <div className="mb-4 flex justify-between">
                <Space>
                  <Select
                    placeholder="Lọc trạng thái"
                    allowClear
                    style={{ width: 200 }}
                    onChange={(value) => {
                      setActiveFilter(value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { label: "Tất cả", value: null },
                      { label: "Hoạt động", value: true },
                      { label: "Tạm dừng", value: false },
                    ]}
                  />
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openModal()}
                >
                  Tạo template mới
                </Button>
              </div>

              <Table
                columns={templateColumns}
                dataSource={templates}
                rowKey="id"
                loading={loading}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalElements,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  },
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} templates`,
                }}
              />
            </TabPane>

            <TabPane
              tab={
                <span className="flex flex-row gap-x-1">
                  <HistoryOutlined />
                  Lịch sử gửi
                </span>
              }
              key="logs"
            >
              <div className="mb-4">
                <Space wrap>
                  <Input
                    placeholder="Template code"
                    style={{ width: 200 }}
                    onChange={(e) =>
                      fetchSendLogs({ templateCode: e.target.value })
                    }
                  />
                  <Select
                    placeholder="Trạng thái"
                    allowClear
                    style={{ width: 150 }}
                    onChange={(value) => fetchSendLogs({ status: value })}
                    options={[
                      { label: "Đã gửi", value: "SENT" },
                      { label: "Thất bại", value: "FAILED" },
                      { label: "Đang chờ", value: "PENDING" },
                    ]}
                  />
                  <RangePicker
                    onChange={(dates) => {
                      if (dates) {
                        fetchSendLogs({
                          from: dates[0].format("YYYY-MM-DD"),
                          to: dates[1].format("YYYY-MM-DD"),
                        });
                      }
                    }}
                  />
                </Space>
              </div>

              <Table
                columns={logColumns}
                dataSource={sendLogs}
                rowKey="id"
                loading={loading}
                pagination={{
                  showTotal: (total) => `Tổng ${total} bản ghi`,
                }}
              />
            </TabPane>
          </Tabs>
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={
            editingTemplate ? "Chỉnh sửa Template" : "Tạo Template mới"
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingTemplate(null);
            form.resetFields();
          }}
          footer={null}
          width={900}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              channel: "EMAIL",
              isActive: true,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="templateCode"
                  label="Mã Template"
                  rules={[
                    { required: true, message: "Vui lòng nhập mã template" },
                  ]}
                >
                  <Input
                    placeholder="ORDER_CONFIRMATION"
                    disabled={!!editingTemplate}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="channel"
                  label="Kênh"
                  rules={[{ required: true, message: "Vui lòng chọn kênh" }]}
                >
                  <Select>
                    <Select.Option value="EMAIL">
                      <MailOutlined /> Email
                    </Select.Option>
                    <Select.Option value="PUSH">
                      <BellOutlined /> Push Notification
                    </Select.Option>
                    <Select.Option value="SMS">
                      <MessageOutlined /> SMS
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="title"
              label="Template tiêu đề (FreeMarker)"
              rules={[
                { required: true, message: "Vui lòng nhập template tiêu đề" },
              ]}
            >
              <Input placeholder="Order #${orderId} confirmed" />
            </Form.Item>

            <Form.Item
              name="content"
              label="Template nội dung (FreeMarker/HTML)"
              rules={[
                { required: true, message: "Vui lòng nhập template nội dung" },
              ]}
            >
              <TextArea
                rows={10}
                placeholder="<h1>Hello ${customerName}</h1><p>Your order #${orderId} has been confirmed.</p>"
              />
            </Form.Item>

            <Form.Item
              name="params"
              label="Parameters (JSON)"
              help="Ví dụ: {&quot;customerName&quot;: &quot;Guest&quot;, &quot;orderId&quot;: &quot;N/A&quot;}"
            >
              <TextArea
                rows={4}
                placeholder='{"customerName": "Guest", "orderId": "N/A"}'
              />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
            </Form.Item>

            <Form.Item>
              <Space className="w-full justify-end">
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    setEditingTemplate(null);
                    form.resetFields();
                  }}
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingTemplate ? "Cập nhật" : "Tạo mới"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Preview Modal */}
        <Modal
          title={`Preview: ${editingTemplate?.templateCode}`}
          open={isPreviewModalVisible}
          onCancel={() => setIsPreviewModalVisible(false)}
          width={800}
          footer={null}
        >
          <Form form={previewForm} layout="vertical">
            <Form.Item
              name="params"
              label="Parameters (JSON)"
              help="Nhập JSON parameters để test render"
            >
              <TextArea
                rows={6}
                placeholder='{"customerName": "John", "orderId": "12345"}'
              />
            </Form.Item>
            <Button
              type="primary"
              loading={previewLoading}
              onClick={() => handlePreview(editingTemplate.templateCode)}
              block
            >
              Render Preview
            </Button>
          </Form>

          {previewContent && (
            <>
              <Divider />
              <div>
                <Title level={5}>Tiêu đề:</Title>
                <Alert message={previewContent.title} type="info" />
                <Title level={5} className="mt-4">
                  Nội dung:
                </Title>
                <Card>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: previewContent.content,
                    }}
                  />
                </Card>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default NotifyConfig;