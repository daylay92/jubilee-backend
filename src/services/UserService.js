import { hashSync, genSaltSync } from 'bcryptjs';
import ApiError from '../utils/index';
import { database } from '../models/User';

/**
 * UserService class, interface for UserModel
 */
export default class UserService {
  /**
   * Save user in the database
   *
   * @param {object} user - The user to be saved in the database
   * @returns {Promise<object>} A promise object with user detail.
   */
  static async create(user) {
    try {
      user.password = hashSync(user.password, genSaltSync(10));
      console.log(database);
      return await database.User.create(user);
    } catch (error) {
      console.log(error);
      throw new ApiError(500, error.message);
    }
  }
}
