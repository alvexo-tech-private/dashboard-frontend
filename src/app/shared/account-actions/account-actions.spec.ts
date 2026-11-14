import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AccountActions } from './account-actions';
import { AccountService } from '../../core/services/account.service';

describe('AccountActions', () => {
  let dialogResult: string | undefined;
  let dialog: jasmine.SpyObj<MatDialog>;
  let accountService: jasmine.SpyObj<AccountService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  function create(status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') {
    const fixture = TestBed.createComponent(AccountActions);
    fixture.componentRef.setInput('userId', 42);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('name', 'Ravi Kumar');
    fixture.componentRef.setInput('kind', 'rider');
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    dialogResult = 'Fraudulent bookings';
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.callFake(() => ({ afterClosed: () => of(dialogResult) }) as any);
    accountService = jasmine.createSpyObj<AccountService>('AccountService', ['apply', 'getHistory']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [AccountActions],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: AccountService, useValue: accountService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
  });

  it('applies the action with the entered reason and emits the new status', () => {
    accountService.apply.and.returnValue(of('SUSPENDED'));
    const fixture = create('ACTIVE');
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((s) => emitted.push(s));

    fixture.componentInstance.run('suspend');

    expect(accountService.apply).toHaveBeenCalledWith(42, 'suspend', 'Fraudulent bookings');
    expect(emitted).toEqual(['SUSPENDED']);
    expect(snackBar.open).toHaveBeenCalledWith('Ravi Kumar has been suspended.', 'OK', jasmine.any(Object));
  });

  it('does nothing when the reason dialog is cancelled', () => {
    dialogResult = undefined;
    const fixture = create('ACTIVE');

    fixture.componentInstance.run('delete');

    expect(accountService.apply).not.toHaveBeenCalled();
  });

  it("shows the backend's plain-language message when an action is refused", () => {
    const refusal = new HttpErrorResponse({
      status: 409,
      error: { message: 'This rider still has 1 open booking(s).' },
    });
    accountService.apply.and.returnValue(throwError(() => refusal));
    const fixture = create('ACTIVE');

    fixture.componentInstance.run('delete');

    expect(snackBar.open).toHaveBeenCalledWith('This rider still has 1 open booking(s).', 'Close', jasmine.any(Object));
    expect(fixture.componentInstance.busy()).toBeFalse();
  });

  it('marks deletion as destructive in the reason dialog', () => {
    accountService.apply.and.returnValue(of('DELETED'));
    const fixture = create('SUSPENDED');

    fixture.componentInstance.run('delete');

    const config = dialog.open.calls.mostRecent().args[1] as { data: { destructive?: boolean; title: string } };
    expect(config.data.destructive).toBeTrue();
    expect(config.data.title).toBe('Delete Ravi Kumar?');
  });
});
