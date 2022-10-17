import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto.ts';

@Injectable()
export class UsersService {
  async createTenantUser(createTenantUserDto: CreateTenantUserDto) {
    const { userPoolId, email, companyName, tenantId } = createTenantUserDto;
    console.log('Adding tenant user', userPoolId, email, tenantId);
    const client = new CognitoIdentityProviderClient({});
    const cmd = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: 'custom:tenant-id', Value: tenantId },
        { Name: 'custom:company-name', Value: companyName },
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
    });
    const res = await client.send(cmd);
    console.log('Successfully added user:', res.User);
  }
}
