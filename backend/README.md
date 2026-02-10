# QUICKAID Backend Setup

## Option 1: Using Docker (Recommended)
Since you don't have PostgreSQL installed locally, using Docker is the easiest way to get started.

### Prerequisites
1.  **Install Docker Desktop**: Download and install from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).
2.  Ensure Docker is running (you should see the whale icon in your system tray).

### Steps
1.  Open a terminal in the `backend` directory.
2.  Start the database and cache services:
    ```bash
    docker-compose up -d
    ```
3.  Run database migrations:
    ```bash
    npm run migrate
    ```
4.  Seed the database with initial data:
    ```bash
    npm run seed
    ```
5.  Start the backend server:
    ```bash
    npm run dev
    ```

## Option 2: Local Installation (Manual)
If you cannot use Docker, you must install PostgreSQL and Redis manually.

1.  Current Configuration in `.env`:
    -   Host: `localhost`
    -   Port: `5432`
    -   User: `postgres`
    -   Password: `postgres`
    -   Database: `quickaid`

2.  After installing PostgreSQL, make sure to create a database named `quickaid` and update the `.env` file with your credentials.
