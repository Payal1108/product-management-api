# Product Management API

A professional, lightweight RESTful API for managing a product catalogue. This service provides complete CRUD operations for products, featuring advanced filtering, search capabilities, and a soft-archive mechanism to ensure data integrity while allowing for product removal from the active catalogue.

## Prerequisites

To run this project, you will need the following installed:
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd product-management-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Start the server using the following command:
```bash
npm start
```
The server will start by default on **port 3000**.

## Running Tests

The project uses the native Node.js test runner.

- **Run all tests**:
  ```bash
  npm test
  ```

- **Run tests with coverage report**:
  ```bash
  npm run test:coverage
  ```

## API Endpoints

All API responses are wrapped in a standard envelope: `{ "success": boolean, "data": any, "error": string | null }`.

| Method | Path | Description | Example curl |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | List all active products | `curl http://localhost:3000/products` |
| `GET` | `/products/:id` | Get product by UUID | `curl http://localhost:3000/products/uuid-here` |
| `POST` | `/products` | Create a new product | `curl -X POST -H "Content-Type: application/json" -d '{"name":"Gaming Mouse","sku":"GM-101","price":59.99,"stock":25,"category":"electronics"}' http://localhost:3000/products` |
| `PATCH` | `/products/:id` | Partially update a product | `curl -X PATCH -H "Content-Type: application/json" -d '{"price":49.99}' http://localhost:3000/products/uuid-here` |
| `DELETE` | `/products/:id` | Soft-archive a product | `curl -X DELETE http://localhost:3000/products/uuid-here` |
| `DELETE` | `/products/:id/restore` | Restore an archived product | `curl -X DELETE http://localhost:3000/products/uuid-here/restore` |

## Query Parameters (`GET /products`)

| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `category` | `string` | Filter by product category | `?category=electronics` |
| `status` | `string` | Filter by status (active, inactive, discontinued) | `?status=active` |
| `minPrice` | `number` | Minimum inclusive price | `?minPrice=10.00` |
| `maxPrice` | `number` | Maximum inclusive price | `?maxPrice=100.00` |
| `inStock` | `boolean` | `true` for products with stock > 0 | `?inStock=true` |
| `search` | `string` | Search term for name or description | `?search=wireless` |

## Product Schema

All API responses wrap the product data in a standard envelope: `{ "success": boolean, "data": Product | Product[], "error": string | null }`.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes (Read-only) | Unique identifier for the product |
| `name` | `string` | Yes | Human-readable name of the product |
| `sku` | `string` | Yes | Unique Stock Keeping Unit identifier |
| `description` | `string` | No | Detailed product description |
| `category` | `string` | No | Product category (e.g., electronics, clothing) |
| `price` | `number` | Yes | Unit price (must be positive) |
| `stock` | `integer` | Yes | Current quantity in stock |
| `status` | `string` | No | Current status (active, inactive, discontinued) |
| `createdAt` | `Date` | Yes (Read-only) | Timestamp of creation |
| `archivedAt` | `Date` | No | Timestamp of soft-deletion (null if active) |

## Project Structure

```text
product-management-api/
├── src/
│   ├── controllers/      # Express route handlers
│   ├── middleware/       # Validation and error handlers
│   ├── models/           # Data logic and in-memory store
│   ├── routes/           # API route definitions
│   ├── validators/       # Input validation schemas
│   └── app.js            # Express application setup
├── tests/                # Unit and integration tests
├── package.json          # Dependencies and scripts
└── README.md             # Project documentation
```

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port the server listens on | `3000` |
| `NODE_ENV` | Environment mode (development, production, test) | `development` |

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. Ensure that all new features include corresponding unit and integration tests.

## License

This project is licensed under the [MIT License](LICENSE).
