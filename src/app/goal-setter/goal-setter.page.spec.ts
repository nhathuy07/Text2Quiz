import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoalSetterPage } from './goal-setter.page';

describe('GoalSetterPage', () => {
  let component: GoalSetterPage;
  let fixture: ComponentFixture<GoalSetterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalSetterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
