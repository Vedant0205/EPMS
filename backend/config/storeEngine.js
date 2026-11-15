const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

function matchQuery(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key of Object.keys(query)) {
    if (key === '$or') {
      const orList = query[key];
      const matchAny = orList.some(subQuery => matchQuery(doc, subQuery));
      if (!matchAny) return false;
      continue;
    }

    const expected = query[key];
    const actual = doc[key];

    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) {
        const inArray = expected.$in.map(String);
        if (!inArray.includes(String(actual))) return false;
      }
      if ('$nin' in expected) {
        const ninArray = expected.$nin.map(String);
        if (ninArray.includes(String(actual))) return false;
      }
      if ('$ne' in expected) {
        if (String(actual) === String(expected.$ne)) return false;
      }
      if ('$gte' in expected) {
        if (new Date(actual) < new Date(expected.$gte)) return false;
      }
      if ('$lte' in expected) {
        if (new Date(actual) > new Date(expected.$lte)) return false;
      }
      if ('$gt' in expected) {
        if (new Date(actual) <= new Date(expected.$gt)) return false;
      }
      if ('$lt' in expected) {
        if (new Date(actual) >= new Date(expected.$lt)) return false;
      }
      if ('$regex' in expected) {
        const options = expected.$options || '';
        const regex = new RegExp(expected.$regex, options);
        if (!regex.test(String(actual || ''))) return false;
      }
    } else if (expected instanceof RegExp) {
      if (!expected.test(String(actual || ''))) return false;
    } else {
      if (String(actual) !== String(expected)) return false;
    }
  }
  return true;
}

class CollectionStore {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.docs = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content || '[]');
      }
    } catch (err) {
      console.error(`Failed to load ${this.name} JSON file:`, err);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.docs, null, 2), 'utf8');
    } catch (err) {
      console.error(`Failed to save ${this.name} JSON file:`, err);
    }
  }

  async find(query = {}) {
    let results = this.docs.filter(doc => matchQuery(doc, query));
    return new QueryCursor(results.map(d => ({ ...d })), this);
  }

  async findOne(query = {}) {
    const doc = this.docs.find(d => matchQuery(d, query));
    return doc ? { ...doc } : null;
  }

  async findById(id) {
    if (!id) return null;
    const doc = this.docs.find(d => String(d._id) === String(id) || String(d.id) === String(id));
    return doc ? { ...doc } : null;
  }

  async create(data) {
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];
    const createdItems = [];

    for (const item of items) {
      const doc = {
        _id: item._id ? String(item._id) : generateObjectId(),
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.docs.push(doc);
      createdItems.push(doc);
    }

    this.save();
    return isArray ? createdItems : createdItems[0];
  }

  async insertMany(items) {
    return this.create(items);
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const index = this.docs.findIndex(d => String(d._id) === String(id) || String(d.id) === String(id));
    if (index === -1) {
      if (options.upsert) {
        return this.create({ _id: id, ...update });
      }
      return null;
    }

    const current = this.docs[index];
    const updateData = update.$set ? { ...update.$set } : { ...update };
    delete updateData.$set;

    const updated = {
      ...current,
      ...updateData,
      _id: current._id,
      updatedAt: new Date().toISOString(),
    };

    this.docs[index] = updated;
    this.save();
    return options.new !== false ? { ...updated } : { ...current };
  }

  async updateOne(query, update, options = {}) {
    const index = this.docs.findIndex(d => matchQuery(d, query));
    if (index === -1) {
      if (options.upsert) {
        const setDoc = update.$set ? { ...update.$set } : { ...update };
        const created = await this.create({ ...query, ...setDoc });
        return { acknowledged: true, modifiedCount: 1, upsertedId: created._id };
      }
      return { acknowledged: true, modifiedCount: 0 };
    }

    const current = this.docs[index];
    const updateData = update.$set ? { ...update.$set } : { ...update };
    delete updateData.$set;

    this.docs[index] = {
      ...current,
      ...updateData,
      _id: current._id,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return { acknowledged: true, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    let modifiedCount = 0;
    const updateData = update.$set ? { ...update.$set } : { ...update };
    delete updateData.$set;

    for (let i = 0; i < this.docs.length; i++) {
      if (matchQuery(this.docs[i], query)) {
        this.docs[i] = {
          ...this.docs[i],
          ...updateData,
          _id: this.docs[i]._id,
          updatedAt: new Date().toISOString(),
        };
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) this.save();
    return { acknowledged: true, modifiedCount };
  }

  async deleteOne(query) {
    const index = this.docs.findIndex(d => matchQuery(d, query));
    if (index !== -1) {
      this.docs.splice(index, 1);
      this.save();
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(query) {
    const initialLen = this.docs.length;
    this.docs = this.docs.filter(d => !matchQuery(d, query));
    const deletedCount = initialLen - this.docs.length;
    if (deletedCount > 0) this.save();
    return { acknowledged: true, deletedCount };
  }

  async findByIdAndDelete(id) {
    const index = this.docs.findIndex(d => String(d._id) === String(id) || String(d.id) === String(id));
    if (index !== -1) {
      const removed = this.docs.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  async countDocuments(query = {}) {
    return this.docs.filter(d => matchQuery(d, query)).length;
  }
}

class QueryCursor {
  constructor(results, store) {
    this.results = results;
    this.store = store;
  }

  sort(sortObj) {
    if (!sortObj) return this;
    const keys = Object.keys(sortObj);
    this.results.sort((a, b) => {
      for (const key of keys) {
        const order = sortObj[key] === -1 || sortObj[key] === 'desc' ? -1 : 1;
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
      }
      return 0;
    });
    return this;
  }

  skip(count) {
    this.results = this.results.slice(count);
    return this;
  }

  limit(count) {
    this.results = this.results.slice(0, count);
    return this;
  }

  populate() {
    // Basic chainable no-op for query compatibility
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.results).then(resolve, reject);
  }
}

const stores = {};
function getStore(name) {
  if (!stores[name]) {
    stores[name] = new CollectionStore(name);
  }
  return stores[name];
}

module.exports = { getStore, generateObjectId };
