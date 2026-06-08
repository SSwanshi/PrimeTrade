const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PrimeTrade API',
    version: '1.0.0',
    description:
      'REST API for PrimeTrade — user authentication, portfolio management, asset trading, and admin operations.\n\n' +
      '**Swagger test accounts** (password for both: `password123`):\n' +
      '- **USER:** `user@primetrade.com`\n' +
      '- **ADMIN:** `admin@primetrade.com`\n\n' +
      'On login, pick **role** from the dropdown — credentials auto-fill and the JWT is applied automatically after a successful login.',
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Registration and login' },
    { name: 'Portfolio', description: 'User portfolio balance' },
    { name: 'Assets', description: 'Tradable assets' },
    { name: 'Orders', description: 'Buy/sell orders and order management' },
    { name: 'Users', description: 'Admin user management' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT from POST /api/auth/login. Swagger auto-applies it after a successful login — ' +
          'do not paste "Bearer", only the raw token if entering manually.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid credentials' },
        },
      },
      SuccessMessage: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Order created and filled' },
        },
      },
      Role: {
        type: 'string',
        enum: ['USER', 'ADMIN'],
      },
      OrderSide: {
        type: 'string',
        enum: ['BUY', 'SELL'],
      },
      OrderStatus: {
        type: 'string',
        enum: ['PENDING', 'FILLED', 'CANCELLED'],
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'trader@example.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
          name: { type: 'string', example: 'Jane Trader' },
          role: {
            allOf: [{ $ref: '#/components/schemas/Role' }],
            default: 'USER',
            description: 'USER = trading dashboard, ADMIN = admin panel',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          role: {
            type: 'string',
            enum: ['USER', 'ADMIN'],
            default: 'USER',
            description: 'Account type — use the dropdown to switch between User and Admin demo accounts',
          },
          email: {
            type: 'string',
            format: 'email',
            default: 'user@primetrade.com',
            description: 'Demo: user@primetrade.com (USER) or admin@primetrade.com (ADMIN)',
          },
          password: {
            type: 'string',
            format: 'password',
            default: 'password123',
          },
        },
        example: {
          role: 'USER',
          email: 'user@primetrade.com',
          password: 'password123',
        },
      },
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
      UserWithCreatedAt: {
        allOf: [
          { $ref: '#/components/schemas/UserPublic' },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/UserPublic' },
        },
      },
      Portfolio: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          balance: { type: 'number', format: 'float', example: 10000 },
        },
      },
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          symbol: { type: 'string', example: 'BTC' },
          name: { type: 'string', example: 'Bitcoin' },
          price: { type: 'number', format: 'float', example: 105000 },
          type: { type: 'string', example: 'CRYPTO' },
        },
      },
      CreateAssetRequest: {
        type: 'object',
        required: ['symbol', 'name', 'price', 'type'],
        properties: {
          symbol: { type: 'string', example: 'AAPL' },
          name: { type: 'string', example: 'Apple Inc.' },
          price: { type: 'number', format: 'float', example: 175.5 },
          type: { type: 'string', example: 'Stock' },
        },
      },
      UpdateAssetRequest: {
        type: 'object',
        required: ['price'],
        properties: {
          price: { type: 'number', format: 'float', example: 180.25 },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['assetId', 'side', 'quantity'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          side: { $ref: '#/components/schemas/OrderSide' },
          quantity: { type: 'number', format: 'float', example: 1, minimum: 0.01 },
        },
      },
      UpdateOrderRequest: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'number', format: 'float', example: 2, minimum: 0.01 },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          assetId: { type: 'string', format: 'uuid' },
          side: { $ref: '#/components/schemas/OrderSide' },
          quantity: { type: 'number', format: 'float' },
          price: { type: 'number', format: 'float' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          createdAt: { type: 'string', format: 'date-time' },
          asset: { $ref: '#/components/schemas/Asset' },
          user: { $ref: '#/components/schemas/UserPublic' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Updated Name' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a user account with an initial portfolio balance of $10,000.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
              examples: {
                user: {
                  summary: 'User (Trader)',
                  description: 'Register a regular trader account',
                  value: {
                    email: 'newuser@primetrade.com',
                    password: 'password123',
                    name: 'New Trader',
                    role: 'USER',
                  },
                },
                admin: {
                  summary: 'Administrator',
                  description: 'Register an admin account',
                  value: {
                    email: 'newadmin@primetrade.com',
                    password: 'password123',
                    name: 'New Admin',
                    role: 'ADMIN',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
          '400': {
            description: 'User already exists or invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        description:
          'Fill **role** (USER or ADMIN) for respective user type, then execute. ' ,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/portfolio': {
      get: {
        tags: ['Portfolio'],
        summary: 'Get current user portfolio',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Portfolio balance for the authenticated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Portfolio' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Token expired or invalid' },
        },
      },
    },
    '/api/assets': {
      get: {
        tags: ['Assets'],
        summary: 'List all tradable assets',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of assets',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Asset' },
                },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Token expired or invalid' },
        },
      },
      post: {
        tags: ['Assets'],
        summary: 'Create a new asset (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAssetRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Asset created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Asset' },
              },
            },
          },
          '400': {
            description: 'Could not create asset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/assets/{id}': {
      put: {
        tags: ['Assets'],
        summary: 'Update asset price (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAssetRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Asset updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Asset' },
              },
            },
          },
          '400': {
            description: 'Asset not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
      delete: {
        tags: ['Assets'],
        summary: 'Delete an asset (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Asset deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true } },
                },
              },
            },
          },
          '400': {
            description: 'Asset not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place a buy or sell order',
        description:
          'Orders are filled immediately at the current asset price. BUY deducts from portfolio balance; SELL credits balance if the user owns enough shares.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order created and filled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessMessage' },
              },
            },
          },
          '400': {
            description: 'Insufficient funds, not enough assets, or invalid side',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '404': {
            description: 'Asset not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'List all orders (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'All orders with asset and user details',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' },
                },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/orders/my-orders': {
      get: {
        tags: ['Orders'],
        summary: 'Get current user orders',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Orders for the authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' },
                },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Token expired or invalid' },
        },
      },
    },
    '/api/orders/{id}': {
      put: {
        tags: ['Orders'],
        summary: 'Update order quantity',
        description:
          'Adjusts the quantity on an owned order and updates portfolio balance accordingly.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrderRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order updated',
            content: {
              'application/json': {
                oneOf: [
                  { $ref: '#/components/schemas/Order' },
                  { $ref: '#/components/schemas/SuccessMessage' },
                ],
              },
            },
          },
          '400': {
            description: 'Update failed or insufficient funds/assets',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': {
            description: 'Not authorized to update this order',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Orders'],
        summary: 'Cancel/delete an order',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Order deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true } },
                },
              },
            },
          },
          '400': {
            description: 'Order delete failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserWithCreatedAt' },
                },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/users/{id}': {
      put: {
        tags: ['Users'],
        summary: 'Update a user (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
          '400': {
            description: 'User update failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user (admin only)',
        description: 'Deletes the user along with their portfolio and orders.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'User deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true } },
                },
              },
            },
          },
          '400': {
            description: 'User delete failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid token' },
          '403': { description: 'Admin access required' },
        },
      },
    },
  },
};

export default swaggerDocument;
