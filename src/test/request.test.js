import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import server from '..';
import {
  newCompanyUser, createCompanyFacility, newRequest, newTestCompany
} from './dummies';
import { AuthController, RequestController } from '../controllers';
import { RequestService } from '../services';
import db from '../models';

const { Request } = db;

const { companySignUp, userSignup } = AuthController;

chai.use(chaiHttp);
chai.use(sinonChai);

let newlyCreatedCompany;
let newlyCreatedUser;
let newlyCreatedRequest;
let companyAdminToken;
let userToken;

const [companyAdmin] = createCompanyFacility;

describe('Request route endpoints', () => {
  let adminToken;
  let companyAdminResponse;

  before(async () => {
    const reqCompany = { body: { ...companyAdmin, email: 'baystef@slack.com', companyName: 'paystack' } };

    const res = {
      status() {
        return this;
      },
      cookie() {
        return this;
      },
      json(obj) {
        return obj;
      }
    };

    companyAdminResponse = await companySignUp(reqCompany, res);
    const { data: { signupToken } } = companyAdminResponse;
    const reqUser = { body: {
      ...newCompanyUser, email: 'steve@google.com', signupToken, roleId: 5
    }
    };
    const companyUserResponse = await userSignup(reqUser, res);
    adminToken = companyUserResponse.data.token;
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('GET api/users/requests', () => {
    it('should return 404 for user with no request yet', async () => {
      const response = await chai.request(server).get('/api/users/requests').set('Cookie', `token=${adminToken}`);
      expect(response).to.have.status(404);
      expect(response.body.error.message).to.be.eql('You have made no request yet');
    });
    it('should return a 500 error if something goes wrong while getting the requests', async () => {
      const req = {
        body: {}
      };
      const mockResponse = () => {
        const res = {};
        res.status = sinon.stub().returns(res);
        res.json = sinon.stub().returns(res);
        return res;
      };
      const res = mockResponse();
      sinon.stub(RequestService, 'getRequests').throws();
      await RequestController.getUserRequests(req, res);
      expect(res.status).to.have.been.calledWith(500);
    });
    it('should get a request successfuly', async () => {
      await Request.create(newRequest);
      const response = await chai.request(server).get('/api/users/requests').set('Cookie', `token=${adminToken}`);
      expect(response).to.have.status(200);
      expect(response.body.status).to.equal('success');
    });
  });
});

describe('User Route Endpoints', () => {
  it('should signup a company and return status 201', async () => {
    const response = await chai.request(server).post('/api/auth/signup/company').send(newTestCompany);
    newlyCreatedCompany = response.body.data;
    companyAdminToken = newlyCreatedCompany.admin.token;
    expect(response).to.have.status(201);
    expect(response.body.status).to.equal('success');
    expect(response.body.data).to.be.a('object');
  });


  it('should signup user successfully with a status of 201', async () => {
    const user = {
      email: 'bolamark@user.com',
      firstName: 'bola',
      lastName: 'Mark',
      password: 'tmobnvarq.ss66u',
      companyName: newlyCreatedCompany.company.companyName,
      signupToken: newlyCreatedCompany.signupToken,
    };
    const response = await chai
      .request(server)
      .post('/api/auth/signup/user')
      .send(user);
    expect(response).to.have.status(201);
    expect(response.body.data).to.be.a('object');
    newlyCreatedUser = response.body.data;
    userToken = newlyCreatedUser.token;
  });
});

describe('Request Endpoints', () => {
  it('should create request successfully with a status of 201', async () => {
    const request = {
      requesterId: newlyCreatedUser.id,
      managerId: newlyCreatedCompany.admin.id,
      purpose: 'official',
      status: 2,
      tripType: 'round-trip',
      origin: 'lagos',
      destination: 'Lagos',
      departureDate: new Date(),
      returnDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const response = await chai
      .request(server)
      .post('/api/users/requests')
      .set('Cookie', `token=${companyAdminToken};`)
      .send(request);
    expect(response).to.have.status(201);
    expect(response.body.data).to.be.a('object');
    newlyCreatedRequest = response.body.data;
  });

  it('should get all request for a particular user', async () => {
    const response = await chai
      .request(server)
      .get(`/api/users/requests/${newlyCreatedUser.id}`)
      .set('Cookie', `token=${userToken};`);
    expect(response).to.have.status(200);
    expect(response.body.data).to.be.a('array');
    expect(response.body.status).to.equal('success');
  });
  it('should get request by id in token and param status', async () => {
    const response = await chai
      .request(server)
      .get(`/api/users/requests/user/${newlyCreatedRequest.status}`)
      .set('Cookie', `token=${userToken}`);
    expect(response).to.have.status(200);
    expect(response.body.data).to.be.a('array');
    expect(response.body.status).to.equal('success');
  });

  it('should throw error if wrong status param is passed', async () => {
    const response = await chai
      .request(server)
      .get('/api/users/requests/user/approve')
      .set('Cookie', `token=${userToken}`);
    expect(response).to.have.status(400);
    expect(response.body.error.message).to.equal('Request can only be pending, approved, rejected');
  });

  it('should get all request by admins only', async () => {
    const response = await chai
      .request(server)
      .get('/api/users/requests')
      .set('Cookie', `token=${companyAdminToken};`);
    expect(response).to.have.status(200);
    expect(response.body.data).to.be.a('array');
    expect(response.body.status).to.equal('success');
  });

  it('should throw error if not admin', async () => {
    const response = await chai
      .request(server)
      .get('/api/users/requests')
      .set('Cookie', `token=${userToken}`);
    expect(response).to.have.status(401);
    expect(response.body.status).to.equal('fail');
    expect(response.body.error.message).to.equal('You are an unauthorized user');
  });

  const newlyRequest = { status: 'approved' };

  it('should update request by request id in params', async () => {
    const response = await chai
      .request(server)
      .patch(`/api/users/requests/${newlyCreatedRequest.id}`)
      .set('Cookie', `token=${companyAdminToken};`)
      .send(newlyRequest);
    expect(response).to.have.status(200);
    expect(response.body.data).to.be.a('object');
    expect(response.body.status).to.equal('success');
  });

  const wrongRequest = { status: 'approve' };

  it('should throw error if wrong status update is specified', async () => {
    const response = await chai
      .request(server)
      .patch(`/api/users/requests/${newlyCreatedRequest.id}`)
      .set('Cookie', `token=${companyAdminToken};`)
      .send(wrongRequest);
    expect(response).to.have.status(400);
    expect(response.body.status).to.equal('fail');
    expect(response.body.error).to.be.a('object');
    expect(response.body.error.message).to.equal('Request can only be pending, approved, rejected');
  });

  it('should throw error if wrong request id is specified', async () => {
    const response = await chai
      .request(server)
      .patch('/api/users/requests/1234')
      .set('Cookie', `token=${companyAdminToken};`)
      .send(newlyRequest);
    expect(response).to.have.status(404);
    expect(response.body.status).to.equal('fail');
    expect(response.body.error.message).to.equal('updateRequest: No such request');
  });
});