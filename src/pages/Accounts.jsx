import React, { useState, useEffect } from 'react';
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
  message,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [currentAccount, setCurrentAccount] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      setAccounts([
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          created_at: '2023-05-15',
          created_by: 'system',
        },
        {
          id: '2',
          username: 'john.doe',
          email: 'john.doe@example.com',
          role: 'customer',
          status: 'active',
          created_at: '2023-05-10',
          created_by: 'admin',
        },
        {
          id: '3',
          username: 'jane.smith',
          email: 'jane.smith@example.com',
          role: 'customer',
          status: 'inactive',
          created_at: '2023-05-05',
          created_by: 'admin',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const showModal = (type, account = null) => {
    setModalType(type);
    setCurrentAccount(account);
    setVisible(true);
    
    if (type === 'edit' || type === 'view') {
      form.setFieldsValue({
        username: account.username,
        email: account.email,
        role: account.role,
        status: account.status,
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
    form.validateFields()
      .then(values => {
        // Here you would normally send to backend
        console.log('Form values:', values);
        message.success(`Account ${modalType === 'add' ? 'added' : 'updated'} successfully!`);
        setVisible(false);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleDelete = (id) => {
    setAccounts(accounts.filter(account => account.id !== id));
    message.success('Account deleted successfully!');
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // In a real app, you'd filter accounts based on search or make an API call
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.username.toLowerCase().includes(value.toLowerCase()) ||
        record.email.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = role === 'admin' ? 'purple' : 'blue';
        return <Tag color={color}>{role.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Customer', value: 'customer' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'active' ? 'green' : 'volcano';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showModal('edit', record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this account?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Accounts</Title>
        <Space>
          <Input 
            placeholder="Search accounts" 
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal('add')}
          >
            Add Account
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={accounts} 
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={
          modalType === 'add' ? 'Add New Account' : 
          modalType === 'edit' ? 'Edit Account' : 'View Account'
        }
        visible={visible}
        onCancel={handleCancel}
        footer={
          modalType === 'view' 
            ? [<Button key="back" onClick={handleCancel}>Close</Button>]
            : [
                <Button key="back" onClick={handleCancel}>Cancel</Button>,
                <Button key="submit" type="primary" onClick={handleOk}>
                  {modalType === 'add' ? 'Create' : 'Update'}
                </Button>,
              ]
        }
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={modalType === 'view'}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          
          {modalType === 'add' && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
          )}
          
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="customer">Customer</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Accounts;