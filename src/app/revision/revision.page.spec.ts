import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevisionPage } from './revision.page';

describe('RevisionPage', () => {
  let component: RevisionPage;
  let fixture: ComponentFixture<RevisionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RevisionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
