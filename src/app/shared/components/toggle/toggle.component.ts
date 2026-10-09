import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.css'
})
export class ToggleComponent {
  @Input() checked = false;
  @Output() onChange = new EventEmitter<boolean>();
}
