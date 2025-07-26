# Docker Compose Setup for Ionic React Government Billing Solution

This project includes Docker Compose configuration to run the Ionic React frontend in both development and production environments.

## Prerequisites

- Docker
- Docker Compose

## Available Environments

### Development Environment

**Option 1: Alpine-based (smaller image)**

```bash
# Start development environment
docker-compose --profile dev up

# Or run in detached mode
docker-compose --profile dev up -d
```

**Option 2: Full Node.js (more stable for complex builds)**

```bash
# Start development environment with full Node.js image
docker-compose --profile dev-full up

# Or run in detached mode
docker-compose --profile dev-full up -d
```

Access the application at http://localhost:5173

### Production Environment

**Option 1: Alpine-based (smaller image)**

```bash
# Start production environment
docker-compose --profile prod up

# Or run in detached mode
docker-compose --profile prod up -d
```

**Option 2: Full Node.js (more stable for complex builds)**

```bash
# Start production environment with full Node.js image
docker-compose --profile prod-full up

# Or run in detached mode
docker-compose --profile prod-full up -d
```

Access the application at http://localhost:80

### Build Only

Just build the application without running it:

```bash
# Build the application
docker-compose --profile build up

# The built files will be available in the ./dist directory
```

## Services

- **ionic-dev**: Development server with Alpine Node.js image
- **ionic-dev-full**: Development server with full Node.js image (recommended for complex builds)
- **ionic-prod**: Production server with Alpine-based build
- **ionic-prod-full**: Production server with full Node.js build (recommended for complex builds)
- **ionic-build**: Build-only service for CI/CD pipelines

## Dockerfiles

- **Dockerfile**: Alpine-based multi-stage build (smaller but may have build issues with native dependencies)
- **Dockerfile.full**: Full Node.js-based build (larger but more compatible with native dependencies)

## Ports

- Development: `5173`
- Production: `80`

## Docker Configuration

Both setups use multi-stage Dockerfiles:

1. **Development stage**: Node.js with Vite dev server
2. **Build stage**: Compiles TypeScript and builds the application
3. **Production stage**: Nginx serving the built static files

## Environment Variables

You can customize the build by setting environment variables in a `.env` file:

```env
NODE_ENV=development
VITE_API_URL=your_api_url
VITE_APP_NAME=Your App Name
JWT_SECRET=your-secret-key
```

**Important:** Create a `.env` file from the example:

```bash
cp .env.example .env
```

### Environment Variable Loading

The Docker Compose configuration includes `env_file: .env` directive to automatically load environment variables from your `.env` file into the containers.

## Stopping Services

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers, networks, and volumes
docker-compose down -v
```

## Troubleshooting

### Build Errors with Native Dependencies

If you encounter Python/gyp errors during build:

1. **Use the full Node.js image**: Try the `-full` profiles which use the complete Node.js image instead of Alpine
2. **Clear Docker cache**: Run `docker system prune -a` to clear build cache
3. **Check package compatibility**: Some packages may not be compatible with Alpine Linux

### Common Issues

- **Permission issues**: Ensure your user has Docker permissions
- **Hot reload not working**: Verify that file watching is enabled in your Docker environment
- **Port conflicts**: Make sure ports 5173 (dev) and 80 (prod) are not already in use
- **Memory issues**: Increase Docker memory limits if builds fail due to insufficient resources
- **Environment variables not loading**:
  - Ensure `.env` file exists in the project root (copy from `.env.example`)
  - Check file permissions: `chmod 644 .env`
  - Verify `.env` file format (no quotes around values for Docker Compose)
  - Restart containers after `.env` changes: `docker-compose down && docker-compose --profile [your-profile] up`

### Checking Logs

```bash
# View logs for a specific service
docker-compose logs [service-name]

# Follow logs in real-time
docker-compose logs -f [service-name]

# View build logs
docker-compose build [service-name]
```

### Environment Variables Troubleshooting

If your `.env` file is not being picked up in Ubuntu:

1. **Create .env file**: Copy from the example template

   ```bash
   cp .env.example .env
   ```

2. **Check file permissions**: Ensure Docker can read the file

   ```bash
   chmod 644 .env
   ls -la .env
   ```

3. **Verify file location**: The `.env` file must be in the same directory as `docker-compose.yml`

   ```bash
   pwd
   ls -la | grep -E "(docker-compose|\.env)"
   ```

4. **Check environment variables inside container**:

   ```bash
   # Access running container
   docker exec -it ionic-govt-billing-dev-full bash

   # Check environment variables
   env | grep VITE
   echo $VITE_API_URL
   ```

5. **Restart after changes**: Always restart containers after modifying `.env`

   ```bash
   docker-compose down
   docker-compose --profile dev-full up
   ```

6. **Debug with explicit environment**: Test with inline environment variables
   ```bash
   VITE_API_URL=http://test.com docker-compose --profile dev-full up
   ```

### Recommended Approach

For most users, especially those encountering build issues, we recommend using the `-full` profiles:

```bash
# Development
docker-compose --profile dev-full up

# Production
docker-compose --profile prod-full up
```
