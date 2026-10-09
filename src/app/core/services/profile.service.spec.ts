import { TestBed } from '@angular/core/testing';

import { UserDto } from '../../shared/models';
import { MockApiClient } from '../../mock/mock-api-client';
import { ProfileService } from './profile.service';

const ME: UserDto = { id: 'user-1', name: 'Алексей', email: 'alex@example.com' };

describe('ProfileService — сервис домена Profile', () => {
  let service: ProfileService;
  let client: MockApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    client = TestBed.inject(MockApiClient);
    service = TestBed.inject(ProfileService);
  });

  it('get вызывает profile.get', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(ME));
    expect(await service.get()).toBe(ME);
    expect(spy).toHaveBeenCalledWith('profile.get', null);
  });

  it('update передаёт имя и email', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(ME));
    const params = { name: 'Алексей Н.', email: 'new@example.com' };
    await service.update(params);
    expect(spy).toHaveBeenCalledWith('profile.update', params);
  });

  it('changePassword передаёт все три поля', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(undefined));
    const params = {
      currentPassword: 'Demo1234!',
      password: 'NewDemo1234!',
      confirmPassword: 'NewDemo1234!',
    };
    await service.changePassword(params);
    expect(spy).toHaveBeenCalledWith('profile.changePassword', params);
  });

  it('deleteAccount вызывает profile.deleteAccount', async () => {
    const spy = spyOn(client, 'call').and.returnValue(Promise.resolve(undefined));
    await service.deleteAccount();
    expect(spy).toHaveBeenCalledWith('profile.deleteAccount', null);
  });

  it('отказ мока пробрасывается как ApiError', async () => {
    const apiError = { status: 409, body: { message: 'Пользователь с таким email уже существует' } };
    spyOn(client, 'call').and.returnValue(Promise.reject(apiError));
    await expectAsync(service.update({ name: 'A', email: 'a@b.c' })).toBeRejectedWith(apiError);
  });
});
