import { Injectable } from '@angular/core';
import { ApiCallerService } from './api-caller.service';

@Injectable({
  providedIn: 'root'
})
export class ItemsLoaderService {

  rooms: []

  constructor(private api: ApiCallerService) {
    var response = this.api.sendGetRequest("/room")
    response.subscribe(data => {
      this.rooms = JSON.parse(JSON.stringify(data)).payload
      console.log(this.rooms)
    }, error => {
    })
   }
}
