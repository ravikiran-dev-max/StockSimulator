import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { validatePrice } from '../middleware/validationMiddleware.js';
import { buyStock, sellStock } from '../controllers/stockController.js';

// Import models so we can stub/mock them
import RemovedStock from '../models/RemovedStock.js';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';

describe('Trade Price and Quantity Validation Tests', () => {
  // Store original methods to restore them after tests
  let originalRemovedStockFindOne;
  let originalUserFindById;
  let originalPortfolioFindOne;
  let originalPortfolioCreate;
  let originalTransactionCreate;

  beforeEach(() => {
    originalRemovedStockFindOne = RemovedStock.findOne;
    originalUserFindById = User.findById;
    originalPortfolioFindOne = Portfolio.findOne;
    originalPortfolioCreate = Portfolio.create;
    originalTransactionCreate = Transaction.create;
  });

  afterEach(() => {
    RemovedStock.findOne = originalRemovedStockFindOne;
    User.findById = originalUserFindById;
    Portfolio.findOne = originalPortfolioFindOne;
    Portfolio.create = originalPortfolioCreate;
    Transaction.create = originalTransactionCreate;
  });

  // =========================================================================
  // Middleware Tests
  // =========================================================================
  describe('validatePrice Middleware', () => {
    test('passes valid positive numeric price', () => {
      const req = { body: { price: 125.75 } };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextCalled = false;
      let nextError = null;
      const next = (err) => {
        nextCalled = true;
        nextError = err;
      };

      validatePrice(req, res, next);

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(nextError, undefined);
      assert.strictEqual(req.body.price, 125.75);
      assert.strictEqual(statusSet, null);
    });

    test('accepts string prices that represent positive numbers', () => {
      const req = { body: { price: '99.99' } };
      const res = { status: () => {} };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      validatePrice(req, res, next);

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.body.price, 99.99);
    });

    test('rejects empty price values', () => {
      const req = { body: { price: '' } };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      validatePrice(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Price is required/);
    });

    test('rejects non-numeric price values', () => {
      const req = { body: { price: 'not-a-number' } };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      validatePrice(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Price must be a valid number/);
    });

    test('rejects zero price values', () => {
      const req = { body: { price: 0 } };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      validatePrice(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Price must be a positive number/);
    });

    test('rejects negative price values', () => {
      const req = { body: { price: -15.5 } };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      validatePrice(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Price must be a positive number/);
    });
  });

  // =========================================================================
  // Controller Tests
  // =========================================================================
  describe('buyStock Controller', () => {
    test('rejects invalid quantity', async () => {
      const req = {
        body: { symbol: 'AAPL', quantity: -5, price: 150.0 },
        user: { _id: 'mock-user-id' }
      };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      RemovedStock.findOne = async () => null; // Not blacklisted

      await buyStock(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Invalid quantity/);
    });

    test('rejects invalid price inside controller fallback', async () => {
      const req = {
        body: { symbol: 'AAPL', quantity: 10, price: -50 },
        user: { _id: 'mock-user-id' }
      };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      RemovedStock.findOne = async () => null;

      await buyStock(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Invalid price/);
    });

    test('succeeds for valid price and quantity', async () => {
      const req = {
        body: { symbol: 'AAPL', quantity: 10, price: 150.0 },
        user: { _id: 'mock-user-id' }
      };
      let statusSet = null;
      let jsonResult = null;
      const res = {
        status: (code) => {
          statusSet = code;
          return {
            json: (data) => { jsonResult = data; }
          };
        }
      };
      const next = (err) => {
        if (err) assert.fail('buyStock should not throw an error: ' + err.message);
      };

      // Mock DB calls
      RemovedStock.findOne = async () => null;
      User.findById = async () => ({
        balance: 2000,
        save: async () => {}
      });
      Portfolio.findOne = async () => null;
      Portfolio.create = async () => ({ symbol: 'AAPL', quantity: 10 });
      Transaction.create = async () => ({});

      await buyStock(req, res, next);

      assert.strictEqual(statusSet, 200);
      assert.strictEqual(jsonResult.message, 'Stock purchased successfully');
      assert.strictEqual(jsonResult.balance, 500); // 2000 - (10 * 150)
    });
  });

  describe('sellStock Controller', () => {
    test('rejects invalid quantity', async () => {
      const req = {
        body: { symbol: 'AAPL', quantity: 0, price: 150.0 },
        user: { _id: 'mock-user-id' }
      };
      let statusSet = null;
      const res = {
        status: (code) => { statusSet = code; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      RemovedStock.findOne = async () => null;

      await sellStock(req, res, next);

      assert.strictEqual(statusSet, 400);
      assert.match(nextError.message, /Invalid quantity/);
    });

    test('succeeds for valid sale', async () => {
      const req = {
        body: { symbol: 'AAPL', quantity: 5, price: 160.0 },
        user: { _id: 'mock-user-id' }
      };
      let statusSet = null;
      let jsonResult = null;
      const res = {
        status: (code) => {
          statusSet = code;
          return {
            json: (data) => { jsonResult = data; }
          };
        }
      };
      const next = (err) => {
        if (err) assert.fail('sellStock should not fail: ' + err.message);
      };

      RemovedStock.findOne = async () => null;
      Portfolio.findOne = async () => ({
        _id: 'mock-portfolio-id',
        quantity: 10,
        save: async () => {}
      });
      User.findById = async () => ({
        balance: 500,
        save: async () => {}
      });
      Transaction.create = async () => ({});

      await sellStock(req, res, next);

      assert.strictEqual(statusSet, 200);
      assert.strictEqual(jsonResult.message, 'Stock sold successfully');
      assert.strictEqual(jsonResult.balance, 1300); // 500 + (5 * 160)
    });
  });
});
