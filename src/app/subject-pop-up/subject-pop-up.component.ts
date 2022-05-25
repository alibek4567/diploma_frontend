import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from '../subject';

@Component({
  selector: 'app-subject-pop-up',
  templateUrl: './subject-pop-up.component.html',
  styleUrls: ['./subject-pop-up.component.scss']
})
export class SubjectPopUpComponent implements OnInit {

  // subject: string = ''
  // tutor: string = ''
  // location: string = ''
  // startTime: string = ''
  subjects: Subject[]

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { 

    this.subjects = data.object
    // this.subject = data.title
    // this.tutor = data.tutor
    // this.location = data.room
    // this.startTime = data.time

    // for (let item of this.data.object) {
    //   this.subject += item.subject + ' / '
    //   this.location += item.room + ' / '
    //   this.startTime = item.time
    //   this.tutor = item.tutor
    // }
    // this.subject.slice(0, -3);
    // this.location.slice(0, -3);
  }

  ngOnInit(): void { }

}
