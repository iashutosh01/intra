# Intra - Project Details

## Project
Name: Intra - Personal Loan Ledger
Frontend: React + Vite + TypeScript
Backend: Node.js + Express + TypeScript
Database: Google Sheets API
Repository: Private

---

## Stable Releases

### v1.0
Status: Stable
Tag: v1.0

Description:
- Complete Loan Management System
- Dashboard
- Loan CRUD
- Payment Management
- History
- Analytics
- Google Sheets integration
- Interest calculation
- Dark mode
- Responsive UI

Commit:
<Update after tagging>

Date:
<DD-MM-YYYY>

---

## Branch Strategy

main
- Always stable
- Production branch

update-1
- Development for next release (v1.1)

Future:
update-2
update-3
...

---

## Release History

| Version | Date | Description | Commit |
|----------|------|-------------|--------|
| v1.0 | | Initial Stable Release | |

---

## Production

Frontend:
Vercel

Backend:
Render

Database:
Google Sheets

---

## Environment Variables

Client
- VITE_API_URL

Server
- PORT
- CLIENT_ORIGIN
- GOOGLE_SHEET_ID
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_PRIVATE_KEY
- CACHE_TTL_MS

Do NOT commit:
- .env
- Service Account JSON
- API Keys

---

## Future Versions

### v1.1
- UI improvements
- Bug fixes
- Better validation

### v1.2
- Reports
- Export Excel/PDF

### v2.0
- AI insights
- Notifications
- Multi-user support

---

## Git Workflow

main
    │
    ├── Tag v1.0
    │
    ├── update-1
    │       ↓
    │   Development
    │
    └── Merge → main
             ↓
          Tag v1.1

Repeat for future releases.

---

## Important Commands

Create feature branch

git checkout main
git pull origin main
git checkout -b update-1

Commit

git add .
git commit -m "Description"

Push

git push -u origin update-1

Merge

git checkout main
git merge update-1
git push origin main

Tag

git tag -a v1.1 -m "Release message"
git push origin v1.1

---

Notes

- Never develop directly on main.
- Tag every stable release.
- Commit frequently with meaningful messages.
- Never commit .env or service account JSON.
- Always verify production before tagging.