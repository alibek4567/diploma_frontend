interface ScheduleElement {
  start_time: string
  end_time: string
}

export class Subject implements ScheduleElement {
    classtime_day: string
    classtime_time: string
    start_time: string
    end_time: string
    elective_id: number
    id: number
    lesson_type: string
    room: string
    room_id: number
    room_type: string
    schedule_block_id: number
    subject: string
    subject_id: number
    teams_meeting_joinurl: string
    tutor: string
    tutor_id: number
    date: string
    created_time: string
    reason: string
  }

  export class Booking implements ScheduleElement {
    room: string
    start_time: string
    end_time: string
    reason: string
    date: string
    private _age: number

    public get age() {
      return this._age;
  }

  public set age(theAge: number) {
      if (theAge <= 0 || theAge >= 200) {
          throw new Error('The age is invalid');
      }
      this._age = theAge;
  }
  }