import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropTestbedPage } from './drag-drop-testbed.page';

describe('DragDropTestbedPage', () => {
  let component: DragDropTestbedPage;
  let fixture: ComponentFixture<DragDropTestbedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DragDropTestbedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
