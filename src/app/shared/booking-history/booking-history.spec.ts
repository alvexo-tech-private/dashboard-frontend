import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BookingHistory } from './booking-history';
import { PeopleDetailService } from '../../core/services/people-detail.service';
import { AccountHistory } from '../account-history/account-history';
import { AccountService } from '../../core/services/account.service';

const EMPTY_PAGE = { content: [], page: 0, size: 10, totalElements: 30, totalPages: 3, last: false };

describe('BookingHistory', () => {
  let service: jasmine.SpyObj<PeopleDetailService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<PeopleDetailService>('PeopleDetailService', ['getBookings']);
    service.getBookings.and.returnValue(of(EMPTY_PAGE));
    TestBed.configureTestingModule({
      imports: [BookingHistory],
      providers: [provideRouter([]), { provide: PeopleDetailService, useValue: service }],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(BookingHistory);
    fixture.componentRef.setInput('userId', 7);
    fixture.componentRef.setInput('perspective', 'rider');
    fixture.detectChanges();
    return fixture;
  }

  it('loads once on open, and once per filter or page change', () => {
    const fixture = create();
    expect(service.getBookings).toHaveBeenCalledTimes(1);

    fixture.componentInstance.onStatusChange('CANCELLED');
    fixture.detectChanges();
    expect(service.getBookings).toHaveBeenCalledTimes(2);
    expect(service.getBookings.calls.mostRecent().args).toEqual([7, 0, 10, 'CANCELLED']);

    fixture.componentInstance.onPageChange({ pageIndex: 2, pageSize: 10, length: 30 });
    fixture.detectChanges();
    expect(service.getBookings).toHaveBeenCalledTimes(3);
    expect(service.getBookings.calls.mostRecent().args).toEqual([7, 2, 10, 'CANCELLED']);
  });
});

describe('AccountHistory paging', () => {
  it('stays on the requested page instead of snapping back to page 0', () => {
    const accountService = jasmine.createSpyObj<AccountService>('AccountService', ['getHistory']);
    accountService.getHistory.and.returnValue(of({ ...EMPTY_PAGE, size: 5 }));
    TestBed.configureTestingModule({
      imports: [AccountHistory],
      providers: [{ provide: AccountService, useValue: accountService }],
    });
    const fixture = TestBed.createComponent(AccountHistory);
    fixture.componentRef.setInput('userId', 7);
    fixture.detectChanges();

    fixture.componentInstance.onPageChange({ pageIndex: 1, pageSize: 5, length: 30 });
    fixture.detectChanges();

    expect(fixture.componentInstance.pageIndex()).toBe(1);
    expect(accountService.getHistory).toHaveBeenCalledTimes(2);
    expect(accountService.getHistory.calls.mostRecent().args).toEqual([7, 1, 5]);
  });
});
