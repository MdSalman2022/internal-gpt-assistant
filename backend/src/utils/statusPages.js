/**
 * Status Page Templates
 * HTML templates for the landing page and health check endpoints
 */

export function getLandingPageHtml(env) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KnowledgeAI API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e2e8f0;
        }
        .container { text-align: center; padding: 3rem; }
        .logo {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 20px;
            margin: 0 auto 2rem;
            display: flex; align-items: center; justify-content: center;
            font-size: 2.5rem;
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
        }
        h1 {
            font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #10b981, #34d399);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .subtitle { color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem; }
        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white; padding: 1rem 2rem; border-radius: 12px;
            text-decoration: none; font-weight: 600;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4); }
        .footer { margin-top: 2rem; color: #475569; font-size: 0.85rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🧠</div>
        <h1>KnowledgeAI API</h1>
        <p class="subtitle">Internal Knowledge Assistant Backend</p>
        <a href="/health" class="btn">View System Health →</a>
        <p class="footer">Version 1.0.0 • ${env}</p>
    </div>
</body>
</html>`;
}

export function getHealthPageHtml(uptime, env, memUsed, memTotal, timestamp) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check - KnowledgeAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            color: #e2e8f0;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px; padding: 2.5rem; min-width: 400px;
        }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 2rem; }
        .status-icon {
            width: 48px; height: 48px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem;
        }
        h1 { font-size: 1.5rem; font-weight: 600; }
        .status-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(16, 185, 129, 0.15); color: #10b981;
            padding: 6px 12px; border-radius: 20px;
            font-size: 0.85rem; font-weight: 500; margin-top: 4px;
        }
        .status-badge::before {
            content: ''; width: 8px; height: 8px;
            background: #10b981; border-radius: 50%;
        }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
        .metric {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px; padding: 1rem;
        }
        .metric-label {
            font-size: 0.75rem; text-transform: uppercase;
            letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;
        }
        .metric-value { font-size: 1.25rem; font-weight: 600; color: #f1f5f9; }
        .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; }
        .timestamp { color: #475569; font-size: 0.8rem; }
        .back { color: #64748b; text-decoration: none; font-size: 0.85rem; }
        .back:hover { color: #10b981; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="status-icon">✓</div>
            <div>
                <h1>System Health</h1>
                <div class="status-badge">Operational</div>
            </div>
        </div>
        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Uptime</div>
                <div class="metric-value">${uptime}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Environment</div>
                <div class="metric-value">${env}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Memory Used</div>
                <div class="metric-value">${memUsed} MB</div>
            </div>
            <div class="metric">
                <div class="metric-label">Memory Total</div>
                <div class="metric-value">${memTotal} MB</div>
            </div>
        </div>
        <div class="footer">
            <a href="/" class="back">← Back</a>
            <span class="timestamp">${timestamp}</span>
        </div>
    </div>
</body>
</html>`;
}
