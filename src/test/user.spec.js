import chai, { expect } from 'chai';
import faker from 'faker';
import chaiHttp from 'chai-http';
import server from '../index';

chai.use(chaiHttp);
let newlyCreatedUser;
describe('User Route Endpoints', () => {
  it('should signup successfully with a status of 201', async () => {
    const user = {
      email: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: faker.internet.password(15, false),
      companyName: faker.company.companyName(),
      country: faker.address.country(),
      gender: 'male',
      street: 'ajayi estate',
      city: faker.address.city(),
      state: faker.address.state(),
      birthdate: faker.date.past(),
      phoneNumber: faker.phone.phoneNumber()
    };

    const response = await chai
      .request(server)
      .post('/api/auth/signup')
      .send(user);
    expect(response).to.have.status(201);
    expect(response.body.data).to.be.a('object');
    expect(response.body.data.token).to.be.a('string');
    expect(response.body.data.firstName).to.be.a('string');
    expect(response.body.data.lastName).to.be.a('string');
    newlyCreatedUser = response.body.data;
  });
  describe('GET REQUESTS', () => {
    it('should successfully populate the user data on the profile with a status of 200', async () => {
      const { id } = newlyCreatedUser;
      const response = await chai.request(server).get(`/api/users/profile/${id}`);
      const { body: { data } } = response;
      expect(response).to.have.status(200);
      expect(data).to.equal('works');
    });
  });
  describe('PATCH REQUESTS', () => {
    it('should update the user data successfully with a status of 200', async () => {
      const { id } = newlyCreatedUser;
      const user = {
        email: faker.internet.email(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        country: faker.address.country(),
        gender: 'male',
        street: 'ajayi estate',
        city: faker.address.city(),
        state: faker.address.state(),
        birthdate: faker.date.past(),
        phoneNumber: faker.phone.phoneNumber()
      };
      const response = await chai.request(server).patch(`/api/users/profile/${id}/update`).send(user);
      const { body: { data } } = response;
      expect(response).to.have.status(200);
      expect(data).to.equal('works');
    });
  });
});