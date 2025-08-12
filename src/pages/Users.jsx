import React, { useState, useEffect } from "react";
import {
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
  Upload,
  Tabs,
  message,
  Row,
  Col,
  DatePicker,
  Avatar,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
  HomeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import moment from "moment";
import apiClient from "../services/apiClient.js";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [addresses, setAddresses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/users`);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showModal = (type, user = null) => {
    setModalType(type);
    setCurrentUser(user);
    setVisible(true);
    setActiveTab("1");

    if (type === "edit" || type === "view") {
      form.setFieldsValue({
        username: user.username,
        full_name: user.fullName,
        gender: user.gender,
        birthDate: user.birthDate ? moment(user.birthDate) : null,
      });

      setAvatarUrl(user.avatar);
      setAddresses(user.addressDTOs);
    } else {
      form.resetFields();
      setAvatarUrl("");
      setAddresses([]);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
    addressForm.resetFields();
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Here you would normally send to backend
        console.log("Form values:", values);
        message.success(
          `User ${modalType === "add" ? "added" : "updated"} successfully!`
        );
        setVisible(false);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/users/${id}`);
      fetchUsers();
      message.success("User deleted successfully!");
    } catch (error) {
      console.error("Failed to delete user:", error);
      message.error("Failed to delete user");
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // In a real app, you'd filter users based on search or make an API call
  };

  const handleAddAddress = () => {
    addressForm
      .validateFields()
      .then((values) => {
        // Add address logic
        const newAddress = {
          id: Date.now().toString(),
          user_id: currentUser?.id || "new",
          ...values,
          createdAt: new Date().toISOString().split("T")[0],
        };
        setAddresses([...addresses, newAddress]);
        addressForm.resetFields();
        message.success("Address added successfully!");
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDeleteAddress = (addressId) => {
    setAddresses(addresses.filter((a) => a.id !== addressId));
    message.success("Address deleted successfully!");
  };

  const handleSetDefaultAddress = (addressId) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        is_default: a.id === addressId,
      }))
    );
    message.success("Default address updated!");
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === "done") {
      // In a real app, you'd get the URL from the response
      setAvatarUrl(URL.createObjectURL(info.file.originFileObj));
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar) => (
        <Avatar src={avatar} size={40} icon={<UserOutlined />} />
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (username) => username || <Text type="secondary">Not set</Text>,
      sorter: (a, b) => {
        if (!a.username && !b.username) return 0;
        if (!a.username) return 1;
        if (!b.username) return -1;
        return a.username.localeCompare(b.username);
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        const usernameMatch = record.username
          ? record.username.toLowerCase().includes(value.toLowerCase())
          : false;
        const fullNameMatch = record.fullName
          ? record.fullName.toLowerCase().includes(value.toLowerCase())
          : false;
        return usernameMatch || fullNameMatch;
      },
    },
    {
      title: "Full Name",
      dataIndex: "fullName", // Thay đổi từ full_name sang fullName
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => {
        if (!gender) return <Tag color="default">NOT SET</Tag>;

        let color = "blue";
        if (gender === "female") color = "pink";
        if (gender === "other") color = "purple";
        return <Tag color={color}>{gender.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Birth Date",
      dataIndex: "birthDate",
      key: "birthDate",
      render: (date) => (date ? moment(date).format("MM/DD/YYYY") : "N/A"),
      sorter: (a, b) => {
        if (!a.birthDate && !b.birthDate) return 0;
        if (!a.birthDate) return -1;
        if (!b.birthDate) return 1;
        return moment(a.birthDate).unix() - moment(b.birthDate).unix();
      },
    },
    {
      title: "Addresses",
      key: "addresses",
      render: (_, record) => {
        const count = record.addressDTOs?.length || 0;
        return (
          <Tag color="cyan">
            {count} {count === 1 ? "address" : "addresses"}
          </Tag>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("MM/DD/YYYY"),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showModal("view", record)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal("edit", record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this user?"
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

  const addressColumns = [
    {
      title: "Full Name",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Ward/District/City",
      key: "location",
      render: (_, record) => (
        <span>
          {record.ward}, {record.district}, {record.city}
        </span>
      ),
    },
    {
      title: "Default",
      dataIndex: "is_default",
      key: "is_default",
      render: (isDefault) =>
        isDefault ? <Tag color="green">Default</Tag> : null,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("MM/DD/YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {!record.is_default && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSetDefaultAddress(record.id)}
            >
              Set as Default
            </Button>
          )}
          <Popconfirm
            title="Are you sure you want to delete this address?"
            onConfirm={() => handleDeleteAddress(record.id)}
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
        <Title level={2}>Users</Title>
        <Space>
          <Input
            placeholder="Search users"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal("add")}
          >
            Add User
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={
          modalType === "add"
            ? "Add New User"
            : modalType === "edit"
            ? "Edit User"
            : "View User"
        }
        visible={visible}
        onCancel={handleCancel}
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
                <Button key="submit" type="primary" onClick={handleOk}>
                  {modalType === "add" ? "Create" : "Update"}
                </Button>,
              ]
        }
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="User Information" key="1">
            <Form form={form} layout="vertical" disabled={modalType === "view"}>
              <div className="flex justify-center mb-6">
                <Upload
                  name="avatar"
                  listType="picture-circle"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleAvatarChange}
                  disabled={modalType === "view"}
                >
                  {avatarUrl ? (
                    <Avatar src={avatarUrl} size={80} icon={<UserOutlined />} />
                  ) : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="username"
                    label="Username"
                    rules={[
                      { required: true, message: "Please enter username" },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="full_name"
                    label="Full Name"
                    rules={[
                      { required: true, message: "Please enter full name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[
                      { required: true, message: "Please select gender" },
                    ]}
                  >
                    <Select placeholder="Select gender">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="birthDate" label="birthDate">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </TabPane>

          <TabPane tab="Addresses" key="2">
            <div className="mb-4">
              <Title level={5}>User Addresses</Title>
              <Table
                columns={addressColumns}
                dataSource={addresses}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            {modalType !== "view" && (
              <div className="mt-4 pt-4 border-t">
                <Title level={5}>Add New Address</Title>
                <Form form={addressForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="full_name"
                        label="Full Name"
                        rules={[
                          { required: true, message: "Please enter full name" },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[
                          {
                            required: true,
                            message: "Please enter phone number",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[
                      { required: true, message: "Please enter address" },
                    ]}
                  >
                    <Input prefix={<HomeOutlined />} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name="ward"
                        label="Ward"
                        rules={[
                          { required: true, message: "Please enter ward" },
                        ]}
                      >
                        <Input prefix={<EnvironmentOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="district"
                        label="District"
                        rules={[
                          { required: true, message: "Please enter district" },
                        ]}
                      >
                        <Input prefix={<EnvironmentOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="city"
                        label="City"
                        rules={[
                          { required: true, message: "Please enter city" },
                        ]}
                      >
                        <Input prefix={<EnvironmentOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="is_default" valuePropName="checked">
                    <Select defaultValue={false}>
                      <Option value={true}>Default Address</Option>
                      <Option value={false}>Not Default</Option>
                    </Select>
                  </Form.Item>

                  <Button type="primary" onClick={handleAddAddress}>
                    Add Address
                  </Button>
                </Form>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default Users;
