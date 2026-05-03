const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🍔 Food Ordering API',
      version: '1.0.0',
      description: 'Complete REST API for the Food Ordering mobile application. Use **POST /api/v1/auth/login** to get a token, then click **Authorize** and paste it as `Bearer <token>`.',
    },
    servers: [
      { url: process.env.PUBLIC_URL || '/', description: 'Current Environment' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            image: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            categoryId: { type: 'object' },
            categoryName: { type: 'string' },
            image: { type: 'string' },
            isAvailable: { type: 'boolean' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            cartItemId: { type: 'string' },
            productId: { type: 'string' },
            product: { $ref: '#/components/schemas/Product' },
            quantity: { type: 'integer', minimum: 1 },
            totalPrice: { type: 'number' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            cartId: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            subtotalPrice: { type: 'number' },
            discountAmount: { type: 'number' },
            finalTotal: { type: 'number' },
            appliedCoupon: { type: 'object', nullable: true },
            deliveryAddress: { type: 'object', nullable: true },
            note: { type: 'string', nullable: true }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            name: { type: 'string' },
            image: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            pricing: {
              type: 'object',
              properties: {
                subtotal: { type: 'number' },
                discount: { type: 'number' },
                total: { type: 'number' }
              }
            },
            coupon: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                discount: { type: 'number' }
              }
            },
            status: {
              type: 'object',
              properties: {
                code: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'] },
                label: { type: 'string' }
              }
            },
            delivery: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                location: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } },
                driver: { type: 'object', nullable: true, properties: { name: { type: 'string' }, phone: { type: 'string' } } }
              }
            },
            payment: {
              type: 'object',
              properties: { method: { type: 'string', enum: ['cash'] } }
            },
            note: { type: 'string', nullable: true },
            timeline: { type: 'array', items: { type: 'object', properties: { status: { type: 'string' }, at: { type: 'string', format: 'date-time' } } } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Coupon: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            discountType: { type: 'string', enum: ['percentage', 'fixed'] },
            value: { type: 'number' },
            expiresAt: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Register, login, get current user' },
      { name: 'Categories', description: 'Browse food categories' },
      { name: 'Products', description: 'Browse and search products' },
      { name: 'Cart', description: 'Manage shopping cart' },
      { name: 'Orders', description: 'Place and track orders' },
      { name: 'Coupons', description: 'Apply discount coupons' },
      { name: 'Admin', description: 'Admin-only operations (role: admin required)' }
    ],
    paths: {
      // ─── AUTH ────────────────────────────────────────────────────────
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'phone'],
                  properties: {
                    name: { type: 'string', example: 'Ahmed Mohamed' },
                    email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' },
                    phone: { type: 'string', example: '01012345678' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Validation error or email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone', 'password'],
                  properties: {
                    phone: { type: 'string', format: 'phone', example: '01012345678' },
                    password: { type: 'string', example: 'password123' },
                    fcmToken: { type: 'string', example: 'device_fcm_token_here', description: 'Optional — mobile FCM token for push notifications' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Current user data', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { description: 'Not authorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
          }
        }
      },

      // ─── CATEGORIES ──────────────────────────────────────────────────
      '/api/v1/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Get all categories (public)',
          responses: {
            200: { description: 'List of categories', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, data: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } } } }
          }
        },
        post: {
          tags: ['Admin', 'Categories'],
          summary: 'Create a category (admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Burgers' },
                    image: { type: 'string', example: 'https://example.com/burgers.jpg' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Category created' },
            403: { description: 'Admin only' }
          }
        }
      },

      // ─── PRODUCTS ────────────────────────────────────────────────────
      '/api/v1/products': {
        get: {
          tags: ['Products'],
          summary: 'Get all products — supports search, filter, sort & pagination (public)',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Full-text search on name and description', example: 'chicken' },
            { name: 'categoryName', in: 'query', schema: { type: 'string' }, description: 'Filter by category name (case-insensitive)', example: 'Burgers' },
            { name: 'isAvailable', in: 'query', schema: { type: 'boolean' }, description: 'Filter by availability' },
            { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Sort field(s), comma-separated. Prefix with - for descending.', example: '-price' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: {
              description: 'Paginated product list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      count: { type: 'integer' },
                      pagination: { type: 'object' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Product' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get a single product by ID (public)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '664f1a2b3c4d5e6f7a8b9c0d' }],
          responses: {
            200: { description: 'Product details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Product' } } } } } },
            404: { description: 'Product not found' }
          }
        }
      },

      // ─── CART ────────────────────────────────────────────────────────
      '/api/v1/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Get current user cart',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Cart contents', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Cart' } } } } } }
          }
        }
      },
      '/api/v1/cart/add': {
        post: {
          tags: ['Cart'],
          summary: 'Add item to cart (also sets delivery address, note, coupon)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId'],
                  properties: {
                    productId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
                    quantity: { type: 'integer', minimum: 1, default: 1, example: 2 },
                    couponCode: { type: 'string', example: 'SAVE10', description: 'Apply a coupon for discount preview' },
                    deliveryAddress: {
                      type: 'object',
                      description: 'Delivery address (required before placing order)',
                      properties: {
                        address: { type: 'string', example: '15 Tahrir Square, Cairo' },
                        lat: { type: 'number', example: 30.0444 },
                        lng: { type: 'number', example: 31.2357 }
                      }
                    },
                    note: { type: 'string', example: 'No spicy sauce please' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Updated cart', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Cart' } } } } } },
            404: { description: 'Product not found or unavailable' }
          }
        }
      },
      '/api/v1/cart/item': {
        delete: {
          tags: ['Cart'],
          summary: 'Remove item from cart (by productId or itemId in request body)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  description: 'Provide either productId or itemId',
                  properties: {
                    productId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
                    itemId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0e' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Updated cart after item removal' },
            404: { description: 'Cart or item not found' }
          }
        }
      },
      '/api/v1/cart/item/{itemId}': {
        delete: {
          tags: ['Cart'],
          summary: 'Remove item from cart by itemId path param',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Updated cart' },
            404: { description: 'Item not found' }
          }
        }
      },

      // ─── ORDERS ──────────────────────────────────────────────────────
      '/api/v1/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Place an order from the current cart',
          description: '**Prerequisites:** Cart must have items AND a delivery address (with lat/lng). Coupon stored in cart is automatically applied.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    paymentMethod: { type: 'string', enum: ['cash'], default: 'cash', example: 'cash' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Order created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Order' } } } } } },
            400: { description: 'Cart is empty or missing delivery address' }
          }
        }
      },
      '/api/v1/orders/my': {
        get: {
          tags: ['Orders'],
          summary: 'Get all orders for the current user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: { description: 'Paginated order history', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, pagination: { type: 'object' }, data: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } } } }
          }
        }
      },
      '/api/v1/orders/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Get a single order by ID (owner or admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Order details' },
            403: { description: 'Not authorized' },
            404: { description: 'Order not found' }
          }
        }
      },

      // ─── COUPONS ─────────────────────────────────────────────────────
      '/api/v1/coupons/apply': {
        post: {
          tags: ['Coupons'],
          summary: 'Validate a coupon code and calculate discount',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'cartTotal'],
                  properties: {
                    code: { type: 'string', example: 'SAVE10' },
                    cartTotal: { type: 'number', example: 150.00 }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Coupon is valid — returns discountAmount and finalTotal' },
            400: { description: 'Invalid or expired coupon' }
          }
        }
      },
      '/api/v1/coupons': {
        post: {
          tags: ['Admin', 'Coupons'],
          summary: 'Create a new coupon (admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'discountType', 'value', 'expiresAt'],
                  properties: {
                    code: { type: 'string', example: 'SAVE10' },
                    discountType: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
                    value: { type: 'number', example: 10 },
                    expiresAt: { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59Z' },
                    isActive: { type: 'boolean', default: true }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Coupon created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Coupon' } } } } } },
            403: { description: 'Admin only' }
          }
        }
      },

      // ─── ADMIN ───────────────────────────────────────────────────────
      '/api/v1/admin/orders': {
        get: {
          tags: ['Admin'],
          summary: 'Get ALL orders in the system with pagination (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: { description: 'Paginated all orders', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, pagination: { type: 'object' }, data: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } } } },
            403: { description: 'Admin only' }
          }
        }
      },
      '/api/v1/admin/orders/{id}/status': {
        patch: {
          tags: ['Admin'],
          summary: 'Update order status — triggers FCM push notification to user',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
                      example: 'OUT_FOR_DELIVERY'
                    },
                    driverName: { type: 'string', example: 'Ahmed' },
                    driverPhone: { type: 'string', example: '01012345678' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Order updated with new status' },
            404: { description: 'Order not found' }
          }
        }
      },
      '/api/v1/admin/products': {
        post: {
          tags: ['Admin'],
          summary: 'Create a product (admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'description', 'price'],
                  properties: {
                    name: { type: 'string', example: 'Classic Burger' },
                    description: { type: 'string', example: 'Juicy beef patty with lettuce and tomato' },
                    price: { type: 'number', example: 89.99 },
                    categoryId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d', description: 'Provide categoryId OR categoryName' },
                    categoryName: { type: 'string', example: 'Burgers', description: 'Provide categoryName OR categoryId' },
                    image: { type: 'string', example: 'https://example.com/burger.jpg' },
                    isAvailable: { type: 'boolean', default: true }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Product created' },
            403: { description: 'Admin only' }
          }
        }
      },
      '/api/v1/admin/products/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Delete a product (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Product deleted' },
            404: { description: 'Product not found' }
          }
        }
      }
    }
  },
  apis: [] // spec is defined inline above
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
