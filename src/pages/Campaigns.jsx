import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [games, setGames] = useState([]);
  const [questionCollections, setQuestionCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchCampaigns();
    fetchGames();
    fetchQuestionCollections();
  }, [pagination.current, pagination.pageSize]);

  const fetchGames = async () => {
    try {
      const response = await apiClient.get("/api/games");
      setGames(response.data.data || []);
    } catch (error) {
      console.error("Error fetching games:", error);
      message.error("Lỗi khi tải danh sách games");
    }
  };

  const fetchQuestionCollections = async () => {
    try {
      const response = await apiClient.post(
        "/api/question-collections/search",
        {
          title: "",
          page: 0,
          size: 100,
        }
      );
      setQuestionCollections(response.data.data?.content || []);
    } catch (error) {
      console.error("Error fetching question collections:", error);
      message.error("Lỗi khi tải danh sách bộ câu hỏi");
    }
  };

  const fetchCampaigns = async (searchParams = {}) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/campaigns/search`, {
        ...searchParams,
        page: pagination.current - 1,
        size: pagination.pageSize,
      });
      setCampaigns(response.data.data?.content || []);
      setPagination({
        ...pagination,
        total: response.data.data?.totalElements || 0,
      });
    } catch (error) {
      message.error("Lỗi khi tải danh sách campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (campaign = null) => {
    if (campaign) {
      form.setFieldsValue({
        id: campaign.id,
        gameId: campaign.gameId,
        name: campaign.name,
        startTime: dayjs(campaign.startTime),
        endTime: dayjs(campaign.endTime),
        description: campaign.description || "",
        questionCollectionId: campaign.questionCollectionId || null,
        vouchers: campaign.vouchers?.map((v) => ({
          code: v.code,
          discountPercentage: v.discountPercentage,
          value: v.value,
          maxValue: v.maxValue,
          expirationDate: v.expirationDate ? dayjs(v.expirationDate) : null,
          voucherOrder: v.voucherOrder || 1,
        })) || [
          {
            code: "",
            discountPercentage: 0,
            value: 0,
            maxValue: 0,
            expirationDate: null,
            voucherOrder: 1,
          },
        ],
      });
      setSelectedCampaign(campaign);
    } else {
      form.setFieldsValue({
        vouchers: [
          {
            code: "",
            discountPercentage: 0,
            value: 0,
            maxValue: 0,
            expirationDate: null,
            voucherOrder: 1,
          },
        ],
      });
      setSelectedCampaign(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCampaign(null);
    form.resetFields();
  };

  const handleSaveCampaign = async (values) => {
    try {
      const payload = {
        ...values,
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString(),
        questionCollectionId: values.questionCollectionId,
        vouchers: values.vouchers.map((voucher) => ({
          code: voucher.code,
          discountPercentage: voucher.discountPercentage,
          value: voucher.value,
          maxValue: voucher.maxValue,
          expirationDate: voucher.expirationDate?.toISOString(),
          voucherOrder: voucher.voucherOrder,
        })),
      };

      if (selectedCampaign) {
        await apiClient.put(`/api/campaigns`, payload);
        message.success("Cập nhật Campaign thành công!");
      } else {
        await apiClient.post(`/api/campaigns`, payload);
        message.success("Tạo mới Campaign thành công!");
      }
      handleCloseDialog();
      fetchCampaigns();
    } catch (error) {
      console.error("Error saving campaign:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleDeleteCampaign = async (id) => {
    try {
      await apiClient.delete(`/api/campaigns/${id}`);
      message.success("Xóa Campaign thành công!");
      fetchCampaigns();
    } catch (error) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleSearch = (values) => {
    const searchParams = {
      gameId: values.gameId || null,
      name: values.name || null,
      fromStartTime: values.startDateRange?.[0]?.toISOString() || null,
      toStartTime: values.startDateRange?.[1]?.toISOString() || null,
      fromEndTime: values.endDateRange?.[0]?.toISOString() || null,
      toEndTime: values.endDateRange?.[1]?.toISOString() || null,
    };
    setPagination({ ...pagination, current: 1 });
    fetchCampaigns(searchParams);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchCampaigns();
  };

  const getCampaignStatus = (startTime, endTime) => {
    const now = dayjs();
    const start = dayjs(startTime);
    const end = dayjs(endTime);

    if (now.isBefore(start)) {
      return { label: "Sắp diễn ra", color: "blue" };
    } else if (now.isAfter(end)) {
      return { label: "Đã kết thúc", color: "default" };
    } else {
      return { label: "Đang diễn ra", color: "green" };
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tên Campaign",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Game",
      dataIndex: "gameName",
      key: "gameName",
      width: 150,
      render: (text, record) => text || record.gameId,
    },
    {
      title: "Thời gian bắt đầu",
      dataIndex: "startTime",
      key: "startTime",
      width: 180,
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thời gian kết thúc",
      dataIndex: "endTime",
      key: "endTime",
      width: 180,
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_, record) => {
        const status = getCampaignStatus(record.startTime, record.endTime);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleOpenDialog(record)}
            size="small"
          />
          <Popconfirm
            title="Xác nhận xóa"
            description={`Bạn có chắc chắn muốn xóa campaign "${record.name}" không?`}
            onConfirm={() => handleDeleteCampaign(record.id)}
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

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Quản lý Campaigns
      </Title>

      {/* Search Section */}
      <Card style={{ marginBottom: 16 }} title="Tìm kiếm">
        <Form form={searchForm} onFinish={handleSearch} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="gameId" label="Game">
                <Select
                  placeholder="Chọn game"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    { label: "Tất cả", value: "" },
                    ...games.map((game) => ({
                      label: game.name,
                      value: game.id,
                    })),
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="name" label="Tên Campaign">
                <Input placeholder="Nhập tên campaign" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="startDateRange" label="Khoảng thời gian bắt đầu">
                <RangePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="endDateRange" label="Khoảng thời gian kết thúc">
                <RangePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                >
                  Tìm kiếm
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Đặt lại
                </Button>
              </Space>
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
          Thêm Campaign
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={campaigns}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} campaigns`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={selectedCampaign ? "Cập nhật Campaign" : "Thêm Campaign mới"}
        open={openDialog}
        onCancel={handleCloseDialog}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          onFinish={handleSaveCampaign}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="gameId"
            label="Game"
            rules={[{ required: true, message: "Vui lòng chọn game!" }]}
          >
            <Select
              placeholder="Chọn game"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={games.map((game) => ({
                label: game.name,
                value: game.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên Campaign"
            rules={[{ required: true, message: "Vui lòng nhập tên campaign!" }]}
          >
            <Input placeholder="Nhập tên campaign" />
          </Form.Item>

          <Form.Item
            name="questionCollectionId"
            label="Bộ câu hỏi"
            rules={[{ required: true, message: "Vui lòng chọn bộ câu hỏi!" }]}
          >
            <Select
              placeholder="Chọn bộ câu hỏi"
              showSearch
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={questionCollections.map((collection) => ({
                label: `${collection.title} (${
                  collection.questions?.length || 0
                } câu hỏi)`,
                value: collection.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startTime"
                label="Thời gian bắt đầu"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian bắt đầu!",
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời gian bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="endTime"
                label="Thời gian kết thúc"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian kết thúc!",
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời gian kết thúc"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={4} placeholder="Nhập mô tả campaign" />
          </Form.Item>

          <Divider orientation="left">Danh sách Vouchers</Divider>

          <Form.List
            name="vouchers"
            rules={[
              {
                validator: async (_, vouchers) => {
                  if (!vouchers || vouchers.length < 1) {
                    return Promise.reject(
                      new Error("Vui lòng thêm ít nhất một voucher!")
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
                    title={`Voucher ${index + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="link"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          Xóa
                        </Button>
                      )
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "code"]}
                          label="Mã voucher"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập mã voucher!",
                            },
                          ]}
                        >
                          <Input placeholder="Ví dụ: SUMMER2024" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "discountPercentage"]}
                          label="Phần trăm giảm giá (%)"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập % giảm giá!",
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            style={{ width: "100%" }}
                            placeholder="0-100"
                            addonAfter="%"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "voucherOrder"]}
                          label="Thứ tự"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập thứ tự!",
                            },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            style={{ width: "100%" }}
                            placeholder="Nhập thứ tự"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "value"]}
                          label="Giá trị giảm cố định"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập giá trị tối thiểu!",
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            placeholder="VNĐ"
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              value?.replace(/\$\s?|(,*)/g, "")
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "maxValue"]}
                          label="Giảm tối đa"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập giá trị giảm tối đa!",
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            placeholder="VNĐ"
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              value?.replace(/\$\s?|(,*)/g, "")
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[field.name, "expirationDate"]}
                          label="Ngày hết hạn"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng chọn ngày hết hạn!",
                            },
                          ]}
                        >
                          <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            style={{ width: "100%" }}
                            placeholder="Chọn ngày hết hạn"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm Voucher
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
                {selectedCampaign ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Campaigns;
