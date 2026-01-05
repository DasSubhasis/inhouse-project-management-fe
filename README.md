# Project Management System

A modern, mobile-responsive Angular application for managing projects, built with TailwindCSS and featuring email-based OTP authentication.

## Features

- ✨ **Angular 19** - Latest stable version of Angular
- 🎨 **TailwindCSS** - Utility-first CSS framework for beautiful UI/UX
- 📱 **Mobile Responsive** - Fully responsive design that works on all devices
- 🔐 **OTP Authentication** - Secure email-based OTP login system
- 🎯 **Route Guards** - Protected routes with authentication guards
- 📊 **Dashboard** - Beautiful dashboard with stats and recent projects
- 🗂️ **Sidebar Navigation** - Collapsible sidebar with smooth transitions
- 🌐 **Lazy Loading** - Optimized bundle sizes with lazy-loaded routes

## Demo Credentials

The application uses mock authentication with sample JSON data. Use these credentials to log in:

### Admin User
- **Email:** `admin@example.com`
- **OTP:** `123456`

### Regular User
- **Email:** `user@example.com`
- **OTP:** `123456`

### Manager User
- **Email:** `manager@example.com`
- **OTP:** `123456`

**Note:** The OTP will be displayed in the browser console when you request it.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
