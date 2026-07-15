package main

// web_api.go was previously used for a legacy Wails registration bridge.
//
// Duplicate legacy path removed:
// - legacy services import
// - App.ProcessRegistration
// - bcrypt/tenants-table flow
//
// Active registration path now remains:
// POST /api/register
// implemented in web_register_api.go with Argon2id + current web API flow.
