const Category = require('../models/Category');

class CategoryService {
  static async getCategories() {
    return await Category.find();
  }

  static async createCategory(data) {
    return await Category.create(data);
  }
}

module.exports = CategoryService;
