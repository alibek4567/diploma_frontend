import { Component, OnInit } from '@angular/core';
import SwiperCore, { Navigation, Pagination, Swiper } from "swiper";

// install Swiper modules
SwiperCore.use([Navigation]);

@Component({
  selector: 'app-third',
  templateUrl: './third.component.html',
  styleUrls: ['./third.component.scss']
})
export class ThirdComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  swiper = new Swiper('.swiper', {
    modules: [ Navigation, Pagination ],
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });

}
