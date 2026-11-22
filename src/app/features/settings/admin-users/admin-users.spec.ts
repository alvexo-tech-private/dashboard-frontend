import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AdminUsers } from './admin-users';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser } from '../../../core/models/admin-user';
import { AdminRole } from '../../../core/models/admin-role';
import { TemporaryPasswordDialog } from './temporary-password-dialog';

describe('AdminUsers', () => {
  const other: AdminUser = {
    id: 2,
    email: 'ops@alvexo.com',
    fullName: 'Ops Person',
    role: AdminRole.OPERATIONS_ADMIN,
    status: 'ACTIVE',
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: '2026-11-01T10:00:00',
  };
  const me: AdminUser = { ...other, id: 1, email: 'me@alvexo.com', fullName: 'Me', role: AdminRole.SUPER_ADMIN };

  let service: jasmine.SpyObj<AdminUserService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let dialogResult: unknown;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminUserService>('AdminUserService', [
      'list',
      'create',
      'changeRole',
      'setEnabled',
      'resetPassword',
      'getHistory',
    ]);
    service.list.and.returnValue(
      of({ content: [me, other], page: 0, size: 10, totalElements: 2, totalPages: 1, last: true }),
    );
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.callFake(() => ({ afterClosed: () => of(dialogResult) }) as any);

    TestBed.configureTestingModule({
      imports: [AdminUsers],
      providers: [
        provideNoopAnimations(),
        { provide: AdminUserService, useValue: service },
        { provide: AuthService, useValue: { currentAdminId: signal(1) } },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']) },
      ],
    });
  });

  it('marks the signed-in admin as "You"', () => {
    const fixture = TestBed.createComponent(AdminUsers);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.isSelf(me)).toBeTrue();
    expect(component.isSelf(other)).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.you-tag').length).toBe(1);
  });

  it('shows the temporary password once, in a dialog that cannot be dismissed by accident', () => {
    dialogResult = 'Forgot password';
    service.resetPassword.and.returnValue(of({ adminUser: other, temporaryPassword: 'Tmp#Pass2345xy' }));
    const fixture = TestBed.createComponent(AdminUsers);
    fixture.detectChanges();

    fixture.componentInstance.resetPassword(other);

    expect(service.resetPassword).toHaveBeenCalledWith(2, 'Forgot password');
    const [component, config] = dialog.open.calls.mostRecent().args as [unknown, any];
    expect(component).toBe(TemporaryPasswordDialog);
    expect(config.disableClose).toBeTrue();
    expect(config.data.password).toBe('Tmp#Pass2345xy');
    expect(service.list).toHaveBeenCalledTimes(2); // initial load + reload after the reset
  });
});
