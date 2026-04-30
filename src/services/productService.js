const Category = require('../models/Category');
const Product = require('../models/Product');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ProductService {
  static formatProduct(product) {
    const formattedProduct = product.toObject ? product.toObject() : { ...product };
    const categoryValue = formattedProduct.categoryId;

    if (categoryValue && typeof categoryValue === 'object' && categoryValue.name) {
      formattedProduct.categoryName = categoryValue.name;
    }

    return formattedProduct;
  }

  static async findCategoryByName(categoryName) {
    return await Category.findOne({
      name: { $regex: `^${escapeRegex(categoryName.trim())}$`, $options: 'i' }
    }).select('_id name');
  }

  static async getProducts(query) {
    let mongooseQuery;

    // Copy req.query
    const reqQuery = { ...query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'categoryName'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse back to JSON
    let parsedQuery = JSON.parse(queryStr);

    // Allow filtering products by category name instead of category id
    if (query.categoryName && query.categoryName.trim()) {
      const category = await this.findCategoryByName(query.categoryName);

      if (!category) {
        return {
          count: 0,
          pagination: {},
          data: []
        };
      }

      parsedQuery.categoryId = category._id;
    }

    // Search functionality using text index
    if (query.search) {
      parsedQuery.$text = { $search: query.search };
    }

    // Finding resource
    mongooseQuery = Product.find(parsedQuery);

    // Select Fields
    if (query.select) {
      const fields = query.select.split(',').join(' ');
      mongooseQuery = mongooseQuery.select(fields);
    }

    // Sort
    if (query.sort) {
      const sortBy = query.sort.split(',').join(' ');
      mongooseQuery = mongooseQuery.sort(sortBy);
    } else {
      mongooseQuery = mongooseQuery.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(parsedQuery);

    mongooseQuery = mongooseQuery.skip(startIndex).limit(limit).populate('categoryId', 'name');

    // Executing query
    const results = await mongooseQuery;
    const formattedResults = results.map(product => this.formatProduct(product));

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    return {
      count: formattedResults.length,
      pagination,
      data: formattedResults
    };
  }

  static async getProductById(id) {
    const product = await Product.findById(id).populate('categoryId', 'name');
    if (!product) {
      const error = new Error(`Resource not found with id of ${id}`);
      error.statusCode = 404;
      throw error;
    }
    return this.formatProduct(product);
  }

  static async createProduct(productData) {
    const { categoryName, ...rest } = productData;
    let categoryId = rest.categoryId;

    if (categoryName && categoryName.trim()) {
      const category = await this.findCategoryByName(categoryName);

      if (!category) {
        const error = new Error(`Category ${categoryName} not found`);
        error.statusCode = 404;
        throw error;
      }

      categoryId = category._id;
    }

    const product = await Product.create({
      ...rest,
      categoryId
    });

    await product.populate('categoryId', 'name');

    return this.formatProduct(product);
  }
}

module.exports = ProductService;
