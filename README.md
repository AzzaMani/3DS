# 3DS

# SIEM Dashboard Viewer

This project is a **SIEM Dashboard Viewer** that integrates event updates with a database of historical events. It consists of a frontend to visualize events and a backend that processes, stores, and serves these events.

---
## Setup Instructions

### 1. Database Setup

*** Start MySQL Server and build the database:  *** 
```bash
sudo service mysql start
mysql -u root -p 
SOURCE init.sql;
``` 
- if the source didn't work you can copy the file init.sql into your mysql.

### 2. Backend setup : 
```bash
npm install
node main.js
``` 
