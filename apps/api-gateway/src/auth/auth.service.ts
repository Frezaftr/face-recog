import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../database/entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      tenantId: uuidv4(), // each user gets their own isolated tenant namespace
    });

    const saved = await this.userRepo.save(user);
    return this._buildTokenResponse(saved);
  }

  async login(dto: LoginDto) {
    // select: false on passwordHash requires explicit select
    const user = await this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.tenantId', 'u.isActive', 'u.passwordHash'])
      .where('u.email = :email AND u.isActive = true', { email: dto.email })
      .getOne();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this._buildTokenResponse(user);
  }

  private _buildTokenResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      user: { id: user.id, email: user.email },
    };
  }
}
