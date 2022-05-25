import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectPopUpComponent } from './subject-pop-up.component';

describe('SubjectPopUpComponent', () => {
  let component: SubjectPopUpComponent;
  let fixture: ComponentFixture<SubjectPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubjectPopUpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubjectPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
