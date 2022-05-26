import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-graphic-map',
  templateUrl: './graphic-map.component.html',
  styleUrls: ['./graphic-map.component.scss']
})
export class GraphicMapComponent implements OnInit {

  floor: number = 1

  constructor() {
    
  }

  setUpperFloor() {
    this.floor++
  }

  setLowerFloor() {
    this.floor--
  }

  ngOnInit(): void { }

}
