import { TestBed } from '@angular/core/testing';

import { Interconnect } from './ng-interconnect.service';

describe('NgInterconnectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Interconnect = TestBed.get(Interconnect);
    expect(service).toBeTruthy();
  });
});
