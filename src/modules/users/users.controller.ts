import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.id, updateUserProfileDto);
  }

  @Get(':username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findByUsername(username);
  }
}
