CREATE DATABASE events_db;
USE events_db;

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(255),
    type_event VARCHAR(50),
    event_id VARCHAR(255),
    timestamp DATETIME,
    event_type VARCHAR(50),
    service_event_name VARCHAR(255),
    user VARCHAR(255), 
    eventClass VARCHAR(50), 
    relative_path VARCHAR(255), 
    title VARCHAR(255) 
);
