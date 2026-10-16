# StockWise Backend API
<img width="1920" height="1095" alt="screencapture-stockwise-tan-five-vercel-app-2026-10-17-02_20_22" src="https://github.com/user-attachments/assets/7d014935-80a2-493d-9490-c71c0619b335" />

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Runtime-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-REST%20API-000000?logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/TypeScript-Type%20Safety-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-ODM-880000?logo=mongoose&logoColor=white" alt="Mongoose" />
</p>

<p align="center">
  RESTful backend API for StockWise — an AI-assisted inventory management application.
</p>

<p align="center">
  <a href="https://stockwise-tan-five.vercel.app/">Live Frontend</a> •
  <a href="https://stockwise-server.vercel.app/api">Deployed API</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a>
</p>

---

## 📖 Overview

StockWise Backend provides the server-side functionality for a smart inventory management application designed for small shops and businesses.

It is responsible for handling API requests, managing product data, applying inventory business rules, persisting stock movements, calculating inventory summaries, and integrating AI-assisted inventory analysis.

The backend is designed around reliable stock calculations, validated requests, consistent data handling, and a clear separation between inventory operations and AI recommendations.

## ✨ Core Capabilities

- RESTful API development with Express.js.
- Persistent inventory data using MongoDB and Mongoose.
- Product management and inventory operations.
- Stock IN, OUT, and physical-count adjustment workflows.
- Stock movement history and inventory summaries.
- Low-stock detection based on configurable thresholds.
- AI-assisted inventory insights using the Gemini API.
- Request validation and centralized error handling.
- Authentication and resource ownership enforcement where configured.
- Modular, maintainable TypeScript code.

> The list describes the intended backend capabilities. Verify the current implementation before treating every item as production-ready.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | HTTP server and REST API routing |
| TypeScript | Static typing and maintainability |
| MongoDB | Persistent document storage |
| Mongoose | Database models, schemas, and queries |
| Google Gemini API | AI-generated inventory insights |
| Zod or equivalent | Request validation, if configured |
| Jest or Vitest | Automated testing, if configured |
| Supertest | HTTP API testing, if configured |
| Vercel | Deployment platform |

## 🌐 Deployment

**Base URL**

```text
https://stockwise-server.vercel.app/api
```

**Frontend**

