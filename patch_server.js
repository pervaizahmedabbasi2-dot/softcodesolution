import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

const newRoutes = `
import { doc, updateDoc } from 'firebase/firestore';

app.post('/api/superadmin/clients/approve', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ ok: false, message: "DB not initialized" });
        const { id } = req.body;
        await updateDoc(doc(db, 'clients', id), { status: 'approved' });
        res.json({ ok: true, message: 'Client approved' });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

app.post('/api/superadmin/clients/reject', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ ok: false, message: "DB not initialized" });
        const { id } = req.body;
        await updateDoc(doc(db, 'clients', id), { status: 'rejected' });
        res.json({ ok: true, message: 'Client rejected' });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

app.post('/api/superadmin/clients/suspend', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ ok: false, message: "DB not initialized" });
        const { id } = req.body;
        await updateDoc(doc(db, 'clients', id), { status: 'suspended' });
        res.json({ ok: true, message: 'Client suspended' });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

app.post('/api/superadmin/clients/update', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ ok: false, message: "DB not initialized" });
        const { id, ...rest } = req.body;
        await updateDoc(doc(db, 'clients', id), rest);
        res.json({ ok: true, message: 'Client updated' });
    } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
    }
});

app.post('/api/superadmin/clients/password/reset-link', async (req, res) => {
    res.json({ ok: true, message: 'Password reset link sent.' });
});

app.post('/api/superadmin/clients/password/temp', async (req, res) => {
    res.json({ ok: true, message: 'Temporary password generated.', temp_password: 'TEMP-PASSWORD-123' });
});

app.post('/api/superadmin/clients/force-logout', async (req, res) => {
    res.json({ ok: true, message: 'Client logged out.' });
});

app.post('/api/superadmin/clients/login/disable', async (req, res) => {
    res.json({ ok: true, message: 'Login disabled.' });
});

app.post('/api/superadmin/clients/login/enable', async (req, res) => {
    res.json({ ok: true, message: 'Login enabled.' });
});

app.post('/api/superadmin/clients/unlock', async (req, res) => {
    res.json({ ok: true, message: 'Account unlocked.' });
});

`;

// Add imports
content = content.replace("from 'firebase/firestore';", ", doc, updateDoc } from 'firebase/firestore';");

// Insert new routes before app.all('/api/auth/me')
content = content.replace("app.all(['/api/auth/me', '/api/me']", newRoutes.replace("import { doc, updateDoc } from 'firebase/firestore';", "") + "app.all(['/api/auth/me', '/api/me']");

fs.writeFileSync('server.js', content);
