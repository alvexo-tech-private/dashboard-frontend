import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdminUserFormDialog, AdminUserFormDialogData } from './admin-user-form-dialog';
import { AdminRole } from '../../../core/models/admin-role';

describe('AdminUserFormDialog', () => {
  let close: jasmine.Spy;

  function create(data: AdminUserFormDialogData): AdminUserFormDialog {
    close = jasmine.createSpy('close');
    TestBed.configureTestingModule({
      imports: [AdminUserFormDialog],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    return TestBed.createComponent(AdminUserFormDialog).componentInstance;
  }

  it('needs a name, a valid email and a role to add an admin; the note is optional', () => {
    const dialog = create({ mode: 'create' });
    dialog.fullName.set('Priya Nair');
    dialog.email.set('priya@');
    dialog.role.set(AdminRole.FINANCE_ADMIN);
    expect(dialog.valid()).toBeFalse();

    dialog.email.set(' priya@alvexo.com ');
    expect(dialog.valid()).toBeTrue();

    dialog.confirm();
    expect(close).toHaveBeenCalledWith({
      fullName: 'Priya Nair',
      email: 'priya@alvexo.com',
      role: AdminRole.FINANCE_ADMIN,
      reason: '',
    });
  });

  it('needs a different role and a reason to change a role', () => {
    const dialog = create({ mode: 'role', name: 'Arun', currentRole: AdminRole.OPERATIONS_ADMIN });
    expect(dialog.role()).toBe(AdminRole.OPERATIONS_ADMIN);

    dialog.reason.set('Moved to finance');
    expect(dialog.valid()).toBeFalse();

    dialog.role.set(AdminRole.FINANCE_ADMIN);
    expect(dialog.valid()).toBeTrue();

    dialog.reason.set('  ');
    expect(dialog.valid()).toBeFalse();
  });
});
