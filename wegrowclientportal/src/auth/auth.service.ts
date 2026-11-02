import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const cleanId = (identifier || '').trim().toLowerCase();

    // Query database for user by email or clientId
    const user = await this.userModel.findOne({
      $or: [
        { email: cleanId },
        { clientId: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
      ]
    });

    if (user && user.passwordHash === pass) {
      return {
        email: user.email,
        clientId: user.clientId,
        role: user.role,
        name: user.name,
        title: user.title
      };
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      clientId: user.clientId,
      role: user.role,
      name: user.name,
      title: user.title
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: payload
    };
  }
}
