import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [form] = Form.useForm();
  const [variantForm] = Form.useForm();
  const [productVariants, setProductVariants] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [fileList, setFileList] = useState([]);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [coverImageURL, setCoverImageURL] = useState(null);
  const [additionalImageURLs, setAdditionalImageURLs] = useState([]);

  const fetchData = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const productsResponse = await apiClient.get("/api/products", {
        params: {
          page: page,
          size: size,
        },
      });

      const data = productsResponse.data.data;

      const formattedProducts = data.products.map((product) => ({
        ...product,
        categoryId: product.categoryId,
        isBestseller: product.isBestseller,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        cover: product.cover,
        images: product.images || [],
        productVariants: product.productVariants || [],
      }));

      setProducts(formattedProducts);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
      setPageSize(size);

      const categoriesResponse = await apiClient.get("/api/categories/all");
      setCategories(categoriesResponse.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, []);

  const showModal = (type, product = null) => {
    setModalType(type);
    setCurrentProduct(product);
    setVisible(true);
    setActiveTab("1");

    if (type === "edit" || type === "view") {
      form.setFieldsValue({
        id: product.id,
        name: product.name,
        slug: product.slug,
        cover: product.cover,
        images: product.images || [],
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        status: product.status,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        isBestseller: product.isBestseller,
        categoryId: product.categoryId,
        productVaraints: product.productVariants || [],
      });

      console.log(product.cover);
      setFileList([
        {
          uid: "1",
          status: "done",
          url: product.cover,
        },
      ]);

      // Format additional images properly
      setAdditionalImages(
        (product.images || []).map((image, index) => ({
          uid: `additional-${index}`,
          status: "done",
          url: image,
        }))
      );

      setCoverImageURL(product.cover);
      setAdditionalImageURLs(product.images || []);
      setProductVariants(product.productVariants || []);
    } else {
      form.resetFields();
      setFileList([]);
      setAdditionalImages([]);
      setProductVariants([]);
      setCoverImageURL(""); // Explicitly reset
      setAdditionalImageURLs([]); // Explicitly reset
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
    variantForm.resetFields();
    setFileList([]);
    setAdditionalImages([]);
    setCoverImageURL("");
    setAdditionalImageURLs([]);
  };

  // Custom upload handler for cover image
  const customUploadCover = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await apiClient.post(
        "/api/files/images/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const imageUrl = response.data.data.url;
      setCoverImageURL(imageUrl);
      onSuccess(response, file);
    } catch (error) {
      console.error("Error uploading cover image:", error);
      message.error("Failed to upload cover image");
      onError(error);
    }
  };

  // Custom upload handler for additional images
  const customUploadAdditional = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await apiClient.post(
        "/api/files/images/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const imageUrl = response.data.data.url;
      setAdditionalImageURLs((prev) => [...prev, imageUrl]);
      onSuccess(response, file);
    } catch (error) {
      console.error("Error uploading additional image:", error);
      message.error("Failed to upload additional image");
      onError(error);
    }
  };

  // Handler for removing an additional image
  const handleRemoveAdditionalImage = (file) => {
    const index = additionalImages.findIndex((item) => item.uid === file.uid);
    if (index > -1) {
      const newUrls = [...additionalImageURLs];
      newUrls.splice(index, 1);
      setAdditionalImageURLs(newUrls);
    }
    return true;
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          setLoading(true);

          const formattedVariants = productVariants.map((variant) => ({
            id: variant.id,
            size: variant.size,
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            price: parseFloat(variant.price),
            originalPrice: parseFloat(variant.originalPrice || 0),
            quantity: parseInt(variant.quantity),
          }));

          // Create product data with image URLs and product variants
          const productData = {
            ...values,
            cover: coverImageURL, // Provide fallback empty string
            images: additionalImageURLs || [], // Provide fallback empty array
            productVariants: formattedVariants,
          };

          // Send the data to your API
          if (modalType === "add") {
            await apiClient.post("/api/products", productData, {
              headers: { "Content-Type": "application/json" },
            });
          } else if (modalType === "edit") {
            await apiClient.put(`/api/products`, productData, {
              headers: { "Content-Type": "application/json" },
            });
          }

          message.success(
            `Product ${modalType === "add" ? "added" : "updated"} successfully!`
          );
          setVisible(false);
          // Refresh the products list
          fetchData();
        } catch (error) {
          console.error("Error saving product:", error);
          message.error("Failed to save product");
        } finally {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Validation failed:", error);
        message.error("Please fix the errors in the form");
      });
  };

  const handleDelete = async (id) => {
    // Delete logic would go here
    try {
      const response = await apiClient.delete(`/api/products/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      message.error("Failed to delete product");
      return;
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // In a real app, you'd filter products based on search or make an API call
  };

  const handleAddVariant = () => {
    variantForm
      .validateFields()
      .then((values) => {
        // Create variant with properly formatted field names
        const newVariant = {
          id: null, // Temporary ID for demo purposes
          size: values.size,
          colorName: values.colorName,
          colorHex: values.colorHex,
          price: values.price,
          originalPrice: values.originalPrice,
          quantity: values.quantity,
        };
        setProductVariants([...productVariants, newVariant]);
        variantForm.resetFields();
        message.success("Variant added successfully!");
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDeleteVariant = (variantId) => {
    setProductVariants(productVariants.filter((v) => v.id !== variantId));
    message.success("Variant deleted successfully!");
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "cover",
      key: "cover",
      render: (cover) => (
        <Image
          src={cover || "https://via.placeholder.com/50x50?text=No+Image"}
          width={50}
          height={50}
          fallback="https://via.placeholder.com/50x50?text=No+Image"
          preview={false}
        />
      ),
    },
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
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (text) => `${text} VND`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Category",
      dataIndex: "categoryId",
      key: "category",
      render: (categoryId) => {
        const category = categories.find((c) => c.id === categoryId);
        return category ? category.name : "Không xác định";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "green";
        if (status === "inactive") color = "volcano";
        if (status === "out_of_stock") color = "red";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Features",
      key: "features",
      render: (_, record) => (
        <Space>
          {record.isFeatured && <Tag color="purple">Featured</Tag>}
          {record.isNew && <Tag color="blue">New</Tag>}
          {record.isBestseller && <Tag color="orange">Bestseller</Tag>}
        </Space>
      ),
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
            title="Are you sure you want to delete this product?"
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

  const variantColumns = [
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Color",
      dataIndex: "colorName",
      key: "colorName",
      render: (text, record) => (
        <Space>
          <div
            style={{
              backgroundColor: record.colorHex,
              width: 20,
              height: 20,
              display: "inline-block",
              marginRight: 8,
              border: "1px solid #d9d9d9",
              borderRadius: "2px",
            }}
          />
          {text}
        </Space>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (text) => `$${text}`,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this variant?"
            onConfirm={() => handleDeleteVariant(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handlePaginationChange = (page, pageSize) => {
    fetchData(page, pageSize);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Products</Title>
        <Space>
          <Input
            placeholder="Search products"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal("add")}
          >
            Add Product
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={products}
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
          onChange: handlePaginationChange,
          onShowSizeChange: handlePaginationChange,
        }}
      />

      <Modal
        title={
          modalType === "add"
            ? "Add New Product"
            : modalType === "edit"
            ? "Edit Product"
            : "View Product"
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
          <TabPane tab="Basic Info" key="1">
            <Form form={form} layout="vertical" disabled={modalType === "view"}>
              <Form.Item name="id" hidden>
                <Input type="hidden" />
              </Form.Item>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  { required: true, message: "Please enter product name" },
                ]}
              >
                <Input />
              </Form.Item>

              {modalType !== "add" && (
                <Form.Item name="slug" label="Slug">
                  <Input />
                </Form.Item>
              )}

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select placeholder="Select a category">
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Price"
                    rules={[{ required: true, message: "Please enter price" }]}
                  >
                    <Input type="number" suffix=" VND" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="originalPrice"
                    label="Original price"
                    rules={[
                      {
                        required: true,
                        message: "Please enter original price",
                      },
                    ]}
                  >
                    <Input type="number" suffix=" VND" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="out_of_stock">Out of Stock</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="isFeatured" label="Featured Status">
                    <Select>
                      <Option value={true}>Featured</Option>
                      <Option value={false}>Not Featured</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isNew" label="New Product">
                    <Select>
                      <Option value={true}>New</Option>
                      <Option value={false}>Not New</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isBestseller" label="Bestseller Status">
                    <Select>
                      <Option value={true}>Bestseller</Option>
                      <Option value={false}>Not Bestseller</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </TabPane>

          <TabPane tab="Images" key="2">
            <div className="mb-8">
              <Title level={5}>Cover Image</Title>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                customRequest={customUploadCover}
                maxCount={1}
                disabled={modalType === "view" || loading}
                onRemove={() => {
                  setCoverImageURL("");
                  return true;
                }}
              >
                {fileList.length < 1 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </div>

            <div>
              <Title level={5}>Additional Images (Up to 4)</Title>
              <Upload
                listType="picture-card"
                fileList={additionalImages}
                onChange={({ fileList }) => setAdditionalImages(fileList)}
                customRequest={customUploadAdditional}
                maxCount={4}
                multiple
                disabled={modalType === "view"}
                onRemove={handleRemoveAdditionalImage}
              >
                {additionalImages.length < 4 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </div>
          </TabPane>

          <TabPane tab="Variants" key="3">
            <div className="mb-4">
              <Title level={5}>Product Variants</Title>
              <Table
                columns={variantColumns}
                dataSource={productVariants}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            {modalType !== "view" && (
              <div className="mt-4 pt-4 border-t">
                <Title level={5}>Add New Variant</Title>
                <Form form={variantForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name="size"
                        label="Size"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select size">
                          <Option value="S">S</Option>
                          <Option value="M">M</Option>
                          <Option value="L">L</Option>
                          <Option value="XL">XL</Option>
                          <Option value="XXL">XXL</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="colorName"
                        label="Color Name"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="colorHex"
                        label="Color Hex"
                        rules={[{ required: true }]}
                      >
                        <Input type="color" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name="price"
                        label="Price"
                        rules={[{ required: true }]}
                      >
                        <Input type="number" suffix=" VND" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="originalPrice" label="Original Price">
                        <Input type="number" suffix=" VND" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="quantity"
                        label="Quantity"
                        rules={[{ required: true }]}
                      >
                        <Input type="number" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" onClick={handleAddVariant}>
                    Add Variant
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

export default Products;
