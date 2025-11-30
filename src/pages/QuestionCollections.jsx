import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Divider,
  List,
  Badge,
} from "antd";
import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;
const { TextArea } = Input;

const QuestionCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [viewCollection, setViewCollection] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({
    title: "",
  });

  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchCollections();
  }, [pagination.current, pagination.pageSize, searchParams]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        "/api/question-collections/search",
        {
          title: searchParams.title || "",
          page: pagination.current - 1,
          size: pagination.pageSize,
        }
      );

      setCollections(response.data.data?.content || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.data?.totalElements || 0,
      }));
    } catch (error) {
      message.error("Lỗi khi tải danh sách bộ câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setSearchParams({
      title: values.title || "",
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({ title: "" });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleOpenDialog = (collection = null) => {
    if (collection) {
      form.setFieldsValue({
        id: collection.id,
        title: collection.title,
        questions: collection.questions || [
          {
            content: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctOption: "A",
          },
        ],
      });
      setSelectedCollection(collection);
    } else {
      form.setFieldsValue({
        title: "",
        questions: [
          {
            content: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctOption: "A",
          },
        ],
      });
      setSelectedCollection(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCollection(null);
    form.resetFields();
  };

  const handleViewCollection = async (id) => {
    try {
      const response = await apiClient.get(`/api/question-collections/${id}`);
      setViewCollection(response.data.data);
      setOpenViewDialog(true);
    } catch (error) {
      message.error("Lỗi khi tải thông tin bộ câu hỏi");
    }
  };

  const handleSaveCollection = async (values) => {
    try {
      const payload = {
        ...values,
        questions: values.questions.map((q) => ({
          ...q,
          id: q.id || undefined,
        })),
      };

      if (selectedCollection) {
        await apiClient.put("/api/question-collections", payload);
        message.success("Cập nhật bộ câu hỏi thành công!");
      } else {
        await apiClient.post("/api/question-collections", payload);
        message.success("Tạo mới bộ câu hỏi thành công!");
      }
      handleCloseDialog();
      fetchCollections();
    } catch (error) {
      console.error("Error saving collection:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleDeleteCollection = async (id) => {
    try {
      await apiClient.delete(`/api/question-collections/${id}`);
      message.success("Xóa bộ câu hỏi thành công!");
      fetchCollections();
    } catch (error) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const getCorrectOptionLabel = (option) => {
    const labels = { A: "A", B: "B", C: "C", D: "D" };
    return labels[option] || option;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (text) => <Text copyable>{text.substring(0, 8)}...</Text>,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 300,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Số câu hỏi",
      dataIndex: "questions",
      key: "questions",
      width: 120,
      align: "center",
      render: (questions) => (
        <Badge
          count={questions?.length || 0}
          showZero
          style={{ backgroundColor: "#52c41a" }}
        />
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => handleViewCollection(record.id)}
            size="small"
          >
            Xem
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleOpenDialog(record)}
            size="small"
          />
          <Popconfirm
            title="Xác nhận xóa"
            description={`Bạn có chắc chắn muốn xóa bộ câu hỏi "${record.title}" không?`}
            onConfirm={() => handleDeleteCollection(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <QuestionCircleOutlined /> Quản lý Bộ sưu tập câu hỏi
      </Title>

      {/* Search Section */}
      <Card style={{ marginBottom: 16 }} title="Tìm kiếm">
        <Form form={searchForm} onFinish={handleSearch} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={18}>
              <Form.Item name="title" label="Tiêu đề">
                <Input
                  placeholder="Tìm kiếm theo tiêu đề..."
                  prefix={<SearchOutlined />}
                  allowClear
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label=" " colon={false}>
                <Space style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    size="large"
                  >
                    Tìm kiếm
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                    size="large"
                  >
                    Đặt lại
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Action Buttons */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Thêm bộ câu hỏi mới
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={collections}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bộ câu hỏi`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          selectedCollection ? "Cập nhật bộ câu hỏi" : "Thêm bộ câu hỏi mới"
        }
        open={openDialog}
        onCancel={handleCloseDialog}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          onFinish={handleSaveCollection}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề bộ câu hỏi"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề bộ câu hỏi" size="large" />
          </Form.Item>

          <Divider orientation="left">Danh sách câu hỏi</Divider>

          <Form.List
            name="questions"
            rules={[
              {
                validator: async (_, questions) => {
                  if (!questions || questions.length < 1) {
                    return Promise.reject(
                      new Error("Vui lòng thêm ít nhất một câu hỏi!")
                    );
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Câu hỏi ${index + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="link"
                          danger
                          onClick={() => remove(field.name)}
                        >
                          Xóa
                        </Button>
                      )
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Form.Item name={[field.name, "id"]} hidden>
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, "content"]}
                      label="Nội dung câu hỏi"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập nội dung câu hỏi!",
                        },
                      ]}
                    >
                      <TextArea rows={2} placeholder="Nhập nội dung câu hỏi" />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, "optionA"]}
                          label="Đáp án A"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập đáp án A!",
                            },
                          ]}
                        >
                          <Input placeholder="Nhập đáp án A" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, "optionB"]}
                          label="Đáp án B"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập đáp án B!",
                            },
                          ]}
                        >
                          <Input placeholder="Nhập đáp án B" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, "optionC"]}
                          label="Đáp án C"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập đáp án C!",
                            },
                          ]}
                        >
                          <Input placeholder="Nhập đáp án C" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, "optionD"]}
                          label="Đáp án D"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập đáp án D!",
                            },
                          ]}
                        >
                          <Input placeholder="Nhập đáp án D" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name={[field.name, "correctOption"]}
                      label="Đáp án đúng"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn đáp án đúng!",
                        },
                      ]}
                    >
                      <Radio.Group>
                        <Radio value="A">A</Radio>
                        <Radio value="B">B</Radio>
                        <Radio value="C">C</Radio>
                        <Radio value="D">D</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Card>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm câu hỏi
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseDialog}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {selectedCollection ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined />
            {viewCollection?.title}
          </Space>
        }
        open={openViewDialog}
        onCancel={() => setOpenViewDialog(false)}
        footer={[
          <Button key="close" onClick={() => setOpenViewDialog(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        <List
          dataSource={viewCollection?.questions || []}
          renderItem={(question, index) => (
            <List.Item>
              <Card
                size="small"
                style={{ width: "100%" }}
                title={
                  <Space>
                    <Badge
                      count={index + 1}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                    <Text strong>{question.content}</Text>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text>
                      <Tag color="blue">A</Tag> {question.optionA}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text>
                      <Tag color="blue">B</Tag> {question.optionB}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text>
                      <Tag color="blue">C</Tag> {question.optionC}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text>
                      <Tag color="blue">D</Tag> {question.optionD}
                    </Text>
                  </Col>
                </Row>
                <Divider style={{ margin: "12px 0" }} />
                <Text strong>
                  Đáp án đúng:{" "}
                  <Tag color="green">
                    {getCorrectOptionLabel(question.correctOption)}
                  </Tag>
                </Text>
              </Card>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default QuestionCollections;