[https://stockwise-tan-five.vercel.app/](https://stockwise-tan-five.vercel.app/)

The deployed API base URL does not guarantee that every route is publicly accessible or that every endpoint is implemented. Verify individual routes against the current codebase.

## 🏗️ Architecture

The backend follows a client-server architecture:

```text
Next.js Frontend
       |
       | HTTP / JSON
       ▼
Express.js API
       |
       ├── Routes
       |
       ├── Authentication Middleware
       |
       ├── Request Validation
       |
       ├── Controllers
       |
       ├── Business Logic / Services
       |       |
       |       ├── Product Operations
       |       ├── Stock Calculations
       |       ├── Dashboard Summaries
       |       └── AI Insights
       |
       ▼
MongoDB + Mongoose
       |
       ▼
Persistent Inventory Data
```

### Architectural Principles

- Keep HTTP routing separate from business logic.
- Validate incoming requests before processing them.
- Perform authoritative stock calculations on the server.
- Keep AI integrations separate from inventory mutation logic.
- Return consistent API responses.
- Enforce authentication and ownership checks on protected resources.

## 📂 Suggested Project Structure

Adapt this example to the files that actually exist in your repository.

```text
stockwise-server/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── product.controller.ts
│   │   ├── stock-movement.controller.ts
│   │   ├── dashboard.controller.ts
│   │   └── ai.controller.ts
│   ├── middleware/
│   │   ├── require-auth.ts
│   │   ├── validate-request.ts
│   │   └── error-handler.ts
│   ├── models/
│   │   ├── product.model.ts
│   │   └── stock-movement.model.ts
│   ├── routes/
│   │   ├── product.routes.ts
│   │   ├── stock-movement.routes.ts
│   │   ├── dashboard.routes.ts
│   │   └── ai.routes.ts
│   ├── services/
│   │   ├── inventory.service.ts
│   │   └── ai-insights.service.ts
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- Node.js compatible with the project dependencies.
- npm.
- A MongoDB database, either local or MongoDB Atlas.
- A Gemini API key if AI insights are enabled.

### 1. Clone the Repository

```bash
git clone YOUR_BACKEND_REPOSITORY_URL
cd stockwise-server
```

Replace `YOUR_BACKEND_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend root directory.

Example `.env.example`:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/stockwise

FRONTEND_URL=http://localhost:3000

GEMINI_API_KEY=your_gemini_api_key
```

These variable names are examples. Match them to the environment variables referenced in the actual application code.

Never commit your real `.env` file or API keys to GitHub.

### 4. Start the Development Server

If your `package.json` defines a development script:

```bash
npm run dev
```

Otherwise, use the script already configured in your project.

The local API will typically run at:

```text
http://localhost:5000/api
```

### 5. Build for Production

If your project has a TypeScript build script:

```bash
npm run build
npm start
```

Confirm the available commands in `package.json` before running them.

## 🔌 API Reference

All routes below represent the intended API design. Keep only endpoints that exist in the current implementation and update the request fields to match your actual schemas.

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Retrieve products |
| POST | `/products` | Create a product |
| GET | `/products/:id` | Retrieve a product by ID |
| PATCH | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete or archive a product |

Example product payload:

```json
{
  "name": "Wireless Mouse",
  "sku": "WM-001",
  "category": "Electronics",
  "costPrice": 450,
  "sellingPrice": 650,
  "quantity": 25,
  "minStockLevel": 5
}
```

The backend should validate required fields, reject invalid numeric values, and enforce SKU uniqueness according to the chosen ownership model.

### Stock Movements

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stock-movements` | Retrieve stock movement history |
| GET | `/products/:id/stock-movements` | Retrieve a product's movements |
| POST | `/products/:id/stock-movements` | Record a stock movement |

Example stock IN payload:

```json
{
  "type": "IN",
  "quantity": 10,
  "note": "New stock received"
}
```

Example stock OUT payload:

```json
{
  "type": "OUT",
  "quantity": 3,
  "note": "Items removed from inventory"
}
```

Example adjustment payload:

```json
{
  "type": "ADJUSTMENT",
  "quantity": 20,
  "note": "Physical inventory count"
}
```

For this example, an adjustment sets the final quantity to `20`. Document this convention consistently in the implementation.

The client should not submit authoritative `previousQuantity` or `newQuantity` values. The backend must calculate them from the current database state.

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | Retrieve inventory metrics and low-stock information |

Intended summary metrics include:

- Total active products.
- Total units in stock.
- Number of low-stock products.
- Estimated inventory cost value.
- Recent stock movements.

### AI Inventory Insights

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/inventory-insights` | Generate inventory recommendations |

The backend should prepare relevant inventory data, call the configured AI provider, validate the response, and return recommendations without modifying product quantities.

## 🧠 Inventory Business Logic

### Stock IN

```text
newQuantity = previousQuantity + incomingQuantity
```

### Stock OUT

```text
newQuantity = previousQuantity - outgoingQuantity
```

The operation must be rejected if outgoing quantity exceeds available stock.

### Stock Adjustment

```text
newQuantity = actualCountedQuantity
```

The adjustment must not result in negative stock.

### Low-Stock Detection

```text
isLowStock = quantity <= minStockLevel
```

### Inventory Cost Value

```text
inventoryCostValue = Σ(quantity × costPrice)
```

These calculations should use validated database values and the authenticated user's inventory where user-specific ownership is enabled.

### Data Consistency

A successful stock operation should update the product quantity and create its corresponding movement record consistently. Use MongoDB transactions when supported by the deployment configuration; otherwise, implement a carefully designed consistency strategy.

## 🤖 AI Integration

The AI inventory assistant is intended to analyze relevant inventory data and generate recommendations for users.

### Input

- Product names and categories.
- Current quantities and minimum stock levels.
- Recent stock movements, when available.
- Historical sales or usage data, if implemented.

### Output

- A concise inventory summary.
- Products that may require attention.
- Explanations for recommendations.
- Suggested next steps.
- Relevant assumptions and data limitations.

### Safety and Reliability

- Keep the Gemini API key on the server.
- Validate input data before calling the AI service.
- Handle timeouts and provider errors gracefully.
- Validate generated output before returning it to the client.
- Never treat AI-generated quantities or recommendations as confirmed stock changes.
- Do not claim demand forecasting without suitable historical data.

AI failures must not affect persisted inventory data.

## 🔐 Security and Validation

The intended security controls include:

- Authentication for protected inventory operations.
- Server-side authorization and product ownership checks.
- Validation of route parameters, request bodies, and query parameters.
- Rejection of negative prices, invalid quantities, and invalid movement types.
- Prevention of stock OUT operations that exceed available stock.
- Server-side calculation of resulting quantities.
- Safe handling of database and AI provider errors.
- Protection of credentials and environment variables.
- Appropriate CORS configuration and request rate limits.

If authentication or ownership enforcement is not currently enabled in the deployed demo, do not consider the API secure for private multi-user inventory until those controls have been implemented and tested.

## 🧪 Testing

Critical business logic should have automated tests.

Recommended test cases:

- Creating a valid product succeeds.
- Invalid product fields are rejected.
- Duplicate SKUs are rejected according to the configured uniqueness rules.
- Stock IN increases quantity correctly.
- Stock OUT decreases quantity correctly.
- Insufficient stock prevents a stock OUT operation.
- Adjustments set the correct final quantity.
- Failed stock operations do not create movement records.
- Low-stock calculations return the expected results.
- AI service failures do not modify inventory.
- Ownership checks prevent cross-user access when authentication is enabled.

Suggested tools:

- Vitest or Jest for unit tests.
- Supertest for API integration tests.

Use the test commands defined by your `package.json`.

## ⚠️ Error Handling

Use meaningful HTTP status codes and consistent error responses.

| Status | Meaning |
|---|---|
| `400` | Invalid request |
| `401` | Authentication required |
| `403` | Authenticated but not authorized |
| `404` | Resource not found or inaccessible |
| `409` | Conflict, such as a duplicate SKU |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |
| `502` / `503` | AI provider failure or temporary service unavailability |

Example error response:

```json
{
  "success": false,
  "message": "Insufficient stock available"
}
```

Do not expose internal stack traces, database credentials, or API keys in production responses.

## 🚢 Deployment

The backend is deployed at:

[https://stockwise-server.vercel.app/api](https://stockwise-server.vercel.app/api)

Deployment checklist:

- Configure production environment variables.
- Verify MongoDB network access and credentials.
- Configure the correct frontend origin.
- Keep secrets out of source control.
- Check database indexes and validation rules.
- Verify API routes against the deployed application.
- Test stock operations and error handling in the deployed environment.
- Verify authentication and ownership protections before using private business data.

## 🗺️ Roadmap

- [ ] Verify and complete product CRUD.
- [ ] Validate stock IN, OUT, and adjustment workflows.
- [ ] Maintain consistent stock movement history.
- [ ] Complete dashboard aggregation.
- [ ] Validate AI recommendations and error handling.
- [ ] Add automated tests for critical inventory logic.
- [ ] Verify authentication and resource ownership.
- [ ] Document the exact environment variables and npm scripts.
- [ ] Improve logging and production error handling.

Update this roadmap as features are implemented and verified.

## 👨‍💻 Author

**Shariea Reza Nabil**

- GitHub: [@Nabil593](https://github.com/Nabil593)
- LinkedIn: [Shariea Reza Nabil](https://www.linkedin.com/in/shariea-reza-nabil/)
- Portfolio: [sharieanabil.vercel.app](https://sharieanabil.vercel.app/)

## 📄 License

Add a `LICENSE` file if you intend to distribute this project under an open-source license.

---

<p align="center">
  StockWise Backend — Reliable inventory operations with AI-assisted insights.
</p>
