# Quick Reference Guide

**Velocity Banking - Make Commands Cheat Sheet**

---

## 🚀 Most Common Commands

```bash
make help              # Show all commands
make test              # Run all tests
make dev               # Start development environment
make logs              # View service logs
make restart           # Restart services
```

---

## 🧪 Testing

| Command | Description | Duration |
|---------|-------------|----------|
| `make test` | All tests (quick + comprehensive) | ~15s |
| `make test-quick` | Quick validation (3 tests) | ~5s |
| `make test-comprehensive` | Full suite (25 tests) | ~10s |
| `make test-watch` | Continuous testing | ∞ |

---

## 🏗️ Build & Deploy

| Command | Description |
|---------|-------------|
| `make build` | Build all containers |
| `make build-backend` | Build backend only |
| `make build-frontend` | Build frontend only |

---

## 💻 Development

| Command | Description |
|---------|-------------|
| `make dev` | Build + start + show URLs |
| `make up` | Start services |
| `make down` | Stop services |
| `make restart` | Restart all |
| `make clean` | Remove all ⚠️ |

---

## 📊 Logs & Debug

| Command | Description |
|---------|-------------|
| `make logs` | All service logs |
| `make logs-backend` | Backend only |
| `make logs-frontend` | Frontend only |
| `make shell-backend` | Backend shell |
| `make shell-frontend` | Frontend shell |

---

## 🗄️ Database

| Command | Description |
|---------|-------------|
| `make db-shell` | Open SQLite shell |
| `make db-backup` | Create backup |
| `make db-reset` | Delete all data ⚠️ |

---

## ✅ Quality

| Command | Description |
|---------|-------------|
| `make validate` | All checks (tests + lint) |
| `make lint` | Run linters |
| `make format` | Format code |

---

## 🔄 CI/CD

| Command | Description |
|---------|-------------|
| `make ci` | Full CI pipeline |
| `make pre-commit` | Pre-commit checks |
| `make pre-push` | Pre-push validation |

---

## 🏥 Health

| Command | Description |
|---------|-------------|
| `make health` | Check service health |
| `make status` | Show container status |

---

## 📖 Documentation

| Command | Description |
|---------|-------------|
| `make docs-test` | View test summary |
| `make docs-coverage` | View coverage report |

---

## 🔥 Common Workflows

### Start Development
```bash
make dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Run Tests
```bash
make test
# ✅ All tests completed successfully!
```

### Debug Issues
```bash
make logs              # View logs
make shell-backend     # Open shell
make health            # Check health
```

### Clean Slate
```bash
make clean             # Remove all
make dev               # Rebuild & start
```

---

## ⚠️ Warnings

**Destructive Commands** (require confirmation):
- `make clean` - Removes all containers and volumes
- `make db-reset` - Deletes all database data

---

## 🆘 Troubleshooting

**Tests failing?**
```bash
make restart && make test
```

**Containers not starting?**
```bash
make clean && make dev
```

**Database issues?**
```bash
make db-backup && make db-reset && make restart
```

---

## 📝 Quick Tips

1. Always run `make test` before committing
2. Use `make test-quick` during development
3. Use `make logs` to debug issues
4. Use `make clean` to start fresh
5. Use `make help` to see all commands

---

## 🔗 Useful Links

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Full Docs: [MAKEFILE_DOCUMENTATION.md](MAKEFILE_DOCUMENTATION.md)
