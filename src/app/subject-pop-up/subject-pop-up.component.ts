import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from '../subject';

@Component({
  selector: 'app-subject-pop-up',
  templateUrl: './subject-pop-up.component.html',
  styleUrls: ['./subject-pop-up.component.scss']
})
export class SubjectPopUpComponent implements OnInit {

  subjects: Subject[]

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { 
    this.subjects = data.object
  }

  ngOnInit(): void { }
}
