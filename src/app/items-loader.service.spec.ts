import { TestBed } from '@angular/core/testing';

import { ItemsLoaderService } from './items-loader.service';

describe('ItemsLoaderService', () => {
  let service: ItemsLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemsLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
