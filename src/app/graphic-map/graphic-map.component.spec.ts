import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicMapComponent } from './graphic-map.component';

describe('GraphicMapComponent', () => {
  let component: GraphicMapComponent;
  let fixture: ComponentFixture<GraphicMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GraphicMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphicMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
