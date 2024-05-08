import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocsEditPage } from './docs-edit.page';

describe('DocsEditPage', () => {
  let component: DocsEditPage;
  let fixture: ComponentFixture<DocsEditPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DocsEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
