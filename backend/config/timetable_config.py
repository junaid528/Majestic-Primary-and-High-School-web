# Centralized Majestic School Timetable & Schedule Configuration (Python Version)

OFFICIAL_TIMETABLE = {
    "monday_to_thursday": [
        { "period": "Assembly", "name": "Assembly Break", "start_time": "09:45 AM", "end_time": "10:00 AM", "flag": "assembly" },
        { "period": "Period 1", "name": "Period 1", "start_time": "10:00 AM", "end_time": "10:40 AM", "flag": "class" },
        { "period": "Period 2", "name": "Period 2", "start_time": "10:40 AM", "end_time": "11:20 AM", "flag": "class" },
        { "period": "Period 3", "name": "Period 3", "start_time": "11:20 AM", "end_time": "12:00 PM", "flag": "class" },
        { "period": "Period 4", "name": "Period 4", "start_time": "12:00 PM", "end_time": "12:40 PM", "flag": "class" },
        { "period": "Lunch Break", "name": "Lunch Break", "start_time": "12:40 PM", "end_time": "01:20 PM", "flag": "break" },
        { "period": "Period 5", "name": "Period 5", "start_time": "01:20 PM", "end_time": "02:00 PM", "flag": "class" },
        { "period": "Period 6", "name": "Period 6", "start_time": "02:00 PM", "end_time": "02:40 PM", "flag": "class" },
        { "period": "Period 7", "name": "Period 7", "start_time": "02:40 PM", "end_time": "03:20 PM", "flag": "class" },
        { "period": "Period 8", "name": "Period 8", "start_time": "03:20 PM", "end_time": "04:00 PM", "flag": "class" }
    ],
    "friday": [
        { "period": "Period 1", "name": "Period 1", "start_time": "08:45 AM", "end_time": "09:00 AM", "flag": "class" },
        { "period": "Period 2", "name": "Period 2", "start_time": "09:00 AM", "end_time": "09:40 AM", "flag": "class" },
        { "period": "Period 3", "name": "Period 3", "start_time": "09:40 AM", "end_time": "10:20 AM", "flag": "class" },
        { "period": "Period 4", "name": "Period 4", "start_time": "10:20 AM", "end_time": "11:00 AM", "flag": "class" },
        { "period": "Period 5", "name": "Period 5", "start_time": "11:00 AM", "end_time": "11:40 AM", "flag": "class" },
        { "period": "Period 6", "name": "Period 6", "start_time": "11:40 AM", "end_time": "12:20 PM", "flag": "class" }
    ],
    "saturday": [
        { "period": "Assembly", "name": "Assembly Only", "start_time": "09:00 AM", "end_time": "10:00 AM", "flag": "assembly" }
    ],
    "supported_classes": [
        "Pre-KG", "LKG", "UKG",
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9"
    ]
}
