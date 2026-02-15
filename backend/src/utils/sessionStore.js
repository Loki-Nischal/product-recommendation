const activeAdminSessions = new Map(); // adminId -> { token, expiry }

export function setAdminSession(adminId, token, expiryTs) {
    try {
        activeAdminSessions.set(String(adminId), { token, expiry: Number(expiryTs) });
    } catch (e) {
        // ignore
    }
}

export function clearAdminSession(adminId) {
    try {
        activeAdminSessions.delete(String(adminId));
    } catch (e) {
        // ignore
    }
}

export function hasActiveAdminSession() {
    // cleanup expired
    const now = Date.now();
    for (const [id, rec] of activeAdminSessions.entries()) {
        if (!rec || !rec.expiry || rec.expiry <= now) activeAdminSessions.delete(id);
    }
    return activeAdminSessions.size > 0;
}

export default { setAdminSession, clearAdminSession, hasActiveAdminSession };
