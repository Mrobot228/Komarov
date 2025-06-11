# Web Analytics System

## Overview
The Web Analytics System is a web application designed to track and display website statistics, similar to Google Analytics. It provides an admin panel for managing websites and viewing detailed statistics, including visitor counts and category-specific data.

## Features
- **CRUD Operations**: Create, read, update, and delete website entries.
- **Statistics Display**: View website statistics sorted by visitor count and name.
- **Category Statistics**: Filter statistics based on specific categories.
- **Search Functionality**: Search website statistics by domain name.
- **Admin Panel**: Manage users and view overall statistics through an intuitive dashboard.

## Project Structure
```
web-analytics-system
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── adminController.ts
│   │   ├── statsController.ts
│   │   └── websiteController.ts
│   ├── models
│   │   ├── category.ts
│   │   ├── statistic.ts
│   │   └── website.ts
│   ├── routes
│   │   ├── adminRoutes.ts
│   │   ├── statsRoutes.ts
│   │   └── websiteRoutes.ts
│   ├── services
│   │   ├── adminService.ts
│   │   ├── statsService.ts
│   │   └── websiteService.ts
│   ├── types
│   │   └── index.ts
│   ├── views
│   │   ├── admin
│   │   │   └── dashboard.ejs
│   │   ├── stats
│   │   │   └── index.ejs
│   │   └── websites
│   │       └── list.ejs
│   └── utils
│       └── db.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd web-analytics-system
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up the environment variables in the `.env` file, particularly the `DATABASE_URL`.

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Access the application in your web browser at `http://localhost:3000`.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.