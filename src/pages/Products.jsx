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

const { Title } = Typography;
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

  // Helper function to validate image URLs
  const isValidImageUrl = (url) => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://");
  };

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
      console.log("API response data:", data);

      const formattedProducts = data.products.map((product) => ({
        ...product,
        key: product.id, // Add key for better table performance
        categoryId: product.categoryId,
        isBestseller: product.isBestseller,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        cover: product.cover,
        images: product.images || [],
        productVariants: product.productVariants || [],
      }));

      console.log("Formatted products:", formattedProducts);
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
      console.log("Showing modal for product:", product);

      form.setFieldsValue({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        status: product.status,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        isBestseller: product.isBestseller,
        categoryId: product.categoryId,
      });

      // Format cover image for upload component
      if (isValidImageUrl(product.cover)) {
        console.log("Setting cover image:", product.cover);
        setFileList([
          {
            uid: "-1",
            name: "cover-image.avif",
            status: "done",
            url: product.cover,
          },
        ]);
        setCoverImageURL(product.cover);
      } else {
        setFileList([]);
        setCoverImageURL("");
      }

      // Format additional images for upload component
      if (product.images && product.images.length > 0) {
        console.log("Setting additional images:", product.images);
        const formattedImages = product.images.map((image, index) => ({
          uid: `additional-${index}`,
          name: `image-${index}.avif`,
          status: "done",
          url: image,
        }));
        setAdditionalImages(formattedImages);
        setAdditionalImageURLs(product.images);
      } else {
        setAdditionalImages([]);
        setAdditionalImageURLs([]);
      }

      // Set product variants
      if (product.productVariants && product.productVariants.length > 0) {
        setProductVariants(product.productVariants);
      } else {
        setProductVariants([]);
      }
    } else {
      // Reset form for "add" mode
      form.resetFields();
      setFileList([]);
      setAdditionalImages([]);
      setProductVariants([]);
      setCoverImageURL("");
      setAdditionalImageURLs([]);
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
      console.log("Cover image uploaded successfully:", imageUrl);
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
      console.log("Additional image uploaded successfully:", imageUrl);
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

  // Handler for removing cover image
  const handleRemoveCoverImage = () => {
    setCoverImageURL("");
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
            cover: coverImageURL || "", // Provide fallback empty string
            images: additionalImageURLs || [], // Provide fallback empty array
            productVariants: formattedVariants,
          };

          console.log("Submitting product data:", productData);

          // Send the data to your API
          if (modalType === "add") {
            await apiClient.post("/api/products", productData);
            message.success("Product added successfully!");
          } else if (modalType === "edit") {
            await apiClient.put(`/api/products`, productData);
            message.success("Product updated successfully!");
          }

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
    try {
      await apiClient.delete(`/api/products/${id}`);
      message.success("Product deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      message.error("Failed to delete product");
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // You could implement actual search here if needed
  };

  const handleAddVariant = () => {
    variantForm
      .validateFields()
      .then((values) => {
        // Create variant with properly formatted field names
        const newVariant = {
          id: null, // Will be assigned by backend
          size: values.size,
          colorName: values.colorName,
          colorHex: values.colorHex,
          price: parseFloat(values.price),
          originalPrice: parseFloat(values.originalPrice || 0),
          quantity: parseInt(values.quantity),
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
      render: (cover, record) => {
        console.log(`Rendering image for ${record.name}, URL: ${cover}`);
        return (
          <Image
            src={
              isValidImageUrl(cover)
                ? cover
                : "https://via.placeholder.com/50x50?text=No+Image"
            }
            width={50}
            height={50}
            alt={record.name}
            fallback="https://via.placeholder.com/50x50?text=Error"
            preview={false}
            onError={(e) => {
              console.error("Image failed to load:", cover);
            }}
          />
        );
      },
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
      render: (text) => `${text.toLocaleString()} VND`,
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
      render: (text) => `${text.toLocaleString()} VND`,
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
        open={visible}
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
            {/* Cover Image Section */}
            <div className="mb-8">
              <Title level={5}>Cover Image</Title>
              <div className="mb-4 flex flex-col items-start justify-start gap-y-0">
                {coverImageURL ? (
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                    }}
                  >
                    <Image
                      src={coverImageURL}
                      alt="Product cover"
                      style={{ maxWidth: "100%", maxHeight: 200 }}
                      fallback="https://via.placeholder.com/200x200?text=No+Image"
                    />
                    {modalType !== "view" && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        style={{ position: "absolute", top: 0, right: 0 }}
                        onClick={handleRemoveCoverImage}
                        disabled={loading}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      color: "#999",
                      textAlign: "center",
                      padding: "20px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    No cover image
                  </div>
                )}

                {modalType !== "view" && (
                  <Upload
                    customRequest={customUploadCover}
                    showUploadList={false}
                    disabled={loading}
                    accept="image/*"
                  >
                    <Button
                      icon={<PlusOutlined />}
                      style={{ marginTop: 8 }}
                      disabled={loading}
                    >
                      {coverImageURL
                        ? "Change Cover Image"
                        : "Upload Cover Image"}
                    </Button>
                  </Upload>
                )}
              </div>
            </div>

            {/* Additional Images Section */}
            <div>
              <Title level={5}>Additional Images (Up to 4)</Title>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {additionalImageURLs.length > 0 ? (
                    additionalImageURLs.map((image, index) => (
                      <div
                        key={index}
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <Image
                          src={image}
                          alt={`Product image ${index + 1}`}
                          style={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                          }}
                          fallback="https://via.placeholder.com/120x120?text=Error"
                        />
                        {modalType !== "view" && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            style={{ position: "absolute", top: 0, right: 0 }}
                            onClick={() => {
                              const newUrls = [...additionalImageURLs];
                              newUrls.splice(index, 1);
                              setAdditionalImageURLs(newUrls);
                              setAdditionalImages((prev) => {
                                const newImages = [...prev];
                                newImages.splice(index, 1);
                                return newImages;
                              });
                            }}
                            disabled={loading}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        color: "#999",
                        textAlign: "center",
                        width: "100%",
                        padding: "20px",
                        border: "1px dashed #d9d9d9",
                        borderRadius: "4px",
                      }}
                    >
                      No additional images
                    </div>
                  )}
                </div>

                {modalType !== "view" && additionalImageURLs.length < 4 && (
                  <Upload
                    customRequest={customUploadAdditional}
                    showUploadList={false}
                    disabled={loading}
                    accept="image/*"
                  >
                    <Button icon={<PlusOutlined />} disabled={loading}>
                      Add Image
                    </Button>
                  </Upload>
                )}
              </div>
            </div>
          </TabPane>

          <TabPane tab="Variants" key="3">
            <div className="mb-4">
              <Title level={5}>Product Variants</Title>
              <Table
                columns={variantColumns}
                dataSource={productVariants}
                rowKey={(record) => record.id || Math.random().toString()}
                pagination={false}
                size="small"
                locale={{ emptyText: "No variants for this product" }}
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
                        rules={[
                          { required: true, message: "Please select size" },
                        ]}
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
                        rules={[
                          {
                            required: true,
                            message: "Please enter color name",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="colorHex"
                        label="Color Hex"
                        rules={[
                          { required: true, message: "Please select color" },
                        ]}
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
                        rules={[
                          { required: true, message: "Please enter price" },
                        ]}
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
                        rules={[
                          { required: true, message: "Please enter quantity" },
                        ]}
                      >
                        <Input type="number" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    onClick={handleAddVariant}
                    disabled={loading}
                  >
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
