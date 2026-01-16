# Testing Strategy

This project employs a **strategic unit testing approach** designed for high maintainability and maximum ROI. By focusing on critical business logic and pure functions, we ensure system reliability where it matters most while keeping the codebase lightweight.

## Quick Stats

- **Total Tests**: 60
- **Execution Time**: ~300ms
- **Coverage**: Core Logistics, Financials, Security
- **Dependencies**: 0 (Node.js Native Test Runner)

## Core Test Suites

### 1. Financial Logic (16 Tests)

Validates AI model cost calculations in `calculateCost()` and provider data grouping.

- ✅ Input/Output token pricing accuracy.
- ✅ Floating point precision handling.
- ✅ Model fallback mechanisms.

### 2. Security & Access Control (14 Tests)

Validates the RBAC (Role-Based Access Control) engine.

- ✅ Permission inheritance and validation.
- ✅ Strict role enforcement (Admin vs. Employee vs. Visitor).
- ✅ Configuration integrity.

### 3. RAG System Utilities (15 Tests)

Ensures the reliability of the AI knowledge base processing.

- ✅ Document chunking with intelligent overlap.
- ✅ Search result fusion (Reciprocal Rank Fusion).
- ✅ Keyword extraction & stop-word filtering.

### 4. Auth Utility Helpers (12 Tests)

Tests pure functions for data normalization.

- ✅ URL-safe slug generation.
- ✅ Edge-case handling for special characters and length.

---

## Engineering Trade-offs & Strategic Scope

A conscious decision was made to exclude certain layers from the automated test suite. This demonstrates a focus on **High-Value Testing**:

- **Integration Layers (DB/API)**: Intentionally excluded to avoid the overhead of mocking frameworks and test databases.
- **Frontend UI**: Focused on the API's logic layer rather than UI rendering to ensure a faster CI/CD pipeline and zero-dependency footprint.
- **Middleware**: Logic is tested via pure function helpers exported from middleware files.

**The result is a zero-dependency, lightning-fast test suite that protects the app's most critical financial and security operations.**

---

## Execution

```bash
cd backend
npm test
```
