import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { passwordChangeGuard } from './password-change.guard';
import { AuthService } from '../services/auth.service';

describe('passwordChangeGuard', () => {
  const mustChange = signal(false);

  function check(url: string): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      passwordChangeGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  beforeEach(() => {
    mustChange.set(false);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { mustChangePassword: mustChange } }],
    });
  });

  it('lets an admin with their own password go anywhere', () => {
    expect(check('/dashboard')).toBeTrue();
  });

  it('sends an admin on a temporary password to Account Settings', () => {
    mustChange.set(true);
    const result = check('/riders/directory');
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/account/settings');
  });

  it('allows Account Settings itself while on a temporary password', () => {
    mustChange.set(true);
    expect(check('/account/settings')).toBeTrue();
  });
});
