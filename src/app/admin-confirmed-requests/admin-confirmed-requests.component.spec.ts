import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminConfirmedRequestsComponent } from './admin-confirmed-requests.component';

describe('AdminConfirmedRequestsComponent', () => {
  let component: AdminConfirmedRequestsComponent;
  let fixture: ComponentFixture<AdminConfirmedRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminConfirmedRequestsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminConfirmedRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
