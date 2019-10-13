import AmountWidget from './AmountWidget.js';
import {templates, select, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(wrapper){
    const thisBooking = this;

    thisBooking.render(wrapper);

    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
  }

  initActions(){
    const thisBooking = this;
    const tables = thisBooking.dom.tables;
    let bookedTable = '';

    /** pick one of avaiable table */
    for (let table of tables){
      table.addEventListener('click', function(){
        table.classList.add('booked');
        bookedTable = table.getAttribute('data-table');
        thisBooking.table = bookedTable;
      });
    }

    /* remove picked table while date or hour change */
    thisBooking.hourPicker.dom.input.addEventListener('input', function(){
      if (bookedTable.length > 0) {
        tables[bookedTable-1].classList.remove('booked');
      }
    });

    thisBooking.datePicker.dom.input.addEventListener('input', function(){
      if (bookedTable.length > 0) {
        tables[bookedTable-1].classList.remove('booked');
      }
    });
    thisBooking.dom.bookButton.addEventListener('submit', function(){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }


  
  
  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.correctValue,
      hour: thisBooking.hourPicker.correctValue,
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      table: parseInt(thisBooking.table),
      repeat: false,
      id: '',
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse: ', parsedResponse);
      });
  }



  getData(){
    const thisBooking = this;


    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,   
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,   
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    // console.log('getData params: ', params);
    const urls = {
      booking:              settings.db.url + '/' + settings.db.booking 
                                            + '?' + params.booking.join('&'),

      eventsCurrent:  settings.db.url + '/' + settings.db.event   
                                      + '?' + params.eventsCurrent.join('&'),

      eventsRepeat:   settings.db.url + '/' + settings.db.event   
                                      + '?' + params.eventsRepeat.join('&'),
    };
    // console.log('GetData urls: ', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses) {
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1]; 
        const eventsRepeatResponse = allResponses[2];  
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        console.log('bookings: ', bookings); //PUSTA TABLICA - dlaczego?
        // console.log(eventsCurrent); 
        // console.log(eventsRepeat);

        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });

  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};


    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;


    for (let item of eventsRepeat){
      if (item.repeat == 'daily'){
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    // console.log('thisBooking.booked ', thisBooking.booked);

    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    if(typeof thisBooking.booked[date][startHour] == 'undefined'){
      thisBooking.booked[date][startHour] = [];
    }

    thisBooking.booked[date][startHour].push(table);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      // console.log('loop', hourBlock);
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
    
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
          ||
          typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    //add code - color slider
    const startHour = 12;
    const endHour = 24;
    const midnight = 0;
    const step = .5;
    let column  = 100/(((endHour - startHour)/step)+1);
    let procent = column;
    
    let slider = document.getElementsByClassName('rangeSlider')[0];
    
    let gradient_colors = '';
    
    for (let i = startHour; i <= endHour; i = i+step) {
      let hour = i;
      if (hour == endHour) {
        hour = midnight;
      }
 
      let tables = 0;
      if(
        typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][hour] == 'undefined'
      ){
        tables = 0;
      } else {
        tables = thisBooking.booked[thisBooking.date][hour].length;
      }


      if(tables == 0) {
        gradient_colors = gradient_colors + ', #78e08f ' + procent + '%';
      } else if(tables == 1) {
        gradient_colors = gradient_colors + ', yellow ' + procent + '%';
      } else if (tables == 2) {
        gradient_colors = gradient_colors + ', orange ' + procent + '%';
      } else {
        gradient_colors = gradient_colors + ', red ' + procent + '%';
      }

      console.log('gradient_colors', gradient_colors);

      console.log('procent', procent);

      procent = procent + column;

    }
    // console.clear();
    // console.log('gradient-color', gradient_colors);

    let gradient = 'linear-gradient(to right' + gradient_colors + ')';
    slider.style.backgroundImage = gradient;

    //end - color slider
    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(
        !allAvailable
              &&
              thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) 
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

  }

      

  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);

    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);


    // ADD
    thisBooking.dom.DatePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);

    thisBooking.dom.HourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper); 


    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    thisBooking.dom.bookButton = thisBooking.dom.wrapper.querySelector(select.booking.form);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    // ADD
    thisBooking.datePicker = new DatePicker(thisBooking.dom.DatePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.HourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
  }
}



export default Booking;