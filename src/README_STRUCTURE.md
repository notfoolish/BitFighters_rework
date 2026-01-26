# BitFighters React Structure (Scaffold Only)

This repo contains a structure-only scaffold to migrate the vanilla HTML/CSS/JS/PHP app to React. No logic or UI code is implemented yet.

Key ideas:
- Pages map 1:1 to previous HTML files.
- Reusable components live under `components/`.
- API access is abstracted in `services/`.
- App state uses `context/` with hooks in `hooks/`.
- Styles use CSS Modules per page/component plus global tokens.

Mapping from old files to new pages:
- index.html → src/pages/Home/Home.jsx
- login.html → src/pages/Auth/Login/Login.jsx
- register.html → src/pages/Auth/Register/Register.jsx
- change-password.html → src/pages/Auth/ChangePassword/ChangePassword.jsx
- admin.html → src/pages/Admin/Admin.jsx
- friends.html (+ friends.js) → src/pages/Friends/Friends.jsx
- leaderboard.html → src/pages/Leaderboard/Leaderboard.jsx
- profile.html (+ profile.js) → src/pages/Profile/Profile.jsx
- view-profile.html → src/pages/Profile/ViewProfile.jsx
- patchnotes.js → src/pages/PatchNotes/PatchNotes.jsx
- stats/ (legacy) → src/pages/Stats/Stats.jsx

Suggested next steps:
1) Add React Router to `routes/AppRoutes.jsx` and wire to `App.jsx`.
2) Implement `AuthContext` and guards (`ProtectedRoute`, `AdminRoute`).
3) Flesh out forms and services (login/register/change password).
4) Move images into `src/assets/images/` and import as needed.
5) Port CSS into the matching `*.module.css` files or use a design system.
