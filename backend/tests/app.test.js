process.env.NODE_ENV = 'test';
process.env.MONGOMS_SYSTEM_BINARY = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';

import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

const { app, connectDB } = await import('../server.js');

const request = supertest(app);
let mongoServer;

async function setupDb() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri('greenfield-farm-coop');
  await connectDB();
}

test.before(async () => {
  await setupDb();
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('registers a farmer and returns a JWT', async () => {
  const response = await request
    .post('/api/auth/register')
    .send({
      name: 'Muhammad Kashif',
      email: 'kashif@example.com',
      password: 'StrongPassword123',
    });

  assert.equal(response.status, 201);
  assert.ok(response.body.token);
  assert.equal(response.body.user.email, 'kashif@example.com');
});

test('duplicate email registration is rejected', async () => {
  const response = await request
    .post('/api/auth/register')
    .send({
      name: 'Another User',
      email: 'kashif@example.com',
      password: 'StrongPassword456',
    });

  assert.equal(response.status, 409);
});

test('login rejects invalid credentials', async () => {
  const response = await request
    .post('/api/auth/login')
    .send({
      email: 'kashif@example.com',
      password: 'WrongPassword123',
    });

  assert.equal(response.status, 401);
});

test('missing bearer token is rejected', async () => {
  const response = await request.get('/api/farms');

  assert.equal(response.status, 401);
});

test('creates and returns a farm for the authenticated user', async () => {
  const registerResponse = await request
    .post('/api/auth/register')
    .send({
      name: 'Ali Hassan',
      email: 'ali@example.com',
      password: 'StrongPassword123',
    });

  const token = registerResponse.body.token;

  const response = await request
    .post('/api/farms')
    .set('Authorization', `Bearer ${token}`)
    .send({
      farmName: 'Green Valley Farm',
      location: 'Lahore',
      farmSize: 15,
      soilType: 'Loamy',
      cropType: 'Wheat',
      plantingDate: '2026-11-01',
      harvestDate: '2027-04-01',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.farm.owner, registerResponse.body.user._id);
});

test('searches and filters farm records by text and season stage', async () => {
  const registerResponse = await request
    .post('/api/auth/register')
    .send({
      name: 'Filter Farmer',
      email: 'filterfarmer@example.com',
      password: 'StrongPassword123',
    });

  const token = registerResponse.body.token;
  const dateOffset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  for (const farm of [
    { farmName: 'North Field', location: 'Lahore', farmSize: 10, cropType: 'Rice', plantingDate: dateOffset(-1), harvestDate: dateOffset(10) },
    { farmName: 'Delta Plot', location: 'Multan', farmSize: 8, cropType: 'Rice' },
    { farmName: 'Wheat Ridge', location: 'Quetta', farmSize: 12, cropType: 'Wheat', plantingDate: dateOffset(-20), harvestDate: dateOffset(-2) },
    { farmName: 'Future Acres', location: 'Karachi', farmSize: 9, cropType: 'Barley', plantingDate: dateOffset(10), harvestDate: dateOffset(40) },
  ]) {
    const createResponse = await request
      .post('/api/farms')
      .set('Authorization', `Bearer ${token}`)
      .send(farm);
    assert.equal(createResponse.status, 201);
  }

  const growingRice = await request
    .get('/api/farms?search=rice&filter=growing')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(growingRice.status, 200);
  assert.deepEqual(growingRice.body.farms.map((farm) => farm.farmName), ['North Field']);

  const planningRice = await request
    .get('/api/farms?search=Delta&filter=planning')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(planningRice.status, 200);
  assert.deepEqual(planningRice.body.farms.map((farm) => farm.farmName), ['Delta Plot']);

  const invalidFilter = await request
    .get('/api/farms?filter=unknown')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(invalidFilter.status, 400);
});

test('other user cannot access another farmer record', async () => {
  const userOne = await request
    .post('/api/auth/register')
    .send({
      name: 'Farmer One',
      email: 'userone@example.com',
      password: 'StrongPassword123',
    });

  const userTwo = await request
    .post('/api/auth/register')
    .send({
      name: 'Farmer Two',
      email: 'usertwo@example.com',
      password: 'StrongPassword123',
    });

  const farmResponse = await request
    .post('/api/farms')
    .set('Authorization', `Bearer ${userOne.body.token}`)
    .send({
      farmName: 'User One Farm',
      location: 'Karachi',
      farmSize: 20,
      cropType: 'Rice',
    });

  const response = await request
    .get(`/api/farms/${farmResponse.body.farm._id}`)
    .set('Authorization', `Bearer ${userTwo.body.token}`);

  assert.equal(response.status, 404);
});
