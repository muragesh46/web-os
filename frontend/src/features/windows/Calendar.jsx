import { useState } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@style/calendar.css';
import WindowControls from '@components/common/WindowControl.jsx';
import WindowWrapper from '@hoc/WindowWrapper.jsx';

function CalendarWindow() {
    const [value, onChange] = useState(new Date());

    const formatSelectedDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <div id="window-header" className="flex items-center justify-between">
                <WindowControls target="calendar" />
                <h2 className="flex-1 text-center">Calendar</h2>
                <div className="w-[52px]"></div>
            </div>
            <div className="calendar-content">
                <div className="calendar-selected-date">
                    <p className="text-sm font-medium text-gray-700">{formatSelectedDate(value)}</p>
                </div>
                <ReactCalendar
                    onChange={onChange}
                    value={value}
                    showNeighboringMonth={true}
                    showWeekNumbers={false}
                    locale="en-US"
                    prev2Label={null}
                    next2Label={null}
                />
            </div>
        </>
    );
}

const CalendarWindowWrapped = WindowWrapper(CalendarWindow, 'calendar');
export default CalendarWindowWrapped;
