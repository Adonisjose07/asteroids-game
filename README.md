# 🚀 Asteroids Game

A classic Asteroids arcade game built with vanilla JavaScript and HTML5 Canvas.

![Game Preview](https://img.shields.io/badge/Status-Ready-brightgreen)

## 🎮 Features

- **Classic Gameplay** - Destroy asteroids, avoid collisions, survive!
- **Visual Effects** - Particle explosions, starfield parallax, screen shake
- **Retro Style** - Clean vector graphics with glow effects

## 🕹️ Controls

| Key | Action |
|-----|--------|
| ⬆️ Arrow Up | Thrust |
| ⬅️ Arrow Left | Rotate Left |
| ➡️ Arrow Right | Rotate Right |
| Space | Shoot |
| R | Restart (Game Over) |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t asteroids-game .
docker run -p 8080:80 asteroids-game
```

Access the game at **http://localhost:8080**

## 📁 Project Structure

```
├── src/
│   ├── main.js      # Game logic
│   └── style.css    # Styles
├── index.html       # Entry point
├── Dockerfile       # Production container
├── docker-compose.yml
└── nginx.conf       # Web server config
```

## 📄 License

MIT
