import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Image,
  Modal,
  Input,
  Select,
  Form,
  Popconfirm,
  Upload,
  message,
  Tree,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  FolderOutlined,
  FolderAddOutlined,
  LoadingOutlined,
  EyeOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import apiClient from "../services/apiClient";

const { Title } = Typography;
const { Option } = Select;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState("add"); // 'add', 'edit', 'view'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const [treeData, setTreeData] = useState([]);

  const fetchData = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      // Include pagination parameters in the API request
      const response = await apiClient.get("/api/categories", {
        params: {
          page: page, // Backend typically uses 0-based indexing
          size: size,
        },
      });

      const data = response.data.data.categories;
      setCategories(data);
      setTotalElements(response.data.data.totalElements);
      setTotalPages(response.data.data.totalPages);

      // Build tree data logic remains the same
      const buildTreeData = (items, parentId = null) => {
        return items
          .filter((item) => item.parentId === parentId)
          .map((item) => ({
            title: item.name,
            key: item.id,
            icon: <FolderOutlined />,
            children: buildTreeData(items, item.id),
          }));
      };

      setTreeData(buildTreeData(data));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      {uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, []);

  const showModal = (type, category = null) => {
    setModalType(type);
    setCurrentCategory(category);
    setVisible(true);

    if (type === "edit" || type === "view") {
      form.setFieldsValue({
        id: category.id,
        name: category.name,
        image: category.image ? category.image : "",
        parentId: category.parentId,
        description: category.description,
        slug: category.slug,
      });
      setImageUrl(category.image || "");
    } else {
      form.resetFields();
      setImageUrl("");
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;

    // Start upload loading state
    setUploadLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Assuming your API has an endpoint for file uploads
      const response = await apiClient.post(
        "/api/files/images/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Get image URL from response
      const imageUrl = response.data.data.url;
      setImageUrl(imageUrl);

      // Notify upload success
      message.success("Image uploaded successfully");
      onSuccess(response, file);
    } catch (error) {
      console.error("Failed to upload image:", error);
      message.error("Failed to upload image");
      onError(error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          setLoading(true);

          // Prepare the data
          const categoryData = {
            ...values,
            // Convert empty string or undefined to null for parentId
            parentId: values.parentId || null,
            // Include image URL if available
            image: imageUrl || null,
          };

          let response;

          if (modalType === "add") {
            // Create new category
            response = await apiClient.post("/api/categories", categoryData, {
              headers: { "Content-Type": "application/json" },
            });
          } else {
            // Update existing category (assuming ID is part of the form values)
            response = await apiClient.put(`/api/categories`, categoryData, {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Show success message
          message.success(
            `Category ${
              modalType === "add" ? "added" : "updated"
            } successfully!`
          );

          // Close the modal
          setVisible(false);

          // Refresh the categories list
          fetchData(currentPage, pageSize);
        } catch (error) {
          console.error("Failed to save category:", error);
          message.error(
            `Failed to ${modalType === "add" ? "add" : "update"} category. ${
              error.response?.data?.message || error.message
            }`
          );
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/categories/${id}`);
      message.success("Category deleted successfully!");
      fetchData(currentPage, pageSize); // Refresh the categories list
    } catch (error) {
      console.error("Failed to delete category:", error);
      message.error(
        "Failed to delete category. " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // In a real app, you'd filter categories based on search or make an API call
  };
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) =>
        image ? (
          <Image
            src={image}
            alt="Category"
            width={50}
            height={50}
            style={{ objectFit: "cover" }}
            fallback="data:image/png;base64,..." // Hiển thị ảnh mặc định khi lỗi
          />
        ) : (
          <span>No image</span>
        ),
    },
    {
      title: "Parent Category",
      dataIndex: "parentId",
      key: "parentId",
      render: (parentId) => {
        if (!parentId) return <Tag>Root Category</Tag>;
        const parent = categories.find((cat) => cat.id === parentId);
        return parent ? parent.name : "";
      },
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (slug) => <Tag color="green">{slug}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<ZoomInOutlined />}
            size="small"
            onClick={() => showModal("view", record)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal("edit", record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this category?"
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

  const handlePaginationChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchData(page, size);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Categories</Title>
        <Space>
          <Input
            placeholder="Search categories"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal("add")}
          >
            Add Category
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 bg-white p-4 rounded shadow">
          <Title level={4}>Category Tree</Title>
          <Tree showIcon defaultExpandAll treeData={treeData} />
        </div>

        <div className="md:col-span-3">
          <Table
            columns={columns}
            dataSource={categories}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalElements,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
              onChange: (page, pageSize) =>
                handlePaginationChange(page, pageSize),
              onShowSizeChange: (current, size) =>
                handlePaginationChange(current, size),
            }}
          />
        </div>
      </div>

      <Modal
        title={
          modalType === "add"
            ? "Add New Category"
            : modalType === "edit"
            ? "Edit Category"
            : "View Category"
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
        width={600}
      >
        <Form form={form} layout="vertical" disabled={modalType === "view"}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Category Image"
            tooltip="Upload an image for this category"
          >
            <Upload
              name="image"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={handleImageUpload}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith("image/");
                if (!isImage) {
                  message.error("You can only upload image files!");
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error("Image must be smaller than 2MB!");
                }
                return isImage && isLt2M;
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="category"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                uploadButton
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: false, message: "Please enter a slug" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="parentId" label="Parent category">
            <Select placeholder="Select parent category" allowClear>
              <Option value={null}>Root Category</Option>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
