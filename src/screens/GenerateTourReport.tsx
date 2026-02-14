export const generateTourReportHTML = (
  tourTitle: string,
  stops: Array<{
    title: string;
    description?: string;
    stop_order: number;
  }>
): string => {
  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tourTitle} - Informe de Paradas</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px 30px;
      background: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    h1 {
      color: #2D5A4C;
      font-size: 32px;
      margin: 0 0 10px 0;
    }
    .subtitle {
      color: #636E72;
      font-size: 18px;
      margin: 0;
    }
    h2 {
      color: #5CC2A3;
      border-bottom: 3px solid #5CC2A3;
      padding-bottom: 10px;
      margin: 40px 0 20px 0;
      font-size: 24px;
    }
    .stop-list {
      margin: 0;
      padding: 0;
    }
    .stop-item {
      margin: 24px 0;
      padding: 20px;
      background: #F2F9F7;
      border-radius: 12px;
      border-left: 6px solid #5CC2A3;
      position: relative;
    }
    .stop-number {
      position: absolute;
      top: -12px;
      left: -12px;
      background: #5CC2A3;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .stop-title {
      font-size: 20px;
      color: #2D5A4C;
      margin: 0 0 10px 0;
    }
    .stop-desc {
      margin: 0;
      color: #555;
      font-size: 15px;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      color: #888;
      font-size: 14px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${tourTitle}</h1>
      <p class="subtitle">Informe de paradas del tour</p>
    </div>

    <h2>Paradas registradas (${stops.length})</h2>

    <div class="stop-list">
  `;

  if (stops.length === 0) {
    html += `
      <p style="text-align:center; color:#888; font-style:italic;">
        No hay paradas registradas en este tour.
      </p>
    `;
  } else {
    stops.forEach((stop, index) => {
      html += `
        <div class="stop-item">
          <div class="stop-number">${stop.stop_order || index + 1}</div>
          <h3 class="stop-title">${stop.title}</h3>
          <p class="stop-desc">${stop.description?.trim() || 'Sin descripción disponible.'}</p>
        </div>
      `;
    });
  }

  html += `
    </div>

    <div class="footer">
      Generado desde la app el ${new Date().toLocaleDateString('es-ES')} • ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>
</body>
</html>
  `;

  return html;
};