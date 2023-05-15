/*!
FullCalendar Core v6.0.0
Docs & License: https://fullcalendar.io
(c) 2022 Adam Shaw
*/
(function (internal_js) {
    'use strict';

    var locale = {
        code: 'is',
        week: {
            dow: 1,
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
        buttonText: {
            prev: 'Fyrri',
            next: 'Næsti',
            today: 'Í dag',
            month: 'Mánuður',
            week: 'Vika',
            day: 'Dagur',
            list: 'Dagskrá',
        },
        weekText: 'Vika',
        allDayText: 'Allan daginn',
        moreLinkText: 'meira',
        noEventsText: 'Engir viðburðir til að sýna',
    };

    internal_js.globalLocales.push(locale);

})(FullCalendar.Internal);