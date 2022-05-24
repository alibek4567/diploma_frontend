import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-subject-pop-up',
  templateUrl: './subject-pop-up.component.html',
  styleUrls: ['./subject-pop-up.component.scss']
})
export class SubjectPopUpComponent implements OnInit {

  subject: string
  tutor: string
  location: string
  startTime: string

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { 
    this.subject = data.title
    this.tutor = data.tutor
    this.location = data.room
    this.startTime = data.time
  }

  ngOnInit(): void { }

}
