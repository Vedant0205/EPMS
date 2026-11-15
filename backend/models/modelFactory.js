const mongoose = require('mongoose');
const { isConnected } = require('../config/db');
const { getStore } = require('../config/storeEngine');

function createModel(name, schemaDefinition, options = {}) {
  let MongooseModel;
  try {
    if (mongoose.models[name]) {
      MongooseModel = mongoose.models[name];
    } else {
      const schema = new mongoose.Schema(schemaDefinition, {
        timestamps: true,
        ...options,
      });
      MongooseModel = mongoose.model(name, schema);
    }
  } catch (err) {
    console.error(`Error initializing mongoose model for ${name}:`, err.message);
  }

  const store = getStore(name);

  // Return a wrapper that delegates dynamically
  return {
    get mongooseModel() {
      return MongooseModel;
    },
    async find(query = {}) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.find(query);
      }
      return store.find(query);
    },
    async findOne(query = {}) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.findOne(query);
      }
      return store.findOne(query);
    },
    async findById(id) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.findById(id);
      }
      return store.findById(id);
    },
    async create(data) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.create(data);
      }
      return store.create(data);
    },
    async insertMany(data) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.insertMany(data);
      }
      return store.insertMany(data);
    },
    async findByIdAndUpdate(id, update, opts = { new: true }) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.findByIdAndUpdate(id, update, opts);
      }
      return store.findByIdAndUpdate(id, update, opts);
    },
    async updateOne(query, update, opts = {}) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.updateOne(query, update, opts);
      }
      return store.updateOne(query, update, opts);
    },
    async updateMany(query, update) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.updateMany(query, update);
      }
      return store.updateMany(query, update);
    },
    async deleteOne(query) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.deleteOne(query);
      }
      return store.deleteOne(query);
    },
    async deleteMany(query) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.deleteMany(query);
      }
      return store.deleteMany(query);
    },
    async findByIdAndDelete(id) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.findByIdAndDelete(id);
      }
      return store.findByIdAndDelete(id);
    },
    async countDocuments(query = {}) {
      if (isConnected() && MongooseModel) {
        return MongooseModel.countDocuments(query);
      }
      return store.countDocuments(query);
    }
  };
}

module.exports = createModel;
