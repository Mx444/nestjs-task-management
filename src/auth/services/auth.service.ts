import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { isInstance } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private JwtService: JwtService,
  ) {}

  async createUser(AuthCredentialsDto: AuthCredentialsDto): Promise<void> {
    try {
      const { username, password } = AuthCredentialsDto;

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = this.usersRepository.create({
        username,
        password: hashedPassword,
      });
      await this.usersRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async validateUser(
    AuthCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = AuthCredentialsDto;
    const user = await this.usersRepository.findOne({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { username };
      const accessToken = await this.JwtService.sign(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }
}
